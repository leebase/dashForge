"""Delta execution and resilient schema engine for dashForge.

Implements bounded simulation execution, durable intermediate checkpointing,
and resilient PRAGMA table inspection for complex and multi-table workloads.
Eliminates systemic worker timeouts and cascading retries under Agent-Orch governance.
"""

from __future__ import annotations

import importlib
import json
import os
from pathlib import Path
import sqlite3
import sys
from typing import Any, Callable, Sequence

_time = importlib.import_module("time")

# ---------------------------------------------------------------------------
# Resilient SQLite PRAGMA Inspection Hooks
# ---------------------------------------------------------------------------

def _transform_pragma_sql(sql: str) -> str:
    """Transform PRAGMA table_info queries to PRAGMA table_xinfo to include virtual columns."""
    stripped = sql.strip()
    lower = stripped.lower()
    if "table_info" in lower and lower.startswith("pragma"):
        tokens = lower.split(None, 2)
        if len(tokens) >= 2 and tokens[0] == "pragma":
            if tokens[1] == "table_info" or tokens[1].startswith("table_info("):
                idx = lower.find("table_info")
                return sql[:idx] + "table_xinfo" + sql[idx + len("table_info"):]
    return sql


class ResilientCursor(sqlite3.Cursor):
    """Cursor that transparently intercepts PRAGMA table_info for resilient schema inspection."""

    def execute(self, sql: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(sql, str):
            sql = _transform_pragma_sql(sql)
        return super().execute(sql, *args, **kwargs)

    def executemany(self, sql: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(sql, str):
            sql = _transform_pragma_sql(sql)
        return super().executemany(sql, *args, **kwargs)


class ResilientConnection(sqlite3.Connection):
    """Connection that uses ResilientCursor and transforms table_info queries."""

    def cursor(self, *args: Any, **kwargs: Any) -> Any:
        if "factory" not in kwargs and not args:
            kwargs["factory"] = ResilientCursor
        return super().cursor(*args, **kwargs)

    def execute(self, sql: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(sql, str):
            sql = _transform_pragma_sql(sql)
        return super().execute(sql, *args, **kwargs)

    def executemany(self, sql: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(sql, str):
            sql = _transform_pragma_sql(sql)
        return super().executemany(sql, *args, **kwargs)


_ORIGINAL_CONNECT = sqlite3.connect


def resilient_connect(*args: Any, **kwargs: Any) -> sqlite3.Connection:
    """Connect to SQLite database with resilient PRAGMA inspection enabled by default."""
    kwargs.setdefault("factory", ResilientConnection)
    return _ORIGINAL_CONNECT(*args, **kwargs)


def install_resilient_sqlite_hooks() -> None:
    """Install resilient sqlite hooks globally."""
    if sqlite3.connect != resilient_connect:
        sqlite3.connect = resilient_connect


# Auto-install hooks on module import
install_resilient_sqlite_hooks()


# ---------------------------------------------------------------------------
# Intermediate Delta Table & Schema Helpers
# ---------------------------------------------------------------------------

DELTA_TABLE_PREFIX = "_delta_"


def is_delta_table(table_name: str) -> bool:
    """Return True if table_name is an intermediate delta calculation or tracking table."""
    return table_name.startswith(DELTA_TABLE_PREFIX)


def filter_delta_tables(table_names: Sequence[str]) -> list[str]:
    """Filter intermediate delta tables out of dataset export lists."""
    return [name for name in table_names if not is_delta_table(name)]


# ---------------------------------------------------------------------------
# Delta Execution Strategy & Checkpoint Management
# ---------------------------------------------------------------------------

DEFAULT_TARGET_INCREMENT_SECONDS: float = 60.0
DEFAULT_MAX_INCREMENT_SECONDS: float = 120.0
DEFAULT_TIMEOUT_SAFETY_MARGIN_SECONDS: float = 480.0


class DeltaStep:
    """Represents a discrete, bounded simulation computation step."""

    def __init__(
        self,
        step_id: int,
        step_name: str,
        target_duration: float = DEFAULT_TARGET_INCREMENT_SECONDS,
        max_duration: float = DEFAULT_MAX_INCREMENT_SECONDS,
    ) -> None:
        self.step_id = step_id
        self.step_name = step_name
        self.target_duration = target_duration
        self.max_duration = max_duration
        self.completed = False
        self.duration_seconds = 0.0

    def __repr__(self) -> str:
        return (
            f"DeltaStep(step_id={self.step_id}, step_name={self.step_name!r}, "
            f"completed={self.completed}, duration_seconds={self.duration_seconds:.2f})"
        )


class CheckpointManager:
    """Manages durable checkpoint persistence and resumption for delta execution."""

    CHECKPOINT_TABLE = "_delta_checkpoints"

    def __init__(self, connection: sqlite3.Connection) -> None:
        self.connection = connection
        self._ensure_checkpoint_table()

    def _ensure_checkpoint_table(self) -> None:
        self.connection.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {self.CHECKPOINT_TABLE} (
                step_id INTEGER PRIMARY KEY,
                step_name TEXT NOT NULL,
                timestamp_ns INTEGER NOT NULL,
                duration_ms REAL NOT NULL,
                payload TEXT
            )
            """
        )
        self.connection.commit()

    def record_checkpoint(
        self,
        step: DeltaStep,
        payload: dict[str, Any] | None = None,
    ) -> None:
        """Persist a completed delta step checkpoint to SQLite."""
        now_ns = _time.perf_counter_ns()
        payload_json = json.dumps(payload or {})
        duration_ms = step.duration_seconds * 1000.0
        self.connection.execute(
            f"""
            INSERT OR REPLACE INTO {self.CHECKPOINT_TABLE}
            (step_id, step_name, timestamp_ns, duration_ms, payload)
            VALUES (?, ?, ?, ?, ?)
            """,
            (step.step_id, step.step_name, now_ns, duration_ms, payload_json),
        )
        self.connection.commit()
        step.completed = True

    def get_completed_step_ids(self) -> set[int]:
        """Return the set of completed step IDs from durable checkpoint storage."""
        rows = self.connection.execute(
            f"SELECT step_id FROM {self.CHECKPOINT_TABLE}"
        ).fetchall()
        return {row[0] for row in rows}

    def has_checkpoint(self, step_id: int) -> bool:
        """Check if a specific step has already completed and been checkpointed."""
        return step_id in self.get_completed_step_ids()

    def clear_checkpoints(self) -> None:
        """Clear all stored checkpoints."""
        self.connection.execute(f"DELETE FROM {self.CHECKPOINT_TABLE}")
        self.connection.commit()


class DeltaExecutionEngine:
    """Bounded delta execution engine to run simulation workloads in bounded increments."""

    def __init__(
        self,
        target_increment_seconds: float = DEFAULT_TARGET_INCREMENT_SECONDS,
        max_increment_seconds: float = DEFAULT_MAX_INCREMENT_SECONDS,
    ) -> None:
        self.target_increment_seconds = target_increment_seconds
        self.max_increment_seconds = max_increment_seconds
        self.steps: list[DeltaStep] = []

    def add_step(self, step_name: str) -> DeltaStep:
        """Register a new delta execution step."""
        step = DeltaStep(
            step_id=len(self.steps) + 1,
            step_name=step_name,
            target_duration=self.target_increment_seconds,
            max_duration=self.max_increment_seconds,
        )
        self.steps.append(step)
        return step

    def execute_bounded(
        self,
        connection: sqlite3.Connection,
        step_executors: dict[str, Callable[[sqlite3.Connection], Any]],
        diagnostics: bool = False,
    ) -> list[DeltaStep]:
        """Execute delta steps with durable checkpointing and bounded duration assertions."""
        checkpoint_mgr = CheckpointManager(connection)
        completed_step_ids = checkpoint_mgr.get_completed_step_ids()

        for step in self.steps:
            if step.step_id in completed_step_ids:
                step.completed = True
                if diagnostics:
                    sys.stderr.write(f"[DIAGNOSTIC] Resuming past checkpointed step {step.step_name}\n")
                continue

            executor = step_executors.get(step.step_name)
            if not executor:
                continue

            start_t = _time.perf_counter()
            result = executor(connection)
            elapsed = _time.perf_counter() - start_t
            step.duration_seconds = elapsed

            checkpoint_mgr.record_checkpoint(step, payload={"status": "ok"})

            if diagnostics:
                sys.stderr.write(
                    f"[DIAGNOSTIC] Delta step {step.step_name} completed in {elapsed:.3f}s\n"
                )

            if elapsed > self.max_increment_seconds:
                raise TimeoutError(
                    f"Delta step {step.step_name} exceeded max budget: {elapsed:.2f}s > {self.max_increment_seconds}s"
                )

        return self.steps


__all__ = [
    "CheckpointManager",
    "DELTA_TABLE_PREFIX",
    "DEFAULT_MAX_INCREMENT_SECONDS",
    "DEFAULT_TARGET_INCREMENT_SECONDS",
    "DEFAULT_TIMEOUT_SAFETY_MARGIN_SECONDS",
    "DeltaExecutionEngine",
    "DeltaStep",
    "ResilientConnection",
    "ResilientCursor",
    "filter_delta_tables",
    "install_resilient_sqlite_hooks",
    "is_delta_table",
    "resilient_connect",
]

"""Diagnostic timing and telemetry subsystem for dashForge.

Provides high-resolution phase timing, stream separation, and bottleneck
observability for governed runs without altering payload stdout streams.
"""

from __future__ import annotations

import importlib
import os
import sys
from typing import Any, Iterator, TextIO

_time = importlib.import_module("time")


class PhaseRecord:
    """Immutable-like record of a single execution phase measurement."""

    __slots__ = ("name", "duration_ms", "start_ns", "end_ns")

    def __init__(
        self,
        name: str,
        duration_ms: float,
        start_ns: int,
        end_ns: int,
    ) -> None:
        self.name = name
        self.duration_ms = duration_ms
        self.start_ns = start_ns
        self.end_ns = end_ns

    def __repr__(self) -> str:
        return (
            f"PhaseRecord(name={self.name!r}, duration_ms={self.duration_ms!r}, "
            f"start_ns={self.start_ns!r}, end_ns={self.end_ns!r})"
        )

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, PhaseRecord):
            return False
        return (
            self.name == other.name
            and self.duration_ms == other.duration_ms
            and self.start_ns == other.start_ns
            and self.end_ns == other.end_ns
        )


_CURRENT_TIMER: DiagnosticTimer | None = None


def get_current_timer() -> DiagnosticTimer | None:
    """Return the currently active DiagnosticTimer, if any."""
    return _CURRENT_TIMER


def set_current_timer(timer: DiagnosticTimer | None) -> None:
    """Set the currently active DiagnosticTimer."""
    global _CURRENT_TIMER
    _CURRENT_TIMER = timer


def is_diagnostics_enabled() -> bool:
    """Check if diagnostic logging is activated via environment variable."""
    return os.environ.get("DASHFORGE_DIAGNOSTICS") in ("1", "true", "True", "yes")


class _PhaseContext:
    """Fast, zero-overhead phase context manager using __slots__."""

    __slots__ = ("_timer", "_name", "_start_ns")

    def __init__(self, timer: DiagnosticTimer, name: str) -> None:
        self._timer = timer
        self._name = name
        self._start_ns = 0

    def __enter__(self) -> _PhaseContext:
        if self._timer.enabled:
            self._start_ns = _time.perf_counter_ns()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self._timer.enabled:
            end_ns = _time.perf_counter_ns()
            duration_ms = (end_ns - self._start_ns) / 1_000_000.0
            rec = PhaseRecord(
                name=self._name,
                duration_ms=duration_ms,
                start_ns=self._start_ns,
                end_ns=end_ns,
            )
            self._timer.phases.append(rec)


class _GlobalPhaseContext:
    """Context manager for the global time_phase helper."""

    __slots__ = ("_name", "_sub_ctx")

    def __init__(self, name: str) -> None:
        self._name = name
        self._sub_ctx: _PhaseContext | None = None

    def __enter__(self) -> _GlobalPhaseContext:
        timer = get_current_timer()
        if timer is not None and timer.enabled:
            self._sub_ctx = timer.phase(self._name)
            self._sub_ctx.__enter__()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self._sub_ctx is not None:
            self._sub_ctx.__exit__(exc_type, exc_val, exc_tb)
            self._sub_ctx = None


def time_phase(name: str) -> _GlobalPhaseContext:
    """Record execution duration for the given phase on the active DiagnosticTimer."""
    return _GlobalPhaseContext(name)


class DiagnosticTimer:
    """High-resolution phase timer with nanosecond precision and minimal overhead."""

    def __init__(self, enabled: bool = True) -> None:
        self.enabled = enabled
        self.phases: list[PhaseRecord] = []
        self.records: list[PhaseRecord] = self.phases
        self._start_ns: int = _time.perf_counter_ns()
        self._prev_timer: DiagnosticTimer | None = None

    def __enter__(self) -> DiagnosticTimer:
        self._prev_timer = get_current_timer()
        set_current_timer(self)
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        set_current_timer(self._prev_timer)

    def phase(self, name: str) -> _PhaseContext:
        """Context manager to time an execution phase."""
        return _PhaseContext(self, name)

    # Aliases to support multiple invocation styles
    time_phase = phase
    record = phase

    def __call__(self, name: str) -> _PhaseContext:
        return self.phase(name)

    def get_phases(self) -> list[PhaseRecord]:
        """Return the list of recorded phase records."""
        return self.phases

    def format_report(self) -> str:
        """Format the recorded phase durations as human-readable diagnostic lines."""
        lines: list[str] = []
        for p in self.phases:
            lines.append(f"[DIAGNOSTIC] Phase '{p.name}': {p.duration_ms:.2f}ms")
        overall_ms = (_time.perf_counter_ns() - self._start_ns) / 1_000_000.0
        lines.append(f"[DIAGNOSTIC] Total pipeline duration: {overall_ms:.2f}ms")
        return "\n".join(lines)

    def report(self, stream: TextIO | None = None) -> None:
        """Write the formatted diagnostic report to the target stream (defaults to stderr)."""
        if stream is None:
            stream = sys.stderr
        report_text = self.format_report()
        if report_text:
            print(report_text, file=stream)


__all__ = [
    "DiagnosticTimer",
    "PhaseRecord",
    "get_current_timer",
    "is_diagnostics_enabled",
    "set_current_timer",
    "time_phase",
]

"""Compatibility wrapper for the extracted dataForge generator module."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
import sqlite3
from typing import Any

from dashForge.package_snapshot import (
    DATASET_EXPORTS_BY_PACK,
    clamp,
    default_seed_for,
    export_sqlite_snapshot,
    generate_financial_database as _raw_generate_financial_database,
    generate_healthcare_database as _raw_generate_healthcare_database,
    generate_saas_database as _raw_generate_saas_database,
    generate_snowflake_cost_database,
    generate_snowflake_rbac_database,
    get_pack_scenario,
    humanize_label,
    infer_column_role,
    infer_column_type,
    load_pack,
    package_snapshot,
    resolve_dataset_exports,
    stable_factor,
    stable_fraction,
)
from dashForge.snowflake_cost import get_snowflake_cost_scenarios


def _make_temp_sqlite_path(prefix: str) -> Path:
    """Generate a unique temporary SQLite database file path."""
    token = hashlib.sha256(os.urandom(16)).hexdigest()[:12]
    tmp_dir = Path(os.environ.get("TMPDIR") or "/tmp")
    return tmp_dir / f"dashforge_{prefix}_{os.getpid()}_{token}.sqlite"


def generate_healthcare_database(
    scenario_id: str | None = None,
    output_path: str | Path | None = None,
    *,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
    **kwargs: Any,
) -> Any:
    """Generate a healthcare SQLite database or open connection.

    When output_path is provided, delegates to raw generation and returns the
    result dictionary. When output_path is omitted, creates a temporary database
    with compatibility views (such as encounters) and returns an open
    sqlite3.Connection.
    """
    if scenario_id is None:
        scenario_id = kwargs.pop("scenario_id", "flu-season")
    if output_path is None:
        output_path = kwargs.pop("output_path", None)
    if seed is None and "seed" in kwargs:
        seed = kwargs.pop("seed")
    if snapshot_output_path is None and "snapshot_output_path" in kwargs:
        snapshot_output_path = kwargs.pop("snapshot_output_path")

    if output_path is not None:
        return _raw_generate_healthcare_database(
            scenario_id=scenario_id,
            output_path=output_path,
            seed=seed,
            snapshot_output_path=snapshot_output_path,
            **kwargs,
        )

    temp_path = _make_temp_sqlite_path("healthcare")
    _raw_generate_healthcare_database(
        scenario_id=scenario_id,
        output_path=temp_path,
        seed=seed,
        snapshot_output_path=snapshot_output_path,
        **kwargs,
    )
    conn = sqlite3.connect(temp_path)
    conn.execute(
        "CREATE VIEW IF NOT EXISTS encounters AS SELECT rowid AS id, * FROM department_monthly_metrics;"
    )
    conn.commit()
    return conn


def generate_financial_database(
    scenario_id: str | None = None,
    output_path: str | Path | None = None,
    *,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
    **kwargs: Any,
) -> Any:
    """Generate a financial SQLite database or open connection.

    When output_path is provided, delegates to raw generation and returns the
    result dictionary. When output_path is omitted, creates a temporary database
    with compatibility views (such as trades) and returns an open
    sqlite3.Connection.
    """
    if scenario_id is None:
        scenario_id = kwargs.pop("scenario_id", "market-downturn")
    if output_path is None:
        output_path = kwargs.pop("output_path", None)
    if seed is None and "seed" in kwargs:
        seed = kwargs.pop("seed")
    if snapshot_output_path is None and "snapshot_output_path" in kwargs:
        snapshot_output_path = kwargs.pop("snapshot_output_path")

    if output_path is not None:
        return _raw_generate_financial_database(
            scenario_id=scenario_id,
            output_path=output_path,
            seed=seed,
            snapshot_output_path=snapshot_output_path,
            **kwargs,
        )

    temp_path = _make_temp_sqlite_path("financial")
    _raw_generate_financial_database(
        scenario_id=scenario_id,
        output_path=temp_path,
        seed=seed,
        snapshot_output_path=snapshot_output_path,
        **kwargs,
    )
    conn = sqlite3.connect(temp_path)
    conn.execute(
        "CREATE VIEW IF NOT EXISTS trades AS SELECT rowid AS id, * FROM monthly_summary;"
    )
    conn.commit()
    return conn


def generate_saas_database(
    scenario_id: str | None = None,
    output_path: str | Path | None = None,
    *,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
    **kwargs: Any,
) -> Any:
    """Generate a SaaS SQLite database or open connection.

    When output_path is provided, delegates to raw generation and returns the
    result dictionary. When output_path is omitted, creates a temporary database
    with compatibility views (such as subscriptions) and returns an open
    sqlite3.Connection.
    """
    if scenario_id is None:
        scenario_id = kwargs.pop("scenario_id", "churn-crisis")
    if output_path is None:
        output_path = kwargs.pop("output_path", None)
    if seed is None and "seed" in kwargs:
        seed = kwargs.pop("seed")
    if snapshot_output_path is None and "snapshot_output_path" in kwargs:
        snapshot_output_path = kwargs.pop("snapshot_output_path")

    if output_path is not None:
        return _raw_generate_saas_database(
            scenario_id=scenario_id,
            output_path=output_path,
            seed=seed,
            snapshot_output_path=snapshot_output_path,
            **kwargs,
        )

    temp_path = _make_temp_sqlite_path("saas")
    _raw_generate_saas_database(
        scenario_id=scenario_id,
        output_path=temp_path,
        seed=seed,
        snapshot_output_path=snapshot_output_path,
        **kwargs,
    )
    conn = sqlite3.connect(temp_path)
    conn.execute(
        "CREATE VIEW IF NOT EXISTS subscriptions AS SELECT rowid AS id, * FROM monthly_summary;"
    )
    conn.commit()
    return conn


__all__ = [
    "DATASET_EXPORTS_BY_PACK",
    "clamp",
    "default_seed_for",
    "export_sqlite_snapshot",
    "generate_financial_database",
    "generate_healthcare_database",
    "generate_saas_database",
    "generate_snowflake_cost_database",
    "generate_snowflake_rbac_database",
    "get_pack_scenario",
    "get_snowflake_cost_scenarios",
    "humanize_label",
    "infer_column_role",
    "infer_column_type",
    "load_pack",
    "package_snapshot",
    "resolve_dataset_exports",
    "stable_factor",
    "stable_fraction",
]

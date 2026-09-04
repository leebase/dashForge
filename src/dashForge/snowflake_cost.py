from __future__ import annotations

import sqlite3
from typing import Any

from dashForge._dataforge_compat import load_dataforge_module


def _load_snowflake_pack() -> dict[str, Any]:
    generate_module = load_dataforge_module("generate")
    return generate_module.load_pack("snowflakeCost")


def get_snowflake_cost_scenarios() -> list[str]:
    """Dynamically discover scenarios for the snowflakeCost pack from dataForge."""
    pack = _load_snowflake_pack()
    return [scenario["scenarioId"] for scenario in pack.get("scenarios", [])]


def validate_snowflake_cost_scenario(scenario_id: str) -> dict[str, Any]:
    """Validate that scenario_id is registered under snowflakeCost.

    Returns the scenario dictionary or raises ValueError.
    """
    pack = _load_snowflake_pack()
    for scenario in pack.get("scenarios", []):
        if scenario.get("scenarioId") == scenario_id:
            return scenario
    raise ValueError(f'Unknown snowflakeCost scenario "{scenario_id}".')


def enrich_snowflake_cost_provenance(
    snapshot: dict[str, Any],
    scenario_id: str,
    seed: int | None = None,
) -> dict[str, Any]:
    """Enrich a snapshot dictionary with snowflakeCost provenance metadata."""
    scenario = validate_snowflake_cost_scenario(scenario_id)
    pack = _load_snowflake_pack()
    effective_seed = seed if seed is not None else int(scenario.get("seed", 0))

    start_date = scenario.get("generationProfile", {}).get("startDate")
    generation_timestamp = (
        f"{start_date}T00:00:00Z" if start_date else "2026-06-01T00:00:00Z"
    )

    snapshot["packId"] = "snowflakeCost"
    snapshot["scenarioId"] = scenario_id
    snapshot["seed"] = effective_seed
    snapshot["dataForgeStoryContractPath"] = f"stories/snowflake/{scenario_id}.md"
    snapshot["generatorVersion"] = int(pack.get("version", 1))
    snapshot["generationTimestamp"] = generation_timestamp
    snapshot["synthetic"] = True
    snapshot["disclosure"] = "Synthetic demo data"
    return snapshot


def validate_recommendation_queue_schema(connection: sqlite3.Connection) -> None:
    """Validate that the recommendation_queue table has all required governance columns."""
    cursor = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='recommendation_queue'"
    )
    if not cursor.fetchone():
        raise ValueError("recommendation_queue table does not exist.")

    pragma_cursor = connection.execute("PRAGMA table_info(recommendation_queue)")
    cols = {row[1] for row in pragma_cursor.fetchall()}
    required_cols = {
        "recommendation_id",
        "executive_severity",
        "suggested_owner",
        "recommended_action",
        "evidence_detail",
        "guardrail",
    }
    missing = required_cols - cols
    if missing:
        raise ValueError(
            f"Missing required columns in recommendation_queue table: {sorted(missing)}"
        )



def ensure_warehouse_metering_compatibility_columns(connection: sqlite3.Connection) -> None:
    """Ensure warehouse_metering_history table supports presentation query seams (warehouseName, creditsUsed)."""
    cursor = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='warehouse_metering_history'"
    )
    if not cursor.fetchone():
        return

    pragma_cursor = connection.execute("PRAGMA table_info(warehouse_metering_history)")
    cols = {row[1] for row in pragma_cursor.fetchall()}
    if "warehouseName" not in cols:
        connection.execute(
            "ALTER TABLE warehouse_metering_history ADD COLUMN warehouseName TEXT GENERATED ALWAYS AS (warehouse_name) VIRTUAL"
        )
    if "creditsUsed" not in cols:
        connection.execute(
            "ALTER TABLE warehouse_metering_history ADD COLUMN creditsUsed REAL GENERATED ALWAYS AS (credits_used) VIRTUAL"
        )
    connection.commit()


__all__ = [
    "enrich_snowflake_cost_provenance",
    "ensure_warehouse_metering_compatibility_columns",
    "get_snowflake_cost_scenarios",
    "validate_recommendation_queue_schema",
    "validate_snowflake_cost_scenario",
]

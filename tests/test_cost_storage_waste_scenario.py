from __future__ import annotations

import ast
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
FRONTEND = ROOT / "frontend"
SCENARIOS = ROOT / "scenarios"
DOCS = ROOT / "docs"
JOURNEYS = ROOT / "journeys"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# DashForge main CLI entrypoint
try:
    from dashForge.main import build_parser, main
except ImportError:
    build_parser = None  # type: ignore[assignment]
    main = None  # type: ignore[assignment]

# DashForge package_snapshot module
try:
    from dashForge import package_snapshot as pkg_snapshot_module
except ImportError:
    pkg_snapshot_module = None

# DashForge storage_waste module (to be implemented in step_05)
try:
    from dashForge import storage_waste as storage_waste_module
except ImportError:
    storage_waste_module = None

# DashForge snowflake_cost extension module
try:
    from dashForge import snowflake_cost as snowflake_cost_module
except ImportError:
    snowflake_cost_module = None

try:
    from dashForge.snowflake_cost import (
        enrich_snowflake_cost_provenance,
        get_snowflake_cost_scenarios,
        validate_recommendation_queue_schema,
        validate_snowflake_cost_scenario,
    )
except ImportError:
    enrich_snowflake_cost_provenance = None  # type: ignore[assignment]
    get_snowflake_cost_scenarios = None  # type: ignore[assignment]
    validate_recommendation_queue_schema = None  # type: ignore[assignment]
    validate_snowflake_cost_scenario = None  # type: ignore[assignment]

# Sibling dataForge compat loader
try:
    from dashForge._dataforge_compat import load_dataforge_module
except ImportError:
    load_dataforge_module = None  # type: ignore[assignment]


# ============================================================================
# Contract Constants: Cost Management Storage Waste Slice Contract
# ============================================================================

PACK_ID: str = "snowflakeCost"
SCENARIO_ID: str = "storage-waste"
DEFAULT_SEED: int = 9101
DEFAULT_TEMPLATE_ID: str = "tpl.snowflakeCost.storage-waste"
SYNTHETIC_DISCLOSURE_TEXT: str = "Synthetic demo data"
STORY_CONTRACT_PATH: str = "stories/snowflake/storage-waste.md"

EXPECTED_SIX_DATASETS: set[str] = {
    "storage_summary",
    "table_storage_metrics",
    "stale_tables",
    "uncompressed_storage",
    "storage_usage_history",
    "recommendation_queue",
}

EXPECTED_STORAGE_SUMMARY_COLUMNS: set[str] = {
    "summary_id",
    "total_storage_bytes",
    "total_monthly_spend_usd",
    "recoverable_waste_bytes",
    "recoverable_waste_opportunity_usd",
    "stale_table_count",
    "uncompressed_table_count",
    "synthetic_seed",
    "evaluation_timestamp",
}

EXPECTED_TABLE_STORAGE_METRICS_COLUMNS: set[str] = {
    "table_id",
    "database_name",
    "schema_name",
    "table_name",
    "table_owner",
    "row_count",
    "active_bytes",
    "time_travel_bytes",
    "failsafe_bytes",
    "retained_for_clone_bytes",
    "total_storage_bytes",
    "last_altered",
}

EXPECTED_STALE_TABLES_COLUMNS: set[str] = {
    "stale_id",
    "table_id",
    "table_name",
    "schema_name",
    "days_since_last_read",
    "days_since_last_write",
    "staleness_category",
    "monthly_storage_cost_usd",
    "suggested_action",
}

EXPECTED_UNCOMPRESSED_STORAGE_COLUMNS: set[str] = {
    "uncompressed_id",
    "object_name",
    "object_type",
    "current_format",
    "target_format",
    "current_size_bytes",
    "estimated_compressed_bytes",
    "projected_byte_savings",
    "projected_monthly_savings_usd",
}

EXPECTED_STORAGE_USAGE_HISTORY_COLUMNS: set[str] = {
    "history_id",
    "usage_date",
    "active_bytes",
    "time_travel_bytes",
    "failsafe_bytes",
    "stage_bytes",
    "daily_cost_usd",
}

EXPECTED_SIX_GOVERNANCE_FIELDS: set[str] = {
    "recommendation_id",
    "executive_severity",
    "suggested_owner",
    "recommended_action",
    "evidence_detail",
    "guardrail",
}

EXPECTED_BROWSER_SMOKE_MARKERS: tuple[str, ...] = (
    "storage-waste",
    "synthetic-demo-data",
    "open-recommendation-queue",
    "recommendation-queue",
)

VALID_COLUMN_TYPES: set[str] = {"string", "number", "date", "boolean"}
VALID_COLUMN_ROLES: set[str] = {"dimension", "measure", "date", "id"}

EXPECTED_DATASET_SCHEMAS: dict[str, dict[str, tuple[str, str]]] = {
    "storage_summary": {
        "summary_id": ("string", "id"),
        "total_storage_bytes": ("number", "measure"),
        "total_monthly_spend_usd": ("number", "measure"),
        "recoverable_waste_bytes": ("number", "measure"),
        "recoverable_waste_opportunity_usd": ("number", "measure"),
        "stale_table_count": ("number", "measure"),
        "uncompressed_table_count": ("number", "measure"),
        "synthetic_seed": ("number", "dimension"),
        "evaluation_timestamp": ("date", "date"),
    },
    "table_storage_metrics": {
        "table_id": ("string", "id"),
        "database_name": ("string", "dimension"),
        "schema_name": ("string", "dimension"),
        "table_name": ("string", "dimension"),
        "table_owner": ("string", "dimension"),
        "row_count": ("number", "measure"),
        "active_bytes": ("number", "measure"),
        "time_travel_bytes": ("number", "measure"),
        "failsafe_bytes": ("number", "measure"),
        "retained_for_clone_bytes": ("number", "measure"),
        "total_storage_bytes": ("number", "measure"),
        "last_altered": ("date", "date"),
    },
    "stale_tables": {
        "stale_id": ("string", "id"),
        "table_id": ("string", "dimension"),
        "table_name": ("string", "dimension"),
        "schema_name": ("string", "dimension"),
        "days_since_last_read": ("number", "measure"),
        "days_since_last_write": ("number", "measure"),
        "staleness_category": ("string", "dimension"),
        "monthly_storage_cost_usd": ("number", "measure"),
        "suggested_action": ("string", "dimension"),
    },
    "uncompressed_storage": {
        "uncompressed_id": ("string", "id"),
        "object_name": ("string", "dimension"),
        "object_type": ("string", "dimension"),
        "current_format": ("string", "dimension"),
        "target_format": ("string", "dimension"),
        "current_size_bytes": ("number", "measure"),
        "estimated_compressed_bytes": ("number", "measure"),
        "projected_byte_savings": ("number", "measure"),
        "projected_monthly_savings_usd": ("number", "measure"),
    },
    "storage_usage_history": {
        "history_id": ("string", "id"),
        "usage_date": ("date", "date"),
        "active_bytes": ("number", "measure"),
        "time_travel_bytes": ("number", "measure"),
        "failsafe_bytes": ("number", "measure"),
        "stage_bytes": ("number", "measure"),
        "daily_cost_usd": ("number", "measure"),
    },
    "recommendation_queue": {
        "recommendation_id": ("string", "id"),
        "executive_severity": ("string", "dimension"),
        "suggested_owner": ("string", "dimension"),
        "recommended_action": ("string", "dimension"),
        "evidence_detail": ("string", "dimension"),
        "guardrail": ("string", "dimension"),
    },
}


# ============================================================================
# Helpers
# ============================================================================

def read_json_file(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_snapshot(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def generate_storage_waste_assets(
    tmp_path: Path,
    pack: str = PACK_ID,
    scenario: str = SCENARIO_ID,
    seed: int = DEFAULT_SEED,
    prefix: str = "test_storage_waste",
) -> tuple[Path, Path]:
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / f"{prefix}.sqlite"
    snapshot_path = tmp_path / f"{prefix}.snapshot.json"
    exit_code = main(
        [
            "generate",
            "--pack",
            pack,
            "--scenario",
            scenario,
            "--seed",
            str(seed),
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snapshot_path),
            "--force",
        ]
    )
    assert exit_code == 0, f"Asset generation failed with code {exit_code}"
    assert db_path.exists(), f"SQLite database {db_path} was not created"
    assert snapshot_path.exists(), f"Snapshot JSON {snapshot_path} was not created"
    return db_path, snapshot_path


# ============================================================================
# AC-1: Relational Storage Waste Snapshot Contracts & dataForge Ingestion
# ============================================================================

def test_ac1_six_canonical_storage_datasets_in_sqlite(tmp_path: Path) -> None:
    """Verify that generated SQLite database contains all six canonical Storage Waste tables."""
    db_path, _ = generate_storage_waste_assets(tmp_path)
    with sqlite3.connect(db_path) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        missing = EXPECTED_SIX_DATASETS - tables
        assert not missing, f"Missing expected Storage Waste tables in SQLite: {missing}"

        for table in EXPECTED_SIX_DATASETS:
            count = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            assert count > 0, f"Table {table} in SQLite is empty"


def test_ac1_six_canonical_storage_datasets_in_snapshot(tmp_path: Path) -> None:
    """Verify that generated JSON snapshot contains all six canonical Storage Waste datasets."""
    _, snap_path = generate_storage_waste_assets(tmp_path)
    snap_data = read_json_file(snap_path)
    assert isinstance(snap_data.get("datasets"), list), "Snapshot missing datasets list"
    dataset_ids = {d["datasetId"] for d in snap_data["datasets"]}
    missing = EXPECTED_SIX_DATASETS - dataset_ids
    assert not missing, f"Missing expected Storage Waste datasets in snapshot: {missing}"


def test_ac1_storage_summary_schema_and_columns(tmp_path: Path) -> None:
    """Verify that storage_summary table and snapshot dataset define headline storage and spend metrics."""
    db_path, snap_path = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(storage_summary)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_STORAGE_SUMMARY_COLUMNS - columns
        assert not missing, f"storage_summary SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "storage_summary"), None
    )
    assert dataset is not None, "storage_summary missing from snapshot"
    assert len(dataset["rows"]) > 0, "storage_summary dataset has no rows"
    first_row = dataset["rows"][0]
    for col in EXPECTED_STORAGE_SUMMARY_COLUMNS:
        assert col in first_row, f"storage_summary row missing column '{col}': {first_row}"
    assert isinstance(first_row["total_storage_bytes"], (int, float))
    assert isinstance(first_row["total_monthly_spend_usd"], (int, float))
    assert isinstance(first_row["recoverable_waste_bytes"], (int, float))
    assert isinstance(first_row["recoverable_waste_opportunity_usd"], (int, float))
    assert isinstance(first_row["stale_table_count"], (int, float))
    assert isinstance(first_row["uncompressed_table_count"], (int, float))
    assert first_row["total_storage_bytes"] > 0
    assert first_row["total_monthly_spend_usd"] > 0
    assert first_row["recoverable_waste_opportunity_usd"] > 0


def test_ac1_table_storage_metrics_schema_and_columns(tmp_path: Path) -> None:
    """Verify that table_storage_metrics table and snapshot dataset define table-level storage footprint."""
    db_path, snap_path = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(table_storage_metrics)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_TABLE_STORAGE_METRICS_COLUMNS - columns
        assert not missing, f"table_storage_metrics SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "table_storage_metrics"), None
    )
    assert dataset is not None, "table_storage_metrics missing from snapshot"
    assert len(dataset["rows"]) > 0, "table_storage_metrics dataset has no rows"
    first_row = dataset["rows"][0]
    for col in EXPECTED_TABLE_STORAGE_METRICS_COLUMNS:
        assert col in first_row, f"table_storage_metrics row missing column '{col}': {first_row}"
    assert isinstance(first_row["total_storage_bytes"], (int, float))
    assert isinstance(first_row["active_bytes"], (int, float))
    assert isinstance(first_row["time_travel_bytes"], (int, float))
    assert isinstance(first_row["failsafe_bytes"], (int, float))
    assert isinstance(first_row["row_count"], (int, float))


def test_ac1_stale_tables_schema_and_columns(tmp_path: Path) -> None:
    """Verify that stale_tables table and snapshot dataset define dormant and unqueried object attributes."""
    db_path, snap_path = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(stale_tables)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_STALE_TABLES_COLUMNS - columns
        assert not missing, f"stale_tables SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "stale_tables"), None
    )
    assert dataset is not None, "stale_tables missing from snapshot"
    assert len(dataset["rows"]) > 0, "stale_tables dataset has no rows"
    first_row = dataset["rows"][0]
    for col in EXPECTED_STALE_TABLES_COLUMNS:
        assert col in first_row, f"stale_tables row missing column '{col}': {first_row}"
    assert isinstance(first_row["days_since_last_read"], (int, float))
    assert isinstance(first_row["monthly_storage_cost_usd"], (int, float))
    assert first_row["days_since_last_read"] >= 0


def test_ac1_uncompressed_storage_schema_and_columns(tmp_path: Path) -> None:
    """Verify that uncompressed_storage table and snapshot dataset define compression overhead metrics."""
    db_path, snap_path = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(uncompressed_storage)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_UNCOMPRESSED_STORAGE_COLUMNS - columns
        assert not missing, f"uncompressed_storage SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "uncompressed_storage"), None
    )
    assert dataset is not None, "uncompressed_storage missing from snapshot"
    assert len(dataset["rows"]) > 0, "uncompressed_storage dataset has no rows"
    first_row = dataset["rows"][0]
    for col in EXPECTED_UNCOMPRESSED_STORAGE_COLUMNS:
        assert col in first_row, f"uncompressed_storage row missing column '{col}': {first_row}"
    assert isinstance(first_row["current_size_bytes"], (int, float))
    assert isinstance(first_row["estimated_compressed_bytes"], (int, float))
    assert isinstance(first_row["projected_byte_savings"], (int, float))
    assert isinstance(first_row["projected_monthly_savings_usd"], (int, float))
    assert first_row["projected_byte_savings"] > 0
    assert first_row["projected_monthly_savings_usd"] > 0


def test_ac1_storage_usage_history_schema_and_columns(tmp_path: Path) -> None:
    """Verify that storage_usage_history table and snapshot dataset define longitudinal trends."""
    db_path, snap_path = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(storage_usage_history)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_STORAGE_USAGE_HISTORY_COLUMNS - columns
        assert not missing, f"storage_usage_history SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "storage_usage_history"), None
    )
    assert dataset is not None, "storage_usage_history missing from snapshot"
    assert len(dataset["rows"]) > 0, "storage_usage_history dataset has no rows"
    first_row = dataset["rows"][0]
    for col in EXPECTED_STORAGE_USAGE_HISTORY_COLUMNS:
        assert col in first_row, f"storage_usage_history row missing column '{col}': {first_row}"
    assert isinstance(first_row["daily_cost_usd"], (int, float))
    assert isinstance(first_row["active_bytes"], (int, float))


def test_ac1_recommendation_queue_governance_schema(tmp_path: Path) -> None:
    """Verify that recommendation_queue table and snapshot dataset preserve all six governance fields."""
    db_path, snap_path = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(recommendation_queue)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_SIX_GOVERNANCE_FIELDS - columns
        assert not missing, f"recommendation_queue SQLite table missing governance columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "recommendation_queue"), None
    )
    assert dataset is not None, "recommendation_queue missing from snapshot"
    assert len(dataset["rows"]) > 0, "recommendation_queue dataset has no rows"
    for row in dataset["rows"]:
        for col in EXPECTED_SIX_GOVERNANCE_FIELDS:
            assert col in row, f"recommendation_queue row missing column '{col}': {row}"
            assert row[col] is not None and str(row[col]).strip() != "", (
                f"Empty value for governance column '{col}' in row: {row}"
            )


def test_ac1_canonical_column_types_and_roles(tmp_path: Path) -> None:
    """Verify that snapshot column declarations conform strictly to valid types and semantic roles."""
    _, snap_path = generate_storage_waste_assets(tmp_path)
    snap_data = read_json_file(snap_path)

    for dataset in snap_data["datasets"]:
        dataset_id = dataset["datasetId"]
        assert dataset_id in EXPECTED_DATASET_SCHEMAS, f"Unexpected dataset {dataset_id} in snapshot"
        declared_cols = {c["name"]: (c["type"], c["role"]) for c in dataset["columns"]}

        for col_name, (col_type, col_role) in declared_cols.items():
            assert col_type in VALID_COLUMN_TYPES, (
                f"Invalid column type '{col_type}' for {dataset_id}.{col_name}"
            )
            assert col_role in VALID_COLUMN_ROLES, (
                f"Invalid column role '{col_role}' for {dataset_id}.{col_name}"
            )

        expected_schema = EXPECTED_DATASET_SCHEMAS[dataset_id]
        for col_name, (exp_type, exp_role) in expected_schema.items():
            assert col_name in declared_cols, (
                f"Missing column '{col_name}' in dataset {dataset_id}"
            )
            act_type, act_role = declared_cols[col_name]
            assert act_type == exp_type, (
                f"Type mismatch for {dataset_id}.{col_name}: expected {exp_type}, got {act_type}"
            )
            assert act_role == exp_role, (
                f"Role mismatch for {dataset_id}.{col_name}: expected {exp_role}, got {act_role}"
            )


def test_ac1_snapshot_provenance_metadata(tmp_path: Path) -> None:
    """Verify that generated Storage Waste snapshot carries complete provenance metadata."""
    _, snapshot_path = generate_storage_waste_assets(tmp_path)
    data = read_json_file(snapshot_path)

    assert data.get("packId") == PACK_ID, f"Expected packId '{PACK_ID}', got '{data.get('packId')}'"
    assert data.get("scenarioId") == SCENARIO_ID, f"Expected scenarioId '{SCENARIO_ID}', got '{data.get('scenarioId')}'"
    assert data.get("seed") == DEFAULT_SEED, f"Expected seed '{DEFAULT_SEED}', got '{data.get('seed')}'"
    assert data.get("synthetic") is True, "Snapshot synthetic flag must be True"
    assert data.get("disclosure") == SYNTHETIC_DISCLOSURE_TEXT, (
        f"Snapshot disclosure text must be '{SYNTHETIC_DISCLOSURE_TEXT}'"
    )

    story_contract = data.get("dataForgeStoryContractPath")
    assert story_contract is not None, "Snapshot missing dataForgeStoryContractPath"
    assert SCENARIO_ID in story_contract, f"Story contract path '{story_contract}' does not reference scenario"

    ts_str = data.get("generationTimestamp") or data.get("evaluationTimestamp")
    assert ts_str is not None, "Snapshot missing generationTimestamp/evaluationTimestamp"
    assert isinstance(ts_str, str)
    parsed_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    assert parsed_ts is not None


def test_ac1_deterministic_generation(tmp_path: Path) -> None:
    """Verify that two successive generations with identical seed produce bit-for-bit identical outputs."""
    dir1 = tmp_path / "run1"
    dir2 = tmp_path / "run2"
    dir1.mkdir()
    dir2.mkdir()

    db1, snap1 = generate_storage_waste_assets(dir1, seed=DEFAULT_SEED, prefix="run1")
    db2, snap2 = generate_storage_waste_assets(dir2, seed=DEFAULT_SEED, prefix="run2")

    hash_db1 = hashlib.sha256(db1.read_bytes()).hexdigest()
    hash_db2 = hashlib.sha256(db2.read_bytes()).hexdigest()
    assert hash_db1 == hash_db2, "Generated SQLite databases differ across identical seeds"

    hash_snap1 = hashlib.sha256(snap1.read_bytes()).hexdigest()
    hash_snap2 = hashlib.sha256(snap2.read_bytes()).hexdigest()
    assert hash_snap1 == hash_snap2, "Generated JSON snapshots differ across identical seeds"


def test_ac1_validate_snowflake_cost_scenario_registration() -> None:
    """Verify that validate_snowflake_cost_scenario accepts storage-waste."""
    assert validate_snowflake_cost_scenario is not None, (
        "dashForge.snowflake_cost.validate_snowflake_cost_scenario is not available"
    )
    scenario = validate_snowflake_cost_scenario(SCENARIO_ID)
    assert scenario is not None
    assert scenario.get("scenarioId") == SCENARIO_ID


def test_ac1_dynamic_scenario_discovery_includes_storage_waste() -> None:
    """Verify that get_snowflake_cost_scenarios discovers storage-waste scenario."""
    assert get_snowflake_cost_scenarios is not None, (
        "dashForge.snowflake_cost.get_snowflake_cost_scenarios is not available"
    )
    scenarios = get_snowflake_cost_scenarios()
    assert isinstance(scenarios, list)
    assert SCENARIO_ID in scenarios


# ============================================================================
# AC-2: Canonical DashboardSpec Specification & Runtime DataAdapter Seams
# ============================================================================

def test_ac2_dashboard_spec_registered_scenario() -> None:
    """Verify that StandaloneDashboardApp or scenario blueprint references storage-waste."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    blueprint_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"

    found_in_app = app_tsx.exists() and (
        SCENARIO_ID in read_text_file(app_tsx) or DEFAULT_TEMPLATE_ID in read_text_file(app_tsx)
    )
    found_in_blueprint = blueprint_ts.exists() and (
        SCENARIO_ID in read_text_file(blueprint_ts) or DEFAULT_TEMPLATE_ID in read_text_file(blueprint_ts)
    )
    assert found_in_app or found_in_blueprint, (
        f"Neither StandaloneDashboardApp.tsx nor standaloneDashboard.ts references '{SCENARIO_ID}' or '{DEFAULT_TEMPLATE_ID}'"
    )


def test_ac2_presentation_declares_kpi_scorecards() -> None:
    """Verify that presentation components declare KPI scorecards for storage spend and waste."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    blueprint_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"
    contract_md = DOCS / "cost-management-storage-waste-contract.md"

    sources = [
        read_text_file(p)
        for p in [app_tsx, blueprint_ts, contract_md]
        if p.exists()
    ]
    combined = "\n".join(sources).lower()

    required_kpis = [
        "total storage spend",
        "recoverable waste",
        "stale table",
        "uncompressed storage",
    ]
    for kpi in required_kpis:
        assert kpi in combined, f"Missing KPI reference '{kpi}' across presentation specifications"


def test_ac2_presentation_declares_storage_distribution_and_aging_visualizers() -> None:
    """Verify that presentation components declare storage volume distribution and table aging visualizers."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    contract_md = DOCS / "cost-management-storage-waste-contract.md"

    sources = [
        read_text_file(p)
        for p in [app_tsx, contract_md]
        if p.exists()
    ]
    combined = "\n".join(sources).lower()

    assert "distribution" in combined, "Missing storage volume distribution visualizer reference"
    assert "aging" in combined or "stale" in combined, "Missing table access aging visualizer reference"


def test_ac2_runtime_queries_use_canonical_data_adapter_seams() -> None:
    """Verify that presentation logic binds exclusively to DataAdapter interfaces without bespoke renderers."""
    frontend_src = FRONTEND / "src"
    assert frontend_src.exists(), f"Missing frontend/src at {frontend_src}"

    adapter_factory = frontend_src / "core" / "data" / "createDashboardDataAdapter.ts"
    assert adapter_factory.exists(), f"Missing createDashboardDataAdapter.ts at {adapter_factory}"

    adapter_content = read_text_file(adapter_factory)
    assert "StaticDataAdapter" in adapter_content or "DataAdapter" in adapter_content


def test_ac2_zero_live_credentials_or_backend_network_calls() -> None:
    """Verify that src/dashForge and presentation components contain no live Snowflake credential prompts."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_dir}"

    forbidden_patterns = [
        "snowflake.connector",
        "requests.post",
        "urllib.request.urlopen",
    ]
    for py_file in py_files:
        content = read_text_file(py_file)
        for pattern in forbidden_patterns:
            assert pattern not in content, (
                f"Forbidden credential/network pattern '{pattern}' found in {py_file.name}"
            )

    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    if app_tsx.exists():
        app_content = read_text_file(app_tsx)
        assert 'type="password"' not in app_content
        assert 'data-mode="real-client-disabled"' in app_content


# ============================================================================
# AC-3: Prioritized Recommendations & Governance Guardrails
# ============================================================================

def test_ac3_recommendation_queue_governance_fields(tmp_path: Path) -> None:
    """Verify that all recommendation queue rows contain all six governance fields and valid severity."""
    db_path, _ = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute("SELECT * FROM recommendation_queue").fetchall()]

    assert len(rows) >= 2, "Expected at least 2 recommendations in storage-waste"
    valid_severities = {"P0", "P1", "P2", "P3"}

    for row in rows:
        for field in EXPECTED_SIX_GOVERNANCE_FIELDS:
            assert field in row, f"Missing field '{field}' in recommendation row: {row}"
            assert row[field] is not None and str(row[field]).strip() != "", (
                f"Empty value for field '{field}' in recommendation row: {row}"
            )
        assert row["executive_severity"] in valid_severities, (
            f"Invalid executive_severity '{row['executive_severity']}' in recommendation: {row}"
        )


def test_ac3_recommendation_queue_orders_p0_first(tmp_path: Path) -> None:
    """Verify that recommendation queue surfaces critical high-impact P0 opportunities first."""
    _, snap_path = generate_storage_waste_assets(tmp_path)
    snap_data = read_json_file(snap_path)

    rec_dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_dataset is not None, "recommendation_queue dataset missing from snapshot"
    assert len(rec_dataset["rows"]) > 0, "recommendation_queue dataset has no rows"

    first_rec = rec_dataset["rows"][0]
    assert first_rec["executive_severity"] == "P0", (
        f"Expected first recommendation to be P0, got {first_rec['executive_severity']}"
    )


def test_ac3_recommendation_queue_interactive_toggle_control() -> None:
    """Verify that StandaloneDashboardApp.tsx provides an open-recommendation-queue action and region."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-action="open-recommendation-queue"' in content
    assert 'data-status="recommendation-queue"' in content
    assert 'id="recommendation-queue"' in content or 'role="region"' in content


def test_ac3_directional_validation_guardrails_in_rows(tmp_path: Path) -> None:
    """Verify that every recommendation row enforces protective directional validation guardrails."""
    db_path, _ = generate_storage_waste_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute("SELECT * FROM recommendation_queue").fetchall()]

    for row in rows:
        guardrail = str(row["guardrail"]).lower()
        has_validation = any(
            keyword in guardrail
            for keyword in [
                "confirm",
                "validate",
                "review",
                "steward",
                "owner",
                "before",
                "verify",
                "approval",
                "retention",
            ]
        )
        assert has_validation, (
            f"Guardrail for {row['recommendation_id']} lacks directional validation framing: {row['guardrail']}"
        )


def test_ac3_directional_validation_notice_in_presentation() -> None:
    """Verify that directional validation notice is present in presentation or contract documentation."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    contract_md = DOCS / "cost-management-storage-waste-contract.md"

    sources = [
        read_text_file(p)
        for p in [app_tsx, contract_md]
        if p.exists()
    ]
    combined = "\n".join(sources).lower()

    assert "directional" in combined, "Missing directional framing notice"
    assert "owner" in combined or "steward" in combined, "Missing table owner/steward reference"


# ============================================================================
# AC-4: Same-Day Executive Follow-Up Deliverables & Browser Smoke Gate Conformance
# ============================================================================

def test_ac4_persistent_unsuppressed_synthetic_disclosure() -> None:
    """Verify that presentation components prominently render data-disclosure='synthetic-demo-data'."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-disclosure="synthetic-demo-data"' in content
    assert SYNTHETIC_DISCLOSURE_TEXT in content


def test_ac4_same_day_executive_follow_up_action_and_status() -> None:
    """Verify that StandaloneDashboardApp.tsx provides same-day executive follow-up action and status."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-action="same-day-executive-follow-up"' in content
    assert 'data-status="executive-follow-up"' in content


def test_ac4_landscape_pdf_export_action() -> None:
    """Verify that StandaloneDashboardApp.tsx provides landscape PDF export action."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-testid="dashboard-save-pdf"' in content


def test_ac4_presentation_source_contains_all_browser_smoke_markers() -> None:
    """Verify that StandaloneDashboardApp.tsx contains all four browser smoke contract markers."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    for marker in EXPECTED_BROWSER_SMOKE_MARKERS:
        assert marker in content, (
            f"Missing required smoke contract marker '{marker}' in StandaloneDashboardApp.tsx"
        )


def test_ac4_production_bundle_contract_markers_conformance() -> None:
    """Verify that compiled JavaScript bundles under frontend/dist/assets/ contain all contract markers."""
    dist_dir = FRONTEND / "dist"
    index_html = dist_dir / "index.html"
    assets_dir = dist_dir / "assets"

    if not index_html.exists() or not assets_dir.exists():
        pytest.skip("frontend/dist production bundle has not been built yet; skipping bundle marker check.")

    html_content = read_text_file(index_html)
    assert '<div id="root">' in html_content or '<div id="root"' in html_content or "<div id='root'" in html_content

    js_files = list(assets_dir.glob("*.js"))
    assert js_files, f"No JavaScript bundles found in {assets_dir}"

    bundle_text = "".join(read_text_file(p) for p in js_files)
    missing_markers = [m for m in EXPECTED_BROWSER_SMOKE_MARKERS if m not in bundle_text]
    assert not missing_markers, f"Built production bundles missing required markers: {missing_markers}"


# ============================================================================
# AC-5: Verbatim Direct Argv Command Execution & Journey Traceability
# ============================================================================

def test_ac5_user_journeys_manifest_schema_and_authorities() -> None:
    """Verify that journeys/user_journeys_manifest.json conforms to schema and declares valid authorities."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    assert data.get("schema_version") == 1
    assert "contract" in data
    assert "objective" in data
    assert "command_allowlist" in data
    assert isinstance(data["command_allowlist"], list)

    valid_authorities = {"human", "mission", "author"}
    journeys = data.get("journeys", [])
    assert len(journeys) >= 6, f"Expected at least 6 user journeys, found {len(journeys)}"

    for journey in journeys:
        assert "id" in journey
        assert "name" in journey
        assert "goal" in journey
        assert journey.get("authority") in valid_authorities, (
            f"Journey {journey.get('id')} has invalid authority: {journey.get('authority')}"
        )
        assert journey.get("status") == "passed", (
            f"Journey {journey.get('id')} has non-passed status: {journey.get('status')}"
        )
        assert "commands" in journey and len(journey["commands"]) > 0
        assert "steps" in journey and len(journey["steps"]) > 0
        assert "traces_to" in journey and len(journey["traces_to"]) > 0


def test_ac5_user_journeys_manifest_full_ac_traceability() -> None:
    """Verify that every acceptance check (AC-1 through AC-6) is traced by at least one journey."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    expected_acs = {f"AC-{i}" for i in range(1, 7)}
    traced_acs: set[str] = set()

    for journey in data.get("journeys", []):
        for ac in journey.get("traces_to", []):
            traced_acs.add(ac)

    missing_acs = expected_acs - traced_acs
    assert not missing_acs, f"Acceptance checks missing journey traceability: {missing_acs}"


def test_ac5_command_allowlist_and_journey_commands_compliance() -> None:
    """Verify that command_allowlist contains required command forms and journey commands comply."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    allowlist = data.get("command_allowlist", [])

    required_prefixes = [
        "env PYTHONPATH=src python3 -m dashForge.main",
        "python3 -m pytest",
        "npm --prefix frontend test -- --run",
    ]
    for prefix in required_prefixes:
        assert any(entry.startswith(prefix) for entry in allowlist), (
            f"Required prefix '{prefix}' missing from command_allowlist: {allowlist}"
        )

    for journey in data.get("journeys", []):
        for cmd in journey.get("commands", []):
            matches_allowlist = any(cmd.startswith(prefix) for prefix in allowlist)
            assert matches_allowlist, (
                f"Command '{cmd}' in journey '{journey.get('id')}' not matched in allowlist: {allowlist}"
            )


def test_ac5_no_shell_operators_in_journey_commands() -> None:
    """Verify that journey commands do not use shell pipelines, redirection, or chaining operators."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    forbidden_tokens = ["|", "&&", "||", ";", "<", ">"]

    for journey in data.get("journeys", []):
        for cmd in journey.get("commands", []):
            for token in forbidden_tokens:
                assert token not in cmd.split(), (
                    f"Forbidden shell token '{token}' found in command '{cmd}' of journey '{journey.get('id')}'"
                )


def test_ac5_verbatim_cli_help_execution() -> None:
    """Verify that dashForge CLI entrypoint supports help and generate options."""
    assert build_parser is not None, "dashForge.main.build_parser is not available"
    parser = build_parser()
    assert parser is not None

    help_text = parser.format_help()
    assert "generate" in help_text
    assert "--pack" in help_text or "pack" in help_text


# ============================================================================
# AC-6: Preservation of Existing Behavior, Sibling Isolation & Fail-Closed Guards
# ============================================================================

def test_ac6_cli_fail_closed_existing_sqlite_without_force(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify that CLI fails closed with exit code 2 when target SQLite exists and --force is omitted."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "preexisting.sqlite"
    db_path.write_text("existing content", encoding="utf-8")

    with pytest.raises(SystemExit) as exc_info:
        main(
            [
                "generate",
                "--pack",
                PACK_ID,
                "--scenario",
                SCENARIO_ID,
                "--output",
                str(db_path),
            ]
        )
    assert exc_info.value.code == 2
    captured = capsys.readouterr()
    err_lower = captured.err.lower()
    assert "output path already exists. pass --force to overwrite" in err_lower
    assert "traceback (most recent call last)" not in captured.err.lower()
    assert "traceback (most recent call last)" not in captured.out.lower()


def test_ac6_cli_fail_closed_existing_snapshot_without_force(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify that CLI fails closed with exit code 2 when target snapshot exists and --force is omitted."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "new_db.sqlite"
    snap_path = tmp_path / "preexisting.snapshot.json"
    snap_path.write_text("{}", encoding="utf-8")

    with pytest.raises(SystemExit) as exc_info:
        main(
            [
                "generate",
                "--pack",
                PACK_ID,
                "--scenario",
                SCENARIO_ID,
                "--output",
                str(db_path),
                "--snapshot-output",
                str(snap_path),
            ]
        )
    assert exc_info.value.code == 2
    captured = capsys.readouterr()
    err_lower = captured.err.lower()
    assert "output path already exists. pass --force to overwrite" in err_lower
    assert "traceback (most recent call last)" not in captured.err.lower()


def test_ac6_cli_force_overwrites_existing_outputs(tmp_path: Path) -> None:
    """Verify that passing --force successfully overwrites existing database and snapshot files."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "target.sqlite"
    snap_path = tmp_path / "target.snapshot.json"
    db_path.write_text("old", encoding="utf-8")
    snap_path.write_text("old", encoding="utf-8")

    exit_code = main(
        [
            "generate",
            "--pack",
            PACK_ID,
            "--scenario",
            SCENARIO_ID,
            "--seed",
            str(DEFAULT_SEED),
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snap_path),
            "--force",
        ]
    )
    assert exit_code == 0
    assert db_path.read_bytes()[:16] == b"SQLite format 3\x00"
    data = read_json_file(snap_path)
    assert data["packId"] == PACK_ID
    assert data["scenarioId"] == SCENARIO_ID


def test_ac6_unknown_scenario_fails_cleanly(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify that requesting an unknown scenario fails closed with exit 2 and clean error message."""
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exc_info:
        main(
            [
                "generate",
                "--pack",
                PACK_ID,
                "--scenario",
                "non-existent-storage-scenario",
                "--output",
                str(tmp_path / "out.sqlite"),
                "--force",
            ]
        )
    assert exc_info.value.code == 2
    captured = capsys.readouterr()
    err_lower = captured.err.lower()
    assert "unknown" in err_lower and "scenario" in err_lower
    assert "traceback (most recent call last)" not in captured.err.lower()
    assert "traceback (most recent call last)" not in captured.out.lower()


def test_ac6_backwards_compatibility_existing_packs(tmp_path: Path) -> None:
    """Verify that existing industry packs continue to generate cleanly without regressions."""
    assert main is not None, "dashForge.main.main is not available"
    existing_packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 5301),
        ("saas", "churn-crisis", 8301),
        ("snowflakeCost", "idle-warehouse-waste", 9101),
    ]
    for pack, scenario, seed in existing_packs:
        out = tmp_path / f"{pack}_{scenario}.sqlite"
        snap = tmp_path / f"{pack}_{scenario}.snapshot.json"
        exit_code = main(
            [
                "generate",
                "--pack",
                pack,
                "--scenario",
                scenario,
                "--seed",
                str(seed),
                "--output",
                str(out),
                "--snapshot-output",
                str(snap),
                "--force",
            ]
        )
        assert exit_code == 0, f"Generation failed for pack '{pack}' scenario '{scenario}': exit code {exit_code}"
        assert out.exists(), f"Output file missing for pack '{pack}' scenario '{scenario}'"
        assert snap.exists(), f"Snapshot file missing for pack '{pack}' scenario '{scenario}'"


def test_ac6_sibling_dataforge_unmodified() -> None:
    """Verify that sibling repository dataForge remains strictly read-only and unmodified."""
    dataforge_dir = ROOT.parent / "dataForge"
    if not (dataforge_dir / ".git").exists():
        pytest.skip(f"dataForge git directory not found at {dataforge_dir}")

    result = subprocess.run(
        ["git", "-C", str(dataforge_dir), "status", "--porcelain"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == "", (
        f"Sibling repository dataForge has uncommitted modifications: {result.stdout}"
    )


def test_ac6_backend_source_zero_external_dependencies() -> None:
    """Verify that src/dashForge Python files import only allowed standard library and internal modules."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_dir}"

    allowed_modules = {
        "__future__",
        "argparse",
        "ast",
        "datetime",
        "hashlib",
        "importlib",
        "json",
        "os",
        "pathlib",
        "sqlite3",
        "sys",
        "typing",
        "dashForge",
        "dataForge",
    }

    for py_file in py_files:
        tree = ast.parse(read_text_file(py_file), filename=str(py_file))
        imported_modules: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imported_modules.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imported_modules.add(node.module.split(".")[0])

        disallowed = imported_modules - allowed_modules
        assert not disallowed, f"Disallowed dependencies in {py_file.name}: {disallowed}"


def test_ac6_no_hardcoded_scenarios_in_backend_collections() -> None:
    """Verify that src/dashForge Python files do not contain hardcoded collections of snowflake scenario IDs."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    known_scenarios = {
        "idle-warehouse-waste",
        "bi-over-provisioning",
        "runaway-query-pattern",
        "department-chargeback",
        "executive-cost-spike",
        "finops-maturity-assessment",
        "storage-waste",
    }

    for py_file in py_files:
        tree = ast.parse(read_text_file(py_file), filename=str(py_file))
        for node in ast.walk(tree):
            if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
                string_elements = {
                    elt.value
                    for elt in node.elts
                    if isinstance(elt, ast.Constant) and isinstance(elt.value, str)
                }
                hardcoded = string_elements.intersection(known_scenarios)
                assert not hardcoded, (
                    f"Found hardcoded snowflake scenario(s) {hardcoded} in collection "
                    f"literal in {py_file.name}:{node.lineno}."
                )

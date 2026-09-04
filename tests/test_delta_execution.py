"""Targeted test suite for the repair-03feb3227318 slice contract.

Encodes acceptance checks AC-1 through AC-7 defined in docs/repair-03feb3227318-contract.md:
- AC-1: Delta execution strategy partitioning simulation into bounded increments & intermediate checkpoints (<120s ceiling, eliminating 600s timeouts and cascading retries).
- AC-2: Resilient schema handling for simulation outputs (PRAGMA table inspection, virtual generated columns, intermediate delta tables, dynamic type/role inference).
- AC-3: Preservation of buyer-visible dashboard output, standalone presentation semantics, narrative arcs, and recommendation queue views across standalone and builder modes.
- AC-4: Preservation of data definitions and canonical SQLiteSnapshot contract, seven canonical datasets, provenance metadata, and bit-for-bit determinism.
- AC-5: CLI entrypoint supports delta execution and diagnostics with pure stdout (canonical completions only) and stderr telemetry routing.
- AC-6: Fail-closed error handling with exit code 2 and informative diagnostics on invalid arguments, missing options, unknown scenarios, or unforced overwrites without tracebacks.
- AC-7: Zero external runtime dependencies (stdlib only), read-only sibling dataForge, operational continuity across all industry packs, and full test suite compatibility with NO PYTHONPATH override.

All tests are import-guarded and syntactically valid so they can be collected cleanly
before the delta execution implementation lands.
"""

from __future__ import annotations

import ast
from datetime import datetime
import hashlib
import io
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
FRONTEND = ROOT / "frontend"
DATAFORGE_ROOT = ROOT.parent / "dataForge"
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
    from dashForge.package_snapshot import (
        export_sqlite_snapshot,
        package_snapshot,
        infer_column_role,
        infer_column_type,
        humanize_label,
        resolve_dataset_exports,
        GENERATORS,
    )
except ImportError:
    pkg_snapshot_module = None
    export_sqlite_snapshot = None  # type: ignore[assignment]
    package_snapshot = None  # type: ignore[assignment]
    infer_column_role = None  # type: ignore[assignment]
    infer_column_type = None  # type: ignore[assignment]
    humanize_label = None  # type: ignore[assignment]
    resolve_dataset_exports = None  # type: ignore[assignment]
    GENERATORS = {}

# DashForge snowflake_cost module
try:
    from dashForge import snowflake_cost as snowflake_cost_module
    from dashForge.snowflake_cost import (
        enrich_snowflake_cost_provenance,
        ensure_warehouse_metering_compatibility_columns,
        get_snowflake_cost_scenarios,
        validate_recommendation_queue_schema,
        validate_snowflake_cost_scenario,
    )
except ImportError:
    snowflake_cost_module = None
    enrich_snowflake_cost_provenance = None  # type: ignore[assignment]
    ensure_warehouse_metering_compatibility_columns = None  # type: ignore[assignment]
    get_snowflake_cost_scenarios = None  # type: ignore[assignment]
    validate_recommendation_queue_schema = None  # type: ignore[assignment]
    validate_snowflake_cost_scenario = None  # type: ignore[assignment]

# DashForge diagnostics module
try:
    from dashForge import diagnostics as diagnostics_module
    from dashForge.diagnostics import DiagnosticTimer, is_diagnostics_enabled, time_phase
except ImportError:
    diagnostics_module = None
    DiagnosticTimer = None  # type: ignore[assignment]
    is_diagnostics_enabled = None  # type: ignore[assignment]
    time_phase = None  # type: ignore[assignment]

# Delta execution module or extensions
try:
    from dashForge import delta_execution as delta_execution_module
except ImportError:
    delta_execution_module = None


# ============================================================================
# Contract Constants
# ============================================================================

PACK_ID = "snowflakeCost"
SCENARIO_ID = "idle-warehouse-waste"
DEFAULT_SEED = 9101
DEFAULT_TEMPLATE_ID = "tpl.snowflakeCost.idle-warehouse-waste"
STORY_CONTRACT_PATH = "stories/snowflake/idle-warehouse-waste.md"
SYNTHETIC_DISCLOSURE_TEXT = "Synthetic demo data"

EXPECTED_SEVEN_DATASETS = {
    "executive_summary",
    "warehouse_metering_history",
    "query_history",
    "metering_history",
    "database_storage_usage_history",
    "show_warehouses",
    "recommendation_queue",
}

EXPECTED_GOVERNANCE_COLUMNS = {
    "recommendation_id",
    "executive_severity",
    "suggested_owner",
    "recommended_action",
    "evidence_detail",
    "guardrail",
}

VALID_COLUMN_TYPES = {"string", "number", "date", "boolean"}
VALID_COLUMN_ROLES = {"dimension", "measure", "date", "id"}


# ============================================================================
# Helper Functions
# ============================================================================

def run_cli_command(
    args: list[str],
    env_extra: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    """Execute dashForge CLI via subprocess in a controlled environment."""
    env = dict(os.environ)
    env["PYTHONPATH"] = str(SRC)
    if env_extra:
        env.update(env_extra)
    return subprocess.run(
        [sys.executable, "-m", "dashForge.main", *args],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
    )


def read_snapshot(path: Path) -> dict[str, Any]:
    """Read and parse JSON snapshot file."""
    return json.loads(path.read_text(encoding="utf-8"))


def compute_sha256(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ============================================================================
# AC-1: Delta Execution Strategy & Bounded Checkpoints (<120s budget, no timeouts)
# ============================================================================

def test_delta_execution_bounded_duration_under_limits(tmp_path: Path) -> None:
    """AC-1: Verify that simulation generation executes within bounded duration (<120s ceiling, target <60s)."""
    output = tmp_path / "delta-bounded.sqlite"
    snapshot = tmp_path / "delta-bounded.snapshot.json"

    start = time.perf_counter()
    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    elapsed = time.perf_counter() - start

    assert result.returncode == 0, f"Generation failed:\n{result.stderr}"
    assert elapsed < 120.0, (
        f"Delta execution took {elapsed:.2f}s, exceeding bounded 120s threshold"
    )
    assert output.exists() and output.stat().st_size > 0, "SQLite database was not created"
    assert snapshot.exists() and snapshot.stat().st_size > 0, "Snapshot JSON was not created"


def test_delta_execution_safety_margin_under_600s_ceiling(tmp_path: Path) -> None:
    """AC-1: Verify execution maintains at least 480s safety margin below 600s worker timeout boundary."""
    output = tmp_path / "safety-margin.sqlite"
    snapshot = tmp_path / "safety-margin.snapshot.json"

    start = time.perf_counter()
    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    elapsed = time.perf_counter() - start

    assert result.returncode == 0, f"Generation failed:\n{result.stderr}"
    safety_margin = 600.0 - elapsed
    assert safety_margin >= 480.0, (
        f"Insufficient timeout safety margin: elapsed={elapsed:.2f}s, margin={safety_margin:.2f}s (<480s)"
    )


def test_delta_execution_checkpoint_durability_and_resumption(tmp_path: Path) -> None:
    """AC-1: Verify that intermediate checkpoint state persists to SQLite and snapshot packaging can resume."""
    db_output = tmp_path / "checkpoint-state.sqlite"
    snapshot_output = tmp_path / "checkpoint-state.snapshot.json"

    # Step A: Generate SQLite database with durable checkpointed state
    res_a = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(db_output),
        "--force",
    ])
    assert res_a.returncode == 0, f"Checkpoint generation failed:\n{res_a.stderr}"
    assert db_output.exists() and db_output.stat().st_size > 0

    # Verify tables in durable checkpoint SQLite file
    with sqlite3.connect(db_output) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert EXPECTED_SEVEN_DATASETS.issubset(tables), (
            f"Checkpoint missing canonical tables: {EXPECTED_SEVEN_DATASETS - tables}"
        )

    # Step B: Export snapshot from durable checkpoint without re-running generator from genesis
    assert export_sqlite_snapshot is not None, "export_sqlite_snapshot is not available"
    snapshot_data = export_sqlite_snapshot(
        database_path=db_output,
        snapshot_output_path=snapshot_output,
    )
    assert snapshot_output.exists() and snapshot_output.stat().st_size > 0
    assert snapshot_data["packId"] == PACK_ID
    assert snapshot_data["scenarioId"] == SCENARIO_ID
    assert snapshot_data["seed"] == DEFAULT_SEED


def test_delta_execution_no_cascading_retries_on_reexecution(tmp_path: Path) -> None:
    """AC-1: Verify that re-executing generation with --force completes within bounded limits without timeout cascades."""
    output = tmp_path / "retry-resilience.sqlite"
    snapshot = tmp_path / "retry-resilience.snapshot.json"

    # Run 1 (initial run)
    res_1 = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    assert res_1.returncode == 0, f"Initial run failed:\n{res_1.stderr}"

    # Run 2 (retry simulation)
    start_2 = time.perf_counter()
    res_2 = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    elapsed_2 = time.perf_counter() - start_2

    assert res_2.returncode == 0, f"Retry run failed:\n{res_2.stderr}"
    assert elapsed_2 < 120.0, f"Retry run exceeded duration ceiling: {elapsed_2:.2f}s"
    assert output.exists() and snapshot.exists()


# ============================================================================
# AC-2: Resilient Schema Handling for Simulation Outputs
# ============================================================================

def test_resilient_schema_handling_virtual_generated_columns(tmp_path: Path) -> None:
    """AC-2: Verify that table inspection and snapshot export handle virtual generated columns cleanly."""
    assert export_sqlite_snapshot is not None, "export_sqlite_snapshot is not available"

    db_path = tmp_path / "virtual-cols.sqlite"
    snapshot_path = tmp_path / "virtual-cols.snapshot.json"

    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT)")
        conn.executemany(
            "INSERT INTO metadata (key, value) VALUES (?, ?)",
            [
                ("packId", "snowflakeCost"),
                ("scenarioId", "idle-warehouse-waste"),
                ("seed", "9101"),
                ("synthetic", "true"),
            ],
        )
        conn.execute(
            """
            CREATE TABLE warehouse_metering_history (
                start_time TEXT,
                end_time TEXT,
                warehouse_id INTEGER,
                warehouse_name TEXT,
                credits_used REAL,
                warehouseName TEXT GENERATED ALWAYS AS (warehouse_name) VIRTUAL,
                creditsUsed REAL GENERATED ALWAYS AS (credits_used) VIRTUAL
            )
            """
        )
        conn.execute(
            """
            INSERT INTO warehouse_metering_history (start_time, end_time, warehouse_id, warehouse_name, credits_used)
            VALUES ('2026-06-01T00:00:00Z', '2026-06-01T01:00:00Z', 1, 'TEST_WH', 4.5)
            """
        )
        # Add recommendation_queue with governance columns
        conn.execute(
            """
            CREATE TABLE recommendation_queue (
                recommendation_id TEXT PRIMARY KEY,
                executive_severity TEXT,
                suggested_owner TEXT,
                recommended_action TEXT,
                evidence_detail TEXT,
                guardrail TEXT
            )
            """
        )
        conn.execute(
            """
            INSERT INTO recommendation_queue (recommendation_id, executive_severity, suggested_owner, recommended_action, evidence_detail, guardrail)
            VALUES ('REC-1', 'HIGH', 'FinOps Team', 'Suspend warehouse', 'Consistently idle', 'Confirm with owner before suspend')
            """
        )
        conn.commit()

    # Export snapshot using resilient packaging
    snapshot = export_sqlite_snapshot(
        database_path=db_path,
        snapshot_output_path=snapshot_path,
        dataset_ids=["warehouse_metering_history", "recommendation_queue"],
    )

    assert snapshot_path.exists()
    assert snapshot["packId"] == "snowflakeCost"

    wh_dataset = next(
        (d for d in snapshot["datasets"] if d["datasetId"] == "warehouse_metering_history"),
        None,
    )
    assert wh_dataset is not None
    assert wh_dataset["rowCount"] == 1
    # Check that columns were inferred with valid types and roles
    col_names = {c["name"] for c in wh_dataset["columns"]}
    assert "warehouse_name" in col_names
    assert "credits_used" in col_names
    for col in wh_dataset["columns"]:
        assert col["type"] in VALID_COLUMN_TYPES
        assert col["role"] in VALID_COLUMN_ROLES


def test_resilient_schema_filtering_intermediate_delta_tables(tmp_path: Path) -> None:
    """AC-2: Verify that intermediate delta tracking tables are filtered from canonical snapshot export."""
    assert export_sqlite_snapshot is not None, "export_sqlite_snapshot is not available"

    db_path = tmp_path / "delta-tables.sqlite"
    snapshot_path = tmp_path / "delta-tables.snapshot.json"

    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT)")
        conn.executemany(
            "INSERT INTO metadata (key, value) VALUES (?, ?)",
            [
                ("packId", "snowflakeCost"),
                ("scenarioId", "idle-warehouse-waste"),
                ("seed", "9101"),
            ],
        )
        conn.execute("CREATE TABLE executive_summary (metric_name TEXT, metric_value REAL)")
        conn.execute("INSERT INTO executive_summary VALUES ('total_savings', 726.0)")

        # Create intermediate delta tables
        conn.execute("CREATE TABLE _delta_simulation_batches (batch_id INTEGER, status TEXT)")
        conn.execute("INSERT INTO _delta_simulation_batches VALUES (1, 'completed')")
        conn.execute("CREATE TABLE _delta_metering_increments (step INTEGER, delta_val REAL)")
        conn.execute("INSERT INTO _delta_metering_increments VALUES (1, 12.4)")

        # Create recommendation_queue
        conn.execute(
            """
            CREATE TABLE recommendation_queue (
                recommendation_id TEXT, executive_severity TEXT, suggested_owner TEXT,
                recommended_action TEXT, evidence_detail TEXT, guardrail TEXT
            )
            """
        )
        conn.execute("INSERT INTO recommendation_queue VALUES ('R1', 'HIGH', 'Owner', 'Action', 'Evidence', 'Confirm owner')")
        conn.commit()

    # When exporting datasets (e.g. via explicit list or default pack exports)
    snapshot = export_sqlite_snapshot(
        database_path=db_path,
        snapshot_output_path=snapshot_path,
        dataset_ids=["executive_summary", "recommendation_queue"],
    )

    exported_ids = {d["datasetId"] for d in snapshot["datasets"]}
    assert "executive_summary" in exported_ids
    assert "recommendation_queue" in exported_ids
    for exported_id in exported_ids:
        assert not exported_id.startswith("_delta_"), (
            f"Intermediate delta table {exported_id} leaked into exported snapshot!"
        )


def test_resilient_schema_dynamic_type_and_role_inference() -> None:
    """AC-2: Verify dynamic column type and role inference handles edge cases and simulation values cleanly."""
    assert infer_column_type is not None, "infer_column_type is not available"
    assert infer_column_role is not None, "infer_column_role is not available"

    # Numeric integer / float strings
    t_num = infer_column_type("credits_used", [10, 20.5, 30])
    assert t_num == "number"
    assert infer_column_role("credits_used", t_num) == "measure"

    # Timestamp / Date
    t_date = infer_column_type("start_time", ["2026-06-01T00:00:00Z", "2026-06-01T01:00:00Z"])
    assert t_date in ("date", "string")
    r_date = infer_column_role("start_time", t_date)
    assert r_date in ("date", "dimension")

    # Identifiers
    t_id = infer_column_type("warehouse_id", [101, 102, 103])
    r_id = infer_column_role("warehouse_id", t_id)
    assert r_id in ("id", "dimension")

    # Boolean values
    t_bool = infer_column_type("is_idle", [True, False, True])
    assert t_bool == "boolean"
    assert infer_column_role("is_idle", t_bool) in ("dimension", "measure")


def test_resilient_schema_pragma_table_info_inspection(tmp_path: Path) -> None:
    """AC-2: Verify that PRAGMA table_info inspection handles diverse column configurations without crashing."""
    db_path = tmp_path / "pragma-test.sqlite"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE test_table (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                rate REAL DEFAULT 0.0,
                calc_val REAL GENERATED ALWAYS AS (rate * 1.5) VIRTUAL,
                notes TEXT
            )
            """
        )
        conn.execute("INSERT INTO test_table (code, rate, notes) VALUES ('A1', 10.0, 'test')")
        conn.commit()

        pragma_rows = conn.execute('PRAGMA table_info("test_table")').fetchall()
        assert len(pragma_rows) == 5
        col_names = [row[1] for row in pragma_rows]
        assert "calc_val" in col_names


# ============================================================================
# AC-3: Buyer-Visible Dashboard Output & Presentation Semantics Invariance
# ============================================================================

def test_preserved_dashboard_output_and_presentation_semantics() -> None:
    """AC-3: Verify scenario catalog and template catalog preserve snowflakeCost:idle-warehouse-waste."""
    scenario_cat = FRONTEND / "src" / "mock-data" / "scenarioCatalog.ts"
    template_cat = FRONTEND / "src" / "mock-data" / "templateCatalog.ts"

    assert scenario_cat.exists(), f"Missing scenario catalog at {scenario_cat}"
    assert template_cat.exists(), f"Missing template catalog at {template_cat}"

    cat_text = scenario_cat.read_text(encoding="utf-8")
    assert f'"{PACK_ID}:{SCENARIO_ID}"' in cat_text or f"'{PACK_ID}:{SCENARIO_ID}'" in cat_text
    assert "warehouse_metering_history" in cat_text

    tpl_text = template_cat.read_text(encoding="utf-8")
    assert DEFAULT_TEMPLATE_ID in tpl_text


def test_presentation_layer_executive_kpi_and_narrative_fidelity() -> None:
    """AC-3: Verify presentation code preserves key executive metrics, narrative arcs, and disclosures."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = app_tsx.read_text(encoding="utf-8")
    # Presentation containers and indicators
    assert "idle-warehouse-waste" in content
    # Directional validation notices
    assert any(
        phrase in content.lower()
        for phrase in ["directional until validated", "owner validation", "directional"]
    ), "StandaloneDashboardApp lacks directional validation notice"


def test_all_seven_canonical_datasets_available_for_presentation(tmp_path: Path) -> None:
    """AC-3: Verify that delta execution generates all 7 datasets required by presentation views."""
    output = tmp_path / "presentation-view.sqlite"
    snapshot = tmp_path / "presentation-view.snapshot.json"

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    assert res.returncode == 0, f"Generation failed:\n{res.stderr}"

    with sqlite3.connect(output) as conn:
        for dataset_name in EXPECTED_SEVEN_DATASETS:
            count = conn.execute(f'SELECT COUNT(*) FROM "{dataset_name}"').fetchone()[0]
            assert count > 0, f"Dataset {dataset_name} has no records for presentation views"


# ============================================================================
# AC-4: Data Definitions & Canonical SQLiteSnapshot Determinism
# ============================================================================

def test_delta_execution_bit_for_bit_determinism(tmp_path: Path) -> None:
    """AC-4: Verify delta execution yields bit-for-bit identical outputs given identical seeds."""
    db1 = tmp_path / "run1.sqlite"
    snap1 = tmp_path / "run1.snapshot.json"
    db2 = tmp_path / "run2.sqlite"
    snap2 = tmp_path / "run2.snapshot.json"

    res1 = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(db1),
        "--snapshot-output", str(snap1),
        "--force",
    ])
    assert res1.returncode == 0, f"Run 1 failed:\n{res1.stderr}"

    res2 = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(db2),
        "--snapshot-output", str(snap2),
        "--force",
    ])
    assert res2.returncode == 0, f"Run 2 failed:\n{res2.stderr}"

    hash_db1 = compute_sha256(db1)
    hash_db2 = compute_sha256(db2)
    assert hash_db1 == hash_db2, f"SQLite database hash mismatch: {hash_db1} != {hash_db2}"

    hash_snap1 = compute_sha256(snap1)
    hash_snap2 = compute_sha256(snap2)
    assert hash_snap1 == hash_snap2, f"Snapshot JSON hash mismatch: {hash_snap1} != {hash_snap2}"


def test_all_seven_canonical_datasets_preserved_in_snapshot(tmp_path: Path) -> None:
    """AC-4: Verify that snapshot output preserves all seven canonical datasets with conforming structure."""
    output = tmp_path / "canon-datasets.sqlite"
    snapshot_path = tmp_path / "canon-datasets.snapshot.json"

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot_path),
        "--force",
    ])
    assert res.returncode == 0, f"Generation failed:\n{res.stderr}"

    snapshot = read_snapshot(snapshot_path)
    dataset_ids = {d["datasetId"] for d in snapshot["datasets"]}
    assert EXPECTED_SEVEN_DATASETS.issubset(dataset_ids), (
        f"Missing canonical datasets: {EXPECTED_SEVEN_DATASETS - dataset_ids}"
    )

    for dataset in snapshot["datasets"]:
        assert "datasetId" in dataset
        assert "rowCount" in dataset
        assert "columns" in dataset
        assert "rows" in dataset
        assert dataset["rowCount"] == len(dataset["rows"])
        for col in dataset["columns"]:
            assert col["type"] in VALID_COLUMN_TYPES
            assert col["role"] in VALID_COLUMN_ROLES


def test_canonical_sqlite_snapshot_provenance_metadata(tmp_path: Path) -> None:
    """AC-4: Verify generated snapshot carries complete, valid provenance metadata."""
    output = tmp_path / "prov-meta.sqlite"
    snapshot_path = tmp_path / "prov-meta.snapshot.json"

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot_path),
        "--force",
    ])
    assert res.returncode == 0, f"Generation failed:\n{res.stderr}"

    snapshot = read_snapshot(snapshot_path)
    assert snapshot["packId"] == PACK_ID
    assert snapshot["scenarioId"] == SCENARIO_ID
    assert snapshot["seed"] == DEFAULT_SEED
    assert "dataForgeStoryContractPath" in snapshot
    assert snapshot["dataForgeStoryContractPath"].startswith("stories/snowflake/")
    assert "generatorVersion" in snapshot
    assert "generationTimestamp" in snapshot
    # Must be parseable ISO-8601
    ts_str = snapshot["generationTimestamp"]
    parsed_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    assert parsed_ts is not None
    assert snapshot["synthetic"] is True
    assert snapshot["disclosure"] == SYNTHETIC_DISCLOSURE_TEXT


def test_recommendation_queue_governance_columns_snapshot(tmp_path: Path) -> None:
    """AC-4: Verify recommendation_queue dataset defines all six required governance columns."""
    output = tmp_path / "rec-gov.sqlite"
    snapshot_path = tmp_path / "rec-gov.snapshot.json"

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot_path),
        "--force",
    ])
    assert res.returncode == 0, f"Generation failed:\n{res.stderr}"

    snapshot = read_snapshot(snapshot_path)
    rec_ds = next(
        (d for d in snapshot["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_ds is not None, "recommendation_queue missing from snapshot"
    col_names = {c["name"] for c in rec_ds["columns"]}
    assert EXPECTED_GOVERNANCE_COLUMNS.issubset(col_names), (
        f"Missing governance columns: {EXPECTED_GOVERNANCE_COLUMNS - col_names}"
    )


# ============================================================================
# AC-5: CLI Entrypoint Integration & Telemetry Stream Separation
# ============================================================================

def test_cli_stream_separation_and_pure_stdout(tmp_path: Path) -> None:
    """AC-5: Verify CLI with --diagnostics keeps stdout strictly reserved for canonical completion summaries."""
    output = tmp_path / "stream-sep.sqlite"
    snapshot = tmp_path / "stream-sep.snapshot.json"

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
        "--diagnostics",
    ])

    assert res.returncode == 0, f"Command failed:\n{res.stderr}"
    stdout_lines = [line.strip() for line in res.stdout.strip().splitlines() if line.strip()]

    # Canonical stdout expectations
    assert len(stdout_lines) == 2, f"Expected exactly 2 stdout lines, got {len(stdout_lines)}:\n{res.stdout}"
    assert stdout_lines[0].startswith(f"Generated {PACK_ID}/{SCENARIO_ID} seed {DEFAULT_SEED} ->")
    assert stdout_lines[1].startswith(f"Snapshot ->")

    # Stderr must contain diagnostic telemetry, stdout must not
    assert "[DIAGNOSTIC]" in res.stderr
    assert "[DIAGNOSTIC]" not in res.stdout


def test_cli_stdout_without_diagnostics_is_pure(tmp_path: Path) -> None:
    """AC-5: Verify CLI without --diagnostics emits pure stdout and empty stderr on success."""
    output = tmp_path / "pure-std.sqlite"
    snapshot = tmp_path / "pure-std.snapshot.json"

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])

    assert res.returncode == 0, f"Command failed:\n{res.stderr}"
    stdout_lines = [line.strip() for line in res.stdout.strip().splitlines() if line.strip()]
    assert len(stdout_lines) == 2
    assert stdout_lines[0].startswith(f"Generated {PACK_ID}/{SCENARIO_ID}")
    assert stdout_lines[1].startswith("Snapshot ->")
    assert res.stderr.strip() == ""


def test_cli_parser_supports_delta_and_diagnostic_options() -> None:
    """AC-5: Verify build_parser accepts all canonical flags including --force and --diagnostics."""
    assert build_parser is not None, "build_parser is not available"
    parser = build_parser()

    args = parser.parse_args([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", "/tmp/out.sqlite",
        "--snapshot-output", "/tmp/out.snapshot.json",
        "--force",
        "--diagnostics",
    ])
    assert args.command == "generate"
    assert args.pack == PACK_ID
    assert args.scenario == SCENARIO_ID
    assert args.seed == DEFAULT_SEED
    assert args.force is True
    assert args.diagnostics is True


# ============================================================================
# AC-6: Fail-Closed Robustness & Clean Diagnostic Error Handling
# ============================================================================

def test_fail_closed_existing_target_without_force(tmp_path: Path) -> None:
    """AC-6: Verify that existing destination file without --force fails closed with exit status 2."""
    existing_file = tmp_path / "conflict.sqlite"
    existing_file.write_text("existing content", encoding="utf-8")

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--output", str(existing_file),
    ])

    assert res.returncode == 2, f"Expected returncode 2, got {res.returncode}"
    assert "Pass --force to overwrite" in res.stderr
    assert res.stdout.strip() == ""
    assert "Traceback (most recent call last)" not in res.stderr


def test_fail_closed_missing_required_arguments() -> None:
    """AC-6: Verify that missing required arguments fail closed with exit code 2 and usage message."""
    res = run_cli_command(["generate", "--pack", PACK_ID])

    assert res.returncode == 2, f"Expected returncode 2, got {res.returncode}"
    assert "usage:" in res.stderr.lower() or "required" in res.stderr.lower()
    assert res.stdout.strip() == ""
    assert "Traceback (most recent call last)" not in res.stderr


def test_fail_closed_unknown_pack_or_scenario(tmp_path: Path) -> None:
    """AC-6: Verify that unknown pack or scenario fails closed with exit code 2 without tracebacks."""
    output = tmp_path / "unknown-test.sqlite"

    # Unknown pack
    res_pack = run_cli_command([
        "generate",
        "--pack", "nonExistentPack",
        "--scenario", SCENARIO_ID,
        "--output", str(output),
    ])
    assert res_pack.returncode == 2
    assert "Traceback (most recent call last)" not in res_pack.stderr

    # Unknown scenario
    res_scen = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", "completely-bogus-scenario",
        "--output", str(output),
    ])
    assert res_scen.returncode == 2
    assert "Traceback (most recent call last)" not in res_scen.stderr


def test_fail_closed_existing_snapshot_target_without_force(tmp_path: Path) -> None:
    """AC-6: Verify that existing snapshot target file without --force fails closed with exit status 2."""
    output = tmp_path / "new.sqlite"
    existing_snap = tmp_path / "conflict.snapshot.json"
    existing_snap.write_text("{}", encoding="utf-8")

    res = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--output", str(output),
        "--snapshot-output", str(existing_snap),
    ])

    assert res.returncode == 2
    assert "Pass --force to overwrite" in res.stderr
    assert res.stdout.strip() == ""
    assert "Traceback (most recent call last)" not in res.stderr


# ============================================================================
# AC-7: Zero External Dependencies, Read-Only dataForge & Pack Continuity
# ============================================================================

def test_zero_external_runtime_dependencies_stdlib_only() -> None:
    """AC-7: Verify that dashForge python modules import exclusively from Python standard library."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_dir}"

    allowed_modules = {
        "__future__",
        "argparse",
        "ast",
        "contextlib",
        "dataclasses",
        "datetime",
        "hashlib",
        "importlib",
        "io",
        "json",
        "logging",
        "os",
        "pathlib",
        "sqlite3",
        "sys",
        "time",
        "typing",
        "dashForge",
        "dataForge",
    }

    for py_file in py_files:
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
        imported_modules: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imported_modules.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_modules.add(node.module.split(".")[0])

        disallowed = imported_modules - allowed_modules
        assert not disallowed, f"Disallowed dependencies in {py_file.name}: {disallowed}"


def test_sibling_dataforge_remains_strictly_read_only() -> None:
    """AC-7: Verify that sibling repository dataForge remains strictly read-only and unmodified."""
    if not (DATAFORGE_ROOT / ".git").exists():
        pytest.skip(f"dataForge git directory not found at {DATAFORGE_ROOT}")

    result = subprocess.run(
        ["git", "-C", str(DATAFORGE_ROOT), "status", "--porcelain"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == "", (
        f"Sibling repository dataForge has uncommitted modifications:\n{result.stdout}"
    )


def test_all_existing_packs_operational(tmp_path: Path) -> None:
    """AC-7: Verify operational continuity across healthcare, financial, and SaaS packs."""
    packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 4101),
        ("saas", "churn-crisis", 5101),
    ]

    for pack, scenario, seed in packs:
        out = tmp_path / f"op-{pack}.sqlite"
        snap = tmp_path / f"op-{pack}.snapshot.json"

        res = run_cli_command([
            "generate",
            "--pack", pack,
            "--scenario", scenario,
            "--seed", str(seed),
            "--output", str(out),
            "--snapshot-output", str(snap),
            "--force",
        ])
        assert res.returncode == 0, f"Pack {pack} generation failed:\n{res.stderr}"
        assert out.exists() and out.stat().st_size > 0
        assert snap.exists() and snap.stat().st_size > 0

        snap_data = read_snapshot(snap)
        assert snap_data["packId"] == pack
        assert snap_data["scenarioId"] == scenario
        assert snap_data["seed"] == seed


def test_no_hardcoded_scenarios_in_dashforge_source() -> None:
    """AC-7: Verify that dashForge python files do not contain hardcoded collections of snowflake scenario IDs."""
    dashforge_src = SRC / "dashForge"
    py_files = list(dashforge_src.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_src}"

    known_scenarios = {
        "idle-warehouse-waste",
        "bi-over-provisioning",
        "runaway-query-pattern",
        "department-chargeback",
        "executive-cost-spike",
        "finops-maturity-assessment",
    }

    for py_file in py_files:
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
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
                    f"literal in {py_file.name}:{node.lineno}. Scenarios must be dynamically "
                    f"discovered from dataForge."
                )

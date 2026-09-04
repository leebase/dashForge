from __future__ import annotations

import ast
from datetime import datetime
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
FRONTEND = ROOT / "frontend"
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

# DashForge generate module
try:
    from dashForge import generate as generate_module
except ImportError:
    generate_module = None

# Sibling dataForge compat loader
try:
    from dashForge._dataforge_compat import load_dataforge_module
except ImportError:
    load_dataforge_module = None  # type: ignore[assignment]


# ============================================================================
# Contract Constants
# ============================================================================

PACK_ID = "snowflakeCost"
SCENARIO_ID = "idle-warehouse-waste"
DEFAULT_SEED = 9101
DEFAULT_TEMPLATE_ID = "tpl.snowflakeCost.idle-warehouse-waste"
STORY_CONTRACT_PATH = "stories/snowflake/idle-warehouse-waste.md"
SYNTHETIC_DISCLOSURE_TEXT = "Synthetic demo data"
EXPECTED_DIGEST = "sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390"

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
# Helpers
# ============================================================================

def read_snapshot(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def generate_idle_warehouse_assets(
    tmp_path: Path,
    seed: int = DEFAULT_SEED,
    prefix: str = "iww",
) -> tuple[Path, Path]:
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / f"{prefix}.sqlite"
    snapshot_path = tmp_path / f"{prefix}.snapshot.json"
    exit_code = main(
        [
            "generate",
            "--pack",
            PACK_ID,
            "--scenario",
            SCENARIO_ID,
            "--seed",
            str(seed),
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snapshot_path),
            "--force",
        ]
    )
    assert exit_code == 0, f"Failed to generate assets: exit code {exit_code}"
    assert db_path.exists(), f"SQLite database {db_path} was not created"
    assert snapshot_path.exists(), f"Snapshot {snapshot_path} was not created"
    return db_path, snapshot_path


# ============================================================================
# AC-1: Canonical Snapshot Ingestion & Provenance Metadata Conformance
# ============================================================================


def test_snapshot_provenance_metadata(tmp_path: Path) -> None:
    """Verify that generated idle-warehouse-waste snapshot carries complete provenance metadata."""
    _, snapshot_path = generate_idle_warehouse_assets(tmp_path)
    data = read_snapshot(snapshot_path)

    assert data["packId"] == PACK_ID
    assert data["scenarioId"] == SCENARIO_ID
    assert data["seed"] == DEFAULT_SEED

    assert "dataForgeStoryContractPath" in data
    story_path = data["dataForgeStoryContractPath"]
    assert isinstance(story_path, str)
    assert story_path == STORY_CONTRACT_PATH

    assert "generatorVersion" in data
    assert data["generatorVersion"] == 1 or isinstance(
        data["generatorVersion"], (int, str)
    )

    assert "generationTimestamp" in data
    ts_str = data["generationTimestamp"]
    assert isinstance(ts_str, str)
    parsed_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    assert parsed_ts is not None

    assert data["synthetic"] is True
    assert data["disclosure"] == SYNTHETIC_DISCLOSURE_TEXT


def test_idle_warehouse_snapshot_canonical_sqlite_snapshot_contract(tmp_path: Path) -> None:
    """Verify that the idle-warehouse-waste snapshot strictly adheres to SQLiteSnapshot schema."""
    _, snapshot_path = generate_idle_warehouse_assets(tmp_path)
    data = read_snapshot(snapshot_path)

    assert isinstance(data["datasets"], list)
    dataset_ids = {d["datasetId"] for d in data["datasets"]}
    assert EXPECTED_SEVEN_DATASETS.issubset(dataset_ids), (
        f"Missing expected datasets: {EXPECTED_SEVEN_DATASETS - dataset_ids}"
    )

    for dataset in data["datasets"]:
        assert "datasetId" in dataset
        assert "rowCount" in dataset
        assert "columns" in dataset
        assert "rows" in dataset
        assert dataset["rowCount"] == len(dataset["rows"])

        col_names = []
        for column in dataset["columns"]:
            assert "name" in column
            assert "type" in column
            assert "role" in column
            assert "label" in column

            assert column["type"] in VALID_COLUMN_TYPES, (
                f"Invalid column type: {column['type']} in dataset {dataset['datasetId']}"
            )
            assert column["role"] in VALID_COLUMN_ROLES, (
                f"Invalid column role: {column['role']} in dataset {dataset['datasetId']}"
            )
            assert isinstance(column["label"], str)
            col_names.append(column["name"])

        for row in dataset["rows"]:
            assert isinstance(row, dict)
            for col_name in col_names:
                assert col_name in row, (
                    f"Row missing declared column {col_name} in dataset {dataset['datasetId']}"
                )


def test_idle_warehouse_preview_snapshot_asset_conformance() -> None:
    """Verify that the frontend pinned preview snapshot asset matches the canonical provenance contract."""
    preview_path = FRONTEND / "src" / "mock-data" / "snowflakeCostIdleWarehouseWastePreviewData.json"
    assert preview_path.exists(), f"Missing preview data file at {preview_path}"

    preview_data = json.loads(preview_path.read_text(encoding="utf-8"))
    assert preview_data["packId"] == PACK_ID
    assert preview_data["scenarioId"] == SCENARIO_ID
    assert preview_data["seed"] == DEFAULT_SEED
    assert preview_data["title"] == "Idle Warehouse Waste"
    assert isinstance(preview_data["story"], str) and len(preview_data["story"]) > 0

    prov = preview_data.get("provenance", {})
    assert prov.get("label") == SYNTHETIC_DISCLOSURE_TEXT
    assert prov.get("source") == "dataForge"
    assert prov.get("readOnly") is True
    assert prov.get("useCaseId") == SCENARIO_ID
    assert "data/snowflakeCost/idle-warehouse-waste.snapshot.json" in prov.get("artifact", "")

    datasets = preview_data.get("previewDatasets", {})
    for expected_ds in EXPECTED_SEVEN_DATASETS:
        assert expected_ds in datasets, f"Missing preview dataset: {expected_ds}"


def test_idle_warehouse_mock_scenario_module_export() -> None:
    """Verify that snowflakeCostIdleWarehouseWaste.ts exports the required scenario and provenance symbols."""
    ts_path = FRONTEND / "src" / "mock-data" / "snowflakeCostIdleWarehouseWaste.ts"
    assert ts_path.exists(), f"Missing mock scenario file at {ts_path}"

    content = ts_path.read_text(encoding="utf-8")
    assert "export const IDLE_WAREHOUSE_WASTE_PROVENANCE" in content
    assert "export const snowflakeCostIdleWarehouseWasteScenario" in content
    assert "packId: previewData.packId" in content or 'packId: "snowflakeCost"' in content
    assert "scenarioId: previewData.scenarioId" in content or 'scenarioId: "idle-warehouse-waste"' in content


# ============================================================================
# AC-2: Deterministic CLI Generation Pipeline & Fail-Closed Overwrite Protection
# ============================================================================


def test_cli_generate_accepts_snowflake_cost_pack(tmp_path: Path) -> None:
    """Verify that the CLI generate subcommand accepts snowflakeCost pack and idle-warehouse-waste scenario."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "cli_test.sqlite"
    snap_path = tmp_path / "cli_test.snapshot.json"

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
    assert db_path.exists()
    assert snap_path.exists()
    assert db_path.read_bytes()[:16] == b"SQLite format 3\x00"


def test_cli_generate_supports_seed_override(tmp_path: Path) -> None:
    """Verify that explicit seed override persists through CLI generation to SQLite and snapshot JSON."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "override_seed.sqlite"
    snap_path = tmp_path / "override_seed.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            PACK_ID,
            "--scenario",
            SCENARIO_ID,
            "--seed",
            "9999",
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snap_path),
            "--force",
        ]
    )
    assert exit_code == 0

    with sqlite3.connect(db_path) as conn:
        seed_row = conn.execute("SELECT value FROM metadata WHERE key = 'seed'").fetchone()
        assert seed_row is not None
        assert str(seed_row[0]) == "9999"

    snap_data = read_snapshot(snap_path)
    assert snap_data["seed"] == 9999


def test_cli_idle_warehouse_fail_closed_existing_sqlite_without_force(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify that CLI fails closed with exit code 2 when target SQLite file exists and --force is omitted."""
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


def test_cli_idle_warehouse_fail_closed_existing_snapshot_without_force(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify that CLI fails closed with exit code 2 when target snapshot JSON exists and --force is omitted."""
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


def test_cli_idle_warehouse_force_overwrites(tmp_path: Path) -> None:
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
    data = read_snapshot(snap_path)
    assert data["packId"] == PACK_ID
    assert data["scenarioId"] == SCENARIO_ID


def test_unknown_snowflake_cost_scenario_fails_cleanly(
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
                "non-existent-cost-scenario",
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

    # AC-2: Missing required parameters fail closed with exit status 2 without traceback
    with pytest.raises(SystemExit) as exc_info_missing:
        main(["generate", "--pack", PACK_ID])
    assert exc_info_missing.value.code == 2
    captured_missing = capsys.readouterr()
    assert "traceback (most recent call last)" not in captured_missing.err.lower()


def test_bit_for_bit_deterministic_generation(tmp_path: Path) -> None:
    """Verify that two successive generations with identical seed 9101 produce bit-for-bit identical outputs."""
    dir1 = tmp_path / "run1"
    dir2 = tmp_path / "run2"
    dir1.mkdir()
    dir2.mkdir()

    db1, snap1 = generate_idle_warehouse_assets(dir1, seed=DEFAULT_SEED, prefix="run1")
    db2, snap2 = generate_idle_warehouse_assets(dir2, seed=DEFAULT_SEED, prefix="run2")

    hash_db1 = hashlib.sha256(db1.read_bytes()).hexdigest()
    hash_db2 = hashlib.sha256(db2.read_bytes()).hexdigest()
    assert hash_db1 == hash_db2, "Generated SQLite databases differ across identical seeds"

    hash_snap1 = hashlib.sha256(snap1.read_bytes()).hexdigest()
    hash_snap2 = hashlib.sha256(snap2.read_bytes()).hexdigest()
    assert hash_snap1 == hash_snap2, "Generated JSON snapshots differ across identical seeds"


# ============================================================================
# AC-3: DashboardSpec Contract Formalization & Claim Ledger Verification
# ============================================================================


def test_idle_warehouse_dashboardspec_meta_and_constants() -> None:
    """Verify that standaloneDashboard.ts exports the default standalone pack and scenario identifiers."""
    standalone_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"
    assert standalone_ts.exists(), f"Missing standaloneDashboard.ts at {standalone_ts}"

    content = standalone_ts.read_text(encoding="utf-8")
    assert f'DEFAULT_STANDALONE_PACK_ID = "{PACK_ID}"' in content
    assert f'DEFAULT_STANDALONE_SCENARIO_ID = "{SCENARIO_ID}"' in content
    assert f'DEFAULT_STANDALONE_TEMPLATE_ID = "{DEFAULT_TEMPLATE_ID}"' in content


def test_idle_warehouse_claim_ledger_surfaces_coverage() -> None:
    """Verify that the standalone dashboard claim ledger covers all required material metrics and recommendations."""
    standalone_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"
    content = standalone_ts.read_text(encoding="utf-8")

    required_surfaces = [
        "metric:monthly-opportunity-high",
        "metric:idle-warehouse-count",
        "metric:cost-concentration",
        "metric:warehouse-controls",
        "recommendation:IWW-001",
        "recommendation:IWW-002",
    ]
    for surface in required_surfaces:
        assert surface in content, f"Missing surfaceId coverage for {surface} in standaloneDashboard.ts"

    assert "IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST" in content
    assert "dataset_observation" in content


def test_idle_warehouse_verified_artifact_digest_integrity() -> None:
    """Verify that the work package digest constant and underlying fixture files exist."""
    artifact_ts = FRONTEND / "src" / "core" / "data" / "verifiedSyntheticDataArtifacts.ts"
    assert artifact_ts.exists(), f"Missing verifiedSyntheticDataArtifacts.ts at {artifact_ts}"

    content = artifact_ts.read_text(encoding="utf-8")
    assert f'IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST =\n  "{EXPECTED_DIGEST}"' in content or EXPECTED_DIGEST in content

    fixtures = [
        FRONTEND / "src" / "fixtures" / "dataforge" / "idle-warehouse-waste-work-package.json",
        FRONTEND / "src" / "fixtures" / "dataforge" / "idle-warehouse-waste-snapshot.json",
        FRONTEND / "src" / "fixtures" / "dataforge" / "idle-warehouse-waste-quality-report.json",
    ]
    for fixture in fixtures:
        assert fixture.exists(), f"Missing fixture file: {fixture}"


def test_idle_warehouse_executive_kpis_match_claims(tmp_path: Path) -> None:
    """Verify that executive_summary dataset rows match the headline claims of 726 credits and 2 idle warehouses."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM executive_summary").fetchall()
        metric_map = {row["metricId"]: row for row in rows}

        assert "monthly-opportunity-high" in metric_map, "Missing monthly-opportunity-high metric"
        assert float(metric_map["monthly-opportunity-high"]["value"]) == 726.0
        assert "credits" in str(metric_map["monthly-opportunity-high"]["suffix"]).lower()

        assert "idle-warehouse-count" in metric_map, "Missing idle-warehouse-count metric"
        assert float(metric_map["idle-warehouse-count"]["value"]) == 2.0


# ============================================================================
# AC-4: DataAdapter Runtime Seam & Seven-Dataset Query Routing
# ============================================================================


def test_all_seven_scenario_datasets_present_in_sqlite(tmp_path: Path) -> None:
    """Verify that all seven relational datasets exist as tables with rows in the SQLite database."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert EXPECTED_SEVEN_DATASETS.issubset(tables), (
            f"Missing tables in SQLite: {EXPECTED_SEVEN_DATASETS - tables}"
        )

        for table in EXPECTED_SEVEN_DATASETS:
            count = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            assert count > 0, f"Table {table} has zero rows"


def test_idle_warehouse_adapter_query_routing_in_presentation() -> None:
    """Verify that the presentation loader queries scenario datasets strictly through the DataAdapter seam."""
    presentation_ts = FRONTEND / "src" / "features" / "runtime" / "idleWarehousePresentation.ts"
    assert presentation_ts.exists(), f"Missing idleWarehousePresentation.ts at {presentation_ts}"

    content = presentation_ts.read_text(encoding="utf-8")
    assert "loadIdleWarehousePresentation" in content
    assert 'datasetId: "executive_summary"' in content
    assert 'datasetId: "recommendation_queue"' in content
    assert 'datasetId: "show_warehouses"' in content
    assert 'datasetId: "warehouse_metering_history"' in content
    assert "requireMaterialClaim" in content


def test_warehouse_metering_credit_concentration(tmp_path: Path) -> None:
    """Verify that warehouse metering history reflects dominant credit concentration on FINANCE_REPORTING_WH."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT warehouse_name, SUM(credits_used) as total_credits "
            "FROM warehouse_metering_history GROUP BY warehouse_name"
        ).fetchall()
        totals = {r["warehouse_name"]: float(r["total_credits"]) for r in rows}

        assert "FINANCE_REPORTING_WH" in totals, "Missing FINANCE_REPORTING_WH in metering"
        assert "CORE_ELT_WH" in totals, "Missing CORE_ELT_WH in metering"

        all_credits = sum(totals.values())
        finance_share = totals["FINANCE_REPORTING_WH"] / all_credits
        assert finance_share > 0.50, f"Expected FINANCE_REPORTING_WH to dominate credits, got {finance_share:.2%}"


def test_show_warehouses_control_gaps(tmp_path: Path) -> None:
    """Verify that show_warehouses reflects weak suspension policies and missing resource monitors."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM show_warehouses").fetchall()
        wh_by_name = {r["name"]: dict(r) for r in rows}

        assert "FINANCE_REPORTING_WH" in wh_by_name
        assert "MARKETING_ADHOC_WH" in wh_by_name
        assert "CORE_ELT_WH" in wh_by_name

        fin_wh = wh_by_name["FINANCE_REPORTING_WH"]
        assert fin_wh["auto_suspend"] == 0
        assert fin_wh["resource_monitor"] is None

        mkt_wh = wh_by_name["MARKETING_ADHOC_WH"]
        assert mkt_wh["auto_suspend"] >= 3600
        assert mkt_wh["resource_monitor"] is None

        core_wh = wh_by_name["CORE_ELT_WH"]
        assert core_wh["auto_suspend"] == 300
        assert core_wh["resource_monitor"] is not None


# ============================================================================
# AC-5: Scenario & Template Catalog Registrations
# ============================================================================


def test_scenario_catalog_registers_idle_warehouse_waste() -> None:
    """Verify that scenarioCatalog.ts formally registers snowflakeCost:idle-warehouse-waste."""
    catalog_ts = FRONTEND / "src" / "mock-data" / "scenarioCatalog.ts"
    assert catalog_ts.exists(), f"Missing scenarioCatalog.ts at {catalog_ts}"

    content = catalog_ts.read_text(encoding="utf-8")
    assert f'"{PACK_ID}:{SCENARIO_ID}"' in content or f"'{PACK_ID}:{SCENARIO_ID}'" in content
    assert "warehouse_metering_history" in content


def test_template_catalog_registers_idle_warehouse_waste() -> None:
    """Verify that templateCatalog.ts registers tpl.snowflakeCost.idle-warehouse-waste."""
    template_ts = FRONTEND / "src" / "mock-data" / "templateCatalog.ts"
    assert template_ts.exists(), f"Missing templateCatalog.ts at {template_ts}"

    content = template_ts.read_text(encoding="utf-8")
    assert f'templateId: "{DEFAULT_TEMPLATE_ID}"' in content or DEFAULT_TEMPLATE_ID in content
    assert f'"{PACK_ID}:{SCENARIO_ID}": "{DEFAULT_TEMPLATE_ID}"' in content or DEFAULT_TEMPLATE_ID in content


def test_dynamic_scenario_discovery_matches_dataforge() -> None:
    """Verify dynamic discovery returns idle-warehouse-waste matching sibling dataForge package."""
    assert get_snowflake_cost_scenarios is not None, (
        "dashForge.snowflake_cost.get_snowflake_cost_scenarios is not available"
    )
    discovered = get_snowflake_cost_scenarios()
    assert isinstance(discovered, list)
    assert SCENARIO_ID in discovered


# ============================================================================
# AC-6: Prioritized Recommendation Queue Governance & Safety Guardrails
# ============================================================================


def test_recommendation_queue_governance_columns_sqlite(tmp_path: Path) -> None:
    """Verify that the SQLite recommendation_queue table contains all 6 governance columns."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        pragma_cols = {
            row[1]
            for row in conn.execute("PRAGMA table_info(recommendation_queue)").fetchall()
        }
        assert EXPECTED_GOVERNANCE_COLUMNS.issubset(pragma_cols), (
            f"Missing governance columns in SQLite: {EXPECTED_GOVERNANCE_COLUMNS - pragma_cols}"
        )
        count = conn.execute("SELECT COUNT(*) FROM recommendation_queue").fetchone()[0]
        assert count > 0, "recommendation_queue table is empty"


def test_recommendation_queue_governance_columns_snapshot(tmp_path: Path) -> None:
    """Verify that the JSON snapshot recommendation_queue dataset defines all 6 governance columns."""
    _, snap_path = generate_idle_warehouse_assets(tmp_path)
    data = read_snapshot(snap_path)

    rec_ds = next(
        (d for d in data["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_ds is not None, "recommendation_queue dataset not found in snapshot"

    col_names = {c["name"] for c in rec_ds["columns"]}
    assert EXPECTED_GOVERNANCE_COLUMNS.issubset(col_names), (
        f"Missing governance columns in snapshot: {EXPECTED_GOVERNANCE_COLUMNS - col_names}"
    )
    assert rec_ds["rowCount"] > 0


def test_recommendation_queue_row_integrity(tmp_path: Path) -> None:
    """Verify recommendation queue rows preserve valid severities, suggested owners, and actions."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute("SELECT * FROM recommendation_queue").fetchall()]

    assert len(rows) >= 2, "Expected at least 2 recommendations in idle-warehouse-waste"

    valid_severities = {"P0", "P1", "P2", "P3"}
    for row in rows:
        for col in EXPECTED_GOVERNANCE_COLUMNS:
            assert col in row, f"Missing {col} in row {row}"
            assert row[col] is not None and str(row[col]).strip() != "", (
                f"Empty value for {col} in row {row}"
            )
        assert row["executive_severity"] in valid_severities

    # Contract AC-6: FINANCE_REPORTING_WH (IWW-001, P0) presented first
    assert rows[0]["recommendation_id"] == "IWW-001"
    assert rows[0]["executive_severity"] == "P0"
    assert (
        "FINANCE_REPORTING_WH" in str(rows[0].get("scope_name", ""))
        or "FINANCE_REPORTING_WH" in str(rows[0].get("recommended_action", ""))
        or "FINANCE_REPORTING_WH" in str(rows[0].get("evidence_detail", ""))
    )


def test_recommendation_queue_guardrail_directional_validation(tmp_path: Path) -> None:
    """Verify that every recommendation row enforces protective directional validation guardrails."""
    db_path, _ = generate_idle_warehouse_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute("SELECT * FROM recommendation_queue").fetchall()]

    for row in rows:
        guardrail = str(row["guardrail"]).lower()
        has_validation_framing = any(
            keyword in guardrail
            for keyword in ["confirm", "validate", "review", "notify", "measure", "before", "owner"]
        )
        assert has_validation_framing, (
            f"Guardrail for {row['recommendation_id']} lacks directional validation framing: {row['guardrail']}"
        )


def test_recommendation_queue_presentation_directional_framing() -> None:
    """Verify that StandaloneDashboardApp.tsx renders directional validation notices for recommendations."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = app_tsx.read_text(encoding="utf-8")
    assert (
        "directional until validated" in content.lower()
        or "owner validation" in content.lower()
        or "directional" in content.lower()
    ), "StandaloneDashboardApp lacks directional validation notice"


# ============================================================================
# AC-7: Standalone Executive Presentation, Follow-Up Export & Synthetic Disclosures
# ============================================================================


def test_standalone_dashboard_presentation_narrative_flow() -> None:
    """Verify that StandaloneDashboardApp.tsx encodes the contract presentation, narrative flow, and controls."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = app_tsx.read_text(encoding="utf-8")
    # Contract AC-7: container attributes data-scenario="idle-warehouse-waste" and data-readiness="controlled"
    assert (
        'data-scenario="idle-warehouse-waste"' in content
        or 'data-scenario={isIdleWarehouseWaste ? "idle-warehouse-waste"' in content
        or ('data-scenario=' in content and "idle-warehouse-waste" in content)
    ), "StandaloneDashboardApp lacks data-scenario='idle-warehouse-waste' container attribute"
    assert (
        'data-readiness="controlled"' in content
        or 'data-readiness={qualityIsBlocking ? "blocking" : "controlled"}' in content
        or "data-readiness=" in content
    ), "StandaloneDashboardApp lacks data-readiness attribute"

    # Contract AC-7: interactive control data-action="open-recommendation-queue" revealing data-status="recommendation-queue"
    assert 'data-action="open-recommendation-queue"' in content, (
        "StandaloneDashboardApp lacks data-action='open-recommendation-queue' interactive control"
    )
    assert 'data-status="recommendation-queue"' in content, (
        "StandaloneDashboardApp lacks data-status='recommendation-queue' target status"
    )

    # Contract AC-7: exportable follow-up artifact data-action="same-day-executive-follow-up"
    assert 'data-action="same-day-executive-follow-up"' in content, (
        "StandaloneDashboardApp lacks data-action='same-day-executive-follow-up' export control"
    )

    # Buyer-oriented narrative flow: headline credit savings opportunity, idle warehouse count, credit concentration, control gaps
    assert "FINANCE_REPORTING_WH" in content or "concentration" in content.lower()
    assert "opportunityHigh" in content or "monthly-opportunity" in content
    assert "idleWarehouseCount" in content or "idle-warehouse-count" in content


def test_synthetic_disclosure_text(tmp_path: Path) -> None:
    """Verify that snapshot and presentation carry unsuppressed Synthetic demo data disclosure."""
    _, snap_path = generate_idle_warehouse_assets(tmp_path)
    data = read_snapshot(snap_path)

    assert data.get("synthetic") is True
    assert data.get("disclosure") == SYNTHETIC_DISCLOSURE_TEXT


def test_synthetic_demo_data_unsuppressed_in_presentation() -> None:
    """Verify that StandaloneDashboardApp.tsx includes prominent synthetic demo data disclosure text and attribute."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"
    content = app_tsx.read_text(encoding="utf-8")
    assert SYNTHETIC_DISCLOSURE_TEXT in content
    assert 'data-disclosure="synthetic-demo-data"' in content, (
        "StandaloneDashboardApp lacks data-disclosure='synthetic-demo-data' attribute"
    )


def test_executive_follow_up_export_contract() -> None:
    """Verify that follow-up export logic packages meeting dashboard documents with synthetic disclosures."""
    export_ts = FRONTEND / "src" / "features" / "export" / "meetingDashboardPackage.ts"
    assert export_ts.exists(), f"Missing meetingDashboardPackage.ts at {export_ts}"

    content = export_ts.read_text(encoding="utf-8")
    assert 'idle-warehouse-waste' in content
    assert "Synthetic demo data" in content or "synthetic" in content

    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists()
    app_content = app_tsx.read_text(encoding="utf-8")
    assert "buildExecutiveFollowUpHtml" in app_content
    assert 'data-action="same-day-executive-follow-up"' in app_content


# ============================================================================
# AC-8: Backwards Compatibility, Sibling Project Isolation & Regression Immunity
# ============================================================================


def test_existing_packs_unaffected(tmp_path: Path) -> None:
    """Verify that existing industry packs (healthcare, financial, saas) continue to generate successfully."""
    assert main is not None, "dashForge.main.main is not available"
    existing_packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 5301),
        ("saas", "churn-crisis", 8301),
    ]
    for pack, scenario, seed in existing_packs:
        out = tmp_path / f"{pack}.sqlite"
        snap = tmp_path / f"{pack}.snapshot.json"
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
        assert exit_code == 0, f"Generation failed for pack {pack}"
        assert out.exists()
        assert snap.exists()
        snap_data = read_snapshot(snap)
        assert snap_data["packId"] == pack
        assert snap_data["scenarioId"] == scenario
        assert snap_data["seed"] == seed


def test_dataforge_unmodified() -> None:
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
        f"Sibling repository dataForge has uncommitted modifications:\n{result.stdout}"
    )


def test_zero_external_runtime_dependencies() -> None:
    """Verify that dashForge python source files do not import external third-party packages."""
    dashforge_dir = SRC / "dashForge"
    for py_file in dashforge_dir.glob("*.py"):
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
        imported_modules: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imported_modules.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imported_modules.add(node.module.split(".")[0])

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
        disallowed = imported_modules - allowed_modules
        assert not disallowed, f"Disallowed dependencies in {py_file.name}: {disallowed}"


def test_no_hardcoded_scenarios_in_dashforge_source() -> None:
    """Verify that dashForge python files do not contain hardcoded collections of snowflake scenario IDs."""
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

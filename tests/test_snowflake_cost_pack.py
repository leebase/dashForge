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

# DashForge snowflake_cost extension module (to be implemented in step_05)
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


def read_snapshot(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


EXPECTED_SNOWFLAKE_DATASETS = {
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

KNOWN_SNOWFLAKE_SCENARIOS = {
    "idle-warehouse-waste",
    "bi-over-provisioning",
    "runaway-query-pattern",
    "department-chargeback",
    "executive-cost-spike",
    "finops-maturity-assessment",
}


# ============================================================================
# AC-1: CLI Flag & Subcommand Routing
# ============================================================================


def test_cli_generate_accepts_snowflake_cost_pack(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "idle-warehouse-waste.sqlite"
    snapshot = tmp_path / "idle-warehouse-waste.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )

    assert exit_code == 0
    assert output.exists(), "SQLite database was not created"
    assert snapshot.exists(), "Snapshot JSON was not created"

    data = read_snapshot(snapshot)
    assert data["packId"] == "snowflakeCost"
    assert data["scenarioId"] == "idle-warehouse-waste"
    assert data["seed"] == 9101
    assert isinstance(data["datasets"], list)
    assert len(data["datasets"]) >= 7


def test_cli_generate_supports_seed_override(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "custom-seed.sqlite"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9999",
            "--output",
            str(output),
            "--force",
        ]
    )

    assert exit_code == 0
    assert output.exists()

    with sqlite3.connect(output) as conn:
        seed_val = conn.execute(
            "SELECT value FROM metadata WHERE key = 'seed'"
        ).fetchone()[0]
        assert str(seed_val) == "9999"


def test_cli_flags_passthrough(tmp_path: Path) -> None:
    assert build_parser is not None, "dashForge.main.build_parser is not available"
    parser = build_parser()
    output = tmp_path / "test.sqlite"
    snapshot = tmp_path / "test.snapshot.json"

    args = parser.parse_args(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )

    assert args.command == "generate"
    assert args.pack == "snowflakeCost"
    assert args.scenario == "idle-warehouse-waste"
    assert args.seed == 9101
    assert args.output == str(output)
    assert args.snapshot_output == str(snapshot)
    assert args.force is True


# ============================================================================
# AC-2: Dynamic Scenario Discovery & Validation
# ============================================================================


def test_dynamic_scenario_discovery_matches_dataforge() -> None:
    assert get_snowflake_cost_scenarios is not None, (
        "dashForge.snowflake_cost.get_snowflake_cost_scenarios is not available"
    )
    assert load_dataforge_module is not None, (
        "dashForge._dataforge_compat.load_dataforge_module is not available"
    )
    df_gen = load_dataforge_module("generate")
    pack = df_gen.load_pack("snowflakeCost")
    expected_scenarios = [s["scenarioId"] for s in pack["scenarios"]]

    discovered = get_snowflake_cost_scenarios()
    assert isinstance(discovered, list)
    assert discovered == expected_scenarios
    assert KNOWN_SNOWFLAKE_SCENARIOS.issubset(set(discovered))


def test_no_hardcoded_scenarios_in_dashforge_source() -> None:
    dashforge_src = SRC / "dashForge"
    py_files = list(dashforge_src.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_src}"

    for py_file in py_files:
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
        for node in ast.walk(tree):
            if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
                string_elements = {
                    elt.value
                    for elt in node.elts
                    if isinstance(elt, ast.Constant) and isinstance(elt.value, str)
                }
                hardcoded = string_elements.intersection(KNOWN_SNOWFLAKE_SCENARIOS)
                assert not hardcoded, (
                    f"Found hardcoded snowflake scenario(s) {hardcoded} in collection "
                    f"literal in {py_file.name}:{node.lineno}. Scenarios must be dynamically "
                    f"discovered from dataForge."
                )


def test_unknown_snowflake_cost_scenario_fails_cleanly(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    out = tmp_path / "unknown-scenario.sqlite"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--scenario",
                "non-existent-scenario-id",
                "--output",
                str(out),
                "--force",
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    err_lower = captured.err.lower()
    assert "unknown" in err_lower and "scenario" in err_lower
    assert "traceback (most recent call last)" not in captured.err.lower()
    assert "traceback (most recent call last)" not in captured.out.lower()


def test_dynamic_scenarios_generate_successfully(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    cases = [
        ("bi-over-provisioning", 9102),
        ("finops-maturity-assessment", 9106),
    ]
    for scenario, seed in cases:
        out = tmp_path / f"{scenario}.sqlite"
        snap = tmp_path / f"{scenario}.snapshot.json"
        exit_code = main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
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
        assert exit_code == 0
        assert out.exists(), f"SQLite database not created for scenario {scenario}"
        assert snap.exists(), f"Snapshot JSON not created for scenario {scenario}"
        snap_data = read_snapshot(snap)
        assert snap_data["packId"] == "snowflakeCost"
        assert snap_data["scenarioId"] == scenario
        assert snap_data["seed"] == seed


# ============================================================================
# AC-3: Fail-Closed Input & Argument Validation
# ============================================================================


def test_missing_required_scenario_flag(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--output",
                str(tmp_path / "out.sqlite"),
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "required" in captured.err.lower()
    assert "traceback (most recent call last)" not in captured.err.lower()


def test_missing_required_output_flag(
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--scenario",
                "idle-warehouse-waste",
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "required" in captured.err.lower()
    assert "traceback (most recent call last)" not in captured.err.lower()


def test_invalid_pack_choice(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "nonExistentPack",
                "--scenario",
                "idle-warehouse-waste",
                "--output",
                str(tmp_path / "out.sqlite"),
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "invalid choice" in captured.err.lower()
    assert "traceback (most recent call last)" not in captured.err.lower()


def test_clean_diagnostic_no_traceback_on_error(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    bad_invocations = [
        ["generate"],
        ["generate", "--pack", "snowflakeCost"],
        [
            "generate",
            "--pack",
            "unknownPack",
            "--scenario",
            "idle-warehouse-waste",
            "--output",
            str(tmp_path / "1.sqlite"),
        ],
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "non-existent-scenario",
            "--output",
            str(tmp_path / "2.sqlite"),
        ],
    ]
    for inv in bad_invocations:
        with pytest.raises(SystemExit) as exit_info:
            main(inv)
        assert exit_info.value.code == 2
        captured = capsys.readouterr()
        assert "traceback (most recent call last)" not in captured.err.lower(), (
            f"Traceback found in stderr for invocation {inv}: {captured.err}"
        )
        assert "traceback (most recent call last)" not in captured.out.lower()


# ============================================================================
# AC-4: Fail-Closed Overwrite Protection
# ============================================================================


def test_fail_closed_when_output_sqlite_exists(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "existing-target.sqlite"
    output.write_text("existing dummy sqlite content", encoding="utf-8")

    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--scenario",
                "idle-warehouse-waste",
                "--output",
                str(output),
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "output path already exists. pass --force to overwrite" in captured.err.lower()


def test_fail_closed_when_snapshot_output_exists(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "new-target.sqlite"
    snapshot = tmp_path / "existing-target.snapshot.json"
    snapshot.write_text("{}", encoding="utf-8")

    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--scenario",
                "idle-warehouse-waste",
                "--output",
                str(output),
                "--snapshot-output",
                str(snapshot),
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "output path already exists. pass --force to overwrite" in captured.err.lower()


def test_force_flag_allows_overwriting(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "force-target.sqlite"
    snapshot = tmp_path / "force-target.snapshot.json"
    output.write_text("existing content", encoding="utf-8")
    snapshot.write_text("existing content", encoding="utf-8")

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )

    assert exit_code == 0
    assert output.exists()
    assert snapshot.exists()
    assert output.read_bytes()[:16] == b"SQLite format 3\x00"
    data = read_snapshot(snapshot)
    assert data["packId"] == "snowflakeCost"
    assert data["scenarioId"] == "idle-warehouse-waste"


def test_requires_force_to_overwrite_existing_outputs(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "snowflake-overwrite.sqlite"
    snapshot = tmp_path / "snowflake-overwrite.snapshot.json"

    # First generation succeeds
    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    # Second generation targeting existing files without --force fails closed
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--scenario",
                "idle-warehouse-waste",
                "--seed",
                "9101",
                "--output",
                str(output),
                "--snapshot-output",
                str(snapshot),
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "output path already exists. pass --force to overwrite" in captured.err.lower()

    # Third generation with --force succeeds
    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0


# ============================================================================
# AC-5: Determinism & Canonical SQLiteSnapshot Schema Conformance
# ============================================================================


def test_bit_for_bit_deterministic_generation(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    dir1 = tmp_path / "run1"
    dir2 = tmp_path / "run2"
    dir1.mkdir()
    dir2.mkdir()

    output1 = dir1 / "snowflake.sqlite"
    snapshot1 = dir1 / "snowflake.snapshot.json"
    output2 = dir2 / "snowflake.sqlite"
    snapshot2 = dir2 / "snowflake.snapshot.json"

    exit1 = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output1),
            "--snapshot-output",
            str(snapshot1),
            "--force",
        ]
    )
    exit2 = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output2),
            "--snapshot-output",
            str(snapshot2),
            "--force",
        ]
    )

    assert exit1 == 0
    assert exit2 == 0

    hash_db1 = hashlib.sha256(output1.read_bytes()).hexdigest()
    hash_db2 = hashlib.sha256(output2.read_bytes()).hexdigest()
    assert hash_db1 == hash_db2, "Generated SQLite databases differ across identical seeds"

    hash_snap1 = hashlib.sha256(snapshot1.read_bytes()).hexdigest()
    hash_snap2 = hashlib.sha256(snapshot2.read_bytes()).hexdigest()
    assert hash_snap1 == hash_snap2, "Generated JSON snapshots differ across identical seeds"

    assert read_snapshot(snapshot1) == read_snapshot(snapshot2)


def test_snapshot_schema_conformance(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "schema-conformance.sqlite"
    snapshot = tmp_path / "schema-conformance.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    data = read_snapshot(snapshot)
    assert "packId" in data
    assert "scenarioId" in data
    assert "seed" in data
    assert "datasets" in data

    assert data["packId"] == "snowflakeCost"
    assert data["scenarioId"] == "idle-warehouse-waste"
    assert data["seed"] == 9101
    assert isinstance(data["datasets"], list)

    dataset_ids = {d["datasetId"] for d in data["datasets"]}
    assert EXPECTED_SNOWFLAKE_DATASETS.issubset(dataset_ids), (
        f"Missing expected datasets: {EXPECTED_SNOWFLAKE_DATASETS - dataset_ids}"
    )

    for dataset in data["datasets"]:
        assert "datasetId" in dataset
        assert "rowCount" in dataset
        assert "columns" in dataset
        assert "rows" in dataset
        assert dataset["rowCount"] == len(dataset["rows"])


def test_column_definitions_and_roles(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "columns-check.sqlite"
    snapshot = tmp_path / "columns-check.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    data = read_snapshot(snapshot)
    valid_types = {"string", "number", "date", "boolean"}
    valid_roles = {"dimension", "measure", "date", "id"}

    for dataset in data["datasets"]:
        column_names = []
        for column in dataset["columns"]:
            assert "name" in column
            assert "type" in column
            assert "role" in column
            assert "label" in column

            assert column["type"] in valid_types, (
                f"Invalid column type: {column['type']} in dataset {dataset['datasetId']}"
            )
            assert column["role"] in valid_roles, (
                f"Invalid column role: {column['role']} in dataset {dataset['datasetId']}"
            )
            assert isinstance(column["label"], str)
            column_names.append(column["name"])

        for row in dataset["rows"]:
            assert isinstance(row, dict)
            for col_name in column_names:
                assert col_name in row, (
                    f"Row missing expected column {col_name} in dataset {dataset['datasetId']}"
                )


def test_snapshot_rows_match_sqlite_tables(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "match-tables.sqlite"
    snapshot = tmp_path / "match-tables.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    snapshot_data = read_snapshot(snapshot)

    with sqlite3.connect(output) as conn:
        conn.row_factory = sqlite3.Row
        for dataset in snapshot_data["datasets"]:
            dataset_id = dataset["datasetId"]
            db_rows = [
                dict(r) for r in conn.execute(f'SELECT * FROM "{dataset_id}"').fetchall()
            ]
            assert len(dataset["rows"]) == len(db_rows), (
                f"Row count mismatch for dataset {dataset_id}: "
                f"{len(dataset['rows'])} vs {len(db_rows)}"
            )
            for snap_row, db_row in zip(dataset["rows"], db_rows):
                for key, val in snap_row.items():
                    assert key in db_row, f"Column {key} in snapshot not in db"
                    assert val == db_row[key], (
                        f"Value mismatch in {dataset_id}.{key}: {val} != {db_row[key]}"
                    )


# ============================================================================
# AC-6: Provenance Metadata & Synthetic Data Disclosure
# ============================================================================


def test_snapshot_provenance_metadata(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "provenance.sqlite"
    snapshot = tmp_path / "provenance.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    data = read_snapshot(snapshot)
    assert data["packId"] == "snowflakeCost"
    assert data["scenarioId"] == "idle-warehouse-waste"
    assert data["seed"] == 9101

    assert "dataForgeStoryContractPath" in data
    story_path = data["dataForgeStoryContractPath"]
    assert isinstance(story_path, str)
    assert "idle-warehouse-waste" in story_path
    assert story_path.startswith("stories/snowflake/")

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
    assert data["disclosure"] == "Synthetic demo data"


def test_synthetic_disclosure_text(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "disclosure.sqlite"
    snapshot = tmp_path / "disclosure.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    data = read_snapshot(snapshot)
    assert data.get("synthetic") is True
    assert data.get("disclosure") == "Synthetic demo data"


# ============================================================================
# AC-7: Recommendation Queue Dataset Preservation & Column Integrity
# ============================================================================


def test_recommendation_queue_governance_columns_sqlite(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "rec-sqlite.sqlite"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--force",
        ]
    )
    assert exit_code == 0

    with sqlite3.connect(output) as conn:
        cursor = conn.execute("PRAGMA table_info(recommendation_queue)")
        cols = {row[1] for row in cursor.fetchall()}
        assert EXPECTED_GOVERNANCE_COLUMNS.issubset(cols), (
            f"Missing required governance columns in SQLite recommendation_queue: "
            f"{EXPECTED_GOVERNANCE_COLUMNS - cols}"
        )
        count = conn.execute("SELECT COUNT(*) FROM recommendation_queue").fetchone()[0]
        assert count > 0, "recommendation_queue table in SQLite is empty"


def test_recommendation_queue_governance_columns_snapshot(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "rec-snap.sqlite"
    snapshot = tmp_path / "rec-snap.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    data = read_snapshot(snapshot)
    rec_ds = next(
        (d for d in data["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_ds is not None, "recommendation_queue dataset not found in snapshot"

    col_names = {c["name"] for c in rec_ds["columns"]}
    assert EXPECTED_GOVERNANCE_COLUMNS.issubset(col_names), (
        f"Missing required governance columns in snapshot recommendation_queue: "
        f"{EXPECTED_GOVERNANCE_COLUMNS - col_names}"
    )
    assert rec_ds["rowCount"] > 0


def test_recommendation_queue_row_integrity(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "rec-integrity.sqlite"
    snapshot = tmp_path / "rec-integrity.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0

    data = read_snapshot(snapshot)
    rec_ds = next(
        d for d in data["datasets"] if d["datasetId"] == "recommendation_queue"
    )
    rows = rec_ds["rows"]
    assert len(rows) > 0, "No rows in recommendation_queue"

    valid_severities = {"P0", "P1", "P2", "P3"}
    for row in rows:
        for col in EXPECTED_GOVERNANCE_COLUMNS:
            assert col in row, f"Row missing {col}"
            assert row[col] is not None and str(row[col]).strip() != "", (
                f"Column {col} has empty/null value in row {row}"
            )
        assert row["executive_severity"] in valid_severities, (
            f"Unexpected severity: {row['executive_severity']}"
        )


# ============================================================================
# AC-8: Backwards Compatibility, Regression Immunity & Bound Preservation
# ============================================================================


def test_existing_packs_unaffected(tmp_path: Path) -> None:
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
        assert exit_code == 0
        assert out.exists(), f"SQLite database not created for pack {pack}"
        assert snap.exists(), f"Snapshot JSON not created for pack {pack}"
        data = read_snapshot(snap)
        assert data["packId"] == pack
        assert data["scenarioId"] == scenario
        assert data["seed"] == seed


def test_dataforge_unmodified() -> None:
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


# ============================================================================
# Programmatic Unit Tests & Module Interfaces
# ============================================================================


def test_snowflake_cost_module_interface() -> None:
    assert snowflake_cost_module is not None, (
        "dashForge.snowflake_cost module is not yet available"
    )
    assert hasattr(snowflake_cost_module, "get_snowflake_cost_scenarios")
    assert hasattr(snowflake_cost_module, "validate_snowflake_cost_scenario")
    assert hasattr(snowflake_cost_module, "enrich_snowflake_cost_provenance")
    assert hasattr(snowflake_cost_module, "validate_recommendation_queue_schema")


def test_validate_snowflake_cost_scenario() -> None:
    assert validate_snowflake_cost_scenario is not None, (
        "dashForge.snowflake_cost.validate_snowflake_cost_scenario is not available"
    )
    scenario_info = validate_snowflake_cost_scenario("idle-warehouse-waste")
    assert isinstance(scenario_info, dict)
    assert scenario_info.get("scenarioId") == "idle-warehouse-waste"

    with pytest.raises(ValueError) as err_info:
        validate_snowflake_cost_scenario("non-existent-scenario")
    assert "unknown" in str(err_info.value).lower()


def test_validate_recommendation_queue_schema() -> None:
    assert validate_recommendation_queue_schema is not None, (
        "dashForge.snowflake_cost.validate_recommendation_queue_schema is not available"
    )
    conn = sqlite3.connect(":memory:")
    try:
        conn.execute(
            """
            CREATE TABLE recommendation_queue (
                recommendation_id TEXT,
                executive_severity TEXT,
                suggested_owner TEXT,
                recommended_action TEXT,
                evidence_detail TEXT,
                guardrail TEXT
            )
            """
        )
        # Should succeed without raising
        validate_recommendation_queue_schema(conn)

        # Table missing a required column
        conn.execute("DROP TABLE recommendation_queue")
        conn.execute(
            """
            CREATE TABLE recommendation_queue (
                recommendation_id TEXT,
                executive_severity TEXT
            )
            """
        )
        with pytest.raises((ValueError, AssertionError)):
            validate_recommendation_queue_schema(conn)
    finally:
        conn.close()


def test_programmatic_package_snapshot_snowflake_cost(tmp_path: Path) -> None:
    assert pkg_snapshot_module is not None, (
        "dashForge.package_snapshot is not available"
    )
    output = tmp_path / "prog-snowflake.sqlite"
    snapshot = tmp_path / "prog-snowflake.snapshot.json"

    result = pkg_snapshot_module.package_snapshot(
        pack="snowflakeCost",
        scenario="idle-warehouse-waste",
        seed=9101,
        output_path=output,
        snapshot_output_path=snapshot,
        force=True,
    )

    assert output.exists(), "Programmatic SQLite output was not created"
    assert snapshot.exists(), "Programmatic JSON snapshot was not created"
    assert isinstance(result, dict)
    assert result.get("packId") == "snowflakeCost"
    assert result.get("scenarioId") == "idle-warehouse-waste"


def test_enrich_snowflake_cost_provenance_unit() -> None:
    assert enrich_snowflake_cost_provenance is not None, (
        "dashForge.snowflake_cost.enrich_snowflake_cost_provenance is not available"
    )
    base_snapshot: dict[str, Any] = {
        "packId": "snowflakeCost",
        "scenarioId": "idle-warehouse-waste",
        "seed": 9101,
        "datasets": [],
    }
    enriched = enrich_snowflake_cost_provenance(
        snapshot=base_snapshot,
        scenario_id="idle-warehouse-waste",
        seed=9101,
    )
    assert enriched["synthetic"] is True
    assert enriched["disclosure"] == "Synthetic demo data"
    assert "dataForgeStoryContractPath" in enriched
    assert enriched["dataForgeStoryContractPath"] == "stories/snowflake/idle-warehouse-waste.md"
    assert "generatorVersion" in enriched
    assert "generationTimestamp" in enriched


def test_generate_module_reexports() -> None:
    try:
        import dashForge.generate as gen_mod
    except ImportError:
        pytest.fail("dashForge.generate could not be imported")

    assert hasattr(gen_mod, "generate_snowflake_cost_database"), (
        "dashForge.generate must re-export generate_snowflake_cost_database"
    )
    assert hasattr(gen_mod, "get_snowflake_cost_scenarios"), (
        "dashForge.generate must re-export get_snowflake_cost_scenarios"
    )


def test_cli_subprocess_invocation(tmp_path: Path) -> None:
    output = tmp_path / "cli-subp.sqlite"
    snapshot = tmp_path / "cli-subp.snapshot.json"
    env = dict(sys.modules.get("os", __import__("os")).environ)
    env["PYTHONPATH"] = str(SRC)

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "dashForge.main",
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ],
        capture_output=True,
        text=True,
        env=env,
    )
    assert result.returncode == 0, f"Subprocess failed with stderr: {result.stderr}"
    assert output.exists(), "CLI subprocess did not create SQLite database"
    assert snapshot.exists(), "CLI subprocess did not create snapshot JSON"


def test_no_external_runtime_dependencies() -> None:
    snowflake_cost_file = SRC / "dashForge" / "snowflake_cost.py"
    if not snowflake_cost_file.exists():
        pytest.skip("dashForge/snowflake_cost.py does not exist yet")

    tree = ast.parse(snowflake_cost_file.read_text(encoding="utf-8"))
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
    external = imported_modules - allowed_modules
    assert not external, f"Disallowed external runtime dependencies found: {external}"


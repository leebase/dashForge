from __future__ import annotations

import hashlib
import importlib
import json
import sqlite3
import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

try:
    from dashForge.generate import (
        DATASET_EXPORTS_BY_PACK,
        export_sqlite_snapshot,
        generate_financial_database,
        generate_healthcare_database,
        generate_saas_database,
    )
except ImportError:
    DATASET_EXPORTS_BY_PACK = None  # type: ignore[assignment]
    export_sqlite_snapshot = None  # type: ignore[assignment]
    generate_financial_database = None  # type: ignore[assignment]
    generate_healthcare_database = None  # type: ignore[assignment]
    generate_saas_database = None  # type: ignore[assignment]

try:
    from dashForge.main import build_parser, main
except ImportError:
    build_parser = None  # type: ignore[assignment]
    main = None  # type: ignore[assignment]

# Import guard for the package_snapshot module to be implemented in step_05
try:
    from dashForge import package_snapshot as pkg_snapshot_module
except ImportError:
    pkg_snapshot_module = None


def read_snapshot(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def query_value(connection: sqlite3.Connection, sql: str, params: tuple = ()) -> float:
    return float(connection.execute(sql, params).fetchone()[0])


# ============================================================================
# AC-1: CLI Flag and Argument Validation
# ============================================================================


def test_cli_generate_requires_scenario_and_output(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"

    # Missing both --scenario and --output
    with pytest.raises(SystemExit) as exit_info_1:
        main(["generate"])
    assert exit_info_1.value.code == 2
    captured_1 = capsys.readouterr()
    assert "required" in captured_1.err.lower() or "the following arguments are required" in captured_1.err

    # Missing --output
    with pytest.raises(SystemExit) as exit_info_2:
        main(["generate", "--scenario", "flu-season"])
    assert exit_info_2.value.code == 2
    captured_2 = capsys.readouterr()
    assert "required" in captured_2.err.lower() or "the following arguments are required" in captured_2.err

    # Missing --scenario
    with pytest.raises(SystemExit) as exit_info_3:
        main(["generate", "--output", str(tmp_path / "out.sqlite")])
    assert exit_info_3.value.code == 2
    captured_3 = capsys.readouterr()
    assert "required" in captured_3.err.lower() or "the following arguments are required" in captured_3.err


def test_cli_generate_accepts_all_contract_flags(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "contract-test.sqlite"
    snapshot = tmp_path / "contract-test.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "healthcare",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )

    assert exit_code == 0
    assert output.exists(), "SQLite database file was not created"
    assert snapshot.exists(), "JSON snapshot file was not created"

    data = read_snapshot(snapshot)
    assert data["packId"] == "healthcare"
    assert data["scenarioId"] == "flu-season"
    assert data["seed"] == 3101
    assert isinstance(data["datasets"], list)
    assert len(data["datasets"]) > 0


def test_cli_generation_writes_sqlite_and_snapshot(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "flu-season.sqlite"
    snapshot = tmp_path / "flu-season.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
        ]
    )

    assert exit_code == 0
    assert output.exists(), "SQLite database file was not created"
    assert snapshot.exists(), "JSON snapshot file was not created"

    data = read_snapshot(snapshot)
    assert data["packId"] == "healthcare"
    assert data["scenarioId"] == "flu-season"
    assert data["seed"] == 3101
    assert isinstance(data["datasets"], list)
    assert len(data["datasets"]) > 0


# ============================================================================
# AC-2: Fail-Closed Overwrite Protection
# ============================================================================


def test_cli_fails_closed_when_output_sqlite_exists(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "existing-flu.sqlite"
    output.write_text("existing sqlite placeholder", encoding="utf-8")

    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--scenario",
                "flu-season",
                "--output",
                str(output),
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Output path already exists. Pass --force to overwrite" in captured.err


def test_cli_fails_closed_when_snapshot_output_exists(
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
                "--scenario",
                "flu-season",
                "--output",
                str(output),
                "--snapshot-output",
                str(snapshot),
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Output path already exists. Pass --force to overwrite" in captured.err


def test_cli_overwrites_when_force_flag_provided(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "overwrite-target.sqlite"
    snapshot = tmp_path / "overwrite-target.snapshot.json"
    output.write_text("pre-existing sqlite content", encoding="utf-8")
    snapshot.write_text("pre-existing snapshot content", encoding="utf-8")

    exit_code = main(
        [
            "generate",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
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
    # Confirm contents were overwritten with valid sqlite database header and json snapshot
    assert output.read_bytes()[:16] == b"SQLite format 3\x00"
    data = read_snapshot(snapshot)
    assert data["scenarioId"] == "flu-season"


def test_cli_requires_force_to_overwrite_existing_outputs(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "flu-season.sqlite"
    snapshot = tmp_path / "flu-season.snapshot.json"

    # First generation succeeds
    exit_code = main(
        [
            "generate",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
        ]
    )
    assert exit_code == 0

    # Second generation targeting existing files without --force fails closed
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--scenario",
                "flu-season",
                "--seed",
                "3101",
                "--output",
                str(output),
                "--snapshot-output",
                str(snapshot),
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Output path already exists. Pass --force to overwrite" in captured.err

    # Third generation with --force succeeds
    exit_code = main(
        [
            "generate",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
            "--output",
            str(output),
            "--snapshot-output",
            str(snapshot),
            "--force",
        ]
    )
    assert exit_code == 0


def test_cli_requires_force_when_only_snapshot_exists(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "new-target-only.sqlite"
    snapshot = tmp_path / "existing-target-only.snapshot.json"
    snapshot.write_text("{}", encoding="utf-8")

    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--scenario",
                "flu-season",
                "--output",
                str(output),
                "--snapshot-output",
                str(snapshot),
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Output path already exists. Pass --force to overwrite" in captured.err


# ============================================================================
# AC-3 & AC-6: Snapshot JSON Structure and Content Integrity
# ============================================================================


def test_snapshot_json_contains_required_dataset_schema(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "schema-test.sqlite"
    snapshot = tmp_path / "schema-test.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "healthcare",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
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

    assert data["packId"] == "healthcare"
    assert data["scenarioId"] == "flu-season"
    assert data["seed"] == 3101
    assert isinstance(data["datasets"], list)

    dataset_ids = {d["datasetId"] for d in data["datasets"]}
    expected_datasets = {
        "executive_summary",
        "monthly_capacity",
        "facility_monthly_metrics",
        "department_monthly_metrics",
    }
    assert expected_datasets.issubset(dataset_ids)

    for dataset in data["datasets"]:
        assert "datasetId" in dataset
        assert "rowCount" in dataset
        assert "columns" in dataset
        assert "rows" in dataset
        assert dataset["rowCount"] == len(dataset["rows"])


def test_snapshot_column_definitions_and_roles(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "columns-test.sqlite"
    snapshot = tmp_path / "columns-test.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "healthcare",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
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

            assert column["type"] in valid_types, f"Invalid column type: {column['type']}"
            assert column["role"] in valid_roles, f"Invalid column role: {column['role']}"
            assert isinstance(column["label"], str)
            column_names.append(column["name"])

        for row in dataset["rows"]:
            assert isinstance(row, dict)
            for col_name in column_names:
                assert col_name in row, f"Row missing expected column: {col_name}"


def test_snapshot_rows_match_sqlite_table_records(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    output = tmp_path / "records-match.sqlite"
    snapshot = tmp_path / "records-match.snapshot.json"

    exit_code = main(
        [
            "generate",
            "--pack",
            "financial",
            "--scenario",
            "market-downturn",
            "--seed",
            "5301",
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
            db_rows = [dict(r) for r in conn.execute(f'SELECT * FROM "{dataset_id}"').fetchall()]
            assert len(dataset["rows"]) == len(db_rows)
            for snapshot_row, db_row in zip(dataset["rows"], db_rows):
                for key, val in snapshot_row.items():
                    assert key in db_row
                    assert val == db_row[key]


def test_snapshot_schema_conforms_to_sqlite_snapshot_contract(tmp_path: Path) -> None:
    assert generate_healthcare_database is not None, "generate_healthcare_database is not available"
    db_path = tmp_path / "test-schema.sqlite"
    snapshot_path = tmp_path / "test-schema.snapshot.json"

    generate_healthcare_database(
        scenario_id="flu-season",
        seed=3101,
        output_path=db_path,
        snapshot_output_path=snapshot_path,
    )

    snapshot = read_snapshot(snapshot_path)

    # Top-level SQLiteSnapshot fields
    assert "packId" in snapshot
    assert "scenarioId" in snapshot
    assert "seed" in snapshot
    assert "datasets" in snapshot

    assert isinstance(snapshot["packId"], str)
    assert isinstance(snapshot["scenarioId"], str)
    assert isinstance(snapshot["seed"], int)
    assert isinstance(snapshot["datasets"], list)

    dataset_ids = {d["datasetId"] for d in snapshot["datasets"]}
    expected_datasets = {
        "executive_summary",
        "monthly_capacity",
        "facility_monthly_metrics",
        "department_monthly_metrics",
    }
    assert expected_datasets.issubset(dataset_ids)

    valid_types = {"string", "number", "date", "boolean"}
    valid_roles = {"dimension", "measure", "date", "id"}

    for dataset in snapshot["datasets"]:
        assert "datasetId" in dataset
        assert "rowCount" in dataset
        assert "columns" in dataset
        assert "rows" in dataset

        assert dataset["rowCount"] == len(dataset["rows"])

        column_names = []
        for column in dataset["columns"]:
            assert "name" in column
            assert "type" in column
            assert "role" in column
            assert "label" in column

            assert column["type"] in valid_types, f"Invalid column type: {column['type']}"
            assert column["role"] in valid_roles, f"Invalid column role: {column['role']}"
            assert isinstance(column["label"], str)
            column_names.append(column["name"])

        for row in dataset["rows"]:
            assert isinstance(row, dict)
            for col_name in column_names:
                assert col_name in row, f"Row missing expected column: {col_name}"


def test_snapshot_rows_match_underlying_sqlite_tables(tmp_path: Path) -> None:
    assert generate_financial_database is not None, "generate_financial_database is not available"
    db_path = tmp_path / "compare.sqlite"
    snapshot_path = tmp_path / "compare.snapshot.json"

    generate_financial_database(
        scenario_id="market-downturn",
        seed=5301,
        output_path=db_path,
        snapshot_output_path=snapshot_path,
    )

    snapshot = read_snapshot(snapshot_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        for dataset in snapshot["datasets"]:
            dataset_id = dataset["datasetId"]
            db_rows = [dict(r) for r in conn.execute(f'SELECT * FROM "{dataset_id}"').fetchall()]
            assert len(dataset["rows"]) == len(db_rows)
            if dataset["rows"] and db_rows:
                for key in dataset["rows"][0]:
                    assert dataset["rows"][0][key] == db_rows[0][key]


# ============================================================================
# AC-4: Multi-Pack Support & Determinism
# ============================================================================


def test_all_canonical_packs_generate_successfully(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    cases = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 5301),
        ("saas", "churn-crisis", 8301),
    ]
    for pack, scenario, seed in cases:
        db_path = tmp_path / f"{pack}.sqlite"
        snap_path = tmp_path / f"{pack}.snapshot.json"
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
                str(snap_path),
                "--force",
            ]
        )
        assert exit_code == 0
        assert db_path.exists(), f"SQLite database not created for pack {pack}"
        assert snap_path.exists(), f"JSON snapshot not created for pack {pack}"

        snap_data = read_snapshot(snap_path)
        assert snap_data["packId"] == pack
        assert snap_data["scenarioId"] == scenario
        assert snap_data["seed"] == seed
        assert len(snap_data["datasets"]) > 0


def test_cli_generation_supports_financial_and_saas_packs(tmp_path: Path) -> None:
    assert main is not None, "dashForge.main.main is not available"
    financial_output = tmp_path / "financial-market-downturn.sqlite"
    financial_snapshot = tmp_path / "financial-market-downturn.snapshot.json"
    saas_output = tmp_path / "saas-churn-crisis.sqlite"
    saas_snapshot = tmp_path / "saas-churn-crisis.snapshot.json"

    financial_exit = main(
        [
            "generate",
            "--pack",
            "financial",
            "--scenario",
            "market-downturn",
            "--seed",
            "5301",
            "--output",
            str(financial_output),
            "--snapshot-output",
            str(financial_snapshot),
        ]
    )

    saas_exit = main(
        [
            "generate",
            "--pack",
            "saas",
            "--scenario",
            "churn-crisis",
            "--seed",
            "8301",
            "--output",
            str(saas_output),
            "--snapshot-output",
            str(saas_snapshot),
        ]
    )

    assert financial_exit == 0
    assert saas_exit == 0
    assert financial_output.exists()
    assert financial_snapshot.exists()
    assert saas_output.exists()
    assert saas_snapshot.exists()

    fin_data = read_snapshot(financial_snapshot)
    assert fin_data["packId"] == "financial"
    assert fin_data["scenarioId"] == "market-downturn"
    assert fin_data["seed"] == 5301

    saas_data = read_snapshot(saas_snapshot)
    assert saas_data["packId"] == "saas"
    assert saas_data["scenarioId"] == "churn-crisis"
    assert saas_data["seed"] == 8301


def test_deterministic_snapshot_generation_with_same_seed(tmp_path: Path) -> None:
    assert generate_healthcare_database is not None, "generate_healthcare_database is not available"
    first_db = tmp_path / "first-4201.sqlite"
    first_snapshot = tmp_path / "first-4201.snapshot.json"
    second_db = tmp_path / "second-4201.sqlite"
    second_snapshot = tmp_path / "second-4201.snapshot.json"

    generate_healthcare_database(
        scenario_id="flu-season",
        seed=4201,
        output_path=first_db,
        snapshot_output_path=first_snapshot,
    )
    generate_healthcare_database(
        scenario_id="flu-season",
        seed=4201,
        output_path=second_db,
        snapshot_output_path=second_snapshot,
    )

    first_hash = hashlib.sha256(first_snapshot.read_bytes()).hexdigest()
    second_hash = hashlib.sha256(second_snapshot.read_bytes()).hexdigest()
    assert first_hash == second_hash
    assert read_snapshot(first_snapshot) == read_snapshot(second_snapshot)


def test_generation_is_deterministic_for_same_inputs(tmp_path: Path) -> None:
    assert generate_healthcare_database is not None, "generate_healthcare_database is not available"
    first_db = tmp_path / "quality-a.sqlite"
    first_snapshot = tmp_path / "quality-a.snapshot.json"
    second_db = tmp_path / "quality-b.sqlite"
    second_snapshot = tmp_path / "quality-b.snapshot.json"

    generate_healthcare_database(
        scenario_id="quality-improvement",
        seed=2048,
        output_path=first_db,
        snapshot_output_path=first_snapshot,
    )
    generate_healthcare_database(
        scenario_id="quality-improvement",
        seed=2048,
        output_path=second_db,
        snapshot_output_path=second_snapshot,
    )

    assert read_snapshot(first_snapshot) == read_snapshot(second_snapshot)


def test_generation_is_deterministic_for_financial_and_saas(tmp_path: Path) -> None:
    assert generate_financial_database is not None, "generate_financial_database is not available"
    assert generate_saas_database is not None, "generate_saas_database is not available"
    first_financial = tmp_path / "financial-a.sqlite"
    first_financial_snapshot = tmp_path / "financial-a.snapshot.json"
    second_financial = tmp_path / "financial-b.sqlite"
    second_financial_snapshot = tmp_path / "financial-b.snapshot.json"
    first_saas = tmp_path / "saas-a.sqlite"
    first_saas_snapshot = tmp_path / "saas-a.snapshot.json"
    second_saas = tmp_path / "saas-b.sqlite"
    second_saas_snapshot = tmp_path / "saas-b.snapshot.json"

    generate_financial_database(
        scenario_id="market-downturn",
        seed=5301,
        output_path=first_financial,
        snapshot_output_path=first_financial_snapshot,
    )
    generate_financial_database(
        scenario_id="market-downturn",
        seed=5301,
        output_path=second_financial,
        snapshot_output_path=second_financial_snapshot,
    )
    generate_saas_database(
        scenario_id="churn-crisis",
        seed=8301,
        output_path=first_saas,
        snapshot_output_path=first_saas_snapshot,
    )
    generate_saas_database(
        scenario_id="churn-crisis",
        seed=8301,
        output_path=second_saas,
        snapshot_output_path=second_saas_snapshot,
    )

    assert read_snapshot(first_financial_snapshot) == read_snapshot(second_financial_snapshot)
    assert read_snapshot(first_saas_snapshot) == read_snapshot(second_saas_snapshot)


# ============================================================================
# AC-5: Input Validation & Clean Diagnostic Error Reporting
# ============================================================================


def test_unknown_pack_fails_with_exit_code_2(capsys: pytest.CaptureFixture[str]) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "banking",
                "--scenario",
                "market-downturn",
                "--output",
                "/tmp/not-used.sqlite",
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "invalid choice: 'banking'" in captured.err
    assert "usage: dashForge" in captured.err


def test_unknown_scenario_fails_with_exit_code_2_without_traceback(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    for pack, expected_err in [
        ("healthcare", "Unknown healthcare scenario"),
        ("financial", "Unknown financial scenario"),
        ("saas", "Unknown saas scenario"),
    ]:
        with pytest.raises(SystemExit) as exit_info:
            main(
                [
                    "generate",
                    "--pack",
                    pack,
                    "--scenario",
                    "non-existent-scenario-id",
                    "--output",
                    str(tmp_path / f"invalid-{pack}.sqlite"),
                ]
            )

        assert exit_info.value.code == 2
        captured = capsys.readouterr()
        assert expected_err in captured.err
        assert "Traceback (most recent call last)" not in captured.err
        assert "Traceback (most recent call last)" not in captured.out


def test_cli_rejects_unknown_scenario(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--scenario",
                "not-a-real-scenario",
                "--output",
                str(tmp_path / "invalid.sqlite"),
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Unknown healthcare scenario" in captured.err
    assert "usage: dashForge" in captured.err


def test_cli_rejects_unknown_scenario_for_other_packs(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as financial_exit_info:
        main(
            [
                "generate",
                "--pack",
                "financial",
                "--scenario",
                "not-a-real-scenario",
                "--output",
                str(tmp_path / "invalid-financial.sqlite"),
            ]
        )

    assert financial_exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Unknown financial scenario" in captured.err

    with pytest.raises(SystemExit) as saas_exit_info:
        main(
            [
                "generate",
                "--pack",
                "saas",
                "--scenario",
                "not-a-real-scenario",
                "--output",
                str(tmp_path / "invalid-saas.sqlite"),
            ]
        )

    assert saas_exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "Unknown saas scenario" in captured.err


def test_cli_rejects_unknown_pack(capsys: pytest.CaptureFixture[str]) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "banking",
                "--scenario",
                "market-downturn",
                "--output",
                "/tmp/not-used.sqlite",
            ]
        )

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "invalid choice: 'banking'" in captured.err
    assert "usage: dashForge" in captured.err


def test_cli_rejects_missing_required_arguments(
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main(["generate"])

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "required" in captured.err.lower() or "the following arguments are required" in captured.err


def test_cli_rejects_missing_subcommand_without_arguments(
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main is not None, "dashForge.main.main is not available"
    with pytest.raises(SystemExit) as exit_info:
        main([])

    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    assert "required" in captured.err.lower() or "the following arguments are required" in captured.err


# ============================================================================
# AC-6: Business Domain Trends & Aggregation Consistency
# ============================================================================


def test_generated_healthcare_data_supports_scenario_stories_and_rollups(
    tmp_path: Path,
) -> None:
    assert generate_healthcare_database is not None, "generate_healthcare_database is not available"
    flu_db = tmp_path / "flu-season.sqlite"
    quality_db = tmp_path / "quality.sqlite"
    cost_db = tmp_path / "cost.sqlite"

    generate_healthcare_database(
        scenario_id="flu-season",
        seed=3101,
        output_path=flu_db,
    )
    generate_healthcare_database(
        scenario_id="quality-improvement",
        seed=2048,
        output_path=quality_db,
    )
    generate_healthcare_database(
        scenario_id="cost-pressure",
        seed=4127,
        output_path=cost_db,
    )

    with sqlite3.connect(flu_db) as connection:
        winter_admissions = query_value(
            connection,
            """
            SELECT SUM(admissions)
            FROM monthly_capacity
            WHERE month IN ('2025-12', '2025-01', '2025-02')
            """,
        )
        summer_admissions = query_value(
            connection,
            """
            SELECT SUM(admissions)
            FROM monthly_capacity
            WHERE month IN ('2025-06', '2025-07', '2025-08')
            """,
        )
        peak_occupancy = query_value(
            connection,
            "SELECT MAX(bedOccupancy) FROM monthly_capacity",
        )
        rollup_gap = query_value(
            connection,
            """
            SELECT ABS(f.admissions - SUM(d.admissions))
            FROM facility_monthly_metrics AS f
            JOIN department_monthly_metrics AS d
              ON d.month = f.month
             AND d.facilityId = f.facilityId
            WHERE f.month = '2025-01'
              AND f.facilityId = 'north-medical-center'
            GROUP BY f.month, f.facilityId, f.admissions
            """,
        )

    with sqlite3.connect(quality_db) as connection:
        first_half_infection = query_value(
            connection,
            """
            SELECT AVG(infectionRate)
            FROM monthly_capacity
            WHERE month IN ('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06')
            """,
        )
        second_half_infection = query_value(
            connection,
            """
            SELECT AVG(infectionRate)
            FROM monthly_capacity
            WHERE month IN ('2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12')
            """,
        )
        first_half_satisfaction = query_value(
            connection,
            """
            SELECT AVG(patientSatisfaction)
            FROM monthly_capacity
            WHERE month IN ('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06')
            """,
        )
        second_half_satisfaction = query_value(
            connection,
            """
            SELECT AVG(patientSatisfaction)
            FROM monthly_capacity
            WHERE month IN ('2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12')
            """,
        )

    with sqlite3.connect(cost_db) as connection:
        q1_cost = query_value(
            connection,
            """
            SELECT AVG(costPerCase)
            FROM monthly_capacity
            WHERE month IN ('2025-01', '2025-02', '2025-03')
            """,
        )
        q4_cost = query_value(
            connection,
            """
            SELECT AVG(costPerCase)
            FROM monthly_capacity
            WHERE month IN ('2025-10', '2025-11', '2025-12')
            """,
        )
        occupancy_swing = query_value(
            connection,
            "SELECT MAX(bedOccupancy) - MIN(bedOccupancy) FROM monthly_capacity",
        )

    assert winter_admissions > summer_admissions * 1.2
    assert peak_occupancy > 95
    assert rollup_gap == 0
    assert second_half_infection < first_half_infection
    assert second_half_satisfaction > first_half_satisfaction
    assert q4_cost > q1_cost * 1.05
    assert occupancy_swing < 5


# ============================================================================
# AC-7: Programmatic Slice Package API (when package_snapshot module is present)
# ============================================================================


def test_package_snapshot_module_exports_and_interface() -> None:
    if pkg_snapshot_module is None:
        pytest.skip("dashForge.package_snapshot not yet implemented (scheduled for step_05)")

    assert hasattr(pkg_snapshot_module, "package_snapshot")
    assert hasattr(pkg_snapshot_module, "export_sqlite_snapshot")
    assert hasattr(pkg_snapshot_module, "DATASET_EXPORTS_BY_PACK")
    assert hasattr(pkg_snapshot_module, "GENERATORS")
    assert hasattr(pkg_snapshot_module, "resolve_dataset_exports")


def test_programmatic_package_snapshot_execution(tmp_path: Path) -> None:
    if pkg_snapshot_module is None:
        pytest.skip("dashForge.package_snapshot not yet implemented (scheduled for step_05)")

    output = tmp_path / "prog-flu.sqlite"
    snapshot = tmp_path / "prog-flu.snapshot.json"

    result = pkg_snapshot_module.package_snapshot(
        pack="healthcare",
        scenario="flu-season",
        seed=3101,
        output_path=output,
        snapshot_output_path=snapshot,
        force=True,
    )

    assert output.exists(), "Programmatic SQLite output was not created"
    assert snapshot.exists(), "Programmatic JSON snapshot was not created"
    assert isinstance(result, dict)


def test_programmatic_package_snapshot_fails_closed_on_existing_output(tmp_path: Path) -> None:
    if pkg_snapshot_module is None:
        pytest.skip("dashForge.package_snapshot not yet implemented (scheduled for step_05)")

    output = tmp_path / "prog-existing.sqlite"
    output.write_text("existing content", encoding="utf-8")

    with pytest.raises(FileExistsError):
        pkg_snapshot_module.package_snapshot(
            pack="healthcare",
            scenario="flu-season",
            output_path=output,
            force=False,
        )


def test_programmatic_package_snapshot_rejects_invalid_inputs(tmp_path: Path) -> None:
    if pkg_snapshot_module is None:
        pytest.skip("dashForge.package_snapshot not yet implemented (scheduled for step_05)")

    # Missing scenario
    with pytest.raises(ValueError):
        pkg_snapshot_module.package_snapshot(
            pack="healthcare",
            output_path=tmp_path / "out.sqlite",
        )

    # Missing output
    with pytest.raises(ValueError):
        pkg_snapshot_module.package_snapshot(
            pack="healthcare",
            scenario="flu-season",
        )

    # Invalid pack
    with pytest.raises(ValueError):
        pkg_snapshot_module.package_snapshot(
            pack="retail",
            scenario="flu-season",
            output_path=tmp_path / "out.sqlite",
        )

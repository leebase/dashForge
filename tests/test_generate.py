from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from dashForge.generate import (
    generate_financial_database,
    generate_healthcare_database,
    generate_saas_database,
)
from dashForge.main import main


def read_snapshot(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def query_value(connection: sqlite3.Connection, sql: str, params: tuple = ()) -> float:
    return float(connection.execute(sql, params).fetchone()[0])


def test_cli_generation_writes_sqlite_and_snapshot(tmp_path: Path) -> None:
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
    assert output.exists()
    assert snapshot.exists()


def test_cli_generation_supports_financial_and_saas_packs(tmp_path: Path) -> None:
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


def test_cli_rejects_unknown_scenario(capsys: pytest.CaptureFixture[str], tmp_path: Path) -> None:
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


def test_cli_requires_force_to_overwrite_existing_outputs(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
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


def test_generation_is_deterministic_for_same_inputs(tmp_path: Path) -> None:
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


def test_generated_healthcare_data_supports_scenario_stories_and_rollups(
    tmp_path: Path,
) -> None:
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

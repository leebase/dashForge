from __future__ import annotations

import hashlib
import json
import math
import sqlite3
from pathlib import Path
from typing import Any

ASSET_DIR = (
    Path(__file__).resolve().parents[2] / "frontend" / "src" / "mock-data"
)

PACK_ASSET_PATHS = {
    "healthcare": ASSET_DIR / "healthcarePack.json",
    "financial": ASSET_DIR / "financialPack.json",
    "saas": ASSET_DIR / "saasPack.json",
}

DATASET_EXPORTS_BY_PACK: dict[str, tuple[tuple[str, str], ...]] = {
    "healthcare": (
        ("executive_summary", 'SELECT * FROM executive_summary ORDER BY metricId'),
        ("monthly_capacity", 'SELECT * FROM monthly_capacity ORDER BY month'),
        (
            "facility_monthly_metrics",
            'SELECT * FROM facility_monthly_metrics ORDER BY month, facilityName',
        ),
        (
            "department_monthly_metrics",
            """
            SELECT *
            FROM department_monthly_metrics
            ORDER BY month, facilityName, departmentName, payerName, diagnosisName
            """,
        ),
    ),
    "financial": (
        ("executive_summary", 'SELECT * FROM executive_summary ORDER BY metricId'),
        ("monthly_summary", 'SELECT * FROM monthly_summary ORDER BY month'),
        ("advisor_concentration", 'SELECT * FROM advisor_concentration ORDER BY advisorName'),
    ),
    "saas": (
        ("executive_summary", 'SELECT * FROM executive_summary ORDER BY metricId'),
        ("monthly_summary", 'SELECT * FROM monthly_summary ORDER BY month'),
        ("segment_engagement", 'SELECT * FROM segment_engagement ORDER BY segment'),
        ("feature_adoption", 'SELECT * FROM feature_adoption ORDER BY feature'),
    ),
}


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def stable_fraction(seed: int, *parts: str) -> float:
    digest = hashlib.sha256("|".join([str(seed), *parts]).encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / 2**64


def stable_factor(
    seed: int,
    *parts: str,
    minimum: float = 0.9,
    maximum: float = 1.1,
) -> float:
    return minimum + (maximum - minimum) * stable_fraction(seed, *parts)


def humanize_label(column_name: str) -> str:
    output: list[str] = []
    for index, character in enumerate(column_name):
        if index and character.isupper() and output[-1] != " ":
            output.append(" ")
        if character in {"_", "-"}:
            output.append(" ")
            continue
        output.append(character)
    return "".join(output).title()


def infer_column_type(column_name: str, values: list[Any]) -> str:
    first_meaningful = next((value for value in values if value is not None), None)
    if isinstance(first_meaningful, bool):
        return "boolean"
    if isinstance(first_meaningful, (int, float)):
        return "number"
    if isinstance(first_meaningful, str) and any(
        token in column_name.lower() for token in ("date", "time", "month", "quarter")
    ):
        return "date"
    return "string"


def infer_column_role(column_name: str, column_type: str) -> str:
    if column_name.lower().endswith("id") or column_name == "id":
        return "id"
    if column_type == "number":
        return "measure"
    if column_type == "date":
        return "date"
    return "dimension"


def resolve_dataset_exports(pack_id: str) -> tuple[tuple[str, str], ...]:
    try:
        return DATASET_EXPORTS_BY_PACK[pack_id]
    except KeyError as error:
        raise ValueError(f'Unknown pack "{pack_id}".') from error


def load_pack(pack_id: str) -> dict[str, Any]:
    try:
        path = PACK_ASSET_PATHS[pack_id]
    except KeyError as error:
        raise ValueError(f'Unknown pack "{pack_id}".') from error

    return json.loads(path.read_text(encoding="utf-8"))


def get_pack_scenario(
    pack: dict[str, Any],
    scenario_id: str,
) -> dict[str, Any]:
    for scenario in pack["scenarios"]:
        if scenario["scenarioId"] == scenario_id:
            return scenario
    raise ValueError(
        f'Unknown {pack["packId"]} scenario "{scenario_id}".',
    )


def resolve_value(
    seed: int,
    *parts: str,
    base_value: float,
    jitter: float,
) -> float:
    return base_value * (
        1
        + (stable_fraction(seed, *parts) - 0.5)
        * 2
        * jitter
    )


def allocate_integer_total(total: int, raw_weights: list[float]) -> list[int]:
    if total <= 0:
        return [0 for _ in raw_weights]
    total_weight = sum(raw_weights)
    normalized_weights = [
        (weight / total_weight) if total_weight else 1 / len(raw_weights)
        for weight in raw_weights
    ]
    raw_values = [total * weight for weight in normalized_weights]
    allocations = [math.floor(value) for value in raw_values]
    remainder = total - sum(allocations)
    order = sorted(
        range(len(raw_values)),
        key=lambda index: (raw_values[index] - allocations[index], -index),
        reverse=True,
    )
    for index in order[:remainder]:
        allocations[index] += 1
    return allocations


def build_department_monthly_rows(
    pack: dict[str, Any],
    scenario: dict[str, Any],
    seed: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    months = pack["months"]
    facilities = pack["entities"]["facilities"]
    departments = pack["entities"]["departments"]
    payers = pack["entities"]["payers"]
    diagnoses = pack["entities"]["diagnosisCategories"]
    profile = scenario["generationProfile"]
    scenario_id = scenario["scenarioId"]

    for month_index, month in enumerate(months):
        for facility in facilities:
            baseline_admissions = (
                facility["bedCapacity"]
                * facility["baselineOccupancy"]
                * month["days"]
                / facility["baselineLengthOfStay"]
            )
            total_admissions = round(
                baseline_admissions
                * profile["volumeMultiplierByMonth"][month_index]
                * stable_factor(
                    seed,
                    scenario_id,
                    month["id"],
                    facility["id"],
                    "facility-volume",
                    minimum=0.97,
                    maximum=1.03,
                )
            )
            facility_occupancy = clamp(
                (
                    facility["baselineOccupancy"]
                    + profile["occupancyShiftByMonth"][month_index]
                    + (
                        stable_fraction(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            "facility-occupancy",
                        )
                        - 0.5
                    )
                    * 0.02
                )
                * 100,
                72.0,
                99.2,
            )

            combinations: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any], float]] = []
            raw_weights: list[float] = []
            for department in departments:
                for payer in payers:
                    for diagnosis in diagnoses:
                        weight = (
                            department["share"]
                            * payer["share"]
                            * diagnosis["share"]
                            * stable_factor(
                                seed,
                                scenario_id,
                                month["id"],
                                facility["id"],
                                department["id"],
                                payer["id"],
                                diagnosis["id"],
                                "weight",
                                minimum=0.92,
                                maximum=1.08,
                            )
                        )
                        combinations.append((department, payer, diagnosis, weight))
                        raw_weights.append(weight)

            total_weight = sum(raw_weights)
            normalized_weights = [
                weight / total_weight if total_weight else 0.0 for weight in raw_weights
            ]
            admissions_allocations = allocate_integer_total(total_admissions, raw_weights)

            for index, (department, payer, diagnosis, _) in enumerate(combinations):
                admissions = admissions_allocations[index]
                if admissions == 0:
                    continue

                row_share = normalized_weights[index]
                avg_length_of_stay = clamp(
                    facility["baselineLengthOfStay"]
                    * diagnosis["lengthOfStayMultiplier"]
                    * (1 + profile["lengthOfStayShiftByMonth"][month_index])
                    * stable_factor(
                        seed,
                        scenario_id,
                        month["id"],
                        facility["id"],
                        department["id"],
                        diagnosis["id"],
                        "length-of-stay",
                        minimum=0.97,
                        maximum=1.03,
                    ),
                    2.4,
                    8.8,
                )
                readmission_rate = clamp(
                    facility["baselineReadmission"]
                    * department["readmissionRisk"]
                    * payer["readmissionModifier"]
                    * (1 + profile["readmissionShiftByMonth"][month_index])
                    * stable_factor(
                        seed,
                        scenario_id,
                        month["id"],
                        facility["id"],
                        department["id"],
                        payer["id"],
                        "readmission",
                        minimum=0.96,
                        maximum=1.04,
                    ),
                    6.2,
                    17.5,
                )
                infection_rate = clamp(
                    facility["baselineInfection"]
                    * department["infectionRisk"]
                    * diagnosis["infectionRisk"]
                    * (1 + profile["infectionShiftByMonth"][month_index])
                    * stable_factor(
                        seed,
                        scenario_id,
                        month["id"],
                        facility["id"],
                        department["id"],
                        diagnosis["id"],
                        "infection",
                        minimum=0.95,
                        maximum=1.05,
                    ),
                    0.7,
                    5.2,
                )
                patient_satisfaction = clamp(
                    facility["baselineSatisfaction"]
                    + profile["satisfactionShiftByMonth"][month_index] * 40
                    - (department["waitMultiplier"] - 1) * 3.2
                    + (
                        stable_fraction(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            department["id"],
                            "satisfaction",
                        )
                        - 0.5
                    )
                    * 2.2,
                    68.0,
                    90.0,
                )
                cost_per_case = clamp(
                    facility["baselineCostPerCase"]
                    * department["costMultiplier"]
                    * payer["costMultiplier"]
                    * (1 + profile["costShiftByMonth"][month_index])
                    * stable_factor(
                        seed,
                        scenario_id,
                        month["id"],
                        facility["id"],
                        department["id"],
                        payer["id"],
                        "cost",
                        minimum=0.97,
                        maximum=1.03,
                    ),
                    8500.0,
                    18500.0,
                )
                ed_wait_minutes = clamp(
                    facility["baselineEdWaitMinutes"]
                    * department["waitMultiplier"]
                    * (1 + profile["waitShiftByMonth"][month_index])
                    * stable_factor(
                        seed,
                        scenario_id,
                        month["id"],
                        facility["id"],
                        department["id"],
                        "ed-wait",
                        minimum=0.94,
                        maximum=1.06,
                    ),
                    18.0,
                    96.0,
                )
                bed_occupancy = clamp(
                    facility_occupancy
                    + (department["share"] - 0.12) * 12
                    + (diagnosis["lengthOfStayMultiplier"] - 1) * 15
                    + (
                        stable_fraction(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            department["id"],
                            diagnosis["id"],
                            "bed-occupancy",
                        )
                        - 0.5
                    )
                    * 2.4,
                    72.0,
                    99.5,
                )
                available_beds = round(facility["bedCapacity"] * row_share, 2)
                occupied_beds = round(available_beds * bed_occupancy / 100, 2)
                discharges = max(
                    0,
                    round(
                        admissions
                        * stable_factor(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            department["id"],
                            payer["id"],
                            diagnosis["id"],
                            "discharges",
                            minimum=0.93,
                            maximum=0.99,
                        )
                    ),
                )
                ed_visits = round(
                    admissions
                    * (
                        1.05
                        + department["waitMultiplier"] * 0.18
                        + profile["waitShiftByMonth"][month_index] * 0.35
                        + stable_fraction(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            department["id"],
                            "ed-visits",
                        )
                        * 0.08
                    )
                )
                mortality_index = clamp(
                    0.92
                    + infection_rate / 12
                    + readmission_rate / 50
                    + (
                        stable_fraction(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            department["id"],
                            diagnosis["id"],
                            "mortality",
                        )
                        - 0.5
                    )
                    * 0.05,
                    0.88,
                    1.28,
                )
                margin_pct = clamp(
                    facility["baselineMarginPct"]
                    + profile["marginShiftByMonth"][month_index] * 35
                    - (department["costMultiplier"] - 1) * 2.5
                    + (
                        stable_fraction(
                            seed,
                            scenario_id,
                            month["id"],
                            facility["id"],
                            department["id"],
                            payer["id"],
                            "margin",
                        )
                        - 0.5
                    )
                    * 0.4,
                    4.0,
                    12.5,
                )
                labor_cost_index = round(
                    100
                    * (1 + profile["laborCostShiftByMonth"][month_index])
                    * stable_factor(
                        seed,
                        scenario_id,
                        month["id"],
                        facility["id"],
                        department["id"],
                        "labor",
                        minimum=0.985,
                        maximum=1.015,
                    ),
                    1,
                )

                rows.append(
                    {
                        "month": month["id"],
                        "monthLabel": month["label"],
                        "quarter": month["quarter"],
                        "facilityId": facility["id"],
                        "facilityName": facility["name"],
                        "departmentId": department["id"],
                        "departmentName": department["name"],
                        "payerId": payer["id"],
                        "payerName": payer["name"],
                        "diagnosisId": diagnosis["id"],
                        "diagnosisName": diagnosis["name"],
                        "admissions": admissions,
                        "discharges": discharges,
                        "edVisits": ed_visits,
                        "occupiedBeds": round(occupied_beds, 2),
                        "availableBeds": round(available_beds, 2),
                        "bedOccupancy": round(bed_occupancy, 1),
                        "avgLengthOfStay": round(avg_length_of_stay, 2),
                        "readmissionRate": round(readmission_rate, 2),
                        "infectionRate": round(infection_rate, 2),
                        "patientSatisfaction": round(patient_satisfaction, 1),
                        "costPerCase": round(cost_per_case, 2),
                        "edWaitMinutes": round(ed_wait_minutes, 1),
                        "mortalityIndex": round(mortality_index, 3),
                        "marginPct": round(margin_pct, 2),
                        "laborCostIndex": labor_cost_index,
                    }
                )

    return rows


def create_database_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;

        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE facilities (
            facilityId TEXT PRIMARY KEY,
            facilityName TEXT NOT NULL,
            region TEXT NOT NULL,
            bedCapacity INTEGER NOT NULL
        );

        CREATE TABLE departments (
            departmentId TEXT PRIMARY KEY,
            departmentName TEXT NOT NULL,
            serviceLine TEXT NOT NULL
        );

        CREATE TABLE payers (
            payerId TEXT PRIMARY KEY,
            payerName TEXT NOT NULL
        );

        CREATE TABLE diagnosis_categories (
            diagnosisId TEXT PRIMARY KEY,
            diagnosisName TEXT NOT NULL
        );

        CREATE TABLE department_monthly_metrics (
            month TEXT NOT NULL,
            monthLabel TEXT NOT NULL,
            quarter TEXT NOT NULL,
            facilityId TEXT NOT NULL,
            facilityName TEXT NOT NULL,
            departmentId TEXT NOT NULL,
            departmentName TEXT NOT NULL,
            payerId TEXT NOT NULL,
            payerName TEXT NOT NULL,
            diagnosisId TEXT NOT NULL,
            diagnosisName TEXT NOT NULL,
            admissions INTEGER NOT NULL,
            discharges INTEGER NOT NULL,
            edVisits INTEGER NOT NULL,
            occupiedBeds REAL NOT NULL,
            availableBeds REAL NOT NULL,
            bedOccupancy REAL NOT NULL,
            avgLengthOfStay REAL NOT NULL,
            readmissionRate REAL NOT NULL,
            infectionRate REAL NOT NULL,
            patientSatisfaction REAL NOT NULL,
            costPerCase REAL NOT NULL,
            edWaitMinutes REAL NOT NULL,
            mortalityIndex REAL NOT NULL,
            marginPct REAL NOT NULL,
            laborCostIndex REAL NOT NULL
        );

        CREATE TABLE facility_monthly_metrics (
            month TEXT NOT NULL,
            monthLabel TEXT NOT NULL,
            quarter TEXT NOT NULL,
            facilityId TEXT NOT NULL,
            facilityName TEXT NOT NULL,
            admissions INTEGER NOT NULL,
            discharges INTEGER NOT NULL,
            edVisits INTEGER NOT NULL,
            occupiedBeds REAL NOT NULL,
            availableBeds REAL NOT NULL,
            bedOccupancy REAL NOT NULL,
            avgLengthOfStay REAL NOT NULL,
            readmissionRate REAL NOT NULL,
            infectionRate REAL NOT NULL,
            patientSatisfaction REAL NOT NULL,
            costPerCase REAL NOT NULL,
            edWaitMinutes REAL NOT NULL,
            mortalityIndex REAL NOT NULL,
            marginPct REAL NOT NULL,
            laborCostIndex REAL NOT NULL
        );

        CREATE TABLE monthly_capacity (
            month TEXT NOT NULL,
            monthLabel TEXT NOT NULL,
            quarter TEXT NOT NULL,
            admissions INTEGER NOT NULL,
            bedOccupancy REAL NOT NULL,
            patientSatisfaction REAL NOT NULL,
            readmissionRate REAL NOT NULL,
            infectionRate REAL NOT NULL,
            costPerCase REAL NOT NULL,
            edWaitMinutes REAL NOT NULL,
            marginPct REAL NOT NULL
        );

        CREATE TABLE executive_summary (
            metricId TEXT PRIMARY KEY,
            value REAL NOT NULL,
            delta REAL NOT NULL,
            deltaLabel TEXT NOT NULL,
            prefix TEXT,
            suffix TEXT,
            caption TEXT NOT NULL
        );

        CREATE TABLE dataset_catalog (
            datasetId TEXT PRIMARY KEY,
            rowCount INTEGER NOT NULL
        );
        """
    )


def seed_dimension_tables(connection: sqlite3.Connection, pack: dict[str, Any]) -> None:
    connection.executemany(
        "INSERT INTO facilities VALUES (:id, :name, :region, :bedCapacity)",
        [
            {
                "id": facility["id"],
                "name": facility["name"],
                "region": facility["region"],
                "bedCapacity": facility["bedCapacity"],
            }
            for facility in pack["entities"]["facilities"]
        ],
    )
    connection.executemany(
        "INSERT INTO departments VALUES (:id, :name, :serviceLine)",
        [
            {
                "id": department["id"],
                "name": department["name"],
                "serviceLine": department["serviceLine"],
            }
            for department in pack["entities"]["departments"]
        ],
    )
    connection.executemany(
        "INSERT INTO payers VALUES (:id, :name)",
        [{"id": payer["id"], "name": payer["name"]} for payer in pack["entities"]["payers"]],
    )
    connection.executemany(
        "INSERT INTO diagnosis_categories VALUES (:id, :name)",
        [
            {"id": diagnosis["id"], "name": diagnosis["name"]}
            for diagnosis in pack["entities"]["diagnosisCategories"]
        ],
    )


def build_facility_monthly_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        INSERT INTO facility_monthly_metrics
        SELECT
            month,
            monthLabel,
            quarter,
            facilityId,
            facilityName,
            SUM(admissions) AS admissions,
            SUM(discharges) AS discharges,
            SUM(edVisits) AS edVisits,
            ROUND(SUM(occupiedBeds), 1) AS occupiedBeds,
            ROUND(SUM(availableBeds), 1) AS availableBeds,
            ROUND(SUM(occupiedBeds) * 100.0 / NULLIF(SUM(availableBeds), 0), 1) AS bedOccupancy,
            ROUND(SUM(avgLengthOfStay * admissions) / NULLIF(SUM(admissions), 0), 2) AS avgLengthOfStay,
            ROUND(SUM(readmissionRate * admissions) / NULLIF(SUM(admissions), 0), 2) AS readmissionRate,
            ROUND(SUM(infectionRate * admissions) / NULLIF(SUM(admissions), 0), 2) AS infectionRate,
            ROUND(SUM(patientSatisfaction * admissions) / NULLIF(SUM(admissions), 0), 1) AS patientSatisfaction,
            ROUND(SUM(costPerCase * admissions) / NULLIF(SUM(admissions), 0), 2) AS costPerCase,
            ROUND(SUM(edWaitMinutes * admissions) / NULLIF(SUM(admissions), 0), 1) AS edWaitMinutes,
            ROUND(SUM(mortalityIndex * admissions) / NULLIF(SUM(admissions), 0), 3) AS mortalityIndex,
            ROUND(SUM(marginPct * admissions) / NULLIF(SUM(admissions), 0), 2) AS marginPct,
            ROUND(SUM(laborCostIndex * admissions) / NULLIF(SUM(admissions), 0), 1) AS laborCostIndex
        FROM department_monthly_metrics
        GROUP BY month, monthLabel, quarter, facilityId, facilityName
        """
    )


def build_monthly_capacity_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        INSERT INTO monthly_capacity
        SELECT
            month,
            monthLabel,
            quarter,
            SUM(admissions) AS admissions,
            ROUND(SUM(occupiedBeds) * 100.0 / NULLIF(SUM(availableBeds), 0), 1) AS bedOccupancy,
            ROUND(SUM(patientSatisfaction * admissions) / NULLIF(SUM(admissions), 0), 1) AS patientSatisfaction,
            ROUND(SUM(readmissionRate * admissions) / NULLIF(SUM(admissions), 0), 2) AS readmissionRate,
            ROUND(SUM(infectionRate * admissions) / NULLIF(SUM(admissions), 0), 2) AS infectionRate,
            ROUND(SUM(costPerCase * admissions) / NULLIF(SUM(admissions), 0), 2) AS costPerCase,
            ROUND(SUM(edWaitMinutes * admissions) / NULLIF(SUM(admissions), 0), 1) AS edWaitMinutes,
            ROUND(SUM(marginPct * admissions) / NULLIF(SUM(admissions), 0), 2) AS marginPct
        FROM facility_monthly_metrics
        GROUP BY month, monthLabel, quarter
        ORDER BY month
        """
    )


def metric_value_and_delta(
    connection: sqlite3.Connection,
    metric_id: str,
) -> tuple[float, float]:
    current_months = ("2025-10", "2025-11", "2025-12")
    prior_months = ("2025-07", "2025-08", "2025-09")

    if metric_id == "readmission-rate":
        sql = (
            "SELECT ROUND(SUM(readmissionRate * admissions) / SUM(admissions), 1) "
            "FROM monthly_capacity WHERE month IN (?, ?, ?)"
        )
    elif metric_id == "patient-satisfaction":
        sql = (
            "SELECT ROUND(SUM(patientSatisfaction * admissions) / SUM(admissions), 1) "
            "FROM monthly_capacity WHERE month IN (?, ?, ?)"
        )
    elif metric_id == "infection-rate":
        sql = (
            "SELECT ROUND(SUM(infectionRate * admissions) / SUM(admissions), 1) "
            "FROM monthly_capacity WHERE month IN (?, ?, ?)"
        )
    elif metric_id == "bed-occupancy":
        sql = "SELECT ROUND(AVG(bedOccupancy), 1) FROM monthly_capacity WHERE month IN (?, ?, ?)"
    elif metric_id == "ed-wait-time":
        sql = (
            "SELECT ROUND(SUM(edWaitMinutes * admissions) / SUM(admissions), 1) "
            "FROM monthly_capacity WHERE month IN (?, ?, ?)"
        )
    elif metric_id == "cost-per-case":
        sql = (
            "SELECT ROUND(SUM(costPerCase * admissions) / SUM(admissions), 1) "
            "FROM monthly_capacity WHERE month IN (?, ?, ?)"
        )
    elif metric_id == "margin":
        sql = (
            "SELECT ROUND(SUM(marginPct * admissions) / SUM(admissions), 1) "
            "FROM monthly_capacity WHERE month IN (?, ?, ?)"
        )
    else:
        raise ValueError(f'Unsupported executive summary metric "{metric_id}".')

    current_value = float(connection.execute(sql, current_months).fetchone()[0])
    prior_value = float(connection.execute(sql, prior_months).fetchone()[0])
    if metric_id == "cost-per-case":
        delta = round(((current_value / prior_value) - 1) * 100, 1)
    else:
        delta = round(current_value - prior_value, 1)
    return current_value, delta


def build_executive_summary_table(
    connection: sqlite3.Connection,
    scenario: dict[str, Any],
    *,
    compute_values: bool = False,
) -> None:
    rows = []
    for preview_row in scenario["previewDatasets"]["executive_summary"]:
        metric_id = preview_row["metricId"]
        if compute_values:
            value, delta = metric_value_and_delta(connection, metric_id)
        else:
            value = preview_row["value"]
            delta = preview_row["delta"]
        rows.append(
            {
                "metricId": metric_id,
                "value": value,
                "delta": delta,
                "deltaLabel": preview_row["deltaLabel"],
                "prefix": preview_row.get("prefix"),
                "suffix": preview_row.get("suffix"),
                "caption": preview_row["caption"],
            }
        )
    connection.executemany(
        """
        INSERT INTO executive_summary
        (metricId, value, delta, deltaLabel, prefix, suffix, caption)
        VALUES (:metricId, :value, :delta, :deltaLabel, :prefix, :suffix, :caption)
        """,
        rows,
    )


def seed_metadata_table(
    connection: sqlite3.Connection,
    pack_id: str,
    scenario_id: str,
    seed: int,
) -> None:
    connection.executemany(
        "INSERT INTO metadata (key, value) VALUES (?, ?)",
        [
            ("packId", pack_id),
            ("scenarioId", scenario_id),
            ("seed", str(seed)),
        ],
    )


def seed_dataset_catalog(
    connection: sqlite3.Connection,
    dataset_exports: tuple[tuple[str, str], ...],
) -> None:
    connection.executemany(
        "INSERT INTO dataset_catalog (datasetId, rowCount) VALUES (?, ?)",
        [
            (
                dataset_id,
                int(connection.execute(f'SELECT COUNT(*) FROM "{dataset_id}"').fetchone()[0]),
            )
            for dataset_id, _ in dataset_exports
        ],
    )


def generate_healthcare_database(
    *,
    scenario_id: str,
    output_path: str | Path,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
) -> dict[str, Any]:
    pack = load_pack("healthcare")
    scenario = get_pack_scenario(pack, scenario_id)
    effective_seed = seed if seed is not None else int(scenario["seed"])
    dataset_exports = resolve_dataset_exports(pack["packId"])
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()

    rows = build_department_monthly_rows(pack, scenario, effective_seed)
    connection = sqlite3.connect(output)
    try:
        create_database_schema(connection)
        seed_metadata_table(connection, pack["packId"], scenario_id, effective_seed)
        seed_dimension_tables(connection, pack)
        connection.executemany(
            """
            INSERT INTO department_monthly_metrics (
                month,
                monthLabel,
                quarter,
                facilityId,
                facilityName,
                departmentId,
                departmentName,
                payerId,
                payerName,
                diagnosisId,
                diagnosisName,
                admissions,
                discharges,
                edVisits,
                occupiedBeds,
                availableBeds,
                bedOccupancy,
                avgLengthOfStay,
                readmissionRate,
                infectionRate,
                patientSatisfaction,
                costPerCase,
                edWaitMinutes,
                mortalityIndex,
                marginPct,
                laborCostIndex
            ) VALUES (
                :month,
                :monthLabel,
                :quarter,
                :facilityId,
                :facilityName,
                :departmentId,
                :departmentName,
                :payerId,
                :payerName,
                :diagnosisId,
                :diagnosisName,
                :admissions,
                :discharges,
                :edVisits,
                :occupiedBeds,
                :availableBeds,
                :bedOccupancy,
                :avgLengthOfStay,
                :readmissionRate,
                :infectionRate,
                :patientSatisfaction,
                :costPerCase,
                :edWaitMinutes,
                :mortalityIndex,
                :marginPct,
                :laborCostIndex
            )
            """,
            rows,
        )
        build_facility_monthly_table(connection)
        build_monthly_capacity_table(connection)
        build_executive_summary_table(connection, scenario, compute_values=True)
        seed_dataset_catalog(connection, dataset_exports)
        connection.commit()
    finally:
        connection.close()

    if snapshot_output_path is not None:
        export_sqlite_snapshot(output, snapshot_output_path, dataset_exports)

    return {
        "packId": pack["packId"],
        "scenarioId": scenario_id,
        "seed": effective_seed,
        "outputPath": str(output),
        "snapshotOutputPath": str(snapshot_output_path) if snapshot_output_path else None,
    }


def build_financial_monthly_rows(
    pack: dict[str, Any],
    scenario: dict[str, Any],
    seed: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    months = pack["months"]
    profile = scenario["generationProfile"]
    preview_rows = scenario["previewDatasets"]["monthly_summary"]
    for index, month in enumerate(months):
        base_row = preview_rows[index % len(preview_rows)]
        total_aum = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "totalAum",
                base_value=float(base_row["totalAum"]),
                jitter=0.025,
            ),
            2,
        )
        net_flow = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "netFlow",
                base_value=float(base_row["netFlow"]),
                jitter=0.05,
            ),
            2,
        )
        retention = round(
            clamp(
                resolve_value(
                    seed,
                    scenario["scenarioId"],
                    month["id"],
                    "retention",
                    base_value=float(base_row["retentionRate"]),
                    jitter=0.008,
                )
                * float(profile["retentionShiftByMonth"][index]),
                0.0,
                1.0,
            ),
            3,
        )
        nps = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "nps",
                base_value=float(base_row["nps"]),
                jitter=0.05,
            )
            * float(profile["npsShiftByMonth"][index]),
            1,
        )
        rows.append(
            {
                "month": month["id"],
                "monthLabel": month["label"],
                "quarter": month["quarter"],
                "totalAum": total_aum,
                "netFlow": net_flow,
                "retentionRate": retention,
                "nps": nps,
            }
        )
    return rows


def build_financial_advisor_concentration_rows(
    pack: dict[str, Any],
    scenario: dict[str, Any],
    seed: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    base_rows = scenario["previewDatasets"]["advisor_concentration"]
    for base_row in base_rows:
        rows.append(
            {
                "advisorName": base_row["advisorName"],
                "aumShare": round(
                    resolve_value(
                        seed,
                        scenario["scenarioId"],
                        "advisor",
                        base_row["advisorName"],
                        base_value=float(base_row["aumShare"]),
                        jitter=0.04,
                    ),
                    2,
                ),
                "retentionRate": round(
                    clamp(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            "advisor",
                            base_row["advisorName"],
                            base_value=float(base_row["retentionRate"]),
                            jitter=0.08,
                        ),
                        0.0,
                        1.0,
                    ),
                    3,
                ),
            }
        )
    return rows


def create_financial_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;

        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE advisors (
            advisorId TEXT PRIMARY KEY,
            advisorName TEXT NOT NULL,
            region TEXT NOT NULL,
            baseAum REAL NOT NULL,
            baseClients INTEGER NOT NULL,
            baseRetention REAL NOT NULL
        );

        CREATE TABLE funds (
            fundId TEXT PRIMARY KEY,
            fundName TEXT NOT NULL,
            riskLevel TEXT NOT NULL,
            aumWeight REAL NOT NULL,
            baseReturn REAL NOT NULL,
            expenseRatio REAL NOT NULL,
            feeRate REAL NOT NULL
        );

        CREATE TABLE segments (
            segmentId TEXT PRIMARY KEY,
            segmentName TEXT NOT NULL,
            segmentShare REAL NOT NULL
        );

        CREATE TABLE regions (
            regionId TEXT PRIMARY KEY,
            regionName TEXT NOT NULL
        );

        CREATE TABLE monthly_summary (
            month TEXT NOT NULL,
            monthLabel TEXT NOT NULL,
            quarter TEXT NOT NULL,
            totalAum REAL NOT NULL,
            netFlow REAL NOT NULL,
            retentionRate REAL NOT NULL,
            nps REAL NOT NULL
        );

        CREATE TABLE advisor_concentration (
            advisorName TEXT NOT NULL,
            aumShare REAL NOT NULL,
            retentionRate REAL NOT NULL
        );

        CREATE TABLE executive_summary (
            metricId TEXT PRIMARY KEY,
            value REAL NOT NULL,
            delta REAL NOT NULL,
            deltaLabel TEXT NOT NULL,
            prefix TEXT,
            suffix TEXT,
            caption TEXT NOT NULL
        );

        CREATE TABLE dataset_catalog (
            datasetId TEXT PRIMARY KEY,
            rowCount INTEGER NOT NULL
        );
        """
    )


def seed_financial_dimensions(connection: sqlite3.Connection, pack: dict[str, Any]) -> None:
    connection.executemany(
        "INSERT INTO advisors VALUES (:id, :name, :region, :baseAum, :baseClients, :baseRetention)",
        [
            (
                advisor["id"],
                advisor["name"],
                advisor["region"],
                advisor["baseAum"],
                advisor["baseClients"],
                advisor["baseRetention"],
            )
            for advisor in pack["entities"]["advisors"]
        ],
    )
    connection.executemany(
        "INSERT INTO funds VALUES (:id, :name, :riskLevel, :aumWeight, :baseReturn, :expenseRatio, :feeRate)",
        [
            (
                fund["id"],
                fund["name"],
                fund["riskLevel"],
                fund["aumWeight"],
                fund["baseReturn"],
                fund["expenseRatio"],
                fund["feeRate"],
            )
            for fund in pack["entities"]["funds"]
        ],
    )
    connection.executemany(
        "INSERT INTO segments VALUES (:id, :name, :share)",
        [
            (segment["id"], segment["name"], segment["share"])
            for segment in pack["entities"]["segments"]
        ],
    )
    connection.executemany(
        "INSERT INTO regions VALUES (:id, :name)",
        [(region["id"], region["name"]) for region in pack["entities"]["regions"]],
    )


def generate_financial_database(
    *,
    scenario_id: str,
    output_path: str | Path,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
) -> dict[str, Any]:
    pack = load_pack("financial")
    scenario = get_pack_scenario(pack, scenario_id)
    effective_seed = seed if seed is not None else int(scenario["seed"])
    dataset_exports = resolve_dataset_exports(pack["packId"])
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()

    monthly_rows = build_financial_monthly_rows(pack, scenario, effective_seed)
    advisor_rows = build_financial_advisor_concentration_rows(pack, scenario, effective_seed)

    connection = sqlite3.connect(output)
    try:
        create_financial_schema(connection)
        seed_metadata_table(connection, pack["packId"], scenario_id, effective_seed)
        seed_financial_dimensions(connection, pack)
        connection.executemany(
            """
            INSERT INTO monthly_summary
            (month, monthLabel, quarter, totalAum, netFlow, retentionRate, nps)
            VALUES (:month, :monthLabel, :quarter, :totalAum, :netFlow, :retentionRate, :nps)
            """,
            monthly_rows,
        )
        connection.executemany(
            """
            INSERT INTO advisor_concentration
            (advisorName, aumShare, retentionRate)
            VALUES (:advisorName, :aumShare, :retentionRate)
            """,
            advisor_rows,
        )
        build_executive_summary_table(connection, scenario, compute_values=False)
        seed_dataset_catalog(connection, dataset_exports)
        connection.commit()
    finally:
        connection.close()

    if snapshot_output_path is not None:
        export_sqlite_snapshot(output, snapshot_output_path, dataset_exports)

    return {
        "packId": pack["packId"],
        "scenarioId": scenario_id,
        "seed": effective_seed,
        "outputPath": str(output),
        "snapshotOutputPath": str(snapshot_output_path) if snapshot_output_path else None,
    }


def build_saas_monthly_rows(
    pack: dict[str, Any],
    scenario: dict[str, Any],
    seed: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    months = pack["months"]
    preview_rows = scenario["previewDatasets"]["monthly_summary"]
    for index, month in enumerate(months):
        base_row = preview_rows[index % len(preview_rows)]
        mrr = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "mrr",
                base_value=float(base_row["mrr"]),
                jitter=0.03,
            ),
            2,
        )
        arr = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "arr",
                base_value=float(base_row["arr"]),
                jitter=0.03,
            ),
            2,
        )
        churn_rate = round(
            clamp(
                resolve_value(
                    seed,
                    scenario["scenarioId"],
                    month["id"],
                    "churn",
                    base_value=float(base_row["churnRate"]),
                    jitter=0.04,
                ),
                0.0,
                1.0,
            ),
            3,
        )
        nps = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "nps",
                base_value=float(base_row["nps"]),
                jitter=0.02,
            ),
            1,
        )
        support_tickets = round(
            resolve_value(
                seed,
                scenario["scenarioId"],
                month["id"],
                "tickets",
                base_value=float(base_row["supportTickets"]),
                jitter=0.05,
            ),
            0,
        )
        rows.append(
            {
                "month": month["id"],
                "monthLabel": month["label"],
                "quarter": month["quarter"],
                "mrr": mrr,
                "arr": arr,
                "churnRate": churn_rate,
                "nps": nps,
                "supportTickets": int(support_tickets),
            }
        )
    return rows


def build_saas_segment_rows(
    scenario: dict[str, Any],
    seed: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for segment_row in scenario["previewDatasets"]["segment_engagement"]:
        rows.append(
            {
                "segment": segment_row["segment"],
                "customerCount": int(
                    round(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            segment_row["segment"],
                            "customers",
                            base_value=float(segment_row["customerCount"]),
                            jitter=0.04,
                        )
                    )
                ),
                "churnRate": round(
                    clamp(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            segment_row["segment"],
                            "churnRate",
                            base_value=float(segment_row["churnRate"]),
                            jitter=0.06,
                        ),
                        0.0,
                        1.0,
                    ),
                    3,
                ),
                "netRetention": round(
                    clamp(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            segment_row["segment"],
                            "netRetention",
                            base_value=float(segment_row["netRetention"]),
                            jitter=0.04,
                        ),
                        0.7,
                        1.5,
                    ),
                    3,
                ),
                "featureAdoption": round(
                    clamp(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            segment_row["segment"],
                            "featureAdoption",
                            base_value=float(segment_row["featureAdoption"]),
                            jitter=0.05,
                        ),
                        0.0,
                        1.0,
                    ),
                    2,
                ),
            }
        )
    return rows


def build_saas_feature_rows(
    scenario: dict[str, Any],
    seed: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for feature_row in scenario["previewDatasets"]["feature_adoption"]:
        rows.append(
            {
                "feature": feature_row["feature"],
                "adoptionRate": round(
                    clamp(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            feature_row["feature"],
                            "adoption",
                            base_value=float(feature_row["adoptionRate"]),
                            jitter=0.07,
                        ),
                        0.0,
                        1.0,
                    ),
                    2,
                ),
                "activationRate": round(
                    clamp(
                        resolve_value(
                            seed,
                            scenario["scenarioId"],
                            feature_row["feature"],
                            "activation",
                            base_value=float(feature_row["activationRate"]),
                            jitter=0.07,
                        ),
                        0.0,
                        1.0,
                    ),
                    2,
                ),
                "supportTicketsPer100": round(
                    resolve_value(
                        seed,
                        scenario["scenarioId"],
                        feature_row["feature"],
                        "ticketsPer100",
                        base_value=float(feature_row["supportTicketsPer100"]),
                        jitter=0.1,
                    )
                ),
            }
        )
    return rows


def create_saas_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;

        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE plans (
            planId TEXT PRIMARY KEY,
            planName TEXT NOT NULL,
            pricePoint REAL NOT NULL
        );

        CREATE TABLE feature_areas (
            featureId TEXT PRIMARY KEY,
            featureName TEXT NOT NULL,
            baselineAdoption REAL NOT NULL
        );

        CREATE TABLE segments (
            segmentId TEXT PRIMARY KEY,
            segmentName TEXT NOT NULL,
            baseCustomers INTEGER NOT NULL
        );

        CREATE TABLE regions (
            regionId TEXT PRIMARY KEY,
            regionName TEXT NOT NULL
        );

        CREATE TABLE monthly_summary (
            month TEXT NOT NULL,
            monthLabel TEXT NOT NULL,
            quarter TEXT NOT NULL,
            mrr REAL NOT NULL,
            arr REAL NOT NULL,
            churnRate REAL NOT NULL,
            nps REAL NOT NULL,
            supportTickets INTEGER NOT NULL
        );

        CREATE TABLE segment_engagement (
            segment TEXT NOT NULL,
            customerCount INTEGER NOT NULL,
            churnRate REAL NOT NULL,
            netRetention REAL NOT NULL,
            featureAdoption REAL NOT NULL
        );

        CREATE TABLE feature_adoption (
            feature TEXT NOT NULL,
            adoptionRate REAL NOT NULL,
            activationRate REAL NOT NULL,
            supportTicketsPer100 REAL NOT NULL
        );

        CREATE TABLE executive_summary (
            metricId TEXT PRIMARY KEY,
            value REAL NOT NULL,
            delta REAL NOT NULL,
            deltaLabel TEXT NOT NULL,
            prefix TEXT,
            suffix TEXT,
            caption TEXT NOT NULL
        );

        CREATE TABLE dataset_catalog (
            datasetId TEXT PRIMARY KEY,
            rowCount INTEGER NOT NULL
        );
        """
    )


def seed_saas_dimensions(connection: sqlite3.Connection, pack: dict[str, Any]) -> None:
    connection.executemany(
        "INSERT INTO plans VALUES (:id, :name, :pricePoint)",
        [(plan["id"], plan["name"], plan["pricePoint"]) for plan in pack["entities"]["planTiers"]],
    )
    connection.executemany(
        "INSERT INTO feature_areas VALUES (:id, :name, :baselineAdoption)",
        [
            (feature["id"], feature["name"], feature["baselineAdoption"])
            for feature in pack["entities"]["featureAreas"]
        ],
    )
    connection.executemany(
        "INSERT INTO segments VALUES (:id, :name, :baseCustomers)",
        [
            (segment["id"], segment["name"], segment["baseCustomers"])
            for segment in pack["entities"]["segments"]
        ],
    )
    connection.executemany(
        "INSERT INTO regions VALUES (:id, :name)",
        [(region["id"], region["name"]) for region in pack["entities"]["regions"]],
    )


def generate_saas_database(
    *,
    scenario_id: str,
    output_path: str | Path,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
) -> dict[str, Any]:
    pack = load_pack("saas")
    scenario = get_pack_scenario(pack, scenario_id)
    effective_seed = seed if seed is not None else int(scenario["seed"])
    dataset_exports = resolve_dataset_exports(pack["packId"])
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()

    monthly_rows = build_saas_monthly_rows(pack, scenario, effective_seed)
    segment_rows = build_saas_segment_rows(scenario, effective_seed)
    feature_rows = build_saas_feature_rows(scenario, effective_seed)

    connection = sqlite3.connect(output)
    try:
        create_saas_schema(connection)
        seed_metadata_table(connection, pack["packId"], scenario_id, effective_seed)
        seed_saas_dimensions(connection, pack)
        connection.executemany(
            """
            INSERT INTO monthly_summary
            (month, monthLabel, quarter, mrr, arr, churnRate, nps, supportTickets)
            VALUES (:month, :monthLabel, :quarter, :mrr, :arr, :churnRate, :nps, :supportTickets)
            """,
            monthly_rows,
        )
        connection.executemany(
            """
            INSERT INTO segment_engagement
            (segment, customerCount, churnRate, netRetention, featureAdoption)
            VALUES (:segment, :customerCount, :churnRate, :netRetention, :featureAdoption)
            """,
            segment_rows,
        )
        connection.executemany(
            """
            INSERT INTO feature_adoption
            (feature, adoptionRate, activationRate, supportTicketsPer100)
            VALUES (:feature, :adoptionRate, :activationRate, :supportTicketsPer100)
            """,
            feature_rows,
        )
        build_executive_summary_table(connection, scenario, compute_values=False)
        seed_dataset_catalog(connection, dataset_exports)
        connection.commit()
    finally:
        connection.close()

    if snapshot_output_path is not None:
        export_sqlite_snapshot(output, snapshot_output_path, dataset_exports)

    return {
        "packId": pack["packId"],
        "scenarioId": scenario_id,
        "seed": effective_seed,
        "outputPath": str(output),
        "snapshotOutputPath": str(snapshot_output_path) if snapshot_output_path else None,
    }


def export_sqlite_snapshot(
    database_path: str | Path,
    snapshot_output_path: str | Path,
    dataset_exports: tuple[tuple[str, str], ...] | None = None,
) -> dict[str, Any]:
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    try:
        metadata = dict(
            connection.execute("SELECT key, value FROM metadata ORDER BY key").fetchall()
        )
        datasets = []
        exports = dataset_exports if dataset_exports is not None else resolve_dataset_exports(
            metadata["packId"],
        )
        for dataset_id, query in exports:
            result = connection.execute(query)
            rows = [dict(row) for row in result.fetchall()]
            columns = []
            for column_name in rows[0].keys() if rows else []:
                values = [row[column_name] for row in rows]
                column_type = infer_column_type(column_name, values)
                columns.append(
                    {
                        "name": column_name,
                        "type": column_type,
                        "role": infer_column_role(column_name, column_type),
                        "label": humanize_label(column_name),
                    }
                )
            datasets.append(
                {
                    "datasetId": dataset_id,
                    "rowCount": len(rows),
                    "columns": columns,
                    "rows": rows,
                }
            )
    finally:
        connection.close()

    snapshot = {
        "packId": metadata["packId"],
        "scenarioId": metadata["scenarioId"],
        "seed": int(metadata["seed"]),
        "datasets": datasets,
    }
    snapshot_path = Path(snapshot_output_path)
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_path.write_text(
        json.dumps(snapshot, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return snapshot

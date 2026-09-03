"""Package DataForge snapshot module for dashForge.

Provides utilities for packaging DataForge scenario generation outputs into
SQLite databases and schema-compliant JSON snapshots (SQLiteSnapshot).
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from dashForge._dataforge_compat import load_dataforge_module

_generate = load_dataforge_module("generate")

clamp = _generate.clamp
default_seed_for = _generate.default_seed_for
generate_financial_database = _generate.generate_financial_database
generate_healthcare_database = _generate.generate_healthcare_database
generate_saas_database = _generate.generate_saas_database
generate_snowflake_cost_database = _generate.generate_snowflake_cost_database
get_pack_scenario = _generate.get_pack_scenario
humanize_label = _generate.humanize_label
infer_column_role = _generate.infer_column_role
infer_column_type = _generate.infer_column_type
load_pack = _generate.load_pack
stable_factor = _generate.stable_factor
stable_fraction = _generate.stable_fraction

GENERATORS = {
    "healthcare": generate_healthcare_database,
    "financial": generate_financial_database,
    "saas": generate_saas_database,
    "snowflakeCost": generate_snowflake_cost_database,
}

DATASET_EXPORTS_BY_PACK: dict[str, tuple[tuple[str, str], ...]] = {
    pack: tuple(
        (dataset_id, f'SELECT * FROM "{dataset_id}"')
        for dataset_id, _ in exports
    )
    for pack, exports in _generate.DATASET_EXPORTS_BY_PACK.items()
}


def resolve_dataset_exports(pack_id: str) -> tuple[tuple[str, str], ...]:
    try:
        return DATASET_EXPORTS_BY_PACK[pack_id]
    except KeyError as error:
        raise ValueError(f'Unknown pack "{pack_id}".') from error


def export_sqlite_snapshot(
    database_path: str | Path,
    snapshot_output_path: str | Path,
    dataset_exports: tuple[tuple[str, str], ...] | list[str] | tuple[str, ...] | None = None,
    dataset_ids: list[str] | tuple[str, ...] | None = None,
) -> dict[str, Any]:
    """Export a SQLite database to a structured JSON snapshot conforming to SQLiteSnapshot.

    Args:
        database_path: Path to the SQLite database file.
        snapshot_output_path: Path where the JSON snapshot will be written.
        dataset_exports: Optional mapping of dataset IDs and queries.
        dataset_ids: Optional list of dataset table names to export.

    Returns:
        The snapshot data dictionary.
    """
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    try:
        metadata = dict(
            connection.execute(
                "SELECT key, value FROM metadata ORDER BY key"
            ).fetchall()
        )
        datasets = []
        if dataset_ids is not None:
            target_ids = list(dataset_ids)
        elif dataset_exports is not None:
            target_ids = [
                item[0] if isinstance(item, (tuple, list)) else str(item)
                for item in dataset_exports
            ]
        else:
            catalog_row = connection.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='dataset_catalog'"
            ).fetchone()
            if catalog_row:
                target_ids = [
                    row[0]
                    for row in connection.execute(
                        "SELECT datasetId FROM dataset_catalog"
                    ).fetchall()
                ]
            else:
                pack_exports = resolve_dataset_exports(metadata["packId"])
                target_ids = [item[0] for item in pack_exports]

        for dataset_id in target_ids:
            result = connection.execute(f'SELECT * FROM "{dataset_id}"')
            rows = [dict(row) for row in result.fetchall()]
            pragma_cols = connection.execute(
                f'PRAGMA table_info("{dataset_id}")'
            ).fetchall()
            col_names = (
                [col[1] for col in pragma_cols]
                if pragma_cols
                else (list(rows[0].keys()) if rows else [])
            )
            columns = []
            for column_name in col_names:
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
        if metadata.get("packId") == "snowflakeCost":
            from dashForge.snowflake_cost import validate_recommendation_queue_schema
            validate_recommendation_queue_schema(connection)
    finally:
        connection.close()

    snapshot = {
        "packId": metadata["packId"],
        "scenarioId": metadata["scenarioId"],
        "seed": int(metadata["seed"]),
        "datasets": datasets,
    }
    if metadata.get("packId") == "snowflakeCost":
        from dashForge.snowflake_cost import enrich_snowflake_cost_provenance
        snapshot = enrich_snowflake_cost_provenance(
            snapshot,
            metadata["scenarioId"],
            int(metadata["seed"]),
        )
    snapshot_path = Path(snapshot_output_path)
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_path.write_text(
        json.dumps(snapshot, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return snapshot


# Update sibling dataForge module to use our snapshot exporter and export definitions
_generate.DATASET_EXPORTS_BY_PACK = DATASET_EXPORTS_BY_PACK
_generate.export_sqlite_snapshot = export_sqlite_snapshot
_generate.resolve_dataset_exports = resolve_dataset_exports


def package_snapshot(
    pack: str = "healthcare",
    scenario: str | None = None,
    output_path: str | Path | None = None,
    snapshot_output_path: str | Path | None = None,
    seed: int | None = None,
    force: bool = False,
    *,
    scenario_id: str | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    """Package a scenario snapshot and/or SQLite database.

    Args:
        pack: Mock-data pack name ('healthcare', 'financial', 'saas').
        scenario: Scenario ID within the selected pack.
        output_path: Destination path for SQLite database.
        snapshot_output_path: Optional destination path for JSON snapshot.
        seed: Optional deterministic random seed.
        force: If True, overwrite existing files.
        scenario_id: Alternative keyword argument for scenario.
        **kwargs: Additional keyword arguments.

    Returns:
        Dictionary containing generation results and metadata.

    Raises:
        FileExistsError: If output path exists and force is False.
        ValueError: If pack or scenario is invalid or missing.
    """
    actual_scenario = (
        scenario
        or scenario_id
        or kwargs.get("scenario_id")
        or kwargs.get("scenario")
    )
    if not actual_scenario:
        raise ValueError("Scenario must be specified.")

    actual_output = (
        output_path
        or kwargs.get("output_path")
        or kwargs.get("output")
    )
    if not actual_output:
        raise ValueError("Output path must be specified.")

    actual_snapshot = (
        snapshot_output_path
        or kwargs.get("snapshot_output_path")
        or kwargs.get("snapshot_output")
    )
    actual_seed = seed if seed is not None else kwargs.get("seed")
    actual_force = force or kwargs.get("force", False)

    if pack not in GENERATORS:
        raise ValueError(f'Unknown pack "{pack}".')

    if pack == "snowflakeCost":
        from dashForge.snowflake_cost import validate_snowflake_cost_scenario
        validate_snowflake_cost_scenario(actual_scenario)

    output = Path(actual_output)
    snapshot_path = Path(actual_snapshot) if actual_snapshot else None

    existing_paths = [
        path for path in [output, snapshot_path] if path and path.exists()
    ]
    if existing_paths and not actual_force:
        raise FileExistsError(
            "Output path already exists. Pass --force to overwrite: "
            + ", ".join(str(path) for path in existing_paths)
        )

    generator = GENERATORS[pack]
    result = generator(
        scenario_id=actual_scenario,
        output_path=output,
        seed=actual_seed,
        snapshot_output_path=snapshot_path,
    )
    if pack == "snowflakeCost":
        from dashForge.snowflake_cost import validate_recommendation_queue_schema
        with sqlite3.connect(output) as conn:
            validate_recommendation_queue_schema(conn)
    return result


__all__ = [
    "DATASET_EXPORTS_BY_PACK",
    "GENERATORS",
    "clamp",
    "default_seed_for",
    "export_sqlite_snapshot",
    "generate_financial_database",
    "generate_healthcare_database",
    "generate_saas_database",
    "generate_snowflake_cost_database",
    "get_pack_scenario",
    "humanize_label",
    "infer_column_role",
    "infer_column_type",
    "load_pack",
    "package_snapshot",
    "resolve_dataset_exports",
    "stable_factor",
    "stable_fraction",
]

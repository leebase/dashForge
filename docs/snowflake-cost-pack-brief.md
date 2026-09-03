# Slice brief: snowflake-cost-pack

## Intent

Expose dataForge's `snowflakeCost` pack through dashForge's existing `generate` CLI and snapshot packager, so a buyer demo can be produced from any Snowflake cost story with one command, for example:

    env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --output <db.sqlite> --snapshot-output <snapshot.json>

The pack is already registered in dataForge (`DATASET_EXPORTS_BY_PACK["snowflakeCost"]`, seven exports such as `warehouse_metering_history`, `query_history`, `show_warehouses`, `recommendation_queue`); the story contracts live under `dataForge/data/snowflakeCost/` (for example `dashboard_csv/idle-warehouse-waste/story.md`). Today `--pack` only accepts `healthcare`, `financial`, and `saas`.

## Required behaviour

- `--pack snowflakeCost` is accepted; `--scenario` accepts every story the pack defines (enumerate them from dataForge, never hard-code the list in dashForge), and an unknown scenario fails closed with exit 2 and no traceback.
- Generation is deterministic for a given seed and produces the SQLite database plus the JSON snapshot in the same shape the `package-dataforge-snapshot` slice established (see `docs/package-dataforge-snapshot-contract.md`), reusing `package_snapshot.py`; do not add a second snapshot format.
- The snapshot metadata carries provenance sufficient to trace the governed source: pack, scenario, seed, the dataForge story contract path, the generator version, a generation timestamp, and an explicit `synthetic: true` flag with the human-readable disclosure text `Synthetic demo data`.
- The recommendation queue export is preserved with its priority (`executive_severity`), suggested owner, recommended action, evidence detail, and guardrail columns intact, because the dashboard slice that follows renders prioritized recommendations from it.
- Existing packs keep working unchanged; the full test suite stays green; dataForge sources are read-only.

## Out of scope

- No frontend, DashboardSpec, or scenario-folder work; that is the next slice.
- No live Snowflake access, no new dependencies, no edits under `dataForge/`.

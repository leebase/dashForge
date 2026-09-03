# Snowflake Cost Pack Implementation Plan

## Executive Summary & Context

The `snowflake-cost-pack` slice integrates `dataForge`'s existing `snowflakeCost` optimization pack into DashForge's canonical `generate` CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) and snapshot packager (`src/dashForge/package_snapshot.py`). This capability enables Anblicks consultants and operators to produce comprehensive, client-ready Snowflake cost optimization deliverables—such as `idle-warehouse-waste`, `bi-over-provisioning`, and `finops-maturity-assessment`—with a single command during enterprise client discovery workshops.

In alignment with `architecture.md`, `product-definition.md`, `AGENTS.md`, and `docs/snowflake-cost-pack-contract.md`, DashForge serves as the presentation runtime, scenario registration seam, and client-facing deliverable engine, while sibling project `dataForge` remains the deterministic generator and quality authority. This implementation plan defines the system architecture, component contracts, concrete work breakdown items, comprehensive test strategy, step-by-step verification procedures, risk mitigation controls, and an explicit bidirectional traceability matrix mapping every single acceptance check (`AC-1` through `AC-8`).

---

## Architecture

The `snowflake-cost-pack` architecture establishes a modular, decoupled bridge between `dataForge`'s relational Snowflake cost generation logic and DashForge's CLI packaging pipeline, producing normalized SQLite databases and schema-compliant `SQLiteSnapshot` JSON files without live cloud credentials or external runtime dependencies.

The architectural workflow and component relationships are structured as follows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DashForge CLI Layer                               │
│  src/dashForge/main.py: CLI Parser (argparse)                                │
│    ├── Command: generate                                                    │
│    ├── Flags: --pack (healthcare, financial, saas, snowflakeCost)            │
│    ├── Dynamic Scenario Validation: Interrogates dataForge at runtime       │
│    ├── Overwrite Guard: Fail-closed target pre-check (requires --force)      │
│    └── Graceful Diagnostics: parser.error() without uncaught tracebacks     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Snowflake Cost Extension Module                         │
│  src/dashForge/snowflake_cost.py                                            │
│    ├── Dynamic Scenario Discovery: Queries load_pack("snowflakeCost")       │
│    ├── Scenario Catalog Seam: Extracts scenario IDs without hardcoding      │
│    ├── Generator Dispatcher: Invokes generate_snowflake_cost_database       │
│    ├── Provenance Enrichment: Adds contract path, timestamp, synthetic flag │
│    └── Recommendation Queue Validator: Validates governance columns         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Packaging & Serialization Pipeline                       │
│  src/dashForge/package_snapshot.py & src/dashForge/generate.py              │
│    ├── SQLite Table Inspector: PRAGMA table_info & row extraction           │
│    ├── Column Schema Inferrer: Maps SQL types to dimension/measure/date/id  │
│    ├── 7 Dataset Exporters: executive_summary, warehouse_metering_history,  │
│    │   query_history, metering_history, database_storage_usage_history,     │
│    │   show_warehouses, recommendation_queue                                │
│    └── Canonical SQLiteSnapshot Serializer: Formats canonical JSON          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Canonical Output Artifacts                            │
│  1. Bounded SQLite Database (.sqlite): 7 relational tables + metadata       │
│  2. Canonical JSON Snapshot (.snapshot.json): Matching SQLiteSnapshot type  │
│       ├── packId: "snowflakeCost"                                           │
│       ├── scenarioId: e.g. "idle-warehouse-waste"                           │
│       ├── seed: e.g. 9101                                                   │
│       ├── dataForgeStoryContractPath: "stories/snowflake/<scenario>.md"     │
│       ├── generatorVersion: 1                                               │
│       ├── generationTimestamp: ISO-8601 UTC string                          │
│       ├── synthetic: true                                                   │
│       ├── disclosure: "Synthetic demo data"                                 │
│       └── datasets: 7 dataset objects with typed columns and record rows    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DashForge Presentation Runtime                          │
│  frontend/src/core/data/sqliteSnapshot.ts & createDashboardDataAdapter.ts   │
│    └── Zero-network offline execution for executive pre-sales workshops     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Subsystem Design & Component Responsibilities

1. **CLI Layer (`src/dashForge/main.py`)**:
   - Updates `build_parser()` to accept `snowflakeCost` within `--pack` choices: `["healthcare", "financial", "saas", "snowflakeCost"]`.
   - Implements dynamic scenario validation: before dispatching to generation, if `--pack snowflakeCost` is selected, dynamically checks the scenario ID against the discovered scenario list from `snowflake_cost.py`. If unknown, invokes `parser.error(f'Unknown snowflakeCost scenario "{args.scenario}". Available scenarios: ...')` with exit code 2.
   - Preserves fail-closed overwrite protection: inspects `--output` and `--snapshot-output` targets prior to generation. If any file exists and `--force` is false, invokes `parser.error(...)` with exit code 2.
   - Enforces clean error reporting: wraps generation dispatch in a `try...except (FileExistsError, ValueError) as error:` block and routes messages to `parser.error(str(error))`, eliminating raw Python tracebacks in front of executive audiences.

2. **Snowflake Cost Extension Module (`src/dashForge/snowflake_cost.py`)**:
   - `get_snowflake_cost_scenarios() -> list[str]`: Dynamically queries `load_pack("snowflakeCost")` from `dataForge.generate` and returns the list of registered scenario IDs (`[s["scenarioId"] for s in pack["scenarios"]]`). DashForge never hardcodes this list.
   - `validate_snowflake_cost_scenario(scenario_id: str) -> dict[str, Any]`: Validates that the requested scenario exists in the pack, returning the scenario definition dict or raising `ValueError`.
   - `enrich_snowflake_cost_provenance(snapshot: dict[str, Any], scenario_id: str, seed: int) -> dict[str, Any]`: Injects rich provenance metadata into the snapshot:
     - `dataForgeStoryContractPath`: Formatted relative path (e.g. `stories/snowflake/${scenario_id}.md`).
     - `generatorVersion`: Pack version integer or string from `load_pack("snowflakeCost")`.
     - `generationTimestamp`: ISO-8601 UTC formatted timestamp string.
     - `synthetic`: Explicit boolean `True`.
     - `disclosure`: Human-readable string `"Synthetic demo data"`.
   - `validate_recommendation_queue_schema(connection: sqlite3.Connection) -> None`: Asserts that the `recommendation_queue` table contains required governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`).

3. **Packaging & Serialization Module (`src/dashForge/package_snapshot.py`)**:
   - Registers `"snowflakeCost"` in `GENERATORS`, pointing to the generation handler.
   - Registers `"snowflakeCost"` in `DATASET_EXPORTS_BY_PACK`, importing exports from `_generate.DATASET_EXPORTS_BY_PACK["snowflakeCost"]`.
   - In `export_sqlite_snapshot`: Ensures all 7 datasets are exported, column types and roles are inferred via existing helpers, and snapshot metadata contains the enriched provenance block when packaging `snowflakeCost`.

4. **Compatibility Wrapper (`src/dashForge/generate.py`)**:
   - Re-exports `generate_snowflake_cost_database`, `get_snowflake_cost_scenarios`, and updated pack constants to maintain backwards compatibility for existing tests and scripts.

5. **Runtime Conformance (`frontend/src/core/data/sqliteSnapshot.ts`)**:
   - Ensures the generated snapshot JSON strictly complies with the TypeScript `SQLiteSnapshot` type, enabling zero-network offline query, filter, and aggregation operations.

---

## Routing & Execution Policy

Execution across the governed slice delivery lifecycle is partitioned among decoupled agent routes, strictly separating authoring, evaluation, and review in alignment with `docs/snowflake-cost-pack-contract.md`:

1. **Producer / Contract Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Establishes the governed slice contract under `docs/snowflake-cost-pack-contract.md` and the synchronized user journey manifest under `journeys/user_journeys_manifest.json`.
   - Adheres to repo operating rules, heading character floors (>= 120 chars), and strict write boundaries (`docs/`, `journeys/`).

2. **Planner Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Develops the concrete implementation plan under `plans/snowflake-cost-pack-implementation-plan.md` covering Architecture, Tests, Verification, and Risks.
   - Ensures bidirectional traceability between every contract acceptance check (`AC-1` through `AC-8`) and concrete plan items within permitted write scope (`plans/`).

3. **Test Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Implements targeted slice tests in `tests/test_snowflake_cost_pack.py` validating CLI argument parsing, dynamic discovery, determinism, fail-closed overwrite protection, provenance, and recommendation queues prior to implementation.
   - Strictly confines writes to `tests/` and `journeys/` without running pytest during authoring.

4. **Implementation Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Delivers `src/dashForge/snowflake_cost.py` and CLI extensions in `src/dashForge/` to satisfy all authored tests without modifying out-of-scope files or touching `dataForge/`.
   - Executes targeted pytest validation to confirm tests pass cleanly.

5. **Evaluator / User Tester Route (`user_tester` / `gemini-3.1-pro`)**:
   - Independently evaluates natural-language user journeys against allowlisted command prefixes (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest tests/ -q`).
   - Verifies command exit codes and stdout/stderr outputs without attempting code repairs, writing evaluation evidence under `artifacts/user-test/`.

6. **Independent Reviewer Route (`slice_reviewer` / `gemini-3.1-pro`)**:
   - Conducts read-only inspection of implementation diffs, test logs, contract adherence, and evidence integrity under `code-reviews/`.
   - Issues an authoritative review verdict (`clean` or `rejected`) based on governed criteria.

---

## Concrete Plan Items & Work Breakdown

The implementation is structured into eight concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-8`:

### Plan Item 1: CLI Entrypoint Expansion & Argument Parsing (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The packaging CLI entrypoint (invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`) accepts `--pack snowflakeCost` alongside existing packs (`healthcare`, `financial`, `saas`), supporting `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` flags.")
- **Objective**: Expand the CLI parser to accept `--pack snowflakeCost` and cleanly route all standard arguments.
- **Implementation**:
  - In `src/dashForge/main.py`: Update the `--pack` argument definition in `build_parser()` to include `"snowflakeCost"` in `choices=["healthcare", "financial", "saas", "snowflakeCost"]`.
  - Ensure all existing flags (`--scenario`, `--seed`, `--output`, `--snapshot-output`, `--force`) are accepted, parsed, and forwarded to `package_snapshot()`.
  - Maintain compatibility with default pack `healthcare`.
- **Deliverables**: Updated `src/dashForge/main.py` supporting `--pack snowflakeCost` via `env PYTHONPATH=src python3 -m dashForge.main generate`.

### Plan Item 2: Dynamic Scenario Discovery & Validation Engine (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The CLI dynamically discovers and accepts all scenarios registered by the `snowflakeCost` pack in `dataForge` (including `idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, and `finops-maturity-assessment`), never hardcoding the scenario list in DashForge. Unknown scenario identifiers fail closed with exit status 2 and a clean diagnostic message without unhandled Python tracebacks.")
- **Objective**: Dynamically discover scenarios from `dataForge` without hardcoding any scenario names in DashForge, and reject unknown scenarios cleanly.
- **Implementation**:
  - Create `src/dashForge/snowflake_cost.py` with `get_snowflake_cost_scenarios()` which loads `snowflakeCost` pack definitions via `_dataforge_compat.load_dataforge_module("generate").load_pack("snowflakeCost")`.
  - In `src/dashForge/main.py` and `package_snapshot()`, dynamically inspect valid scenarios for `snowflakeCost`.
  - If an unknown scenario identifier is supplied (e.g. `unknown-scenario`), fail closed by raising `ValueError(f'Unknown snowflakeCost scenario "{scenario_id}".')`, which `main.py` catches and translates to `parser.error()` exiting with status 2 and zero tracebacks.
- **Deliverables**: `src/dashForge/snowflake_cost.py` implementing dynamic discovery and fail-closed scenario validation.

### Plan Item 3: Fail-Closed Input & Argument Validation (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("The CLI fails closed with exit status 2 and a clean diagnostic message if invalid arguments or unknown packs are provided, or if required parameters (`--scenario`, `--output`) are missing, without displaying raw Python tracebacks.")
- **Objective**: Prevent unhandled tracebacks and enforce POSIX exit code 2 on missing or invalid CLI inputs.
- **Implementation**:
  - Rely on `argparse` standard validation for missing required arguments (`--scenario`, `--output`) and invalid pack choices, which automatically exits with code 2 and standard diagnostic usage text.
  - Intercept any generation exceptions (`ValueError`, `KeyError`) in `main.py`'s `main()` function and call `parser.error(str(error))`.
  - Verify that standard error outputs clean diagnostic text and contains no `Traceback (most recent call last)`.
- **Deliverables**: Clean CLI error handling in `src/dashForge/main.py` with exit code 2 and no raw tracebacks.

### Plan Item 4: Fail-Closed Overwrite Guard Enforcement (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The CLI strictly enforces fail-closed overwrite protection, exiting with status 2 and an informative diagnostic message when `--output` or `--snapshot-output` already exists on disk, unless the `--force` flag is explicitly specified.")
- **Objective**: Protect client workshop data against accidental overwriting unless `--force` is explicitly provided.
- **Implementation**:
  - In `package_snapshot()` (`src/dashForge/package_snapshot.py`), inspect `output_path` and `snapshot_output_path` prior to database connection or generation execution.
  - If any target path exists on the filesystem and `force` is `False`, raise `FileExistsError("Output path already exists. Pass --force to overwrite: ...")`.
  - In `main.py`, catch `FileExistsError` and route to `parser.error(...)`, exiting with status 2.
  - If `--force` is passed, unlink existing files or overwrite cleanly, returning exit code 0.
- **Deliverables**: Verified overwrite guard protecting both SQLite and JSON snapshot outputs.

### Plan Item 5: Deterministic SQLite Generation & Canonical Snapshot Packaging (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("Generation is bit-for-bit deterministic given identical inputs (`pack=snowflakeCost`, `scenario`, and `seed`), producing a normalized SQLite database and an exported JSON snapshot conforming strictly to the canonical `SQLiteSnapshot` contract via `package_snapshot.py` without introducing a second snapshot format.")
- **Objective**: Ensure bit-for-bit reproducibility and strict conformance with the canonical `SQLiteSnapshot` schema.
- **Implementation**:
  - Register `generate_snowflake_cost_database` in `GENERATORS` in `src/dashForge/package_snapshot.py`.
  - Support default seed resolution via `default_seed_for("snowflakeCost", scenario_id)` or explicit `--seed` override.
  - Export all 7 relational tables (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`).
  - In `export_sqlite_snapshot`, format JSON adhering to the canonical `SQLiteSnapshot` TypeScript contract (`{ "packId": ..., "scenarioId": ..., "seed": ..., "datasets": [ { "datasetId": ..., "columns": [...], "rows": [...] } ] }`) without creating a secondary format.
  - Verify identical SHA-256 hashes across identical generation runs.
- **Deliverables**: Deterministic SQLite and JSON snapshot packaging pipeline for `snowflakeCost`.

### Plan Item 6: Governed Provenance Metadata & Synthetic Data Disclosure (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("The exported JSON snapshot carries rich provenance metadata tracing back to the governed dataForge source, including `packId` (`snowflakeCost`), `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 generation timestamp, an explicit `synthetic: true` boolean flag, and human-readable disclosure text `"Synthetic demo data"`.")
- **Objective**: Ensure complete auditability and synthetic data transparency in exported client workshop snapshots.
- **Implementation**:
  - In `src/dashForge/snowflake_cost.py` (and invoked by `export_sqlite_snapshot` in `package_snapshot.py`), enrich the top-level snapshot JSON dictionary with:
    - `"packId"`: `"snowflakeCost"`
    - `"scenarioId"`: scenario ID string
    - `"seed"`: effective integer seed
    - `"dataForgeStoryContractPath"`: `"stories/snowflake/{scenario_id}.md"`
    - `"generatorVersion"`: pack version from `dataForge` (e.g. `1`)
    - `"generationTimestamp"`: ISO-8601 string (e.g. `datetime.now(timezone.utc).isoformat()`)
    - `"synthetic"`: `True` (boolean)
    - `"disclosure"`: `"Synthetic demo data"`
  - Verify presence and exact types of all provenance fields in the exported JSON file.
- **Deliverables**: Comprehensive provenance and synthetic disclosure enrichment in snapshot exports.

### Plan Item 7: Recommendation Queue Dataset Preservation & Column Integrity (`AC-7`)
- **Mapped Acceptance Check**: `AC-7` ("The exported `recommendation_queue` dataset preserves priority (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and guardrail (`guardrail`) columns intact to support downstream dashboard recommendation rendering.")
- **Objective**: Guarantee that all governance and prioritization columns in `recommendation_queue` are preserved in both SQLite and JSON snapshot outputs.
- **Implementation**:
  - Ensure the SQLite schema and seed logic for `recommendation_queue` exports all required governance fields:
    - `recommendation_id`: string identifier (e.g. `IWW-001`)
    - `executive_severity`: priority string (`P0`, `P1`, `P2`)
    - `suggested_owner`: responsible organizational role or team
    - `recommended_action`: concrete optimization step
    - `evidence_detail`: telemetry rationale
    - `guardrail`: operational precaution
  - In `package_snapshot.py`, extract `recommendation_queue` into the dataset list with all columns typed and labelled.
  - Implement programmatic schema validation checking that all six columns exist and contain non-empty data.
- **Deliverables**: Verified preservation of `recommendation_queue` columns across database and snapshot artifacts.

### Plan Item 8: Backwards Compatibility, Regression Immunity & Bound Preservation (`AC-8`)
- **Mapped Acceptance Check**: `AC-8` ("Existing industry packs (`healthcare`, `financial`, `saas`) continue to function unchanged with reproducible generation. The complete test suite executed via `python3 -m pytest tests/ -q` (with NO PYTHONPATH override) passes cleanly, with zero modifications to sibling project `dataForge`.")
- **Objective**: Guarantee zero regressions across existing industry packs, preserve sibling project isolation, and ensure all tests pass cleanly.
- **Implementation**:
  - Verify that `healthcare`, `financial`, and `saas` packs generate identical outputs before and after changes.
  - Keep sibling project `dataForge` strictly read-only; perform zero writes, modifications, or deletions in `dataForge/`.
  - Execute full test suite via `python3 -m pytest tests/ -q` with NO PYTHONPATH override, asserting 100% pass rate.
  - Confirm all persistent modifications are strictly confined to allowed paths for each step.
- **Deliverables**: Clean test suite run confirming zero regressions and absolute boundary preservation.

---

## Acceptance Criteria Traceability Matrix

The following bidirectional traceability matrix links each acceptance check defined in `docs/snowflake-cost-pack-contract.md` to its concrete plan item, implementation touchpoints, test methods, and user journey IDs:

| Acceptance Check | Plan Item | Implementation Touchpoints | Test & Verification Touchpoints | User Journey References |
|:-----------------|:----------|:---------------------------|:--------------------------------|:------------------------|
| **AC-1**: CLI entrypoint accepts `--pack snowflakeCost` alongside existing packs (`healthcare`, `financial`, `saas`), supporting `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` flags. | Plan Item 1: CLI Entrypoint Expansion & Argument Parsing (`AC-1`) | `src/dashForge/main.py`<br>`src/dashForge/package_snapshot.py` | `tests/test_snowflake_cost_pack.py::test_cli_generate_accepts_snowflake_cost_pack`<br>`tests/test_snowflake_cost_pack.py::test_cli_flags_passthrough` | `journey-snowflake-cost-idle-warehouse-generation`<br>`journey-snowflake-cost-fail-closed-overwrite`<br>`journey-snowflake-cost-dynamic-scenarios` |
| **AC-2**: CLI dynamically discovers and accepts all scenarios registered by `snowflakeCost` in `dataForge`, never hardcoding scenario list in DashForge; unknown scenarios fail closed with exit status 2 and clean diagnostic. | Plan Item 2: Dynamic Scenario Discovery & Validation Engine (`AC-2`) | `src/dashForge/snowflake_cost.py`<br>`src/dashForge/main.py` | `tests/test_snowflake_cost_pack.py::test_dynamic_scenario_discovery_matches_dataforge`<br>`tests/test_snowflake_cost_pack.py::test_unknown_snowflake_cost_scenario_fails_cleanly` | `journey-snowflake-cost-idle-warehouse-generation`<br>`journey-snowflake-cost-dynamic-scenarios`<br>`journey-snowflake-cost-invalid-inputs-handling` |
| **AC-3**: CLI fails closed with exit status 2 and clean diagnostic message if invalid arguments or unknown packs are provided, or if required parameters are missing, without displaying raw Python tracebacks. | Plan Item 3: Fail-Closed Input & Argument Validation (`AC-3`) | `src/dashForge/main.py` | `tests/test_snowflake_cost_pack.py::test_missing_required_args_fails_with_exit_2`<br>`tests/test_snowflake_cost_pack.py::test_invalid_pack_fails_with_exit_2_no_traceback` | `journey-snowflake-cost-fail-closed-overwrite`<br>`journey-snowflake-cost-invalid-inputs-handling` |
| **AC-4**: CLI strictly enforces fail-closed overwrite protection, exiting with status 2 and informative diagnostic when `--output` or `--snapshot-output` already exists, unless `--force` is specified. | Plan Item 4: Fail-Closed Overwrite Guard Enforcement (`AC-4`) | `src/dashForge/package_snapshot.py`<br>`src/dashForge/main.py` | `tests/test_snowflake_cost_pack.py::test_fail_closed_when_output_exists`<br>`tests/test_snowflake_cost_pack.py::test_force_overwrites_existing_output` | `journey-snowflake-cost-idle-warehouse-generation`<br>`journey-snowflake-cost-fail-closed-overwrite` |
| **AC-5**: Generation is bit-for-bit deterministic given identical inputs (`pack=snowflakeCost`, `scenario`, `seed`), producing normalized SQLite database and JSON snapshot conforming strictly to `SQLiteSnapshot` contract. | Plan Item 5: Deterministic SQLite Generation & Canonical Snapshot Packaging (`AC-5`) | `src/dashForge/snowflake_cost.py`<br>`src/dashForge/package_snapshot.py` | `tests/test_snowflake_cost_pack.py::test_bit_for_bit_deterministic_generation`<br>`tests/test_snowflake_cost_pack.py::test_snapshot_schema_conformance` | `journey-snowflake-cost-idle-warehouse-generation`<br>`journey-snowflake-cost-dynamic-scenarios`<br>`journey-existing-packs-regression-and-test-suite` |
| **AC-6**: Exported JSON snapshot carries rich provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, generation timestamp, `synthetic: true`, disclosure `"Synthetic demo data"`). | Plan Item 6: Governed Provenance Metadata & Synthetic Data Disclosure (`AC-6`) | `src/dashForge/snowflake_cost.py`<br>`src/dashForge/package_snapshot.py` | `tests/test_snowflake_cost_pack.py::test_snapshot_provenance_metadata`<br>`tests/test_snowflake_cost_pack.py::test_synthetic_disclosure_text` | `journey-snowflake-cost-idle-warehouse-generation`<br>`journey-snowflake-cost-recommendations-and-provenance` |
| **AC-7**: Exported `recommendation_queue` dataset preserves priority (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and guardrail (`guardrail`). | Plan Item 7: Recommendation Queue Dataset Preservation & Column Integrity (`AC-7`) | `src/dashForge/snowflake_cost.py`<br>`src/dashForge/package_snapshot.py` | `tests/test_snowflake_cost_pack.py::test_recommendation_queue_governance_columns`<br>`tests/test_snowflake_cost_pack.py::test_recommendation_queue_row_integrity` | `journey-snowflake-cost-idle-warehouse-generation`<br>`journey-snowflake-cost-recommendations-and-provenance` |
| **AC-8**: Existing industry packs (`healthcare`, `financial`, `saas`) continue functioning unchanged; complete test suite (`python3 -m pytest tests/ -q` with NO PYTHONPATH override) passes cleanly; zero modifications to `dataForge`. | Plan Item 8: Backwards Compatibility, Regression Immunity & Bound Preservation (`AC-8`) | `src/dashForge/main.py`<br>`src/dashForge/package_snapshot.py`<br>`src/dashForge/generate.py` | `tests/test_package_snapshot.py`<br>`tests/test_generate.py`<br>`tests/test_dataforge_compat.py`<br>`tests/test_snowflake_cost_pack.py::test_existing_packs_unaffected` | `journey-existing-packs-regression-and-test-suite` |

---

## Tests

The automated test strategy enforces contract-driven verification using `pytest`. All tests operate within sandboxed temporary directories (`tmp_path`), invoke commands via subprocess or direct Python APIs, and require zero external network access or third-party package installations.

Under this heading, the test suite structure, specific test methods, error handling assertions, determinism validations, and regression safeguards are fully specified:

### Targeted Slice Test Suite: `tests/test_snowflake_cost_pack.py`

The new test suite authored in `step_04` will contain comprehensive, isolated test functions targeting every acceptance check:

1. **CLI Flag & Dispatch Tests (`AC-1`)**:
   - `test_cli_generate_accepts_snowflake_cost_pack(tmp_path)`: Invokes CLI with `--pack snowflakeCost --scenario idle-warehouse-waste --output <path> --snapshot-output <path> --force`. Asserts exit code 0 and verifies files are created.
   - `test_cli_generate_supports_seed_override(tmp_path)`: Generates with explicit `--seed 9999`. Reads SQLite metadata table and verifies `seed` is `9999`.

2. **Dynamic Scenario Discovery Tests (`AC-2`)**:
   - `test_dynamic_scenario_discovery_matches_dataforge()`: Imports `get_snowflake_cost_scenarios()` and verifies it returns all 6 scenarios (`idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, `finops-maturity-assessment`) discovered dynamically from `dataForge`.
   - `test_no_hardcoded_scenarios_in_dashforge_source()`: Inspects `src/dashForge` source files using regex/string search to ensure scenario names are not hardcoded in scenario list literals.
   - `test_unknown_snowflake_cost_scenario_fails_cleanly(tmp_path)`: Passes `--pack snowflakeCost --scenario non-existent-scenario`. Asserts exit code 2, verifies diagnostic message mentions unknown scenario, and asserts no Python traceback appears in stderr.

3. **Fail-Closed Argument & Input Validation Tests (`AC-3`)**:
   - `test_missing_required_scenario_flag(tmp_path)`: Invokes CLI without `--scenario`. Asserts exit code 2 and usage message in stderr.
   - `test_missing_required_output_flag()`: Invokes CLI without `--output`. Asserts exit code 2 and usage message in stderr.
   - `test_invalid_pack_choice(tmp_path)`: Passes `--pack invalid_pack`. Asserts exit code 2 and invalid choice message in stderr.
   - `test_clean_diagnostic_no_traceback_on_error(tmp_path)`: Asserts that across all invalid input scenarios, stderr does not contain `"Traceback (most recent call last)"`.

4. **Fail-Closed Overwrite Protection Tests (`AC-4`)**:
   - `test_fail_closed_when_output_sqlite_exists(tmp_path)`: Creates dummy file at target SQLite path. Invokes CLI without `--force`. Asserts exit code 2 and asserts stderr contains `Output path already exists. Pass --force to overwrite`.
   - `test_fail_closed_when_snapshot_output_exists(tmp_path)`: Creates dummy file at target snapshot JSON path. Invokes CLI without `--force`. Asserts exit code 2 and diagnostic message.
   - `test_force_flag_allows_overwriting(tmp_path)`: Creates dummy files at target paths. Invokes CLI with `--force`. Asserts exit code 0 and confirms targets are overwritten with valid generated data.

5. **Determinism & Canonical Snapshot Schema Tests (`AC-5`)**:
   - `test_bit_for_bit_deterministic_generation(tmp_path)`: Generates `idle-warehouse-waste` twice with seed `9101` to separate directories. Computes SHA-256 hashes of both SQLite databases and snapshot JSON files. Asserts identical hashes.
   - `test_snapshot_schema_conformance(tmp_path)`: Generates snapshot and parses JSON. Asserts top-level keys (`packId`, `scenarioId`, `seed`, `datasets`). Verifies that `datasets` contains exactly 7 datasets and each dataset conforms to `{ datasetId, rowCount, columns, rows }`.
   - `test_column_definitions_and_roles(tmp_path)`: Inspects column definitions for all datasets. Verifies each column has `name`, `type` in `["string", "number", "date", "boolean"]`, and `role` in `["dimension", "measure", "date", "id"]`.

6. **Provenance Metadata & Synthetic Disclosure Tests (`AC-6`)**:
   - `test_snapshot_provenance_metadata(tmp_path)`: Parses generated JSON snapshot. Asserts:
     - `snapshot["packId"] == "snowflakeCost"`
     - `snapshot["scenarioId"] == "idle-warehouse-waste"`
     - `snapshot["seed"] == 9101`
     - `snapshot["dataForgeStoryContractPath"] == "stories/snowflake/idle-warehouse-waste.md"`
     - `snapshot["generatorVersion"] == 1`
     - `snapshot["generationTimestamp"]` parses cleanly as ISO-8601 UTC.
     - `snapshot["synthetic"] is True`
     - `snapshot["disclosure"] == "Synthetic demo data"`

7. **Recommendation Queue Column & Integrity Tests (`AC-7`)**:
   - `test_recommendation_queue_governance_columns(tmp_path)`: Inspects `recommendation_queue` in SQLite and snapshot. Asserts presence of required governance columns:
     `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`.
   - `test_recommendation_queue_data_validity(tmp_path)`: Verifies row count > 0, `executive_severity` values are valid (`P0`, `P1`), and fields contain non-empty strings.

8. **Backwards Compatibility & Regression Immunity Tests (`AC-8`)**:
   - `test_existing_packs_unaffected(tmp_path)`: Verifies that `healthcare` (`flu-season`), `financial` (`market-downturn`), and `saas` (`churn-crisis`) continue to generate bit-for-bit identical databases and snapshots.
   - `test_dataforge_unmodified()`: Verifies sibling project `dataForge` remains completely pristine with zero git modifications.

### Test Execution Command

The complete test suite is executed from the workspace root using pytest with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
All existing and new tests must complete within 20 seconds and achieve a 100% pass rate.

---

## Verification

The verification procedures provide concrete, step-by-step shell commands to validate the implementation end-to-end against every acceptance check and user journey.

Under this heading, commands, expected exit codes, and diagnostic verification checks are detailed:

### Step-by-Step Verification Protocol

1. **Verify CLI Subcommand & Argument Parsing (`AC-1`, `AC-5`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario idle-warehouse-waste \
     --seed 9101 \
     --output /tmp/test-snowflake.sqlite \
     --snapshot-output /tmp/test-snowflake.snapshot.json \
     --force
   ```
   - *Expected Outcome*: Exit code 0. Stderr empty. Outputs `/tmp/test-snowflake.sqlite` and `/tmp/test-snowflake.snapshot.json`.

2. **Verify Dynamic Scenario Discovery (`AC-2`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario bi-over-provisioning \
     --seed 9102 \
     --output /tmp/test-bi.sqlite \
     --snapshot-output /tmp/test-bi.snapshot.json \
     --force
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario finops-maturity-assessment \
     --seed 9106 \
     --output /tmp/test-finops.sqlite \
     --snapshot-output /tmp/test-finops.snapshot.json \
     --force
   ```
   - *Expected Outcome*: Exit code 0 for all dynamically discovered scenarios.

3. **Verify Fail-Closed Overwrite Protection (`AC-4`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario idle-warehouse-waste \
     --output /tmp/test-snowflake.sqlite
   ```
   - *Expected Outcome*: Exit code 2. Stderr contains `Output path already exists. Pass --force to overwrite: /tmp/test-snowflake.sqlite`.

4. **Verify Clean Diagnostic on Unknown Scenario (`AC-2`, `AC-3`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario invalid-scenario-xyz \
     --output /tmp/test-invalid.sqlite \
     --force
   ```
   - *Expected Outcome*: Exit code 2. Stderr reports unknown scenario. No Python traceback appears.

5. **Verify Clean Diagnostic on Missing Arguments (`AC-3`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost
   ```
   - *Expected Outcome*: Exit code 2. Stderr displays standard usage error indicating missing `--scenario` and `--output`.

6. **Verify Provenance Metadata & Synthetic Disclosure (`AC-6`)**:
   ```bash
   python3 -c "
   import json
   with open('/tmp/test-snowflake.snapshot.json') as f:
       snap = json.load(f)
   assert snap['packId'] == 'snowflakeCost'
   assert snap['scenarioId'] == 'idle-warehouse-waste'
   assert snap['seed'] == 9101
   assert snap['synthetic'] is True
   assert snap['disclosure'] == 'Synthetic demo data'
   assert 'dataForgeStoryContractPath' in snap
   assert 'generatorVersion' in snap
   assert 'generationTimestamp' in snap
   print('Provenance verification PASSED')
   "
   ```
   - *Expected Outcome*: Exit code 0, prints `Provenance verification PASSED`.

7. **Verify Recommendation Queue Schema & Column Preservation (`AC-7`)**:
   ```bash
   python3 -c "
   import sqlite3, json
   conn = sqlite3.connect('/tmp/test-snowflake.sqlite')
   cursor = conn.execute('PRAGMA table_info(recommendation_queue)')
   cols = {row[1] for row in cursor.fetchall()}
   required = {'recommendation_id', 'executive_severity', 'suggested_owner', 'recommended_action', 'evidence_detail', 'guardrail'}
   assert required.issubset(cols), f'Missing columns: {required - cols}'
   count = conn.execute('SELECT COUNT(*) FROM recommendation_queue').fetchone()[0]
   assert count > 0, 'recommendation_queue is empty'
   conn.close()
   with open('/tmp/test-snowflake.snapshot.json') as f:
       snap = json.load(f)
   ds = next(d for d in snap['datasets'] if d['datasetId'] == 'recommendation_queue')
   ds_cols = {c['name'] for c in ds['columns']}
   assert required.issubset(ds_cols), f'Snapshot missing columns: {required - ds_cols}'
   print('Recommendation queue verification PASSED')
   "
   ```
   - *Expected Outcome*: Exit code 0, prints `Recommendation queue verification PASSED`.

8. **Verify Determinism via Bit-for-Bit Hash Matching (`AC-5`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/run1.sqlite --snapshot-output /tmp/run1.snapshot.json --force
   env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/run2.sqlite --snapshot-output /tmp/run2.snapshot.json --force
   sha256sum /tmp/run1.sqlite /tmp/run2.sqlite
   sha256sum /tmp/run1.snapshot.json /tmp/run2.snapshot.json
   ```
   - *Expected Outcome*: Identical SHA-256 hashes between run 1 and run 2.

9. **Verify Backwards Compatibility & Full Test Suite (`AC-8`)**:
   ```bash
   python3 -m pytest tests/ -q
   ```
   - *Expected Outcome*: All test cases pass cleanly with exit code 0.

10. **Verify Governed Write Scope Boundary (`AC-8`)**:
    ```bash
    git status --porcelain
    ```
    - *Expected Outcome*: No modified or untracked files outside permitted step scope (`plans/` for this step).

---

## Risks

The following risk analysis evaluates potential failure modes across workshop operations, dynamic scenario resolution, schema alignment, and governance compliance, providing specific mitigation controls for each:

Under this heading, operational risks and technical edge cases are systematically addressed with robust architectural and testing safeguards:

| Risk Description | Severity | Likelihood | Concrete Preventative & Mitigation Controls |
|:-----------------|:--------:|:----------:|:---------------------------------------------|
| **Executive Workshop Overwrite Disaster**: An operator preparing multiple demo scenarios accidentally overwrites previously tuned scenario artifacts. | High | Medium | Enforce pre-execution fail-closed path existence checks on both `--output` and `--snapshot-output`. Execution aborts with exit code 2 and explicit diagnostic guidance unless `--force` is provided (`AC-4`). |
| **dataForge Dynamic Loading Drift**: Relative path resolution between sibling workspaces fails if the directory layout changes or when running in containerized environments. | High | Low | Dynamic loader in `_dataforge_compat.py` supports `DATAFORGE_SRC` environment variable override with automatic fallback to sibling candidate paths, raising clean descriptive diagnostic errors (`AC-2`, `AC-3`). |
| **Hardcoded Scenario Staleness**: Adding new scenarios in `dataForge` leaves DashForge out of date if scenario lists are duplicated or hardcoded. | Medium | Low | DashForge dynamically queries `load_pack("snowflakeCost")["scenarios"]` at runtime. Source code grep tests in `test_snowflake_cost_pack.py` ensure no hardcoded scenario ID arrays exist in DashForge (`AC-2`). |
| **Downstream Recommendation Widget Breakage**: Dropping or renaming columns in `recommendation_queue` breaks executive priority sorting and action display in the UI. | High | Low | Dedicated schema assertions in `snowflake_cost.py` and automated test assertions in `test_snowflake_cost_pack.py` verify all six governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) exist and contain valid values (`AC-7`). |
| **Client Confusion Over Synthetic Data Origin**: Downstream prospects or workshop attendees mistake synthetic figures for real enterprise account metrics. | High | Low | Inject explicit synthetic disclosure metadata (`synthetic: true`, `disclosure: "Synthetic demo data"`, `dataForgeStoryContractPath`) into the root of every exported JSON snapshot (`AC-6`). |
| **Non-Deterministic Data Generation Fluctuations**: Random number generator variance causes KPI numbers to shift between rehearsal and presentation. | High | Low | Explicit integer seed resolution via `default_seed_for("snowflakeCost", scenario_id)` or `--seed` flag, verified by automated bit-for-bit SHA-256 hash comparison tests (`AC-5`). |
| **Unhandled Traceback Presentation Hazard**: Invalid CLI arguments or syntax typos cause Python stack traces to spew onto projector screens during client pitches. | Medium | Low | Global exception handling in `main.py` catches `ValueError`, `KeyError`, and `FileExistsError`, translating them into clean single-line `parser.error()` diagnostics with POSIX exit code 2 (`AC-3`). |
| **Read-Only Sibling Boundary Violation**: Slice modifications accidentally touch or write into `../dataForge`, breaking repository isolation. | High | Low | Strict enforcement of step write boundaries. Automated test `test_dataforge_unmodified` verifies git cleanliness of sibling project `dataForge` (`AC-8`). |
| **Pytest Environment PYTHONPATH Masking**: Running pytest with an explicit `PYTHONPATH` override in bounded validation environments breaks pytest loading. | High | Medium | All test commands and user journey executions specify `python3 -m pytest tests/ -q` with NO PYTHONPATH override, relying on standard package resolution (`AC-8`). |

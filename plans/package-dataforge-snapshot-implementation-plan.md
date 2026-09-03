# Package DataForge Snapshot Implementation Plan

## Executive Summary & Context

The `package-dataforge-snapshot` slice formalizes the interface, tooling, and deterministic workflows required to package scenario generation outputs from the sibling `dataForge` generator into standalone SQLite databases and derived JSON snapshots (`SQLiteSnapshot`). In accordance with `architecture.md` and `product-definition.md`, DashForge acts as the consumer and presentation runtime for consulting deliverables, while `dataForge` owns deterministic data generation and quality verification.

This implementation plan defines the system architecture, routing policies, concrete work breakdown, automated test strategy, execution verification procedures, operational risk mitigation controls, and an exhaustive traceability matrix mapping every single acceptance check (`AC-1` through `AC-8`) defined in `docs/package-dataforge-snapshot-contract.md`.

---

## Architecture

The snapshot packaging architecture provides a decoupled, deterministic pipeline bridging the data generation engine with the frontend standalone presentation runtime. The packaging pipeline extracts relational tables and typed metadata from generated SQLite databases, structures them into the portable `SQLiteSnapshot` format, and enforces fail-closed overwrite protection.

The system architecture and component interactions are organized as follows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DashForge CLI Layer                               │
│  src/dashForge/main.py: CLI Parser (argparse)                                │
│    ├── Command: generate                                                    │
│    ├── Flags: --pack, --scenario, --seed, --output, --snapshot-output, --force│
│    ├── Overwrite Guard: Fail-closed path existence pre-checks                │
│    └── Subcommand Router: Dispatches generation and snapshot export         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Packaging & Serialization Module                         │
│  src/dashForge/package_snapshot.py & src/dashForge/generate.py              │
│    ├── Snapshot Packager: Inspects SQLite PRAGMA table_info & queries rows  │
│    ├── Column Schema Inferrer: Assigns types and semantic roles             │
│    ├── Sibling Loader: Dynamically resolves dataForge generator module      │
│    └── Pack Dispatcher: Routes healthcare, financial, and saas generators   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Canonical Generation Artifacts                         │
│  1. SQLite Database (.sqlite): Bounded relational tables with FK integrity  │
│  2. JSON Snapshot (.json): Portable SQLiteSnapshot schema representation    │
│       ├── [datasetId]: Dataset container dictionary                         │
│       │     ├── columns: Array of ColumnDef { name, type, role }            │
│       │     └── rows: Array of record objects matching table data           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DashForge Runtime Integration                           │
│  frontend/src/core/data/sqliteSnapshot.ts & createDashboardDataAdapter.ts   │
│    └── Ingests SQLiteSnapshot for zero-network, fully offline execution     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Components & Subsystem Responsibilities

1. **CLI Layer (`src/dashForge/main.py`)**:
   - Implements POSIX-compliant argument parsing using Python standard library `argparse`.
   - Supports the `generate` subcommand with parameters: `--pack` (`healthcare`, `financial`, `saas`), `--scenario` (required string), `--seed` (optional integer), `--output` (required SQLite output path), `--snapshot-output` (optional JSON snapshot export path), and `--force` (boolean flag).
   - Executes pre-generation inspection of target file paths (`--output` and `--snapshot-output`). If any target file already exists and `--force` is omitted, the CLI aborts with exit code 2 and outputs an informative diagnostic error.

2. **Packaging & Serialization Module (`src/dashForge/package_snapshot.py`)**:
   - Directly inspects the generated SQLite database using Python standard library `sqlite3`.
   - Queries `sqlite_master` for non-internal table names and inspects column structures via `PRAGMA table_info(<table_name>)`.
   - Infers column data types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`) based on column names and data types.
   - Extracts all rows as dictionaries mapping column names to values, producing a structured dictionary conforming to `SQLiteSnapshot`.
   - Serializes the snapshot to formatted JSON using `json.dump(..., indent=2)`.

3. **Compatibility & Dispatch Layer (`src/dashForge/generate.py` & `src/dashForge/_dataforge_compat.py`)**:
   - Resolves sibling project `dataForge` dynamically via `DATAFORGE_SRC` environment variable or relative repository path (`../dataForge/src`).
   - Dispatches scenario generation to the appropriate pack generator (`generate_healthcare_database`, `generate_financial_database`, `generate_saas_database`).
   - Integrates snapshot export into the generation lifecycle whenever `--snapshot-output` is requested.

4. **Frontend Runtime Seam (`frontend/src/core/data/sqliteSnapshot.ts` & `createDashboardDataAdapter.ts`)**:
   - Ingests the exported `SQLiteSnapshot` JSON artifact directly into DashForge's client-side runtime.
   - Provides full query, filtering, and aggregation capabilities via `DataAdapter` without requiring an active database server or live backend connectivity.

### Deterministic Execution & Seed Management

To satisfy the Anblicks workshop reliability requirement, all generation operations must be 100% reproducible. Given identical inputs (`pack`, `scenario`, `seed`), the pipeline generates bit-for-bit identical SQLite databases and JSON snapshot files. When `--seed` is not explicitly passed on the CLI, a deterministic scenario-default integer seed is resolved by `default_seed_for(pack_id, scenario_id)`.

---

## Routing & Execution Policy

Execution across the governed slice delivery lifecycle is partitioned among three decoupled agent routes, strictly separating authoring, evaluation, and review:

1. **Producer / Implementer Route (`codex_cli`)**:
   - Responsible for authoring tests, implementation code, and documentation artifacts within declared write boundaries.
   - Follows the development loop and operating rules defined in `AGENTS.md`.
   - Must not modify out-of-scope files or alter evaluation manifests outside designated steps.

2. **Evaluator / User Tester Route (`user_tester`)**:
   - Evaluates natural-language user journeys independently against allowlisted command prefixes declared in `journeys/user_journeys_manifest.json`.
   - Executes commands verbatim from the workspace root (using `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q` with NO PYTHONPATH override).
   - Inspects exit codes and stdout/stderr outputs without modifying project source code or attempting code repairs.
   - Strictly marks journey execution outcomes as `passed` or `failed`.

3. **Independent Reviewer Route (`claude_code` / `independent_reviewer`)**:
   - Conducts read-only inspection of git diffs, implementation code, automated test output, and validation records.
   - Verifies contract compliance, evidence integrity, and absence of regression or scope leakage.
   - Delivers an authoritative review verdict (`clean` or `rejected`) based on governed criteria.

---

## Concrete Plan Items & Work Breakdown

The implementation is partitioned into eight concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-8`:

### Plan Item 1: CLI Entrypoint & Argument Parsing (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The packaging CLI entrypoint (invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`) provides a deterministic command supporting `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` flags.")
- **Objective**: Provide a deterministic command-line interface supporting all required flags and subcommands.
- **Implementation**:
  - Maintain `build_parser()` in `src/dashForge/main.py` using `argparse`.
  - Configure the `generate` subcommand with arguments:
    - `--pack`: Default `healthcare`, choices `["healthcare", "financial", "saas"]`.
    - `--scenario`: String, required.
    - `--seed`: Integer, optional.
    - `--output`: String path, required.
    - `--snapshot-output`: String path, optional.
    - `--force`: Boolean flag (`action="store_true"`), optional.
- **Deliverables**: Verified CLI entrypoint callable via `env PYTHONPATH=src python3 -m dashForge.main generate`.

### Plan Item 2: Fail-Closed Overwrite Protection Engine (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The packaging command strictly prevents unintended file overwrites by failing closed with an informative diagnostic message and non-zero exit code when the target output file exists, unless `--force` is explicitly specified.")
- **Objective**: Prevent silent data loss or accidental overwriting of prepared client workshop deliverables.
- **Implementation**:
  - In `src/dashForge/main.py`, construct `pathlib.Path` objects for `args.output` and `args.snapshot_output`.
  - Before executing any generator or writing files, evaluate whether target paths exist on the filesystem.
  - If any designated target path exists and `args.force` is false:
    - Invoke `parser.error("Output path already exists. Pass --force to overwrite: " + ...)`
    - Terminate execution immediately with exit code 2.
- **Deliverables**: Pre-execution overwrite guard protecting both SQLite and JSON snapshot targets.

### Plan Item 3: Relational Generation & Snapshot Serialization Pipeline (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("When `--snapshot-output` is supplied, the tool exports a well-formed JSON snapshot containing dataset IDs, column definitions (names, data types, and semantic roles), and row records matching the generated SQLite database.")
- **Objective**: Provide reliable snapshot extraction producing structured JSON files alongside SQLite databases.
- **Implementation**:
  - In `src/dashForge/package_snapshot.py` (and exposed via `src/dashForge/generate.py`), implement `export_sqlite_snapshot(sqlite_path, snapshot_path, dataset_ids=None)`.
  - Open the SQLite database via `sqlite3.connect()`.
  - For each target table, query schema columns via `PRAGMA table_info` to extract column names and SQL types.
  - Query all rows via `SELECT * FROM <table>` and format each row into a dictionary of column-value pairs.
  - Infer column role (`dimension`, `measure`, `date`, `id`) and type (`string`, `number`, `date`, `boolean`).
  - Write formatted JSON structure to `snapshot_path`.
- **Deliverables**: `package_snapshot.py` implementation producing valid JSON snapshots containing dataset IDs, column definitions, and matching row records.

### Plan Item 4: Canonical Multi-Pack Scenario Support & Determinism (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The generator and snapshot packaging workflow supports all canonical industry packs (`healthcare`, `financial`, `saas`) with reproducible outputs given identical seeds.")
- **Objective**: Support all industry packs defined in `product-definition.md` with bit-for-bit reproducible outputs.
- **Implementation**:
  - Support pack generators in `src/dashForge/main.py`:
    - `healthcare`: scenarios `flu-season`, `quality-improvement`, `cost-pressure`
    - `financial`: scenarios `market-downturn`, `advisor-attrition`, `growth-quarter`
    - `saas`: scenarios `churn-crisis`, `product-led-growth`, `scaling-success`
  - Ensure random seed propagation through `default_seed_for(pack, scenario)` or user-provided `--seed`.
  - Verify that executing generation twice with identical arguments produces identical SQLite database tables and JSON snapshots.
- **Deliverables**: Multi-pack scenario dispatching producing deterministic SQLite and JSON snapshot outputs.

### Plan Item 5: Input Validation & Clean Diagnostic Error Reporting (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("The CLI handles invalid inputs gracefully (including unknown packs, unknown scenarios, or missing required parameters) by returning non-zero exit codes and clear diagnostic messages without uncaught stack traces.")
- **Objective**: Ensure high-stakes demonstration safety with clean error handling and POSIX exit codes.
- **Implementation**:
  - Handle missing CLI arguments and invalid pack selections through `argparse` validation (terminating with exit code 2 and standard usage message).
  - Wrap generator dispatch in exception handling catching `ValueError` and `KeyError`.
  - Report clean diagnostic messages to stderr via `parser.error(...)` without unhandled Python stack traces or crashes.
- **Deliverables**: Resilient CLI error reporting free of raw tracebacks for invalid arguments, unknown packs, and unknown scenarios.

### Plan Item 6: Runtime Schema Conformance & DataAdapter Interoperability (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("Exported snapshot artifacts conform to the DashForge runtime data adapter schema (`SQLiteSnapshot`), ensuring full compatibility with `DataAdapter` query and aggregation interfaces.")
- **Objective**: Guarantee compatibility between exported snapshot JSON and the frontend `DataAdapter` runtime.
- **Implementation**:
  - Format exported JSON to match the TypeScript `SQLiteSnapshot` type defined in `frontend/src/core/data/sqliteSnapshot.ts`:
    ```typescript
    type SQLiteSnapshot = Record<string, {
      columns: Array<{ name: string; type: "string" | "number" | "date" | "boolean"; role: "dimension" | "measure" | "date" | "id" }>;
      rows: Array<Record<string, unknown>>;
    }>;
    ```
  - Ensure column type and semantic role categorization aligns with widget aggregation queries.
- **Deliverables**: Snapshot artifacts fully ingestible by DashForge client-side `DataAdapter`.

### Plan Item 7: User Journeys Synchronization & Authority Mapping (`AC-7`)
- **Mapped Acceptance Check**: `AC-7` ("The synchronized user journeys manifest in `journeys/user_journeys_manifest.json` maps natural-language user goals to every acceptance check (`AC-1` through `AC-8`) with valid authorities (`human`, `mission`, `author`, or `exploratory`), non-empty `command_allowlist`, and all allowlisted commands runnable verbatim from the workspace root using `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q` (with NO PYTHONPATH override).")
- **Objective**: Maintain complete, synchronized user journey specifications covering all acceptance criteria.
- **Implementation**:
  - Validate `journeys/user_journeys_manifest.json` to ensure:
    - All acceptance checks (`AC-1` through `AC-8`) are traced across journey entries.
    - Each journey specifies a valid authority (`human`, `mission`, `author`, or `exploratory`).
    - `command_allowlist` includes `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q`.
    - All journey steps describe verifiable actions executable from the workspace root using `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q` (with NO PYTHONPATH override).
- **Deliverables**: Fully synchronized, valid `journeys/user_journeys_manifest.json`.

### Plan Item 8: Governed Scope Boundary Enforcement (`AC-8`)
- **Mapped Acceptance Check**: `AC-8` ("Governed write scope is preserved with all changes strictly confined to `docs/` and `journeys/`.")
- **Objective**: Enforce strict write boundary containment across all workflow steps.
- **Implementation**:
  - For the slice contract definition step, ensure all persistent changes remain confined to `docs/` and `journeys/`.
  - For this planning step, ensure all persistent modifications remain confined strictly to `plans/`.
  - For test authoring (`step_04`), confine changes to `tests/test_package_snapshot.py` and `journeys/`.
  - For implementation (`step_05`), confine changes to `src/dashForge/` and `playbooks/`.
  - Pre-commit verification via `git status` to confirm zero touched files outside designated step boundaries.
- **Deliverables**: Clean write boundary compliance verification.

---

## Tests

The testing strategy follows contract-driven development, defining automated test cases before implementing slice code. All tests run locally, execute in temporary sandboxes (`tmp_path`), and require zero external network dependencies or third-party runtime packages.

Under this heading, the test suites verify every behavioral and structural aspect of the contract across multiple test files and execution environments.

### Targeted Slice Test Suite: `tests/test_package_snapshot.py`

The targeted test suite authored in `step_04` validates all contract acceptance checks against the packaging interface:

1. **CLI Flag and Argument Validation (`AC-1`)**:
   - `test_cli_generate_requires_scenario_and_output`: Verifies that invoking `python3 -m dashForge.main generate` without `--scenario` or `--output` fails with exit code 2 and diagnostic usage information.
   - `test_cli_generate_accepts_all_contract_flags`: Verifies that invocation with `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` parses cleanly and executes.

2. **Fail-Closed Overwrite Protection (`AC-2`)**:
   - `test_cli_fails_closed_when_output_sqlite_exists`: Pre-creates a dummy file at the target `--output` path; executes generation without `--force`; asserts exit code 2 and asserts stderr contains `Output path already exists. Pass --force to overwrite`.
   - `test_cli_fails_closed_when_snapshot_output_exists`: Pre-creates target `--snapshot-output` file; executes without `--force`; asserts exit code 2 and diagnostic message.
   - `test_cli_overwrites_when_force_flag_provided`: Pre-creates target files; executes with `--force`; asserts exit code 0 and confirms files are successfully overwritten.

3. **Snapshot JSON Structure and Content Integrity (`AC-3`, `AC-6`)**:
   - `test_snapshot_json_contains_required_dataset_schema`: Generates healthcare scenario `flu-season` with `--snapshot-output`; loads exported JSON; asserts presence of dataset IDs (`monthly_capacity`, `facility_monthly_metrics`, `department_monthly_metrics`).
   - `test_snapshot_column_definitions_and_roles`: Inspects `columns` array in snapshot; asserts every column has `name`, `type` in `["string", "number", "date", "boolean"]`, and `role` in `["dimension", "measure", "date", "id"]`.
   - `test_snapshot_rows_match_sqlite_table_records`: Directly queries SQLite tables and asserts exact 1:1 match with snapshot `rows` arrays.

4. **Multi-Pack Support & Determinism (`AC-4`)**:
   - `test_all_canonical_packs_generate_successfully`: Iterates over `healthcare` (`flu-season`), `financial` (`market-downturn`), and `saas` (`churn-crisis`); asserts exit code 0 and valid outputs for each pack.
   - `test_deterministic_snapshot_generation_with_same_seed`: Generates the same scenario twice with seed `4201`; computes SHA-256 hashes of the snapshot JSON files; asserts identical hashes.

5. **Graceful Error Handling (`AC-5`)**:
   - `test_unknown_pack_fails_with_exit_code_2`: Passes `--pack invalid_pack`; asserts exit code 2 and invalid choice error.
   - `test_unknown_scenario_fails_with_exit_code_2_without_traceback`: Passes `--scenario unknown_scenario`; asserts exit code 2, stderr mentions unknown scenario, and stdout/stderr contains no Python traceback (`Traceback (most recent call last)`).

### Existing Test Suite Regression Coverage

In addition to `tests/test_package_snapshot.py`, the existing automated test suites ensure backward compatibility:
- `tests/test_generate.py`: Verifies SQLite generation, story rollups, and aggregation consistency across healthcare, financial, and saas packs.
- `tests/test_dataforge_compat.py`: Verifies dynamic sibling module resolution and helpful error reporting when `dataForge` is missing.

### Test Execution Command

The test suites are executed via pytest from the workspace root with NO PYTHONPATH override (the orchestrator re-executes claims in a bounded environment whose own PYTHONPATH is what makes pytest importable, and an override hides it):
```bash
python3 -m pytest tests/ -q
```
All tests must execute within 10 seconds and achieve a 100% pass rate.

---

## Verification

The verification phase provides end-to-end confirmation that all acceptance checks (`AC-1` through `AC-8`) and user journeys function as specified.

Under this heading, detailed verification commands and acceptance gates ensure the packaged deliverables and runtime interfaces meet every requirement before deployment.

### Step-by-Step Verification Checklist

1. **CLI Flag & Dispatch Verification (`AC-1`, `AC-4`)**:
   - Command:
     ```bash
     env PYTHONPATH=src python3 -m dashForge.main generate --pack healthcare --scenario flu-season --seed 3101 --output /tmp/flu-season.sqlite --snapshot-output /tmp/flu-season.snapshot.json --force
     ```
   - Validation: Confirm exit code is 0; inspect created SQLite database (`/tmp/flu-season.sqlite`) and JSON snapshot (`/tmp/flu-season.snapshot.json`).

2. **Fail-Closed Overwrite Protection Verification (`AC-2`)**:
   - Command:
     ```bash
     env PYTHONPATH=src python3 -m dashForge.main generate --pack healthcare --scenario flu-season --seed 3101 --output /tmp/flu-season.sqlite --snapshot-output /tmp/flu-season.snapshot.json
     ```
   - Validation: Confirm command terminates with exit code 2; verify stderr contains `Output path already exists. Pass --force to overwrite`.

3. **Snapshot Schema & Data Integrity Verification (`AC-3`, `AC-6`)**:
   - Command:
     ```bash
     python3 -c "import json; data=json.load(open('/tmp/flu-season.snapshot.json')); assert 'monthly_capacity' in data; assert len(data['monthly_capacity']['columns']) > 0; assert len(data['monthly_capacity']['rows']) > 0; print('Snapshot schema valid.')"
     ```
   - Validation: Confirm script exits with code 0 and prints `Snapshot schema valid.`.

4. **Multi-Pack Generation Verification (`AC-4`)**:
   - Commands:
     ```bash
     env PYTHONPATH=src python3 -m dashForge.main generate --pack financial --scenario market-downturn --seed 5301 --output /tmp/financial.sqlite --snapshot-output /tmp/financial.snapshot.json --force
     env PYTHONPATH=src python3 -m dashForge.main generate --pack saas --scenario churn-crisis --seed 8301 --output /tmp/saas.sqlite --snapshot-output /tmp/saas.snapshot.json --force
     ```
   - Validation: Confirm exit code 0 for both packs and confirm creation of valid SQLite and JSON files.

5. **Error Handling & Diagnostic Output Verification (`AC-5`)**:
   - Command:
     ```bash
     env PYTHONPATH=src python3 -m dashForge.main generate --pack healthcare --scenario non-existent-scenario --output /tmp/test.sqlite --force
     ```
   - Validation: Confirm exit code is 2; verify stderr reports `Unknown healthcare scenario`; verify no unhandled Python traceback appears in stderr.

6. **Automated Test Suite Verification (`AC-1` through `AC-6`)**:
   - Command:
     ```bash
     python3 -m pytest tests/ -q
     ```
   - Validation: Confirm all test cases pass cleanly without errors or warnings.

7. **User Journey Manifest Alignment Verification (`AC-7`)**:
   - Command:
     ```bash
     python3 -c "import json; m=json.load(open('journeys/user_journeys_manifest.json')); assert all('traces_to' in j for j in m['journeys']); print('Manifest traces complete.')"
     ```
   - Validation: Confirm all journeys trace to acceptance checks (`AC-1` through `AC-8`) and reference allowlisted command prefixes.

8. **Governed Scope Boundary Verification (`AC-8`)**:
   - Command:
     ```bash
     git status --porcelain
     ```
   - Validation: Confirm all modified files are strictly confined to allowed paths (`plans/` for this step).

---

## Risks

The following risk analysis details potential operational, technical, and architectural failure modes along with concrete preventative controls.

Under this heading, risks spanning client workshop disruption, module drift, schema misalignment, seed variance, error reporting, and boundary compliance are systematically evaluated and mitigated.

| Risk Description | Severity | Likelihood | Preventative & Mitigation Controls |
|:-----------------|:--------:|:----------:|:-----------------------------------|
| **Accidental Overwrite of Client Deliverables**: Operator accidentally overwrites customized workshop scenario data during demo rehearsal. | High | Medium | Implement fail-closed overwrite protection requiring explicit `--force` flag. Pre-execution checks in `main.py` verify target file existence and exit with code 2 before any file writes occur (`AC-2`). |
| **Sibling Generator Module Drift**: Directory reorganization or environment changes cause dynamic loading of `dataForge` to fail. | High | Low | Implement robust dynamic lookup in `_dataforge_compat.py` supporting `DATAFORGE_SRC` environment variable override and fallback candidate path resolution, accompanied by clear actionable error messages (`AC-5`). |
| **Snapshot / SQLite Schema Divergence**: Exported JSON snapshots omit columns or classify column roles incorrectly relative to the underlying database. | Medium | Low | Centralize snapshot extraction in `package_snapshot.py` using SQLite `PRAGMA table_info` and direct table queries, ensuring 100% column and row synchronization (`AC-3`, `AC-6`). |
| **Non-Deterministic Randomization Discrepancies**: Floating point variance or unseeded RNG calls produce fluctuating data between workshop runs. | High | Low | Enforce explicit integer seed resolution via `default_seed_for` and command-line `--seed` flag, verified by automated hash-equivalence tests in `test_package_snapshot.py` (`AC-4`). |
| **Unhandled Runtime Tracebacks in Demonstrations**: Invalid scenario names or missing flags emit raw Python tracebacks in front of executive clients. | Medium | Low | Intercept known generation errors (`KeyError`, `ValueError`) in `main.py` and convert them into clean stderr messages using `parser.error(...)` with exit code 2 (`AC-5`). |
| **Governed Scope Boundary Violation**: Implementation step inadvertently touches out-of-scope files or introduces undeclared dependencies. | High | Low | Strictly rely on Python standard library modules (`sqlite3`, `json`, `argparse`, `pathlib`) with zero external runtime dependencies. Enforce step-level path constraints via Agent-Orch governance (`AC-8`). |
| **User Journey Desynchronization**: Journey manifest entries omit required acceptance criteria or command allowlists. | Medium | Low | Automated structural and schema validation of `journeys/user_journeys_manifest.json` ensuring full coverage of `AC-1` through `AC-8` and valid command allowlists (`AC-7`). |

---

## Acceptance Criteria Traceability Matrix

The following matrix provides complete, bidirectional traceability between every contract acceptance check (`AC-1` through `AC-8`) and its corresponding implementation plan item, source code touchpoints, and test verification references:

| Acceptance Check | Plan Item | Implementation Touchpoints | Test & Journey References |
|:-----------------|:----------|:---------------------------|:--------------------------|
| **AC-1**: The packaging CLI entrypoint (invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`) provides a deterministic command supporting `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` flags. | Plan Item 1: CLI Entrypoint & Argument Parsing (`AC-1`) | `src/dashForge/main.py`<br>`src/dashForge/generate.py` | `tests/test_package_snapshot.py::test_cli_generate_accepts_all_contract_flags`<br>`tests/test_generate.py::test_cli_generation_writes_sqlite_and_snapshot`<br>`journey-generate-healthcare-snapshot` |
| **AC-2**: The packaging command strictly prevents unintended file overwrites by failing closed with an informative diagnostic message and non-zero exit code when the target output file exists, unless `--force` is explicitly specified. | Plan Item 2: Fail-Closed Overwrite Protection Engine (`AC-2`) | `src/dashForge/main.py` | `tests/test_package_snapshot.py::test_cli_fails_closed_when_output_sqlite_exists`<br>`tests/test_package_snapshot.py::test_cli_overwrites_when_force_flag_provided`<br>`journey-fail-closed-overwrite-protection` |
| **AC-3**: When `--snapshot-output` is supplied, the tool exports a well-formed JSON snapshot containing dataset IDs, column definitions (names, data types, and semantic roles), and row records matching the generated SQLite database. | Plan Item 3: Relational Generation & Snapshot Serialization Pipeline (`AC-3`) | `src/dashForge/package_snapshot.py`<br>`src/dashForge/generate.py` | `tests/test_package_snapshot.py::test_snapshot_json_contains_required_dataset_schema`<br>`tests/test_package_snapshot.py::test_snapshot_rows_match_sqlite_table_records`<br>`journey-generate-healthcare-snapshot` |
| **AC-4**: The generator and snapshot packaging workflow supports all canonical industry packs (`healthcare`, `financial`, `saas`) with reproducible outputs given identical seeds. | Plan Item 4: Canonical Multi-Pack Scenario Support & Determinism (`AC-4`) | `src/dashForge/main.py`<br>`src/dashForge/generate.py` | `tests/test_package_snapshot.py::test_all_canonical_packs_generate_successfully`<br>`tests/test_package_snapshot.py::test_deterministic_snapshot_generation_with_same_seed`<br>`journey-financial-and-saas-snapshot-generation` |
| **AC-5**: The CLI handles invalid inputs gracefully (including unknown packs, unknown scenarios, or missing required parameters) by returning non-zero exit codes and clear diagnostic messages without uncaught stack traces. | Plan Item 5: Input Validation & Clean Diagnostic Error Reporting (`AC-5`) | `src/dashForge/main.py`<br>`src/dashForge/_dataforge_compat.py` | `tests/test_package_snapshot.py::test_unknown_pack_fails_with_exit_code_2`<br>`tests/test_package_snapshot.py::test_unknown_scenario_fails_with_exit_code_2_without_traceback`<br>`journey-invalid-inputs-and-error-handling` |
| **AC-6**: Exported snapshot artifacts conform to the DashForge runtime data adapter schema (`SQLiteSnapshot`), ensuring full compatibility with `DataAdapter` query and aggregation interfaces. | Plan Item 6: Runtime Schema Conformance & DataAdapter Interoperability (`AC-6`) | `src/dashForge/package_snapshot.py`<br>`frontend/src/core/data/sqliteSnapshot.ts` | `tests/test_package_snapshot.py::test_snapshot_column_definitions_and_roles`<br>`tests/test_generate.py::test_generated_healthcare_data_supports_scenario_stories_and_rollups`<br>`journey-test-suite-and-data-adapter-verification` |
| **AC-7**: The synchronized user journeys manifest in `journeys/user_journeys_manifest.json` maps natural-language user goals to every acceptance check (`AC-1` through `AC-8`) with valid authorities (`human`, `mission`, `author`, or `exploratory`), non-empty `command_allowlist`, and all allowlisted commands runnable verbatim from the workspace root using `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q` (with NO PYTHONPATH override). | Plan Item 7: User Journeys Synchronization & Authority Mapping (`AC-7`) | `journeys/user_journeys_manifest.json` | `journeys/user_journeys_manifest.json`<br>`journey-invalid-inputs-and-error-handling`<br>`journey-test-suite-and-data-adapter-verification` |
| **AC-8**: Governed write scope is preserved with all changes strictly confined to `docs/` and `journeys/`. | Plan Item 8: Governed Scope Boundary Enforcement (`AC-8`) | `plans/`<br>`docs/`<br>`journeys/` | Orchestrator step-level path enforcement<br>`journey-fail-closed-overwrite-protection`<br>`journey-invalid-inputs-and-error-handling` |

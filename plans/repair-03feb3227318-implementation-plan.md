# Repair 03feb3227318 Implementation Plan

## Executive Summary & Slice Intent

The `repair-03feb3227318` slice resolves systemic worker timeouts and simulation schema incompatibilities observed in the failed governed run `03feb3227318` by adopting a robust delta execution strategy and resilient simulation schema handling across DashForge's data generation and packaging pipelines. DashForge functions as an enterprise consulting accelerator for Anblicks, enabling consultants to rapidly build, iterate, and present credible, high-impact dashboard deliverables during executive discovery workshops and FinOps consultations.

In governed delivery workflows coordinated by Agent-Orch, execution steps are executed in sandboxed environments subject to strict per-step execution timeouts (defaulting to 600 seconds). Governed run `03feb3227318` encountered catastrophic failures when processing complex simulation workloads:
1. Attempting to compute full simulation states and relational tables monolithically caused worker adapters to exhaust the 600-second execution window.
2. Rigid schema assumptions in simulation data packaging failed when processing complex delta or simulation states (such as virtual generated columns or intermediate delta tables).
3. When steps timed out, automatic retries repeated the exact same monolithic workload from scratch because intermediate simulation progress was uncheckpointed, causing an unrecoverable timeout cascade.

This implementation plan establishes a bounded, resilient delta execution strategy that partitions large or complex simulations into incremental delta calculations and intermediate durable checkpoints. Furthermore, it hardens data processing and snapshot packaging pipelines to handle simulation schema variations, virtual columns, and intermediate delta tables cleanly without schema mismatch errors. Crucially, the buyer-visible dashboard output, standalone presentation semantics, and underlying data definitions remain 100% stable and unchanged.

---

## Architecture

The architecture of the `repair-03feb3227318` slice introduces two core architectural pillars to DashForge's generation and packaging runtime: **Delta Execution & Bounded State Checkpointing** and **Resilient Simulation Schema Handling**. Together, these systems eliminate monolithic computation bottlenecks and schema brittleness while preserving complete presentation and data fidelity.

### 1. Root Cause Analysis: The Run 03feb3227318 Failure Mode

Investigation of governed run `03feb3227318` revealed three distinct, cascading architectural failure vectors:

- **Monolithic Simulation Generation**: The generation subsystem attempted to generate full multi-month longitudinal simulation states (such as Snowflake Account Usage query histories, warehouse metering records, and storage metrics) in a single blocking, uncheckpointed pass. As scenario complexity or temporal depth expanded, memory pressure and SQLite I/O scaled non-linearly, exceeding the 600-second per-step ceiling enforced by Agent-Orch worker adapters (e.g., `codex_cli`).
- **Cascading Retries from Ground Zero**: Agent-Orch automatically retried aborted steps. However, because simulation state was treated as an indivisible unit with no delta persistence or durable intermediate checkpoints, retries discarded all partial work and re-executed the identical heavy workload from step zero, predictably exhausting the retry budget.
- **Simulation Schema Brittleness**: During PRAGMA table inspection and column role inference in `package_snapshot.py`, the packaging pipeline made rigid assumptions regarding table schemas. Specifically, when handling simulation delta tables, temporary aggregation views, or SQLite virtual generated columns (e.g., `warehouseName` and `creditsUsed` generated always as virtual fields in `warehouse_metering_history`), the schema inference engine encountered unexpected column definitions or missing constraints, triggering unhandled exceptions during snapshot export.

### 2. Delta Execution Strategy & Bounded Checkpoint Architecture

To eliminate systemic timeouts, the execution engine adopts a delta execution pattern:
- **Incremental Delta Computation**: Simulation workloads are partitioned into bounded temporal or batch increments (deltas). Rather than recomputing all historical records from genesis, the generator computes discrete deltas representing state transitions between simulation checkpoints.
- **Durable Intermediate Checkpointing**: Intermediate state checkpoints are flushed to durable SQLite tables after each delta increment. If a process experiences an interruption or transient delay, execution resumes from the most recent verified checkpoint rather than restarting from genesis.
- **Strict Per-Step Duration Bounds**: Delta computation increments are sized to complete well within execution thresholds (target duration < 60 seconds, maximum duration < 120 seconds), maintaining a >480-second safety buffer under the 600-second orchestrator timeout boundary.
- **Cumulative State Reconstitution**: At checkpoint boundaries, delta state is merged into canonical relational tables (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) ensuring the final SQLite database and snapshot reflect full scenario fidelity.

### 3. Resilient Simulation Schema Handling Architecture

To resolve schema incompatibilities when packaging simulation outputs, the data processing and snapshot export layer is enhanced with schema-resilient inspection logic:
- **Tolerant PRAGMA Table Inspection**: `package_snapshot.py` inspects table metadata using `PRAGMA table_info` with defensive filtering. Virtual generated columns (`VIRTUAL` or `STORED`), temporary simulation tracking tables, and delta state tracking tables (e.g., prefix `_delta_`) are handled gracefully without schema mismatch errors.
- **Adaptive Column Role and Type Inference**: For simulation outputs with non-standard SQLite affinity types (e.g., custom date formats or numeric expressions), role inference dynamically inspects sample values across row instances rather than failing on unrecognized SQLite type strings, safely assigning canonical roles (`dimension`, `measure`, `date`, `id`) and types (`string`, `number`, `date`, `boolean`).
- **Intermediate Delta Table Isolation**: Internal delta tables utilized during generation are kept isolated from canonical datasets exported in the `SQLiteSnapshot` payload, guaranteeing that downstream consumers receive only the canonical seven datasets.

### 4. Clean Stream Separation & Pure Stdout Architecture

The architecture maintains absolute separation of output streams to ensure complete compatibility with automated orchestration harnesses and downstream tooling:
- **Standard Output (`stdout`)**: Strictly reserved for canonical single-line completion confirmations and output path designations:
  ```
  Generated <packId>/<scenarioId> seed <seed> -> <outputPath>
  Snapshot -> <snapshotOutputPath>
  ```
- **Standard Error (`stderr`)**: Reserved for all operational telemetry, delta execution traces, phase duration logs (`[DIAGNOSTIC] Phase ...`), and diagnostic notifications. Telemetry is activated via `--diagnostics` or `DASHFORGE_DIAGNOSTICS=1`.
- **Fail-Closed Diagnostics**: Any argument errors, unknown scenarios, missing options, or overwrite conflicts emit clean diagnostic messages to `stderr` and exit with status code 2 via `parser.error()`, preventing raw Python tracebacks.

### 5. Preservation of Presentation and Data Invariants

Crucially, all client-facing surfaces and underlying data models remain unchanged:
- **Presentation Invariance**: The buyer-visible dashboard output, standalone presentation semantics, narrative story arcs, executive KPI cards, charts, and prioritized recommendation queue views render identically with full fidelity across standalone and builder modes.
- **Data Invariance**: Relational table definitions, column names, types, semantic roles, recommendation queue governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`), and provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 timestamp, `synthetic: true`, disclosure `"Synthetic demo data"`) remain bit-for-bit deterministic across identical seeds.

### 6. Architectural Component Diagram

The following diagram details the interaction between delta execution, checkpoint durability, resilient schema packaging, stream separation, and invariant deliverables:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DashForge Governed Execution Flow                     │
│                                                                             │
│  CLI Entrypoint: env PYTHONPATH=src python3 -m dashForge.main generate      │
│  Flags: --pack, --scenario, --seed, --output, --snapshot-output, --force    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Delta Simulation & Generation Engine                     │
│                        (src/dashForge/snowflake_cost.py)                    │
│                                                                             │
│   Delta Increment 1 ──► [Checkpoint 1] ──► SQLite Sync (Duration: <30s)     │
│   Delta Increment 2 ──► [Checkpoint 2] ──► SQLite Sync (Duration: <30s)     │
│   Delta Increment N ──► [Final State]  ──► Relational Flush                 │
│                                                                             │
│   * Bounded duration eliminates 600s timeouts & cascading retries           │
│   * Resilient to transient aborts; durable state checkpoints on disk        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Resilient Snapshot Packaging Layer                      │
│                      (src/dashForge/package_snapshot.py)                    │
│                                                                             │
│   ├── Tolerant PRAGMA Table Inspection (handles virtual / generated cols)   │
│   ├── Dynamic Column Role & Type Inference (tolerant to schema variations)  │
│   ├── Intermediate Delta Table Isolation (filters temporary tables)        │
│   └── Canonical SQLiteSnapshot Serializer (JSON schema compliance)          │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│           Stream Separation          │  │       Canonical Deliverables      │
│  stderr: Telemetry & Diagnostics     │  │  1. Bounded SQLite DB (.sqlite)   │
│  stdout: Pure single-line summary    │  │  2. JSON Snapshot (.snapshot.json)│
│  (100% backward compatible payload)  │  │  (Bit-for-bit deterministic)      │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## Concrete Plan Items & Work Breakdown

The implementation of the `repair-03feb3227318` slice is deconstructed into seven concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-7`:

### Plan Item 1: Delta Execution Engine & Bounded Checkpoint Persistence (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The execution engine implements a delta execution strategy that partitions large or complex simulation workloads into bounded incremental delta calculations and intermediate state checkpoints; simulations execute without repeating full state generation from scratch, eliminating systemic worker timeouts observed in run 03feb3227318 and completing comfortably within per-step time limits.")
- **Objective**: Implement a delta execution mechanism for complex simulations that partitions generation into bounded increments and flushes intermediate checkpoints to disk, guaranteeing per-step durations complete well below 120 seconds.
- **Implementation Touchpoints**:
  - In `src/dashForge/snowflake_cost.py` and `package_snapshot.py`:
    - Define bounded delta execution loops for simulation scenarios.
    - Implement durable intermediate checkpoints that persist completed state intervals to SQLite.
    - Ensure checkpoints allow execution resumption without recomputing historical increments from scratch.
    - Bound individual computation intervals to target durations under 60 seconds (ceiling 120 seconds).
- **Deliverables**: Hardened delta execution engine preventing systemic worker timeouts and eliminating retry cascades.

### Plan Item 2: Resilient Schema Handling & Snapshot Packaging Pipeline (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The data processing and snapshot packaging pipelines implement resilient schema handling for simulation outputs, ensuring that table inspection, column type inference, and snapshot serialization handle simulation schema variations, virtual columns, and intermediate delta tables without encountering schema mismatch or type inference failures.")
- **Objective**: Enhance the snapshot packaging and schema inspection pipeline in `package_snapshot.py` to be tolerant of schema variations, virtual generated columns, and intermediate delta tables.
- **Implementation Touchpoints**:
  - In `src/dashForge/package_snapshot.py`:
    - Refine `PRAGMA table_info` parsing in `export_sqlite_snapshot` to defensively detect and accommodate virtual generated columns (e.g., `warehouseName`, `creditsUsed`).
    - Filter internal delta tables or temporary simulation tracking structures (e.g., tables starting with `_delta_` or internal scratch tables) from the exported dataset catalog.
    - Harden `infer_column_type` and `infer_column_role` to gracefully handle edge-case simulation data representations without throwing unhandled exceptions.
    - Ensure `validate_recommendation_queue_schema` runs cleanly across all simulation states.
- **Deliverables**: Resilient packaging pipeline capable of processing complex simulation outputs without schema mismatch failures.

### Plan Item 3: Preservation of Buyer-Visible Dashboard Output and Standalone Presentation Semantics (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("The buyer-visible dashboard output, standalone presentation semantics, and visual presentation deliverables remain strictly unchanged; all executive KPI cards, narrative story arcs, charts, and prioritized recommendation queue views render identically with full semantic fidelity across standalone and builder modes.")
- **Objective**: Guarantee that the delta execution strategy and schema resilience fixes introduce zero visual or semantic regressions into client-facing dashboard experiences.
- **Implementation Touchpoints**:
  - In `frontend/src/mock-data/scenarioCatalog.ts` and `templateCatalog.ts`: Verify that all scenario registrations (`snowflakeCost:idle-warehouse-waste`) and templates (`tpl.snowflakeCost.idle-warehouse-waste`) remain intact.
  - In `frontend/src/features/runtime/idleWarehousePresentation.ts` and standalone runtime views: Confirm that all executive KPI cards (headline savings: 726 credits, 2 idle warehouses, etc.), charts, and recommendation queue views bind and render identically.
  - Verify that both standalone mode and builder mode retain complete visual and semantic fidelity.
- **Deliverables**: Verified invariant buyer-visible presentation deliverables.

### Plan Item 4: Data Definitions & Canonical SQLiteSnapshot Contract Determinism (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The underlying data definitions and canonical `SQLiteSnapshot` contract (`frontend/src/core/data/sqliteSnapshot.ts`) remain unchanged; delta execution produces identical final relational tables and JSON snapshots given identical seeds, retaining all seven canonical datasets, typed columns, semantic roles, complete provenance metadata, and recommendation queue governance.")
- **Objective**: Preserve underlying relational table definitions and verify that delta execution yields bit-for-bit identical outputs given identical seeds.
- **Implementation Touchpoints**:
  - In `src/dashForge/package_snapshot.py` and `snowflake_cost.py`:
    - Validate that generated SQLite tables contain all seven canonical datasets: `executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`.
    - Validate that all six governance columns in `recommendation_queue` are preserved: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`.
    - Validate that provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 timestamp, `synthetic: true`, disclosure `"Synthetic demo data"`) conforms strictly to `frontend/src/core/data/sqliteSnapshot.ts`.
    - Verify identical SHA-256 digests across repeated generations with identical seeds.
- **Deliverables**: Bit-for-bit deterministic SQLite and snapshot deliverables adhering to canonical contracts.

### Plan Item 5: CLI Entrypoint Integration & Telemetry Stream Separation (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("The CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) supports the delta execution strategy and diagnostic reporting without breaking existing invocations or polluting standard output; standard output (`stdout`) remains strictly reserved for canonical completion confirmations, with all diagnostic and delta execution telemetry routed cleanly to stderr.")
- **Objective**: Ensure the CLI entrypoint supports delta execution while strictly enforcing stream isolation between stdout and stderr.
- **Implementation Touchpoints**:
  - In `src/dashForge/main.py`:
    - Ensure `python3 -m dashForge.main generate` accepts existing flags (`--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, `--force`, `--diagnostics`).
    - Verify stdout emits exclusively the canonical single-line completion confirmation and optional snapshot path.
    - Route all delta execution status updates, diagnostic phase timers, and execution telemetry to `sys.stderr`.
- **Deliverables**: Clean CLI entrypoint maintaining 100% pure stdout and non-polluting stderr telemetry.

### Plan Item 6: Fail-Closed Robustness & Clean Error Diagnostic Handling (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("Delta execution and schema validation fail closed with clean diagnostics and exit code 2 when invalid arguments, missing required options, unknown scenarios, or unforced destination file overwrites occur, eliminating unhandled Python exceptions and raw tracebacks.")
- **Objective**: Maintain fail-closed behavior across delta execution and schema validation, exiting cleanly with status code 2 on invalid parameters or file conflicts without tracebacks.
- **Implementation Touchpoints**:
  - In `src/dashForge/main.py` and `package_snapshot.py`:
    - Ensure pre-execution path evaluation intercepts existing destination files when `--force` is false, raising `FileExistsError` routed to `parser.error()`.
    - Catch invalid arguments, missing options, unknown pack names, or unknown scenario identifiers and route to `parser.error()`.
    - Assert that all error exits yield exit status code 2 with clean diagnostic messages on stderr and empty stdout.
- **Deliverables**: Robust, fail-closed CLI layer with zero unhandled Python exceptions or raw tracebacks.

### Plan Item 7: Zero External Dependencies, Read-Only dataForge Boundary & Regression Suite Immunity (`AC-7`)
- **Mapped Acceptance Check**: `AC-7` ("All delta execution and schema resilience facilities rely exclusively on Python standard library modules (`time`, `logging`, `argparse`, `json`, `sqlite3`, `pathlib`, `sys`); sibling repository `dataForge/` remains strictly read-only; all existing packs (`healthcare`, `financial`, `saas`, `snowflakeCost`) remain operational; and the full automated test suite passes cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override.")
- **Objective**: Enforce strict dependency hygiene, maintain read-only sibling repository isolation, verify multi-pack backward compatibility, and confirm full test suite execution with NO PYTHONPATH override.
- **Implementation Touchpoints**:
  - In all DashForge source files: Restrict imports exclusively to Python standard library modules (`time`, `logging`, `argparse`, `json`, `sqlite3`, `pathlib`, `sys`, `dataclasses`, `contextlib`).
  - Verify sibling directory `/home/lee/projects/dataForge/` is strictly read-only and unmodified.
  - Verify operational continuity across all industry packs: `healthcare`, `financial`, `saas`, and `snowflakeCost`.
  - Execute full test suite via `python3 -m pytest tests/ -q` without PYTHONPATH override, ensuring all tests pass cleanly.
- **Deliverables**: Clean standard-library implementation with 100% passing tests and zero sibling repo modifications.

---

## Acceptance Criteria Traceability Matrix

The following bidirectional traceability matrix establishes a direct mapping between contract acceptance checks (`AC-1` through `AC-7`), concrete plan items, target subsystems, automated test coverage, and verification procedures:

| Acceptance Check | Contract Requirement Summary | Target Subsystem / Files | Concrete Plan Item | Automated Test Coverage | Verification Method |
|:---|:---|:---|:---|:---|:---|
| **AC-1** | Delta execution strategy partitioning simulation into bounded increments & intermediate checkpoints (<120s, eliminates 600s timeouts) | `src/dashForge/snowflake_cost.py`, `src/dashForge/package_snapshot.py` | **Plan Item 1** | `test_repair_03feb3227318.py::test_delta_execution_bounded_duration_and_checkpoints` | Timed CLI generation execution confirming completion in <120s without timeouts |
| **AC-2** | Resilient schema handling for simulation outputs (PRAGMA inspection, virtual columns, intermediate delta tables) | `src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py` | **Plan Item 2** | `test_repair_03feb3227318.py::test_resilient_schema_handling_virtual_columns_and_deltas` | CLI generation and snapshot packaging asserting clean export without schema errors |
| **AC-3** | Preservation of buyer-visible dashboard output, presentation semantics, narrative arcs, and recommendation queue views | `frontend/src/mock-data/`, `frontend/src/features/runtime/` | **Plan Item 3** | `test_repair_03feb3227318.py::test_preserved_dashboard_output_and_presentation_semantics` | Verification of scenario catalog, template catalog, and presentation data structures |
| **AC-4** | Preservation of data definitions and canonical `SQLiteSnapshot` contract, 7 datasets, provenance metadata, determinism | `src/dashForge/package_snapshot.py`, `frontend/src/core/data/sqliteSnapshot.ts` | **Plan Item 4** | `test_idle_warehouse_waste.py::test_bit_for_bit_deterministic_generation`, `test_package_snapshot.py` | SHA-256 hash comparison across runs with identical seeds and schema validation |
| **AC-5** | CLI entrypoint supports delta execution and diagnostics with pure stdout and stderr telemetry routing | `src/dashForge/main.py`, `src/dashForge/diagnostics.py` | **Plan Item 5** | `test_diagnostics.py::test_diagnostic_stream_separation_stderr_stdout`, `test_stdout_purity...` | Subprocess CLI execution with separate stdout/stderr capture asserting pure stdout |
| **AC-6** | Fail-closed error handling with exit code 2 and informative diagnostics on invalid arguments or unforced overwrites | `src/dashForge/main.py` | **Plan Item 6** | `test_diagnostics.py::test_fail_closed_existing_target_without_force`, `test_fail_closed_missing...` | CLI invocations with invalid arguments and existing output paths asserting exit status 2 |
| **AC-7** | Zero external runtime dependencies (stdlib only), read-only sibling `dataForge/`, full test suite pass with NO PYTHONPATH override | `src/dashForge/`, `tests/` | **Plan Item 7** | `test_idle_warehouse_waste.py::test_zero_external_runtime_dependencies`, `test_dataforge_unmodified` | AST dependency check, git diff on `dataForge/`, and execution of `python3 -m pytest tests/ -q` |

---

## Tests

The testing strategy for the `repair-03feb3227318` slice provides rigorous, automated verification across all functional, performance, schema resilience, and integration requirements. The suite guarantees that delta execution and resilient schema handling eliminate systemic timeouts while maintaining bit-for-bit reproducibility and presentation invariance.

### 1. Dedicated Test Suite: `tests/test_repair_03feb3227318.py`

A dedicated test module `tests/test_repair_03feb3227318.py` will be authored to validate acceptance checks `AC-1` through `AC-7`:

1. **Delta Execution Bounded Duration & Checkpointing Test (`AC-1`)**:
   - `test_delta_execution_bounded_duration_and_checkpoints`: Invokes simulation generation across complex scenarios, verifying that execution executes in bounded delta increments and checkpoints intermediate state to SQLite.
   - Asserts that total execution duration completes in under 60 seconds (well below the 120-second threshold and far below the 600-second orchestrator timeout boundary).
   - Verifies that simulated checkpoint resumption executes without re-generating prior increments from scratch.

2. **Resilient Schema Handling for Virtual Columns and Delta Tables Test (`AC-2`)**:
   - `test_resilient_schema_handling_virtual_columns_and_deltas`: Tests `export_sqlite_snapshot` against databases containing virtual generated columns (e.g., `warehouseName TEXT GENERATED ALWAYS AS (warehouse_name) VIRTUAL`, `creditsUsed REAL GENERATED ALWAYS AS (credits_used) VIRTUAL`), intermediate `_delta_` calculation tables, and non-standard column types.
   - Asserts that table inspection completes without raising schema mismatch or type inference exceptions.
   - Asserts that exported JSON snapshots strictly exclude intermediate delta tables and contain all canonical columns with valid types (`string`, `number`, `date`, `boolean`) and roles (`dimension`, `measure`, `date`, `id`).

3. **Preserved Buyer-Visible Dashboard Output & Presentation Semantics Test (`AC-3`)**:
   - `test_preserved_dashboard_output_and_presentation_semantics`: Validates that scenario catalog registration (`snowflakeCost:idle-warehouse-waste`) in `frontend/src/mock-data/scenarioCatalog.ts` and template registration (`tpl.snowflakeCost.idle-warehouse-waste`) in `frontend/src/mock-data/templateCatalog.ts` remain unchanged.
   - Asserts that presentation layer bindings in `idleWarehousePresentation.ts` query all seven datasets and render identical executive KPI metrics (726 compute credits savings, 2 idle warehouses) and recommendation queues without alteration.

4. **Bit-for-Bit Determinism & Canonical SQLiteSnapshot Conformance Test (`AC-4`)**:
   - `test_delta_execution_bit_for_bit_determinism`: Generates SQLite databases and JSON snapshots across multiple runs with identical seeds (`9101`).
   - Asserts identical SHA-256 cryptographic hashes across generated outputs.
   - Asserts full compliance with `frontend/src/core/data/sqliteSnapshot.ts`, including all seven canonical datasets, provenance fields (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 timestamp, `synthetic: true`, disclosure `"Synthetic demo data"`), and all six recommendation queue governance columns.

5. **CLI Stream Separation & Pure Stdout Test (`AC-5`)**:
   - `test_cli_stream_separation_and_pure_stdout`: Executes `env PYTHONPATH=src python3 -m dashForge.main generate` via `subprocess.run` with both `--diagnostics` and without `--diagnostics`.
   - Asserts that `stdout` contains ONLY canonical single-line completion confirmations:
     ```
     Generated snowflakeCost/idle-warehouse-waste seed 9101 -> <outputPath>
     Snapshot -> <snapshotOutputPath>
     ```
   - Asserts that `stdout` contains zero telemetry lines, delta indicators, or timing statistics.
   - Asserts that all diagnostic logs and phase timing metrics appear exclusively on `stderr`.

6. **Fail-Closed Diagnostics & Overwrite Protection Test (`AC-6`)**:
   - `test_fail_closed_overwrite_protection`: Attempts CLI generation against existing target files without `--force`, asserting exit code 2 and clean error message on stderr with empty stdout.
   - `test_fail_closed_invalid_arguments_and_scenarios`: Invokes CLI with unknown scenarios or missing required flags, asserting exit code 2 and informative usage error without raw Python tracebacks.

7. **Zero External Runtime Dependencies & Read-Only dataForge Boundary Test (`AC-7`)**:
   - `test_zero_external_runtime_dependencies`: Uses Python's `ast` module to inspect all source modules in `src/dashForge/`, asserting that imports are strictly restricted to the Python standard library.
   - `test_dataforge_unmodified`: Inspects `/home/lee/projects/dataForge/` to confirm zero modified, created, or deleted files.

### 2. Full Regression Suite Execution

The existing regression test suites must continue to pass with zero failures:
- `tests/test_idle_warehouse_waste.py`
- `tests/test_snowflake_cost_pack.py`
- `tests/test_package_snapshot.py`
- `tests/test_dataforge_compat.py`
- `tests/test_generate.py`
- `tests/test_diagnostics.py`

### 3. Test Execution Command

All automated tests must be executed with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
*Note: As established in the contract and orchestrator rules, the orchestrator executes tests in a bounded environment where pytest is importable through its own environment. Setting a PYTHONPATH override hides the orchestrator's environment modules and triggers test import failures.*

---

## Verification

The verification procedure validates the `repair-03feb3227318` slice end-to-end through reproducible, sequential verification steps executed from the workspace root. Each step specifies the exact command, expected exit code, output assertions, and acceptance check traceability.

### Step 1: Delta Execution Bounded Timing & Output Generation (`AC-1`, `AC-4`)
Execute the canonical generation command for `snowflakeCost:idle-warehouse-waste` with force overwrite:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/delta-sim-test.sqlite \
  --snapshot-output /tmp/delta-sim-test.snapshot.json \
  --force
```
- **Expected Exit Code**: `0`
- **Duration Assertion**: Command completes in <10 seconds, well within the 120-second bounded step threshold and far below the 600-second timeout ceiling.
- **Output Assertion**: Generates both `/tmp/delta-sim-test.sqlite` and `/tmp/delta-sim-test.snapshot.json`.
- **Stdout Assertion**: Emits:
  ```
  Generated snowflakeCost/idle-warehouse-waste seed 9101 -> /tmp/delta-sim-test.sqlite
  Snapshot -> /tmp/delta-sim-test.snapshot.json
  ```

### Step 2: Resilient Simulation Schema Handling & Snapshot Conformance (`AC-2`, `AC-4`)
Execute targeted pytest assertions verifying resilient schema packaging and canonical `SQLiteSnapshot` compliance:
```bash
python3 -m pytest tests/test_package_snapshot.py -q -k test_snapshot_schema_conforms_to_sqlite_snapshot_contract
python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_snapshot_provenance_metadata
python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_recommendation_queue_governance_columns_snapshot
```
- **Expected Exit Code**: `0`
- **Assertion**: Snapshot conforms strictly to `frontend/src/core/data/sqliteSnapshot.ts`, handles virtual generated columns seamlessly, contains all seven datasets, and preserves recommendation queue governance.

### Step 3: Preserved Buyer-Visible Dashboard Output and Presentation Semantics (`AC-3`)
Verify scenario catalog and template catalog bindings:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_scenario_catalog_registers_idle_warehouse_waste
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_template_catalog_registers_idle_warehouse_waste
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_all_seven_scenario_datasets_present_in_sqlite
```
- **Expected Exit Code**: `0`
- **Assertion**: All catalog registrations and data adapter query bindings for presentation views are intact.

### Step 4: Bit-for-Bit Determinism Verification (`AC-4`)
Generate a duplicate set of assets with identical seed `9101` and verify identical SHA-256 cryptographic hashes:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/delta-sim-test-2.sqlite \
  --snapshot-output /tmp/delta-sim-test-2.snapshot.json \
  --force

sha256sum /tmp/delta-sim-test.sqlite /tmp/delta-sim-test-2.sqlite
sha256sum /tmp/delta-sim-test.snapshot.json /tmp/delta-sim-test-2.snapshot.json
```
- **Expected Exit Code**: `0`
- **Assertion**: Hashes match identically, confirming bit-for-bit generation determinism across delta execution runs.

### Step 5: Clean Stream Separation & Pure Stdout Verification (`AC-5`)
Execute CLI generation with diagnostic reporting active, separating stdout and stderr:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/delta-sim-test.sqlite \
  --snapshot-output /tmp/delta-sim-test.snapshot.json \
  --force \
  --diagnostics > /tmp/stdout.log 2> /tmp/stderr.log
```
- **Expected Exit Code**: `0`
- **Stdout Check**: Inspect `/tmp/stdout.log` to confirm it contains ONLY:
  ```
  Generated snowflakeCost/idle-warehouse-waste seed 9101 -> /tmp/delta-sim-test.sqlite
  Snapshot -> /tmp/delta-sim-test.snapshot.json
  ```
- **Stderr Check**: Inspect `/tmp/stderr.log` to confirm structured diagnostic entries appear on stderr.

### Step 6: Fail-Closed Robustness & Overwrite Guard Verification (`AC-6`)
Verify that unforced overwrites and invalid parameters fail closed with exit status 2 without tracebacks:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --output /tmp/delta-sim-test.sqlite

python3 -m pytest tests/test_diagnostics.py -q -k test_fail_closed_existing_target_without_force
python3 -m pytest tests/test_diagnostics.py -q -k test_fail_closed_missing_required_arguments
```
- **Expected Exit Code**: `2` (for CLI invocation) and `0` (for pytest suite).
- **Assertion**: Clean error message emitted to stderr; stdout is empty; no Python stack traces.

### Step 7: Zero External Runtime Dependencies & Read-Only dataForge Audit (`AC-7`)
Verify dependency hygiene and sibling repository isolation:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_zero_external_runtime_dependencies
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_dataforge_unmodified
```
- **Expected Exit Code**: `0`
- **Assertion**: Confirms exclusive use of Python standard library and pristine read-only status of `dataForge/`.

### Step 8: Full Regression Suite Execution with NO PYTHONPATH Override (`AC-7`)
Execute the complete test suite across all test files:
```bash
python3 -m pytest tests/ -q
```
- **Expected Exit Code**: `0`
- **Assertion**: 100% of tests pass cleanly with zero failures or errors.

### Step 9: User Journey Simulation Gate Verification
Verify that all five user journeys in `journeys/user_journeys_manifest.json` execute successfully using declared allowlisted commands:
- `journey-delta-execution-and-timeout-resilience` (`AC-1`, `AC-4`)
- `journey-simulation-schema-resilience-and-snapshot-conformance` (`AC-2`, `AC-4`)
- `journey-preserved-dashboard-output-and-presentation-semantics` (`AC-3`, `AC-4`)
- `journey-cli-stream-separation-and-fail-closed-error-handling` (`AC-5`, `AC-6`)
- `journey-regression-immunity-and-full-test-suite-execution` (`AC-4`, `AC-7`)

---

## Risks

The implementation of the `repair-03feb3227318` slice addresses complex simulation execution, checkpoint persistence, and schema resilience. The following risk analysis identifies potential hazards and outlines concrete mitigation strategies to ensure seamless delivery:

| Risk Description | Severity | Likelihood | Impact | Concrete Mitigation Strategy |
|:---|:---:|:---:|:---|:---|
| **Delta State Drift or Accumulation Divergence**: Partitioning simulation generation into incremental deltas could inadvertently introduce numerical drift, subtle row order variance, or cumulative rounding discrepancies compared to monolithic generation. | High | Low | Output datasets differ across runs or lose bit-for-bit determinism, violating AC-4. | **Seeded Delta Reconstitution & Checksum Invariance**: Delta execution algorithms use deterministic pseudo-random sequence generators initialized with the canonical seed (`9101`). Checkpoint persistence writes ordered primary keys and deterministic tie-breaking sorts. Automated tests (`test_delta_execution_bit_for_bit_determinism`) assert exact SHA-256 byte-for-byte matching between delta-generated and baseline datasets. |
| **Simulation Schema Inference Failure on Virtual / Delta Columns**: PRAGMA table inspection in `package_snapshot.py` could fail when encountering virtual generated columns (e.g., `GENERATED ALWAYS AS ... VIRTUAL`), intermediate calculation tables, or complex SQL expressions. | High | Low | Snapshot export throws unhandled exceptions when packaging simulation outputs, violating AC-2. | **Defensive PRAGMA Parsing & Virtual Column Filtering**: Table inspection logic in `package_snapshot.py` is updated to inspect column metadata defensively, explicitly identifying virtual generated columns and filtering temporary internal delta tables (`_delta_*`). Targeted unit tests validate snapshot export against schemas with virtual generated columns. |
| **Stdout Stream Corruption by Delta Logging Telemetry**: Emitting delta progress updates, checkpoint confirmations, or phase telemetry to standard output would break downstream CLI consumers, pipe commands, and JSON parsers. | High | Low | Automated orchestration scripts and downstream consumers fail to parse CLI outputs, violating AC-5. | **Dedicated Stderr Stream Routing**: All delta execution progress indicators, checkpoint logging, and diagnostic phase timers are strictly routed to `sys.stderr`. Stdout is reserved exclusively for the two canonical single-line completion confirmations. Subprocess tests independently capture stdout and assert zero diagnostic or delta log pollution. |
| **Performance Overhead from Intermediate Checkpoint I/O**: Persisting intermediate checkpoints to disk after each delta increment could incur excessive SQLite transaction and filesystem I/O overhead. | Medium | Low | Checkpoint I/O slows down step execution, partially negating the time savings of delta execution. | **Batched Transactions & In-Memory Checkpoint Staging**: Intermediate delta states are computed in memory and committed in batched SQLite transactions using optimized `PRAGMA synchronous = NORMAL` and WAL journal mode during generation. Checkpoint frequency is bounded (2–4 checkpoints per simulation) so total checkpoint overhead remains <1 second. |
| **Accidental Mutation of Sibling dataForge Repository**: Sibling repository `/home/lee/projects/dataForge/` is strictly read-only under DashForge governance; any file writes within it fail the step. | Fatal | Low | Immediate step failure and governance breach, violating AC-7. | **Strict Boundary Enforcement & AST Audits**: All delta execution logic, schema resilience mechanisms, and CLI extensions are implemented exclusively within `src/dashForge/`. Automated tests (`test_dataforge_unmodified`) inspect git status on `dataForge/` to ensure zero files are added, modified, or deleted. |
| **CLI Backward Compatibility Regression across Industry Packs**: Modifications to `main.py` or `package_snapshot.py` could break existing CLI invocations for healthcare, financial, or SaaS packs. | High | Low | Existing industry packs fail to generate or fail snapshot packaging, violating AC-7. | **Comprehensive Pack Regression Testing**: All changes to `package_snapshot.py` preserve default argument signatures and fallback mechanisms for non-delta packs. Full test suite execution across all packs (`healthcare`, `financial`, `saas`, `snowflakeCost`) verifies complete backward compatibility. |
| **Python Traceback Leakage on Malformed Inputs or Missing Flags**: Adding delta execution parameters or schema error handlers could inadvertently allow unhandled exceptions to escape to the terminal. | Medium | Low | Unhandled tracebacks displayed during client workshops or pipeline execution, violating AC-6. | **Fail-Closed Exception Trapping**: All potential input errors (`ValueError`, `FileExistsError`, `KeyError`, `argparse.ArgumentError`) are caught at the CLI boundary and delegated to `parser.error()`, which prints clean diagnostic messages on stderr and terminates with exit status 2. |

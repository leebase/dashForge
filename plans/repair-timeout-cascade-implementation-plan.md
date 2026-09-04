# Repair Timeout Cascade Implementation Plan

## Executive Summary & Slice Intent

The `repair-timeout-cascade` slice establishes playbook deconstruction and diagnostic timing instrumentation to eliminate the recurring 600-second worker timeout cascade in DashForge governed delivery workflows. DashForge operates as an internal consulting delivery accelerator for Anblicks analytics consultants engaging enterprise executive buyers. In governed multi-step delivery pipelines managed by Agent-Orch, execution steps often aggregate disparate, heavy tasks—including full test suite executions, relational data generation, PRAGMA schema inspection, JSON snapshot serialization, and multi-file code authoring—into single monolithic execution blocks.

When any monolithic execution step approaches or exceeds the default 600-second execution window enforced by Agent-Orch worker adapters (such as `codex_cli`), the orchestrator forcibly aborts the worker process and triggers an automatic retry. Because intermediate progress in monolithic steps is neither checkpointed nor sealed into durable artifacts, subsequent retry attempts re-execute the exact same undifferentiated workload from scratch. In the absence of diagnostic visibility into execution bottlenecks, retries consistently exhaust the same 600-second budget, resulting in a deterministic timeout cascade that stalls workflow progression, exhausts compute resources, and halts automated delivery.

This implementation plan defines the architectural modifications, modular stage boundaries, diagnostic timing telemetry, and comprehensive validation framework required to resolve this failure mode permanently. Governed playbooks are deconstructed into modular, bounded stages with explicit intermediate artifact checkpoints that complete well within the 600-second budget (targeting <120 seconds). Concurrently, a lightweight, zero-dependency diagnostic timing facility is embedded into DashForge's generation and packaging runtime (`src/dashForge/`), recording timestamped phase durations to standard error (`stderr`) while strictly preserving primary payload integrity on standard output (`stdout`), maintaining bit-for-bit snapshot determinism, upholding fail-closed error handling, preserving all runtime presentation seams, and keeping sibling project `dataForge` strictly read-only.

---

## Architecture

The architecture of the `repair-timeout-cascade` slice introduces two complementary systems designed to eliminate execution bottlenecks and ensure workflow resilience under Agent-Orch: **Playbook Deconstruction & Modular Stage Checkpointing** and **Zero-Overhead Diagnostic Timing & Stream Separation**. Together, these systems provide fine-grained execution bounds, transparent performance observability, and deterministic artifact sealing without altering core product behavior or introducing third-party runtime dependencies.

### 1. Root Cause Analysis: The 600-Second Timeout Cascade

Under Agent-Orch, worker processes execute inside bounded environments with a strict per-step execution timeout (defaulting to 600 seconds). In monolithic workflow definitions, a single step combines:
1. Dynamic scenario discovery and environment resolution.
2. Relational dataset generation across multiple tables (e.g., seven Snowflake Account Usage tables).
3. SQLite in-memory and on-disk database construction with foreign key constraints.
4. Schema inspection via `PRAGMA table_info` and role inference.
5. JSON snapshot serialization and filesystem persistence.
6. Full regression test suite execution across all historical industry packs.

When unexpected disk I/O latency, heavy synthetic data generation, or comprehensive test runs delay step completion past 600 seconds, the orchestrator terminates the worker with a timeout signal and schedules an automatic retry. Because the monolithic step did not seal intermediate outputs, the retry starts from ground zero. Without visibility into whether time was consumed by scenario resolution, relational table generation, snapshot serialization, or test harness overhead, operators and autonomous agents cannot determine the bottleneck. Retries predictably hit the same 600-second ceiling, producing an unrecoverable timeout cascade.

### 2. Playbook Deconstruction Architecture

To overcome this vulnerability, monolithic workflows are partitioned into discrete, sequentially bounded execution stages. Each stage is characterized by:
- **Explicit Inputs & Outputs**: Stages consume verified artifacts from upstream stages and produce discrete, sealed deliverables.
- **Intermediate Artifact Sealing**: Once an intermediate artifact (e.g., generated SQLite database or extracted snapshot) is validated and sealed to disk, subsequent stages consume it directly. Retrying a later stage does not re-trigger data generation.
- **Strict Execution Time Bounds**: Each individual stage is sized and structured to complete in a fraction of the 600-second budget—targeting normal execution times under 120 seconds and typically completing in under 30 seconds—providing ample margin against transient system slowdowns.
- **Independent Validation Gates**: Each stage validates its immediate deliverables through targeted assertions before advancing, isolating failures to the exact sub-operation responsible.

The deconstructed delivery workflow partitions the lifecycle into six bounded stages:
1. **Stage 1 (Contract & Interface Specification)**: Formulate governed contract and synchronized user journeys manifest (<60s).
2. **Stage 2 (Targeted Test Authoring)**: Author unit and regression test specifications verifying timing options, stream separation, and schema contracts (<90s).
3. **Stage 3 (Core Data Generation)**: Execute bounded relational table generation and SQLite database persistence (<120s).
4. **Stage 4 (Snapshot Packaging & Schema Conformance)**: Perform PRAGMA table inspection, provenance metadata enrichment, and canonical JSON snapshot serialization (<90s).
5. **Stage 5 (Integration & Regression Verification)**: Run full test suite validation across all packs with NO PYTHONPATH override (<120s).
6. **Stage 6 (Review & Handoff)**: Conduct independent reviewer inspection and evidence chain validation (<60s).

### 3. Diagnostic Timing & Telemetry Subsystem

The diagnostic timing subsystem is implemented as a lightweight Python standard library module (`src/dashForge/diagnostics.py`) integrated cleanly into `main.py`, `package_snapshot.py`, and `snowflake_cost.py`. It provides high-resolution elapsed time instrumentation using `time.perf_counter()` and `time.perf_counter_ns()` to capture nanosecond-precise phase boundaries with sub-microsecond overhead.

The diagnostic lifecycle instruments the following critical execution phases:
- `cli_initialization`: Argument parsing, flag validation, and pre-execution fail-closed path checking.
- `scenario_resolution`: Dynamic scenario discovery and schema catalog validation via `dataForge`.
- `data_generation`: Synthetic relational record generation and SQL table insertion.
- `sqlite_persistence`: SQLite database flushing, indexing, and on-disk file synchronization.
- `pragma_inspection`: SQLite metadata extraction and column type/role inference via `PRAGMA table_info`.
- `snapshot_serialization`: Canonical `SQLiteSnapshot` dictionary assembly, provenance enrichment, and JSON encoding.
- `disk_persistence`: Atomic snapshot file writing to target filesystem paths.
- `schema_validation`: Post-generation integrity assertions (e.g., `recommendation_queue` governance verification).

### 4. Clean Stream Separation & Stdout Purity Architecture

A core architectural constraint is that diagnostic timing telemetry must never contaminate standard output (`stdout`). Automated pipelines, shell scripts, and JSON parsers rely on DashForge CLI stdout formatting remaining strictly backward compatible.

The architecture enforces strict stream separation:
- **Standard Output (`stdout`)**: Reserved exclusively for primary functional output payloads. When `dashForge.main generate` completes successfully, it emits only the canonical single-line generation confirmation and optional snapshot path:
  ```
  Generated <packId>/<scenarioId> seed <seed> -> <outputPath>
  Snapshot -> <snapshotOutputPath>
  ```
- **Standard Error (`stderr`)**: Reserved for operational diagnostics, elapsed timing telemetry, warning notifications, and fail-closed error messages. When diagnostic reporting is active (e.g., via `--diagnostics` flag or `DASHFORGE_DIAGNOSTICS=1` environment variable), formatted phase duration summaries are written directly to `sys.stderr`:
  ```
  [DIAGNOSTIC] Phase 'scenario_resolution': 4.12ms
  [DIAGNOSTIC] Phase 'data_generation': 82.45ms
  [DIAGNOSTIC] Phase 'pragma_inspection': 12.30ms
  [DIAGNOSTIC] Phase 'snapshot_serialization': 18.60ms
  [DIAGNOSTIC] Total pipeline duration: 117.47ms
  ```
- **Fail-Closed Diagnostics**: When an invalid invocation occurs (e.g., missing required parameters, unknown scenario, or target file conflict without `--force`), the CLI intercepts the error and routes the diagnostic message to `parser.error()`, emitting a clean error to `stderr` and exiting with status code 2 without emitting Python tracebacks or polluting `stdout`.

### 5. Architectural Component Diagram

The following diagram illustrates the interaction between deconstructed workflow stages, the CLI layer, diagnostic timing instrumentation, stream separation, and artifact deliverables:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Deconstructed Governed Workflow Stages                   │
│                                                                             │
│  Stage 1: Contract & Manifest Spec (Target: <60s)                           │
│     │                                                                       │
│     ▼                                                                       │
│  Stage 2: Targeted Test Authoring (Target: <90s)                            │
│     │                                                                       │
│     ▼                                                                       │
│  Stage 3: Core Relational Data Generation (Target: <120s)                   │
│     │                                                                       │
│     ▼                                                                       │
│  Stage 4: Snapshot Packaging & Schema Validation (Target: <90s)             │
│     │                                                                       │
│     ▼                                                                       │
│  Stage 5: Full Integration & Regression Verification (Target: <120s)        │
│     │                                                                       │
│     ▼                                                                       │
│  Stage 6: Review & Evidence Handoff (Target: <60s)                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Governed CLI Invocation
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DashForge CLI Execution Pipeline                      │
│  src/dashForge/main.py: CLI Entrypoint (python3 -m dashForge.main generate) │
│    ├── Flags: --pack, --scenario, --seed, --output, --snapshot-output       │
│    ├── Options: --force, --diagnostics (or DASHFORGE_DIAGNOSTICS=1)         │
│    └── Pre-Check: Overwrite guard evaluating target paths (Status 2)        │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     Diagnostic Telemetry Module      │  │    Generation & Packaging Core    │
│  src/dashForge/diagnostics.py        │  │  src/dashForge/package_snapshot.py│
│  ├── DiagnosticTimer context manager │  │  src/dashForge/snowflake_cost.py  │
│  ├── High-res time.perf_counter_ns() │  │  ├── Dynamic Scenario Discovery   │
│  ├── Phase duration tracking         │  │  ├── Relational SQL Generation    │
│  └── Summary formatting to stderr    │  │  ├── PRAGMA Table Inspection      │
└───────────────────┬──────────────────┘  │  └── Canonical SQLiteSnapshot Ser.│
                    │                     └─────────────────┬─────────────────┘
                    │                                       │
                    ▼                                       ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│           Stream Separation          │  │       Canonical Deliverables      │
│  stderr: Telemetry & Diagnostics     │  │  1. Bounded SQLite DB (.sqlite)   │
│  stdout: Clean single-line summary   │  │  2. JSON Snapshot (.snapshot.json)│
│  (100% backward compatible payload)  │  │  (Bit-for-bit deterministic)      │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## Concrete Plan Items & Work Breakdown

The implementation of the `repair-timeout-cascade` slice is structured into seven concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-7`:

### Plan Item 1: Governed Playbook Deconstruction & Modular Checkpoint Sealing (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("Governed workflow playbooks and long-running execution steps subject to the 600-second timeout cascade are deconstructed into modular, bounded stages with explicit inputs, outputs, and intermediate checkpoints; each deconstructed step is scoped to finish well within the 600-second budget, preventing timeout aborts and eliminating cascading whole-workflow retries.")
- **Objective**: Restructure governed workflow playbooks and pipeline configurations to eliminate monolithic step bundling, bounding each step to target durations under 120 seconds with explicit intermediate artifact sealing.
- **Implementation Touchpoints**:
  - In `playbooks/`: Audit existing playbooks (`snowflake-cost-pack.golden.yaml`, `package-dataforge-snapshot.golden.yaml`, `mvp_remaining_governed_delivery.yaml`, etc.) to identify monolithic step definitions aggregating code changes, generation, and multi-pack test runs.
  - Deconstruct monolithic delivery steps into discrete stages: Contract Specification -> Test Authoring -> Core Implementation / Generation -> Snapshot Packaging -> Integration Verification -> Review Handoff.
  - Establish explicit intermediate checkpoints: configure playbooks to declare persistent step outputs (e.g., generated SQLite databases, snapshot JSON files, and test manifests) so retrying an aborted or interrupted run resumes from the last sealed checkpoint rather than restarting from zero.
  - Bound per-step timeouts: ensure all deconstructed steps have explicit execution timeouts appropriate for bounded tasks (target <120 seconds, ceiling 300 seconds), well below the 600-second adapter abort threshold.
- **Deliverables**: Deconstructed, checkpointed playbook configurations ensuring all steps complete reliably within bounded time budgets.

### Plan Item 2: Structured Low-Overhead Diagnostic Logging & Phase Timing Instrumentation (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The DashForge generation and packaging runtime incorporates structured, low-overhead diagnostic logging and elapsed timing instrumentation that records timestamped durations for major execution phases (CLI initialization, scenario resolution, relational data generation, SQLite table creation, snapshot serialization, and disk persistence) to safely identify performance bottlenecks in governed runs.")
- **Objective**: Create a high-resolution, low-overhead diagnostic timing subsystem that captures millisecond-precise execution durations across all major generation and packaging phases.
- **Implementation Touchpoints**:
  - In `src/dashForge/diagnostics.py`: Implement `DiagnosticTimer`, `PhaseRecord`, and timing context managers using `time.perf_counter()` and `time.perf_counter_ns()`.
  - Instrument `src/dashForge/package_snapshot.py`: Wrap critical execution blocks:
    - Database connection and PRAGMA table inspection (`pragma_inspection`).
    - Row extraction and semantic role/type inference (`role_inference`).
    - Dataset assembly and JSON serialization (`snapshot_serialization`).
    - File writing to disk (`disk_persistence`).
  - Instrument `src/dashForge/snowflake_cost.py`: Wrap dynamic scenario discovery (`scenario_resolution`), table schema validation (`schema_validation`), and provenance metadata enrichment (`provenance_enrichment`).
  - Instrument `src/dashForge/main.py`: Record overall CLI initialization and pipeline execution duration.
  - Ensure timing instrumentation overhead is negligible (<0.1ms total execution penalty).
- **Deliverables**: New `src/dashForge/diagnostics.py` module and timing-instrumented packaging runtime in `src/dashForge/`.

### Plan Item 3: Clean Diagnostic Stream Separation & Non-Polluting CLI Reporting (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("The CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) safely supports diagnostic logging and telemetry without altering default output formatting or corrupting stdout; diagnostic messages are cleanly separated to stderr or designated diagnostic channels, ensuring downstream scripting and automation pipelines receive unpolluted payload streams.")
- **Objective**: Ensure that all diagnostic telemetry, phase durations, and logging messages are strictly isolated to `stderr`, leaving `stdout` pure, deterministic, and 100% backward compatible.
- **Implementation Touchpoints**:
  - In `src/dashForge/main.py`: Add optional `--diagnostics` CLI argument to `generate` subparser without modifying required arguments (`--pack`, `--scenario`, `--output`) or optional arguments (`--seed`, `--snapshot-output`, `--force`).
  - Support environment variable `DASHFORGE_DIAGNOSTICS=1` as an alternative activation mechanism for automated environments where modifying CLI flags is impractical.
  - Route all timing reports and phase logs exclusively to `sys.stderr` via `DiagnosticTimer.report(stream=sys.stderr)`.
  - Verify that standard output (`stdout`) produces only the canonical confirmation lines:
    `Generated <pack>/<scenario> seed <seed> -> <output>`
    `Snapshot -> <snapshot_output>`
  - Ensure that piping stdout (e.g., `... generate ... | grep Generated`) or automated JSON parsing of CLI output receives zero diagnostic log pollution.
- **Deliverables**: Hardened CLI entrypoint supporting optional diagnostic telemetry on `stderr` while preserving uncorrupted `stdout`.

### Plan Item 4: Bit-for-Bit Determinism Preservation & Canonical Snapshot Schema Conformance (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("Diagnostic logging and modularized stage execution preserve bit-for-bit generation determinism and schema fidelity; generated SQLite databases and JSON snapshots remain byte-for-byte identical given identical seeds and conform strictly to the canonical `SQLiteSnapshot` contract (`frontend/src/core/data/sqliteSnapshot.ts`), preserving all seven scenario datasets, provenance metadata, and recommendation queue governance.")
- **Objective**: Guarantee that the addition of diagnostic timing instrumentation and stage deconstruction does not alter generated artifact content, hashes, or schema structures.
- **Implementation Touchpoints**:
  - In `src/dashForge/package_snapshot.py` and `src/dashForge/snowflake_cost.py`: Verify that timing decorators and context managers do not modify data structures, seed state, or serialization formats.
  - Ensure exported JSON snapshots strictly conform to `frontend/src/core/data/sqliteSnapshot.ts`:
    - Top-level properties: `packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, `generatorVersion`, `generationTimestamp`, `synthetic: true`, `disclosure: "Synthetic demo data"`.
    - Datasets array containing all seven canonical tables: `executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`.
    - Typed columns (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`).
    - Recommendation queue governance columns: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`.
  - Validate that successive generation runs with identical seeds produce byte-for-byte identical SHA-256 digests across both SQLite files and JSON snapshots.
- **Deliverables**: Bit-for-bit deterministic generation outputs validated against the canonical `SQLiteSnapshot` TypeScript contract.

### Plan Item 5: Fail-Closed Robustness & Graceful Error Diagnostic Reporting (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("Diagnostic instrumentation and timing utilities fail closed and introduce no unhandled exceptions or raw Python tracebacks; invalid CLI invocations, missing arguments, unknown scenarios, or existing target files without `--force` continue to exit cleanly with status code 2 and informative diagnostic messages.")
- **Objective**: Ensure that diagnostic instrumentation fails closed and preserves clean CLI error handling, exiting with status code 2 on validation failures without unhandled tracebacks.
- **Implementation Touchpoints**:
  - In `src/dashForge/main.py`: Ensure exception handling wraps all generation and packaging invocations.
  - Catch `FileExistsError`, `ValueError`, `KeyError`, and `argparse.ArgumentError` and delegate to `parser.error()`, emitting clean diagnostics to `stderr` and exiting with status code 2.
  - Ensure pre-execution overwrite checks evaluate target paths (`--output` and `--snapshot-output`) before invoking generators; if paths exist and `--force` is false, abort cleanly with status 2.
  - Ensure unknown scenario IDs (e.g., `--scenario unknown-scenario`) fail closed with status 2 and descriptive error messages.
  - Confirm that diagnostic timing utilities themselves never raise unhandled exceptions during exception handling or error exits.
- **Deliverables**: Resilient, fail-closed CLI execution path with zero raw Python tracebacks.

### Plan Item 6: Runtime Presentation Seams & Catalog Registration Continuity (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("Diagnostic logging and stage deconstruction preserve all existing runtime presentation seams and catalog bindings; the shared `DataAdapter` query routing, `DashboardSpec` contracts, scenario catalog registrations (`snowflakeCost:idle-warehouse-waste`), and template definitions (`tpl.snowflakeCost.idle-warehouse-waste`) remain fully functional without secondary rendering paths.")
- **Objective**: Preserve seamless integration with DashForge's presentation layer, ensuring that scenario catalogs, template blueprints, and `DataAdapter` query routing remain fully operational.
- **Implementation Touchpoints**:
  - Verify that `frontend/src/mock-data/scenarioCatalog.ts` retains registration for `snowflakeCost:idle-warehouse-waste` mapping all seven canonical datasets.
  - Verify that `frontend/src/mock-data/templateCatalog.ts` retains registration for `tpl.snowflakeCost.idle-warehouse-waste`.
  - Verify that `frontend/src/features/runtime/idleWarehousePresentation.ts` and `standaloneDashboard.ts` continue to load and query data through `DataAdapter` seams (`query`, `aggregate`, `getSchema`).
  - Ensure no secondary rendering paths or bespoke visualization branches are introduced.
- **Deliverables**: Unbroken presentation layer contracts and catalog registrations.

### Plan Item 7: Zero External Dependencies, Read-Only dataForge Boundary & Regression Suite Immunity (`AC-7`)
- **Mapped Acceptance Check**: `AC-7` ("All diagnostic logging and timing facilities rely exclusively on Python standard library modules (`time`, `logging`, `argparse`, `json`, `sqlite3`, `pathlib`, `sys`); sibling repository `dataForge/` remains strictly read-only; all existing packs (`healthcare`, `financial`, `saas`, `snowflakeCost`) remain operational; and the full automated test suite passes cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override.")
- **Objective**: Enforce strict dependency hygiene, maintain the read-only sibling repository boundary, verify all existing industry packs, and ensure full test suite compliance.
- **Implementation Touchpoints**:
  - In `src/dashForge/diagnostics.py` and all modified files: Use exclusively Python standard library modules (`time`, `logging`, `argparse`, `json`, `sqlite3`, `pathlib`, `sys`, `dataclasses`, `contextlib`). Prohibit any external profiling or APM packages (e.g., `psutil`, `py-spy`, `memory_profiler`).
  - Enforce read-only sibling boundary: Verify that no files within `/home/lee/projects/dataForge/` are created, modified, or deleted during execution.
  - Verify backward compatibility across all existing packs: execute generation tests for `healthcare` (`flu-season`), `financial` (`market-downturn`), `saas` (`churn-crisis`), and `snowflakeCost` (`idle-warehouse-waste`).
  - Verify full test suite execution: confirm all 109+ tests pass cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override.
- **Deliverables**: Clean standard library implementation, untouched sibling repository, and 100% passing test suite.

---

## Acceptance Criteria Traceability Matrix

The following bidirectional traceability matrix establishes one-to-one mapping between contract acceptance checks (`AC-1` through `AC-7`), concrete plan items, target subsystems, test methods, and verification procedures:

| Acceptance Check | Contract Requirement Summary | Target Subsystem / Files | Concrete Plan Item | Automated Test Coverage | Verification Method |
|:---|:---|:---|:---|:---|:---|
| **AC-1** | Playbook deconstruction into modular, bounded stages (<600s budget, intermediate checkpoints, eliminate retry cascade) | `playbooks/`, `src/dashForge/` | **Plan Item 1** | `test_repair_timeout_cascade.py::test_deconstructed_step_execution_time_bounds` | Timed CLI generation execution confirming completion in <120s |
| **AC-2** | Structured, low-overhead diagnostic logging and elapsed timing instrumentation across major generation phases | `src/dashForge/diagnostics.py`, `src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py` | **Plan Item 2** | `test_repair_timeout_cascade.py::test_diagnostic_timing_telemetry_capture`, `test_phase_timer_duration_reporting` | CLI execution with `--diagnostics` verifying phase duration reports |
| **AC-3** | CLI entrypoint supports diagnostic logging cleanly on stderr without corrupting stdout or breaking downstream parsing | `src/dashForge/main.py`, `src/dashForge/diagnostics.py` | **Plan Item 3** | `test_repair_timeout_cascade.py::test_diagnostic_stream_separation_stderr_stdout`, `test_stdout_purity_with_diagnostics` | Subprocess execution capturing stdout and stderr separately, asserting stdout purity |
| **AC-4** | Preservation of bit-for-bit generation determinism and canonical `SQLiteSnapshot` contract schema conformance | `src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py` | **Plan Item 4** | `test_idle_warehouse_waste.py::test_bit_for_bit_deterministic_generation`, `test_package_snapshot.py::test_snapshot_schema_conforms...` | SHA-256 digest comparison of SQLite databases and JSON snapshots across runs |
| **AC-5** | Fail-closed robustness with status code 2 on invalid parameters, unknown scenarios, or existing files without `--force` | `src/dashForge/main.py` | **Plan Item 5** | `test_repair_timeout_cascade.py::test_fail_closed_existing_target_without_force`, `test_unknown_scenario_fails_cleanly` | CLI invocations without `--force` and with invalid arguments asserting exit code 2 |
| **AC-6** | Preservation of runtime presentation seams, catalog bindings (`snowflakeCost:idle-warehouse-waste`), and DataAdapter routing | `frontend/src/mock-data/`, `frontend/src/features/runtime/` | **Plan Item 6** | `test_idle_warehouse_waste.py::test_scenario_catalog_registers_idle_warehouse_waste`, `test_template_catalog_registers...` | Automated catalog registration tests and DataAdapter query assertions |
| **AC-7** | Zero external runtime dependencies (stdlib only), read-only sibling `dataForge/`, and full test suite execution with NO PYTHONPATH override | `src/dashForge/`, `tests/` | **Plan Item 7** | `test_repair_timeout_cascade.py::test_zero_external_runtime_dependencies`, `test_dataforge_unmodified`, full test run | AST dependency audit, git status check on `dataForge/`, and `python3 -m pytest tests/ -q` |

---

## Tests

The test strategy for the `repair-timeout-cascade` slice provides comprehensive automated verification across all functional, performance, security, and integration requirements. The suite guarantees that diagnostic timing instrumentation provides actionable bottleneck observability while remaining strictly non-intrusive, zero-overhead, and completely backward compatible.

### 1. Dedicated Test Suite: `tests/test_repair_timeout_cascade.py`

A dedicated test module `tests/test_repair_timeout_cascade.py` will be authored in the test authoring phase to validate all timing, logging, and deconstruction capabilities:

1. **Deconstructed Stage Execution Time Bounds Test (`AC-1`)**:
   - `test_deconstructed_step_execution_time_bounds`: Invokes `package_snapshot` across all supported packs (`healthcare`, `financial`, `saas`, `snowflakeCost`) and asserts that total step execution completes well within the 120-second target (typically <5 seconds), proving that deconstructed steps operate far below the 600-second timeout boundary.

2. **Phase Timing Telemetry & Bottleneck Identification Test (`AC-2`)**:
   - `test_diagnostic_timing_telemetry_capture`: Executes generation under diagnostic mode and verifies that elapsed durations are captured for all key phases: `cli_initialization`, `scenario_resolution`, `data_generation`, `sqlite_persistence`, `pragma_inspection`, and `snapshot_serialization`.
   - `test_phase_timer_duration_reporting`: Verifies that reported durations are positive floating-point numbers with millisecond-level precision and that the sum of individual phases closely matches total elapsed time.

3. **Stream Separation & Stdout Purity Test (`AC-3`)**:
   - `test_diagnostic_stream_separation_stderr_stdout`: Executes the CLI via `subprocess.run` with `--diagnostics` (and separately with `DASHFORGE_DIAGNOSTICS=1`), capturing `stdout` and `stderr` independently.
   - Asserts that `stdout` contains ONLY the canonical single-line generation confirmation:
     `Generated snowflakeCost/idle-warehouse-waste seed 9101 -> <path>`
     `Snapshot -> <path>`
   - Asserts that `stdout` contains zero diagnostic strings, phase names, or timing prefixes.
   - Asserts that `stderr` contains the structured diagnostic breakdown (e.g., `[DIAGNOSTIC] Phase ...`).

4. **Bit-for-Bit Determinism & Snapshot Conformance Test (`AC-4`)**:
   - `test_deterministic_generation_under_diagnostic_mode`: Generates SQLite databases and JSON snapshots twice using seed `9101`—once with diagnostics active and once with diagnostics disabled.
   - Asserts that the resulting SQLite database files and JSON snapshot files have identical SHA-256 cryptographic hashes, proving that timing instrumentation does not introduce side effects or alter output bytes.
   - Validates that the generated snapshot matches the `SQLiteSnapshot` TypeScript contract in `frontend/src/core/data/sqliteSnapshot.ts`, containing all seven datasets, provenance metadata, and recommendation queue governance fields.

5. **Fail-Closed Diagnostics & Overwrite Protection Test (`AC-5`)**:
   - `test_fail_closed_existing_target_without_force`: Pre-creates target output paths and invokes CLI without `--force`. Asserts that the command fails closed with exit code 2, emits a clean error to `stderr`, and produces zero output on `stdout`.
   - `test_fail_closed_unknown_scenario`: Invokes CLI with an invalid scenario identifier. Asserts that execution aborts with exit code 2 and a clean diagnostic message without Python stack traces.
   - `test_fail_closed_missing_arguments`: Invokes CLI with missing required flags (`--scenario`, `--output`). Asserts that exit code is 2 and usage errors are emitted cleanly.

6. **Runtime Presentation & DataAdapter Integrity Test (`AC-6`)**:
   - `test_presentation_contracts_unaffected_by_diagnostics`: Verifies that `scenarioCatalog` and `templateCatalog` entries for `snowflakeCost:idle-warehouse-waste` remain valid and that `DataAdapter` query routing across all seven datasets functions identically.

7. **Zero External Dependencies & Sibling Repository Isolation Test (`AC-7`)**:
   - `test_zero_external_runtime_dependencies`: Uses Python's `ast` module to parse `src/dashForge/diagnostics.py`, `src/dashForge/main.py`, `src/dashForge/package_snapshot.py`, and `src/dashForge/snowflake_cost.py`, verifying that all imported modules belong exclusively to the Python standard library.
   - `test_dataforge_unmodified`: Inspects the sibling `/home/lee/projects/dataForge/` repository using git status checks to confirm zero modified, untracked, or deleted files.

### 2. Full Regression Suite Execution

The existing comprehensive test suite across `tests/` must continue to pass with zero failures:
- `tests/test_idle_warehouse_waste.py` (36 tests)
- `tests/test_snowflake_cost_pack.py` (35 tests)
- `tests/test_package_snapshot.py` (14 tests)
- `tests/test_dataforge_compat.py` (4 tests)
- `tests/test_generate.py` (20 tests)

### 3. Test Execution Command

The test suite must be executed using the exact standard command with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
*Note: The orchestrator executes claims in a bounded environment where pytest is importable through its own environment. Overriding PYTHONPATH hides orchestrator modules and triggers execution failures.*

---

## Verification

The verification procedure validates the `repair-timeout-cascade` slice end-to-end through sequential, reproducible commands executed from the workspace root. Each verification check specifies the exact command, expected exit code, output assertions, and acceptance check alignment.

### Step 1: Bounded Execution Duration and Output Generation (`AC-1`, `AC-2`, `AC-4`)
Execute the canonical generation command for `snowflakeCost:idle-warehouse-waste` with force overwrite and record elapsed execution duration:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/timeout-deconstruct-test.sqlite \
  --snapshot-output /tmp/timeout-deconstruct-test.snapshot.json \
  --force
```
- **Expected Exit Code**: `0`
- **Duration Assertion**: Command completes in <10 seconds, well within the 120-second bounded step threshold and far below the 600-second timeout ceiling.
- **Output Assertion**: Generates both `/tmp/timeout-deconstruct-test.sqlite` and `/tmp/timeout-deconstruct-test.snapshot.json`.
- **Stdout Assertion**: Emits:
  ```
  Generated snowflakeCost/idle-warehouse-waste seed 9101 -> /tmp/timeout-deconstruct-test.sqlite
  Snapshot -> /tmp/timeout-deconstruct-test.snapshot.json
  ```

### Step 2: Diagnostic Telemetry & Clean Stream Separation (`AC-2`, `AC-3`)
Execute CLI generation with diagnostic reporting active, separating standard output and standard error:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/timeout-deconstruct-test.sqlite \
  --snapshot-output /tmp/timeout-deconstruct-test.snapshot.json \
  --force \
  --diagnostics > /tmp/stdout.log 2> /tmp/stderr.log
```
- **Expected Exit Code**: `0`
- **Stdout Check**: Inspect `/tmp/stdout.log` to confirm it contains ONLY:
  ```
  Generated snowflakeCost/idle-warehouse-waste seed 9101 -> /tmp/timeout-deconstruct-test.sqlite
  Snapshot -> /tmp/timeout-deconstruct-test.snapshot.json
  ```
  Confirm `/tmp/stdout.log` contains zero `[DIAGNOSTIC]` entries or timing numbers.
- **Stderr Check**: Inspect `/tmp/stderr.log` to confirm it contains phase timing entries:
  - `[DIAGNOSTIC] Phase 'scenario_resolution'`
  - `[DIAGNOSTIC] Phase 'data_generation'`
  - `[DIAGNOSTIC] Phase 'pragma_inspection'`
  - `[DIAGNOSTIC] Phase 'snapshot_serialization'`
  - `[DIAGNOSTIC] Total pipeline duration`

### Step 3: Fail-Closed Robustness & Overwrite Guard Verification (`AC-5`)
Attempt generation against an existing target without `--force`:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --output /tmp/timeout-deconstruct-test.sqlite
```
- **Expected Exit Code**: `2`
- **Stdout Assertion**: Empty stdout.
- **Stderr Assertion**: Emits clean error:
  `usage: dashForge generate ... error: Output path already exists. Pass --force to overwrite: /tmp/timeout-deconstruct-test.sqlite`
- **Traceback Check**: Confirms zero unhandled Python exceptions or stack traces.

Attempt generation with an unknown scenario name:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario unknown-cost-scenario \
  --output /tmp/unknown-scenario.sqlite
```
- **Expected Exit Code**: `2`
- **Stderr Assertion**: Emits clean error indicating unknown scenario without traceback.

### Step 4: Bit-for-Bit Determinism Verification (`AC-4`)
Generate second set of assets with identical seed `9101` and compare SHA-256 digests:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/timeout-deconstruct-test-2.sqlite \
  --snapshot-output /tmp/timeout-deconstruct-test-2.snapshot.json \
  --force

sha256sum /tmp/timeout-deconstruct-test.sqlite /tmp/timeout-deconstruct-test-2.sqlite
sha256sum /tmp/timeout-deconstruct-test.snapshot.json /tmp/timeout-deconstruct-test-2.snapshot.json
```
- **Assertion**: Hashes match identically, confirming bit-for-bit generation determinism across stages.

### Step 5: Runtime Catalog & Presentation Seams Verification (`AC-6`)
Run targeted pytest checks verifying scenario and template catalog registrations:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q \
  -k "test_scenario_catalog_registers_idle_warehouse_waste or test_template_catalog_registers_idle_warehouse_waste or test_all_seven_scenario_datasets_present_in_sqlite"
```
- **Expected Exit Code**: `0`
- **Assertion**: All targeted presentation seam tests pass without failure.

### Step 6: Zero Dependencies & Read-Only Sibling Audit (`AC-7`)
Verify dependency hygiene and dataForge isolation:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q \
  -k "test_zero_external_runtime_dependencies or test_dataforge_unmodified"
```
- **Expected Exit Code**: `0`
- **Assertion**: Confirms zero third-party dependencies and pristine read-only state of `dataForge/`.

### Step 7: Full Automated Regression Suite Execution (`AC-7`)
Execute the complete test suite across all test files with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
- **Expected Exit Code**: `0`
- **Assertion**: All tests (109+ tests) pass cleanly with zero errors or failures.

---

## Risks

The implementation of the `repair-timeout-cascade` slice involves operational, performance, and compatibility considerations. The following risk analysis identifies potential hazards and outlines concrete mitigation strategies to ensure seamless, failure-free delivery:

| Risk Description | Severity | Likelihood | Impact | Concrete Mitigation Strategy |
|:---|:---:|:---:|:---|:---|
| **Stdout Stream Pollution from Telemetry**: Adding diagnostic timing logs could inadvertently contaminate `stdout`, breaking downstream shell pipes or automated JSON parsers that consume CLI output. | High | Low | Downstream automation scripts and pipelines fail to parse generation results. | **Strict Stderr Routing**: All timing telemetry, diagnostic banners, and elapsed metrics are explicitly routed to `sys.stderr` via dedicated stream handlers. Automated tests (`test_diagnostic_stream_separation_stderr_stdout`) independently capture `stdout` and assert zero diagnostic strings exist in `stdout`. |
| **Performance Overhead of Timing Instrumentation**: High-frequency timing calls or complex profiling utilities could introduce runtime latency, defeating the purpose of timeout prevention. | Medium | Low | Generation steps slow down, consuming additional execution time. | **Lightweight Standard Library Timers**: Timing instrumentation uses `time.perf_counter()` and `time.perf_counter_ns()`, which execute in under 50 nanoseconds per invocation with zero heap allocation. No third-party profilers or heavyweight tracing libraries are permitted. |
| **CLI Argument & Backward Compatibility Regression**: Adding diagnostic options might alter required positional arguments or break existing CLI invocations. | High | Low | Existing scripts invoking `dashForge.main generate` break due to unexpected argument parsing requirements. | **Non-Breaking Optional Flags**: The `--diagnostics` flag is defined as a purely optional boolean flag (`action="store_true"`). Default behavior when omitted is 100% identical to the existing CLI. An alternative environment variable `DASHFORGE_DIAGNOSTICS=1` is supported to avoid requiring CLI argument changes in existing scripts. |
| **Transient I/O or Generation Latency Spikes**: Temporary filesystem or CPU contention on the host system could cause even optimized steps to experience transient delays. | Medium | Medium | Steps occasionally run slower during peak resource utilization. | **Generous Stage Margins**: Deconstructed stages are scoped to complete in <30 seconds normally (target <120 seconds), leaving a >480-second safety margin below the 600-second orchestrator abort threshold. Intermediate artifact sealing ensures retries never re-execute completed stages. |
| **Accidental Modification of Sibling Project**: Editing files within sibling directory `dataForge/` violates repository boundary governance rules and fails governed steps. | Fatal | Low | Immediate step failure and invalidation of delivery governance. | **Strict Read-Only Enforcement**: All diagnostic instrumentation, packaging adapters, and timing utilities are implemented strictly inside `src/dashForge/`. Automated tests (`test_dataforge_unmodified`) inspect git status on `dataForge/` to ensure zero modifications occur. |
| **Unhandled Tracebacks on Invalid Arguments or Errors**: Adding error-handling wrappers could inadvertently mask root exceptions or leak raw Python tracebacks. | Medium | Low | Unhandled exceptions displayed during executive client demonstrations or CLI error states. | **Fail-Closed Delegation to `parser.error()`**: All caught exceptions (`ValueError`, `FileExistsError`, `KeyError`) are formatted into clean human-readable diagnostic messages and passed to `parser.error()`, ensuring consistent exit status 2 and clean error formatting without tracebacks. |

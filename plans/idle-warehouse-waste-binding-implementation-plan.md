# Idle Warehouse Waste Binding Implementation Plan

## Overview & Slice Intent

The `idle-warehouse-waste-binding` vertical slice implements the core foundation for the Snowflake Cost Management accelerator within DashForge by binding the `idle-warehouse-waste` dataForge snapshot to a canonical DashForge `DashboardSpec`. DashForge serves as an internal consulting delivery accelerator for Anblicks, designed to empower consultants and delivery leads to conduct high-impact, interactive enterprise discovery workshops with executive buyers (CFOs, CIOs, VPs of Data, and FinOps practice leaders) without requiring live cloud credentials or network connectivity.

Operating under DashForge's decoupled architectural model, sibling repository `dataForge` owns deterministic mock data generation, statistical distributions, and synthetic data quality assurance, while DashForge owns scenario packages, canonical `DashboardSpec` schemas, `DataAdapter` runtime interfaces, and standalone dashboard presentation deliverables.

This slice proves that complex, relational cloud infrastructure cost telemetry—specifically unmonitored and idle Snowflake compute warehouses consuming financial credits without active query workloads—can be ingested from dataForge as a read-only, provenance-labeled snapshot, mapped cleanly to standard `DashboardSpec` schemas and `DataAdapter` runtime seams, and presented to executive decision-makers with prioritized, owner-validated recommendations and prominent synthetic demo disclosures.

Crucially, this implementation plan establishes deterministic micro-steps to resolve previous worker timeouts and strictly avoids modifying underlying generative contracts or the read-only sibling repository `dataForge/`. Every acceptance check in the governing contract (`AC-1` through `AC-8`) maps directly to a concrete plan item, verifiable through reproducible test suites and targeted validation commands.

---

## Architecture

The architecture of the `idle-warehouse-waste-binding` slice establishes an offline, zero-dependency data flow from deterministic snapshot packaging through runtime query execution and standalone presentation rendering. The architecture preserves DashForge's foundational principle: **components never know where data comes from**; all charts, metric cards, tables, and narrative summaries consume data exclusively through the `DataAdapter` abstraction layer.

### System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Sibling Project: dataForge (Read-Only)                   │
│  dataForge/src/dataForge/packages/snowflake_cost/                           │
│    ├── Scenarios: idle-warehouse-waste, bi-over-provisioning, etc.          │
│    ├── 7 Relational Datasets: executive_summary, warehouse_metering_history,│
│    │   query_history, metering_history, database_storage_usage_history,     │
│    │   show_warehouses, recommendation_queue                                │
│    └── Story Contract: stories/snowflake/idle-warehouse-waste.md            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Read-only dynamic loader / snapshot)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DashForge CLI & Packaging Layer                      │
│  src/dashForge/main.py: CLI Entrypoint (env PYTHONPATH=src python3 -m ...)   │
│    ├── Command: generate --pack snowflakeCost --scenario idle-warehouse-waste│
│    ├── Overwrite Guard: Pre-execution fail-closed path check (status 2)     │
│    └── Error Handling: parser.error() routes clean diagnostics without trace│
│  src/dashForge/snowflake_cost.py: Dynamic discovery & provenance enrichment  │
│  src/dashForge/package_snapshot.py: PRAGMA inspection & canonical JSON      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Canonical Snapshot Deliverables                      │
│  1. Normalized SQLite Database (.sqlite): Bounded 7-table database          │
│  2. Canonical JSON Snapshot (.snapshot.json): SQLiteSnapshot contract       │
│       ├── packId: "snowflakeCost"                                           │
│       ├── scenarioId: "idle-warehouse-waste"                                │
│       ├── seed: 9101                                                        │
│       ├── dataForgeStoryContractPath: stories/snowflake/idle-warehouse-...  │
│       ├── generatorVersion: 1, generationTimestamp: ISO-8601 UTC            │
│       ├── synthetic: true, disclosure: "Synthetic demo data"                │
│       └── datasets: 7 typed datasets (columns with semantic roles, rows)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DashForge Runtime Catalogs & Core Models                   │
│  frontend/src/mock-data/                                                    │
│    ├── snowflakeCostIdleWarehouseWaste.ts & ...PreviewData.json             │
│    ├── scenarioCatalog.ts: snowflakeCost:idle-warehouse-waste               │
│    └── templateCatalog.ts: tpl.snowflakeCost.idle-warehouse-waste           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DashboardSpec & DataAdapter Runtime Seams                  │
│  frontend/src/core/spec/dashboardSchema.ts: Spec validation & Claim Ledger  │
│  frontend/src/core/data/createDashboardDataAdapter.ts                       │
│    ├── SyntheticDataArtifactAdapter / StaticDataAdapter / SQLiteDataAdapter │
│    ├── Resolves queries across all 7 scenario datasets                      │
│    └── Validates material claims against upstream artifact digest           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Standalone Executive Presentation Layer                  │
│  frontend/src/features/runtime/                                             │
│    ├── StandaloneDashboardApp.tsx: Executive buyer workshop presentation    │
│    ├── standaloneDashboard.ts: Canonical DashboardSpec & Claim Ledger setup │
│    ├── idleWarehousePresentation.ts: DataAdapter queries & metric mapping   │
│    ├── Executive KPIs: 726 credit savings, 2 idle warehouses, 74% conc.     │
│    ├── Prioritized Action Queue: P0/P1 severity, suggested owners, guards   │
│    ├── Same-Day Follow-Up: Exportable executive HTML/PDF summary            │
│    └── Prominent Synthetic Disclosures: Banner, cards, export footers       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Subsystem Responsibilities

1. **Deterministic Packaging & CLI Layer (`src/dashForge/`)**:
   - `src/dashForge/main.py`: Provides the canonical CLI interface `env PYTHONPATH=src python3 -m dashForge.main generate` accepting `--pack snowflakeCost`, `--scenario idle-warehouse-waste`, `--seed 9101`, `--output <path>`, and `--snapshot-output <path>`. Enforces fail-closed argument validation and filesystem overwrite guards before generation begins, exiting with status 2 on any violation without emitting raw Python tracebacks.
   - `src/dashForge/snowflake_cost.py`: Dynamically discovers scenarios registered in sibling project `dataForge` without hardcoded lists in DashForge source code. Enriches exported snapshots with full provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, `generatorVersion`, `generationTimestamp`, `synthetic: true`, `disclosure: "Synthetic demo data"`), and verifies the schema of `recommendation_queue`.
   - `src/dashForge/package_snapshot.py`: Inspects SQLite database tables via `PRAGMA table_info`, infers column types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`), and serializes datasets into the canonical `SQLiteSnapshot` TypeScript contract.

2. **Core Schema & Claim Ledger Layer (`frontend/src/core/`)**:
   - `frontend/src/core/data/sqliteSnapshot.ts`: Canonical TypeScript type definition specifying snapshot structure (`packId`, `scenarioId`, `seed`, optional provenance fields, and typed `datasets`).
   - `frontend/src/core/spec/dashboardSchema.ts`: Governs structural validity of `DashboardSpec` objects including meta, intent, theme, dataContext, layout, widgets, and governance blocks.
   - `frontend/src/core/spec/dashboardSpec.ts`: Defines the `DashboardMaterialClaim` interface linking every displayed metric, chart insight, and recommendation to an upstream artifact digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`) and dataset observation evidence.

3. **Runtime Data Adapter Seams (`frontend/src/core/data/`)**:
   - `frontend/src/core/data/createDashboardDataAdapter.ts`: Resolves the appropriate `DataAdapter` instance (`SyntheticDataArtifactAdapter`, `StaticDataAdapter`, or `SQLiteDataAdapter`) based on `spec.dataContext.mode`.
   - Ensures that presentational components query and aggregate data across all seven scenario datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`) exclusively through the `DataAdapter` interface, eliminating secondary or bespoke renderers.

4. **Runtime Catalogs & Presets (`frontend/src/mock-data/`)**:
   - `frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts`: Exports `snowflakeCostIdleWarehouseWasteScenario` typed as `MockScenario` and provenance constants.
   - `frontend/src/mock-data/snowflakeCostIdleWarehouseWastePreviewData.json`: Pinned canonical snapshot holding all seven datasets and provenance fields.
   - `frontend/src/mock-data/scenarioCatalog.ts`: Formally registers `snowflakeCost:idle-warehouse-waste` with scenario narrative, dataset descriptors, and metadata.
   - `frontend/src/mock-data/templateCatalog.ts`: Formally registers template `tpl.snowflakeCost.idle-warehouse-waste` specifying grid layouts and widget bindings.

5. **Standalone Presentation & Recommendation Governance (`frontend/src/features/runtime/`)**:
   - `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Mounts the executive workshop view at `/?scenario=idle-warehouse-waste` with `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"`.
   - `frontend/src/features/runtime/idleWarehousePresentation.ts`: Coordinates data queries via `DataAdapter` and extracts headline opportunities (726 monthly compute credits, 2 idle warehouses), credit concentration (FINANCE_REPORTING_WH > 50%), and control gaps.
   - Prioritized Recommendation Queue: Directly populated from `recommendation_queue` preserving all six governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`), displaying `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) first and enforcing directional framing pending warehouse owner validation.
   - Follow-Up Export & Synthetic Disclosures: Interactive control with `data-action="same-day-executive-follow-up"` generates executive follow-up summaries, and unsuppressed `data-disclosure="synthetic-demo-data"` badges display exact text `Synthetic demo data` across all views.

---

## Deterministic Micro-Steps & Concrete Plan Items

To resolve previous worker timeouts and ensure repeatable, reliable execution across governed environments, the implementation is partitioned into bounded, deterministic micro-steps. Each micro-step has clear boundaries, focused file touches, and fast, targeted verification checks:

### Plan Item 1: Canonical Snapshot Ingestion & Provenance Metadata Conformance (`AC-1`)
- **Mapped Acceptance Check**: `AC-1`
- **Objective**: Ingest dataForge scenario exports as read-only snapshot assets conforming to the canonical `SQLiteSnapshot` TypeScript interface (`frontend/src/core/data/sqliteSnapshot.ts`) with comprehensive provenance metadata and all seven relational datasets.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 1.1*: Inspect canonical schema contract in `frontend/src/core/data/sqliteSnapshot.ts` ensuring `SQLiteSnapshotDataset`, `SQLiteColumnDef`, and provenance fields (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, `generatorVersion`, `generationTimestamp`, `synthetic`, `disclosure`) are strictly defined.
  - *Micro-Step 1.2*: Package and pin `frontend/src/mock-data/snowflakeCostIdleWarehouseWastePreviewData.json` containing the seven datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`) with exact provenance values (`packId: "snowflakeCost"`, `scenarioId: "idle-warehouse-waste"`, `seed: 9101`, `dataForgeStoryContractPath: "stories/snowflake/idle-warehouse-waste.md"`, `synthetic: true`, `disclosure: "Synthetic demo data"`).
  - *Micro-Step 1.3*: Configure `frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts` to export typed scenario definitions and provenance constants without modifying underlying generative contracts.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_snapshot_provenance_metadata or test_idle_warehouse_snapshot_canonical_sqlite_snapshot_contract"` (<1s runtime).

### Plan Item 2: Deterministic CLI Generation Pipeline & Fail-Closed Overwrite Protection (`AC-2`)
- **Mapped Acceptance Check**: `AC-2`
- **Objective**: Ensure the CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) accepts `--pack snowflakeCost` and `--scenario idle-warehouse-waste` with deterministic `--seed` options, producing normalized SQLite tables and JSON snapshots, and enforcing fail-closed error handling with exit code 2 and clean diagnostics without unhandled tracebacks.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 2.1*: Verify `src/dashForge/main.py` argument parsing handles `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force`.
  - *Micro-Step 2.2*: Validate that dynamic scenario discovery in `src/dashForge/snowflake_cost.py` discovers scenarios from `dataForge` without hardcoded lists in DashForge sources, and unknown scenarios fail closed with exit status 2 via `parser.error()`.
  - *Micro-Step 2.3*: Enforce filesystem overwrite guards: check if `--output` or `--snapshot-output` exists; if so and `--force` is false, abort immediately with status 2 and diagnostic message `Output path already exists. Pass --force to overwrite`.
  - *Micro-Step 2.4*: Wrap generation execution in clean exception handling catching `ValueError`, `KeyError`, and `FileExistsError`, translating them into clean `parser.error()` diagnostics with zero tracebacks.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_cli_generate_accepts_snowflake_cost_pack or test_cli_idle_warehouse_fail_closed or test_unknown_snowflake_cost_scenario_fails_cleanly"` (<1s runtime).

### Plan Item 3: DashboardSpec Contract Formalization & Claim Ledger Verification (`AC-3`)
- **Mapped Acceptance Check**: `AC-3`
- **Objective**: Bind the idle-warehouse-waste snapshot to the canonical `DashboardSpec` contract conforming to `frontend/src/core/spec/dashboardSchema.ts` without fragmenting or duplicating platform primitives, formalizing widget specs (KPI cards, bar charts, data tables), grid layouts, and dataset bindings, with all material metrics (726 compute credits, 2 idle warehouses) and narrative claims covered by the claim ledger anchored to work package digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 3.1*: Implement `createDefaultStandaloneDashboardSpec()` in `frontend/src/features/runtime/standaloneDashboard.ts` constructing a validated `DashboardSpec` object conforming to `dashboardSchema.ts`.
  - *Micro-Step 3.2*: Define widget layout specifications:
    - KPI Cards: Monthly Opportunity High (726 compute credits), Idle Warehouse Count (2 warehouses).
    - Bar Charts: Warehouse Credit Concentration (`FINANCE_REPORTING_WH` vs. other compute).
    - Data Tables: Warehouse Control Gaps (suspension timeouts, missing resource monitors), Prioritized Recommendation Queue.
  - *Micro-Step 3.3*: Anchor the claim ledger in `governance.claimLedger` linking every displayed metric, chart insight, and recommendation to work package digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390` with dataset observation citations.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_idle_warehouse_dashboardspec_meta_and_constants or test_idle_warehouse_claim_ledger_surfaces_coverage or test_idle_warehouse_verified_artifact_digest_integrity"` (<1s runtime).

### Plan Item 4: Universal DataAdapter Runtime Seam & Seven-Dataset Query Proof (`AC-4`)
- **Mapped Acceptance Check**: `AC-4`
- **Objective**: Prove the universal `DataAdapter` runtime seam by ensuring that dashboard widgets and presentational components query and aggregate scenario data via `DataAdapter` interfaces (`createDashboardDataAdapter`, `StaticDataAdapter`, `SyntheticDataArtifactAdapter`, or `SQLiteDataAdapter`) across all seven scenario datasets without secondary or bespoke rendering pipelines.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 4.1*: Implement `loadIdleWarehousePresentation(adapter: DataAdapter, spec: DashboardSpec)` in `frontend/src/features/runtime/idleWarehousePresentation.ts` querying all seven datasets via `adapter.query()` and `adapter.aggregate()`.
  - *Micro-Step 4.2*: Query `executive_summary` for headline metrics, `warehouse_metering_history` for compute credit consumption, `query_history` for workload activity, `metering_history` for account-level consumption, `database_storage_usage_history` for storage baselines, `show_warehouses` for configuration attributes, and `recommendation_queue` for prioritized actions.
  - *Micro-Step 4.3*: Verify that no component imports raw snapshot data or bypasses the `DataAdapter` abstraction layer.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_all_seven_scenario_datasets_present_in_sqlite or test_idle_warehouse_adapter_query_routing_in_presentation"` (<1s runtime).

### Plan Item 5: Scenario & Template Catalog Registrations (`AC-5`)
- **Mapped Acceptance Check**: `AC-5`
- **Objective**: Formally register `snowflakeCost:idle-warehouse-waste` in the scenario catalog (`frontend/src/mock-data/scenarioCatalog.ts`) and `tpl.snowflakeCost.idle-warehouse-waste` in the template catalog (`frontend/src/mock-data/templateCatalog.ts`) with pre-configured widget layouts and dataset bindings.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 5.1*: Register `snowflakeCost:idle-warehouse-waste` in `frontend/src/mock-data/scenarioCatalog.ts` with title `"Idle Warehouse Waste"`, description, story narrative, and dataset mappings.
  - *Micro-Step 5.2*: Register template `tpl.snowflakeCost.idle-warehouse-waste` in `frontend/src/mock-data/templateCatalog.ts` with pre-configured widget layouts, default filters, and intent `"risk_alert"`.
  - *Micro-Step 5.3*: Update default template mappings in `DEFAULT_TEMPLATE_BY_SCENARIO` ensuring seamless discovery and instantiation from builder and presentation surfaces.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_scenario_catalog_registers_idle_warehouse_waste or test_template_catalog_registers_idle_warehouse_waste"` (<1s runtime).

### Plan Item 6: Prioritized Recommendation Queue Presentation & Safety Guardrails (`AC-6`)
- **Mapped Acceptance Check**: `AC-6`
- **Objective**: Present prioritized recommendations derived directly from the `recommendation_queue` dataset, displaying executive severity (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and protective guardrails (`guardrail`), with `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) presented first and savings explicitly framed as directional until validated by designated warehouse owners.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 6.1*: Enforce schema validation in `src/dashForge/snowflake_cost.py` guaranteeing that `recommendation_queue` preserves all six governance columns: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`.
  - *Micro-Step 6.2*: In `frontend/src/features/runtime/idleWarehousePresentation.ts`, sort recommendations by priority severity, presenting `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) at the top of the queue.
  - *Micro-Step 6.3*: Render protective guardrails and directional validation statements across UI cards and tables, explicitly stating that actions are directional pending confirmation with designated owners, with zero automated destructive operations.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_recommendation_queue_governance_columns_snapshot or test_recommendation_queue_row_integrity or test_recommendation_queue_guardrail_directional_validation"` (<1s runtime).

### Plan Item 7: Standalone Executive Presentation, Follow-Up Export & Synthetic Disclosures (`AC-7`)
- **Mapped Acceptance Check**: `AC-7`
- **Objective**: Deliver a browser-visible standalone executive presentation at `/?scenario=idle-warehouse-waste` (served from `frontend/dist`), presenting a clear buyer-oriented narrative flow (headline credit savings opportunity, idle warehouse count, credit concentration, control gaps), featuring container attributes `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"`, an interactive control `data-action="open-recommendation-queue"` revealing `data-status="recommendation-queue"`, an exportable same-day executive follow-up artifact with `data-action="same-day-executive-follow-up"`, and prominent, unsuppressed `data-disclosure="synthetic-demo-data"` disclosures displaying exact text `Synthetic demo data` across all UI views and exports.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 7.1*: In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, mount the executive workshop presentation when URL query contains `scenario=idle-warehouse-waste`, tagging root container with `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"`.
  - *Micro-Step 7.2*: Structure the executive narrative flow: headline monthly opportunity (726 compute credits), idle warehouse count (2 warehouses), credit concentration (`FINANCE_REPORTING_WH` consuming >50% of compute credits), and control gaps (auto-suspend = 0 or >=3600s, missing resource monitors).
  - *Micro-Step 7.3*: Provide interactive control `data-action="open-recommendation-queue"` transitioning container state to `data-status="recommendation-queue"`.
  - *Micro-Step 7.4*: Provide same-day executive follow-up export button `data-action="same-day-executive-follow-up"` generating an exportable HTML/PDF summary capturing metrics, recommendations, and claim citations.
  - *Micro-Step 7.5*: Render prominent, unsuppressed `data-disclosure="synthetic-demo-data"` badges displaying exact text `Synthetic demo data` in the navigation header, widget cards, claim popovers, and exported summaries.
- **Verification Micro-Check**: `npm --prefix frontend test -- --run -t "renders controlled artifact evidence and citations through the shared runtime"` and `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_synthetic_disclosure_text` (<5s runtime).

### Plan Item 8: Backwards Compatibility, Sibling Project Isolation & Regression Immunity (`AC-8`)
- **Mapped Acceptance Check**: `AC-8`
- **Objective**: Maintain platform-wide backwards compatibility and regression immunity: sibling repository `dataForge/` remains strictly unmodified; existing industry packs (`healthcare`, `financial`, `saas`), templates, and builder surfaces remain fully functional; generative contracts remain intact; the complete backend test suite passes cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override; and browser-visible journeys pass cleanly via `npm --prefix frontend test -- --run`.
- **Deterministic Micro-Step Breakdown**:
  - *Micro-Step 8.1*: Confirm existing packs (`healthcare`, `financial`, `saas`) generate and package deterministically without changes to data models or contracts.
  - *Micro-Step 8.2*: Enforce read-only isolation of sibling repository `dataForge/`, verifying zero git modifications, additions, or deletions outside DashForge.
  - *Micro-Step 8.3*: Execute the complete backend test suite via `python3 -m pytest tests/ -q` with NO PYTHONPATH override, asserting all 109+ tests pass cleanly.
  - *Micro-Step 8.4*: Execute the complete frontend test suite via `npm --prefix frontend test -- --run`, verifying that existing builder, presenter, and chart compiler tests pass cleanly without regression.
- **Verification Micro-Check**: `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_existing_packs_unaffected or test_dataforge_unmodified"` followed by `python3 -m pytest tests/ -q` (<18s runtime).

---

## Acceptance Criteria Traceability Matrix

The following bidirectional traceability matrix maps each acceptance check defined in `docs/idle-warehouse-waste-binding-contract.md` to its concrete plan item, implementation touchpoints, test methods, and user journey references:

| Acceptance Check | Plan Item | Implementation Touchpoints | Test & Verification Touchpoints | User Journey References |
|:-----------------|:----------|:---------------------------|:--------------------------------|:------------------------|
| **AC-1**: Consume dataForge `snowflakeCost:idle-warehouse-waste` exports as read-only snapshot conforming strictly to `SQLiteSnapshot` contract (`sqliteSnapshot.ts`) with all 7 datasets and complete provenance metadata (`packId: "snowflakeCost"`, `scenarioId: "idle-warehouse-waste"`, `seed: 9101`, `dataForgeStoryContractPath`, generator version, ISO-8601 timestamp, `synthetic: true`, `"Synthetic demo data"`). | Plan Item 1: Canonical Snapshot Ingestion & Provenance Metadata Conformance (`AC-1`) | `frontend/src/core/data/sqliteSnapshot.ts`<br>`frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts`<br>`frontend/src/mock-data/snowflakeCostIdleWarehouseWastePreviewData.json`<br>`src/dashForge/package_snapshot.py`<br>`src/dashForge/snowflake_cost.py` | `tests/test_idle_warehouse_waste.py::test_snapshot_provenance_metadata`<br>`tests/test_idle_warehouse_waste.py::test_idle_warehouse_snapshot_canonical_sqlite_snapshot_contract`<br>`tests/test_idle_warehouse_waste.py::test_idle_warehouse_preview_snapshot_asset_conformance` | `journey-idle-warehouse-snapshot-generation`<br>`journey-idle-warehouse-dashboardspec-and-adapter-seams` |
| **AC-2**: CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) accepts `--pack snowflakeCost` and `--scenario idle-warehouse-waste` with deterministic `--seed`, producing normalized SQLite tables and JSON snapshots; missing required parameters, unknown scenarios, or existing output paths without `--force` fail closed with exit status 2 and clean diagnostics without unhandled tracebacks. | Plan Item 2: Deterministic CLI Generation Pipeline & Fail-Closed Overwrite Protection (`AC-2`) | `src/dashForge/main.py`<br>`src/dashForge/snowflake_cost.py`<br>`src/dashForge/package_snapshot.py` | `tests/test_idle_warehouse_waste.py::test_cli_generate_accepts_snowflake_cost_pack`<br>`tests/test_idle_warehouse_waste.py::test_cli_generate_supports_seed_override`<br>`tests/test_idle_warehouse_waste.py::test_cli_idle_warehouse_fail_closed_existing_sqlite_without_force`<br>`tests/test_idle_warehouse_waste.py::test_unknown_snowflake_cost_scenario_fails_cleanly`<br>`tests/test_idle_warehouse_waste.py::test_bit_for_bit_deterministic_generation` | `journey-idle-warehouse-snapshot-generation`<br>`journey-idle-warehouse-cli-fail-closed` |
| **AC-3**: Bind idle-warehouse-waste snapshot to canonical `DashboardSpec` conforming to `dashboardSchema.ts` without fragmenting primitives, formalizing widget specs (KPI cards, bar charts, data tables), layouts, and bindings, with all material metrics (726 compute credits, 2 idle warehouses) and narrative claims covered by claim ledger anchored to work package digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`. | Plan Item 3: DashboardSpec Contract Formalization & Claim Ledger Verification (`AC-3`) | `frontend/src/features/runtime/standaloneDashboard.ts`<br>`frontend/src/core/spec/dashboardSchema.ts`<br>`frontend/src/core/spec/dashboardSpec.ts` | `tests/test_idle_warehouse_waste.py::test_idle_warehouse_dashboardspec_meta_and_constants`<br>`tests/test_idle_warehouse_waste.py::test_idle_warehouse_claim_ledger_surfaces_coverage`<br>`tests/test_idle_warehouse_waste.py::test_idle_warehouse_verified_artifact_digest_integrity`<br>`tests/test_idle_warehouse_waste.py::test_idle_warehouse_executive_kpis_match_claims` | `journey-idle-warehouse-dashboardspec-and-adapter-seams` |
| **AC-4**: Prove universal `DataAdapter` runtime seam by ensuring dashboard widgets and presentational components query and aggregate scenario data via `DataAdapter` interfaces (`createDashboardDataAdapter`, `StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`) across all seven scenario datasets without secondary or bespoke rendering pipelines. | Plan Item 4: Universal DataAdapter Runtime Seam & Seven-Dataset Query Proof (`AC-4`) | `frontend/src/features/runtime/idleWarehousePresentation.ts`<br>`frontend/src/core/data/createDashboardDataAdapter.ts`<br>`frontend/src/core/data/SyntheticDataArtifactAdapter.ts` | `tests/test_idle_warehouse_waste.py::test_all_seven_scenario_datasets_present_in_sqlite`<br>`tests/test_idle_warehouse_waste.py::test_idle_warehouse_adapter_query_routing_in_presentation`<br>`tests/test_idle_warehouse_waste.py::test_warehouse_metering_credit_concentration`<br>`tests/test_idle_warehouse_waste.py::test_show_warehouses_control_gaps` | `journey-idle-warehouse-dashboardspec-and-adapter-seams` |
| **AC-5**: Scenario formally registered in scenario catalog (`scenarioCatalog.ts`) as `snowflakeCost:idle-warehouse-waste` with title, narrative, and dataset mappings; template catalog (`templateCatalog.ts`) registers `tpl.snowflakeCost.idle-warehouse-waste` associating `snowflakeCost` pack and scenario with pre-configured widget layouts and binding definitions. | Plan Item 5: Scenario & Template Catalog Registrations (`AC-5`) | `frontend/src/mock-data/scenarioCatalog.ts`<br>`frontend/src/mock-data/templateCatalog.ts`<br>`frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts` | `tests/test_idle_warehouse_waste.py::test_scenario_catalog_registers_idle_warehouse_waste`<br>`tests/test_idle_warehouse_waste.py::test_template_catalog_registers_idle_warehouse_waste`<br>`tests/test_idle_warehouse_waste.py::test_dynamic_scenario_discovery_matches_dataforge` | `journey-idle-warehouse-catalog-registration` |
| **AC-6**: Present prioritized recommendations derived directly from `recommendation_queue` dataset, displaying executive severity (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and protective guardrails (`guardrail`), with `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) presented first and savings explicitly framed as directional until validated by designated owners. | Plan Item 6: Prioritized Recommendation Queue Presentation & Safety Guardrails (`AC-6`) | `frontend/src/features/runtime/idleWarehousePresentation.ts`<br>`frontend/src/features/runtime/StandaloneDashboardApp.tsx`<br>`src/dashForge/snowflake_cost.py` | `tests/test_idle_warehouse_waste.py::test_recommendation_queue_governance_columns_sqlite`<br>`tests/test_idle_warehouse_waste.py::test_recommendation_queue_governance_columns_snapshot`<br>`tests/test_idle_warehouse_waste.py::test_recommendation_queue_row_integrity`<br>`tests/test_idle_warehouse_waste.py::test_recommendation_queue_guardrail_directional_validation`<br>`tests/test_idle_warehouse_waste.py::test_recommendation_queue_presentation_directional_framing` | `journey-idle-warehouse-prioritized-recommendations`<br>`journey-idle-warehouse-browser-presentation-and-disclosure` |
| **AC-7**: Standalone executive presentation browser-visible at `/?scenario=idle-warehouse-waste` (served from `frontend/dist`), presenting clear narrative flow (headline credit savings, idle warehouse count, credit concentration, control gaps), container attributes `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"`, interactive control `data-action="open-recommendation-queue"` revealing `data-status="recommendation-queue"`, exportable follow-up artifact `data-action="same-day-executive-follow-up"`, and prominent unsuppressed `data-disclosure="synthetic-demo-data"` with exact text `Synthetic demo data`. | Plan Item 7: Standalone Executive Presentation, Follow-Up Export & Synthetic Disclosures (`AC-7`) | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`<br>`frontend/src/features/runtime/standaloneDashboard.ts`<br>`frontend/src/features/export/exportDashboard.ts` | `npm --prefix frontend test -- --run -t "renders controlled artifact evidence and citations through the shared runtime"`<br>`tests/test_idle_warehouse_waste.py::test_standalone_dashboard_presentation_narrative_flow`<br>`tests/test_idle_warehouse_waste.py::test_synthetic_disclosure_text`<br>`tests/test_idle_warehouse_waste.py::test_synthetic_demo_data_unsuppressed_in_presentation`<br>`tests/test_idle_warehouse_waste.py::test_executive_follow_up_export_contract` | `journey-idle-warehouse-browser-presentation-and-disclosure`<br>`journey-idle-warehouse-regression-and-full-test-suite` |
| **AC-8**: Regression immunity and deterministic execution maintained across the platform: sibling repo `dataForge/` strictly unmodified; existing industry packs (`healthcare`, `financial`, `saas`), templates, and builder surfaces fully functional; generative contracts intact; complete backend test suite passes cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override; and browser-visible journeys pass cleanly via `npm --prefix frontend test -- --run`. | Plan Item 8: Backwards Compatibility, Sibling Project Isolation & Regression Immunity (`AC-8`) | `src/dashForge/generate.py`<br>`src/dashForge/main.py`<br>`tests/` | `tests/test_idle_warehouse_waste.py::test_existing_packs_unaffected`<br>`tests/test_idle_warehouse_waste.py::test_dataforge_unmodified`<br>`tests/test_idle_warehouse_waste.py::test_zero_external_runtime_dependencies`<br>`python3 -m pytest tests/ -q`<br>`npm --prefix frontend test -- --run` | `journey-idle-warehouse-regression-and-full-test-suite` |

---

## Tests

The testing strategy validates the slice through a combination of fast, deterministic micro-tests and full regression test runs. Tests execute in completely offline, hermetic environments without cloud network dependencies, ensuring reproducible execution and preventing worker timeouts.

### 1. Backend Automated Pytest Suite (`tests/test_idle_warehouse_waste.py`)

The Python test suite covers 35 targeted unit and integration test methods specifically validating the `idle-warehouse-waste` binding:

- **Canonical Snapshot & Provenance Conformance Tests (`AC-1`)**:
  - `test_snapshot_provenance_metadata(tmp_path)`: Verifies that snapshot exports contain all required provenance fields (`packId: "snowflakeCost"`, `scenarioId: "idle-warehouse-waste"`, `seed: 9101`, `dataForgeStoryContractPath: "stories/snowflake/idle-warehouse-waste.md"`, `generatorVersion: 1`, ISO-8601 `generationTimestamp`, `synthetic: True`, and disclosure text `"Synthetic demo data"`).
  - `test_idle_warehouse_snapshot_canonical_sqlite_snapshot_contract(tmp_path)`: Asserts that snapshot structure complies strictly with the TypeScript `SQLiteSnapshot` interface, including dataset metadata and column typing.
  - `test_idle_warehouse_preview_snapshot_asset_conformance()`: Verifies that `snowflakeCostIdleWarehouseWastePreviewData.json` contains all seven required datasets and matching provenance fields.
  - `test_idle_warehouse_mock_scenario_module_export()`: Verifies that `snowflakeCostIdleWarehouseWaste.ts` exports scenario metadata and typed datasets.

- **CLI Options, Determinism & Fail-Closed Validation Tests (`AC-2`)**:
  - `test_cli_generate_accepts_snowflake_cost_pack(tmp_path)`: Asserts that invoking CLI with `--pack snowflakeCost` and `--scenario idle-warehouse-waste` exits with code 0 and creates both output files.
  - `test_cli_generate_supports_seed_override(tmp_path)`: Asserts that passing an explicit `--seed` parameter generates reproducible output reflecting that seed.
  - `test_cli_idle_warehouse_fail_closed_existing_sqlite_without_force(tmp_path)`: Asserts that an existing `--output` path causes generation to abort with exit code 2 and an actionable diagnostic message.
  - `test_cli_idle_warehouse_fail_closed_existing_snapshot_without_force(tmp_path)`: Asserts that an existing `--snapshot-output` path causes generation to abort with exit code 2 unless `--force` is supplied.
  - `test_cli_idle_warehouse_force_overwrites(tmp_path)`: Confirms that passing `--force` overwrites existing files and exits with code 0.
  - `test_unknown_snowflake_cost_scenario_fails_cleanly(tmp_path, capsys)`: Asserts that requesting an unknown scenario exits with code 2 and produces zero unhandled Python tracebacks.
  - `test_bit_for_bit_deterministic_generation(tmp_path)`: Asserts that consecutive generations with identical seed produce bit-for-bit identical SHA-256 digests across both SQLite and JSON files.

- **DashboardSpec, Claim Ledger & Seam Validation Tests (`AC-3`, `AC-4`)**:
  - `test_idle_warehouse_dashboardspec_meta_and_constants()`: Verifies `DashboardSpec` metadata, title, and intent configuration.
  - `test_idle_warehouse_claim_ledger_surfaces_coverage()`: Asserts that all displayed metrics, chart insights, and recommendations are registered in the claim ledger.
  - `test_idle_warehouse_verified_artifact_digest_integrity()`: Validates that claim citations anchor to work package digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`.
  - `test_idle_warehouse_executive_kpis_match_claims(tmp_path)`: Validates that headline KPI values (726 credits, 2 idle warehouses) match values computed from SQLite.
  - `test_all_seven_scenario_datasets_present_in_sqlite(tmp_path)`: Asserts that all seven scenario tables exist in SQLite and contain rows.
  - `test_idle_warehouse_adapter_query_routing_in_presentation()`: Verifies that presentation loaders query data strictly through the `DataAdapter` abstraction layer.
  - `test_warehouse_metering_credit_concentration(tmp_path)`: Verifies that `FINANCE_REPORTING_WH` accounts for >50% of compute credit usage.
  - `test_show_warehouses_control_gaps(tmp_path)`: Asserts detection of idle warehouses with disabled auto-suspend (`auto_suspend = 0`) or excessive suspension timeouts (≥3600s).

- **Catalog Registration & Governance Tests (`AC-5`, `AC-6`)**:
  - `test_scenario_catalog_registers_idle_warehouse_waste()`: Verifies registration in `scenarioCatalog.ts`.
  - `test_template_catalog_registers_idle_warehouse_waste()`: Verifies registration in `templateCatalog.ts`.
  - `test_dynamic_scenario_discovery_matches_dataforge()`: Asserts that DashForge dynamically discovers scenarios from `dataForge` without hardcoded lists.
  - `test_recommendation_queue_governance_columns_sqlite(tmp_path)` & `test_recommendation_queue_governance_columns_snapshot(tmp_path)`: Assert that all six governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) exist and are populated.
  - `test_recommendation_queue_row_integrity(tmp_path)`: Verifies that recommendations have valid severities (`P0`, `P1`), suggested owners, and non-empty actions.
  - `test_recommendation_queue_guardrail_directional_validation(tmp_path)`: Asserts that guardrail text enforces directional validation by designated owners.
  - `test_recommendation_queue_presentation_directional_framing()`: Confirms presentation components frame recommendations directionally without destructive actions.

- **Presentation, Synthetic Disclosure & Regression Immunity Tests (`AC-7`, `AC-8`)**:
  - `test_standalone_dashboard_presentation_narrative_flow()`: Asserts executive narrative structure (headline savings, idle counts, credit concentration, control gaps).
  - `test_synthetic_disclosure_text(tmp_path)`: Asserts snapshot disclosure contains exact text `Synthetic demo data`.
  - `test_synthetic_demo_data_unsuppressed_in_presentation()`: Confirms disclosure badge is rendered prominently without suppression.
  - `test_executive_follow_up_export_contract()`: Verifies same-day follow-up export structure and claim citations.
  - `test_existing_packs_unaffected(tmp_path)`: Verifies backwards compatibility for `healthcare`, `financial`, and `saas` packs.
  - `test_dataforge_unmodified()`: Asserts that sibling repository `dataForge/` has zero git modifications.
  - `test_zero_external_runtime_dependencies()`: Verifies that DashForge relies solely on the Python standard library.
  - `test_no_hardcoded_scenarios_in_dashforge_source()`: Parses Python ASTs to ensure no hardcoded scenario lists exist.

### 2. Frontend Automated Vitest Suite (`frontend/src/`)

- **Component & Runtime Tests (`AC-3`, `AC-4`, `AC-6`, `AC-7`)**:
  - `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`: Validates rendering of the standalone presentation view, executive metric cards, recommendation queue opening via `data-action="open-recommendation-queue"`, follow-up export via `data-action="same-day-executive-follow-up"`, and unsuppressed `data-disclosure="synthetic-demo-data"` banner.
  - `frontend/src/mock-data/scenarioCatalog.test.ts`: Asserts catalog registration for `snowflakeCost:idle-warehouse-waste`.
  - `frontend/src/mock-data/templateCatalog.test.ts`: Asserts catalog registration for `tpl.snowflakeCost.idle-warehouse-waste`.
  - `frontend/src/core/spec/dashboardSchema.test.ts`: Asserts spec validation passes cleanly for the formalized DashboardSpec.

### Fast Micro-Test Execution Commands (<2s each)
To prevent worker execution timeouts, verification during implementation uses targeted test commands:
```bash
# Verify snapshot provenance and contract
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_snapshot_provenance_metadata or test_idle_warehouse_snapshot_canonical_sqlite_snapshot_contract"

# Verify CLI fail-closed behavior
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_cli_idle_warehouse_fail_closed or test_unknown_snowflake_cost_scenario_fails_cleanly"

# Verify recommendation queue governance
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_recommendation_queue_governance_columns_snapshot or test_recommendation_queue_guardrail_directional_validation"

# Verify frontend standalone runtime
npm --prefix frontend test -- --run -t "renders controlled artifact evidence and citations through the shared runtime"
```

### Full Regression Suite Execution Command
Executed from the workspace root with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
*Expected Result*: All 109 tests pass cleanly with zero failures and zero warnings.

---

## Verification

The verification procedure defines concrete, reproducible commands to validate the slice end-to-end against all acceptance checks, user journeys, and architectural constraints:

### 1. Verification of Snapshot Generation & Provenance Conformance (`AC-1`, `AC-2`)
Execute deterministic generation command:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/idle-warehouse-waste.sqlite \
  --snapshot-output /tmp/idle-warehouse-waste.snapshot.json \
  --force
```
*Expected Result*: Command exits with code 0. Both `/tmp/idle-warehouse-waste.sqlite` and `/tmp/idle-warehouse-waste.snapshot.json` are created.

Verify provenance metadata:
```bash
python3 -c "
import json
with open('/tmp/idle-warehouse-waste.snapshot.json') as f:
    data = json.load(f)
assert data['packId'] == 'snowflakeCost'
assert data['scenarioId'] == 'idle-warehouse-waste'
assert data['seed'] == 9101
assert data['synthetic'] is True
assert data['disclosure'] == 'Synthetic demo data'
assert 'dataForgeStoryContractPath' in data
assert 'generatorVersion' in data
assert 'generationTimestamp' in data
print('AC-1 Provenance metadata verified successfully.')
"
```
*Expected Result*: Command exits with code 0, outputs `AC-1 Provenance metadata verified successfully.`

### 2. Verification of Fail-Closed Overwrite & Input Validation (`AC-2`)
Execute without `--force` when files exist:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --output /tmp/idle-warehouse-waste.sqlite
```
*Expected Result*: Command exits with code 2. Diagnostic output contains: `Output path already exists. Pass --force to overwrite`. Zero unhandled Python tracebacks.

Execute with unknown scenario name:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario unknown-invalid-scenario \
  --output /tmp/invalid.sqlite
```
*Expected Result*: Command exits with code 2. Clean diagnostic output indicating unknown scenario. Zero unhandled Python tracebacks.

### 3. Verification of Bit-for-Bit Determinism (`AC-2`)
Execute two independent runs with identical seed:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/run1.sqlite --snapshot-output /tmp/run1.snapshot.json --force
env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/run2.sqlite --snapshot-output /tmp/run2.snapshot.json --force
sha256sum /tmp/run1.sqlite /tmp/run2.sqlite
sha256sum /tmp/run1.snapshot.json /tmp/run2.snapshot.json
```
*Expected Result*: Hashes match bit-for-bit between run 1 and run 2 across both SQLite databases and JSON snapshots.

### 4. Verification of DashboardSpec Contract & Claim Ledger Coverage (`AC-3`)
Execute targeted pytest assertion:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_idle_warehouse_dashboardspec_meta_and_constants or test_idle_warehouse_claim_ledger_surfaces_coverage or test_idle_warehouse_verified_artifact_digest_integrity or test_idle_warehouse_executive_kpis_match_claims"
```
*Expected Result*: 4 passed in <1s. Verifies that all metrics (726 compute credits, 2 idle warehouses) and recommendations are anchored to work package digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`.

### 5. Verification of Universal DataAdapter Seam (`AC-4`)
Execute targeted query routing tests:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_all_seven_scenario_datasets_present_in_sqlite or test_idle_warehouse_adapter_query_routing_in_presentation or test_warehouse_metering_credit_concentration or test_show_warehouses_control_gaps"
```
*Expected Result*: 4 passed in <1s. Verifies that presentation components query all seven datasets via `DataAdapter` interfaces without secondary renderers.

### 6. Verification of Catalog Registrations (`AC-5`)
Execute targeted catalog registration tests:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_scenario_catalog_registers_idle_warehouse_waste or test_template_catalog_registers_idle_warehouse_waste or test_dynamic_scenario_discovery_matches_dataforge"
```
*Expected Result*: 3 passed in <1s. Verifies `snowflakeCost:idle-warehouse-waste` and `tpl.snowflakeCost.idle-warehouse-waste` registrations.

### 7. Verification of Recommendation Queue Governance & Guardrails (`AC-6`)
Execute recommendation queue schema and row integrity verification:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_recommendation_queue_governance_columns_sqlite or test_recommendation_queue_governance_columns_snapshot or test_recommendation_queue_row_integrity or test_recommendation_queue_guardrail_directional_validation or test_recommendation_queue_presentation_directional_framing"
```
*Expected Result*: 5 passed in <1s. Verifies all six governance columns, P0 priority for `FINANCE_REPORTING_WH`, and directional framing requiring owner validation.

### 8. Verification of Standalone Presentation, Follow-Up Export & Synthetic Disclosures (`AC-7`)
Execute targeted frontend Vitest and disclosure checks:
```bash
npm --prefix frontend test -- --run -t "renders controlled artifact evidence and citations through the shared runtime"
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k "test_synthetic_disclosure_text or test_synthetic_demo_data_unsuppressed_in_presentation or test_executive_follow_up_export_contract"
```
*Expected Result*: Tests pass cleanly. Verifies root container attributes `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"`, interactive control `data-action="open-recommendation-queue"`, follow-up export `data-action="same-day-executive-follow-up"`, and unsuppressed `data-disclosure="synthetic-demo-data"` with text `Synthetic demo data`.

### 9. Verification of Backwards Compatibility, Sibling Project Isolation & Regression Immunity (`AC-8`)
Verify existing pack generation:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack healthcare \
  --scenario flu-season \
  --seed 3101 \
  --output /tmp/healthcare-flu.sqlite \
  --snapshot-output /tmp/healthcare-flu.snapshot.json \
  --force
```
*Expected Result*: Exits with code 0.

Verify sibling repository `dataForge/` remains strictly unmodified:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_dataforge_unmodified
git -C ../dataForge status --porcelain
```
*Expected Result*: Exits with code 0 and git output is completely empty.

Execute full backend test suite with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
*Expected Result*: 109 passed in ~15s with exit code 0.

---

## Risks

The following risk matrix identifies critical technical and operational failure modes across enterprise discovery workshops, runtime seams, governance guardrails, and repository boundaries, together with concrete preventative controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:-----------------|:--------:|:----------:|:-------------------------------------------------------|
| **Worker Execution Timeout During Step Validation**: Monolithic test runs or unbuffered generation steps exceed the orchestrator worker execution budget, causing step timeouts and retries. | High | Medium | Implement deterministic micro-steps with focused test commands (`python3 -m pytest <file> -q -k <name>`) executing in <1s. Reserve full suite execution for final regression gates with explicit timeout allowances. |
| **Generative Contract Drift or Mutation**: Slice modifications alter or bypass underlying generative contracts or schemas shared with sibling project `dataForge`. | Critical | Low | Strictly preserve generative contracts and schemas; sibling repository `dataForge/` is read-only. Programmatic AST and schema checks verify zero changes to underlying contracts. |
| **Accidental Overwrite of Prepared Workshop Scenarios**: An Anblicks consultant preparing for an executive meeting accidentally overwrites custom workshop data or customized SQLite tables. | High | Medium | Enforce fail-closed overwrite pre-checks on `--output` and `--snapshot-output` before any database connection is opened. The CLI immediately aborts with POSIX exit code 2 and guidance unless `--force` is explicitly provided (`AC-2`). |
| **Projector Traceback Embarrassment During Executive Pitch**: Parameter errors, missing arguments, or invalid scenarios trigger raw Python tracebacks on a boardroom projector in front of executive buyers. | Medium | Low | Wrap CLI argument parsing, scenario validation, and dispatch in global exception handlers (`src/dashForge/main.py`) translating all exceptions into clean, single-line `parser.error()` diagnostics with exit status 2 and zero tracebacks (`AC-2`). |
| **Unvalidated Destructive Action Execution**: Workshop attendees mistake directional recommendations for automated execution commands and attempt destructive warehouse modifications without owner sign-off. | High | Low | Enforce directional framing across all presentation components, cards, tables, and exported artifacts: recommendations are explicitly labelled as "directional pending validation with designated warehouse owners". No automated destructive execution hooks exist (`AC-6`). |
| **Suppressed or Missing Synthetic Data Disclosures**: A client or executive mistakes synthetic demo telemetry for live customer data, resulting in compliance confusion or security audit exposure. | High | Low | Mandate prominent, unsuppressed `data-disclosure="synthetic-demo-data"` badges displaying exact text `Synthetic demo data` on the presentation top bar, metric cards, claim popovers, and exported executive follow-up summaries (`AC-1`, `AC-7`). |
| **Runtime Seam Fragmentation & Direct Data Imports**: Presentational components bypass the canonical `DataAdapter` to import static fixtures or raw JSON directly, breaking Phase 6 production binding readiness. | High | Low | Require all widgets and presentation loaders (`loadIdleWarehousePresentation`) to query data strictly through the `DataAdapter` interface (`createDashboardDataAdapter`). Direct fixture imports in rendering components are strictly forbidden (`AC-4`). |
| **Non-Deterministic Metric Variations Between Rehearsals**: Unseeded random number generation causes headline credit savings figures (726 credits) or warehouse counts to drift between rehearsal and live presentation. | High | Low | Enforce explicit seed resolution (default `9101`) passed into deterministic generation routines, backed by bit-for-bit SHA-256 hash comparison assertions in CI (`AC-2`). |
| **Read-Only Sibling Repository Contamination**: Implementation scripts inadvertently write into sibling repository `dataForge/`, violating repository governance boundaries and failing orchestrator checks. | Critical | Low | Strictly enforce step write boundaries to declared paths (`plans/`). Automated test `test_dataforge_unmodified` asserts clean git status for `dataForge/` (`AC-8`). |
| **Pytest Environment PYTHONPATH Masking**: Running pytest with an explicit `PYTHONPATH` override masks test runner packages or misconfigures module resolution in bounded validation environments. | High | Medium | All test commands and journey specifications mandate `python3 -m pytest tests/ -q` with NO PYTHONPATH override, guaranteeing standard package resolution across all execution environments (`AC-8`). |
| **Downstream Recommendation Queue Schema Truncation**: Packaging utilities drop governance columns (`suggested_owner`, `guardrail`), breaking recommendation priority display and safety rendering. | High | Low | Programmatic schema assertions in `snowflake_cost.py` and automated test assertions in `test_idle_warehouse_waste.py` verify that all six governance columns exist and contain valid data in both SQLite and snapshot JSON outputs (`AC-6`). |

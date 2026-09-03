# Idle Warehouse Waste Implementation Plan

## Executive Summary & Slice Intent

The `idle-warehouse-waste` vertical slice delivers the end-to-end Snowflake Cost Management accelerator in DashForge. DashForge functions as an internal consulting delivery weapon for Anblicks analytics consultants engaging enterprise executive buyers (CFOs, CIOs, and FinOps practice leaders). In typical pre-sales discovery workshops, establishing cloud cost governance authority is impeded because live production Snowflake credentials cannot be shared due to enterprise infosec constraints, while generic slide decks or static mockups lack operational realism.

This vertical slice resolves that delivery barrier by demonstrating how unmonitored and idle Snowflake compute warehouses consuming financial credits without active workload are ingested from sibling project `dataForge` as a read-only, provenance-labeled snapshot, bound through canonical `DashboardSpec` contracts and `DataAdapter` runtime interfaces, and presented as a high-impact, standalone executive deliverable. The deliverable provides prioritized, owner-validated recommendations derived directly from the `recommendation_queue` dataset, displays verifiable claim citations, issues same-day executive follow-up exports, and maintains prominent synthetic demo data disclosures across all touchpoints.

In strict accordance with `architecture.md`, `product-definition.md`, `AGENTS.md`, and `docs/idle-warehouse-waste-contract.md`, DashForge owns the presentation runtime, scenario registration, widget layout specifications, data adapter interfaces, and claim ledger verification, while sibling project `dataForge` remains the authoritative, read-only generator of synthetic datasets and quality reports. Existing core features of DashForge—including industry packs (`healthcare`, `financial`, `saas`), builder mode, presenter mode, and the shared runtime—remain completely intact without regressions.

---

## Architecture

The architecture of the `idle-warehouse-waste` slice establishes an offline, zero-dependency data flow from deterministic packaging through runtime query execution and presentation rendering. The architecture preserves DashForge's core principle: **components never know where data comes from**; all charts, metric cards, tables, and narrative summaries consume data exclusively through the `DataAdapter` abstraction layer.

The architectural subsystems, runtime boundaries, and component interactions are depicted below:

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
                                       │ (Read-only dynamic loader)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DashForge CLI & Packaging Layer                      │
│  src/dashForge/main.py: CLI Entrypoint (env PYTHONPATH=src python3 -m ...)   │
│    ├── Command: generate --pack snowflakeCost --scenario idle-warehouse-waste│
│    ├── Overwrite Guard: Pre-execution fail-closed path check (status 2)     │
│    └── Error Handling: parser.error() routes clean messages without trace   │
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
│       ├── dataForgeStoryContractPath: stories/snowflake/...                 │
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
   - `src/dashForge/main.py`: Provides the canonical CLI interface `env PYTHONPATH=src python3 -m dashForge.main generate` accepting `--pack snowflakeCost`, `--scenario idle-warehouse-waste`, `--seed 9101`, `--output <path>`, and `--snapshot-output <path>`. Enforces fail-closed argument validation and filesystem overwrite guards before generation begins, exiting with status 2 on any violation.
   - `src/dashForge/snowflake_cost.py`: Dynamically discovers scenarios registered in sibling project `dataForge` without hardcoded lists in DashForge source code. Validates that requested scenarios exist, enriches exported snapshots with full provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, `generatorVersion`, `generationTimestamp`, `synthetic: true`, `disclosure: "Synthetic demo data"`), and verifies the schema of `recommendation_queue`.
   - `src/dashForge/package_snapshot.py`: Inspects SQLite database tables via `PRAGMA table_info`, infers column types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`), and serializes datasets into the canonical `SQLiteSnapshot` TypeScript contract.

2. **Core Schema & Claim Ledger Layer (`frontend/src/core/`)**:
   - `frontend/src/core/data/sqliteSnapshot.ts`: Canonical TypeScript type definition specifying snapshot structure (`packId`, `scenarioId`, `seed`, optional provenance fields, and typed `datasets`).
   - `frontend/src/core/spec/dashboardSchema.ts`: Governs structural validity of `DashboardSpec` objects including meta, intent, theme, dataContext, layout, widgets, and governance blocks.
   - `frontend/src/core/spec/dashboardSpec.ts`: Defines the `DashboardMaterialClaim` interface linking every displayed metric, chart insight, and recommendation to an upstream artifact digest and dataset observation evidence.

3. **Runtime Data Adapter Seams (`frontend/src/core/data/`)**:
   - `frontend/src/core/data/createDashboardDataAdapter.ts`: Central factory resolving the active `DataAdapter` (`SyntheticDataArtifactAdapter`, `StaticDataAdapter`, or `SQLiteDataAdapter`) based on `dataContext.mode`.
   - `frontend/src/core/data/SyntheticDataArtifactAdapter.ts`: Consumes snapshot artifacts and quality reports, binds dataset queries (`query`, `aggregate`, `getSchema`), and enforces claim ledger validation via `requireMaterialClaim`.

4. **Scenario & Template Catalogs (`frontend/src/mock-data/`)**:
   - `frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts` & `snowflakeCostIdleWarehouseWastePreviewData.json`: Pinned, read-only snapshot assets capturing the seven dataForge datasets, rich provenance metadata, and typed scenario records.
   - `frontend/src/mock-data/scenarioCatalog.ts`: Registers `snowflakeCost:idle-warehouse-waste` mapping datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) to their respective schemas.
   - `frontend/src/mock-data/templateCatalog.ts`: Registers `tpl.snowflakeCost.idle-warehouse-waste` with pre-configured widget layouts, chart encodings, and dataset bindings.

5. **Standalone Presentation & Follow-Up Layer (`frontend/src/features/runtime/`)**:
   - `frontend/src/features/runtime/standaloneDashboard.ts`: Constructs the canonical `DashboardSpec` for idle warehouse waste, establishing grid layouts, KPI widgets, metering bar charts, warehouse control tables, recommendation action lists, and the complete claim ledger.
   - `frontend/src/features/runtime/idleWarehousePresentation.ts`: Coordinates asynchronous loading of scenario data through the `DataAdapter`, querying `executive_summary`, `recommendation_queue`, `show_warehouses`, and `warehouse_metering_history`, and validating surface claims.
   - `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Renders the full executive presentation experience, featuring headline opportunity metrics, idle warehouse count, credit concentration breakdowns, control gap tables, prioritized recommendations with owner validation guardrails, and same-day executive follow-up exports with unsuppressed synthetic disclosures.

---

## Concrete Plan Items & Work Breakdown

The delivery of the `idle-warehouse-waste` slice is organized into eight concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-8`:

### Plan Item 1: Canonical Snapshot Ingestion & Provenance Metadata Conformance (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The vertical slice consumes dataForge `snowflakeCost:idle-warehouse-waste` exports as a read-only, provenance-labeled snapshot conforming strictly to the canonical `SQLiteSnapshot` TypeScript contract (`frontend/src/core/data/sqliteSnapshot.ts`), carrying complete provenance metadata: `packId` (`snowflakeCost`), `scenarioId` (`idle-warehouse-waste`), `seed` (`9101`), `dataForgeStoryContractPath`, generator version, ISO-8601 generation timestamp, `synthetic: true`, and disclosure text `"Synthetic demo data"`.")
- **Objective**: Ingest dataForge scenario exports as read-only snapshot assets conforming to the canonical `SQLiteSnapshot` TypeScript interface with comprehensive provenance metadata.
- **Implementation Touchpoints**:
  - In `frontend/src/mock-data/snowflakeCostIdleWarehouseWastePreviewData.json`: Capture the seven scenario datasets exported from dataForge (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) with top-level provenance fields: `packId: "snowflakeCost"`, `scenarioId: "idle-warehouse-waste"`, `seed: 9101`, `dataForgeStoryContractPath: "stories/snowflake/idle-warehouse-waste.md"`, `generatorVersion: 1`, `generationTimestamp: "2026-08-09T00:00:00.000Z"`, `synthetic: true`, and `disclosure: "Synthetic demo data"`.
  - In `frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts`: Expose `snowflakeCostIdleWarehouseWasteScenario` typed as `MockScenario` and export `IDLE_WAREHOUSE_WASTE_PROVENANCE` preserving read-only access.
  - In `src/dashForge/package_snapshot.py` & `src/dashForge/snowflake_cost.py`: Ensure CLI snapshot export produces identical provenance fields matching this contract.
- **Deliverables**: Verified `snowflakeCostIdleWarehouseWaste.ts` and `snowflakeCostIdleWarehouseWastePreviewData.json` matching the canonical `SQLiteSnapshot` schema.

### Plan Item 2: Deterministic CLI Generation Pipeline & Fail-Closed Overwrite Protection (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The CLI entrypoint (invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`) accepts `--pack snowflakeCost` and `--scenario idle-warehouse-waste`, producing deterministic normalized SQLite tables and JSON snapshots for a given seed; missing required parameters, invalid scenarios, or existing output paths without `--force` fail closed with exit status 2 and clean diagnostic messages without unhandled Python tracebacks.")
- **Objective**: Ensure the CLI generates bit-for-bit deterministic SQLite databases and JSON snapshots, and enforces fail-closed validation with exit code 2 and zero tracebacks.
- **Implementation Touchpoints**:
  - In `src/dashForge/main.py`: Validate `--pack` choices include `snowflakeCost`. On execution, dynamically validate that `--scenario` exists in discovered scenarios from `snowflake_cost.py`.
  - Enforce overwrite protection: pre-check `--output` and `--snapshot-output` paths; if either exists and `--force` is false, abort via `parser.error()` exiting with status 2.
  - Wrap dispatch in error handling catching `ValueError`, `KeyError`, and `FileExistsError`, routing messages to `parser.error()` to eliminate unhandled Python tracebacks.
  - In `src/dashForge/snowflake_cost.py`: Guarantee deterministic generation using seed 9101, creating normalized relational tables for all 7 datasets.
- **Deliverables**: Hardened CLI entrypoint supporting deterministic generation and fail-closed validation with exit code 2.

### Plan Item 3: DashboardSpec Contract Formalization & Claim Ledger Verification (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("The `idle-warehouse-waste` vertical slice proves the `DashboardSpec` contract by formalizing the scenario blueprint, widgets (KPI cards, bar charts, data tables), layouts, and data bindings into a valid specification conforming to `dashboardSchema.ts`, with all material metrics and narrative statements covered by a verifiable claim ledger.")
- **Objective**: Formalize the idle warehouse waste scenario into a canonical `DashboardSpec` complying with `dashboardSchema.ts`, where every displayed metric, narrative statement, and recommendation maps to an upstream claim ledger.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/standaloneDashboard.ts`: Implement `createDefaultStandaloneDashboardSpec()` returning a valid `DashboardSpec`.
  - Configure widgets:
    - KPI cards: Monthly Opportunity High (726 credits), Idle Warehouse Count (2 warehouses).
    - Bar charts: Warehouse Credit Concentration (`FINANCE_REPORTING_WH` vs. other compute).
    - Data tables: Warehouse Control Gaps (suspension timeouts, missing owners/monitors), Prioritized Recommendation Queue.
  - Construct `DashboardClaimLedger` in `governance.claimLedger`: Map all surface IDs (`metric:monthly-opportunity-high`, `metric:idle-warehouse-count`, `metric:cost-concentration`, `metric:warehouse-controls`, `recommendation:IWW-001`, `recommendation:IWW-002`, and narrative arc sections) to `IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST` with explicit dataset observation evidence.
- **Deliverables**: Canonical `createDefaultStandaloneDashboardSpec()` with complete claim ledger and schema validation.

### Plan Item 4: DataAdapter Runtime Seam & Seven-Dataset Query Routing (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The slice proves the `DataAdapter` runtime seam by ensuring that dashboard widgets and presentational components query and aggregate scenario data via `DataAdapter` interfaces (`createDashboardDataAdapter`, `StaticDataAdapter`, `SyntheticDataArtifactAdapter`, or `SQLiteDataAdapter`) across all seven scenario datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`).")
- **Objective**: Prove the `DataAdapter` runtime seam by ensuring all scenario widgets and presentation components access data via `DataAdapter` query methods across all 7 scenario datasets.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/idleWarehousePresentation.ts`: Implement `loadIdleWarehousePresentation(adapter: DataAdapter, spec: DashboardSpec)` executing asynchronous queries across scenario datasets:
    - `executive_summary`: queries `metricId`, `value`, `caption`.
    - `recommendation_queue`: queries `recommendation_id`, `executive_severity`, `scope_name`, `recommended_action`, `suggested_owner`, `guardrail`.
    - `show_warehouses`: queries `name`, `auto_suspend`, `technical_owner`, `resource_monitor`.
    - `warehouse_metering_history`: queries `warehouse_name`, `credits_used`.
  - Ensure compatibility with `query_history`, `metering_history`, and `database_storage_usage_history` through the adapter interface.
  - Verify that no component imports raw data directly or bypasses `DataAdapter`.
- **Deliverables**: Verified `loadIdleWarehousePresentation` and adapter bindings querying all seven datasets cleanly.

### Plan Item 5: Scenario & Template Catalog Registrations (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("The scenario is registered in the scenario catalog as `snowflakeCost:idle-warehouse-waste` with its title, story narrative, and dataset mappings; the template catalog registers `tpl.snowflakeCost.idle-warehouse-waste` associating the `snowflakeCost` pack and scenario with pre-configured widget layouts and binding definitions.")
- **Objective**: Register the idle warehouse waste scenario and template in DashForge's runtime catalogs to enable discovery, instantiation, and builder support.
- **Implementation Touchpoints**:
  - In `frontend/src/mock-data/scenarioCatalog.ts`: Register `"snowflakeCost:idle-warehouse-waste"` in `scenarioCatalog` map, linking `snowflakeCostIdleWarehouseWasteScenario` with dataset definitions and primary trend dataset `"warehouse_metering_history"`.
  - In `frontend/src/mock-data/templateCatalog.ts`: Register entry `tpl.snowflakeCost.idle-warehouse-waste` with `packId: "snowflakeCost"`, `scenarioIds: ["idle-warehouse-waste"]`, `title: "Idle Warehouse Waste"`, `intent: "risk_alert"`, `audience: "client_demo"`.
  - Map default template in `DEFAULT_TEMPLATE_BY_SCENARIO` for `"snowflakeCost:idle-warehouse-waste"`.
- **Deliverables**: Verified registration entries in `scenarioCatalog.ts` and `templateCatalog.ts`.

### Plan Item 6: Prioritized Recommendation Queue Presentation & Safety Guardrails (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("The slice presents prioritized recommendations derived from the `recommendation_queue` dataset, displaying executive severity (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and protective guardrails (`guardrail`) ensuring actions remain directional until validated by the designated owner.")
- **Objective**: Present actionable recommendations from `recommendation_queue` with all governance columns and explicit directional validation policies.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/idleWarehousePresentation.ts` & `StandaloneDashboardApp.tsx`: Extract and render recommendation records preserving:
    - `recommendation_id`: unique identifier (e.g. `IWW-001`, `IWW-002`).
    - `executive_severity`: priority indicator (`P0`, `P1`).
    - `suggested_owner`: designated organizational role (e.g. `Finance Systems Lead`, `Analytics Engineering Lead`).
    - `recommended_action`: concrete optimization step (e.g. reduce auto-suspend timeout, configure resource monitor).
    - `evidence_detail`: factual telemetry rationale.
    - `guardrail`: operational safeguard (e.g. "Validate batch ETL schedules before lowering auto-suspend").
  - Enforce directional framing: clearly label recommendations as "directional until validated by designated owner", preventing any automated or destructive actions without human approval.
- **Deliverables**: Recommendation list and detail presentation enforcing governance columns and owner validation guardrails.

### Plan Item 7: Standalone Executive Presentation, Follow-Up Export & Synthetic Disclosure (`AC-7`)
- **Mapped Acceptance Check**: `AC-7` ("The standalone presentation experience presents a clear buyer-oriented narrative flow (headline credit savings opportunity, idle warehouse count, credit concentration, control gaps), provides an exportable same-day executive follow-up artifact reusing the export seam, and maintains prominent, unsuppressed `"Synthetic demo data"` disclosures across all UI surfaces and export deliverables.")
- **Objective**: Deliver a polished standalone executive dashboard presenting the buyer narrative flow, same-day exportable follow-up artifacts, and unsuppressed synthetic data disclosures.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Executive Narrative Flow: Render top-line metrics (726 credit savings opportunity, 2 idle warehouses), credit concentration breakdown (`FINANCE_REPORTING_WH`), control gap analysis, and prioritized recommendation queue.
    - Follow-Up Export: Implement `buildExecutiveFollowUpHtml` generating a standalone HTML/PDF executive summary capturing key metrics, recommended actions, owners, and claim citations.
    - Prominent Synthetic Disclosures: Render unsuppressed `"Synthetic demo data"` badges, quality indicators, and dataset origin labels across header banners, widget cards, claim popovers, and export deliverables.
- **Deliverables**: Standalone executive presentation view with follow-up export and prominent synthetic disclosures.

### Plan Item 8: Backwards Compatibility, Sibling Project Isolation & Regression Immunity (`AC-8`)
- **Mapped Acceptance Check**: `AC-8` ("Existing industry packs (`healthcare`, `financial`, `saas`), existing templates, builder mode, and runtime interfaces remain intact and fully functional without regression; sibling project `dataForge/` remains strictly read-only; and the entire test suite passes cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override.")
- **Objective**: Guarantee absolute regression immunity across existing packs and builder surfaces, maintain strict read-only boundary on `dataForge/`, and ensure 100% test pass rate.
- **Implementation Touchpoints**:
  - Maintain existing pack generators and templates (`healthcare`, `financial`, `saas`) without alterations to data shapes or contracts.
  - Sibling isolation: ensure no files within `dataForge/` are modified, added, or deleted.
  - Verify complete pytest suite execution via `python3 -m pytest tests/ -q` with NO PYTHONPATH override, confirming all 74 unit and integration tests pass cleanly.
  - Ensure all persistent writes remain strictly confined to declared write scopes for each governed step.
- **Deliverables**: Full test suite green run confirming zero regressions and absolute repository boundary preservation.

---

## Acceptance Criteria Traceability Matrix

The following bidirectional traceability matrix links each acceptance check defined in `docs/idle-warehouse-waste-contract.md` to its concrete plan item, implementation touchpoints, test methods, and user journey references:

| Acceptance Check | Plan Item | Implementation Touchpoints | Test & Verification Touchpoints | User Journey References |
|:-----------------|:----------|:---------------------------|:--------------------------------|:------------------------|
| **AC-1**: Vertical slice consumes dataForge `snowflakeCost:idle-warehouse-waste` exports as a read-only, provenance-labeled snapshot conforming strictly to canonical `SQLiteSnapshot` contract (`frontend/src/core/data/sqliteSnapshot.ts`), carrying complete provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, timestamp, `synthetic: true`, `"Synthetic demo data"`). | Plan Item 1: Canonical Snapshot Ingestion & Provenance Metadata Conformance (`AC-1`) | `frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts`<br>`frontend/src/mock-data/snowflakeCostIdleWarehouseWastePreviewData.json`<br>`src/dashForge/package_snapshot.py`<br>`src/dashForge/snowflake_cost.py` | `tests/test_snowflake_cost_pack.py::test_snapshot_provenance_metadata`<br>`tests/test_snowflake_cost_pack.py::test_synthetic_disclosure_text`<br>`tests/test_package_snapshot.py::test_snapshot_schema_conforms_to_sqlite_snapshot_contract` | `journey-idle-warehouse-snapshot-generation`<br>`journey-idle-warehouse-dashboardspec-and-adapter-seams`<br>`journey-idle-warehouse-prioritized-recommendations`<br>`journey-idle-warehouse-executive-presentation-and-disclosure` |
| **AC-2**: CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) accepts `--pack snowflakeCost` and `--scenario idle-warehouse-waste`, producing deterministic normalized SQLite tables and JSON snapshots for a given seed; missing required parameters, invalid scenarios, or existing output paths without `--force` fail closed with exit status 2 and clean diagnostic messages without unhandled Python tracebacks. | Plan Item 2: Deterministic CLI Generation Pipeline & Fail-Closed Overwrite Protection (`AC-2`) | `src/dashForge/main.py`<br>`src/dashForge/snowflake_cost.py`<br>`src/dashForge/package_snapshot.py` | `tests/test_snowflake_cost_pack.py::test_cli_generate_accepts_snowflake_cost_pack`<br>`tests/test_snowflake_cost_pack.py::test_unknown_snowflake_cost_scenario_fails_cleanly`<br>`tests/test_snowflake_cost_pack.py::test_fail_closed_when_output_exists`<br>`tests/test_snowflake_cost_pack.py::test_clean_diagnostic_no_traceback_on_error` | `journey-idle-warehouse-snapshot-generation`<br>`journey-idle-warehouse-cli-fail-closed`<br>`journey-idle-warehouse-catalog-registration` |
| **AC-3**: Vertical slice proves `DashboardSpec` contract by formalizing scenario blueprint, widgets (KPI cards, bar charts, data tables), layouts, and data bindings into a valid specification conforming to `dashboardSchema.ts`, with all material metrics and narrative statements covered by a verifiable claim ledger. | Plan Item 3: DashboardSpec Contract Formalization & Claim Ledger Verification (`AC-3`) | `frontend/src/features/runtime/standaloneDashboard.ts`<br>`frontend/src/core/spec/dashboardSchema.ts`<br>`frontend/src/core/spec/dashboardSpec.ts` | `frontend/src/core/spec/dashboardSchema.test.ts`<br>`frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`<br>`tests/test_snowflake_cost_pack.py::test_snapshot_schema_conformance` | `journey-idle-warehouse-dashboardspec-and-adapter-seams` |
| **AC-4**: Slice proves `DataAdapter` runtime seam by ensuring dashboard widgets and presentational components query and aggregate scenario data via `DataAdapter` interfaces (`createDashboardDataAdapter`, `StaticDataAdapter`, `SyntheticDataArtifactAdapter`, or `SQLiteDataAdapter`) across all seven scenario datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`). | Plan Item 4: DataAdapter Runtime Seam & Seven-Dataset Query Routing (`AC-4`) | `frontend/src/features/runtime/idleWarehousePresentation.ts`<br>`frontend/src/core/data/createDashboardDataAdapter.ts`<br>`frontend/src/core/data/SyntheticDataArtifactAdapter.ts` | `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`<br>`frontend/src/core/data/createDashboardDataAdapter.test.ts`<br>`tests/test_snowflake_cost_pack.py::test_dataset_exports_contain_expected_tables` | `journey-idle-warehouse-dashboardspec-and-adapter-seams` |
| **AC-5**: Scenario is registered in scenario catalog as `snowflakeCost:idle-warehouse-waste` with title, story narrative, and dataset mappings; template catalog registers `tpl.snowflakeCost.idle-warehouse-waste` associating `snowflakeCost` pack and scenario with pre-configured widget layouts and binding definitions. | Plan Item 5: Scenario & Template Catalog Registrations (`AC-5`) | `frontend/src/mock-data/scenarioCatalog.ts`<br>`frontend/src/mock-data/templateCatalog.ts`<br>`frontend/src/mock-data/snowflakeCostIdleWarehouseWaste.ts` | `frontend/src/mock-data/scenarioCatalog.test.ts`<br>`frontend/src/mock-data/templateCatalog.test.ts`<br>`tests/test_snowflake_cost_pack.py::test_dynamic_scenario_discovery_matches_dataforge` | `journey-idle-warehouse-catalog-registration` |
| **AC-6**: Slice presents prioritized recommendations derived from `recommendation_queue` dataset, displaying executive severity (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and protective guardrails (`guardrail`) ensuring actions remain directional until validated by designated owner. | Plan Item 6: Prioritized Recommendation Queue Presentation & Safety Guardrails (`AC-6`) | `frontend/src/features/runtime/idleWarehousePresentation.ts`<br>`frontend/src/features/runtime/StandaloneDashboardApp.tsx`<br>`src/dashForge/snowflake_cost.py` | `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`<br>`tests/test_snowflake_cost_pack.py::test_recommendation_queue_governance_columns`<br>`tests/test_snowflake_cost_pack.py::test_recommendation_queue_row_integrity` | `journey-idle-warehouse-prioritized-recommendations`<br>`journey-idle-warehouse-executive-presentation-and-disclosure` |
| **AC-7**: Standalone presentation experience presents clear buyer-oriented narrative flow (headline credit savings opportunity, idle warehouse count, credit concentration, control gaps), provides exportable same-day executive follow-up artifact reusing export seam, and maintains prominent, unsuppressed `"Synthetic demo data"` disclosures across all UI surfaces and export deliverables. | Plan Item 7: Standalone Executive Presentation, Follow-Up Export & Synthetic Disclosure (`AC-7`) | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`<br>`frontend/src/features/runtime/standaloneDashboard.ts`<br>`frontend/src/features/export/exportDashboard.ts` | `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`<br>`tests/test_snowflake_cost_pack.py::test_synthetic_disclosure_text` | `journey-idle-warehouse-executive-presentation-and-disclosure`<br>`journey-idle-warehouse-regression-and-full-test-suite` |
| **AC-8**: Existing industry packs (`healthcare`, `financial`, `saas`), existing templates, builder mode, and runtime interfaces remain intact without regression; sibling project `dataForge/` remains strictly read-only; entire test suite passes cleanly via `python3 -m pytest tests/ -q` with NO PYTHONPATH override. | Plan Item 8: Backwards Compatibility, Sibling Project Isolation & Regression Immunity (`AC-8`) | `src/dashForge/generate.py`<br>`src/dashForge/main.py`<br>`tests/` | `tests/test_snowflake_cost_pack.py::test_existing_packs_unaffected`<br>`tests/test_package_snapshot.py`<br>`tests/test_generate.py`<br>`tests/test_dataforge_compat.py` | `journey-idle-warehouse-regression-and-full-test-suite` |

---

## Tests

The verification strategy employs contract-driven automated testing across both backend Python packaging and frontend TypeScript/React application layers. Tests execute in fully sandboxed, deterministic environments without external network dependencies, ensuring absolute regression immunity and strict schema conformance.

### 1. Backend Automated Pytest Suite (`tests/`)

The Python test suite validates CLI argument parsing, dynamic scenario discovery, fail-closed error handling, bit-for-bit determinism, schema conformance, and backwards compatibility:

- **CLI Options & Invocation Tests (`AC-1`, `AC-2`)**:
  - `test_cli_generate_accepts_snowflake_cost_pack(tmp_path)`: Asserts that invoking `main(["generate", "--pack", "snowflakeCost", "--scenario", "idle-warehouse-waste", "--seed", "9101", ...])` exits with code 0 and creates both SQLite and JSON snapshot files.
  - `test_cli_generate_supports_seed_override(tmp_path)`: Verifies that passing an explicit `--seed 9999` persists `9999` into SQLite database metadata.
  - `test_cli_flags_passthrough(tmp_path)`: Verifies that `build_parser().parse_args(...)` correctly parses and maps all flags (`--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, `--force`).

- **Dynamic Scenario Discovery & Validation Tests (`AC-2`)**:
  - `test_dynamic_scenario_discovery_matches_dataforge()`: Asserts that `get_snowflake_cost_scenarios()` dynamically interrogates `dataForge` and returns all 6 scenarios (`idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, `finops-maturity-assessment`).
  - `test_no_hardcoded_scenarios_in_dashforge_source()`: Parses Python ASTs of all files under `src/dashForge/` to ensure no hardcoded lists or sets of Snowflake scenario IDs exist.
  - `test_unknown_snowflake_cost_scenario_fails_cleanly(capsys, tmp_path)`: Verifies that passing an invalid scenario name (e.g. `unknown-scenario`) exits with status 2, prints informative diagnostic text, and emits zero Python tracebacks.

- **Fail-Closed Input Validation & Overwrite Protection Tests (`AC-2`)**:
  - `test_missing_required_args_fails_with_exit_2(capsys)`: Verifies missing `--scenario` or `--output` arguments exit with code 2.
  - `test_fail_closed_when_output_sqlite_exists(tmp_path)`: Creates an existing file at `--output`; asserts execution aborts with exit code 2 and guidance to use `--force`.
  - `test_fail_closed_when_snapshot_output_exists(tmp_path)`: Creates an existing file at `--snapshot-output`; asserts execution aborts with exit code 2 unless `--force` is provided.
  - `test_force_flag_allows_overwriting(tmp_path)`: Confirms that passing `--force` successfully overwrites pre-existing files and exits with code 0.

- **Determinism & Canonical Snapshot Schema Tests (`AC-1`, `AC-2`)**:
  - `test_bit_for_bit_deterministic_generation(tmp_path)`: Executes generation twice with identical inputs (`--seed 9101`), computing SHA-256 hashes of SQLite databases and snapshot JSON files to assert bit-for-bit identity.
  - `test_snapshot_schema_conformance(tmp_path)`: Validates that snapshot JSON conforms strictly to `SQLiteSnapshot`, containing required top-level keys and exactly 7 typed datasets.
  - `test_column_definitions_and_roles(tmp_path)`: Confirms every column across all 7 datasets defines a valid type (`string`, `number`, `date`, `boolean`) and role (`dimension`, `measure`, `date`, `id`).

- **Provenance Metadata & Synthetic Disclosure Tests (`AC-1`, `AC-7`)**:
  - `test_snapshot_provenance_metadata(tmp_path)`: Verifies snapshot top-level attributes: `packId == "snowflakeCost"`, `scenarioId == "idle-warehouse-waste"`, `seed == 9101`, `dataForgeStoryContractPath == "stories/snowflake/idle-warehouse-waste.md"`, `generatorVersion == 1`, valid ISO-8601 `generationTimestamp`, `synthetic is True`.
  - `test_synthetic_disclosure_text(tmp_path)`: Asserts `disclosure == "Synthetic demo data"`.

- **Recommendation Queue Schema Preservation Tests (`AC-6`)**:
  - `test_recommendation_queue_governance_columns(tmp_path)`: Queries SQLite `PRAGMA table_info(recommendation_queue)` and snapshot dataset columns to confirm all 6 governance fields are present: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`.
  - `test_recommendation_queue_row_integrity(tmp_path)`: Asserts non-zero row count, valid `executive_severity` values (`P0`, `P1`), and non-empty string fields.

- **Backwards Compatibility & Sibling Boundary Tests (`AC-8`)**:
  - `test_existing_packs_unaffected(tmp_path)`: Verifies `healthcare` (`flu-season`), `financial` (`market-downturn`), and `saas` (`churn-crisis`) continue to generate bit-for-bit identical databases and snapshots.
  - `test_dataforge_unmodified()`: Confirms sibling directory `dataForge/` has zero git modifications.

### 2. Frontend Automated Vitest Suite (`frontend/src/`)

The frontend test suite verifies component rendering, DataAdapter querying, claim ledger validation, and export behavior:

- `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`:
  - Asserts that `StandaloneDashboardApp` renders the idle warehouse waste demo with `data-demo="idle-warehouse-waste"`.
  - Confirms top-line opportunity KPIs (726 credits, 2 idle warehouses) and credit concentration metrics render cleanly.
  - Asserts prioritized recommendations region renders `P0`/`P1` severity, suggested owner validation notes, and directional validation notices.
  - Asserts prominent, unsuppressed `"Synthetic demo data"` disclosures and quality badges are visible.
  - Verifies claim citations link each visual element to its upstream work-package digest.
- `frontend/src/mock-data/scenarioCatalog.test.ts`:
  - Confirms `"snowflakeCost:idle-warehouse-waste"` is registered with all 7 datasets.
- `frontend/src/mock-data/templateCatalog.test.ts`:
  - Confirms `"tpl.snowflakeCost.idle-warehouse-waste"` is registered with correct audience (`client_demo`) and intent (`risk_alert`).

### Test Suite Execution Command

The complete automated test suite is executed from workspace root with NO PYTHONPATH override:
```bash
python3 -m pytest tests/ -q
```
All 74+ tests must complete within 20 seconds and achieve a 100% pass rate.

---

## Verification

The verification procedure provides concrete, reproducible shell commands to validate the slice end-to-end against all acceptance checks, user journeys, and architectural constraints.

### Step-by-Step Verification Commands

1. **Verify Deterministic Generation and Output Creation (`AC-1`, `AC-2`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario idle-warehouse-waste \
     --seed 9101 \
     --output /tmp/idle-warehouse-waste.sqlite \
     --snapshot-output /tmp/idle-warehouse-waste.snapshot.json \
     --force
   ```
   - *Expected Result*: Exit code 0. Both `/tmp/idle-warehouse-waste.sqlite` and `/tmp/idle-warehouse-waste.snapshot.json` are created.

2. **Verify Fail-Closed Overwrite Guard (`AC-2`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario idle-warehouse-waste \
     --output /tmp/idle-warehouse-waste.sqlite
   ```
   - *Expected Result*: Exit code 2. Diagnostic output contains: `Output path already exists. Pass --force to overwrite`.

3. **Verify Fail-Closed Argument & Unknown Scenario Validation (`AC-2`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack snowflakeCost \
     --scenario non-existent-cost-scenario \
     --output /tmp/non-existent.sqlite
   ```
   - *Expected Result*: Exit code 2. Diagnostic output indicates unknown scenario. Zero Python tracebacks in output.

4. **Verify Bit-for-Bit Determinism via SHA-256 Hashing (`AC-2`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/run1.sqlite --snapshot-output /tmp/run1.snapshot.json --force
   env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/run2.sqlite --snapshot-output /tmp/run2.snapshot.json --force
   sha256sum /tmp/run1.sqlite /tmp/run2.sqlite
   sha256sum /tmp/run1.snapshot.json /tmp/run2.snapshot.json
   ```
   - *Expected Result*: Exit code 0. Hashes match identically between run 1 and run 2.

5. **Verify Provenance Metadata & Synthetic Disclosure Fields (`AC-1`, `AC-7`)**:
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
   print('Provenance verification PASSED')
   "
   ```
   - *Expected Result*: Exit code 0, outputs `Provenance verification PASSED`.

6. **Verify Recommendation Queue Governance Schema & Column Preservation (`AC-6`)**:
   ```bash
   python3 -c "
   import sqlite3, json
   conn = sqlite3.connect('/tmp/idle-warehouse-waste.sqlite')
   cursor = conn.execute('PRAGMA table_info(recommendation_queue)')
   cols = {row[1] for row in cursor.fetchall()}
   required = {'recommendation_id', 'executive_severity', 'suggested_owner', 'recommended_action', 'evidence_detail', 'guardrail'}
   assert required.issubset(cols), f'Missing columns in SQLite: {required - cols}'
   conn.close()

   with open('/tmp/idle-warehouse-waste.snapshot.json') as f:
       snap = json.load(f)
   rq = next(d for d in snap['datasets'] if d['datasetId'] == 'recommendation_queue')
   snap_cols = {c['name'] for c in rq['columns']}
   assert required.issubset(snap_cols), f'Missing columns in snapshot: {required - snap_cols}'
   print('Recommendation queue schema verification PASSED')
   "
   ```
   - *Expected Result*: Exit code 0, outputs `Recommendation queue schema verification PASSED`.

7. **Verify Scenario & Template Catalog Registrations (`AC-5`)**:
   ```bash
   python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_dynamic_scenario_discovery_matches_dataforge
   ```
   - *Expected Result*: Exit code 0. Scenarios discovered cleanly from dataForge.

8. **Verify Backwards Compatibility & Full Test Suite Execution (`AC-8`)**:
   ```bash
   env PYTHONPATH=src python3 -m dashForge.main generate \
     --pack healthcare \
     --scenario flu-season \
     --seed 3101 \
     --output /tmp/healthcare-flu.sqlite \
     --snapshot-output /tmp/healthcare-flu.snapshot.json \
     --force
   python3 -m pytest tests/ -q
   ```
   - *Expected Result*: Exit code 0. All existing pack generation works and all 74+ tests pass cleanly.

9. **Verify Sibling Project Isolation (`AC-8`)**:
   ```bash
   git -C ../dataForge status --porcelain
   ```
   - *Expected Result*: Exit code 0, output empty (sibling project remains strictly unmodified).

10. **Verify Governed Write Scope Boundary**:
    ```bash
    git status --porcelain
    ```
    - *Expected Result*: Only files inside `plans/` modified or added for this step.

---

## Risks

The following risk assessment outlines critical failure modes across workshop demonstrations, dynamic discovery, governance enforcement, and repository isolation, together with concrete technical and operational controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:-----------------|:--------:|:----------:|:-------------------------------------------------------|
| **Executive Workshop Overwrite Data Loss**: An operator preparing workshop scenarios accidentally overwrites previously prepared demonstration assets, destroying tailored notes or custom data. | High | Medium | Enforce strict fail-closed overwrite pre-checks on `--output` and `--snapshot-output` before any database connection is created or generation commences. The CLI aborts with POSIX exit status 2 and diagnostic guidance unless `--force` is explicitly provided (`AC-2`). |
| **Unhandled Traceback Projector Hazard**: CLI syntax errors, missing parameters, or typos cause Python exception tracebacks to flash across a conference room projector during an executive pitch. | Medium | Low | Wrap all CLI parameter parsing, scenario validation, and generation dispatch in global exception handlers (`main.py`) translating `ValueError`, `KeyError`, and `FileExistsError` into clean single-line `parser.error()` messages with exit code 2 and zero tracebacks (`AC-2`). |
| **Recommendation Guardrail Bypass & Unvalidated Execution**: Workshop attendees mistake directional recommendations for automated actions and attempt to execute warehouse changes without owner validation. | High | Low | Enforce directional framing across the entire presentation layer: every recommendation card, table row, and export summary prominently states that recommendations are directional until formally validated by designated owners. Automated or destructive execution hooks are strictly prohibited (`AC-6`). |
| **Missing or Suppressed Synthetic Data Disclosures**: A client or executive mistakes synthetic cost figures for live client account data, leading to compliance confusion or audit exposure. | High | Low | Mandate unsuppressed `"Synthetic demo data"` disclosures at multiple levels: embedded in snapshot JSON provenance headers, rendered on the presentation top bar, affixed to KPI cards, and watermarked on all executive follow-up exports (`AC-1`, `AC-7`). |
| **DataAdapter Seam Fragmentation**: Presentational components bypass the canonical `DataAdapter` to read from raw JSON files or inline mocks directly, breaking Phase 6 production binding readiness. | High | Low | Require all widget components and presentation loaders (`loadIdleWarehousePresentation`) to query data strictly through the `DataAdapter` abstraction layer (`SyntheticDataArtifactAdapter`, `StaticDataAdapter`, `SQLiteDataAdapter`). Direct fixture imports in component renderers are strictly prohibited (`AC-4`). |
| **Non-Deterministic Metric Drift**: Random number generator variations between rehearsal and workshop presentation cause headline credit savings figures to change unexpectedly. | High | Low | Explicit seed resolution (default seed 9101 or `--seed` CLI parameter) passed into deterministic generation algorithms, guaranteed by automated bit-for-bit SHA-256 hash comparison tests in CI (`AC-2`). |
| **Read-Only Sibling Repository Contamination**: Slice edits or build commands inadvertently write into `../dataForge`, violating repository governance boundaries. | High | Low | Strict enforcement of step write boundaries. Automated test `test_dataforge_unmodified` asserts git cleanliness of `dataForge/`. Dynamic loader operates strictly in read-only mode (`AC-8`). |
| **Pytest Environment PYTHONPATH Masking**: Running pytest with an explicit `PYTHONPATH` override masks test runner packages or misconfigures module resolution in bounded validation environments. | High | Medium | All test suite commands and journey step definitions mandate `python3 -m pytest tests/ -q` with NO PYTHONPATH override, guaranteeing standard package resolution across all execution environments (`AC-8`). |
| **Downstream Recommendation Schema Truncation**: Packaging utilities omit governance columns (`executive_severity`, `suggested_owner`, `guardrail`), breaking recommendation priority sorting and safety rendering. | High | Low | Programmatic schema assertions in `snowflake_cost.py` and automated test assertions in `test_snowflake_cost_pack.py` verify that all six governance columns exist and contain valid data in both SQLite and snapshot JSON outputs (`AC-6`). |

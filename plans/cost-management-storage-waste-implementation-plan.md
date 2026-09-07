# Cost Management Storage Waste Implementation Plan

## Executive Summary & Slice Intent

The `cost-management-storage-waste` vertical slice establishes the buyer-facing Storage Waste dashboard presentation layer for the Snowflake Cost Management accelerator (`snowflakeCost:storage-waste`) in DashForge. DashForge operates as an internal consulting delivery accelerator for Anblicks FinOps practitioners, cloud data architects, client delivery leads, and practice directors conducting high-stakes executive discovery workshops with prospective enterprise buyers—specifically Chief Financial Officers (CFOs), Chief Information Officers (CIOs), VPs of Enterprise Data, and FinOps practice leaders.

In enterprise cloud data platforms such as Snowflake, compute warehouse optimization frequently commands immediate attention due to volatile monthly query spend spikes. However, storage costs represent a silent, compounding, and routinely unscrutinized operational expenditure. Enterprise tenants regularly accumulate terabytes to petabytes of stale, unqueried tables, orphaned intermediate staging objects, abandoned test clones, and uncompressed storage tiers that silently inflate monthly invoices without delivering business value. During discovery workshops, prospective buyers cannot provide live production cloud credentials to consulting teams due to strict infosec policies, SOC 2, HIPAA, and GDPR regulatory boundaries. Generic slide decks, static mockups, or flat toy spreadsheets fail to convey the analytical depth and FinOps rigor required to earn executive confidence.

**Slice Intent:** Deliver a buyer-facing Storage Waste dashboard slice for the Cost Management accelerator. The slice must present prioritized recommendations for stale tables and uncompressed storage, consuming dataForge exports as a provenance-labeled snapshot. Existing dashForge behavior and other accelerator slices must remain unchanged. Every acceptance check in the contract must map to a concrete plan item; a traceability judge verifies this and fails the step naming any criterion it cannot map. Keep all writes within plans/.

Every acceptance check defined in `docs/cost-management-storage-waste-contract.md` (`AC-1` through `AC-6`) maps directly to a concrete plan item, verified through automated frontend Vitest suites, Python regression checks, production bundle contract marker audits, and direct argv execution from the workspace root.

---

## Routing & Execution Policy

Execution across the governed slice delivery lifecycle is partitioned among decoupled agent roles, strictly separating authoring, planning, testing, implementation, evaluation, and review:

1. **Producer / Contract Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Formulates the slice contract in `docs/cost-management-storage-waste-contract.md` and synchronizes user journey definitions in `journeys/user_journeys_manifest.json` within declared write boundaries.
   - Enforces schema version 1, valid authorities (`human`, `mission`, `author`), and complete `traces_to` mapping covering `AC-1` through `AC-6`.

2. **Planner Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Formulates the concrete implementation and verification plan in `plans/cost-management-storage-waste-implementation-plan.md`.
   - Establishes explicit bidirectional traceability between contract acceptance checks, storage waste telemetry schemas, `DashboardSpec` configurations, and verification suites.

3. **Test Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Authors targeted backend and frontend verification tests in `tests/` and `frontend/src/` validating storage waste relational schemas, recommendation queue attributes, and CLI integration prior to full implementation closure.

4. **Implementation Route (`antigravity_cli` / `gemini-3.8-flash-high`)**:
   - Delivers storage waste synthetic data models, snapshot packaging, `DashboardSpec` definitions, and standalone presentation components within declared module scopes.
   - Preserves existing industry packs and ensures sibling project `dataForge` remains strictly read-only.

5. **Evaluator / User Tester Route (`user_tester` / `gemini-3.1-pro`)**:
   - Re-executes allowlisted user journey commands from the workspace root against the synchronized manifest, validating claimed outputs, exit codes, and non-empty assertions without performing code modifications.

6. **Independent Reviewer Route (`slice_reviewer` / `gemini-3.1-pro`)**:
   - Conducts an independent, read-only audit of implementation diffs, build artifacts, test execution logs, and contract traceability to render an authoritative review verdict.

---

## Architecture

The architecture of the `cost-management-storage-waste` vertical slice establishes a self-contained, browser-executable operational foundation that ingests deterministic Snowflake storage waste telemetry and renders interactive storage distribution metrics, aging visualizers, and prioritized, owner-validated remediation deliverables. In strict adherence to DashForge's primary architectural tenet—**components never know where data comes from**—all presentation specifications, widgets, and action queues query data exclusively through the canonical `DataAdapter` runtime abstraction layer, preserving complete architectural decoupling without secondary renderers, ad-hoc charting engines, backend daemons, or live cloud dependencies.

### System Topology & Runtime Seams

The operational topology and data flow within DashForge are structured across decoupled generation, ingestion, adapter, and presentation boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Sibling Project Boundary: dataForge                      │
│  (Strictly read-only; provides deterministic storage waste exports)          │
│    ├── Stories: stories/snowflake/storage-waste.md                          │
│    └── Scenario Definition & Generation Profiles                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Deterministic snapshot export / bridge)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 DashForge Storage Waste Ingestion & Packaging               │
│  src/dashForge/storage_waste.py & src/dashForge/package_snapshot.py         │
│    ├── 6 Canonical Relational Datasets:                                     │
│    │   ├── storage_summary: Volume, total monthly spend, recoverable waste  │
│    │   ├── table_storage_metrics: Tables, schemas, rows, bytes, failsafe    │
│    │   ├── stale_tables: Tables unqueried/unmodified > threshold days       │
│    │   ├── uncompressed_storage: Tables/stages lacking optimal compression  │
│    │   ├── storage_usage_history: Daily storage consumption trends          │
│    │   └── recommendation_queue: 6 governance fields & directional guardrails│
│    ├── Provenance Enrichment: packId, scenarioId, seed, synthetic disclosure│
│    └── Canonical SQLite Snapshot JSON Bridge (frontend/src/mock-data/)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Canonical SQLiteSnapshot JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DashboardSpec & DataAdapter Runtime Seams                  │
│  frontend/src/core/data/createDashboardDataAdapter.ts                       │
│    ├── StaticDataAdapter: Deterministic in-memory querying & aggregation    │
│    ├── SyntheticDataArtifactAdapter: Claim ledger & digest verification     │
│    └── SQLiteDataAdapter: Direct SQL query seam                             │
│  frontend/src/core/spec/dashboardSchema.ts & dashboardSpec.ts               │
│    ├── DashboardSpec: Canonical layout, responsive grid, widget specs       │
│    └── Claim Ledger: Material audit claims anchored to verified provenance  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│           Standalone Storage Waste Presentation Tier & Follow-Up            │
│  frontend/src/features/runtime/StandaloneDashboardApp.tsx                   │
│    ├── URL Scenario Resolver: /?scenario=storage-waste                      │
│    ├── Persistent Synthetic Disclosure: data-disclosure="synthetic-demo-data"│
│    ├── KPI Scorecards: Total Spend, Recoverable Waste, Stale & Uncompressed │
│    ├── Storage Distribution Breakdown: Schema & table volume visualizers    │
│    ├── Table Access Aging Visualizers: Retention & dormant object analysis  │
│    ├── Prioritized Recommendation Queue: data-status="recommendation-queue" │
│    │   ├── 6 Governance Fields: id, severity, owner, action, evidence, guard│
│    │   └── Explicit Directional Guardrails: Table owner validation required │
│    └── Same-Day Deliverables:                                               │
│        ├── Follow-Up Generator: data-action="same-day-executive-follow-up"   │
│        └── Landscape PDF Print: data-testid="dashboard-save-pdf"            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ingestion Boundary & Sibling Project Isolation

Sibling project `dataForge` remains strictly read-only. No files within `dataForge/` may be added, modified, or deleted during contract definition, planning, implementation, or verification. DashForge establishes an ingestion bridge and snapshot packaging pipeline within `src/dashForge/` that consumes deterministic dataForge exports or provides faithful in-repo compatibility wrappers conforming strictly to the canonical `SQLiteSnapshot` TypeScript contract (`frontend/src/core/data/sqliteSnapshot.ts`).

### Canonical Relational Storage Waste Schema Contracts

The slice formalizes typed schema contracts across six canonical datasets mirroring Snowflake Account Usage storage telemetry (`SNOWFLAKE.ACCOUNT_USAGE.TABLE_STORAGE_METRICS`, `TABLES`, `STAGES`, `STORAGE_USAGE`):

1. **`storage_summary`**: Headline storage volume and financial waste posture metrics:
   - `summary_id` (string, id, primary key): Unique summary record identifier.
   - `total_storage_bytes` (number, measure): Total physical byte volume across all tables and stages.
   - `total_monthly_spend_usd` (number, measure): Monthly billable cloud storage cost in USD.
   - `recoverable_waste_bytes` (number, measure): Quantified recoverable storage volume across stale and uncompressed tiers.
   - `recoverable_waste_opportunity_usd` (number, measure): Estimated monthly cost reduction opportunity in USD.
   - `stale_table_count` (number, measure): Total count of tables without read/write activity exceeding threshold days.
   - `uncompressed_table_count` (number, measure): Total count of tables lacking optimal columnar compression.
   - `synthetic_seed` (number, dimension): Deterministic generation seed.
   - `evaluation_timestamp` (date, date): ISO-8601 evaluation snapshot timestamp.

2. **`table_storage_metrics`**: Granular table-level storage footprint and overhead metrics:
   - `table_id` (string, id, primary key): Unique table identifier (e.g., `FINANCE.RAW_INGESTION.TXN_STAGING_2024`).
   - `database_name` (string, dimension): Parent database name.
   - `schema_name` (string, dimension): Parent schema name.
   - `table_name` (string, dimension): Object table name.
   - `table_owner` (string, dimension): Designated role or administrative owner.
   - `row_count` (number, measure): Active row count.
   - `active_bytes` (number, measure): Billable active storage bytes.
   - `time_travel_bytes` (number, measure): Storage bytes consumed by time travel history.
   - `failsafe_bytes` (number, measure): Storage bytes consumed by fail-safe protection.
   - `retained_for_clone_bytes` (number, measure): Storage bytes retained across zero-copy clones.
   - `total_storage_bytes` (number, measure): Sum of active, time-travel, and fail-safe bytes.
   - `last_altered` (date, date): Timestamp of last metadata or DDL modification.

3. **`stale_tables`**: Categorized inventory of dormant, unqueried, or unrefreshed data objects:
   - `stale_id` (string, id, primary key): Unique stale object tracking identifier.
   - `table_id` (string, dimension): Foreign key referencing `table_storage_metrics.table_id`.
   - `table_name` (string, dimension): Table name.
   - `schema_name` (string, dimension): Schema name.
   - `days_since_last_read` (number, measure): Elapsed days since last executed SELECT or read scan.
   - `days_since_last_write` (number, measure): Elapsed days since last INSERT, UPDATE, DELETE, or MERGE.
   - `staleness_category` (string, dimension): Staleness tier (`DORMANT_DEV_CLONE`, `ORPHANED_ETL_STAGE`, `DEPRECATED_REPORTING_MART`).
   - `monthly_storage_cost_usd` (number, measure): Monthly billable cost incurred by retaining the object.
   - `suggested_action` (string, dimension): Recommended remediation (`ARCHIVE_TO_COLD_STORAGE`, `DROP_ORPHANED_TABLE`, `REDUCE_TIME_TRAVEL`).

4. **`uncompressed_storage`**: Inventory of suboptimal storage structures and uncompressed formats:
   - `uncompressed_id` (string, id, primary key): Unique uncompressed record identifier.
   - `object_name` (string, dimension): Table or external stage object identifier.
   - `object_type` (string, dimension): Object category (`TABLE`, `INTERNAL_STAGE`, `EXTERNAL_STAGE`).
   - `current_format` (string, dimension): Current storage format (`UNCOMPRESSED_CSV`, `RAW_JSON`, `UNOPTIMIZED_PARQUET`).
   - `target_format` (string, dimension): Optimal compression format (`SNAPPY_PARQUET`, `SNOWFLAKE_HYBRID_COLUMNAR`, `ZSTD_CSV`).
   - `current_size_bytes` (number, measure): Current storage footprint in bytes.
   - `estimated_compressed_bytes` (number, measure): Projected storage footprint post-compression.
   - `projected_byte_savings` (number, measure): Absolute byte reduction.
   - `projected_monthly_savings_usd` (number, measure): Projected monthly dollar savings from compression.

5. **`storage_usage_history`**: Longitudinal daily and weekly storage consumption trends:
   - `history_id` (string, id, primary key): Unique history record identifier.
   - `usage_date` (date, date): Calendar date of storage snapshot.
   - `active_bytes` (number, measure): Daily aggregated active table storage bytes.
   - `time_travel_bytes` (number, measure): Daily aggregated time-travel bytes.
   - `failsafe_bytes` (number, measure): Daily aggregated fail-safe bytes.
   - `stage_bytes` (number, measure): Daily aggregated internal/external stage storage bytes.
   - `daily_cost_usd` (number, measure): Daily storage expenditure in USD.

6. **`recommendation_queue`**: Prioritized remediation queue preserving all six canonical governance fields:
   - `recommendation_id` (string, id, primary key): Unique recommendation tracking identifier (e.g., `STW-001`, `STW-002`).
   - `executive_severity` (string, dimension): Priority classification (`P0`, `P1`, `P2`).
   - `suggested_owner` (string, dimension): Designated administrative or data owner (e.g., `Data Engineering Lead`, `Finance Systems Owner`).
   - `recommended_action` (string, dimension): Concrete remediation instruction (e.g., `Archive dormant staging tables in RAW_INGESTION schema to Iceberg/S3 Glacier cold tier`).
   - `evidence_detail` (string, dimension): Quantified justification citing scope, unqueried duration, and estimated monthly dollar savings.
   - `guardrail` (string, dimension): Explicit protective operational constraint and confirmation requirement (e.g., `Confirm with Finance Data Steward before dropping staging tables; ensure compliance retention window is satisfied`).

### Canonical DashboardSpec & Runtime DataAdapter Seams

In strict accordance with DashForge Principle 3 (**Components never know where data comes from**), the storage waste presentation layer queries data exclusively through canonical `DataAdapter` interfaces without secondary renderers, backend daemons, or ad-hoc charting engines:
- **Scenario Registration & Routing**: Registered under template `tpl.snowflakeCost.storage-waste` and scenario `snowflakeCost:storage-waste`, mounting in `StandaloneDashboardApp.tsx` at `/?scenario=storage-waste` with DOM scenario marker `data-scenario="storage-waste"`.
- **Decoupled Data Routing**: Standalone presentation views resolve scenario data through `createDashboardDataAdapter` via `StaticDataAdapter` or `SyntheticDataArtifactAdapter`, executing `query()`, `aggregate()`, and `getSchema()` calls directly against the six in-memory datasets.
- **Presentation Widgets & Contract Markers**:
  - **KPI Scorecards**: Headline storage metrics for Total Storage Spend, Recoverable Waste Opportunity, Stale Table Storage, and Uncompressed Storage Overhead.
  - **Storage Volume Distribution Visualizers**: Visual breakdown of storage bytes by database, schema, and storage tier (active, time-travel, fail-safe).
  - **Table Access Aging Analysis**: Stratified distribution of tables by elapsed days since last read/write activity.
  - **Prioritized Recommendation Queue**: Expandable action queue container carrying DOM markers `data-status="recommendation-queue"` and `data-action="open-recommendation-queue"`.

### Prioritized Recommendation Queue & Governance Guardrails

The recommendation engine processes telemetry from the canonical `recommendation_queue` dataset, sorting opportunities so that critical, high-impact items (`P0` items, such as large dormant staging tables or uncompressed raw ingestion sinks) are surfaced first. Every recommendation displays all six canonical governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`).

Crucially, the presentation layer explicitly frames all projected savings and configuration changes as directional pending validation by designated table owners and data stewards:
`"All storage savings and remediation recommendations are directional pending validation by designated data owners and table stewards. Destructive table drops or automated data purging without human stakeholder authorization are strictly disabled."`

### Same-Day Executive Follow-Up & Landscape PDF Export Pipeline

To eliminate post-workshop administrative delay where consultants spend days compiling findings into slide decks:
- **Interactive Follow-Up Generator (`data-action="same-day-executive-follow-up"`)**: Accessible directly from the dashboard header, assembling a decision-ready follow-up document in-browser and updating state to `data-status="executive-follow-up"` with label `"Follow-up artifact is ready"`.
- **Structured Deliverable Payload**: Captures headline financial metrics (total spend, recoverable waste opportunity), prioritized low-risk stale table and compression actions, designated owners, protective guardrails, and cryptographic claim citations anchored to the upstream work-package digest.
- **Landscape Print-to-PDF Export (`data-testid="dashboard-save-pdf"`)**: Invokes `exportDashboardArtifact` preserving executive dark styling, responsive grid formatting, and unsuppressed synthetic data disclosures.

### Persistent Synthetic Disclosures & Production Build Smoke Integrity

To ensure synthetic demonstration figures are never misrepresented as audited client production telemetry:
- **Unsuppressed Disclosure Badges**: A persistent DOM element `data-disclosure="synthetic-demo-data"` displaying the exact text `"Synthetic demo data"` is prominently rendered across all presentation surfaces, header badges (`data-provenance="synthetic-demo-data"`), quality cards, generated follow-up deliverables, and print-to-PDF views.
- **Upstream Provenance Metadata**: Scenario snapshots and presentation headers record full provenance metadata (`packId: "snowflakeCost"`, `scenarioId: "storage-waste"`, seed, `synthetic: true`, and ISO-8601 generation timestamp).
- **Browser Smoke Gate Conformance**: Production static assets compiled into `frontend/dist/` via `npm --prefix frontend run build` conform strictly to `tests/browser_smoke_manifest.json`, preserving all required contract markers:
  1. `"storage-waste"`
  2. `"synthetic-demo-data"`
  3. `"open-recommendation-queue"`
  4. `"recommendation-queue"`
- **Zero Live Credentials**: The application interface strictly avoids credential input fields (`password`, `account_identifier`, `private_key`) and sets `data-mode="real-client-disabled"`.

### Verbatim Direct Argv Workspace-Root Execution & CLI Fail-Closed Architecture

All verification commands, test assertions, and CLI workflows declared in `journeys/user_journeys_manifest.json` execute verbatim from the workspace root using direct subprocess invocation (`shell=False`):
- **Application CLI Prefix**: Commands use the exact form `env PYTHONPATH=src python3 -m dashForge.main generate ...`.
- **Pytest Invocation**: Python tests execute via `python3 -m pytest tests/ -q` or targeted paths with NO `PYTHONPATH` override.
- **Frontend Testing**: Browser tests execute via `npm --prefix frontend test -- --run`.
- **Prohibition of Shell Constructs**: All shell pipelines (`|`), boolean chaining (`&&`, `||`, `;`), file redirection (`<`, `>`), and standalone shell tools (`jq`, `grep`, `cat`) are strictly prohibited as sole verification evidence.
- **Fail-Closed Overwrite Guard**: Target paths are checked before execution; existing destinations abort with exit code 2 and actionable diagnostics via `parser.error()` unless `--force` is explicitly passed.

---

## Concrete Plan Items & Work Breakdown

The implementation of the `cost-management-storage-waste` vertical slice is organized into six concrete, sequentially verifiable plan items directly mapped to contract acceptance checks `AC-1` through `AC-6`:

### Plan Item 1: Relational Storage Waste Snapshot Contracts & dataForge Ingestion (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The slice establishes canonical schema contracts and ingestion mechanisms for the Storage Waste cost accelerator, consuming dataForge exports as a read-only, provenance-labeled snapshot conforming strictly to the canonical `SQLiteSnapshot` TypeScript contract (`frontend/src/core/data/sqliteSnapshot.ts`) across storage datasets—including `storage_summary` (headline storage volume, total monthly spend, recoverable waste opportunity), `table_storage_metrics` (table names, schemas, row counts, total storage bytes, fail-safe/time-travel overhead), `stale_tables` (tables without read/write activity exceeding threshold days), `uncompressed_storage` (tables or stages lacking optimal compression formats), `storage_usage_history` (historical daily storage consumption trends), and `recommendation_queue`—carrying complete provenance metadata: `packId` (`snowflakeCost`), `scenarioId` (`storage-waste`), seed, generation timestamp, `synthetic: true`, and disclosure text "Synthetic demo data".")
- **Objective**: Establish and validate typed relational schema definitions and ingestion mechanisms for the six canonical storage waste datasets in Python backend bridges and TypeScript data contracts, producing deterministic SQLite databases and canonical `SQLiteSnapshot` JSON representations without live Snowflake dependencies.
- **Implementation Scope & Seams**:
  - In `src/dashForge/storage_waste.py`: Define dataset constants, column schemas, primary keys, and typed SQL table definitions for `storage_summary`, `table_storage_metrics`, `stale_tables`, `uncompressed_storage`, `storage_usage_history`, and `recommendation_queue`. Provide generator and validator functions `generate_storage_waste_assets()` and `validate_storage_waste_database()`.
  - In `src/dashForge/snowflake_cost.py`: Update scenario enumeration and provenance enrichment to support `storage-waste`, ensuring complete provenance fields (`packId: "snowflakeCost"`, `scenarioId: "storage-waste"`, seed, `synthetic: true`, and disclosure text `"Synthetic demo data"`).
  - In `src/dashForge/package_snapshot.py`: Ensure SQLite schema inspection, table export mapping, and snapshot packaging support the six storage waste datasets with correct column types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`).
  - In `frontend/src/core/data/sqliteSnapshot.ts`: Ensure TypeScript interfaces and snapshot validators cleanly validate the six relational storage waste datasets.
  - In `frontend/src/mock-data/`: Provide canonical snapshot fixture adhering strictly to `SQLiteSnapshot` contract schema.
- **Deliverables**: Formally typed schema definitions, Python generator/validation interfaces, and canonical snapshot exports for all six relational storage waste datasets.

### Plan Item 2: Canonical DashboardSpec Specification & Runtime DataAdapter Seams (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The slice defines and validates the canonical `DashboardSpec` specification for the Storage Waste accelerator, declaring responsive grid layout, headline KPI scorecards (Total Storage Spend, Recoverable Waste Opportunity, Stale Table Storage, Uncompressed Storage Overhead), storage volume distribution charts by schema/table, table access aging visualizers, and prioritized recommendation queues, querying exclusively through DashForge's standard `DataAdapter` runtime interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`) without bespoke renderers or ad-hoc query engines.")
- **Objective**: Define and register the canonical `DashboardSpec` specification for the Storage Waste accelerator and wire its presentation widgets exclusively through standard `DataAdapter` seams.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/standaloneDashboard.ts`: Register scenario blueprint and `DashboardSpec` for `snowflakeCost:storage-waste` (`tpl.snowflakeCost.storage-waste`), declaring responsive grid layout, KPI metric cards (Total Storage Spend, Recoverable Waste Opportunity, Stale Table Storage, Uncompressed Storage Overhead), storage volume distribution visualizers, table access aging charts, and recommendation queue table.
  - In `frontend/src/features/runtime/storageWastePresentation.ts`: Implement presentation data loader querying `storage_summary`, `table_storage_metrics`, `stale_tables`, `uncompressed_storage`, and `recommendation_queue` through canonical `DataAdapter` interfaces (`query()`, `aggregate()`, `getSchema()`).
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Mount `?scenario=storage-waste`, rendering headline KPI summary cards, storage volume distribution charts, table access aging visualizers, and recommendation queue container.
  - Strictly prohibit bespoke charting libraries or secondary rendering engines; all widgets consume data strictly through the existing dashboard renderer and adapter abstraction.
- **Deliverables**: Canonical `DashboardSpec` definition and runtime presentation wiring consuming standard `DataAdapter` seams.

### Plan Item 3: Prioritized Recommendation Queue & Directional Governance Guardrails (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("The slice presents prioritized recommendations for stale tables and uncompressed storage derived directly from the `recommendation_queue` dataset, displaying all six canonical governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`), ordering critical high-impact opportunities first, and enforcing explicit directional validation guardrails framing all storage savings as directional pending validation by designated data owners and table stewards.")
- **Objective**: Ensure the standalone dashboard renders prioritized remediation recommendations derived from the canonical `recommendation_queue` dataset, ordering critical high-impact opportunities first, displaying all six required governance fields, and enforcing explicit directional validation notices.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Ensure `[data-action="open-recommendation-queue"]` toggles recommendation queue visibility.
    - Render expanded container `[data-status="recommendation-queue"]` with `id="recommendation-queue"` and `role="region"`.
    - Order recommendations so that critical high-impact opportunities (`P0` items such as large dormant staging tables or uncompressed ingestion sinks) are rendered first.
    - Display all six governance fields for each item: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`.
    - Render prominent directional safety notice: `"All storage savings and remediation recommendations are directional pending validation by designated data owners and table stewards. Destructive table drops or automated data purging without human stakeholder authorization are strictly disabled."`
- **Deliverables**: Governed recommendation queue in the standalone dashboard with all six governance fields and explicit directional owner-validation guardrails.

### Plan Item 4: Same-Day Executive Follow-Up Deliverables & Browser Smoke Gate Conformance (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The standalone dashboard integrates interactive same-day executive follow-up artifact generation (`data-action="same-day-executive-follow-up"`) and landscape PDF export (`data-testid="dashboard-save-pdf"`), prominently rendering the unsuppressed disclosure element `data-disclosure="synthetic-demo-data"` with the exact text `"Synthetic demo data"` across all UI surfaces and exported deliverables, and satisfies browser smoke gate conformance (`tests/browser_smoke_manifest.json`) across production static assets in `frontend/dist/` preserving required contract markers (`"storage-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`).")
- **Objective**: Integrate in-browser same-day follow-up artifact generation and landscape PDF export, ensure persistent unsuppressed synthetic data disclosures, and verify that compiled production bundles satisfy browser smoke gate criteria and contract marker preservation.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Provide interactive action `[data-action="same-day-executive-follow-up"]` updating DOM status to `data-status="executive-follow-up"`.
    - Generate structured executive follow-up HTML embedding headline storage metrics, prioritized actions, suggested owners, protective guardrails, and cryptographic claim citations.
    - Wire landscape PDF export via `[data-testid="dashboard-save-pdf"]` invoking `exportDashboardArtifact` preserving dark executive styling and disclosures.
    - Render persistent `data-disclosure="synthetic-demo-data"` badge with exact text `"Synthetic demo data"` across all views.
    - Set `data-mode="real-client-disabled"` with zero live credential inputs.
  - In production build:
    - Execute `npm --prefix frontend run build` generating static assets in `frontend/dist/`.
    - Verify compiled JavaScript bundles in `frontend/dist/assets/*.js` preserve exact contract marker literals: `"storage-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`.
- **Deliverables**: Decision-ready same-day follow-up generator, landscape PDF export, unsuppressed synthetic disclosures, and validated production build conforming to browser smoke gate markers.

### Plan Item 5: Verbatim Direct Argv Command Execution & Journey Traceability (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("All operational, verification, and test commands declared in `journeys/user_journeys_manifest.json` are runnable verbatim from the workspace root using direct argv execution (`shell=False`), enforcing the exact prefix `env PYTHONPATH=src python3 -m dashForge.main` for application CLI commands, `npm --prefix frontend test -- --run` for browser-visible frontend tests, and `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override for Python test execution, with complete traceability across all acceptance checks (`AC-1` through `AC-6`) and zero forbidden shell operators (`|`, `&&`, `||`, `;`, `<`, `>`).")
- **Objective**: Ensure all user journey commands in `journeys/user_journeys_manifest.json` execute verbatim from the workspace root under direct subprocess invocation (`shell=False`) with complete bidirectional traceability across `AC-1` through `AC-6`.
- **Implementation Scope & Seams**:
  - In `journeys/user_journeys_manifest.json`:
    - Enforce `command_allowlist` containing exact allowed prefixes:
      - `"env PYTHONPATH=src python3 -m dashForge.main"`
      - `"python3 -m pytest tests/ -q"`
      - `"python3 -m pytest"`
      - `"npm --prefix frontend test -- --run"`
    - Confirm all user journeys declare valid authorities (`human`, `mission`, `author`) and `passed` status.
    - Guarantee complete acceptance check coverage where every check (`AC-1` through `AC-6`) is traced by at least one journey via `traces_to`.
    - Prohibit shell operators (`|`, `&&`, `||`, `;`, `<`, `>`) and standalone shell utilities (`jq`, `grep`, `cat`).
- **Deliverables**: Synchronized user journeys manifest with 100% acceptance check traceability and zero unallowlisted commands.

### Plan Item 6: Preservation of Existing Behavior & Sibling dataForge Isolation (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("Existing dashForge behavior, templates, and accelerator slices (`healthcare`, `financial`, `saas`, `snowflakeCost:idle-warehouse-waste`, `snowflakeRbac:rbac-audit-foundation`) remain completely intact and functional without regressions; CLI generation commands support fail-closed target overwrite protection requiring `--force`; sibling repository `dataForge` remains strictly read-only and unmodified; and the full automated test suite passes cleanly.")
- **Objective**: Prevent regressions across existing DashForge packs, CLI generation workflows, and fail-closed overwrite guards, ensuring sibling project `dataForge` remains strictly unmodified and isolated.
- **Implementation Scope & Seams**:
  - Ensure zero edits to sibling repository `dataForge/`.
  - Validate deterministic generation of existing industry packs: `healthcare:flu-season`, `financial:market-downturn`, `saas:churn-crisis`, `snowflakeCost:idle-warehouse-waste`, and `snowflakeRbac:rbac-audit-foundation`.
  - Validate fail-closed overwrite protection: verifying that attempting to overwrite existing outputs without `--force` exits with code 2 and clean diagnostics.
  - Run full automated regression suites: `python3 -m pytest tests/ -q` (with NO `PYTHONPATH` override) and `npm --prefix frontend test -- --run`.
- **Deliverables**: Verified regression safety across all existing industry packs and complete sibling project isolation.

---

## Acceptance Check Traceability Matrix

The following matrix provides comprehensive, bidirectional mapping between contract acceptance checks (`AC-1` through `AC-6`), concrete plan items, user journeys, implementation touchpoints, and verification commands:

| Acceptance Check | Concrete Plan Item | User Journey ID | Primary Implementation Touchpoints | Verification Command & Assertion Target |
|:---|:---|:---|:---|:---|
| **AC-1** | Plan Item 1: Relational Storage Waste Snapshot Contracts & dataForge Ingestion | `journey-storage-waste-data-model-schema-inspection` | `src/dashForge/storage_waste.py`, `src/dashForge/snowflake_cost.py`, `frontend/src/core/data/sqliteSnapshot.ts` | `python3 -m pytest tests/test_remediation_artifacts.py -q -k test_ac5_user_journeys_manifest_full_ac_traceability` |
| **AC-2** | Plan Item 2: Canonical DashboardSpec Specification & Runtime DataAdapter Seams | `journey-storage-waste-dashboard-spec-runtime-seams` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `frontend/src/features/runtime/standaloneDashboard.ts` | `npm --prefix frontend test -- --run -t "StandaloneDashboardApp"` |
| **AC-3** | Plan Item 3: Prioritized Recommendation Queue & Directional Governance Guardrails | `journey-storage-waste-prioritized-recommendations-and-governance` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `src/dashForge/storage_waste.py` | `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf` |
| **AC-4** | Plan Item 4: Same-Day Executive Follow-Up Deliverables & Browser Smoke Gate Conformance | `journey-storage-waste-synthetic-disclosures-and-smoke-conformance` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `tests/browser_smoke_manifest.json` | `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac6_production_bundle_contract_markers_conformance` & `npm --prefix frontend run build` |
| **AC-5** | Plan Item 5: Verbatim Direct Argv Command Execution & Journey Traceability | `journey-storage-waste-verbatim-cli-execution` | `journeys/user_journeys_manifest.json`, `src/dashForge/main.py` | `env PYTHONPATH=src python3 -m dashForge.main --help` |
| **AC-6** | Plan Item 6: Preservation of Existing Behavior & Sibling dataForge Isolation | `journey-storage-waste-regression-and-architecture-integrity` | `src/dashForge/main.py`, `src/dashForge/idle_warehouse_waste.py`, `tests/test_idle_warehouse_waste.py` | `python3 -m pytest tests/test_idle_warehouse_waste.py -q` & `python3 -m pytest tests/ -q` |

---

## Tests

The testing architecture for the `cost-management-storage-waste` slice implements a deterministic, multi-tiered verification methodology spanning frontend component tests, Python contract assertions, production bundle inspection, and user journey simulation.

### 1. Frontend Unit and Integration Test Suite

The frontend test suite is executed using Vitest and Testing Library via `npm --prefix frontend test -- --run`:

- **Component Rendering & Mounting (`StandaloneDashboardApp.test.tsx`)**:
  - Verifies that `StandaloneDashboardApp` correctly mounts scenario containers, resolves `?scenario=storage-waste`, and initializes presentation state cleanly without errors.
  - Asserts presence of required DOM markers: `[data-scenario="storage-waste"]`, `[data-disclosure="synthetic-demo-data"]`, `[data-action="open-recommendation-queue"]`, and `[data-status="recommendation-queue"]`.
- **DataAdapter Query Routing & Snapshot Bridge (`StaticDataAdapter.test.ts`, `createDashboardDataAdapter.test.ts`)**:
  - Asserts that relational queries executed against the six storage waste datasets (`storage_summary`, `table_storage_metrics`, `stale_tables`, `uncompressed_storage`, `storage_usage_history`, `recommendation_queue`) return expected rows and aggregate measures.
  - Confirms schema inspection via `getSchema()` correctly identifies column types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`).
- **Prioritized Recommendations & Governance Guardrails (`StandaloneDashboardApp.test.tsx`)**:
  - Verifies that storage recommendations render all six governance fields and order critical high-impact opportunities first.
  - Confirms display of explicit directional notices requiring table owner and data steward validation before archival or compression changes.
- **Same-Day Follow-Up & Landscape PDF Export (`StandaloneDashboardApp.test.tsx`)**:
  - Tests interaction with `[data-action="same-day-executive-follow-up"]` and validates resulting deliverable structure.
  - Tests trigger of `[data-testid="dashboard-save-pdf"]` and confirms synthetic disclosures are preserved.

### 2. Automated Python Test Suite

The Python test suite is executed via `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override:

- **Relational Schema Contracts & Governance Fields (`tests/test_remediation_artifacts.py`, `tests/test_playbook_schema.py`)**:
  - Asserts that all six canonical datasets define required columns and data types.
  - Confirms that `recommendation_queue` enforces and preserves all six governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`).
- **CLI Subcommand & Fail-Closed Overwrite Protection (`tests/test_idle_warehouse_waste.py`)**:
  - Asserts that CLI generate commands fail closed with exit code 2 when output paths exist without `--force`.
  - Verifies deterministic generation producing matching SQLite and snapshot hashes across runs with identical seed.
- **Persistent Synthetic Data Disclosures (`tests/test_idle_warehouse_dashboard.py`)**:
  - Asserts that synthetic demo data disclosures are preserved across presentation and export structures.
- **Regression Safety & Sibling Project Isolation (`tests/test_idle_warehouse_waste.py`, `tests/test_playbook_schema.py`)**:
  - Asserts that existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost:idle-warehouse-waste`, `snowflakeRbac:rbac-audit-foundation`) generate without regressions.
  - Confirms sibling repository `dataForge` remains clean and unmodified.

### 3. Browser Smoke Gate & Contract Marker Suite

- **Smoke Manifest Conformance (`tests/browser_smoke_manifest.json`)**:
  - Verifies that static assets compiled into `frontend/dist/` mount cleanly at `#root`.
  - Confirms presence of required contract markers (`"storage-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`).
- **Zero Live Credentials Enforcement**:
  - Asserts that presentation surfaces strictly avoid credential input fields (`password`, `account_identifier`, `private_key`) and external network endpoints, enforcing `data-mode="real-client-disabled"`.

### 4. User Journey Simulation Suite

The user journey simulation verifies that all declared journeys in `journeys/user_journeys_manifest.json` execute cleanly under direct argv invocation:
- `journey-storage-waste-data-model-schema-inspection`: Inspects foundational Storage Waste data model schemas and governance datasets (`AC-1`).
- `journey-storage-waste-dashboard-spec-runtime-seams`: Verifies Storage Waste dashboard specification structure and canonical DataAdapter runtime seams (`AC-2`).
- `journey-storage-waste-prioritized-recommendations-and-governance`: Verifies prioritized storage recommendations, governance fields, and directional validation guardrails (`AC-3`).
- `journey-storage-waste-synthetic-disclosures-and-smoke-conformance`: Verifies persistent synthetic disclosures and production build smoke gate contract markers (`AC-4`).
- `journey-storage-waste-verbatim-cli-execution`: Verifies workspace-root CLI help execution under direct argv (`AC-5`).
- `journey-storage-waste-regression-and-architecture-integrity`: Verifies complete test suite execution, zero regressions, and sibling repository isolation (`AC-6`).

---

## Verification

The verification protocol executes nine deterministic verification steps from the workspace root to confirm all six acceptance checks (`AC-1` through `AC-6`):

### Step 1: Verify Foundational Storage Waste Schema Contracts & Manifest Traceability (`AC-1`, `AC-5`)
Execute targeted pytest check verifying schema conformance and complete acceptance check traceability in `journeys/user_journeys_manifest.json`:
```bash
python3 -m pytest tests/test_remediation_artifacts.py -q -k test_ac5_user_journeys_manifest_full_ac_traceability
```
- **Expected Result**: Exits with code 0. Confirms all acceptance checks (`AC-1` through `AC-6`) are traced by manifest user journeys with zero dangling IDs.

### Step 2: Verify Frontend Component Mounting & DataAdapter Runtime Seams (`AC-2`)
Execute targeted frontend test verifying `StandaloneDashboardApp` component mounting and DataAdapter query resolution:
```bash
npm --prefix frontend test -- --run -t "StandaloneDashboardApp"
```
- **Expected Result**: Exits with code 0. Verifies standalone presentation mounting and clean component rendering without errors.

### Step 3: Verify Prioritized Recommendations & Governance Attributes (`AC-3`)
Execute targeted frontend tests verifying recommendation ordering and six governance fields:
```bash
npm --prefix frontend test -- --run -t "recommendation queue"
```
- **Expected Result**: Exits with code 0. Confirms recommendation ordering and display of all six governance fields.

### Step 4: Verify Persistent Synthetic Data Disclosures & Guardrails (`AC-3`, `AC-4`)
Execute targeted test asserting unsuppressed synthetic data disclosures and directional framing:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf
```
- **Expected Result**: Exits with code 0. Confirms unsuppressed `data-disclosure="synthetic-demo-data"` and exact text `"Synthetic demo data"`.

### Step 5: Verify Frontend Production Build Compilation (`AC-4`)
Execute the frontend production build from workspace root:
```bash
npm --prefix frontend run build
```
- **Expected Result**: Exits with code 0. Zero TypeScript errors; static assets compiled into `frontend/dist/`.

### Step 6: Verify Browser Smoke Gate Contract Markers (`AC-4`)
Inspect compiled JavaScript bundles for contract markers:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac6_production_bundle_contract_markers_conformance
```
- **Expected Result**: Exits with code 0. Confirms compiled bundles retain required contract marker literals.

### Step 7: Verify Verbatim Workspace-Root CLI Execution (`AC-5`)
Execute dashForge CLI entrypoint help from workspace root using direct argv execution:
```bash
env PYTHONPATH=src python3 -m dashForge.main --help
```
- **Expected Result**: Exits with code 0. Outputs standard CLI options and generate subcommands cleanly without shell pipelines.

### Step 8: Verify Regression Safety Across Existing Packs & Sibling Isolation (`AC-6`)
Execute regression test verifying that existing cost, healthcare, financial, and SaaS packs remain intact:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q
```
- **Expected Result**: Exits with code 0. All idle warehouse tests pass cleanly.

Verify sibling project `dataForge` remains completely untouched:
```bash
python3 -m pytest tests/test_playbook_schema.py -q -k test_ac5_dataforge_sibling_repo_unmodified
```
- **Expected Result**: Exits with code 0. Sibling repository `dataForge` has zero uncommitted modifications.

### Step 9: Execute Complete Automated Test Suites (`AC-5`, `AC-6`)
Execute full frontend test suite:
```bash
npm --prefix frontend test -- --run
```
- **Expected Result**: Exits with code 0. All frontend test files pass cleanly.

Execute complete Python test suite with NO `PYTHONPATH` override:
```bash
python3 -m pytest tests/ -q
```
- **Expected Result**: Exits with code 0. All tests pass cleanly without errors or regressions.

---

## Risks

The following risk assessment details critical technical, architectural, and operational risks associated with delivering the `cost-management-storage-waste` vertical slice, establishing concrete preventative and detective controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:---|:---:|:---:|:---|
| **Misinterpretation of Synthetic Storage Data as Audited Production Figures**: Prospective enterprise buyers mistake synthetic demo storage numbers for audited customer production telemetry, creating financial misrepresentation risks during executive workshops. | High | Low | Mandate persistent, unsuppressed `data-disclosure="synthetic-demo-data"` badges displaying the exact text `"Synthetic demo data"` across all views, accompanied by generation provenance metadata (`packId: "snowflakeCost"`, `scenarioId: "storage-waste"`, `synthetic: true`, ISO-8601 timestamp) (`AC-3`, `AC-4`). |
| **Premature or Destructive Table Deletion Assumptions**: Workshop participants assume displayed stale table remediation guidance can be executed automatically to drop or purge tables without stakeholder approval. | High | Low | Enforce explicit directional validation guardrails on every recommendation card and export view: all storage savings are directional pending validation by designated data owners and table stewards. Automated destructive table drops or data purging APIs are strictly disabled (`AC-3`). |
| **Secondary Renderer Architecture Fragmentation**: Introducing bespoke chart libraries or ad-hoc table renderers that bypass canonical `DataAdapter` and `DashboardSpec` contracts fragments runtime architecture. | High | Low | Mandate that all widgets, storage volume visualizers, and recommendation queues consume data exclusively through `createDashboardDataAdapter` via standard query interfaces (`query()`, `aggregate()`, `getSchema()`), preserving Phase 6 production binding compatibility (`AC-2`). |
| **Live Credential Leakage or Cloud Network Calls**: Developers inadvertently introduce Snowflake connection forms, username/password fields, or network fetch requests during storage waste presentation authoring. | Critical | Low | Prohibit all external cloud networking and credential inputs (`password`, `account_identifier`, `private_key`). Enforce client-side local snapshot loading via `StaticDataAdapter` and automated assertion tests (`AC-2`, `AC-4`). |
| **Production Bundle Marker Stripping During Minification**: Vite/Rollup tree-shaking or terser minification removes contract marker strings from compiled static bundles in `frontend/dist/assets/`. | Medium | Low | Maintain explicit string literals in DOM attributes and data structures. Plan Item 4 and Verification Step 6 enforce automated bundle marker audits asserting all contract markers (`AC-4`). |
| **Direct Argv Subprocess Execution Failures via Shell Incompatibilities**: Verification commands declared in `journeys/user_journeys_manifest.json` fail during orchestrator execution due to shell syntax dependencies. | High | Low | Enforce direct argv execution standards (`shell=False`): journey commands use exact `env PYTHONPATH=src python3 -m dashForge.main`, `npm --prefix frontend test -- --run`, and `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override and zero shell operators (`|`, `&&`, `;`, redirection) (`AC-5`). |
| **Sibling Repository or Existing Pack Contamination**: Implementing Storage Waste models inadvertently alters existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost:idle-warehouse-waste`, `snowflakeRbac:rbac-audit-foundation`) or mutates sibling project `dataForge`. | High | Low | Maintain strict read-only boundary around `dataForge/`. Run full regression suites (`python3 -m pytest tests/ -q`) confirming zero modifications to existing generators, tests, and dataForge files (`AC-6`). |
| **Acceptance Check Traceability Gaps**: Implementation plan or journey manifest fails to trace every contract acceptance check, triggering gate failure under the traceability judge. | High | Low | Ensure explicit bidirectional traceability mapping every acceptance check (`AC-1` through `AC-6`) to concrete plan items, user journeys, touchpoints, and verification steps in the traceability matrix (`AC-5`). |

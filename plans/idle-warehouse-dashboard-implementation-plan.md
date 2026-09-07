# Idle Warehouse Dashboard Implementation Plan

## Executive Summary & Slice Intent

The `idle-warehouse-dashboard` vertical slice establishes the buyer-visible presentation layer for the Idle Warehouse Waste cost accelerator in DashForge. DashForge functions as an internal consulting delivery weapon for Anblicks analytics consultants, client delivery leads, and practice directors engaging enterprise executive buyers—specifically Chief Information Officers (CIOs), Chief Technology Officers (CTOs), and FinOps practice leaders. In early discovery workshops, consulting teams face substantial pre-sales roadblocks: prospective clients cannot connect external tools to live Snowflake production accounts due to infosec, data privacy, and governance restrictions, while generic slide decks, static wireframes, or empty BI canvases lack operational realism and fail to establish consulting credibility.

The slice intent is to deliver a fully functional, zero-dependency browser dashboard that consumes the existing `idle-warehouse-waste` backend slice and presents actionable cloud data warehouse cost metrics, resource waste patterns, and prioritized, owner-validated recommendations using TVIQ-shaped (Time-to-Value, Impact, Quality) data structures. The dashboard runs entirely in the browser without live infrastructure, requiring no active backend server or database connections. The implementation focuses strictly on the browser-based presentation tier without altering the underlying data generation, relational extraction, or schema definition layers in Python or sibling project `dataForge`. Every acceptance check defined in `docs/idle-warehouse-dashboard-contract.md` (`AC-1` through `AC-8`) maps directly to a concrete plan item, verified through automated unit tests, browser smoke conformance checks, production bundle marker inspection, and full regression test suites.

---

## Architecture

The presentation architecture of the `idle-warehouse-dashboard` slice establishes an offline, browser-contained data flow from packaged scenario snapshot assets through canonical runtime seams to an interactive executive dashboard. In accordance with DashForge's core architectural principle—**components never know where data comes from**—all presentation components consume data exclusively through the `DataAdapter` abstraction layer, preventing duplicate rendering pipelines, ad-hoc chart engines, or bespoke recommendation processors.

### Presentation Subsystems and Runtime Seams

The architectural structure and runtime data flow are depicted below:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Existing Backend Slice (Authoritative)                 │
│  src/dashForge/idle_warehouse_waste.py & snowflake_cost.py                  │
│    ├── 7 Relational Datasets: executive_summary, warehouse_metering_history,│
│    │   query_history, metering_history, database_storage_usage_history,     │
│    │   show_warehouses, recommendation_queue                                │
│    └── Verified Work-Package Digest:                                        │
│        sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Read-only packaged assets)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Packaged Scenario Assets & Runtime Catalogs                │
│  frontend/src/mock-data/                                                    │
│    ├── snowflakeCostIdleWarehouseWaste.ts: MockScenario definition          │
│    ├── snowflakeCostIdleWarehouseWastePreviewData.json: Canonical snapshot  │
│    ├── scenarioCatalog.ts: snowflakeCost:idle-warehouse-waste               │
│    └── templateCatalog.ts: tpl.snowflakeCost.idle-warehouse-waste           │
│  scenarios/idle-warehouse-waste/                                            │
│    ├── blueprint.json & preview-data.json: Bounded scenario package assets  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DashboardSpec & DataAdapter Runtime Seams                  │
│  frontend/src/core/data/createDashboardDataAdapter.ts                       │
│    ├── StaticDataAdapter: In-memory relational querying & schema inspection │
│    └── SyntheticDataArtifactAdapter: Verifies claims & digest integrity    │
│  frontend/src/core/spec/dashboardSchema.ts & dashboardSpec.ts               │
│    ├── DashboardSpec: Canonical layout, widget specs, and data bindings    │
│    └── Claim Ledger: Material claims anchored to verified artifact digest   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Standalone Executive Presentation Layer (React 19)          │
│  frontend/src/features/runtime/StandaloneDashboardApp.tsx                   │
│    ├── URL Scenario Resolver: /?scenario=idle-warehouse-waste               │
│    ├── Controlled Readiness State: data-readiness="controlled"              │
│    ├── Persistent Synthetic Disclosure: data-disclosure="synthetic-demo-data"│
│    ├── TVIQ Executive Metrics:                                              │
│    │   ├── Time-to-Value: Immediate actionable savings without deployment    │
│    │   ├── Impact: 726 compute credit savings, 2 unmonitored warehouses     │
│    │   └── Quality: Verified digest citations & deterministic telemetry     │
│    ├── Warehouse Concentration: FINANCE_REPORTING_WH (>50% of compute credits)│
│    ├── Prioritized Recommendation Queue: data-status="recommendation-queue" │
│    │   ├── P0: FINANCE_REPORTING_WH auto-suspend & monitor assignment       │
│    │   ├── Governance: severity, suggested owner, action, evidence, guardrail│
│    │   └── Safety: Explicit directional framing until validated by owners   │
│    └── Downstream Buyer Deliverables:                                        │
│        ├── Same-Day Follow-Up: data-action="same-day-executive-follow-up"    │
│        └── Print-to-PDF: data-testid="dashboard-save-pdf" (with disclosures)│
└─────────────────────────────────────────────────────────────────────────────┘
```

### TVIQ-Shaped Data Presentation Architecture

The presentation layer structures executive data around the TVIQ framework to maximize commercial and consulting impact:

1. **Time-to-Value (T)**:
   - Eliminates the typical 3-4 week discovery delay required to negotiate Snowflake credentials and infosec approvals.
   - The standalone browser dashboard mounts immediately at `/?scenario=idle-warehouse-waste` with zero configuration, allowing consultants to present an interactive operational optimization dashboard on minute one of a workshop.
   - Recommendations are pre-sorted by severity (`P0` first), providing instant clarity on which remediation actions yield immediate compute credit recovery.

2. **Impact (I)**:
   - **Headline Opportunity**: Surfaces an immediate potential monthly recovery of **726 compute credits** identified across unmonitored infrastructure.
   - **Idle Infrastructure Count**: Identifies **2 compute warehouses** actively running 24/7 with zero active query load during monitored periods.
   - **Credit Concentration**: Highlights that `FINANCE_REPORTING_WH` accounts for over 50% of total compute credit consumption, making it the primary target for rapid FinOps intervention.
   - **Control Gap Transparency**: Exposes disabled auto-suspend (`auto_suspend = 0`), excessive suspension timeouts (≥3600 seconds), and unassigned resource monitors.

3. **Quality (Q)**:
   - **Verifiable Claim Ledger**: Every displayed KPI, chart trend, and recommendation maps to an upstream work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`) backed by dataset observation evidence.
   - **Controlled Readiness**: The DOM transitions to `data-readiness="controlled"` only after the snapshot integrity and claim ledger are verified. If an invalid or unverified digest is supplied, the runtime fails closed to `data-readiness="blocking"` and withholds the presentation.
   - **Governance & Safety Guardrails**: Recommendations enforce all six governance attributes (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) and explicitly frame savings as directional until validated by designated warehouse owners, preventing unauthorized or destructive automated changes.
   - **Persistent Synthetic Disclosure**: An unsuppressed disclosure element bearing `data-disclosure="synthetic-demo-data"` and displaying `"Synthetic demo data"` is prominently visible across all views, print layouts, and follow-up exports.

### Presentation Module Responsibilities

1. `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
   - Acts as the primary browser-visible application entry for standalone workshop presentations.
   - Evaluates `window.location.search` to resolve `?scenario=idle-warehouse-waste`.
   - Manages scenario loading states (`loading`, `ready`, `error`), rendering the scenario root container with `data-scenario="idle-warehouse-waste"` and setting `data-readiness="controlled"` upon successful resolution.
   - Mounts the persistent disclosure element with `data-disclosure="synthetic-demo-data"`.
   - Houses the interactive recommendation queue toggle (`data-action="open-recommendation-queue"`), rendering the container with `data-status="recommendation-queue"` and listing `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) first.
   - Integrates the same-day executive follow-up action (`data-action="same-day-executive-follow-up"`) and landscape PDF print export (`data-testid="dashboard-save-pdf"`), ensuring disclosures and digests are preserved in all downstream deliverables.

2. `frontend/src/features/runtime/standaloneDashboard.ts`:
   - Formulates the canonical `DashboardSpec` and `DashboardClaimLedger` for the idle warehouse waste scenario.
   - Configures widget placements, chart specifications (headline opportunity KPI, idle warehouse count KPI, credit concentration bar chart, warehouse control gap table, recommendation queue table), and data bindings against the seven canonical datasets.
   - Constructs verifiable material claims linking each widget and narrative section to `IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST`.

3. `frontend/src/features/runtime/idleWarehousePresentation.ts`:
   - Orchestrates asynchronous data loading through the `DataAdapter` interface (`createDashboardDataAdapter`).
   - Executes queries against `executive_summary`, `warehouse_metering_history`, `show_warehouses`, and `recommendation_queue`.
   - Computes headline metrics, warehouse concentration ratios, and directional recommendation models with governance guardrails.

4. `frontend/src/core/data/StaticDataAdapter.ts` & `SyntheticDataArtifactAdapter.ts`:
   - Provides deterministic in-memory relational query execution, aggregation, and schema inspection without external database engines.
   - Enforces claim ledger validation and verified artifact digest checks.

5. `scenarios/idle-warehouse-waste/`:
   - Packages scenario specifications, preview data, and blueprint assets enabling the standalone frontend build to resolve the scenario locally without external dependencies.

---

## Concrete Plan Items & Work Breakdown

The implementation is broken down into eight concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-8`:

### Plan Item 1: Standalone Frontend Scenario Mounting & Runtime Seam Resolution (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The standalone frontend application served from `frontend/dist` mounts at `/?scenario=idle-warehouse-waste` without requiring live Snowflake credentials, an active backend server, or manual dataForge receipt orchestration, loading the scenario snapshot assets through canonical `StaticDataAdapter` and `DashboardSpec` seams while preventing duplicate rendering pipelines or secondary query engines.")
- **Objective**: Ensure that the standalone application served from `frontend/dist` boots and mounts the idle warehouse waste scenario directly from the URL query parameter `/?scenario=idle-warehouse-waste` without live credentials, an active backend, or bespoke renderers.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Verify `resolveInitialSpec` inspects `window.location.search` for `scenario=idle-warehouse-waste` and loads `createDefaultStandaloneDashboardSpec()`.
  - In `frontend/src/features/runtime/standaloneDashboard.ts`: Ensure `DEFAULT_STANDALONE_SCENARIO_ID = "idle-warehouse-waste"` and `DEFAULT_STANDALONE_PACK_ID = "snowflakeCost"`.
  - In `frontend/src/core/data/createDashboardDataAdapter.ts`: Ensure adapter resolution uses `SyntheticDataArtifactAdapter` or `StaticDataAdapter` to serve the seven datasets without external network requests.
  - In `scenarios/idle-warehouse-waste/`: Bundle scenario blueprint and preview data assets for standalone scenario resolution.
- **Deliverables**: Verified standalone mounting at `/?scenario=idle-warehouse-waste` through canonical runtime seams.

### Plan Item 2: Scenario Container Attributes & Controlled Readiness State Signaling (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The scenario container element in the DOM carries explicit `data-scenario="idle-warehouse-waste"` and transitions to `data-readiness="controlled"` upon successful resolution of the verified scenario snapshot data and claim ledger, providing unambiguous readiness signals for automated browser smoke runners and human operators.")
- **Objective**: Guarantee that the scenario DOM container carries `data-scenario="idle-warehouse-waste"` and unambiguously signals readiness by setting `data-readiness="controlled"` once verified snapshot data and claim ledger assertions resolve cleanly.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Confirm the root container element renders with `data-scenario="idle-warehouse-waste"`.
  - Manage readiness lifecycle: render `data-readiness="controlled"` when `presentationState.status === "ready"` and quality report verification succeeds.
  - Ensure that if verification fails or digest mismatch occurs, `data-readiness="blocking"` is set and dashboard rendering is halted.
- **Deliverables**: DOM root element with verified `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"` attributes.

### Plan Item 3: Persistent & Unsuppressed Synthetic Demo Data Disclosure Rendering (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("The dashboard renders a persistent, unsuppressed disclosure element bearing `data-disclosure="synthetic-demo-data"` and displaying the exact text `"Synthetic demo data"`, with the disclosure prominently visible across all executive dashboard views and faithfully preserved in generated downstream buyer deliverables, including print-to-PDF views and executive follow-up exports.")
- **Objective**: Ensure that a persistent, visible disclosure element with `data-disclosure="synthetic-demo-data"` and exact text `"Synthetic demo data"` is prominently rendered across all dashboard views and downstream export deliverables.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Render `<span data-disclosure="synthetic-demo-data" ...>Synthetic demo data</span>` prominently in the header badge, quality disclosure card, and presentation summary.
  - In `frontend/src/features/export/exportDashboard.ts` & `meetingDashboardPackage.ts`: Ensure export generators inject `"Synthetic demo data"` and `data-disclosure="synthetic-demo-data"` in all print-to-PDF headers/footers and HTML follow-up summaries.
- **Deliverables**: Unsuppressed, persistent synthetic demo data disclosure in DOM and all exported deliverables.

### Plan Item 4: Interactive Prioritized Recommendation Queue with Governance Guardrails (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The user interface provides an accessible interactive control with `data-action="open-recommendation-queue"` that toggles the prioritized recommendation queue; when opened, the container carries `data-status="recommendation-queue"` and displays prioritized recommendations derived from the `recommendation_queue` dataset, listing `FINANCE_REPORTING_WH` (`IWW-001`, Priority `P0`) first and displaying `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and protective safety `guardrail` terms that explicitly frame savings as directional until validated by designated warehouse owners.")
- **Objective**: Implement and verify the interactive recommendation queue control that expands on demand, carries `data-status="recommendation-queue"`, orders `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) first, presents all six governance fields, and enforces directional validation guardrails.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Implement the button with `data-action="open-recommendation-queue"` and `data-testid="open-recommendation-queue"`.
  - When expanded, render `<section data-status="recommendation-queue" ...>` containing the prioritized recommendation cards/table.
  - In `frontend/src/features/runtime/idleWarehousePresentation.ts`: Ensure recommendations are sorted by priority (`P0` before `P1`), placing `FINANCE_REPORTING_WH` (`IWW-001`) at index 0.
  - Display all six governance fields: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`.
  - Display explicit directional notice: `"Savings are directional until validated by designated warehouse owners."`
- **Deliverables**: Verified interactive recommendation queue with `data-status="recommendation-queue"`, `P0` sorting, complete governance fields, and directional framing.

### Plan Item 5: Same-Day Executive Follow-Up & Landscape PDF Export Integration (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("The dashboard integrates the existing `data-action="same-day-executive-follow-up"` control and landscape PDF export capability (`data-testid="dashboard-save-pdf"`) directly into the idle warehouse workflow without duplicating artifact generation logic, ensuring exported artifacts preserve the scenario narrative, headline opportunity metrics, verified artifact digest citations, and required `"Synthetic demo data"` disclosures.")
- **Objective**: Integrate the existing follow-up export trigger and landscape PDF print action directly into the presentation view without duplicating generation logic, ensuring exported deliverables carry headline metrics, digest citations, and synthetic disclosures.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Provide button with `data-action="same-day-executive-follow-up"` and `data-testid="same-day-executive-follow-up"`.
  - Wire click handler to open the follow-up dialog/window reporting `data-status="executive-follow-up"` and `"Follow-up artifact is ready"`.
  - Provide landscape PDF button with `data-testid="dashboard-save-pdf"`, generating print preview with headline metrics, verified digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`, and `"Synthetic demo data"` disclosures.
- **Deliverables**: Verified follow-up and PDF export actions integrated into the idle warehouse presentation.

### Plan Item 6: Browser Smoke Gate Conformance & Production Bundle Marker Verification (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("The production build served at `http://127.0.0.1:4173/?scenario=idle-warehouse-waste` satisfies the exact contract verified by `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`, ensuring that the HTML `#root` mount element is present and the compiled JavaScript production bundles under `frontend/dist/assets/` contain the essential contract marker strings: `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`.")
- **Objective**: Ensure the compiled production bundle served from `frontend/dist` satisfies all selectors in `tests/browser_smoke_manifest.json` and passes `tests/browser_smoke_check.py`.
- **Implementation Touchpoints**:
  - In `frontend/dist/index.html`: Ensure `<div id="root"></div>` is present.
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Ensure exact string literals `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"` are preserved and not stripped or obfuscated during Vite minification/bundling.
  - Verify conformance against `tests/browser_smoke_manifest.json`:
    - URL: `http://127.0.0.1:4173/?scenario=idle-warehouse-waste`
    - Ready selector: `[data-scenario='idle-warehouse-waste'][data-readiness='controlled'] [data-disclosure='synthetic-demo-data']`
    - Action: `click` on `[data-action='open-recommendation-queue']`
    - Success: `[data-status='recommendation-queue']` containing `"FINANCE_REPORTING_WH"`.
- **Deliverables**: Full conformance with `browser_smoke_manifest.json` and green execution of `tests/browser_smoke_check.py`.

### Plan Item 7: Production TypeScript Build Pipeline & Complete Frontend Test Suite Execution (`AC-7`)
- **Mapped Acceptance Check**: `AC-7` ("The frontend build pipeline (`npm --prefix frontend run build`) executes cleanly to compile TypeScript and bundle static production assets into `frontend/dist/index.html` and supporting bundles, while the automated frontend test suite executes green without errors or skipped assertions via `npm --prefix frontend test -- --run` across all test files.")
- **Objective**: Ensure clean TypeScript compilation across all configs (`tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.package-tools.json`), successful production asset generation in `frontend/dist/`, and 100% green execution across all 35 test files and 108+ frontend tests.
- **Implementation Touchpoints**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`: Ensure unit and integration tests cover scenario routing, controlled readiness, unsuppressed synthetic disclosures, recommendation queue interactions, follow-up export, PDF print actions, and blocking quality failure states.
  - Verify `npm --prefix frontend run build` completes with exit code 0, generating `frontend/dist/index.html` and assets.
  - Verify `npm --prefix frontend test -- --run` passes across all test files without skipped assertions.
- **Deliverables**: Clean production build and green frontend test suite.

### Plan Item 8: Backend Slice Preservation & Regression Suite Protection (`AC-8`)
- **Mapped Acceptance Check**: `AC-8` ("The frontend dashboard consumes data strictly as shaped by the existing `idle-warehouse-waste` backend slice without modifying underlying data generation, extraction, or relational schema layers in Python or sibling project `dataForge/`; all existing CLI commands (`env PYTHONPATH=src python3 -m dashForge.main generate`), existing industry packs (`healthcare`, `financial`, `saas`), and the full automated Python test suite (`python3 -m pytest tests/ -q` with NO PYTHONPATH override) pass cleanly without regression.")
- **Objective**: Preserve the backend generation, CLI, and relational extraction layers without modifications; verify that all existing industry packs and all 112 pytest unit/integration tests pass cleanly with NO `PYTHONPATH` override.
- **Implementation Touchpoints**:
  - Enforce zero edits in `src/dashForge/`, `tests/test_idle_warehouse_waste.py`, and sibling repository `dataForge/`.
  - Validate CLI generation command: `env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/idle-verify.sqlite --snapshot-output /tmp/idle-verify.snapshot.json --force`.
  - Validate existing pack generation (`healthcare`, `financial`, `saas`).
  - Execute `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override, verifying all 112 tests pass.
- **Deliverables**: Zero backend regressions, confirmed sibling repository isolation, and 100% green Python test suite.

---

### Acceptance Check Traceability Matrix

| Acceptance Check | Plan Item | User Journey ID | Primary Touchpoints | Verification Command / Assertion |
|:---|:---|:---|:---|:---|
| **AC-1** | Plan Item 1 | `journey-idle-warehouse-dashboard-url-routing` | `StandaloneDashboardApp.tsx`, `standaloneDashboard.ts`, `StaticDataAdapter.ts` | `npm --prefix frontend test -- --run -t "uses the idle scenario requested by the browser URL"` |
| **AC-2** | Plan Item 2 | `journey-idle-warehouse-dashboard-url-routing`, `journey-idle-warehouse-dashboard-readiness-and-disclosure` | `StandaloneDashboardApp.tsx`, `idleWarehousePresentation.ts` | `npm --prefix frontend test -- --run -t "renders controlled artifact evidence and citations through the shared runtime"` |
| **AC-3** | Plan Item 3 | `journey-idle-warehouse-dashboard-readiness-and-disclosure`, `journey-idle-warehouse-dashboard-executive-follow-up` | `StandaloneDashboardApp.tsx`, `exportDashboard.ts`, `meetingDashboardPackage.ts` | `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_synthetic_demo_data_unsuppressed_in_presentation` |
| **AC-4** | Plan Item 4 | `journey-idle-warehouse-dashboard-recommendation-queue` | `StandaloneDashboardApp.tsx`, `idleWarehousePresentation.ts` | `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_recommendation_queue_presentation_directional_framing` |
| **AC-5** | Plan Item 5 | `journey-idle-warehouse-dashboard-executive-follow-up` | `StandaloneDashboardApp.tsx`, `meetingDashboardPackage.ts` | `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_executive_follow_up_export_contract` |
| **AC-6** | Plan Item 6 | `journey-idle-warehouse-dashboard-smoke-conformance` | `tests/browser_smoke_manifest.json`, `tests/browser_smoke_check.py`, `StandaloneDashboardApp.tsx` | `python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_standalone_dashboard_presentation_narrative_flow` & `python3 tests/browser_smoke_check.py` |
| **AC-7** | Plan Item 7 | `journey-idle-warehouse-dashboard-frontend-test-suite` | `StandaloneDashboardApp.test.tsx`, `tsconfig.app.json`, Vite build | `npm --prefix frontend test -- --run` & `npm --prefix frontend run build` |
| **AC-8** | Plan Item 8 | `journey-idle-warehouse-dashboard-backend-preservation-and-regression` | `src/dashForge/main.py`, `tests/test_idle_warehouse_waste.py` | `python3 -m pytest tests/ -q` (NO PYTHONPATH override) |

---

## Tests

The testing strategy for the `idle-warehouse-dashboard` slice employs a multi-tiered, deterministic validation framework spanning unit tests, integration tests, end-to-end browser smoke checks, and regression suites.

### 1. Frontend Unit and Integration Test Suite

The frontend test suite is executed via Vitest and Testing Library (`npm --prefix frontend test -- --run`), targeting 35 test files and 108+ tests:

- **Scenario Resolution & Routing (`StandaloneDashboardApp.test.tsx`)**:
  - `uses the idle scenario requested by the browser URL`: Simulates navigation to `/?scenario=idle-warehouse-waste`, asserts that `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"` are applied to the DOM root, and confirms the shared dashboard renderer mounts without error.
- **Controlled Evidence & Synthetic Disclosures (`StandaloneDashboardApp.test.tsx`)**:
  - `renders controlled artifact evidence and citations through the shared runtime`: Asserts that `data-disclosure="synthetic-demo-data"` contains `"Synthetic demo data"`, verifies the presence of headline credit savings (726 credits), confirms claim citations link to `IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST`, and checks that live Snowflake connection controls are absent.
- **Interactive Recommendation Queue (`StandaloneDashboardApp.test.tsx`)**:
  - Asserts that `[data-action="open-recommendation-queue"]` begins with `aria-expanded="false"`, transitions to `aria-expanded="true"` upon click, renders `[data-status="recommendation-queue"]`, displays priority `P0`, verifies `FINANCE_REPORTING_WH` is listed first, and validates the presence of owner validation guardrails and directional savings notices.
- **Executive Follow-Up & PDF Export (`StandaloneDashboardApp.test.tsx`)**:
  - Asserts that clicking `[data-action="same-day-executive-follow-up"]` opens a follow-up document containing `"Synthetic demo data"` disclosures and the artifact digest, setting `[data-status="executive-follow-up"]`.
  - Asserts that clicking `[data-testid="dashboard-save-pdf"]` generates a landscape print view preserving evidence citations.
- **Blocking Quality Refusal (`StandaloneDashboardApp.test.tsx`)**:
  - `shows blocking quality and withholds the dashboard for an unverified digest`: Injects an unverified artifact digest, asserting that `data-readiness="blocking"` is applied, alerts are rendered, and the main dashboard renderer is withheld.

### 2. Python Backend & Contract Assertion Suite

The Python test suite is executed via `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override, covering 112 tests:

- `test_idle_warehouse_dashboardspec_meta_and_constants`: Verifies scenario identifiers, default seeds, and metadata constants in `standaloneDashboard.ts`.
- `test_idle_warehouse_claim_ledger_surfaces_coverage`: Verifies that all visual and metric surfaces (`monthly-opportunity-high`, `idle-warehouse-count`, `cost-concentration`, `warehouse-controls`, `IWW-001`, `IWW-002`) are anchored to the claim ledger.
- `test_idle_warehouse_verified_artifact_digest_integrity`: Asserts that the verified artifact digest equals `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`.
- `test_synthetic_demo_data_unsuppressed_in_presentation`: Verifies that `StandaloneDashboardApp.tsx` contains the exact unsuppressed disclosure string `"Synthetic demo data"`.
- `test_recommendation_queue_presentation_directional_framing`: Verifies that `StandaloneDashboardApp.tsx` frames recommendations as directional until validated by designated owners.
- `test_standalone_dashboard_presentation_narrative_flow`: Confirms the presence of required DOM markers and contract constants in presentation code.
- `test_existing_packs_unaffected`: Validates that `healthcare`, `financial`, and `saas` packs continue to generate cleanly without regression.
- `test_dataforge_unmodified`: Asserts that sibling repository `dataForge` remains completely untouched.

### 3. Browser Smoke Gate & Contract Marker Suite

The browser smoke gate enforces physical DOM and bundle conformance:

- `tests/browser_smoke_manifest.json`: Pinned JSON configuration specifying server startup command, target URL `http://127.0.0.1:4173/?scenario=idle-warehouse-waste`, ready selector `[data-scenario='idle-warehouse-waste'][data-readiness='controlled'] [data-disclosure='synthetic-demo-data']`, click action on `[data-action='open-recommendation-queue']`, and success assertion on `[data-status='recommendation-queue']` containing `"FINANCE_REPORTING_WH"`.
- `tests/browser_smoke_check.py`: Operator-runnable verification script validating that the served index contains `<div id="root">` and that built JavaScript bundles under `frontend/dist/assets/` contain the required markers: `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`.

### 4. User Journey Simulation Suite

The user journey simulation verifies that the seven operator journeys defined in `journeys/user_journeys_manifest.json` execute cleanly from the workspace root against allowlisted command prefixes with expected exit codes and output patterns.

---

## Verification

The verification protocol executes deterministic checks from the workspace root to confirm all eight acceptance checks (`AC-1` through `AC-8`):

### Step 1: Verify URL Scenario Resolution & Standalone Mounting (`AC-1`, `AC-2`)
Execute the focused frontend scenario routing test:
```bash
npm --prefix frontend test -- --run -t "uses the idle scenario requested by the browser URL"
```
- **Expected Result**: Exits with code 0. Test passes, verifying that navigating to `/?scenario=idle-warehouse-waste` sets `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"` on the scenario root element.

### Step 2: Verify Controlled Readiness & Persistent Synthetic Disclosure (`AC-2`, `AC-3`)
Execute the controlled evidence and disclosure frontend test:
```bash
npm --prefix frontend test -- --run -t "renders controlled artifact evidence and citations through the shared runtime"
```
- **Expected Result**: Exits with code 0. Test passes, confirming `data-readiness="controlled"`, visible `[data-disclosure="synthetic-demo-data"]` element with text `"Synthetic demo data"`, and headline opportunity metrics (726 credits).

### Step 3: Verify Unsuppressed Presentation Disclosure in Python (`AC-3`)
Execute the unsuppressed disclosure assertion:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_synthetic_demo_data_unsuppressed_in_presentation
```
- **Expected Result**: Exits with code 0. Confirms `StandaloneDashboardApp.tsx` contains `"Synthetic demo data"`.

### Step 4: Verify Prioritized Recommendation Queue & Directional Framing (`AC-4`)
Execute the recommendation queue directional framing test:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_recommendation_queue_presentation_directional_framing
```
- **Expected Result**: Exits with code 0. Confirms that `StandaloneDashboardApp.tsx` contains directional validation notices and owner confirmation terms.

### Step 5: Verify Executive Follow-Up & PDF Export Serialization (`AC-5`)
Execute the follow-up export contract test:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_executive_follow_up_export_contract
```
- **Expected Result**: Exits with code 0. Confirms `meetingDashboardPackage.ts` packages idle warehouse waste deliverables with synthetic disclosures and verified digests.

### Step 6: Verify Production TypeScript Build & Asset Generation (`AC-6`, `AC-7`)
Execute the production build:
```bash
npm --prefix frontend run build
```
- **Expected Result**: Exits with code 0. TypeScript compiles cleanly without errors; `frontend/dist/index.html` and bundled JavaScript/CSS files are generated under `frontend/dist/assets/`.

### Step 7: Verify Browser Smoke Contract Markers (`AC-6`)
Inspect compiled assets for required contract marker strings:
```bash
python3 -c "
import glob
bundle = ''.join(open(p, encoding='utf-8', errors='replace').read() for p in glob.glob('frontend/dist/assets/*.js'))
markers = ['idle-warehouse-waste', 'synthetic-demo-data', 'open-recommendation-queue', 'recommendation-queue']
missing = [m for m in markers if m not in bundle]
assert not missing, f'Missing contract markers: {missing}'
print('All browser smoke contract markers verified successfully in production bundle.')
"
```
- **Expected Result**: Exits with code 0, outputs `"All browser smoke contract markers verified successfully in production bundle."`.

### Step 8: Verify Complete Frontend Test Suite Execution (`AC-7`)
Execute the entire frontend test suite:
```bash
npm --prefix frontend test -- --run
```
- **Expected Result**: Exits with code 0. All 35 test files and 108+ tests pass cleanly with zero failures or skipped assertions.

### Step 9: Verify Deterministic CLI Generation & Backend Integrity (`AC-8`)
Execute deterministic generation for the idle warehouse scenario:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/idle-warehouse-verify.sqlite \
  --snapshot-output /tmp/idle-warehouse-verify.snapshot.json \
  --force
```
- **Expected Result**: Exits with code 0. Both SQLite database and JSON snapshot are generated deterministically without Python tracebacks.

### Step 10: Verify Backwards Compatibility Across Existing Packs (`AC-8`)
Execute existing pack compatibility test:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_existing_packs_unaffected
```
- **Expected Result**: Exits with code 0. Healthcare, financial, and SaaS packs generate and validate without error.

### Step 11: Verify Sibling Repository Isolation (`AC-8`)
Assert that sibling repository `dataForge` remains untouched:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q -k test_dataforge_unmodified
```
- **Expected Result**: Exits with code 0. Sibling repository git status is clean.

### Step 12: Execute Complete Python Test Suite Regression (`AC-8`)
Execute full Python test suite with NO `PYTHONPATH` override:
```bash
python3 -m pytest tests/ -q
```
- **Expected Result**: Exits with code 0. All 112 tests pass cleanly in ~16 seconds.

---

## Risks

The following risk assessment outlines critical technical, operational, and commercial risks associated with the implementation and presentation of the `idle-warehouse-dashboard` slice, detailing explicit preventative controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:---|:---:|:---:|:---|
| **Executive Discovery Credibility Loss via Live Credential Prompts**: Presenting a dashboard that prompts for live Snowflake account credentials or API tokens during an executive workshop violates client infosec protocols and disrupts the meeting. | High | Low | The presentation layer operates in zero-dependency standalone mode (`dataContext.mode = "artifact"`). All live connection buttons and credential forms are explicitly hidden or omitted from `StandaloneDashboardApp.tsx`, resolving data exclusively through `StaticDataAdapter` (`AC-1`). |
| **Premature Execution of Destructive Remediation**: Workshop attendees mistake directional recommendations (e.g., configuring aggressive auto-suspend on `FINANCE_REPORTING_WH`) for immediate automated changes and attempt to apply them without owner validation. | High | Low | Enforce explicit directional framing across the UI: every recommendation card and export artifact states that savings are directional until validated by designated warehouse owners. Automated or destructive execution hooks are strictly prohibited (`AC-4`). |
| **Mistaking Synthetic Figures for Real Client Data**: Prospective buyers or compliance officers mistake synthetic demonstration figures for audited production Snowflake billing data, risking regulatory confusion or audit exposure. | High | Low | Mandate persistent, unsuppressed disclosure elements (`data-disclosure="synthetic-demo-data"`) displaying `"Synthetic demo data"` across header badges, quality cards, print-to-PDF views, and same-day follow-up HTML exports (`AC-3`, `AC-5`). |
| **Browser Smoke Gate Selector Drift**: Uncoordinated CSS or DOM refactoring modifies selectors or removes contract markers, causing automated browser smoke runners or CI gates to fail. | High | Low | The browser smoke manifest `tests/browser_smoke_manifest.json` is strictly pinned and immutable. Implementation preserves exact DOM attributes (`data-scenario="idle-warehouse-waste"`, `data-readiness="controlled"`, `data-action="open-recommendation-queue"`, `data-status="recommendation-queue"`), verified via `tests/browser_smoke_check.py` (`AC-2`, `AC-6`). |
| **Secondary Renderer Fragmentation**: Adding bespoke chart components or custom recommendation tables that bypass the canonical `DataAdapter` and `DashboardSpec` pipeline fragments the architecture and breaks Phase 6 production binding readiness. | High | Low | Mandate that all widgets query data strictly through `createDashboardDataAdapter` using `query()`, `aggregate()`, and `getSchema()`. Direct imports of mock fixtures or raw JSON within view components are strictly prohibited by lint rules and code reviews (`AC-1`, `AC-8`). |
| **Production Bundle Marker Stripping During Minification**: Tree-shaking, dead-code elimination, or Terser mangling in the Vite production build strips essential contract marker strings from bundled assets. | Medium | Low | Maintain explicit string literals in DOM attributes and data structures within `StandaloneDashboardApp.tsx`. Plan Item 6 enforces automated post-build verification of `frontend/dist/assets/*.js` for all required marker strings (`AC-6`). |
| **Backend or Sibling Repository Contamination**: Modifications in the frontend slice inadvertently alter Python files in `src/dashForge/` or sibling project `dataForge/`. | High | Low | Strict enforcement of step write boundaries. Automated test `test_dataforge_unmodified` asserts git cleanliness of `dataForge/`, and acceptance check `AC-8` requires zero modifications to Python generation or extraction layers. |
| **Pytest Runner Failure via PYTHONPATH Inconsistency**: Invoking pytest with an explicit `PYTHONPATH` override masks import failures or alters package discovery across different agent environments. | Medium | Low | All test commands in this plan and the user journey manifest enforce `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override, guaranteeing uniform behavior across execution contexts (`AC-8`). |
| **Unverified Artifact Digest Presentation**: An operator loads a scenario snapshot with an unverified or mismatched SHA-256 digest, presenting ungrounded or tampered metrics to executive stakeholders. | High | Low | `SyntheticDataArtifactAdapter` validates the artifact digest against `IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST`. On mismatch, the runtime transitions to `data-readiness="blocking"`, withholds dashboard rendering, and disables follow-up exports (`AC-2`). |

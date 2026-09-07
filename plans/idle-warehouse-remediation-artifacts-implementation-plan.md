# Idle Warehouse Remediation Artifacts Implementation Plan

## Executive Summary & Slice Intent

The `idle-warehouse-remediation-artifacts` vertical slice advances DashForge's Snowflake Cost Management solution (`snowflakeCost:idle-warehouse-waste`) by bridging analytical discovery and concrete operational action. DashForge functions as an internal enterprise consulting delivery accelerator for Anblicks analytics consultants, client delivery leads, and data engineering practice directors conducting high-stakes executive discovery workshops with prospective buyers—specifically Chief Financial Officers (CFOs), Chief Information Officers (CIOs), VPs of Data and Analytics, and enterprise FinOps practice leaders.

In typical cloud cost optimization workshops, consultants face a critical operational dilemma: prospective enterprise buyers cannot provide access to production Snowflake accounts due to stringent infosec, data privacy, and compliance restrictions. Furthermore, when consultants demonstrate compute waste using existing dashboards, buyers frequently experience operational risk paralysis—fearing that changing warehouse settings or suspension timeouts will inadvertently break critical ETL pipelines, executive reporting, or ad-hoc analytics queries. Finally, even after an executive agrees in principle to address identified waste, consultants traditionally face an administrative delay: leaving the workshop, manually compiling notes, calculating potential savings, and writing SQL remediation scripts. This delay dissipates urgency and disconnects consulting findings from engineering execution.

**Slice Intent:** Deliver prioritized low-risk recommendations and same-day follow-up artifacts for the idle warehouse dashboard. This enables the buyer to immediately act on identified waste without leaving the application. Existing dashboard functionality and generation flows must not change.

Every acceptance check defined in `docs/idle-warehouse-remediation-artifacts-contract.md` (`AC-1` through `AC-6`) maps directly to a concrete plan item, verified through automated frontend tests, Python regression checks, production bundle marker audits, and direct argv execution from the workspace root.

---

## Architecture

The architecture of the `idle-warehouse-remediation-artifacts` slice establishes a self-contained, browser-executable operational loop that translates idle warehouse telemetry into prioritized, owner-validated remediation deliverables. In strict alignment with DashForge's foundational architectural principle—**components never know where data comes from**—all presentation enhancements, recommendation queues, and artifact generators consume data through the canonical `DataAdapter` abstraction layer, preserving complete architectural decoupling without secondary renderers, ad-hoc charting engines, or live cloud dependencies.

### System Overview & Runtime Seams

The operational topology and data flow within the browser presentation runtime are structured as follows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Packaged Backend Slice & Snapshot                     │
│  src/dashForge/idle_warehouse_waste.py & snowflake_cost.py                  │
│    ├── 7 Relational Datasets: executive_summary, warehouse_metering_history,│
│    │   query_history, metering_history, database_storage_usage_history,     │
│    │   show_warehouses, recommendation_queue                                │
│    └── Cryptographic Work-Package Digest:                                   │
│        sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Packaged scenario snapshot)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   DashboardSpec & DataAdapter Runtime Seams                 │
│  frontend/src/core/data/createDashboardDataAdapter.ts                       │
│    ├── StaticDataAdapter: Deterministic in-memory querying & aggregation    │
│    └── SyntheticDataArtifactAdapter: Verifies claim ledger & digest integrity│
│  frontend/src/core/spec/dashboardSchema.ts & dashboardSpec.ts               │
│    ├── DashboardSpec: Canonical layout, widget specifications, data context │
│    └── Claim Ledger: Material claims anchored to verified artifact digest   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Standalone Dashboard Presentation & Remediation Tier            │
│  frontend/src/features/runtime/StandaloneDashboardApp.tsx                   │
│    ├── URL Scenario Resolver: /?scenario=idle-warehouse-waste               │
│    ├── Controlled Readiness State: data-readiness="controlled"              │
│    ├── Persistent Synthetic Disclosure: data-disclosure="synthetic-demo-data"│
│    │                                                                        │
│    ├── TVIQ Executive Narrative:                                            │
│    │   ├── Time-to-Value: Instant offline boot; zero infosec onboarding delay│
│    │   ├── Impact: 726 monthly credits waste; 2 idle warehouses;            │
│    │   │           FINANCE_REPORTING_WH (>50% compute credit concentration)  │
│    │   └── Quality: Verified digest citations; directional owner guardrails │
│    │                                                                        │
│    ├── Action Queue: data-status="recommendation-queue"                     │
│    │   ├── Prioritized Low-Risk Ordering: FINANCE_REPORTING_WH (P0) first   │
│    │   ├── Governance: severity, owner, action, evidence, guardrail         │
│    │   └── Safety: Explicit directional framing until validated by owner   │
│    │                                                                        │
│    └── Same-Day Deliverables:                                               │
│        ├── Follow-Up Generator: data-action="same-day-executive-follow-up"   │
│        │   └── Decision-ready remediation export with digest citations       │
│        └── Landscape PDF Print: data-testid="dashboard-save-pdf"            │
│            └── Formatted executive deck preserving synthetic disclosures    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TVIQ Data Presentation & Remediation Architecture

The presentation layer structures executive data and actionable recommendations around the TVIQ (Time-to-Value, Impact, Quality) framework:

1. **Time-to-Value (T)**:
   - Eliminates the customary 3-4 week security review and credential negotiation phase by running entirely offline from packaged scenario snapshots.
   - The standalone dashboard mounts directly at `/?scenario=idle-warehouse-waste`, enabling consultants to transition from discovery to remediation planning within minutes.
   - The interactive recommendation queue (`data-action="open-recommendation-queue"`) surfaces minimal-risk optimizations immediately, presenting `FINANCE_REPORTING_WH` (`IWW-001`, Priority `P0`) first.

2. **Impact (I)**:
   - **Headline Opportunity**: Highlights **726 compute credits/month** in recoverable spend across unmonitored infrastructure.
   - **Idle Infrastructure Count**: Pinpoints **2 compute warehouses** actively running 24/7 with zero active query workload during the evaluation window.
   - **Credit Concentration**: Visualizes that `FINANCE_REPORTING_WH` accounts for over 50% of total compute credit consumption, making it the primary candidate for high-yield, low-risk remediation.
   - **Control Gap Analysis**: Exposes disabled auto-suspend (`auto_suspend = 0`), excessive suspension timeouts (≥3600 seconds), and unassigned resource monitors.

3. **Quality (Q)**:
   - **Tamper-Evident Digest Integrity**: Grounds all displayed metrics and recommendations in the verified upstream work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`).
   - **Controlled Readiness**: Sets `data-readiness="controlled"` only upon successful verification of the claim ledger. Unverified or mismatched digests trigger fail-closed blocking status (`data-readiness="blocking"`), withholding dashboard presentation and preventing ungrounded claims.
   - **Directional Validation Guardrails**: Protects against operational disruption by mandating that all projected savings and configuration changes are framed as directional pending confirmation from designated warehouse owners.
   - **Unsuppressed Disclosures**: Mandates persistent, unsuppressed disclosure elements (`data-disclosure="synthetic-demo-data"`) displaying `"Synthetic demo data"` across header badges, quality cards, print views, and exported follow-up artifacts.

### Actionable Same-Day Follow-Up Artifact Pipeline

To eliminate post-meeting friction and ensure immediate alignment between consulting proposals and client engineering execution, the application incorporates an in-browser artifact generation pipeline:

- **Interactive Follow-Up Trigger (`data-action="same-day-executive-follow-up"`)**: Accessible directly from the dashboard header, triggering immediate client-side assembly of a decision-ready follow-up document.
- **Follow-Up State Signaling (`data-status="executive-follow-up"`)**: Signals readiness upon completion with confirmation text `"Follow-up artifact is ready"`.
- **Structured Deliverable Content**:
  - Exact headline metrics: 726 compute credits monthly opportunity, 2 idle warehouses requiring policy review.
  - Credit concentration analysis: Explicitly identifying that `FINANCE_REPORTING_WH` accounts for >50% of warehouse compute credits.
  - Prioritized low-risk recommendations: Ordered by severity (`P0` first), listing specific warehouse targets, recommended configurations (e.g., auto-suspend to 300 seconds, resource monitor assignment), suggested organizational owners, and protective guardrail constraints.
  - Verifiable claim citations: Anchoring each observation directly to `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390` with dataset observation references (e.g., `recommendation_queue/IWW-001`).
  - Persistent synthetic data disclosure: Prominently displaying `<strong>Synthetic demo data</strong>` and controlled quality state metadata.

### Component Touchpoints & Architectural Boundaries

1. `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
   - Acts as the primary application presentation surface, handling URL scenario mounting (`?scenario=idle-warehouse-waste`), DOM readiness signaling (`data-readiness="controlled"`), and persistent disclosures (`data-disclosure="synthetic-demo-data"`).
   - Manages recommendation queue state, expanding container `[data-status="recommendation-queue"]` on click of `[data-action="open-recommendation-queue"]`.
   - Houses the same-day executive follow-up generator (`buildExecutiveFollowUpHtml`) and landscape PDF print action (`data-testid="dashboard-save-pdf"`).

2. `frontend/src/features/runtime/idleWarehousePresentation.ts`:
   - Queries `executive_summary`, `recommendation_queue`, `show_warehouses`, and `warehouse_metering_history` via `createDashboardDataAdapter`.
   - Computes headline metrics, warehouse concentration ratios, and recommendation models while preserving all six canonical governance fields.

3. `frontend/src/features/runtime/standaloneDashboard.ts`:
   - Formulates the canonical `DashboardSpec` and `DashboardClaimLedger` for the idle warehouse scenario, linking widgets to verified artifact digests.

4. `frontend/src/core/data/StaticDataAdapter.ts` & `SyntheticDataArtifactAdapter.ts`:
   - Provides deterministic in-memory relational query execution, schema inspection, and claim verification without live cloud connections.

5. Sibling Project `dataForge`:
   - Remains strictly read-only and untouched. All generation and packaging logic continues to execute through existing DashForge Python bridges.

---

## Concrete Plan Items & Work Breakdown

The implementation of the `idle-warehouse-remediation-artifacts` slice is organized into six concrete, sequentially verifiable plan items directly mapped to contract acceptance checks `AC-1` through `AC-6`:

### Plan Item 1: Prioritized Low-Risk Remediation Recommendations & Directional Framing (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The idle warehouse dashboard renders prioritized, low-risk remediation recommendations derived from the canonical `recommendation_queue` dataset, presenting low performance risk actions (`performance_risk`: "minimal" or "low") prominently with priority ordering (listing `FINANCE_REPORTING_WH`, `IWW-001`, Priority `P0` first), displaying all six required governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and protective `guardrail`), and explicitly framing all projected credit savings as directional until validated by designated warehouse owners.")
- **Objective**: Ensure the standalone idle warehouse dashboard renders prioritized low-risk recommendations derived from the canonical `recommendation_queue` dataset, prioritizing minimal performance risk actions (`FINANCE_REPORTING_WH`, `IWW-001`, Priority `P0` first), rendering all six required governance fields, and explicitly framing all projected credit savings as directional until validated by designated warehouse owners.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/idleWarehousePresentation.ts`: Ensure `loadIdleWarehousePresentation` queries all required columns from `recommendation_queue` (`recommendation_id`, `executive_severity`, `scope_name`, `recommendation_type`, `recommended_action`, `suggested_owner`, `estimated_monthly_credit_savings_high`, `performance_risk`, `guardrail`).
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Ensure `[data-action="open-recommendation-queue"]` toggles `recommendationQueueOpen`.
    - Render expanded section `[data-status="recommendation-queue"]` with `id="recommendation-queue"` and `role="region"`.
    - Order recommendations such that `FINANCE_REPORTING_WH` (`IWW-001`, `P0`, minimal risk) is rendered first in the list.
    - Render all six governance fields for each recommendation item: `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail` (scope name, type, and estimated savings), and `guardrail`.
    - Display prominent directional safety notice: `"Recommendations are directional until validated. Require owner validation before changing warehouse availability or suspension policy."`
- **Deliverables**: Prioritized, low-risk recommendation queue in the standalone dashboard with complete governance attributes and directional validation notices.

### Plan Item 2: Same-Day Executive Follow-Up Remediation Artifact Generation (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The application provides interactive same-day follow-up artifact generation directly from the dashboard interface via `data-action=\"same-day-executive-follow-up\"`, producing structured, decision-ready remediation deliverables that capture headline metrics (726 compute credits monthly opportunity, 2 idle warehouses, FINANCE_REPORTING_WH credit concentration >50%), prioritized low-risk actions, suggested organizational owners, guardrail terms, and verifiable claim citations anchored to the verified work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`) without requiring the user to leave the application.")
- **Objective**: Provide interactive same-day follow-up artifact generation directly from the dashboard interface via `data-action="same-day-executive-follow-up"`, producing structured, decision-ready remediation deliverables that capture headline metrics (726 compute credits monthly opportunity, 2 idle warehouses, `FINANCE_REPORTING_WH` credit concentration >50%), prioritized low-risk actions, suggested organizational owners, guardrail terms, and verifiable claim citations anchored to `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390` without requiring the user to leave the application.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Provide interactive button `[data-action="same-day-executive-follow-up"]` with `data-testid="same-day-executive-follow-up"`.
    - Wire click handler to generate follow-up HTML payload via `buildExecutiveFollowUpHtml` and open decision-ready modal/window.
    - Set follow-up status element `[data-status="executive-follow-up"]` displaying `"Follow-up artifact is ready"`.
    - Ensure generated follow-up artifact HTML encapsulates:
      1. Title: `"Same-day executive follow-up for Idle Warehouse Waste Remediation"`.
      2. Headline Opportunity: `"High-end monthly opportunity: 726 credits."`
      3. Idle Warehouse Count: `"Idle warehouse count requiring review: 2."`
      4. Concentration: `"Cost concentration: FINANCE_REPORTING_WH dominates warehouse credits in the review window."`
      5. Prioritized low-risk recommendations: Ordered with `P0` first, detailing warehouse, action, suggested owner, guardrail, and dataset observation claim citations.
      6. Verified artifact digest citation: `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`.
      7. Notice that real/client mode remains disabled until approved metadata or exports exist.
- **Deliverables**: Fully functional same-day follow-up artifact generation mechanism accessible from the dashboard interface.

### Plan Item 3: Persistent & Unsuppressed Synthetic Demo Data Disclosures (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("All generated remediation artifacts, export deliverables, print views (`data-testid=\"dashboard-save-pdf\"`), and dashboard presentation views prominently display the unsuppressed disclosure element `data-disclosure=\"synthetic-demo-data\"` with the exact text `\"Synthetic demo data\"`, accompanied by upstream artifact digest citations and controlled quality state metadata, preventing synthetic workshop demonstrations from being misrepresented as live customer production telemetry.")
- **Objective**: Ensure that all generated remediation artifacts, export deliverables, print views (`data-testid="dashboard-save-pdf"`), and dashboard presentation views prominently display the unsuppressed disclosure element `data-disclosure="synthetic-demo-data"` with the exact text `"Synthetic demo data"`, accompanied by upstream artifact digest citations and controlled quality state metadata.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Maintain header provenance badge `<p className="standalone-provenance" data-disclosure="synthetic-demo-data" data-provenance="synthetic-demo-data"><strong>Synthetic demo data</strong></p>`.
    - Maintain quality card `<section className="standalone-quality" data-testid="synthetic-quality-disclosure">` displaying exact text `"Synthetic demo data"`, summary `"Controlled synthetic-data quality"`, and digest `<code>sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390</code>`.
    - Include unsuppressed disclosure in `buildExecutiveFollowUpHtml`: `<p><strong>Synthetic demo data</strong> — ...</p>`.
    - Ensure print-to-PDF export (`data-testid="dashboard-save-pdf"`) via `exportDashboardArtifact` preserves disclosure headers, quality metadata, and claim citations.
- **Deliverables**: Prominent, unsuppressed synthetic data disclosures across all presentation views and export deliverables.

### Plan Item 4: Frontend Production Build Conformance & Browser Smoke Gate Markers (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The frontend production build compiled via `npm --prefix frontend run build` generates optimized static assets under `frontend/dist/` with zero TypeScript compilation errors, and strictly preserves the contract markers (`\"idle-warehouse-waste\"`, `\"synthetic-demo-data\"`, `\"open-recommendation-queue\"`, and `\"recommendation-queue\"`) validated by `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py` without introducing secondary renderers, backend services, or live cloud credentials.")
- **Objective**: Verify that the frontend production build compiled via `npm --prefix frontend run build` generates optimized static assets under `frontend/dist/` with zero TypeScript compilation errors, and strictly preserves the contract markers (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`) validated by `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py` without introducing secondary renderers, backend services, or live cloud credentials.
- **Implementation Scope & Seams**:
  - In `frontend/dist/index.html`: Assert presence of mount element `<div id="root"></div>`.
  - In `frontend/dist/assets/*.js`: Assert that compiled bundles retain exact marker literals:
    1. `"idle-warehouse-waste"`
    2. `"synthetic-demo-data"`
    3. `"open-recommendation-queue"`
    4. `"recommendation-queue"`
  - Conformance with `tests/browser_smoke_manifest.json`:
    - URL: `http://127.0.0.1:4173/?scenario=idle-warehouse-waste`
    - Ready selector: `[data-scenario='idle-warehouse-waste'][data-readiness='controlled'] [data-disclosure='synthetic-demo-data']`
    - Action: `click` on `[data-action='open-recommendation-queue']`
    - Success: `[data-status='recommendation-queue']` containing `"FINANCE_REPORTING_WH"`.
  - Zero live credentials: Prohibit live Snowflake inputs (`password`, `account_identifier`, `private_key`).
- **Deliverables**: Clean production bundle build in `frontend/dist/` conforming to browser smoke gate markers.

### Plan Item 5: Verbatim Workspace-Root Command Execution & User Journey Traceability (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("All operational, verification, and test commands declared in `journeys/user_journeys_manifest.json` are runnable verbatim from the workspace root using direct argv execution (`shell=False`), enforcing the exact prefix `env PYTHONPATH=src python3 -m dashForge.main` for application CLI commands, `npm --prefix frontend test -- --run` for browser-visible frontend tests, and `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override for Python test execution, with complete traceability across all acceptance checks (`AC-1` through `AC-6`).")
- **Objective**: Ensure all operational, verification, and test commands declared in `journeys/user_journeys_manifest.json` are runnable verbatim from the workspace root using direct argv execution (`shell=False`), enforcing exact command forms: `env PYTHONPATH=src python3 -m dashForge.main` for application CLI, `npm --prefix frontend test -- --run` for frontend tests, and `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override for Python test execution, with complete traceability across all acceptance checks (`AC-1` through `AC-6`).
- **Implementation Scope & Seams**:
  - In `journeys/user_journeys_manifest.json`:
    - Confirm `command_allowlist` contains exact allowlisted prefixes:
      - `"env PYTHONPATH=src python3 -m dashForge.main"`
      - `"python3 -m pytest tests/ -q"`
      - `"python3 -m pytest"`
      - `"npm --prefix frontend test -- --run"`
    - Confirm all six user journeys declare valid authorities (`human`, `mission`, `author`) and status (`passed`).
    - Eliminate all shell constructs (`|`, `&&`, `||`, `;`, `<`, `>`) from journey commands.
    - Confirm full bidirectional traceability across all acceptance checks (`AC-1` through `AC-6`).
- **Deliverables**: Verbatim executable user journeys manifest with 100% acceptance check coverage and zero dangling traces.

### Plan Item 6: Preservation of Existing Dashboard Functionality & Regression Safety (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("Existing dashboard functionality, URL scenario resolution (`/?scenario=idle-warehouse-waste`), and deterministic CLI data generation workflows remain fully preserved; existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost`), fail-closed overwrite protection, and automated test suites pass cleanly with zero regressions, and sibling project `dataForge` remains strictly untouched.")
- **Objective**: Guarantee that existing dashboard functionality, URL scenario resolution (`/?scenario=idle-warehouse-waste`), and deterministic CLI data generation workflows remain fully preserved; existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost`), fail-closed overwrite protection, and automated test suites pass cleanly with zero regressions, and sibling project `dataForge` remains strictly untouched.
- **Implementation Scope & Seams**:
  - Enforce zero modifications in `src/dashForge/` generation algorithms and sibling repository `../dataForge`.
  - Verify deterministic CLI generation: `env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/rem-verify.sqlite --snapshot-output /tmp/rem-verify.snapshot.json --force`.
  - Verify fail-closed overwrite protection: invoking CLI generate without `--force` on existing paths exits with code 2 and actionable diagnostic messages.
  - Verify existing pack generation (`healthcare:flu-season`, `financial:market-downturn`, `saas:churn-crisis`).
  - Execute full regression test suites: `python3 -m pytest tests/ -q` and `npm --prefix frontend test -- --run`.
- **Deliverables**: Verified regression safety across all industry packs, deterministic generation pipelines, and sibling repository isolation.

---

### Acceptance Check Traceability Matrix

The following matrix provides comprehensive, bidirectional mapping between contract acceptance checks (`AC-1` through `AC-6`), concrete plan items, user journeys, implementation touchpoints, and verification commands:

| Acceptance Check | Concrete Plan Item | User Journey ID | Primary Implementation Touchpoints | Verification Command & Assertion Target |
|:---|:---|:---|:---|:---|
| **AC-1** | Plan Item 1: Prioritized Low-Risk Recommendations & Directional Framing | `journey-remediation-low-risk-queue` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `frontend/src/features/runtime/idleWarehousePresentation.ts` | `npm --prefix frontend test -- --run -t "StandaloneDashboardApp"` & `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac4_finance_reporting_wh_p0_priority_ordered_first` |
| **AC-2** | Plan Item 2: Same-Day Executive Follow-Up Artifact Generation | `journey-remediation-same-day-follow-up` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `frontend/src/features/runtime/idleWarehousePresentation.ts` | `npm --prefix frontend test -- --run -t "StandaloneDashboardApp"` & `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac5_executive_follow_up_payload_integrity` |
| **AC-3** | Plan Item 3: Persistent & Unsuppressed Synthetic Demo Data Disclosures | `journey-remediation-same-day-follow-up`, `journey-remediation-synthetic-disclosures` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `frontend/src/features/export/meetingDashboardPackage.ts` | `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf` |
| **AC-4** | Plan Item 4: Frontend Production Build & Browser Smoke Gate Markers | `journey-remediation-low-risk-queue`, `journey-remediation-production-smoke-conformance` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `tests/browser_smoke_manifest.json`, `tests/browser_smoke_check.py` | `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac6_production_bundle_contract_markers_conformance` & `npm --prefix frontend run build` |
| **AC-5** | Plan Item 5: Verbatim Workspace-Root Command Execution & Journey Traceability | `journey-remediation-verbatim-cli-execution` | `journeys/user_journeys_manifest.json`, `src/dashForge/main.py` | `env PYTHONPATH=src python3 -m dashForge.main --help` |
| **AC-6** | Plan Item 6: Existing Dashboard Functionality & Regression Safety | `journey-remediation-regression-and-generation-safety` | `src/dashForge/main.py`, `src/dashForge/idle_warehouse_waste.py`, `tests/test_idle_warehouse_waste.py` | `env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/rem-verify.sqlite --snapshot-output /tmp/rem-verify.snapshot.json --force` & `python3 -m pytest tests/test_idle_warehouse_waste.py -q` |

---

## Tests

The testing architecture for the `idle-warehouse-remediation-artifacts` slice implements a deterministic, multi-tiered validation strategy spanning frontend component tests, Python contract assertions, production bundle inspection, and user journey simulation.

### 1. Frontend Unit and Integration Test Suite

The frontend test suite is executed using Vitest and Testing Library via `npm --prefix frontend test -- --run` across all 35 test files and 108+ tests:

- **Scenario Resolution & Standalone Mounting (`StandaloneDashboardApp.test.tsx`)**:
  - `uses the idle scenario requested by the browser URL`: Simulates navigation to `/?scenario=idle-warehouse-waste`, confirming that the root container receives `data-scenario="idle-warehouse-waste"` and `data-readiness="controlled"`.
- **Low-Risk Recommendation Prioritization & Governance Fields (`StandaloneDashboardApp.test.tsx`)**:
  - `opens and focuses the prioritized recommendation queue`: Verifies that clicking `[data-action="open-recommendation-queue"]` sets `aria-expanded="true"`, renders `[data-status="recommendation-queue"]`, displays priority `P0`, places `FINANCE_REPORTING_WH` (`IWW-001`) first, and renders all governance fields (`executive_severity`, `suggested_owner`, `recommended_action`, `guardrail`).
  - Verifies that savings are explicitly framed as directional pending owner validation.
- **Same-Day Executive Follow-Up Artifact Generation (`StandaloneDashboardApp.test.tsx`)**:
  - `triggers same-day executive follow-up export`: Verifies that clicking `[data-action="same-day-executive-follow-up"]` opens a follow-up document carrying `"Synthetic demo data"` disclosures, headline opportunity metrics (726 compute credits), idle warehouse count (2), dominant cost concentration in `FINANCE_REPORTING_WH`, and verified artifact digest citations `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`, while setting `[data-status="executive-follow-up"]`.
- **Landscape Print View Export (`StandaloneDashboardApp.test.tsx`)**:
  - `triggers landscape print view export`: Verifies that clicking `[data-testid="dashboard-save-pdf"]` opens the print preview preserving synthetic disclosures and evidence citations.
- **Controlled Quality State & Blocking Refusal (`StandaloneDashboardApp.test.tsx`)**:
  - `shows blocking quality and withholds the dashboard for an unverified digest`: Injects an unverified artifact digest, confirming that `data-readiness="blocking"` is applied, alerts are displayed, and dashboard rendering is halted.

### 2. Automated Python Test Suite

The Python test suite is executed via `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override:

- **Contract Constants & Metadata (`tests/test_idle_warehouse_dashboard.py`)**:
  - `test_ac1_standalone_dashboard_constants_and_default_spec`: Asserts canonical scenario ID (`idle-warehouse-waste`), pack ID (`snowflakeCost`), and artifact mode.
  - `test_ac1_zero_live_credentials_or_backend_network_calls`: Asserts absence of password inputs, account identifiers, or live connection forms.
- **Digest Integrity & Claim Coverage (`tests/test_idle_warehouse_dashboard.py`, `tests/test_idle_warehouse_waste.py`)**:
  - `test_ac2_claim_ledger_anchored_to_verified_digest`: Asserts that all metric and recommendation claims anchor to `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`.
- **Persistent Synthetic Disclosure (`tests/test_idle_warehouse_dashboard.py`)**:
  - `test_ac3_persistent_unsuppressed_synthetic_disclosure`: Asserts presence of `data-disclosure="synthetic-demo-data"` and exact text `"Synthetic demo data"`.
  - `test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf`: Asserts synthetic disclosures in follow-up HTML and exported packages.
- **Low-Risk Recommendation Ordering & Guardrails (`tests/test_idle_warehouse_dashboard.py`)**:
  - `test_ac4_finance_reporting_wh_p0_priority_ordered_first`: Asserts that `recommendation_queue` places `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) at index 0.
  - `test_ac4_recommendation_governance_fields_displayed`: Asserts rendering of all six governance fields.
  - `test_ac4_directional_validation_guardrails_enforced`: Asserts directional framing in presentation source.
- **Same-Day Follow-Up Payload Integrity (`tests/test_idle_warehouse_dashboard.py`)**:
  - `test_ac5_executive_follow_up_payload_integrity`: Asserts that `buildExecutiveFollowUpHtml` captures opportunity (726 credits), idle count (2), credit concentration, and digest citations.
- **Production Bundle Conformance (`tests/test_idle_warehouse_dashboard.py`)**:
  - `test_ac6_production_bundle_contract_markers_conformance`: Asserts all four contract markers exist in compiled `frontend/dist/assets/*.js`.
- **Multi-Pack & Sibling Repository Regressions (`tests/test_idle_warehouse_waste.py`)**:
  - `test_existing_packs_unaffected`: Asserts that healthcare, financial, and SaaS packs generate without regressions.
  - `test_dataforge_unmodified`: Asserts sibling repository `dataForge` remains clean and unmodified.

### 3. Browser Smoke Gate & Contract Marker Suite

- **Smoke Manifest (`tests/browser_smoke_manifest.json`)**:
  - Enforces target URL `http://127.0.0.1:4173/?scenario=idle-warehouse-waste`.
  - Enforces ready selector `[data-scenario='idle-warehouse-waste'][data-readiness='controlled'] [data-disclosure='synthetic-demo-data']`.
  - Enforces click action on `[data-action='open-recommendation-queue']`.
  - Enforces success selector `[data-status='recommendation-queue']` containing `"FINANCE_REPORTING_WH"`.
- **Smoke Check Script (`tests/browser_smoke_check.py`)**:
  - Verifies presence of `#root` mount element in served index.
  - Verifies that compiled bundles in `frontend/dist/assets/*.js` contain `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`.

### 4. User Journey Simulation Suite

The user journey simulation verifies that all six journeys in `journeys/user_journeys_manifest.json` execute cleanly under direct argv invocation:
- `journey-remediation-low-risk-queue`: Inspects low-risk recommendation ordering and directional framing (`AC-1`, `AC-4`).
- `journey-remediation-same-day-follow-up`: Generates same-day executive follow-up artifact and verifies payload integrity (`AC-2`, `AC-3`).
- `journey-remediation-synthetic-disclosures`: Verifies unsuppressed synthetic data disclosures across views (`AC-3`).
- `journey-remediation-production-smoke-conformance`: Verifies production build assets and smoke contract markers (`AC-4`).
- `journey-remediation-verbatim-cli-execution`: Verifies workspace-root CLI help execution (`AC-5`).
- `journey-remediation-regression-and-generation-safety`: Verifies deterministic scenario generation and Python regression test execution (`AC-6`).

---

## Verification

The verification protocol executes ten deterministic verification steps from the workspace root to confirm all six acceptance checks (`AC-1` through `AC-6`):

### Step 1: Verify Prioritized Low-Risk Recommendations & Directional Framing (`AC-1`)
Execute the targeted frontend test verifying recommendation queue rendering and priority ordering:
```bash
npm --prefix frontend test -- --run -t "opens and focuses the prioritized recommendation queue"
```
- **Expected Result**: Exits with code 0. Verifies that `FINANCE_REPORTING_WH` (`IWW-001`, Priority `P0`, minimal risk) is ordered first, all governance fields are displayed, and directional framing is rendered.

Execute targeted Python check:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac4_finance_reporting_wh_p0_priority_ordered_first
```
- **Expected Result**: Exits with code 0. Confirms snapshot dataset orders `FINANCE_REPORTING_WH` first.

### Step 2: Verify Same-Day Executive Follow-Up Artifact Generation (`AC-2`)
Execute targeted frontend test for executive follow-up export:
```bash
npm --prefix frontend test -- --run -t "triggers same-day executive follow-up export"
```
- **Expected Result**: Exits with code 0. Verifies clicking `[data-action="same-day-executive-follow-up"]` generates follow-up artifact containing headline opportunity (726 credits), idle warehouse count (2), concentration in `FINANCE_REPORTING_WH`, and digest citation.

Execute targeted Python payload integrity assertion:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac5_executive_follow_up_payload_integrity
```
- **Expected Result**: Exits with code 0. Confirms follow-up HTML generator contract.

### Step 3: Verify Persistent & Unsuppressed Synthetic Disclosures (`AC-3`)
Execute targeted Python checks for synthetic demo data disclosures:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_persistent_unsuppressed_synthetic_disclosure
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf
```
- **Expected Result**: Both exit with code 0. Confirms unsuppressed `data-disclosure="synthetic-demo-data"` and exact text `"Synthetic demo data"` across views, print layouts, and follow-up payloads.

### Step 4: Verify Frontend Production Build Compilation (`AC-4`)
Execute the production build:
```bash
npm --prefix frontend run build
```
- **Expected Result**: Exits with code 0. Zero TypeScript compilation errors; compiles static assets into `frontend/dist/index.html` and bundles under `frontend/dist/assets/`.

### Step 5: Verify Browser Smoke Gate Contract Markers (`AC-4`)
Inspect compiled JavaScript bundles for all four required contract markers:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac6_production_bundle_contract_markers_conformance
```
- **Expected Result**: Exits with code 0. Confirms `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"` are present in production assets.

### Step 6: Verify Verbatim Workspace-Root CLI Execution (`AC-5`)
Execute CLI help from the workspace root using direct argv execution:
```bash
env PYTHONPATH=src python3 -m dashForge.main --help
```
- **Expected Result**: Exits with code 0. Outputs standard help text without shell pipelines or unhandled tracebacks.

### Step 7: Verify Deterministic CLI Generation Pipeline (`AC-6`)
Execute deterministic generation for the idle warehouse scenario:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/rem-verify.sqlite \
  --snapshot-output /tmp/rem-verify.snapshot.json \
  --force
```
- **Expected Result**: Exits with code 0. Generates SQLite database containing all seven tables and JSON snapshot matching canonical schemas.

### Step 8: Verify Multi-Pack Backwards Compatibility (`AC-6`)
Execute multi-pack generation regression check:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac8_backwards_compatibility_existing_packs
```
- **Expected Result**: Exits with code 0. Healthcare, financial, and SaaS packs generate cleanly.

### Step 9: Verify Sibling Repository Isolation (`AC-6`)
Execute sibling repository status check:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac8_sibling_dataforge_unmodified
```
- **Expected Result**: Exits with code 0. Sibling repository `dataForge` remains clean with zero uncommitted changes.

### Step 10: Execute Complete Test Suites (`AC-5`, `AC-6`)
Execute full frontend test suite:
```bash
npm --prefix frontend test -- --run
```
- **Expected Result**: Exits with code 0. All 35 test files pass cleanly.

Execute targeted idle warehouse regression suite with NO `PYTHONPATH` override:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py tests/test_idle_warehouse_waste.py -q
```
- **Expected Result**: Exits with code 0. All 66 tests pass cleanly.

---

## Risks

The following risk assessment details critical technical, architectural, and operational risks associated with delivering the `idle-warehouse-remediation-artifacts` vertical slice, establishing concrete preventative controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:---|:---:|:---:|:---|
| **Executive Change Inertia & Operational Paralyzation**: Prospective enterprise buyers viewing waste figures hesitate to act due to fears of breaking production pipelines or scheduled reports. | High | Low | Recommendations are explicitly framed as low performance risk (`performance_risk`: "minimal" or "low"), listing `FINANCE_REPORTING_WH` (`P0`) first. All projected savings and configurations are framed as directional pending confirmation from designated warehouse owners (`AC-1`). |
| **Premature or Destructive Configuration Changes**: Workshop participants mistake directional recommendations for immediate automated changes, attempting to alter cloud infrastructure without owner validation. | High | Low | Enforce protective guardrail terms on every recommendation card and generated export. The dashboard strictly omits automated execution hooks or live mutation APIs (`AC-1`, `AC-2`). |
| **Misrepresentation of Synthetic Figures as Real Telemetry**: Stakeholders or audit teams mistake synthetic demonstration figures for audited production Snowflake billing data, creating compliance exposure. | High | Low | Mandate persistent, unsuppressed disclosure elements (`data-disclosure="synthetic-demo-data"`) displaying `"Synthetic demo data"` across header badges, quality cards, print views, and follow-up exports (`AC-3`). |
| **Post-Meeting Alignment Decay**: Delays in compiling workshop findings into deliverables lead to lost momentum and disconnect between consulting proposals and engineering follow-through. | High | Low | Integrated same-day follow-up artifact generation (`data-action="same-day-executive-follow-up"`) immediately produces exportable, decision-ready remediation packages with digest citations before leaving the room (`AC-2`). |
| **Production Bundle Marker Stripping During Minification**: Vite/Terser tree-shaking or mangling strips essential contract marker strings from compiled static bundles in `frontend/dist/assets/`. | Medium | Low | Maintain explicit string literals in DOM attributes and data structures. Plan Item 4 and Verification Step 5 enforce automated bundle marker audits asserting all four markers (`AC-4`). |
| **Browser Smoke Gate Selector Drift**: Refactoring CSS class names or DOM structures inadvertently breaks selectors required by `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`. | High | Low | Pinned manifest selectors (`data-scenario`, `data-readiness`, `data-disclosure`, `data-action`, `data-status`) are immutable contract boundaries. Any changes to DOM structures must preserve these attributes (`AC-4`). |
| **Secondary Renderer Architecture Fragmentation**: Introducing ad-hoc chart components or custom recommendation tables that bypass the canonical `DataAdapter` and `DashboardSpec` seams compromises Phase 6 production binding. | High | Low | Enforce strict architectural discipline: all widgets and presentation views query data exclusively through `createDashboardDataAdapter` via `query()`, `aggregate()`, and `getSchema()` (`AC-1`, `AC-6`). |
| **Direct Argv Execution Failure via Shell Incompatibilities**: Verification commands declared in user journeys fail during automated orchestrator re-execution due to shell syntax dependencies. | High | Low | Enforce direct argv execution standards (`shell=False`): journey commands use exact `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q` with no shell operators (`|`, `&&`, `;`, redirection) (`AC-5`). |
| **Sibling Repository or Backend Contamination**: Edits intended for the presentation tier inadvertently modify files in `src/dashForge/` or sibling project `dataForge/`. | High | Low | Enforce strict write scope boundaries. Automated test `test_ac8_sibling_dataforge_unmodified` asserts git cleanliness of `dataForge/`, and acceptance check `AC-6` guarantees zero modifications to generation pipelines. |
| **Pytest Runner Inconsistency via PYTHONPATH Override**: Invoking pytest with an explicit `PYTHONPATH` override masks system packages or breaks isolation across execution environments. | Medium | Low | All pytest invocations enforce `python3 -m pytest` with NO `PYTHONPATH` override, guaranteeing consistent package resolution across all agent and CI environments (`AC-5`, `AC-6`). |

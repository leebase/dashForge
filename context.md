# dashForge Session Context

> **Purpose**: Working memory for session continuity. If power drops, a new AI takes over, or we return after a break, read this first.

---

## Snapshot

| Attribute | Value |
|-----------|-------|
| **Phase** | Conditional commissioning behind DataForge |
| **Mode** | 2 (Implementation with approval) |
| **Last Updated** | 2026-09-06 |

### Sprint Status

| Sprint | Status | Completion |
|--------|--------|------------|
| Sprint 1 — Foundation | ✅ Complete | 100% |
| Sprint 2 — Spec/runtime completion | ✅ Complete | 100% |
| Sprint 3 — Mock engine + healthcare | ✅ Complete | 100% |
| Sprint 4 — Financial + SaaS + templates | ✅ Complete | 100% |
| Sprint 5 — Primitive/runtime breadth | ✅ Complete | 100% |
| Sprint 6 — Builder mode | ✅ Complete | 100% |
| Sprint 7 — Presenter + export | ✅ Complete | 100% |
| Sprint 8 — AI generation | ✅ Complete | 100% |
| Sprint 9 — Production binding | ✅ Complete | 100% |
| Sprint 10 — Client Meeting Dashboard Builder | ✅ Complete | 100% |
| Package DataForge Snapshot | ✅ Complete | 100% |
| Snowflake Cost Pack | ✅ Complete | 100% |
| Idle Warehouse Waste Slice | ✅ Complete | 100% |
| Idle Warehouse Dashboard Slice | ✅ Complete | 100% |
| Fix User Simulation Schema | ✅ Complete | 100% |
| Idle Warehouse Remediation Artifacts | ✅ Complete | 100% |
| Synthetic RBAC Audit Foundation | ✅ Complete | 100% |

The `synthetic-rbac-audit-foundation` vertical slice is complete, verified, and closed with formal review verdict `pass` (0 findings across correctness and compliance lenses) in `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json` and independent preserved system validator evidence. It establishes foundational synthetic access control telemetry, relational schema contracts across six canonical datasets (`rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, `governance_findings`), canonical `DashboardSpec` contracts with interactive role hierarchy tree visualization and user access audit matrices, unsuppressed synthetic data disclosures (`data-disclosure="synthetic-demo-data"`), directional security validation guardrails, browser smoke gate conformance (`"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, `"governance-findings"`), and verbatim direct argv workspace-root execution. All 30 targeted slice tests, 229 full pytest suite tests, full compileall checks, and 108 frontend tests across 35 files passed cleanly with exit status 0.

The `idle-warehouse-remediation-artifacts` vertical slice is complete, verified, and closed with formal review verdict `pass` (0 findings across implementation, contract, and user simulation lenses) in `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json` and independent preserved system validator evidence. It bridges analytical discovery and concrete operational action for the Snowflake Cost Management accelerator (`snowflakeCost:idle-warehouse-waste`), delivering prioritized low-risk recommendations (`FINANCE_REPORTING_WH`, `IWW-001`, `P0` ordered first) with all six governance fields, directional owner-validation guardrails, an interactive same-day executive follow-up artifact generator embedding headline metrics (726 compute credits/month opportunity, 2 idle warehouses, dominant credit concentration) and upstream digest citations (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), persistent unsuppressed synthetic data disclosures, production bundle marker verification (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`), verbatim workspace-root execution without shell operators, and complete AC-1..AC-6 traceability. All 32 targeted slice tests, 199 full pytest suite tests, full compileall checks, and 108 frontend tests across 35 files passed cleanly with exit status 0.

The `fix-user-simulation-schema` vertical slice is complete, verified, and closed with formal review verdict `pass` (0 findings across the contract conformance lens) in `code-reviews/review-fix-user-simulation-schema.verdict.json` and independent preserved system validator evidence. It formalizes canonical JSON schemas (`USER_JOURNEYS_MANIFEST_SCHEMA` and `USER_JOURNEYS_RESULT_SCHEMA`), enforces the omission protocol for unasserted `stdout_contains` (preventing empty string validation failures), establishes verbatim workspace-root execution standards (`env PYTHONPATH=src` for CLI, bare `python3 -m pytest` for tests), eliminates shell pipelines, and provides complete traceability to acceptance checks `AC-1` through `AC-5`. All 24 targeted slice tests, 167 full pytest suite tests, and all compilation checks passed cleanly with exit status 0.

The `idle-warehouse-dashboard` vertical slice is complete, verified, and closed with formal review verdict `pass` (0 findings) in `code-reviews/review-idle-warehouse-dashboard.verdict.json` and independent preserved system validator evidence. It establishes the buyer-visible frontend presentation layer for the Idle Warehouse Waste cost accelerator in DashForge, delivering standalone routing (`/?scenario=idle-warehouse-waste`), controlled readiness state signaling anchored to verified work package digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`, persistent and unsuppressed synthetic demo disclosures, an interactive prioritized recommendation queue highlighting `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) with directional savings guardrails, same-day executive follow-up and landscape PDF export, and browser smoke gate conformance across production bundles. All 31 slice tests, 143 full pytest suite tests, and 108 frontend tests across 35 files passed cleanly.

---

## 2026-09-06 — Synthetic RBAC Audit Foundation Slice Passed Governed Review

The `synthetic-rbac-audit-foundation` vertical slice establishes the foundational synthetic data models, relational schemas, and dashboard specification for the RBAC (Role-Based Access Control) management accelerator in DashForge (`snowflakeRbac:rbac-audit-foundation`). It empowers enterprise consulting teams to demonstrate authoritative cloud access governance insights for prospective buyers (CISOs, Cloud Security Architects, Snowflake Administrators) completely offline without live credentials, network dependencies, or post-meeting friction.

Key deliverables:
- Foundational Relational Schemas Across Six Canonical Datasets: Formalized typed relational schemas in `src/dashForge/rbac_audit.py` and `src/dashForge/snowflake_rbac.py` across `rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, and `governance_findings`. Produces deterministic SQLite databases and canonical `SQLiteSnapshot` JSON conforming to `frontend/src/core/data/sqliteSnapshot.ts` (AC-1).
- Canonical DashboardSpec Specification & Runtime DataAdapter Seams: Defined `DashboardSpec` in `frontend/src/features/rbac-audit/rbacAuditSpec.ts` and template `tpl.snowflakeRbac.rbac-audit-foundation` for scenario `snowflakeRbac:rbac-audit-foundation`. Features KPI scorecards, interactive role hierarchy tree visualization (`role-hierarchy-tree`), user access audit matrix (`user-access-matrix`), and prioritized governance findings queue (`governance-findings`), querying exclusively through `DataAdapter` runtime interfaces without bespoke renderers (AC-2).
- Persistent Synthetic Disclosures & Directional Security Guardrails: Persistent `data-disclosure="synthetic-demo-data"` badges prominently display "Synthetic demo data" across presentation surfaces, accompanied by upstream provenance metadata and explicit directional validation notices stating all role remediation recommendations are directional pending security administrator confirmation (AC-3).
- Frontend Production Build Conformance & Browser Smoke Gate Markers: Adheres to `tests/browser_smoke_manifest.json`, compiling optimized static assets under `frontend/dist/assets/*.js` preserving contract markers `"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, and `"governance-findings"` with `data-mode="real-client-disabled"` (AC-4).
- Verbatim Workspace-Root Command Execution & Traceability: Synchronized `journeys/user_journeys_manifest.json` under schema version 1 with valid authorities (`human`, `mission`, `author`), `status: "passed"`, sequential steps, and complete `traces_to` covering `AC-1` through `AC-6` without dangling IDs. Commands comply with allowlisted prefixes (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest`, `npm --prefix frontend test -- --run`) and eliminate all shell constructs (`|`, `&&`, `||`, `;`, `<`, `>`) (AC-5).
- Preservation of Existing Dashboard Functionality & Regression Safety: Deterministic CLI generation across existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost:idle-warehouse-waste`), fail-closed overwrite protection requiring `--force`, sibling repository `dataForge` unmodified, and full test suite passing with 229 tests (AC-6).
- Governed review passed: `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json` confirmed `pass` with 0 findings across correctness and compliance lenses.
- Preserved validator evidence: compileall (`compileall tests/test_rbac_audit.py`, exit status 0, duration 0.157367s), targeted pytest (30 passed in 1.72s, exit status 0, duration 2.394492s), full pytest (229 passed in 19.77s, exit status 0, duration 20.496692s), full compileall (`compileall src tests`, exit status 0, duration 0.071066s), and frontend vitest (`npm --prefix frontend test -- --run`, exit status 0, duration 5.351294s, 35 files / 108 tests passed in 4.68s) all passed.

---

## 2026-09-06 — Idle Warehouse Remediation Artifacts Slice Passed Governed Review

The `idle-warehouse-remediation-artifacts` vertical slice advances DashForge's Snowflake Cost Management solution (`snowflakeCost:idle-warehouse-waste`) by bridging analytical discovery and concrete operational action. It delivers prioritized low-risk recommendations and same-day follow-up artifacts for the idle warehouse dashboard, enabling executive buyers to act immediately on identified compute waste with directional owner-validation guardrails, persistent synthetic disclosures, and zero live credential dependencies.

Key deliverables:
- Prioritized Low-Risk Recommendations & Directional Governance: Generated `recommendation_queue` SQLite table and snapshot dataset with all six governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`), `performance_risk`, and `scope_name`. `FINANCE_REPORTING_WH` (`IWW-001`, `P0`, minimal risk) is ordered first. The presentation tier provides an accessible toggle (`data-action="open-recommendation-queue"`, `data-testid="open-recommendation-queue"`, `aria-controls="recommendation-queue"`, `aria-expanded`) expanding a container (`data-status="recommendation-queue"`, `id="recommendation-queue"`, `role="region"`) rendering all six governance fields per recommendation card. Directional validation guardrails explicitly frame all recommendations and projected savings as directional until validated by designated warehouse owners (AC-1).
- Interactive Same-Day Executive Follow-Up Artifact Generation: Standalone presentation embeds an interactive same-day follow-up generator (`data-action="same-day-executive-follow-up"`, `data-testid="same-day-executive-follow-up"`) transitioning status to `data-status="executive-follow-up"` labeled "Follow-up artifact is ready". Generates a decision-ready HTML deliverable capturing headline metrics (726 compute credits/month opportunity, 2 unmonitored idle warehouses, FINANCE_REPORTING_WH dominant concentration >50%), upstream cryptographic work package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), dataset observation claim citations (`dataset observation recommendation_queue/IWW-001`), prioritized actions with suggested owners and protective guardrails, and an explicit guard stating real/client mode remains disabled until approved metadata or exports exist (AC-2).
- Persistent & Unsuppressed Synthetic Demo Data Disclosures: Persistent `data-disclosure="synthetic-demo-data"` and `data-provenance="synthetic-demo-data"` badges prominently display "Synthetic demo data" across presentation header, synthetic quality disclosure card (`data-testid="synthetic-quality-disclosure"`), generated follow-up HTML deliverable, and landscape print-to-PDF export (`data-testid="dashboard-save-pdf"` via `exportDashboardArtifact`) (AC-3).
- Frontend Production Build Conformance & Browser Smoke Gate Markers: Adheres to `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`. Preserves all four contract markers (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`) in compiled production JavaScript bundles under `frontend/dist/assets/*.js`. Avoids live credential prompts (`password`, `account_identifier`, `private_key`) and enforces `data-mode="real-client-disabled"` (AC-4).
- Verbatim Workspace-Root Command Execution & User Journey Traceability: Synchronized `journeys/user_journeys_manifest.json` under schema version 1 with valid authorities (`human`, `mission`, `author`), `status: "passed"`, sequential steps, and complete `traces_to` covering `AC-1` through `AC-6` without dangling IDs. Commands comply with allowlisted prefixes (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest`, `npm --prefix frontend test -- --run`) and eliminate all shell constructs (`|`, `&&`, `||`, `;`, `<`, `>`) (AC-5).
- Preservation of Existing Dashboard Functionality & Regression Safety: Deterministic CLI generation for `snowflakeCost:idle-warehouse-waste` producing all seven canonical datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) in SQLite and snapshot JSON with fail-closed overwrite protection requiring `--force`. Sibling project `dataForge` unmodified, backwards compatibility maintained across `healthcare`, `financial`, and `saas` packs, and full test suite passing with 199 tests (AC-6).
- Governed review passed: `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json` confirmed `pass` with 0 findings across implementation, contract, and user simulation lenses.
- Preserved validator evidence: compileall (`compileall tests/test_remediation_artifacts.py`, exit status 0, duration 0.183588s), targeted pytest (32 passed in 0.85s, exit status 0, duration 1.536486s), full pytest (199 passed in 18.44s, exit status 0, duration 19.169097s), full compileall (`compileall src tests`, exit status 0, duration 0.059179s), and frontend vitest (`npm --prefix frontend test -- --run`, exit status 0, duration 6.378009s, 35 files / 108 tests passed in 5.73s) all passed.

---

## 2026-09-06 — Fix User Simulation Schema Slice Passed Governed Review

The `fix-user-simulation-schema` vertical slice formalizes the operational and schema contracts governing Agent-Orch playbook quality gates and user journey simulation verification within DashForge. It resolves structural schema validation failures at the `step_08b_user_simulation_gate` stage by establishing strict non-empty `stdout_contains` constraints, key omission protocols when unasserted, verbatim workspace-root execution standards, and complete acceptance check traceability.

Key deliverables:
- Canonical Schema Definitions & Validation Helpers: Defined Draft 2020-12 schemas `USER_JOURNEYS_MANIFEST_SCHEMA` and `USER_JOURNEYS_RESULT_SCHEMA` in `src/dashForge/playbook_schema.py`. Provided programmatic builders and validators (`build_command_claim`, `sanitize_command_claim`, `validate_command_claim`, `build_journey_entry`, `build_user_journeys_result`, `validate_manifest`, `validate_result`) ensuring compliant simulation output generation (AC-1).
- Non-Empty `stdout_contains` & Key Omission Protocol: Enforced `minLength: 1` on `stdout_contains` in `USER_JOURNEYS_RESULT_SCHEMA`. Established strict key omission: command claims where stdout substring assertions are not required omit `stdout_contains` entirely, preventing schema validation failures from empty string (`""`) or whitespace values (AC-1).
- Manifest Governance & Acceptance Check Traceability: Synchronized `journeys/user_journeys_manifest.json` conforming to `USER_JOURNEYS_MANIFEST_SCHEMA`, with valid journey authorities (`human`, `mission`, `author`, `exploratory`), status (`passed`), sequential natural-language steps, executable commands, and `traces_to` arrays mapping all non-exploratory journeys to contract acceptance checks `AC-1` through `AC-5` without dangling or unreferenced IDs (AC-2).
- Verbatim Workspace-Root Argv Execution: Standardized application CLI invocations to `env PYTHONPATH=src python3 -m dashForge.main` to pass environment variables directly without shell expansion, and standardized pytest invocations to `python3 -m pytest tests/ -q` or targeted checks without `PYTHONPATH` overrides to avoid masking virtual environment packages (AC-3).
- Elimination of Shell Syntax: Removed shell pipelines (`|`), chaining (`&&`, `||`, `;`), redirection (`<`, `>`), and standalone shell utilities (`jq`, `grep`, `cat`) from journey commands, ensuring all claims are directly executable verbatim from workspace root via direct subprocess invocation (`shell=False`) (AC-4).
- Pipeline Preservation & Regression Suite Integrity: Preserved deterministic generation for `snowflakeCost` with all 7 datasets, fail-closed overwrite protection, backwards compatibility for `healthcare`, `financial`, and `saas` packs, and sibling project `dataForge` unmodified. Full test suite passed with 167 tests (AC-5).
- Governed review passed: `code-reviews/review-fix-user-simulation-schema.verdict.json` confirmed `pass` with 0 findings across the contract conformance lens.
- Preserved validator evidence: compileall (`compileall tests/test_playbook_schema.py`, exit status 0, duration 0.168819s), targeted pytest (24 passed in 0.63s, exit status 0, duration 1.339025s), full pytest (167 passed in 16.98s, exit status 0, duration 17.712756s), and full compileall (`compileall src tests`, exit status 0, duration 0.06114s) all passed.

---

## 2026-09-06 — Idle Warehouse Dashboard Slice Passed Governed Review

The `idle-warehouse-dashboard` vertical slice establishes the buyer-visible frontend presentation layer for the Idle Warehouse Waste cost accelerator in DashForge. It presents actionable cloud data warehouse cost metrics, resource waste patterns, and prioritized, owner-validated recommendations using TVIQ-shaped (Time-to-Value, Impact, Quality) data structures consuming the canonical 7-dataset schema (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`).

Key deliverables:
- Standalone Frontend Scenario Mounting & Runtime Seam Resolution: Mounts standalone presentation at `/?scenario=idle-warehouse-waste` through `StandaloneDashboardApp.tsx` and resolves verified scenario assets locally via `StaticDataAdapter` and `SyntheticDataArtifactAdapter`, maintaining zero live Snowflake credentials, zero backend servers, and zero cloud network dependencies. Presentation components consume data strictly through the canonical `DashboardSpec` and `DataAdapter` interfaces without secondary renderers or ad-hoc charting engines (AC-1).
- Controlled Readiness & Claim Ledger Anchoring: Root container carries `data-scenario="idle-warehouse-waste"`, `data-demo="idle-warehouse-waste"`, and asserts controlled readiness state (`data-readiness="controlled"`) upon verifying the claim ledger against the verified work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`). Unverified or corrupted digests fail closed to `data-readiness="blocking"` and withhold presentation rendering (AC-2).
- Persistent & Unsuppressed Synthetic Disclosures: Persistent disclosure elements (`data-disclosure="synthetic-demo-data"`, `data-provenance="synthetic-demo-data"`) displaying `"Synthetic demo data"` remain prominent across the presentation header, synthetic quality disclosure card (`data-testid="synthetic-quality-disclosure"`), print-to-PDF views (`data-testid="dashboard-save-pdf"`), and executive follow-up exports (`data-action="same-day-executive-follow-up"`) (AC-3).
- Prioritized Recommendation Queue & Governance Guardrails: Interactive recommendation queue toggle (`data-action="open-recommendation-queue"`, `data-testid="open-recommendation-queue"`, `aria-controls="recommendation-queue"`, `aria-expanded`) expands a container with `data-status="recommendation-queue"` rendering prioritized actions. `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) is ordered first, presenting all six governance attributes (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`). Savings are explicitly framed as directional until validated by designated warehouse owners, preventing unauthorized or ungrounded automated changes (AC-4).
- Same-Day Executive Follow-Up & Landscape PDF Export: Same-day executive follow-up export (`data-action="same-day-executive-follow-up"`, `data-status="executive-follow-up"`) embeds headline metrics, concentration, and directional recommendations. Landscape PDF export (`data-testid="dashboard-save-pdf"`) preserves dark executive styling and provenance citations (AC-5).
- Browser Smoke Gate & Production Bundle Markers: Production build compiled via `npm --prefix frontend run build` generates static assets in `frontend/dist/` conforming to `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`. Compiled production bundles preserve contract marker strings: `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"` (AC-6).
- Automated Test Conformance: Frontend Vitest test suite (`npm --prefix frontend test -- --run`) passed with 35 test files and 108 tests; targeted slice tests in `tests/test_idle_warehouse_dashboard.py` passed with 31 tests; full pytest suite passed with 143 tests (AC-7).
- Backend Slice Preservation & Isolation: Zero external runtime dependencies in `src/dashForge`, no hardcoded scenarios, sibling project `dataForge` unmodified, deterministic CLI generation for `idle-warehouse-waste` with all seven datasets, and full backwards compatibility across existing industry packs (`healthcare`, `financial`, `saas`) (AC-8).
- Governed review passed: `code-reviews/review-idle-warehouse-dashboard.verdict.json` confirmed `pass` with 0 findings across correctness and requirements lenses.
- Preserved validator evidence: compileall, targeted pytest (31 passed in 0.86s, exit status 0), full pytest (143 passed in 17.19s, exit status 0), compileall src tests (exit status 0), and frontend vitest (35 files / 108 tests passed in 8.02s, exit status 0) all passed with exit status 0.

---

## 2026-09-04 — Snowflake Accelerator Revival Accepted

The supervised recovery retained the shipped backend and frontend foundation, rejected both preservation branches as product inputs, and added only evidence-backed repairs: fail-closed artifact-path validation, a real source-backed recommendation-queue interaction, same-major dependency security updates, and a lint-clean backend/frontend/build/browser/review playbook. Independent validation reproduced deterministic seed-9101 SQLite and snapshot hashes, all seven datasets and recommendation governance fields, clean failure exits, and the complete browser flow. Branches `preserve/9449c2cd9b93-timeout` and `preserve/5baf286d5c4d-governed-outputs` remain forensic evidence and are not merged.

---

## 2026-09-02 — Idle Warehouse Waste Slice Passed Governed Review

The `idle-warehouse-waste` vertical slice is complete, verified, and closed under pack `snowflakeCost`. `src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py`, and `src/dashForge/main.py` now provide canonical 7-dataset snapshot packaging, complete provenance metadata, fail-closed CLI generation, `DashboardSpec` contracts, `DataAdapter` query routing, runtime catalog registration, and recommendation queue governance.

Key deliverables:
- Canonical snapshot ingestion & schema conformance: Produces deterministic SQLite database and canonical `SQLiteSnapshot` JSON conforming to `frontend/src/core/data/sqliteSnapshot.ts`. Generates all seven datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) with validated types and semantic roles (AC-1).
- Provenance metadata & synthetic disclosure: Snapshots carry `packId` (`snowflakeCost`), `scenarioId` (`idle-warehouse-waste`), `seed`, `dataForgeStoryContractPath` (`stories/snowflake/idle-warehouse-waste.md`), generator version, ISO-8601 generation timestamp, `synthetic: true`, and disclosure text `"Synthetic demo data"` (AC-1).
- Deterministic CLI generation pipeline & fail-closed overwrite protection: Supports `python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste` with bit-for-bit reproducibility. Enforces fail-closed target protection requiring `--force` and clean argument validation through `parser.error()` exiting with code 2 (AC-2).
- DashboardSpec contract formalization & claim ledger verification: Formalized `DashboardSpec` contracts and claim ledgers mapping executive narrative and KPI metrics directly to verified dataset evidence (AC-3).
- DataAdapter runtime seam & seven-dataset query routing: Query, aggregate, and schema inspection functions route cleanly across all seven datasets via `DataAdapter` (AC-4).
- Scenario & template catalog registrations: Registered scenario `snowflakeCost:idle-warehouse-waste` and template `tpl.snowflakeCost.idle-warehouse-waste` in runtime catalogs (AC-5).
- Recommendation queue governance & safety guardrails: Preserved `recommendation_queue` table schema with all six governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) and safety guardrails (AC-6).
- Standalone presentation & follow-up export: Validated standalone executive presentation flow and follow-up export capability with prominent synthetic disclosures (AC-7).
- Backwards compatibility & test coverage: All existing packs (`healthcare`, `financial`, `saas`) remain operational; 35 unit/integration tests in `tests/test_idle_warehouse_waste.py` pass; full pytest suite passed with 109 tests; zero changes to sibling project `dataForge` (AC-8).
- Governed review passed: `code-reviews/review-idle-warehouse-waste.verdict.json` confirmed `pass` with 0 findings, recommendation `ready`, and all readiness criteria verified true.
- Preserved validator evidence: all compileall and pytest checks passed across test authoring, implementation, and verification steps (final verification: 109 passed in 15.60s, exit status 0; compileall exit status 0).

---

## 2026-09-02 — Snowflake Cost Pack Slice Passed Governed Review

The `snowflake-cost-pack` slice is complete and verified. `src/dashForge/main.py`, `src/dashForge/generate.py`, `src/dashForge/package_snapshot.py`, and `src/dashForge/snowflake_cost.py` now provide dynamic scenario discovery, deterministic relational generation, provenance metadata enrichment, and recommendation queue packaging for the `snowflakeCost` pack alongside existing industry packs.

Key deliverables:
- CLI command: `python3 -m dashForge.main generate` supporting `--pack snowflakeCost` alongside `healthcare`, `financial`, and `saas` (AC-1).
- Dynamic scenario discovery: dynamically queries scenarios (`idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, `finops-maturity-assessment`) from `dataForge` without hardcoding in DashForge (AC-2).
- Fail-closed error handling: unknown scenarios, invalid packs, or missing arguments fail closed with exit status 2 and clear diagnostic messages via `parser.error()`, eliminating unhandled Python tracebacks (AC-2, AC-3).
- Fail-closed overwrite protection: target existence checks abort with exit status 2 unless `--force` is provided (AC-4).
- Deterministic relational packaging: bit-for-bit reproducible generation emitting SQLite databases and canonical `SQLiteSnapshot` JSON conforming to `frontend/src/core/data/sqliteSnapshot.ts` (AC-5).
- Provenance and synthetic disclosure: exported snapshot metadata includes `packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 timestamp, `synthetic: true`, and disclosure text `"Synthetic demo data"` (AC-6).
- Recommendation queue preservation: retains `recommendation_queue` table with all governance and severity columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) intact (AC-7).
- Backwards compatibility & test coverage: `tests/test_snowflake_cost_pack.py` passed with 34 tests; full pytest suite passed with 74 tests without modifying sibling project `dataForge` (AC-8).
- Governed review passed: `code-reviews/review-snowflake-cost-pack.verdict.json` confirmed `pass` with 0 findings, fulfilling all acceptance criteria AC-1 through AC-8.
- Preserved validator evidence: all compileall and pytest checks passed across test authoring, implementation, and verification steps (final verification: 74 passed in 15.14s, exit status 0; compileall exit status 0).

## 2026-09-02 — Package DataForge Snapshot Slice Passed Governed Review

The `package-dataforge-snapshot` slice is complete and verified. `src/dashForge/main.py`, `src/dashForge/package_snapshot.py`, and `src/dashForge/generate.py` now provide deterministic scenario packaging and snapshot extraction for DashForge's client-side runtime.

Key deliverables:
- CLI command: `python3 -m dashForge.main generate` supporting `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` (AC-1).
- Fail-closed overwrite protection: target existence check aborts with exit code 2 and diagnostic message unless `--force` is supplied (AC-2).
- Relational snapshot serialization: `package_snapshot.py` inspects SQLite tables via `PRAGMA table_info`, infers types/roles (`dimension`, `measure`, `date`, `id`), and formats JSON conforming to `SQLiteSnapshot` in `frontend/src/core/data/sqliteSnapshot.ts` (AC-3, AC-6).
- Canonical multi-pack determinism: supports `healthcare`, `financial`, and `saas` packs with bit-for-bit reproducibility given identical seeds (AC-4).
- Resilient error handling: intercepts errors cleanly via `parser.error()`, eliminating raw Python tracebacks (AC-5).
- Test coverage: `tests/test_package_snapshot.py` passed with 29 tests; full pytest suite passed with 54 tests.
- Governed review passed: `code-reviews/review-package-dataforge-snapshot.verdict.json` confirmed `pass` with 0 findings, fulfilling all acceptance criteria AC-1 through AC-8.
- Preserved validator evidence: compileall and pytest passed across test authoring, implementation, and repair steps (final verification: 54 passed in 18.61s; compileall exit status 0).

## 2026-08-11 — Unified DashForge/DataForge operator guide

Added `docs/user-guide.md` as the cross-project user guide. It documents the
local and LAN browser paths, certificate trust, Builder, PDF export, the
DataForge `generate`, `validate-scenario`, and `employee-run` commands, the
current pinned-fixture behavior, the governed receipt boundary, and
troubleshooting. Both project READMEs link to it.

The companion DataForge CLI fix exposes `fieldService` through
`generate --pack`, matching the existing generator registry. The guide
explicitly keeps synthetic demo data, live Snowflake, approval
authentication, and external delivery boundaries visible.

Verification: active LAN HTTPS endpoint returned HTTP/2 200; DataForge
validation/generation/employee-run smoke passed; DataForge passed 61 tests;
DashForge passed 35 frontend files/107 tests and `npm run build` passed.

## 2026-08-11 — LAN HTTPS preview and PDF rendition

The standalone field-service dashboard is now available to another device on
the trusted LAN through `npm run dev:lan`. The launcher binds Vite to
`0.0.0.0:5173`, generates and reuses a 30-day self-signed certificate with
`192.168.8.10` in its IP subject-alternative name, and prints the Mac URL
`https://192.168.8.10:5173`.

The standalone summary now includes **Print / Save PDF**. The existing
export-document path was upgraded with landscape print geometry, preserved
chart colors, evidence/provenance metadata, story arc and presenter notes, and
page-break protection. Native print styling hides interactive controls.

Verification: `curl -k -I https://192.168.8.10:5173` returned HTTP/2 200;
`npm test` passed 35 files/107 tests; `npm run build` passed; headless Chrome
produced a seven-page landscape letter PDF and the rendered first page
contained the synthetic disclosure, scenario title, and upstream digest.

## 2026-08-11 — Direct shakedown reconciled; next launch remains blocked

Direct Agent-Orch run `d1ce08a229dd` completed as
`client-meeting-dashboard-builder` after Lee authenticated the package gate in
source run `6a579236e2f0`; its evidence chain verifies (`5 entries, 12
artifacts`). That run used an operator-materialized, digest-pinned copy of
DataForge run `31ad67eea2f1`, not an Agent-Orch `artifact_inputs` receipt.
Earlier constructed receipt smokes remain valid seam tests, but neither they
nor this manual-handoff shakedown satisfy fresh employee commissioning.

DataForge cycle `20260811T151705Z` consumed its latest one-cycle grant but
deferred in Auto-Orch Author before Execute after stale mission posture selected
the wrong item. It created no Agent-Orch source run or package digest. The
posture is corrected without granting a retry; DataForge now waits on one fresh
Lee grant, so this DashForge gate remains closed.

The next source must be a fresh terminal, identity-bound DataForge run whose
declared output is chained under
`step_04_generate_package/attempt-1/sealed-outputs/`. The fixed receipt fields
are already known: employee `synthetic-data-story-engineer`, tenant
`lee-installation`, pursuit `dataforge-idle-warehouse-proof`, artifact
`dataforge-idle-warehouse-proof:synthetic-data-story-engineer:0001`, and schema
`synthetic-data-work-package/1.0`. Only that future run id and exact envelope
digest may populate the playbook; never reuse the historical manual digest.

The Auto-Orch mission remains inert (`launch_approved: false`, no schedule,
stub routing, Board disabled, no automatic commit). Do not launch until the
fresh trusted DataForge receipt exists and Lee separately approves the
DashForge mission gate. No hosting, external delivery, or customer data is
authorized.

## 2026-08-10 — Field-service executive showcase

The default app now opens a polished operating review for fictional Apex
Climate Services: `fieldService:first-heat-wave-parts-bottleneck` through
`tpl.fieldService.first-heat-wave-command`. It consumes the pinned DataForge
work package at digest
`sha256:e886a65cea294553d38c0c42c7f2625e7f504b01fe5dd7bad809bb852fc727ab`
through the strict synthetic-artifact adapter, not through a second data path.

The dashboard carries five explicit comparisons—first-time fix, emergency SLA,
repeat truck rolls, overtime per technician, and contribution margin—and three
linked charts for weekly demand versus plan, callback concentration by branch,
and documented callback causes. A five-step narrative arc, controlled-quality
disclosure, compact source citations, and a digest-pinned claim ledger keep the
meeting story attributable. Opening Builder preserves the same scenario and
template.

Verification: all 107 frontend tests passed; the TypeScript/Vite production
build succeeded; browser smoke confirmed the dark executive theme, synthetic
and quality disclosures, five unclipped KPI cards, three unclipped charts, and
the field-service Builder handoff. No mission, live connector, customer data,
hosting, or external delivery was introduced.

## 2026-08-09 — Client Meeting Dashboard Builder

The first DashForge employee slice is complete. The
`ClientMeetingDashboardBuilder` consumes a trusted
`synthetic-data-work-package/1.0` through the Agent-Orch artifact receipt,
validates the upstream scenario/quality/reproduction evidence, resolves a
bounded `DashboardSpec`, and emits `meeting-dashboard-package/1.0`.

The result carries the upstream artifact digest, dashboard specification and
binding map, material-surface claim ledger, rendered dashboard artifact, and
meeting narrative. It refuses missing or blocking upstream quality, invalid
bindings, unsupported claims, and missing audience/decision context. It does
not connect to Snowflake, call a browser provider, send client material, or
make claims beyond the generated evidence.

Evidence:

- DashForge frontend suite: 103 passed.
- Python suite: 33 passed.
- Production build: succeeded.
- Governed browser smoke: interaction observed and evidence artifacts written.
- Independent dashboard review: 10/10 checks passed.
- Cross-run smoke: package output cites the exact DataForge digest
  `sha256:fd4373d38c9fd39e344332b4be74888ce859021aefdb9ffd63dc334c848c0f60`.

## 2026-08-09 — Receipt smoke and package publication hardening

The package materializer now publishes through a temporary sibling directory
and refuses a non-empty output directory, so a failed or stale run cannot
silently merge files into a meeting package. Its package-tool TypeScript scope
is included in the production build.

A fresh DataForge employee-run artifact was accepted through the Agent-Orch
receipt path, materialized read-only, and verified at digest
`sha256:31d8b97c4843d6d9e5fdd0bcff5009d5abbce6252d8ffe70cbf9b1fdf6b4ba4e`.
The checked-in browser/package fixture remains separately pinned to its
fixture digest.

## What's Happening Now

### Current Work Stream

The `synthetic-rbac-audit-foundation` vertical slice has closed with a clean `pass` verdict (0 findings across correctness and compliance lenses) in `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json` and full preserved system validator evidence. It establishes foundational synthetic access control telemetry, relational schema models, and dashboard specification contracts for the Snowflake RBAC management accelerator (`snowflakeRbac:rbac-audit-foundation`). The slice delivers typed schema definitions in `src/dashForge/rbac_audit.py` and `src/dashForge/snowflake_rbac.py` across six canonical datasets (`rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, `governance_findings`) with deterministic SQLite generation and canonical `SQLiteSnapshot` JSON representations. It wires the canonical `DashboardSpec` and template `tpl.snowflakeRbac.rbac-audit-foundation` via `DataAdapter` runtime interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`), featuring KPI scorecards, interactive role hierarchy tree visualization (`role-hierarchy-tree`), user access audit matrix (`user-access-matrix`), and prioritized governance findings queue (`governance-findings`). All views render persistent synthetic data disclosures (`data-disclosure="synthetic-demo-data"`), directional security validation guardrails, browser smoke gate markers (`"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, `"governance-findings"`), and verbatim workspace-root execution. All 30 slice tests, 229 full pytest suite tests, full compileall checks, and 108 frontend tests across 35 files passed cleanly with exit status 0.

The `idle-warehouse-remediation-artifacts` vertical slice has closed with a clean `pass` verdict (0 findings across implementation, contract, and user simulation lenses) in `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json` and full preserved system validator evidence. Built upon the foundational relational data layer and the browser-visible presentation tier, this slice delivers prioritized low-risk recommendations and same-day follow-up artifacts for the idle warehouse dashboard (`snowflakeCost:idle-warehouse-waste`). `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) is ordered first, presenting all six governance fields and directional owner-validation guardrails. The embedded same-day follow-up generator (`data-action="same-day-executive-follow-up"`) packages headline metrics (726 compute credits/month opportunity, 2 idle warehouses, dominant credit concentration), upstream digest citations (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), and observation citations into decision-ready deliverables completely offline. All 32 slice tests, 199 full pytest suite tests, full compileall checks, and 108 frontend tests across 35 files passed cleanly with exit status 0.

The `fix-user-simulation-schema` vertical slice previously closed with a clean `pass` verdict (0 findings across the contract conformance lens) in `code-reviews/review-fix-user-simulation-schema.verdict.json` and full preserved system validator evidence. `src/dashForge/playbook_schema.py` formalizes Draft 2020-12 schemas for `USER_JOURNEYS_MANIFEST_SCHEMA` and `USER_JOURNEYS_RESULT_SCHEMA`, enforces `minLength: 1` on `stdout_contains`, and implements the omission protocol so unasserted command claims omit `stdout_contains` entirely. `journeys/user_journeys_manifest.json` maps non-exploratory journeys to contract acceptance checks `AC-1` through `AC-5` without dangling IDs, while journey commands adhere strictly to verbatim workspace-root argv execution (`env PYTHONPATH=src` for CLI, bare `python3 -m pytest` for tests) without shell pipelines or standalone shell utilities. All 24 slice tests and 167 full pytest suite tests passed cleanly with zero regressions.

The `idle-warehouse-dashboard` vertical slice for Snowflake Cost optimization previously closed with a clean `pass` verdict (0 findings across correctness and requirements lenses) in `code-reviews/review-idle-warehouse-dashboard.verdict.json` and full preserved system validator evidence. `StandaloneDashboardApp.tsx` and `standaloneDashboard.ts` establish the buyer-visible presentation tier at `/?scenario=idle-warehouse-waste` through `StaticDataAdapter` and `SyntheticDataArtifactAdapter` with zero live Snowflake credentials, zero backend servers, and zero cloud network dependencies. Presentation containers assert controlled readiness state (`data-readiness="controlled"`) anchored to verified digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`, render persistent, unsuppressed synthetic demo disclosures (`data-disclosure="synthetic-demo-data"`), and provide an accessible recommendation queue toggle (`data-action="open-recommendation-queue"`) highlighting `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) with directional validation guardrails. All 31 slice tests, 143 full pytest suite tests, and 108 frontend tests across 35 files passed cleanly.

The `idle-warehouse-waste` vertical slice for Snowflake Cost optimization previously closed with a clean `pass` verdict (0 findings, recommendation `ready`) in `code-reviews/review-idle-warehouse-waste.verdict.json` and full preserved system validator evidence. `src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py`, and `src/dashForge/main.py` now provide canonical 7-dataset snapshot packaging (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`), complete provenance metadata, fail-closed CLI generation, `DashboardSpec` contracts, `DataAdapter` query routing, runtime catalog registration, and recommendation queue governance. All 35 slice-specific tests and 109 full-suite tests passed cleanly.

The `snowflake-cost-pack` slice previously closed with a clean `pass` verdict (0 findings) in `code-reviews/review-snowflake-cost-pack.verdict.json` and full preserved system validator evidence. `src/dashForge/main.py`, `src/dashForge/generate.py`, `src/dashForge/package_snapshot.py`, and `src/dashForge/snowflake_cost.py` provide dynamic scenario discovery from `dataForge` (`idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, `finops-maturity-assessment`), fail-closed target overwrite protection requiring `--force`, complete provenance metadata, and full recommendation queue preservation for the `snowflakeCost` pack alongside existing industry packs (`healthcare`, `financial`, `saas`).

The `package-dataforge-snapshot` slice previously closed with a clean `pass` verdict (0 findings) in `code-reviews/review-package-dataforge-snapshot.verdict.json` and full preserved system validator evidence. `src/dashForge/main.py`, `src/dashForge/package_snapshot.py`, and `src/dashForge/generate.py` provide deterministic multi-pack generation, fail-closed target overwrite protection requiring `--force`, and structured JSON snapshot serialization matching DashForge's client-side `SQLiteSnapshot` and `DataAdapter` runtime interfaces for offline client workshop demonstrations.

The active commercial proof path is now Snowflake Cost Optimization, bounded to
the governed `idle-warehouse-waste` story. Auto-Orch run `ee6fac7897f9`
completed the standalone buyer-demo slice through the existing
`DashboardSpec` + `DataAdapter` runtime, including executive story flow,
prioritized recommendations, and same-day follow-up export. Frontend tests,
production build, browser smoke, evidence verification, and Claude Code Opus
4.8 High review passed; the review recorded three Low findings and no Medium+
findings. New product work is gated on a real Snowflake buyer signal rather
than further platform or collateral expansion.

The governed Sprint 1-9 delivery ladder is now formally closed in-repo.
Sprint 9's bounded production-binding slice remains the current baseline on top
of the closed Sprint 8 authoring flow: `mock`, `live`, and `hybrid`
`DashboardSpec` documents resolve through
`frontend/src/core/data/createDashboardDataAdapter.ts`, backed by the bounded
REST adapter and explicit hybrid composition instead of a second renderer or
widget-level branching path.

A formal standalone-MVP review/handoff is now also closed in-repo.
`code-reviews/review-mvp-standalone-dashboard.md` records a clean post-repair
review pass, and the repo canon now explicitly defines the MVP as:

- one bounded scenario definition,
- data generation for that scenario, and
- a standalone dashboard deliverable that opens directly into the scenario.

A bounded post-Sprint-9 product-surface correction is now also landed:
`frontend/src/App.tsx` no longer opens into the builder shell by default.
Instead, the app now boots into a dedicated standalone runtime under
`frontend/src/features/runtime/StandaloneDashboardApp.tsx` for the canonical
ED throughput scenario (`healthcare:ed-throughput-crunch`) and its registered
starter template (`tpl.healthcare.ed-throughput-command`).

The builder shell remains available as an explicit secondary mode for operators
and still owns the active editable `DashboardSpec` draft after it is opened,
but the default MVP experience is now the free-standing scenario dashboard
rather than builder-first chrome. That standalone path stays on the existing
`DashboardSpec` + `DataAdapter` contracts, reuses the registered
scenario/template seam, and carries focused app/runtime coverage in
`frontend/src/App.test.tsx` and `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`.

Mock-data creation has now also been broken out of dashForge into the sibling
`/Users/lee/projects/dataForge` project. dashForge keeps thin compatibility
wrappers at `src/dashForge/main.py`, `src/dashForge/generate.py`, and
`src/dashForge/_dataforge_compat.py` so the historical CLI/tests still resolve,
but new generator ownership now lives in `dataForge`.

The first post-split code-review repair follow-up is now also closed.
`frontend/src/features/builder/BuilderShell.tsx` no longer leaves the ED
throughput command-view draft bound to ED-only datasets when an operator
switches to a different healthcare scenario after opening Builder from the
standalone app. If the current template cannot legally serve the requested
scenario, the builder now regenerates a fresh draft from a valid template
instead of mutating only the scenario id in place.

The Python compatibility bridge is also less workspace-specific now.
`src/dashForge/_dataforge_compat.py` now reports the actual candidate paths it
checked and supports `DATAFORGE_SRC` as an explicit override instead of
hard-coding Lee's local absolute path into the recovery message.

Fresh standalone closeout verification passed in sandbox on 2026-04-02:
`python3 -m pytest -q`, `npm --prefix frontend test`, and
`npm --prefix frontend run build`.

The standalone repair follow-up is now closed at the shared-runtime seam:
`frontend/src/features/runtime/StandaloneDashboardApp.test.tsx` now verifies
the standalone contract through a mocked `DashboardRenderer` seam, and the
read-only runtime path in `frontend/src/components/WidgetRenderer.tsx` and
`frontend/src/dashboard/ResponsiveDashboardGrid.tsx` no longer leaves deferred
initial-hydration work alive during teardown. The repaired outcome and repeated
green rerun evidence now live in
`code-reviews/repair-mvp-standalone-dashboard.md`.

The only remaining near-term gap is still outside this sandbox:
`npm --prefix frontend run dev -- --host 127.0.0.1` fails here with
`listen EPERM`, so one host-environment browser smoke of the standalone
default path plus the still-available live-binding workflow remains queued as
manual follow-up rather than governed closeout work.

The most recent healthcare scenario package workflow (`0700a8a5990b`) has now
closed end-to-end: contract, plan, verify, repair, and review/handoff were
executed through
`playbooks/ed_throughput_crunch_demo_workflow.yaml`, and the review path now
points to the current handoff run folder under
`result-review.md`.

The ED throughput demo package candidate next slice has now advanced beyond
contract/plan definition. Its concrete build materials exist under
`scenarios/healthcare/` as a data design, dashboard blueprint, and operator
build checklist that package the scenario into an executable demo assembly
flow. The first verification/repair pass on that package is also now closed:
the priority-sites table has an explicit `priority_status` contract defined in
the data design and reused by the blueprint and operator checklist instead of
being left to operator improvisation.

That package now also has first-pass materialized demo artifacts aligned to
the current DashForge mock/runtime shapes:
`scenarios/healthcare/ed-throughput-crunch-preview.sqlite`,
`scenarios/healthcare/ed-throughput-crunch-preview-data.json`,
`scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`, and
`scenarios/healthcare/ed-throughput-crunch-binding-map.md`. The new preview
package now carries the full planned six-dataset package shape with 6 / 36 /
144 / 324 / 18 / 36 rows across the canonical scenario datasets, the
SQLite artifact is the canonical mock-data output, the JSON snapshot remains
for the current nested frontend preview seam, the dashboard JSON is a bounded
`mock` `DashboardSpec` for `ED Throughput Command View`, and the binding map
documents how the command-view widgets translate onto the existing
dataset-binding and presenter-step seams.

The ED throughput scenario is now also registered in the live frontend runtime:
scenario and template registries include `healthcare:ed-throughput-crunch`,
a dedicated `tpl.healthcare.ed-throughput-command` template, and a scenario-
specific template blueprint that instantiates in-app using the current dataset
contract (`monthly_metrics`) and widget taxonomy.

### Recently Completed

- ✅ Closed the `synthetic-rbac-audit-foundation` vertical slice with formal review verdict `pass` and 0 findings in `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json`
- ✅ Formalized typed relational schemas in `src/dashForge/rbac_audit.py` and `src/dashForge/snowflake_rbac.py` across six canonical datasets (`rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, `governance_findings`) with deterministic SQLite generation and `SQLiteSnapshot` JSON representations conforming to `frontend/src/core/data/sqliteSnapshot.ts` (AC-1)
- ✅ Defined canonical `DashboardSpec` specification in `frontend/src/features/rbac-audit/rbacAuditSpec.ts` and template `tpl.snowflakeRbac.rbac-audit-foundation`, declaring KPI scorecards, interactive role hierarchy tree (`role-hierarchy-tree`), user access matrix (`user-access-matrix`), and prioritized governance findings queue (`governance-findings`) via `DataAdapter` runtime seams (AC-2)
- ✅ Rendered persistent, unsuppressed synthetic demo data disclosures (`data-disclosure="synthetic-demo-data"`) displaying `"Synthetic demo data"` with upstream provenance metadata and explicit directional security validation guardrails requiring administrator confirmation (AC-3)
- ✅ Enforced browser smoke gate conformance against `tests/browser_smoke_manifest.json`, preserving contract markers (`"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, `"governance-findings"`) in compiled production bundles with `data-mode="real-client-disabled"` (AC-4)
- ✅ Synchronized `journeys/user_journeys_manifest.json` conforming to schema with valid authorities (`human`, `mission`, `author`), `status: "passed"`, complete AC-1..AC-6 traceability, allowlist prefix compliance, and zero shell operators (AC-5)
- ✅ Preserved deterministic CLI generation across existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost:idle-warehouse-waste`), fail-closed overwrite protection requiring `--force`, sibling repository `dataForge` unmodified, and full test suite passing with 229 tests (AC-6)
- ✅ Authored targeted test suite `tests/test_rbac_audit.py` with 30 passing tests; verified full test suite with 229 passing tests
- ✅ Preserved system validator results confirmed compileall (`compileall tests/test_rbac_audit.py`, exit status 0, duration 0.157367s), targeted pytest (30 passed in 1.72s, exit status 0, duration 2.394492s), full pytest (229 passed in 19.77s, exit status 0, duration 20.496692s), full compileall (`compileall src tests`, exit status 0, duration 0.071066s), and frontend vitest (`npm --prefix frontend test -- --run`, exit status 0, duration 5.351294s, 35 files / 108 tests passed in 4.68s)
- ✅ Closed the `idle-warehouse-remediation-artifacts` vertical slice with formal review verdict `pass` and 0 findings in `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json`
- ✅ Generated `recommendation_queue` SQLite table and snapshot dataset with all six governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`), `performance_risk`, and `scope_name` with `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) ordered first (AC-1)
- ✅ Added interactive recommendation queue toggle (`data-action="open-recommendation-queue"`) and container (`data-status="recommendation-queue"`) with directional validation guardrails framing recommendations as directional until validated by designated warehouse owners (AC-1)
- ✅ Implemented interactive same-day executive follow-up artifact generator (`data-action="same-day-executive-follow-up"`, `data-status="executive-follow-up"`) embedding headline metrics (726 compute credits/month, 2 idle warehouses, dominant credit concentration), upstream digest citation `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`, observation citations, and real-client mode disabled guard (AC-2)
- ✅ Rendered persistent, unsuppressed synthetic demo data disclosures (`data-disclosure="synthetic-demo-data"`, `data-provenance="synthetic-demo-data"`) across presentation header, quality disclosure card, follow-up HTML deliverable, and landscape print-to-PDF export (AC-3)
- ✅ Enforced browser smoke gate conformance against `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`, preserving contract markers (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`) in production bundles with zero live credentials (AC-4)
- ✅ Synchronized `journeys/user_journeys_manifest.json` conforming to schema with valid authorities (`human`, `mission`, `author`), `status: "passed"`, full AC-1..AC-6 traceability, allowlist prefix compliance, and zero shell operators (AC-5)
- ✅ Preserved deterministic CLI generation across all 7 canonical datasets with fail-closed overwrite protection, backwards compatibility across existing packs (`healthcare`, `financial`, `saas`), sibling repository `dataForge` unmodified, and full test suite passing with 199 tests (AC-6)
- ✅ Authored targeted test suite `tests/test_remediation_artifacts.py` with 32 passing tests; verified full test suite with 199 passing tests
- ✅ Preserved system validator results confirmed compileall, targeted pytest (32 passed in 0.85s, exit status 0), full pytest (199 passed in 18.44s, exit status 0), full compileall (`compileall src tests`, exit status 0), and frontend vitest (35 files / 108 tests passed in 5.73s, exit status 0)
- ✅ Closed the `fix-user-simulation-schema` vertical slice with formal review verdict `pass` and 0 findings in `code-reviews/review-fix-user-simulation-schema.verdict.json`
- ✅ Formalized canonical JSON schemas `USER_JOURNEYS_MANIFEST_SCHEMA` and `USER_JOURNEYS_RESULT_SCHEMA` in `src/dashForge/playbook_schema.py`
- ✅ Enforced `minLength: 1` on `stdout_contains` and implemented key omission protocol via `build_command_claim` and `sanitize_command_claim` (AC-1)
- ✅ Synchronized `journeys/user_journeys_manifest.json` with valid authorities, executable commands, and `traces_to` covering AC-1 through AC-5 without dangling check IDs (AC-2)
- ✅ Standardized verbatim workspace-root execution using `env PYTHONPATH=src` for CLI commands and unmasked `python3 -m pytest` for test commands (AC-3)
- ✅ Eliminated shell pipelines, chaining, redirection, and standalone utilities from journey commands to ensure direct argv execution compatibility (AC-4)
- ✅ Preserved existing pipeline validations, `snowflakeCost` generation, fail-closed overwrite protection, and all existing packs (`healthcare`, `financial`, `saas`) with zero changes to sibling project `dataForge` (AC-5)
- ✅ Authored targeted test suite `tests/test_playbook_schema.py` with 24 passing tests; verified full test suite with 167 passing tests
- ✅ Preserved system validator results confirmed compileall, targeted pytest (24 passed in 0.63s, exit status 0), full pytest (167 passed in 16.98s, exit status 0), and full compileall (exit status 0)
- ✅ Closed the `idle-warehouse-dashboard` vertical slice with formal review verdict `pass` and 0 findings in `code-reviews/review-idle-warehouse-dashboard.verdict.json`
- ✅ Implemented standalone frontend scenario mounting & runtime seam resolution at `/?scenario=idle-warehouse-waste` via `StandaloneDashboardApp.tsx` and `standaloneDashboard.ts` with zero live credentials or network dependencies (AC-1)
- ✅ Added scenario container attributes (`data-scenario="idle-warehouse-waste"`, `data-demo="idle-warehouse-waste"`) and controlled readiness state signaling (`data-readiness="controlled"`) anchored to verified digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390` (AC-2)
- ✅ Rendered persistent, unsuppressed synthetic demo data disclosures (`data-disclosure="synthetic-demo-data"`) displaying `"Synthetic demo data"` across header, quality card, follow-up export, and PDF print (AC-3)
- ✅ Implemented interactive prioritized recommendation queue (`data-action="open-recommendation-queue"`, `data-status="recommendation-queue"`) placing `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) first with all 6 governance columns and directional validation guardrails (AC-4)
- ✅ Integrated same-day executive follow-up export (`data-action="same-day-executive-follow-up"`) and landscape PDF print export (`data-testid="dashboard-save-pdf"`) with full citation and provenance preservation (AC-5)
- ✅ Enforced browser smoke gate conformance against `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`, preserving required contract markers in production bundles under `frontend/dist/assets/` (AC-6)
- ✅ Verified production build integrity and Vitest test suite (`npm --prefix frontend test -- --run` passed with 35 test files, 108 tests) covering routing, readiness, disclosures, queue toggle, and export flows (AC-7)
- ✅ Preserved backend slice isolation, zero external dependencies, no hardcoded scenarios, sibling project `dataForge` unmodified, backwards compatibility across existing packs, and full test suite passing with 143 tests (AC-8)
- ✅ Preserved system validator results confirmed compileall, targeted pytest (31 passed in 0.86s, exit status 0), full pytest (143 passed in 17.19s, exit status 0), full compileall (exit status 0), and frontend vitest (35 files / 108 tests passed in 8.02s, exit status 0)
- ✅ Closed the `idle-warehouse-waste` vertical slice with formal review verdict `pass`, recommendation `ready`, and 0 findings in `code-reviews/review-idle-warehouse-waste.verdict.json`
- ✅ Implemented canonical snapshot ingestion and schema validation across all 7 canonical datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) adhering to `SQLiteSnapshot` specification
- ✅ Embedded complete provenance metadata (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO timestamp, `synthetic: true`, disclosure text) in generated snapshots
- ✅ Validated fail-closed CLI generation pipeline with target overwrite protection requiring explicit `--force` flag
- ✅ Verified `DashboardSpec` contracts, claim ledgers, and `DataAdapter` runtime query and aggregation routing across all 7 datasets
- ✅ Confirmed runtime scenario and template catalog registration for `snowflakeCost:idle-warehouse-waste` and `tpl.snowflakeCost.idle-warehouse-waste`
- ✅ Preserved `recommendation_queue` governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) and safety guardrails
- ✅ Authored targeted test suite `tests/test_idle_warehouse_waste.py` with 35 passing tests; verified complete test suite with 109 passing tests in 15.60s
- ✅ Preserved system validator results confirmed compileall and full pytest suite (109 passed in 15.60s, exit status 0; compileall exit status 0)
- ✅ Closed the `snowflake-cost-pack` slice with formal review verdict `pass` and 0 findings in `code-reviews/review-snowflake-cost-pack.verdict.json`
- ✅ Implemented dynamic scenario discovery in `src/dashForge/snowflake_cost.py` querying dataForge scenarios directly without hardcoded lists in DashForge
- ✅ Extended CLI entrypoint `dashForge.main generate` to support `--pack snowflakeCost` with dynamic scenario validation, fail-closed argument parsing, and `--force` overwrite guards
- ✅ Preserved `recommendation_queue` table schema with all governance and severity columns intact
- ✅ Enriched snapshot exports with complete provenance tracing (`packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO timestamp, `synthetic: true`, and disclosure text)
- ✅ Maintained bit-for-bit determinism and backwards compatibility for existing packs (`healthcare`, `financial`, `saas`) with zero modifications to `dataForge`
- ✅ Authored targeted test suite `tests/test_snowflake_cost_pack.py` with 34 passing tests; verified full test suite with 74 passing tests
- ✅ Preserved system validator results confirmed compileall and full pytest suite (74 passed in 15.14s, exit status 0; compileall exit status 0)
- ✅ Closed the `package-dataforge-snapshot` slice with formal review verdict `pass` and 0 findings in `code-reviews/review-package-dataforge-snapshot.verdict.json`
- ✅ Implemented deterministic `package_snapshot.py` utility to inspect SQLite tables via `PRAGMA table_info` and export `SQLiteSnapshot` JSON conforming to `frontend/src/core/data/sqliteSnapshot.ts`
- ✅ Added fail-closed overwrite protection in `src/dashForge/main.py` requiring explicit `--force` flag
- ✅ Supported canonical multi-pack generation (`healthcare`, `financial`, `saas`) with reproducible outputs given identical seeds
- ✅ Handled invalid CLI inputs, unknown packs, and unknown scenarios gracefully through `parser.error(...)` without unhandled Python tracebacks
- ✅ Authored targeted test suite `tests/test_package_snapshot.py` with 29 passing tests; verified full test suite with 54 passing tests
- ✅ Preserved system validator results confirmed compileall and full pytest suite (54 passed in 18.61s, exit status 0)
- ✅ Broke mock-data creation out into `/Users/lee/projects/dataForge`, moving
  the real generator CLI, pack assets, and generator tests there while keeping
  dashForge compatibility wrappers for the old Python entrypoints
- ✅ Closed the first post-split review follow-up by making builder
  scenario switches regenerate a valid draft when the current template
  cannot serve the requested scenario, and by making the Python
  `dataForge` bridge report dynamic lookup paths plus support
  `DATAFORGE_SRC`
- ✅ Realigned the living dashForge canon docs so README, architecture,
  product-definition, project-plan, and the active memory files all describe
  `dataForge` as the generator owner and dashForge as the dashboard/runtime owner
- ✅ Shifted the default app surface from `BuilderShell` to the standalone ED
  throughput runtime in `frontend/src/App.tsx` and
  `frontend/src/features/runtime/StandaloneDashboardApp.tsx`
- ✅ Wrote the formal standalone MVP closeout review in
  `code-reviews/review-mvp-standalone-dashboard.md`
- ✅ Realigned `README.md`, `context.md`, `result-review.md`, `sprint-plan.md`,
  `WHERE_AM_I.md`, `product-definition.md`, and `architecture.md` so the repo
  canon now defines the MVP as scenario definition, data generation, and a
  standalone dashboard deliverable
- ✅ Kept the builder available only as explicit secondary operator mode while
  preserving the current scenario/template and shared adapter contracts
- ✅ Added focused standalone coverage in `frontend/src/App.test.tsx` and
  `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`
- ✅ Fresh standalone closeout verification passed in sandbox on 2026-04-02:
  `python3 -m pytest -q`, `npm --prefix frontend test`, and
  `npm --prefix frontend run build`
- ✅ Closed the standalone MVP repair follow-up by narrowing
  `StandaloneDashboardApp.test.tsx` to the renderer seam, removing deferred
  initial-hydration transitions from the shared read-only runtime path, and
  recording repeated rerun evidence in
  `code-reviews/repair-mvp-standalone-dashboard.md`
- ✅ Added the practical ED throughput demo build artifacts:
  `scenarios/healthcare/ed-throughput-crunch-data-design.md`,
  `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`, and
  `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`
- ✅ Materialized first-pass ED throughput demo runtime artifacts:
  `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`,
  `scenarios/healthcare/ed-throughput-crunch-preview-data.json`,
  `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`, and
  `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- ✅ Closed the ED throughput demo workflow repair pass by defining
  `facility_summary.priority_status`, aligning the priority-table widget spec,
  updating operator label guidance, and recording the outcome in
  `code-reviews/repair-ed-throughput-crunch-demo-workflow.md`
- ✅ Ran and closed a complete ED throughput demo automation cycle (`0700a8a5990b`) including final review-handoff documentation.
- ✅ Defined a bounded ED throughput scenario-to-demo-package workflow in `scenarios/healthcare/ed-throughput-crunch-contract.md` and `plans/ed-throughput-crunch-demo-plan.md`
- ✅ Registered the ED throughput scenario and dedicated command-view template in the
  frontend scenario/template catalogs, including scenario-specific blueprint
  instantiation for in-app dashboard assembly.
- ✅ Sprint 9 added `createDashboardDataAdapter.ts` so `mock`, `live`, and `hybrid` specs resolve through one shared runtime seam
- ✅ Sprint 9 added a bounded read-only REST adapter plus explicit hybrid composition under `frontend/src/core/data/`
- ✅ The builder property rail now exposes data-mode switching, dataset visibility, and per-dataset REST binding/field-map editing
- ✅ Builder JSON import/export now accepts live and hybrid specs, and serialized DashboardSpec artifacts strip `connection.headers` before export/storage
- ✅ Shared runtime coverage now includes a renderer-level hybrid/live binding test in addition to adapter and builder coverage
- ✅ Fresh Sprint 9 verification passed in sandbox on 2026-04-01: `python3 -m pytest -q`, `npm --prefix frontend test`, and `npm --prefix frontend run build`
- ✅ Sprint 9 repair closed the live field-map readiness gap from `code-reviews/verify-sprint-09.md` and added focused adapter plus builder regressions
- ✅ `code-reviews/review-sprint-09.md` now exists as the formal Sprint 9 closeout review artifact
- ✅ `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now agree that Sprint 9 and the governed Sprint 1-9 ladder are closed
- ✅ Project scaffolded with init-agent
- ✅ `AGENTS.md` established agent guardrails
- ✅ `product-definition.md` established as product canon
- ✅ `architecture.md` established as technical canon
- ✅ Planning and session docs refreshed to match canon
- ✅ `sprint-plan.md` created
- ✅ React/Vite/TypeScript foundation scaffolded in `frontend/`
- ✅ Initial DashboardSpec subset implemented and validated with Ajv
- ✅ First KPI widget rendered through `DashboardBox` and adapter seam
- ✅ Line-chart primitive added through a custom ECharts wrapper
- ✅ Scenario-backed mock data registry added behind the adapter seam
- ✅ ECharts bundle warning addressed with lazy chart loading and chunk splitting
- ✅ `react-grid-layout` explicitly deferred until builder-mode work
- ✅ Python scaffold retirement timing explicitly deferred to the first post-foundation cleanup slice
- ✅ Governed delivery artifacts created in `docs/`, `plans/`, `playbooks/`, and `code-reviews/`
- ✅ The governed workflow was validated and executed end to end after the slice was completed
- ✅ `npm test`, `npm run build`, and preview startup all pass in `frontend/`
- ✅ The compressed remaining-project workflow was replaced with a full sprint-by-sprint Agent-Orch program
- ✅ `playbooks/project_sprint_program.yaml` now sequences Sprints 2-9 with closeout gates between sprints
- ✅ Agent-Orch run `1a0b9cf0f41d` exposed a real orchestration issue: the default 10-minute `codex_cli` timeout is too short for substantial implementation steps
- ✅ Agent-Orch was patched locally to support `AGENT_ORCH_CODEX_TIMEOUT_SECONDS`
- ✅ Agent-Orch run `dc43dbbb8ea0` exposed a second orchestration issue: stable dashboard writes needed to be modeled as operational paths instead of worker-attributed file changes
- ✅ The durable governed playbooks now declare `operational_paths: ["artifacts/current/"]`, while Agent-Orch itself excludes run artifact directories from changed-file attribution
- ✅ The governed playbooks now allow `tests/` for implementation/verification/repair steps so legitimate test additions do not trigger false failures
- ✅ Agent-Orch run `f98697981a67` exposed a Sprint 4 playbook mismatch between expected output filenames and the actual financial scenario file names already in the repo
- ✅ Sprint 4 recovery playbooks were used to keep delivery moving before native `resume-run` was available in the local operating flow; they are now archived under `playbooks/backups/`
- ✅ Agent-Orch run `2e34405fba8c` carried 20 governed steps to completion, then halted at `s08_implement` because the playbook still expected `AIPromptBar.tsx` and `generateSpec.ts`
- ✅ The Sprint 8 recovery playbook is now archived under `playbooks/backups/` as historical evidence rather than an active future workflow
- ✅ Agent-Orch run `92e1ee3f4b29` carried Sprint 8 closeout and Sprint 9 contract/plan successfully, then halted at `s09_implement` because the playbook still expected `frontend/src/features/binding/BindingWorkflow.tsx` instead of the repo's real builder-integrated binding surface `frontend/src/features/builder/BindingPanel.tsx`
- ✅ The Sprint 9 recovery playbook is now archived under `playbooks/backups/`; future recovery should use Agent-Orch `resume-run`
- ✅ Agent-Orch run `dbf00b6e464e` carried the governed ladder through Sprint 9 closeout with a watched stable HTML dashboard and a 60-minute Codex worker timeout
- ✅ The active `playbooks/` surface is now normalized back to durable future-use workflows only, with recovery-specific playbooks retained under `playbooks/backups/`
- ✅ Sprint 2 contract and implementation plan artifacts exist under `docs/` and `plans/` for spec/runtime completion
- ✅ Sprint 2 frontend implementation landed with shared validation, concrete theme runtime, persistence seams, and the SQLite adapter boundary
- ✅ Sprint 2 verification, repair, and review artifacts were added under `code-reviews/`
- ✅ `npm test` and `npm run build` now pass in `frontend/` for the Sprint 2 slice
- ✅ The current Sprint 2 frontend workspace was re-verified in sandbox with `npm test` and `npm run build`
- ✅ Sprint 2 review/handoff docs were refreshed so `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now reflect the same closed Sprint 2 state
- ✅ Sprint 3 healthcare assets now cover `flu-season`, `quality-improvement`, and `cost-pressure`
- ✅ `src/dashForge/main.py` and `src/dashForge/generate.py` now provide a deterministic healthcare SQLite generation CLI plus optional snapshot export
- ✅ The frontend SQLite path now has a usable SQLite-derived snapshot bridge behind `DataAdapter`
- ✅ `tests/test_generate.py` now covers CLI behavior, determinism, scenario-story checks, and one aggregate/drill-down consistency path
- ✅ The generator overwrite guard is now covered in `tests/test_generate.py`, and the real CLI happy/unhappy paths were rechecked from the repo root
- ✅ `src/dashForge/main.py` now accepts `--pack financial` and `--pack saas`
- ✅ `tests/test_generate.py` now covers Financial Services and SaaS CLI dispatch, unknown pack/scenario failures, and deterministic snapshots
- ✅ `frontend/src/mock-data/scenarioCatalog.test.ts` and `frontend/src/mock-data/templateCatalog.test.ts` now validate non-healthcare scenario registration and template default coverage
- ✅ `frontend/src/mock-data/scenarioCatalog.ts` now exposes a pack-aware primary trend dataset contract so shared Sprint 4 tests and later template callers can stay cross-pack without breaking healthcare
- ✅ Fresh 2026-04-01 verification passed for Sprint 4 implementation: `python3 -m pytest tests/test_generate.py -q`, `npm test`, `npm run build`, and real financial/SaaS CLI generation flows
- ✅ `code-reviews/review-sprint-04.md` now exists as the formal Sprint 4 closeout review artifact
- ✅ `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now agree that Sprint 4 is closed and Sprint 5 is next
- ✅ Sprint 5 frontend implementation now exists in-repo: broadened spec/schema support, shared chart/theme compilers, six new primitives, and a responsive read-only grid runtime
- ✅ `frontend/src/sample/sampleDashboard.ts` now exercises all eight MVP primitives against the Sprint 4 SaaS baseline, with one bounded inline stacked-bar proof payload
- ✅ Sprint 5 frontend verification passed in sandbox: `cd frontend && npm test` and `cd frontend && npm run build`
- ✅ `code-reviews/review-sprint-05.md` now exists as the formal Sprint 5 closeout review artifact
- ✅ `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now agree that Sprint 5 is closed and Sprint 6 is next
- ✅ Sprint 6 frontend implementation now exists in-repo: builder shell, editable grid canvas, widget palette, property panel, template gallery, and JSON spec I/O helpers
- ✅ `frontend/src/App.tsx` now opens the Sprint 6 manual-authoring workspace by default instead of the Sprint 5 fixed sample shell
- ✅ `react-grid-layout` is now adopted in `frontend/` for Sprint 6 builder composition
- ✅ Sprint 6 targeted coverage now exists for builder state, template instantiation, spec I/O, and a live builder-shell interaction path
- ✅ Fresh Sprint 6 frontend verification passed in sandbox: `cd frontend && npm test` and `cd frontend && npm run build`
- ✅ Sprint 6 governed verify, repair, and review artifacts now all exist under `code-reviews/`
- ✅ `code-reviews/review-sprint-06.md` now exists as the formal Sprint 6 closeout review artifact
- ✅ Fresh Sprint 6 closeout reruns passed in sandbox: `python3 -m pytest -q`, `cd frontend && npm test`, and `cd frontend && npm run build`
- ✅ `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now agree that Sprint 6 is closed and Sprint 7 is next
- ✅ Sprint 7 frontend implementation now exists in-repo: narrative store, story-arc editor, presenter mode, bounded annotation support, and browser-local export helpers
- ✅ `frontend/src/features/presenter/` now carries the Sprint 7 narrative, presenter, and annotation runtime surface
- ✅ `frontend/src/features/export/` now carries validated spec download and printable proposal-artifact export helpers
- ✅ Sprint 7 builder integration landed in `BuilderShell`, `BuilderToolbar`, `PropertyPanel`, `DashboardRenderer`, and `WidgetRenderer` without forking the shared runtime
- ✅ Sprint 7 targeted coverage now exists for narrative hydration/clamping, story editing, presenter stepping/emphasis, and export helpers
- ✅ Fresh Sprint 7 frontend verification passed in sandbox: `cd frontend && npm test` and `cd frontend && npm run build`
- ✅ `code-reviews/verify-sprint-07.md` now records the governed Sprint 7 verification pass and the one presenter-export defect it found
- ✅ Sprint 7 repair now blocks presenter-mode proposal export from serializing presenter chrome or default presenter notes
- ✅ `code-reviews/repair-sprint-07.md` now records the Sprint 7 repair step and rerun evidence
- ✅ Fresh Sprint 7 repair reruns passed in sandbox: `python3 -m pytest -q`, `cd frontend && npm test`, and `cd frontend && npm run build`
- ✅ `code-reviews/review-sprint-07.md` now exists as the formal Sprint 7 closeout review artifact
- ✅ Fresh Sprint 7 closeout reruns passed in sandbox: `python3 -m pytest -q`, `cd frontend && npm test`, and `cd frontend && npm run build`
- ✅ `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now agree that Sprint 7 is closed and Sprint 8 contract/plan work is next
- ✅ Sprint 8 frontend implementation now exists in-repo under `frontend/src/features/ai/` with AI prompt entry, prompt templates/context helpers, a Claude-compatible client seam, and bounded generation/repair helpers
- ✅ `frontend/src/features/builder/BuilderShell.tsx` now stages AI candidates separately from the active draft and requires explicit apply/discard before changing the shared runtime
- ✅ Sprint 8 targeted coverage now exists for prompt templates/context assembly, provider response handling, validation/repair behavior, and builder integration
- ✅ Fresh Sprint 8 frontend verification passed in sandbox on 2026-04-01: `cd frontend && npm test` and `cd frontend && npm run build`
- ✅ Sprint 8 prompt defaults now follow the canonical scenario default-template mapping instead of array order, and improve-current generation now requires a validated active draft before the provider seam runs
- ✅ Sprint 8 AI generation now returns a clear bounded request error when imported/current drafts fall outside the registered mock scenario canon instead of throwing during prompt assembly
- ✅ Generate-new prompt seeding now aligns the starter spec theme to the builder's currently selected theme before the provider seam runs
- ✅ `code-reviews/verify-sprint-08.md`, `code-reviews/repair-sprint-08.md`, and `code-reviews/review-sprint-08.md` now exist as the governed Sprint 8 closeout trail
- ✅ Fresh Sprint 8 closeout reruns passed in sandbox: `python3 -m pytest -q`, `npm --prefix frontend test`, and `npm --prefix frontend run build`
- ✅ `context.md`, `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` now agree that Sprint 8 is closed and Sprint 9 planning is next
- ✅ Sprint 3 verification, repair, and review artifacts were added under `code-reviews/`
- ✅ `python3 -m pytest -q`, `npm test`, and `npm run build` all pass for the Sprint 3 slice
- ✅ Sprint 3 handoff docs were refreshed so the durable project state points to Sprint 4 next
- ✅ `code-reviews/review-sprint-03.md` was generated for this handoff attempt

### In Progress

- ⏳ One host-capable browser smoke is still required to validate the
  standalone ED throughput default path and the still-available Sprint 9
  live-binding workflow end to end in a non-restricted browser environment
- ⏳ The next work after the standalone MVP correction still needs to be chosen
  as a new bounded roadmap slice rather than extending the closed Sprint 1-9
  governed ladder in place
- ⏳ The first reusable scenario-building skill set still needs to be specified
  so future scenario packages can follow the same contract/design/materialize/
  standalone-deliverable pattern consistently

---

## Decisions Locked

| Decision | Rationale | Date |
|----------|-----------|------|
| Incremental delivery methodology | Build from scratch with small primitives; validate before scale | 2026-03-31 |
| `product-definition.md` and `architecture.md` are canon | Prevent scaffold-era docs from driving implementation choices | 2026-03-31 |
| DashForge targets React/Vite/TypeScript with DashboardSpec at the center | Matches the current architecture and MVP definition | 2026-03-31 |
| The Python package is not a second app runtime, but Sprint 3 gives it one intentional bounded role as the SQLite mock-data generator CLI | Preserves the React-first product shape while making the SQLite generation path real | 2026-03-31 |
| The canonical frontend lives in `frontend/` during Sprint 1 | Minimizes repo churn while the new runtime proves itself | 2026-03-31 |
| Foundation sample data resolves through scenario-backed mock references, not inline-only widget payloads | Proves the adapter seam without forcing SQLite into Sprint 1 | 2026-03-31 |
| `react-grid-layout` adoption is deferred until builder-mode work needs composition behavior | Avoids front-loading layout complexity into the foundation sprint | 2026-03-31 |
| Python scaffold retirement moves to the first cleanup slice after foundation | Keeps Sprint 1 focused on proving the canonical runtime | 2026-03-31 |
| Sprint 2 proves the browser-side SQLite seam without adding a runtime SQLite dependency yet | Satisfies the architectural seam while staying inside current guardrails | 2026-03-31 |
| Sprint 3 should build on the Sprint 2 seams rather than reopening spec, theme, persistence, or adapter contracts without a concrete defect | Keeps the governed ladder moving forward instead of re-litigating closed baseline work | 2026-03-31 |
| Sprint 3 uses SQLite-derived snapshots for the current frontend runtime instead of adding a direct browser SQLite engine in the same slice | Delivers a usable adapter-facing path while keeping SQLite as the canonical generated artifact | 2026-03-31 |
| `code-reviews/review-sprint-04.md` is the formal Sprint 4 closeout artifact | Completes the governed handoff requirement before Sprint 5 begins | 2026-04-01 |
| Sprint 5 uses explicit per-primitive chart compiler branches instead of a generic chart DSL | Keeps the broadened primitive surface readable and verifiable inside the bounded runtime slice | 2026-04-01 |
| `code-reviews/review-sprint-05.md` is the formal Sprint 5 closeout artifact | Completes the governed handoff requirement before Sprint 6 begins | 2026-04-01 |
| Sprint 6 adopts `react-grid-layout` for manual authoring while keeping DashboardSpec `position` as the canonical stored layout | Delivers editable composition without widening the sprint into a speculative layout-schema redesign | 2026-04-01 |
| Sprint 6 imports remain mock-backed only in the builder shell | Keeps the manual-authoring slice aligned with the existing adapter/runtime path instead of pretending live-binding authoring is already in scope | 2026-04-01 |
| `code-reviews/review-sprint-06.md` is the formal Sprint 6 closeout artifact | Completes the governed handoff requirement before Sprint 7 begins | 2026-04-01 |
| Sprint 7 stages presenter mode and export on the existing `DashboardRenderer` / `WidgetRenderer` path instead of introducing a disconnected renderer | Preserves the shared spec-driven runtime across build, preview, presenter, and export flows | 2026-04-01 |
| Sprint 7 proposal export should serialize only the dashboard stage by default and exclude presenter notes unless explicitly requested | Keeps proposal artifacts aligned with the sprint contract and prevents presenter-only chrome from leaking into exported output | 2026-04-01 |
| `code-reviews/review-sprint-07.md` is the formal Sprint 7 closeout artifact | Completes the governed handoff requirement before Sprint 8 begins | 2026-04-01 |
| Sprint 8 AI generation should reject unsupported imported/live draft context as a clear request-time failure | Preserves the bounded mock-backed contract and avoids unsafe prompt-time crashes or silent fallback paths | 2026-04-01 |
| `code-reviews/review-sprint-08.md` is the formal Sprint 8 closeout artifact | Completes the governed handoff requirement before Sprint 9 begins | 2026-04-01 |
| Sprint 9 resolves `mock`, `live`, and `hybrid` specs through one adapter factory instead of view-specific branching | Preserves the existing renderer/presenter/export path while allowing live bindings to stay behind the `DataAdapter` seam | 2026-04-01 |
| Serialized DashboardSpec artifacts must strip live header overrides before export or storage | Keeps live-binding metadata portable without persisting durable secrets in product artifacts | 2026-04-01 |
| `code-reviews/review-sprint-09.md` is the formal Sprint 9 closeout artifact | Completes the governed handoff requirement for the Sprint 1-9 delivery ladder | 2026-04-01 |
| The standalone MVP entry point now opens directly into the ED throughput dashboard and keeps builder mode opt-in | Aligns the default app experience with the clarified MVP without introducing a second renderer or breaking the existing authoring surface | 2026-04-02 |
| The product canon now defines the MVP as scenario definition, generated data, and a standalone dashboard deliverable | Prevents advanced builder/presenter/AI/live-binding breadth from obscuring the product's first proof of value | 2026-04-02 |
| `package-dataforge-snapshot` CLI enforces fail-closed overwrite protection and extracts SQLiteSnapshot JSON via SQLite PRAGMA table_info | Prevents accidental data loss during workshop rehearsal and guarantees schema alignment with DataAdapter runtime without external dependencies | 2026-09-02 |
| `snowflake-cost-pack` CLI dynamically discovers dataForge scenarios and preserves recommendation queue | Extends DashForge CLI with snowflakeCost pack support, provenance metadata, and fail-closed overwrite guards without hardcoding scenarios or external runtime dependencies | 2026-09-02 |
| `idle-warehouse-waste` slice formalizes 7-dataset snapshot schema and recommendation queue governance | Delivers deterministic offline presentation, provenance tracing, and safety guardrails for Snowflake idle warehouse waste consulting demonstrations | 2026-09-02 |
| `idle-warehouse-dashboard` slice establishes presentation tier, controlled readiness, and recommendation queue | Implements standalone presentation at /?scenario=idle-warehouse-waste with TVIQ metrics, persistent synthetic disclosure, and interactive recommendation queue with directional guardrails | 2026-09-06 |
| User simulation schema omission protocol & verbatim execution | Enforces minLength: 1 and omission protocol for stdout_contains, verbatim root argv execution, and AC traceability in journeys/manifest to prevent simulation gate schema validation failures | 2026-09-06 |
| Idle warehouse remediation artifacts & same-day executive deliverables | Bridges analytical discovery and operational action with prioritized low-risk recommendations (FINANCE_REPORTING_WH P0 first), directional owner validation guardrails, and same-day follow-up artifact generation | 2026-09-06 |
| Synthetic RBAC Audit Foundation relational schemas & governance architecture | Formalizes 6 canonical datasets (rbac_summary, roles, role_hierarchy, user_role_assignments, object_grants, governance_findings), canonical DashboardSpec wiring, persistent synthetic disclosures, and directional security guardrails | 2026-09-06 |

---

## Document Inventory

### Planning (Stable)

| File | Purpose | Status |
|------|---------|--------|
| `product-definition.md` | Product vision, constraints, MVP | ✅ Canon |
| `architecture.md` | Technical architecture, stack, design rules | ✅ Canon |
| `project-plan.md` | Strategic roadmap, phases, success metrics | ✅ Phase 4 entry and the closed Sprint 1-9 governed program are recorded |
| `sprint-plan.md` | Tactical execution | ✅ Sprint 9 plus the standalone MVP closeout are recorded; host-only follow-up remains noted |
| `AGENTS.md` | AI agent guide, conventions, operational modes | ✅ Active |

### Session Memory (Dynamic)

| File | Purpose | Status |
|------|---------|--------|
| `context.md` | Working state, current focus, next actions | 🔄 Active |
| `WHERE_AM_I.md` | Product-level orientation and progress | 🔄 Active |
| `result-review.md` | Running log of completed work | 🔄 Active |

### Backlog System

| File | Purpose | Status |
|------|---------|--------|
| `backlog/schema.md` | Unified backlog item schema | ✅ Created |
| `backlog/template.md` | Copy-paste template for new backlog items | ✅ Created |

---

## Open Questions

1. How much host-environment visual polish or usability adjustment will be needed after the first real browser smoke of the standalone default dashboard plus Sprint 9 live-binding workflow?
2. Is the browser-native print export path sufficient for proposal use, or does later roadmap work need a dependency-backed PNG capture path?
3. Should a later slice add a host-local credential helper for live bindings, or is safe metadata-only export plus manual local overrides sufficient?

---

## Next Actions Queue (ranked)

| Rank | Action | Owner | Done When |
|------|--------|-------|----------|
| 1 | Run one local browser smoke of the standalone default dashboard and Sprint 9 binding workflow outside this sandbox | Human+AI | Dev or preview startup succeeds in a port-binding-capable environment and the standalone default, builder handoff, live/hybrid mode switching, preview, presenter, and export affordances are clickable |
| 2 | Decide the next bounded roadmap slice beyond the closed standalone MVP proof and Sprint 1-9 governed ladder | Human+AI | A new contract/plan exists for the next slice instead of widening the current MVP informally |
| 3 | Specify the first reusable scenario-building skill set under `skills/` | Human+AI | Future scenario work has a durable skill path for scenario brief, data design, blueprint, build checklist, and SQLite-plus-JSON package generation |

---

## Working Conventions

### Start of session

1. Read `AGENTS.md`
2. Read this file
3. Read `result-review.md`
4. Read `sprint-plan.md`
5. Read `WHERE_AM_I.md`
6. Re-read `product-definition.md` and `architecture.md` when direction or implementation details matter

### End of work unit

1. Move completed items into "Recently Completed"
2. Update "Next Actions Queue"
3. Add any new "Decisions Locked"
4. Keep "Open Questions" to 5 or fewer

---

## Environment Notes

- **Working Directory**: `./dashForge`
- **Project Name**: `dashForge`
- **Canonical Product Shape**: React/Vite/TypeScript dashboard application
- **Current Repo Residue**: Bootstrap-era Python structure still present around the now-intentional generator CLI surface
- **Author**: Lee Harrington

---

*This file is a living document. Update it frequently.*

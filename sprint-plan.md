# DashForge Sprint Plan

> **Tactical execution plan** for the current sprint window.
>
> This file should stay concrete. If the strategy changes, update `project-plan.md`. If product direction changes, update `product-definition.md` or `architecture.md`.

## Synthetic RBAC Audit Foundation Slice — 2026-09-06

**Status:** Complete — Passed Governed Review

- [x] Foundational relational schemas across six canonical datasets: typed schema definitions in `src/dashForge/rbac_audit.py` and `src/dashForge/snowflake_rbac.py` for `rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, and `governance_findings`, with deterministic SQLite generation and `SQLiteSnapshot` JSON representations conforming to `frontend/src/core/data/sqliteSnapshot.ts` (AC-1).
- [x] Canonical `DashboardSpec` specification & runtime DataAdapter wiring: defined `DashboardSpec` in `frontend/src/features/rbac-audit/rbacAuditSpec.ts` and template `tpl.snowflakeRbac.rbac-audit-foundation` for scenario `snowflakeRbac:rbac-audit-foundation`, declaring KPI scorecards, interactive role hierarchy tree visualization (`role-hierarchy-tree`), user access audit matrix (`user-access-matrix`), and prioritized governance findings queue (`governance-findings`), binding exclusively through `DataAdapter` runtime interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`) without bespoke renderers (AC-2).
- [x] Persistent & unsuppressed synthetic demo data disclosures & directional security guardrails: persistent `data-disclosure="synthetic-demo-data"` badge displaying `"Synthetic demo data"`, upstream provenance metadata, and explicit directional validation notices stating all role remediation recommendations are directional pending confirmation with designated security administrators (AC-3).
- [x] Frontend production build conformance & browser smoke gate markers: `npm --prefix frontend run build` compiles cleanly with zero TypeScript errors, preserving contract markers `"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, and `"governance-findings"` under `frontend/dist/assets/*.js` with `data-mode="real-client-disabled"` (AC-4).
- [x] Verbatim workspace-root command execution & user journey traceability: `journeys/user_journeys_manifest.json` conforms to schema with valid authorities (`human`, `mission`, `author`), `status: "passed"`, full AC-1..AC-6 traceability, allowlist prefix compliance (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest`, `npm --prefix frontend test -- --run`), and zero shell operators (AC-5).
- [x] Preservation of existing dashboard functionality & regression safety: deterministic CLI generation across all existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost:idle-warehouse-waste`), fail-closed overwrite protection requiring `--force`, sibling repository `dataForge` unmodified and read-only, and all 229 tests passing (AC-6).
- [x] Passed governed review with verdict `pass` and 0 findings across correctness and compliance lenses in `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json` and `code-reviews/review-synthetic-rbac-audit-foundation.md`.
- [x] Preserved validator evidence: compileall (`compileall tests/test_rbac_audit.py`, exit status 0, duration 0.157367s), targeted pytest (30 passed in 1.72s, exit status 0, duration 2.394492s), full pytest (229 passed in 19.77s, exit status 0, duration 20.496692s), full compileall (`compileall src tests`, exit status 0, duration 0.071066s), and frontend vitest (`npm --prefix frontend test -- --run`, exit status 0, duration 5.351294s, 35 files / 108 tests passed in 4.68s) passed.

This slice delivers the foundational synthetic access control telemetry, relational schemas, and dashboard specification for the RBAC management accelerator in DashForge, enabling consulting teams to demonstrate authoritative governance insights for enterprise cloud data platforms completely offline with zero live credentials and zero network dependencies.

## Idle Warehouse Remediation Artifacts Slice — 2026-09-06

**Status:** Complete — Passed Governed Review

- [x] Prioritized low-risk recommendations & directional framing: generated `recommendation_queue` table and snapshot dataset include all six governance fields, `performance_risk`, and `scope_name` with `FINANCE_REPORTING_WH` (`IWW-001`, `P0`, minimal risk) ordered first; presentation tier provides accessible toggle `data-action="open-recommendation-queue"` and container `data-status="recommendation-queue"` with directional validation guardrails (AC-1).
- [x] Interactive same-day executive follow-up artifact generation: standalone presentation embeds an interactive artifact generator (`data-action="same-day-executive-follow-up"`, `data-status="executive-follow-up"`) capturing headline metrics (726 compute credits/month opportunity, 2 unmonitored warehouses, FINANCE_REPORTING_WH dominant concentration), upstream work-package digest citation (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), observation claim citations, and real-client mode disabled guard (AC-2).
- [x] Persistent & unsuppressed synthetic demo data disclosures: persistent `data-disclosure="synthetic-demo-data"` badge displaying `"Synthetic demo data"`, preserved across presentation header, quality card, follow-up HTML deliverable, and landscape print-to-PDF export (AC-3).
- [x] Frontend production build conformance & browser smoke gate markers: verified against `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`, preserving contract markers `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"` in compiled JavaScript bundles under `frontend/dist/assets/*.js` with zero live credentials and `data-mode="real-client-disabled"` (AC-4).
- [x] Verbatim workspace-root command execution & user journey traceability: `journeys/user_journeys_manifest.json` conforms to schema with valid authorities (`human`, `mission`, `author`), `status: "passed"`, full AC-1..AC-6 traceability, allowlist prefix compliance, and zero shell operators (AC-5).
- [x] Preservation of existing dashboard functionality & regression safety: deterministic CLI generation across all seven datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) with fail-closed overwrite protection, backwards compatibility across existing packs (`healthcare`, `financial`, `saas`), sibling repository `dataForge` unmodified, and all 199 tests passing (AC-6).
- [x] Passed governed review with verdict `pass` and 0 findings across implementation, contract, and user simulation lenses in `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json` and `code-reviews/review-idle-warehouse-remediation-artifacts.md`.
- [x] Preserved validator evidence: compileall (`compileall tests/test_remediation_artifacts.py`, exit status 0, duration 0.183588s), targeted pytest (32 passed in 0.85s, exit status 0, duration 1.536486s), full pytest (199 passed in 18.44s, exit status 0, duration 19.169097s), full compileall (`compileall src tests`, exit status 0, duration 0.059179s), and frontend vitest (`npm --prefix frontend test -- --run`, exit status 0, duration 6.378009s, 35 files / 108 tests passed) passed.

This slice delivers prioritized low-risk recommendations and same-day executive deliverables for the Idle Warehouse Waste cost accelerator in DashForge, enabling executive buyers to act immediately on identified compute waste with directional owner-validation guardrails, persistent synthetic data disclosures, and zero live credential dependencies.

## Fix User Simulation Schema Slice — 2026-09-06

**Status:** Complete — Passed Governed Review

- [x] Schema formalization and omission protocol enforcement in `src/dashForge/playbook_schema.py`: canonical `USER_JOURNEYS_RESULT_SCHEMA` enforces `minLength: 1` on `stdout_contains`, and helper functions `build_command_claim` and `sanitize_command_claim` omit `stdout_contains` when empty or unasserted (AC-1).
- [x] User journeys manifest schema conformance and authority governance: `journeys/user_journeys_manifest.json` conforms to `USER_JOURNEYS_MANIFEST_SCHEMA`, with valid authorities (`human`, `mission`, `author`, `exploratory`), status `passed`, sequential steps, executable commands, and `traces_to` covering AC-1 through AC-5 without dangling IDs (AC-2).
- [x] Verbatim workspace-root command execution: application CLI commands standardized to `env PYTHONPATH=src python3 -m dashForge.main` and pytest commands to `python3 -m pytest` with no `PYTHONPATH` override, matching `command_allowlist` prefixes (AC-3).
- [x] Elimination of shell syntax: eliminated shell pipelines (`|`), chaining (`&&`, `||`, `;`), redirection (`<`, `>`), and standalone shell utilities (`jq`, `grep`, `cat`), ensuring direct argv execution compatibility (AC-4).
- [x] Preservation of existing pipeline validations and regression suite integrity: CLI generation for `snowflakeCost` intact, fail-closed overwrite protection intact, existing packs (`healthcare`, `financial`, `saas`) operational, sibling repository `dataForge` unmodified, and all 167 tests passing (AC-5).
- [x] Passed governed review with verdict `pass` and 0 findings in `code-reviews/review-fix-user-simulation-schema.verdict.json` and `code-reviews/review-fix-user-simulation-schema.md`.
- [x] Preserved validator evidence: compileall (`compileall tests/test_playbook_schema.py`, exit status 0, duration 0.168819s), targeted pytest (24 passed in 0.63s, exit status 0, duration 1.339025s), full pytest (167 passed in 16.98s, exit status 0, duration 17.712756s), and full compileall (`compileall src tests`, exit status 0, duration 0.06114s) passed.

This slice formalizes the operational and schema contract governing Agent-Orch playbook quality gates and user journey simulation verification, resolving structural schema validation failures at the `step_08b_user_simulation_gate` stage via strict non-empty `stdout_contains` constraints, omission protocols, verbatim root execution, and acceptance check traceability.

## Idle Warehouse Dashboard Slice — 2026-09-06

**Status:** Complete — Passed Governed Review

- [x] Standalone frontend scenario mounting & runtime seam resolution: resolves `/?scenario=idle-warehouse-waste` through `StandaloneDashboardApp.tsx`, consuming `StaticDataAdapter` and `SyntheticDataArtifactAdapter` with zero live Snowflake credentials, zero backend servers, and zero cloud network dependencies (AC-1).
- [x] Scenario container attributes & controlled readiness signaling: root container carries `data-scenario="idle-warehouse-waste"`, `data-readiness="controlled"`, and claim ledger anchored to verified digest `sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390` (AC-2).
- [x] Persistent & unsuppressed synthetic demo data disclosure rendering: unsuppressed `data-disclosure="synthetic-demo-data"` badge displaying `"Synthetic demo data"`, preserved across quality card, PDF export, and executive follow-up HTML (AC-3).
- [x] Interactive prioritized recommendation queue with governance guardrails: toggle `data-action="open-recommendation-queue"` opens `data-status="recommendation-queue"` with `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) ordered first, displaying all 6 governance columns and framing savings as directional until validated by designated warehouse owners (AC-4).
- [x] Same-day executive follow-up & landscape PDF export: provides `data-action="same-day-executive-follow-up"` and `data-testid="dashboard-save-pdf"` with evidence citations and story narrative (AC-5).
- [x] Browser smoke gate conformance & bundle verification: verified against `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`, preserving markers `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"` in production bundles (AC-6).
- [x] Production build integrity & automated frontend test suite: `npm --prefix frontend test -- --run` passed with 35 test files and 108 tests; Vitest covers routing, readiness, disclosures, recommendation queue, and export (AC-7).
- [x] Backend slice preservation, zero regressions & sibling repository isolation: zero external dependencies in `src/dashForge`, no hardcoded scenarios, sibling project `dataForge` unmodified, backwards compatibility maintained across existing packs (`healthcare`, `financial`, `saas`), and full test suite passed with 143 tests (AC-8).
- [x] Passed governed review with verdict `pass`, 0 findings across correctness and requirements lenses in `code-reviews/review-idle-warehouse-dashboard.verdict.json`.
- [x] Preserved validator evidence: all compileall, targeted pytest (31 passed in 0.86s, exit status 0), full pytest (143 passed in 17.19s, exit status 0), compileall src tests (exit status 0), and frontend vitest (35 files / 108 tests passed in 8.02s, exit status 0) passed.

This slice delivers the buyer-visible presentation layer for the Idle Warehouse Waste cost accelerator in DashForge, establishing standalone runtime seams, TVIQ metric structures, controlled readiness, unsuppressed synthetic disclosures, interactive recommendation queues with directional guardrails, and browser smoke gate conformance.

## Snowflake Accelerator Revival — 2026-09-04

**Status:** Complete — independently accepted

- [x] Backend and frontend implementation reviewed in separate worktrees; invalid/aliased output targets repaired fail-closed.
- [x] Real React recommendation-queue action, disclosure marker, and browser scenario routing replace the discarded build shim/source-read monkeypatch.
- [x] Reproducible `npm ci`, production build, full Python/frontend suites, deterministic assets, and real Chromium interaction pass.
- [x] Full dependency audit has 0 Critical, High, or Moderate findings (2 Low development-tool advisories remain).
- [x] Nine-step governed playbook separates test authorship, dependencies/audit, backend, frontend, build, browser, user validation, and independent review; strict lint and preflight pass.
- [x] Timeout partials remain preserved for evidence but are excluded from the accepted implementation.

## Idle Warehouse Waste Slice — 2026-09-02

**Status:** Complete

- [x] Canonical snapshot ingestion and schema validation for all 7 canonical datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) conforming to `SQLiteSnapshot` specification (AC-1).
- [x] Provenance tracing and synthetic disclosure metadata embedded in generated snapshots (AC-1).
- [x] Deterministic CLI generation pipeline supporting `--pack snowflakeCost --scenario idle-warehouse-waste` with fail-closed overwrite protection requiring `--force` (AC-2).
- [x] Formalized `DashboardSpec` contract and claim ledger verification linking metrics and narrative directly to dataset evidence (AC-3).
- [x] DataAdapter runtime query and aggregation routing across all 7 datasets (AC-4).
- [x] Catalog registrations for scenario `snowflakeCost:idle-warehouse-waste` and starter template `tpl.snowflakeCost.idle-warehouse-waste` (AC-5).
- [x] Preserved `recommendation_queue` table schema with all 6 governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) and safety guardrails (AC-6).
- [x] Standalone executive presentation and follow-up export workflow with clear synthetic data disclosures (AC-7).
- [x] Backwards compatibility for existing packs (`healthcare`, `financial`, `saas`); zero changes to sibling project `dataForge`; full regression suite passes with 109 tests (AC-8).
- [x] Passed governed review with verdict `pass`, recommendation `ready`, and 0 findings in `code-reviews/review-idle-warehouse-waste.verdict.json`.
- [x] Preserved validator evidence: all compileall and pytest checks passed (final full test suite: 109 passed in 15.60s, exit status 0; targeted suite: 35 passed in 0.93s, exit status 0; compileall exit status 0).

This slice delivers the complete, verified `idle-warehouse-waste` vertical slice for Snowflake Cost optimization, providing deterministic 7-dataset packaging, provenance tracking, recommendation queue governance, and standalone presentation capabilities for offline executive workshops.

## Snowflake Cost Pack Slice — 2026-09-02

**Status:** Complete

- [x] CLI entrypoint `dashForge.main generate` accepts `--pack snowflakeCost` alongside existing packs (`healthcare`, `financial`, `saas`), supporting `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` (AC-1).
- [x] Dynamic scenario discovery from dataForge (`idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, `finops-maturity-assessment`) without hardcoding scenario lists in DashForge (AC-2).
- [x] Fail-closed error handling exiting with status 2 and clean diagnostic messages on invalid arguments or missing required options (AC-3).
- [x] Fail-closed overwrite protection requiring explicit `--force` flag when output paths exist (AC-4).
- [x] Deterministic bit-for-bit relational generation and canonical `SQLiteSnapshot` JSON packaging via `src/dashForge/package_snapshot.py` (AC-5).
- [x] Provenance tracing and synthetic demo disclosure metadata embedded in exported snapshots (AC-6).
- [x] Full preservation of `recommendation_queue` table schema and governance columns (AC-7).
- [x] Backwards compatibility and regression immunity for existing packs; complete test suite passes cleanly with zero changes to sibling project `dataForge` (AC-8).
- [x] Passed governed review with verdict `pass` and 0 findings in `code-reviews/review-snowflake-cost-pack.verdict.json`.
- [x] Preserved validator evidence: all compileall and pytest checks passed (final full test suite: 74 passed in 15.14s, exit status 0; targeted suite: 34 passed in 0.99s, exit status 0).

This slice delivers dynamic discovery, deterministic generation, provenance metadata, and recommendation queue packaging for the Snowflake Cost optimization pack within DashForge's canonical CLI and runtime snapshot bridge.

## Package DataForge Snapshot Slice — 2026-09-02

**Status:** Complete

- [x] CLI entrypoint `dashForge.main generate` supporting `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` (AC-1).
- [x] Fail-closed overwrite protection preventing unintentional file overwrites without `--force` (AC-2).
- [x] Relational generation and snapshot serialization pipeline in `src/dashForge/package_snapshot.py` adhering to `SQLiteSnapshot` schema (AC-3, AC-6).
- [x] Deterministic multi-pack support across `healthcare`, `financial`, and `saas` packs (AC-4).
- [x] Clean diagnostic error handling without unhandled tracebacks (AC-5).
- [x] User journeys manifest synchronized in `journeys/user_journeys_manifest.json` across AC-1 through AC-8 (AC-7).
- [x] Governed write scope preserved across all execution steps (AC-8).
- [x] Passed governed review with verdict `pass` and 0 findings in `code-reviews/review-package-dataforge-snapshot.verdict.json`.
- [x] Preserved validator evidence: all compileall and pytest checks passed (final full test suite: 54 passed in 18.61s, exit status 0).

This slice delivers deterministic mock-data packaging and snapshot extraction for DashForge's client-side runtime without introducing external dependencies or live network requirements.

## Unified DashForge/DataForge Operator Guide — 2026-08-11

**Status:** Complete

- [x] Publish one operator guide for browser, LAN HTTPS, Builder, and PDF use.
- [x] Document DataForge generation, scenario validation, employee-package
  generation, and the governed handoff boundary.
- [x] Link the guide from both project READMEs.
- [x] Verify the documented CLI, frontend test suite, production build, and
  active LAN endpoint.

This is an operator-preview guide only. It does not authorize a mission,
authenticate approval, connect live Snowflake, host a production service, or
deliver client material.

## LAN HTTPS Preview and PDF Rendition — 2026-08-11

**Status:** Complete

- [x] Add `npm run dev:lan` with `0.0.0.0` binding and IP-specific HTTPS
  certificate generation/reuse.
- [x] Document Mac access, certificate trust, LAN safety, and port override.
- [x] Add a standalone **Print / Save PDF** action using the existing export
  path.
- [x] Preserve chart colors and provenance in landscape print output while
  hiding interactive controls.
- [x] Verify HTTP/2 200 from `https://192.168.8.10:5173`, 107 frontend tests,
  production build, and a seven-page landscape PDF rendition.

This is a local operator-preview capability only. It does not host a
production service, launch a mission, authenticate approval, connect live
Snowflake data, or deliver client material.

## Field-Service Executive Showcase — 2026-08-10

**Status:** Complete

- [x] Consume the deterministic DataForge field-service work package through
  the strict artifact adapter.
- [x] Register the field-service scenario, primary trend dataset, and dedicated
  executive template.
- [x] Build five contextual KPI comparisons with plan/target semantics.
- [x] Build three story-ordered graphs for demand, branch concentration, and
  callback causes.
- [x] Add a claim-covered narrative arc, controlled-quality disclosure, and
  compact evidence citations.
- [x] Make the field-service review the default presentation while keeping
  Builder available on explicit demand with the same draft.
- [x] Pass 107 frontend tests, the production build, and host browser validation
  with no clipped dashboard cards.

The canonical closed healthcare MVP proof remains unchanged. This slice adds a
synthetic presentation showcase only; it does not launch a mission, authenticate
approval, bind live data, host the app, or deliver client material.

## Cross-Stream Employee Handoff — 2026-08-09

**Status:** Complete

This bounded slice commissioned no live mission. It connected the two product
employees through one pursuit while keeping their work in separate runs:

- DataForge produces `synthetic-data-work-package/1.0`.
- Agent-Orch verifies the source run, employee/tenant/pursuit, artifact type,
  schema, and digest, then materializes a read-only downstream input.
- DashForge consumes that receipt and produces
  `meeting-dashboard-package/1.0`.
- The result cites the exact upstream digest and retains quality, reproduction,
  binding, claim, and browser evidence.
- Human approval remains an explicit gate; no promotion, schedule, live
  Snowflake connector, or client submission is in scope.

Acceptance evidence: DataForge 57 tests, DashForge 33 Python tests plus 103
frontend tests, successful production build including package tools, strict
Agent-Orch playbook lint, independent review 10/10, and a successful fresh
cross-run receipt smoke at digest
`sha256:31d8b97c4843d6d9e5fdd0bcff5009d5abbce6252d8ffe70cbf9b1fdf6b4ba4e`.
The package materializer also rejects stale non-empty output and preserves the
existing directory.

## Commercial Proof Slice — 2026-07-16

The current bounded slice is Snowflake Cost Optimization using only
`idle-warehouse-waste`. Auto-Orch run `ee6fac7897f9` completed the buyer-demo
path with Grok 4.5 High implementation and Claude Code Opus 4.8 High review.
Tests, production build, browser smoke, and the Medium+ review gate passed.
No additional roadmap slice should begin until a real Snowflake buyer signal
is logged; the three Low review findings remain candidates for the next
evidence-driven repair cycle.

## Active Sprint

| Field | Value |
|------|-------|
| **Sprint** | Sprint 9 — Production binding |
| **Status** | COMPLETE — Sprint 9 and the bounded standalone MVP review/handoff are now closed in-repo |
| **Start Date** | 2026-04-01 |
| **Execution Model** | Agent-Orch governed program complete; future reruns should use the canonical durable workflow |
| **Workflow** | `playbooks/project_sprint_program.yaml` |
| **Goal** | Lock a bounded production-binding slice on top of the closed Sprint 8 AI-assisted authoring baseline, then close the clarified standalone MVP correction on top of that baseline without widening the product into backend credential brokering, live SaaS platform work, or unrelated repo cleanup. |

## Sprint Outcome

Sprint 9 is now formally closed in the repo.

- `docs/sprint-09-contract.md` and `plans/sprint-09-plan.md` locked the slice
  against the closed Sprint 8 baseline.
- The implementation landed one shared adapter-resolution seam for `mock`,
  `live`, and `hybrid` specs, plus a bounded read-only REST adapter and hybrid
  composition under `frontend/src/core/data/`.
- `healthcare:ed-throughput-crunch` and its dedicated template/blueprint
  are now registered in the runtime scenario+template catalogs as an in-app
  starter path.
- The builder property rail now exposes dataset-aware binding controls, mode
  switching, and per-dataset REST metadata editing without forking the shared
  preview/presenter/export runtime.
- JSON import/export now accepts valid live and hybrid specs, and durable spec
  serialization strips `connection.headers` so product artifacts do not persist
  secrets.
- The bounded standalone MVP closeout is now also complete: the repo canon,
  review trail, and default app surface all agree that the current product
  proof is one scenario definition, data generation, and a standalone
  dashboard deliverable for `healthcare:ed-throughput-crunch`.
- Governed verification found one field-map readiness gap (`V901`), the repair
  closed it, and the formal review artifact now records a clean post-repair
  closeout state in `code-reviews/review-sprint-09.md`.

## Governed Closeout Trail

Sprint 9's full governed artifact set now exists under:

- `docs/sprint-09-contract.md`
- `plans/sprint-09-plan.md`
- `code-reviews/verify-sprint-09.md`
- `code-reviews/repair-sprint-09.md`
- `code-reviews/review-sprint-09.md`

The governed sprint ladder is now closed through Sprint 9. The stable
human-facing run dashboard remains:

`artifacts/current/dashboard.html`

Recovery-specific restart workflows used during delivery are now archived under
`playbooks/backups/`. Future recovery should prefer Agent-Orch `resume-run`
against the canonical workflow rather than creating new restart playbooks.

## Standalone MVP Closeout Trail

The bounded standalone MVP artifact set now exists under:

- `docs/mvp-standalone-dashboard-contract.md`
- `plans/mvp-standalone-dashboard-plan.md`
- `code-reviews/verify-mvp-standalone-dashboard.md`
- `code-reviews/repair-mvp-standalone-dashboard.md`
- `code-reviews/review-mvp-standalone-dashboard.md`

This trail closes the product-surface correction that turned the repo's
clarified MVP into the default app experience and synchronized the canon
documents around the narrower MVP definition.

The current canon also treats mock-data creation as a sibling-project concern:
`dataForge` now owns the generator implementation and pack assets, while
dashForge keeps compatibility wrappers only for historical CLI/test paths.

## Governed Exit Criteria

- [x] `docs/sprint-09-contract.md` exists
- [x] `plans/sprint-09-plan.md` exists
- [x] Sprint 9 scope stayed locked against the closed Sprint 8 AI-assisted
      authoring baseline
- [x] The governed workflow advanced beyond Sprint 8 closeout into Sprint 9 work
- [x] Sprint 9 implementation started only after the contract and plan existed
- [x] Central adapter resolution, REST binding, and builder binding UI are in-repo
- [x] `python3 -m pytest -q`, `npm --prefix frontend test`, and `npm --prefix frontend run build` passed on 2026-04-01
- [x] Governed Sprint 9 verify/repair/review artifacts exist

## Remaining Host-Only Follow-Up

- [ ] Run one host-environment browser smoke of the standalone default path and the Sprint 9 binding workflow

This item remains outside governed closeout because localhost binding is denied
in this sandbox. `npm --prefix frontend run dev -- --host 127.0.0.1` still
fails here with `listen EPERM`.

## Baseline After Closeout

Sprint 8 remains the closed AI-assisted authoring baseline underneath Sprint
9, and Sprint 9 now extends that baseline with:

- `createDashboardDataAdapter.ts` as the single adapter factory for `mock`,
  `live`, and `hybrid`
- `RestDataAdapter.ts` for the bounded first live REST path
- `HybridDataAdapter.ts` for mixed mock/live dashboards on one adapter
- `BindingPanel.tsx` and `BuilderShell.tsx` updates for dataset-oriented
  binding authoring in the existing builder chrome
- widened live/hybrid import/export plus safe header stripping in serialized
  artifacts

Fresh Sprint 9 closeout verification on 2026-04-01 stayed green in the
sandbox:

- `python3 -m pytest -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`

The only unchanged manual gap is local browser startup. `npm --prefix frontend
run dev -- --host 127.0.0.1` still fails here with `listen EPERM` because this
sandbox denies localhost port binding.

A bounded post-closeout product-surface correction is now also landed on top of
that baseline:

- `frontend/src/App.tsx` now defaults to a standalone ED throughput dashboard
  instead of the builder shell
- `frontend/src/features/runtime/StandaloneDashboardApp.tsx` renders the
  registered ED throughput starter through the existing `DashboardSpec` +
  `DataAdapter` path
- `BuilderShell.tsx` remains available only as explicit secondary mode for
  operators, using the same ED starter draft when opened from the app surface
- Focused standalone coverage now exists in `frontend/src/App.test.tsx` and
  `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx`
- mock-data creation now lives in sibling project `/Users/lee/projects/dataForge`,
  while dashForge keeps compatibility wrappers at `src/dashForge/main.py` and
  `src/dashForge/generate.py` for historical generator workflows

## Current Follow-up

- [ ] Run one local browser smoke in a host environment that permits
      `127.0.0.1:5173` or preview binding
- [x] Write the formal standalone MVP review/handoff and align repo canon
      around scenario definition, generated data, and a standalone dashboard
      deliverable
- [x] Implement the standalone MVP runtime so the default app surface opens
      directly into the ED throughput command view while keeping builder mode
      opt-in
- [x] Execute and close a full healthcare package governance run
      (`ed_throughput_crunch_demo_workflow.yaml`)
- [ ] Decide the next bounded roadmap slice beyond the now-closed governed
      Sprint 1-9 ladder
- [x] Define a bounded scenario-building slice that turns the ED throughput
      workflow pattern into a reusable DashForge scenario-building agent
      surface
- [ ] Specify the first scenario-building skill set under `skills/` so future
      scenario work can consistently produce the scenario brief, data design,
      dashboard blueprint, operator script, and SQLite-plus-JSON mock package

The current scenario-building docs and workflow set now includes:

- `scenarios/healthcare/ed-throughput-crunch-contract.md`
- `plans/ed-throughput-crunch-demo-plan.md`
- `docs/mvp-standalone-dashboard-contract.md`
- `plans/mvp-standalone-dashboard-plan.md`
- `code-reviews/review-mvp-standalone-dashboard.md`
- `scenarios/healthcare/ed-throughput-crunch-data-design.md`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
- `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`
- `playbooks/ed_throughput_crunch_demo_workflow.yaml`
- `code-reviews/review-ed-throughput-crunch-demo-workflow.md`

## Next Slice Candidate

The strongest near-term roadmap candidate is a reusable scenario-building
system on top of the successful ED throughput pattern.

That slice should package today's ad hoc scenario workflow knowledge into a
repeatable DashForge capability:

- a named scenario-building agent/workflow that can take an industry prompt or
  scenario brief and drive the governed contract, design, materialization, and
  review path
- a dedicated scenario skill set under `skills/` for scenario authoring,
  dataset shaping, dashboard story framing, and client-demo packaging
- output contracts that consistently produce:
  - scenario brief
  - client presentation script
  - data design
  - dashboard blueprint
  - build checklist
  - canonical SQLite mock-data artifact
  - companion nested JSON preview artifact
  - first-pass `DashboardSpec`

## Sprint Carry-Forward Decisions

1. Sprint 8's AI-assisted authoring slice remains the stable pre-binding
   baseline and should not be reopened casually.
2. Sprint 9's shared runtime path remains `DashboardRenderer`; production
   binding now extends the same `DashboardSpec` and `DataAdapter` seams rather
   than creating a second renderer or spec format.
3. Browser-local smoke remains a host-environment validation task because
   sandbox port binding is still denied.
4. Any work after Sprint 9 should start as a new bounded roadmap slice rather
   than widening the closed production-binding sprint in place.

## Risks Carrying Forward

| Risk | Response |
|------|----------|
| Browser-local binding workflow smoke is still blocked in this sandbox | Run dev/preview on a host environment before calling the live-binding workflow fully smoke-tested |
| Frontend-first live binding can be misused if treated like durable secret storage | Keep API configuration explicit, optional, and out of DashboardSpec/exported artifacts; prefer host-local env vars or local overrides only for bounded dev use |
| Frontend runtime still uses SQLite-derived snapshots instead of direct browser SQLite | Revisit only when a later slice truly needs in-browser SQL behavior |
| Broader live-source work could sprawl beyond the bounded REST path | Start any warehouse adapter or backend brokering work under a new explicit contract |

## Definition Of Success For This Window

This sprint window is successful because the repo now has both a closed Sprint
9 baseline and a closed standalone MVP proof: the builder can still author
live/hybrid dataset bindings on the shared runtime, but the canon now makes it
explicit that the current MVP is one scenario definition, generated data
generation, and a standalone dashboard deliverable backed by the same
`DashboardSpec` and `DataAdapter` seams. The automated checks are green, the
governed verify/repair/review trail is complete, and the only remaining gap is
the host-only browser smoke.

# dashForge Session Context

> **Purpose**: Working memory for session continuity. If power drops, a new AI takes over, or we return after a break, read this first.

---

## Snapshot

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 4 — Advanced / Future |
| **Mode** | 2 (Implementation with approval) |
| **Last Updated** | 2026-04-03 |

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

---

## What's Happening Now

### Current Work Stream

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

- ✅ Broke mock-data creation out into `/Users/lee/projects/dataForge`, moving
  the real generator CLI, pack assets, and generator tests there while keeping
  dashForge compatibility wrappers for the old Python entrypoints
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

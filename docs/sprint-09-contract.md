# Sprint 9 Contract - Production Data Binding + Adapter Hardening + First Live REST Path

## Objective

Sprint 9 turns the already-modeled `DashboardSpec` live-binding surface into a
real runtime path without widening DashForge into a backend platform. The
output of this sprint is a bounded production-binding slice that:

- hardens the shared `DataAdapter` runtime so `mock`, `live`, and `hybrid`
  `DashboardSpec` modes can actually execute,
- adds a builder-integrated binding workflow for dataset-backed dashboards,
- delivers one governed live-data path through a REST-backed adapter, and
- preserves the same `DashboardRenderer` / `WidgetRenderer` /
  presenter/export flow proven through Sprints 2-8.

This sprint is intentionally bounded to production binding inside the existing
frontend-first product. It does not deliver backend credential brokering,
warehouse-native adapters, production React project export, or a broad
`DashboardSpec` redesign.

## Canon Sources

Sprint 9 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- Sprint 8 closeout artifacts under `docs/`, `plans/`, and `code-reviews/`

If those documents and this contract diverge, the canon docs win and this
contract must be corrected.

## Starting Baseline

Sprint 8 closed the AI-assisted authoring baseline:

- the app still boots into `frontend/src/features/builder/BuilderShell.tsx`,
- one validated `DashboardSpec` draft still drives build, preview, presenter,
  JSON export, and proposal-artifact export,
- AI candidate staging/apply/discard already sits on that same shared draft
  path, and
- the existing widget runtime already depends on `DataAdapter`, not on
  mock-data internals.

Sprint 9 begins from a concrete implementation gap that already exists in the
repo:

- `frontend/src/core/spec/dashboardSpec.ts` already models
  `dataContext.mode = "mock" | "live" | "hybrid"` plus per-dataset
  `live.bindings`,
- `frontend/src/core/spec/dashboardSchema.ts` already validates basic live and
  hybrid shape requirements,
- `frontend/src/core/data/StaticDataAdapter.ts`,
  `frontend/src/core/data/SQLiteDataAdapter.ts`, and the shared data-operation
  helpers already prove the narrow adapter contract,
- but `frontend/src/features/builder/BuilderShell.tsx` still hardcodes
  `StaticDataAdapter.fromDashboardSpec(...)`,
- there is no central adapter factory for live or hybrid specs,
- there is no REST adapter implementation,
- there is no builder UI for authoring dataset bindings or switching data
  modes, and
- `frontend/src/features/builder/specIo.ts` still rejects non-mock imports.

Sprint 9 builds forward from that baseline. It should make the existing
spec/runtime seam real for one bounded live path instead of reopening the
closed Sprint 2-8 renderer, builder, presenter, export, or AI-generation
contracts unless a concrete defect is uncovered.

## Scope

### In Scope

#### 1. Runtime Adapter Resolution And Adapter Hardening

- Add one central runtime seam, such as
  `frontend/src/core/data/createDashboardDataAdapter.ts`, that resolves a
  `DataAdapter` from the current `DashboardSpec`.
- Support the three already-modeled data modes:
  - `mock`: use the current mock-backed path,
  - `live`: require live bindings for every dataset-backed widget dataset, and
  - `hybrid`: compose live bindings where configured and fall back to mock data
    for the remaining datasets with clear status.
- Keep `DashboardRenderer`, `WidgetRenderer`, `PresenterMode`, and builder
  preview paths consuming the same resolved adapter instead of adding a second
  live-only renderer.
- Harden adapter failure handling so binding/configuration problems surface as
  typed runtime errors or validation warnings instead of silent empty widgets.

#### 2. First Governed Live-Data Path Through A REST Adapter

- Add a bounded read-only REST adapter under `frontend/src/core/data/`, such as
  `RestDataAdapter.ts`.
- Sprint 9's first live path is one dataset binding to one JSON endpoint:
  - fetch rows from a configured REST endpoint,
  - normalize the response into tabular row objects,
  - map source fields into the dashboard's expected dataset fields through
    `fieldMap`, and
  - reuse the shared query/aggregate helpers so widgets keep the same runtime
    semantics they already use against mock data.
- `getSchema(...)` and `listDatasets()` must work for the first live path so
  later builder/runtime checks stay adapter-agnostic.
- Live binding remains read-only in Sprint 9. Mutations, write-back, and
  bidirectional sync are out of scope.

#### 3. Builder-Integrated Binding Authoring Workflow

- Add a binding workflow inside the current builder shell instead of a separate
  admin tool.
- The UI must make the current dashboard's dataset dependencies visible:
  - referenced dataset ids,
  - which bindings are complete or missing,
  - whether the dashboard is in `mock`, `live`, or `hybrid` mode, and
  - whether the current binding configuration is renderable.
- Support bounded authoring of per-dataset live bindings for Sprint 9's first
  path:
  - choose data mode,
  - select the supported binding type for the sprint,
  - enter endpoint configuration,
  - define field mappings from dashboard fields to remote fields, and
  - persist non-secret binding metadata into the spec.
- Keep the shared Sprint 8 workflow intact. Binding work must not break manual
  editing, template selection, staged AI candidates, presenter mode, or export.

#### 4. Import/Export Widening For Live And Hybrid Specs

- Widen JSON import/export so the builder can load and save valid live or
  hybrid `DashboardSpec` documents instead of rejecting everything outside the
  Sprint 6 mock-only boundary.
- Persist only non-secret binding metadata in `DashboardSpec` and exported
  artifacts.
- If temporary credential overrides are needed for local testing, they must
  stay outside the persisted spec and outside proposal-artifact output.

#### 5. Automated Coverage

- Add targeted automated coverage for:
  - adapter resolution across `mock`, `live`, and `hybrid`,
  - REST response normalization and field mapping,
  - non-destructive handling of broken or incomplete live bindings,
  - builder binding authoring state,
  - import/export of live and hybrid specs, and
  - preserving the shared preview/presenter/runtime path after bindings are
    applied.

### Explicitly Out Of Scope

- Snowflake, Databricks, or GraphQL runtime adapters
- Backend credential brokering, vault integration, or server-side proxy work
- Production React project export or code generation
- AI-authored field mapping or autonomous data-binding suggestions
- Live-schema discovery beyond what is required for the bounded REST path
- Background polling, streaming, or long-running refresh orchestration beyond a
  bounded manual/explicit refresh path
- Direct browser SQLite replacement beyond the existing snapshot/boundary work
- New industry packs, new chart primitives, or a broad `DashboardSpec` redesign
- Broad repo cleanup unrelated to production binding
- New runtime dependencies without explicit human approval

## Constraints

- Build on Sprint 8's closed builder/AI/presenter/export baseline instead of
  redesigning it.
- The same `DashboardSpec` remains the canonical artifact for build, preview,
  presenter, export, AI output, and production binding.
- Widgets and runtime components must continue to depend only on `DataAdapter`.
  No widget may import fetch, REST helpers, or mock/live source code directly.
- Live mode is strict: a dataset-backed widget in `live` mode without a valid
  binding is an error, not a silent fallback.
- Hybrid mode is explicit: only datasets with configured live bindings may use
  the live path; everything else stays on the existing mock path with clear UI
  status.
- Binding authoring must stay dataset-oriented. Sprint 9 should not turn into a
  widget-by-widget visual rewrite workflow.
- Persisted specs and exported artifacts must not contain durable secrets.
- Keep tests fully mocked at the network boundary; no real external endpoint is
  required to verify Sprint 9.
- Respect the current dependency guardrail. If a production-binding idea needs
  backend services or new packages, split it into a later slice rather than
  widening Sprint 9 silently.

## Required Outputs

- `docs/sprint-09-contract.md`
- `plans/sprint-09-plan.md`
- one central adapter-resolution seam under `frontend/src/core/data/`
- one REST adapter implementation under `frontend/src/core/data/`
- one hybrid/composed adapter path under `frontend/src/core/data/`
- builder-integrated binding workflow updates primarily under:
  - `frontend/src/features/builder/`
  - or a focused new `frontend/src/features/binding/` area
- supporting validation/persistence/test updates primarily under:
  - `frontend/src/core/spec/`
  - `frontend/src/core/io/`
  - `frontend/src/core/data/`
  - `frontend/src/features/builder/`
  - `frontend/src/features/presenter/`
  - `frontend/src/**/*.test.ts*`

## Ordered Work

1. Lock the Sprint 9 contract and plan against Sprint 8 closeout, canon docs,
   and the current adapter/spec seams.
2. Add the central adapter-resolution path for `mock`, `live`, and `hybrid`
   specs before the builder UI depends on it.
3. Deliver the bounded REST adapter and field-mapping runtime for one governed
   live-data path.
4. Add builder-integrated binding authoring and mode switching.
5. Widen JSON import/export and other persistence seams for live/hybrid specs
   without persisting secrets.
6. Integrate the resolved adapter back into the same preview/presenter/export
   runtime path instead of forking a second renderer.
7. Add targeted tests for adapter resolution, REST normalization, binding UI,
   and non-destructive failure handling.
8. Verify, repair, and hand off the sprint before calling production binding
   complete.

## Acceptance Criteria

1. Sprint 9 remains bounded to production data binding, adapter hardening, and
   the first governed live REST path on top of the closed Sprint 8 baseline.
2. The builder can author or edit live-binding metadata for the datasets used
   by the current dashboard without leaving the current shell.
3. One central runtime seam resolves the correct adapter behavior for `mock`,
   `live`, and `hybrid` `DashboardSpec` documents.
4. A REST-backed dataset can drive the existing widgets through the same
   `DataAdapter` contract the mock path already uses.
5. Live-mode dashboards fail clearly when required bindings are missing instead
   of silently rendering from the wrong source.
6. Hybrid dashboards can mix existing mock datasets with explicitly configured
   live datasets on the same shared runtime path.
7. JSON import/export accepts valid live and hybrid specs, and exported
   artifacts omit durable secrets.
8. Manual builder workflows and the closed Sprint 8 AI candidate flow still
   work when no live bindings are configured.
9. `npm --prefix frontend test` passes after the Sprint 9 slice lands.
10. `npm --prefix frontend run build` passes after the Sprint 9 slice lands.

## Verification Expectations

- Re-read this contract and `plans/sprint-09-plan.md` before implementation.
- Prefer targeted frontend checks for:
  - adapter resolution,
  - REST normalization and field mapping,
  - hybrid fallback behavior,
  - builder binding state and import/export behavior, and
  - keeping preview/presenter rendering intact with live-bound data.
- Re-run the shared repo checks used in Sprint 8 closeout:
  - `python3 -m pytest -q`
  - `npm --prefix frontend test`
  - `npm --prefix frontend run build`
- If a host environment is available, prefer one manual browser smoke of the
  new binding workflow on top of the closed Sprint 8 builder/presenter/export
  path.

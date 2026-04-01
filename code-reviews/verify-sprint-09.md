# Verification — Sprint 9

## Architecture Summary

Sprint 9 extends the closed Sprint 8 builder/presenter/export baseline with one
shared production-binding runtime instead of a second live-only renderer.
`frontend/src/features/builder/BuilderShell.tsx` still owns the active
`DashboardSpec` draft, but it now resolves that draft through
`frontend/src/core/data/createDashboardDataAdapter.ts` before build, preview,
and presenter mode render. That adapter factory chooses among:

- `StaticDataAdapter` for `mock`
- `RestDataAdapter` for strict `live`
- `HybridDataAdapter` for mixed `hybrid` dashboards

The main Sprint 9 trust boundaries are:

- imported or edited live-binding metadata in `DashboardSpec`
- REST response normalization and field mapping in
  `frontend/src/core/data/RestDataAdapter.ts`
- builder-side binding readiness/status messaging in
  `frontend/src/features/builder/BindingPanel.tsx`
- preserving the same `DashboardRenderer` and `PresenterMode` path after live
  bindings are applied

The main verification risks for this slice are adapter-resolution correctness,
non-destructive handling of incomplete live bindings, field-mapping behavior
for REST-backed datasets, persistence safety for exported specs, and keeping
the shared Sprint 8 runtime intact after live/hybrid binding is introduced.

## Scope

Verified the Sprint 9 production-binding slice against:

- `docs/sprint-09-contract.md`
- `plans/sprint-09-plan.md`
- the Sprint 9 implementation under `frontend/src/core/data/`
- Sprint 9 builder/persistence/runtime integration under:
  - `frontend/src/features/builder/`
  - `frontend/src/core/io/`
  - `frontend/src/components/`
  - `frontend/src/features/presenter/`
  - `frontend/src/core/spec/`

Implementation inspection for this pass focused on:

- `frontend/src/core/data/createDashboardDataAdapter.ts`
- `frontend/src/core/data/RestDataAdapter.ts`
- `frontend/src/core/data/HybridDataAdapter.ts`
- `frontend/src/core/data/widgetDataResolvers.ts`
- `frontend/src/features/builder/BindingPanel.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/specIo.ts`
- `frontend/src/core/io/dashboardPersistence.ts`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/WidgetRenderer.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`

Verification was run using scratch output directory:
`/Users/lee/projects/dashForge/.agent-orch-scratch/dbf00b6e464e/s09_verify/attempt-1`

## Checks Run

| Command | Result | Notes |
|---------|--------|-------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass | Root Python/generator suite remained green: `9 passed in 2.63s`. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test -- src/core/data/createDashboardDataAdapter.test.ts src/core/data/RestDataAdapter.test.ts src/features/builder/BuilderShell.test.tsx src/features/builder/specIo.test.ts src/core/io/dashboardPersistence.test.ts src/components/DashboardRenderer.test.tsx src/core/spec/dashboardSchema.test.ts` | ✅ Pass | Focused Sprint 9 runtime/builder/persistence coverage passed: `7` files, `22` tests. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ✅ Pass | Full frontend suite passed cleanly: `28` files, `69` tests. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ✅ Pass | Immediate rerun also passed cleanly, so the prior Sprint 8 presenter teardown flake did not reproduce in this pass. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run build` | ✅ Pass | TypeScript checks and Vite production build completed successfully. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run dev -- --host 127.0.0.1` | ✅ Expected environment failure | Vite startup still fails in this sandbox with `listen EPERM: operation not permitted 127.0.0.1:5173`; this remains a host-environment browser-smoke gap, not a newly observed Sprint 9 crash. |

## What Passed

- Sprint 9's main implementation seams match the contract on inspection:
  - `createDashboardDataAdapter.ts` resolves one runtime path for `mock`,
    `live`, and `hybrid` dashboards instead of introducing renderer-specific
    branching.
  - `RestDataAdapter.ts` delivers the bounded first live path: fetch JSON,
    resolve an optional response path, coerce row objects, map fields, then
    reuse shared query/aggregate helpers.
  - `HybridDataAdapter.ts` composes live-bound and mock-backed datasets behind
    one `DataAdapter` interface.
  - `BindingPanel.tsx` exposes dataset-oriented mode switching and per-dataset
    REST binding metadata inside the existing builder property rail.
  - `BuilderShell.tsx` feeds preview and presenter mode from the same resolved
    adapter path and blocks rendering when required live bindings are missing.
  - `specIo.ts` and `dashboardPersistence.ts` now accept live/hybrid specs and
    strip `connection.headers` from serialized product artifacts.
- The repo baseline stayed healthy during this pass:
  - `python3 -m pytest -q`
- The Sprint 9 frontend verification surface is present and passed:
  - adapter resolution across `mock`, `live`, and `hybrid`
  - REST payload normalization and field mapping
  - builder binding controls in live mode
  - live/hybrid import-export behavior
  - shared renderer compatibility through a hybrid live-binding path
- The top-level frontend suite was stable in this pass:
  - both consecutive `npm --prefix frontend test` runs exited cleanly
- The Sprint 9 production build stayed healthy during this pass:
  - `npm --prefix frontend run build`

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| V901 | Medium | Binding Validation | `frontend/src/core/data/createDashboardDataAdapter.ts:42-117`, `frontend/src/core/spec/dashboardSpec.ts:597-629`, `frontend/src/core/data/RestDataAdapter.ts:110-121`, `frontend/src/core/data/widgetDataResolvers.ts:267-299` | The builder/runtime already knows which dashboard fields each dataset-backed widget needs, but live-binding readiness only validates binding presence, type, and URL. A live or hybrid dataset can therefore be marked `ready` even when its `fieldMap` does not provide the widget-required fields. In that state, the binding panel reports readiness, `createDashboardDataAdapter(...)` resolves successfully, and failures are deferred to per-widget runtime behavior. For tables this can degrade into incomplete/blank cells instead of a dataset-level binding error, which is weaker than the Sprint 9 contract's goal of surfacing binding/configuration problems before or at adapter-resolution time. | Extend live-binding validation to compare each dataset's required dashboard fields against the binding's mapped or native fields before marking it `ready`. At minimum, fail readiness when required fields are absent from the mapping for datasets whose live payload uses different field names. Add one focused test that proves an incomplete `fieldMap` is surfaced as a binding-status error rather than a later widget render issue. |

## What Failed or Remains

- No automated command in the governed Sprint 9 verification set failed in
  this pass.
- One host-environment browser smoke is still required because the real app
  entry-point command cannot bind localhost in this sandbox:
  - `npm --prefix frontend run dev -- --host 127.0.0.1`
  - sandbox failure: `listen EPERM: operation not permitted 127.0.0.1:5173`
- The automated suite does not currently prove that incomplete live `fieldMap`
  configuration is rejected at binding-validation time rather than discovered
  later during widget rendering.

## Test Additions Recommended

- Add a focused adapter-resolution test that fails a live or hybrid dataset
  when required widget fields are not satisfied by the binding metadata.
- Add a focused builder test proving the binding panel shows a dataset-level
  error for incomplete field mappings instead of `ready`.
- When the sandbox limitation is not present, run one host-environment browser
  smoke covering:
  - switch to `live` or `hybrid`
  - configure a REST binding
  - preview the dashboard
  - open presenter mode
  - export a spec and confirm header stripping still holds

## Outcome

Sprint 9 verification is mostly green. The shared repo checks passed, the
focused Sprint 9 coverage passed, the full frontend suite passed twice, and the
frontend production build passed. The only command-level failure remains the
known sandbox localhost-binding limit on `vite`.

However, this pass still found one contract-relevant gap: live-binding
readiness validation is not yet strong enough to catch incomplete field
mapping before widgets render. Sprint 9 is therefore in a good automated state,
but it should still take a repair pass for the binding-validation gap and one
host-environment browser smoke before formal review/handoff closes the sprint.

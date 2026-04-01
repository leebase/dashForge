# Sprint 9 Plan - Production Data Binding + Adapter Hardening + First Live REST Path

## Goal

Execute Sprint 9 as a bounded production-binding slice layered on top of the
closed Sprint 8 AI-assisted authoring baseline. The output of this sprint
should let a consultant or delivery engineer take a dashboard that already
renders from mock data, define dataset-level live bindings inside the builder,
and run the same widgets through a REST-backed `DataAdapter` path without
widening the product into warehouse integration, backend credential brokering,
or production code export.

## Planning Assumptions

- Sprint 8 closeout artifacts are authoritative for the current builder,
  presenter, export, and AI-assisted authoring baseline.
- `BuilderShell` remains the app entry point for this slice; Sprint 9 should
  add binding controls inside that shell or directly adjacent to it instead of
  replacing the current app structure.
- The `DashboardSpec` surface already includes the minimum production-binding
  shape this sprint needs: `dataContext.mode`, `dataContext.live.bindings`, and
  `DataBinding`.
- The current runtime gap is implementation, not schema invention:
  - there is no central adapter factory,
  - there is no REST adapter,
  - `BuilderShell` still always resolves `StaticDataAdapter`, and
  - `specIo.ts` still rejects non-mock specs.
- The shared `queryRows(...)` and `aggregateRows(...)` helpers are strong
  leverage points. A bounded REST adapter can normalize remote rows once, then
  reuse the same query/aggregate semantics the mock path already exercises.
- Sprint 9 should prove one governed live-data path first. The architecture's
  broader Snowflake/Databricks phase remains valid, but this sprint should not
  try to ship every adapter type at once.
- Persisted product artifacts should stay safe by default. If any local-only
  credential override is required during implementation, it must remain outside
  serialized `DashboardSpec` output.

## Implementation Guardrails

- Resolve adapters through one shared seam. Do not let `BuilderShell`,
  `DashboardRenderer`, or presenter code branch ad hoc by data mode.
- Keep `DataAdapter` as the only runtime contract that widgets see. New live
  behavior belongs behind adapters and adapter-factory helpers, not in widget
  components.
- Treat `live` mode as strict and `hybrid` mode as explicit. Do not silently
  fall back to mock data in `live` mode when a live binding is broken.
- Prefer one binding record per dataset id referenced by the dashboard. Avoid a
  widget-specific binding system that would fragment the shared runtime.
- For the first live path, normalize remote JSON into rows and then reuse the
  existing query/aggregate helpers instead of inventing a second filtering or
  aggregation engine.
- Keep network behavior fully mockable in tests. The verification suite should
  not depend on any real external endpoint.
- Keep background refresh bounded. Manual refresh or simple explicit reload
  behavior is acceptable; full polling/streaming orchestration is not required
  for Sprint 9.
- Do not widen the sprint into backend proxy work, durable secret storage,
  production code export, or warehouse-native adapters without explicit
  approval.

## Scope Summary

### Deliver In Sprint 9

- central adapter resolution for `mock`, `live`, and `hybrid`
- REST-backed read-only live adapter for the first governed production path
- hybrid composition so some datasets can stay mock while bound datasets run
  live
- builder-integrated binding workflow and mode switching
- widened JSON import/export for live and hybrid specs
- targeted tests for adapter resolution, REST mapping, hybrid behavior, binding
  UI, and shared runtime compatibility

### Do Not Deliver In Sprint 9

- Snowflake, Databricks, or GraphQL runtime adapters
- backend credential brokering, vault integration, or secret-management UI
- production React project export
- AI-suggested mappings or autonomous binding generation
- long-running polling or streaming refresh
- write-back, mutation, or bi-directional sync flows
- direct browser SQLite replacement
- broad repo cleanup unrelated to production binding

## Ordered Work

### 1. Normalize Binding Runtime State And Adapter Resolution

Objective:
Create one typed runtime seam that can inspect a `DashboardSpec`, resolve the
correct adapter path, and report clear binding/runtime status before UI wiring
expands.

Primary file targets:

- `frontend/src/core/data/createDashboardDataAdapter.ts`
- `frontend/src/core/data/DataAdapter.ts`
- `frontend/src/core/spec/dashboardSpec.ts`
- `frontend/src/core/spec/dashboardSchema.ts`

Done when:

- one helper can resolve a `DataAdapter` for `mock`, `live`, and `hybrid`
  dashboards
- the runtime can distinguish configuration errors from fetch/render errors
- missing or invalid live bindings are surfaced in a way the builder UI can
  explain to the user

### 2. Implement The REST Adapter And Row Normalization Path

Objective:
Deliver the first governed live-data path using a REST JSON endpoint while
preserving the adapter-isolated runtime.

Primary file targets:

- `frontend/src/core/data/RestDataAdapter.ts`
- focused REST helper modules under `frontend/src/core/data/`
- `frontend/src/core/data/dataOperations.ts`

Done when:

- a dataset binding can fetch remote JSON rows from a configured endpoint
- remote field names can be mapped into dashboard dataset fields via `fieldMap`
- query, sort, filter, and aggregate behavior reuse the shared data-operation
  helpers after normalization
- `getSchema(...)` and `listDatasets()` work for the bounded REST path
- failure modes are typed and actionable

### 3. Add Hybrid Composition And Adapter Hardening

Objective:
Support mixed mock/live dashboards without creating a second rendering path.

Primary file targets:

- `frontend/src/core/data/HybridDataAdapter.ts`
- `frontend/src/core/data/createDashboardDataAdapter.ts`
- focused tests under `frontend/src/core/data/`

Done when:

- a dashboard in `hybrid` mode can resolve live-backed datasets where bindings
  exist and mock-backed datasets elsewhere
- live-mode dashboards stay strict about missing bindings
- presenter, preview, and export code can continue to consume one adapter
  object without knowing which datasets are mock or live

### 4. Add Builder Binding Authoring

Objective:
Make production binding editable from the current builder shell instead of from
  a separate utility.

Primary file targets:

- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- focused new binding UI under `frontend/src/features/builder/` or
  `frontend/src/features/binding/`

Done when:

- the builder exposes `mock`, `live`, and `hybrid` mode selection
- the user can see which dataset ids the dashboard currently references
- the user can configure a REST binding and field map for a dataset
- binding completeness/errors are visible before the dashboard is rendered as
  live
- the Sprint 8 manual and AI-assisted flows remain intact

### 5. Widen Persistence And Safe Export Behavior

Objective:
Let the builder carry live and hybrid specs end to end without persisting
unsafe connection data.

Primary file targets:

- `frontend/src/features/builder/specIo.ts`
- `frontend/src/core/io/dashboardPersistence.ts`
- focused support changes in `frontend/src/features/export/`

Done when:

- valid live and hybrid specs can be imported and exported
- binding metadata needed to recreate the live path survives round-trip
- durable secrets do not appear in exported spec JSON or proposal artifacts

### 6. Reconnect The Shared Runtime

Objective:
Run live-bound dashboards through the same renderer, presenter, and export path
already proven by Sprints 6-8.

Primary file targets:

- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/WidgetRenderer.tsx`

Done when:

- a live or hybrid dashboard can preview through the existing runtime
- presenter mode still works on the same bound adapter path
- proposal-artifact export still operates on the same dashboard stage
- no second renderer or live-only widget path was introduced

### 7. Add Verification Coverage

Objective:
Leave Sprint 9 with durable proof that production binding is real, bounded, and
does not regress the closed Sprint 8 workflow.

Primary file targets:

- tests under `frontend/src/core/data/`
- tests under `frontend/src/features/builder/`
- focused tests under `frontend/src/core/spec/` and `frontend/src/core/io/`

Done when:

- adapter resolution across `mock`, `live`, and `hybrid` is covered
- REST normalization and field mapping are covered
- broken live bindings fail non-destructively
- hybrid fallback behavior is covered
- live/hybrid import-export round-trips are covered
- the shared preview/presenter path remains covered with a bound adapter
- `npm --prefix frontend test` and `npm --prefix frontend run build` stay green

### 8. Verify And Close The Slice

Objective:
Hand off a real bounded production-binding baseline instead of another
placeholder phase description.

Done when:

- the Sprint 9 production-binding artifacts are present
- frontend tests pass
- frontend build passes
- any remaining scope cuts or credential limits are explicitly documented

## Verification Matrix

| Area | Proof |
|------|-------|
| Adapter resolution | `mock`, `live`, and `hybrid` specs resolve the expected adapter behavior and status |
| REST adapter | Remote JSON is normalized, mapped, and queried through the shared data-operation helpers |
| Field mapping | Widgets can keep using dashboard field names while live payloads expose different source names |
| Hybrid mode | Live-bound and mock-backed datasets can coexist on one dashboard without forking the renderer |
| Binding UI | Dataset dependency visibility, mode switching, and binding-edit flows work in the builder |
| Persistence safety | Live/hybrid specs round-trip without losing non-secret metadata and without leaking secrets |
| Shared runtime compatibility | Preview, presenter, and export still work on the same adapter-backed dashboard path |
| Frontend health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Risks And Controls

| Risk | Control |
|------|---------|
| Remote payloads are shaped differently from the dashboard's expected dataset fields | Make `fieldMap` explicit and keep normalization errors visible instead of guessing silently |
| Live-mode dashboards quietly fall back to mock data and hide broken bindings | Make `live` mode strict and surface missing-binding errors before render |
| Hybrid behavior becomes confusing or implicit | Keep hybrid dataset status explicit in the builder and adapter-resolution result |
| Secrets leak into exported specs or artifacts | Persist only non-secret connection metadata and keep any temporary credential override outside serialized artifacts |
| Network-dependent tests become flaky | Mock fetch and adapter boundaries completely in tests |
| Scope expands toward warehouse adapters or production code export | Hold Sprint 9 to the first governed REST path plus adapter hardening only |

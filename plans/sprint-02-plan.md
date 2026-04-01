# Sprint 2 Plan — Spec/Runtime Completion

## Goal

Execute Sprint 2 as a bounded implementation slice that completes the
DashForge spec/runtime baseline inside `frontend/` and leaves later sprints
free to add deeper mock data, broader primitives, templates, builder mode,
presenter flows, and production bindings without reopening core contracts.

## Planning Assumptions

- Sprint 1 already proved a real frontend runtime, not just a scaffold.
- Sprint 2 is limited to spec/runtime completion.
- Existing widget rendering and the current static/scenario-backed adapter path
  must remain usable throughout the sprint.
- The implementation should stabilize shared seams first and only touch the app
  shell where those seams need to be exercised.
- This plan defines implementation order and proof points only; it does not
  justify pulling future-scope features into Sprint 2.

## Implementation Guardrails

- Keep Sprint 2 work centered in `frontend/src/core/` and limit shell touches
  to seam consumption.
- Preserve the current static/scenario-backed runtime path while the SQLite
  seam is being proven.
- Do not expand the primitive catalog, template catalog, builder UI, or
  presenter flows to compensate for incomplete contract work.
- Keep any SQLite-specific loading details behind `DataAdapter` and adapter
  helpers, not inside widgets or renderer components.
- Prefer one obvious entry point per concern: validation, theme resolution,
  persistence, and adapter access.

## Scope Summary

### Deliver In Sprint 2

- broaden and lock the DashboardSpec contract
- establish one shared DashboardSpec validation path
- add semantic validation on top of structural validation
- complete the concrete theme runtime
- complete version-aware save/load and local persistence seams
- complete the browser-side SQLite adapter seam
- add targeted tests and minimal runtime wiring needed to prove those seams

### Do Not Deliver In Sprint 2

- SQLite generation tooling or scenario database authoring
- new industry packs or new scenario content
- dashboard templates
- presenter mode
- export features
- builder composition UX
- `react-grid-layout`
- broad primitive delivery beyond contract-safe spec work
- live production bindings

## Ordered Work

### 1. Lock The Spec Surface

Objective:
Make the DashboardSpec contract explicit enough for future sprints without
implying runtime support that does not exist yet.

Primary file targets:

- `frontend/src/core/spec/dashboardSpec.ts`
- `frontend/src/sample/sampleDashboard.ts`

Done when:

- the top-level spec shape reflects the Sprint 2 contract
- types cover metadata, intent, theme, data context, layout, persistence
  versioning, and future-safe scaffolding
- currently unsupported primitive breadth is not implied by the contract

### 2. Establish One Shared Validation Entry Point

Objective:
Create one validation module that all runtime and persistence flows use.

Primary file targets:

- `frontend/src/core/spec/dashboardSchema.ts`
- `frontend/src/core/spec/dashboardSchema.test.ts`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/core/io/dashboardPersistence.ts`

Done when:

- structural validation remains schema-driven
- semantic validation is layered on top of the schema path
- render and persistence entry points both use the same validation contract

### 3. Complete Structural And Semantic Validation

Objective:
Reject invalid specs early with reusable, explicit validation results.

Required semantic coverage:

- unsupported `specVersion`
- unknown `theme.id`
- duplicate widget ids
- impossible dashboard or widget layout values
- inconsistent `dataContext` combinations across `mock`, `live`, and `hybrid`

Primary file targets:

- `frontend/src/core/spec/dashboardSchema.ts`
- `frontend/src/core/spec/dashboardSchema.test.ts`

Done when:

- a broadened valid sample spec passes
- each targeted invalid fixture fails for the intended reason
- validation results are reusable by later import and builder flows

### 4. Complete The Theme Runtime

Objective:
Make the theme system concrete, centralized, and shared between component
styling and chart output.

Primary file targets:

- `frontend/src/core/theme/themeRegistry.ts`
- `frontend/src/core/theme/themeRegistry.test.ts`
- minimal shell/runtime consumers as needed

Done when:

- `light-professional` and `dark-executive` both resolve cleanly
- spec-level overrides merge predictably
- CSS variables and chart-facing output come from the same resolver path

### 5. Complete Save/Load And Local Persistence Seams

Objective:
Make DashboardSpec JSON round-trippable, validated on load, and reusable by
later UI flows without coupling persistence to React behavior.

Primary file targets:

- `frontend/src/core/io/dashboardPersistence.ts`
- `frontend/src/core/io/dashboardPersistence.test.ts`

Done when:

- serialized specs remain readable JSON
- load paths validate before reuse
- storage helpers remain a temporary seam rather than a UI feature
- version-aware persistence leaves room for future migrations

### 6. Complete The Browser-Side SQLite Seam

Objective:
Prove the narrowest browser-side SQLite path through `DataAdapter` without
forcing a full runtime cutover.

Primary file targets:

- `frontend/src/core/data/DataAdapter.ts`
- `frontend/src/core/data/dataContract.ts`
- `frontend/src/core/data/StaticDataAdapter.ts`
- `frontend/src/core/data/SQLiteDataAdapter.ts`
- `frontend/src/core/data/SQLiteDataAdapter.test.ts`

Done when:

- a trivial fixture can be loaded or attached through the adapter seam
- at least one narrow query or aggregate path succeeds
- the current static/scenario-backed path still works
- no component imports SQLite details directly

### 7. Keep Runtime Wiring Minimal

Objective:
Exercise the new seams without pulling Sprint 2 into builder work or broader
UI redesign.

Possible touchpoints if needed:

- `frontend/src/App.tsx`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/WidgetRenderer.tsx`

Done when:

- app-shell changes are limited to validation, theme, persistence, or adapter
  seam consumption
- no builder chrome, composition controls, or unrelated UX work is pulled
  forward

### 8. Verify And Close The Sprint Slice

Objective:
Leave a clean handoff into Sprint 3 without unresolved ambiguity about the
runtime contracts.

Done when:

- targeted contract tests exist
- the required repository checks pass
- any remaining gap is documented as future scope rather than absorbed into
  Sprint 2

## Verification Matrix

| Area | Proof |
|------|-------|
| Spec contract | A broadened valid sample spec passes through the shared validator |
| Semantic validation | At least one invalid fixture fails for each targeted rule category |
| Theme runtime | Both theme ids resolve to CSS variables and chart-facing output |
| Save/load | A spec serializes, stores, reloads, and validates before reuse |
| SQLite seam | A trivial fixture answers the narrow adapter contract without breaking the static path |
| Repository health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Verification Sequence

1. Exercise targeted validation coverage so valid broadened specs pass and each
   targeted invalid case fails for the intended reason.
2. Exercise targeted theme and persistence coverage so theme resolution and
   save/load round-trips both use the shared runtime seams.
3. Exercise targeted SQLite seam coverage so the narrow adapter path works
   without breaking the static/scenario-backed path.
4. Run `npm --prefix frontend test`.
5. Run `npm --prefix frontend run build`.
6. Document any remaining gap as future scope instead of expanding Sprint 2.

## Risks And Controls

| Risk | Control |
|------|---------|
| The sprint drifts into broader feature work | Keep templates, packs, presenter, builder, export, and primitive expansion as explicit future scope |
| Validation remains fragmented across modules | Require one shared validator before deepening runtime work |
| Theme logic splits between shell and charts | Keep one resolver responsible for both outputs |
| Save/load becomes UI behavior instead of a reusable seam | Keep persistence helpers outside React-first concerns |
| SQLite work expands into dependency or generator sprawl | Prove only the narrow browser-side seam and keep the static adapter path alive |

## Exit Condition

Sprint 2 planning is complete when implementation can start from this document
and `docs/sprint-02-contract.md` without re-deciding scope, constraints, file
targets, execution order, or verification for the spec/runtime slice.

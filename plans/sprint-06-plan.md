# Sprint 6 Plan - Builder Mode + Palette + Property Editing + Template Selection + Spec I/O

## Goal

Execute Sprint 6 as a bounded frontend builder slice that layers manual
dashboard authoring on top of the closed Sprint 5 runtime. The output of this
sprint should let a consultant start from a template, compose widgets, edit
their properties, and save/load DashboardSpec JSON without dragging presenter,
export, or AI-generation scope forward.

## Planning Assumptions

- Sprint 5 closeout artifacts are authoritative for the current runtime,
  primitive, theme, and adapter baseline.
- The builder gap is entirely in `frontend/`; the Python generator and
  SQLite-derived snapshot path should be treated as closed dependencies.
- The current Sprint 4 template catalog is metadata-only, so Sprint 6 needs a
  small starter-spec instantiation layer instead of pretending template
  selection already exists.
- `DashboardRenderer` and the Sprint 5 runtime remain the preview/rendering
  foundation. Sprint 6 should stage builder behavior on top of them rather than
  fork a second rendering path.
- The current DashboardSpec stores one canonical widget `position`, not
  explicit per-breakpoint editable layouts. Sprint 6 should preserve that shape
  unless a concrete implementation defect proves it insufficient.
- `react-grid-layout` is the canon composition engine for builder mode and is
  the one planned new runtime dependency for this sprint.

## Implementation Guardrails

- Keep all preview rendering driven by `DashboardSpec` + `DataAdapter`.
- Do not let builder components import scenario data directly as a substitute
  for adapter-backed preview behavior.
- Reuse the existing schema validator for imported specs and any draft sanity
  checks.
- Keep template selection spec-first: selecting a template should produce a
  DashboardSpec draft, not a one-off UI state that the runtime cannot render.
- Keep property editing bounded to common workshop-authoring fields rather than
  attempting exhaustive schema editing.
- Keep spec I/O JSON-only for Sprint 6.
- Avoid widening the sprint into presenter mode, PNG/PDF export, AI generation,
  or live-binding work.

## Scope Summary

### Deliver In Sprint 6

- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/WidgetPalette.tsx`
- `frontend/src/features/builder/PropertyPanel.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/TemplateGallery.tsx`
- `frontend/src/features/builder/specIo.ts`
- builder draft state and supporting helpers under `frontend/src/features/builder/`
- `react-grid-layout`-backed composition for drag/drop and resize
- bounded template-starter generation tied to the Sprint 4 catalog
- app-shell integration so Sprint 6 is visibly demonstrated in the frontend
- targeted tests for the builder flows

### Do Not Deliver In Sprint 6

- presenter mode, narrative walkthroughs, or widget emphasis
- PNG/PDF export
- AI-generated specs
- live/production bindings
- direct browser SQLite execution
- template authoring or template-library CRUD
- collaboration, comments, or review workflows
- a broad DashboardSpec redesign for per-breakpoint editing
- a full raw JSON editing IDE
- broad undo/redo history or persistence beyond what is strictly needed for
  local draft handling

## Ordered Work

### 1. Establish The Builder Draft Model And Shell

Objective:
Create the bounded Sprint 6 builder entry point and the draft state model that
owns the currently edited DashboardSpec.

Primary file targets:

- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- supporting builder state/helpers under `frontend/src/features/builder/`
- `frontend/src/App.tsx`

Done when:

- the app boots into a real Sprint 6 builder shell
- one editable DashboardSpec draft exists in local runtime state
- builder actions can select a widget, replace the draft, and trigger preview
  rerenders without bypassing schema/runtime validation

### 2. Add Editable Composition

Objective:
Replace the read-only-only composition experience with a builder canvas that
supports moving and resizing widgets.

Primary file targets:

- `frontend/src/features/builder/BuilderShell.tsx`
- optional builder-canvas helpers under `frontend/src/features/builder/`
- supporting updates to `frontend/src/core/spec/dashboardSpec.ts` only if a
  concrete bug forces a bounded shape refinement

Done when:

- `react-grid-layout` drives drag/drop and resize behavior in builder mode
- layout edits write back into widget `position` values on the draft spec
- the preview/runtime path can still render the updated spec through the
  existing Sprint 5 renderer
- Sprint 6 does not require a speculative per-breakpoint layout redesign

### 3. Add The Widget Palette And Default Widget Factories

Objective:
Let a consultant add new widgets from a controlled primitive palette instead of
editing JSON by hand.

Primary file targets:

- `frontend/src/features/builder/WidgetPalette.tsx`
- supporting widget-factory helpers under `frontend/src/features/builder/`
- `frontend/src/core/spec/dashboardSpec.ts` only if helper typings are needed

Done when:

- each supported primitive can be inserted from the palette
- inserted widgets are valid starter specs with safe default size, position,
  title, and chart/data placeholders
- add/remove flows stay inside the DashboardSpec model and remain testable

### 4. Add Property Editing

Objective:
Expose the bounded dashboard and widget fields that matter for workshop
authoring through a form-driven panel.

Primary file targets:

- `frontend/src/features/builder/PropertyPanel.tsx`
- supporting builder helpers under `frontend/src/features/builder/`
- optional small support changes in `frontend/src/core/spec/`

Done when:

- the dashboard-level fields needed for workshop authoring are editable
- the selected widget’s common fields, sizing, encodings, and bounded chart
  options are editable
- invalid edits are either prevented or surfaced through the existing
  validation path instead of silently corrupting the draft

### 5. Add Template Selection And Starter Spec Instantiation

Objective:
Turn the Sprint 4 template catalog from metadata into a usable starting point
for builder sessions.

Primary file targets:

- `frontend/src/features/builder/TemplateGallery.tsx`
- supporting template-instantiation helpers under `frontend/src/features/builder/`
- `frontend/src/mock-data/templateCatalog.ts` only if small metadata helpers are
  needed

Done when:

- the builder can list and filter/select templates from the existing catalog
- selecting a template yields a valid starter DashboardSpec draft
- pack/scenario defaults flow through the same mock-data/runtime seams already
  used by the current app
- Sprint 6 still does not become a template-authoring sprint

### 6. Add Spec I/O

Objective:
Provide the JSON save/load helpers needed for manual workshop authoring.

Primary file targets:

- `frontend/src/features/builder/specIo.ts`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`

Done when:

- the current draft can be exported as JSON
- imported JSON is parsed and validated before replacing the draft
- validation failures surface clearly to the user
- the spec I/O surface remains JSON-only and browser-local

### 7. Integrate Builder Preview With The Existing Runtime

Objective:
Make Sprint 6 feel like one coherent product slice rather than disconnected
builder controls next to a stale sample app.

Primary file targets:

- `frontend/src/App.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/components/DashboardRenderer.tsx` only if minor support hooks
  are needed

Done when:

- the frontend demonstrates the Sprint 6 builder flow by default
- builder edits immediately affect the previewed dashboard
- the Sprint 5 read-only runtime remains the rendering path for the draft spec

### 8. Add Verification Coverage

Objective:
Leave Sprint 6 with durable proof around builder behavior, not only manual
smoke confidence.

Primary file targets:

- tests under `frontend/src/features/builder/`
- `frontend/src/components/DashboardRenderer.test.tsx`
- any focused test updates under `frontend/src/core/spec/` or `frontend/src/mock-data/`

Done when:

- builder draft mutations are covered
- layout edit behavior is covered
- palette insertion defaults are covered
- property editing writes are covered
- template selection and starter-spec instantiation are covered
- spec import/export validation behavior is covered
- `npm --prefix frontend test` and `npm --prefix frontend run build` stay green

### 9. Verify And Close The Slice

Objective:
Hand Sprint 7 a workshop-authoring baseline instead of another planning-only
placeholder.

Done when:

- the Sprint 6 builder artifacts are present
- frontend tests pass
- frontend build passes
- residual work is explicitly documented instead of silently absorbed into
  Sprint 6

## Verification Matrix

| Area | Proof |
|------|-------|
| Builder shell | The app boots into a real builder flow with one editable draft |
| Layout editing | Drag/drop and resize update widget positions through the draft spec |
| Palette | Each supported primitive can be inserted as a valid starter widget |
| Property editing | Bounded dashboard/widget edits mutate the draft correctly |
| Template selection | Catalog-backed template selection yields usable starter specs |
| Spec I/O | Export produces DashboardSpec JSON and import rejects invalid specs |
| Preview integration | Builder output renders through the existing DashboardRenderer path |
| Frontend health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Risks And Controls

| Risk | Control |
|------|---------|
| `react-grid-layout` integration adds complexity and could destabilize the current renderer | Isolate editable composition to builder mode and keep Sprint 5’s read-only renderer intact for preview |
| Template selection could stay superficial if it only exposes metadata | Require a starter-spec instantiation layer as part of Sprint 6 rather than treating metadata as “done” |
| Property editing could balloon into full schema editing | Limit the panel to common dashboard and selected-widget fields and split advanced branches forward |
| Imported JSON could corrupt local draft state | Validate and parse through `specIo.ts` before draft replacement; surface explicit errors |
| The current single-position layout model may not match every responsive editing ambition | Keep the canonical editable layout in existing `position` fields and treat broader layout-schema changes as a separate decision |

## Verification Commands

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

Optional repo-baseline check if the implementation touches shared utilities or
unexpected cross-cutting seams:

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
```

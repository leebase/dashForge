# Sprint 6 Contract - Builder Mode + Palette + Property Editing + Template Selection + Spec I/O

## Objective

Sprint 6 turns DashForge from a read-only runtime proof into a bounded manual
authoring workflow. The output of this sprint is a frontend builder slice that:

- adds a builder shell around the existing DashboardSpec runtime,
- introduces editable widget composition for the current primitive set,
- provides a widget palette and property editing workflow,
- makes the Sprint 4 template catalog usable as real starter dashboards, and
- adds JSON spec import/export helpers for workshop authoring.

This sprint is intentionally bounded to manual builder mode. It does not
deliver presenter mode, proposal export, AI generation, production/live data
binding, or template authoring as a separate product surface.

## Canon Sources

Sprint 6 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- Sprint 5 closeout artifacts under `docs/`, `plans/`, and `code-reviews/`

If those documents and this contract diverge, the canon docs win and this
contract must be corrected.

## Starting Baseline

Sprint 5 closed the runtime-breadth slice:

- the frontend supports all eight MVP primitives,
- `DashboardRenderer` validates and renders DashboardSpec-driven dashboards,
- `ResponsiveDashboardGrid` provides responsive read-only layout behavior,
- themes, chart compilers, and adapter seams are in place and verified, and
- the app still boots into one fixed sample dashboard in `frontend/src/App.tsx`.

The builder gap is now concrete in code:

- there is no builder shell, toolbar, palette, or property panel,
- there is no editable layout engine or drag/resize workflow,
- `frontend/src/mock-data/templateCatalog.ts` is metadata-only and does not yet
  instantiate starter DashboardSpecs,
- there is no spec import/export helper surface for workshop authoring, and
- the current app shell has no concept of selected widget, draft state, or
  builder-vs-preview workflow.

Sprint 6 builds forward from that baseline. It should add builder workflows on
top of the closed Sprint 5 renderer instead of reopening the chart, theme,
adapter, generator, or template-catalog metadata contracts unless a concrete
defect is uncovered.

## Scope

### In Scope

#### 1. Builder Shell And Local Draft Workflow

- Add `frontend/src/features/builder/BuilderShell.tsx` as the manual-authoring
  entry point for Sprint 6.
- Add `frontend/src/features/builder/BuilderToolbar.tsx` for the bounded
  builder actions needed in this sprint:
  - create/reset draft
  - apply template
  - theme / pack / scenario switching where the draft supports it
  - JSON import/export entry points
- Keep the draft state local to the frontend runtime for this sprint.
- Reuse the existing DashboardSpec validation/runtime path for live preview
  instead of creating a second rendering stack.

#### 2. Editable Layout Composition

- Adopt `react-grid-layout` as the builder-mode composition engine described in
  `architecture.md`.
- Make Sprint 6 the first slice that supports:
  - drag/drop widget composition
  - resize handles
  - add/remove widget actions from the palette
- Keep the editable layout model bounded to the current DashboardSpec shape:
  - the canonical editable layout remains the existing widget `position`
    surface
  - Sprint 6 should not redesign DashboardSpec around per-breakpoint layout
    storage unless a concrete defect forces that change
- Preserve the Sprint 5 responsive read-only runtime for preview/rendering
  rather than replacing it everywhere with builder-specific code.

#### 3. Widget Palette And Default Widget Factories

- Add `frontend/src/features/builder/WidgetPalette.tsx`.
- Expose the current supported primitive set as selectable builder items:
  - `kpi`
  - `line`
  - `bar`
  - `stacked_bar`
  - `donut`
  - `table`
  - `sparkline`
  - `gauge`
- Provide bounded default widget factories so palette insertion creates valid
  starter widget specs without requiring raw JSON editing first.
- Keep palette behavior focused on inserting known DashForge primitives; do not
  introduce a custom chart builder or plugin system.

#### 4. Property Editing

- Add `frontend/src/features/builder/PropertyPanel.tsx`.
- Support dashboard-level editing needed for workshop authoring:
  - title / description
  - theme
  - intent audience/type where already modeled
  - mock pack / scenario / seed / time range fields already present in the spec
- Support widget-level editing for the selected widget:
  - title / subtitle / caption
  - position and size bounds exposed through the current spec
  - chart encoding fields and a bounded subset of chart options that already
    exist in Sprint 5
- Keep property editing form-driven and spec-aware. Sprint 6 does not need a
  full raw JSON editor as the primary editing experience.

#### 5. Template Selection And Starter Spec Instantiation

- Add `frontend/src/features/builder/TemplateGallery.tsx`.
- Use the closed Sprint 4 template catalog as the source of available template
  choices.
- Add the minimum template-instantiation layer needed so selecting a template
  produces a usable starter DashboardSpec draft instead of only metadata.
- Template application should preserve the canon product shape:
  - templates remain spec-first starter dashboards
  - pack/scenario defaults come from the existing catalog and scenario data
  - widgets continue resolving through `DataAdapter`
- Keep Sprint 6 template work bounded to selection and instantiation. Template
  authoring, template persistence, and template-library management are out of
  scope.

#### 6. Spec I/O

- Add `frontend/src/features/builder/specIo.ts`.
- Provide the helper paths needed for manual authoring:
  - export current draft as DashboardSpec JSON
  - import/load DashboardSpec JSON into the builder
  - validate imported JSON before replacing the current draft
- Keep Sprint 6 spec I/O JSON-only:
  - include version-aware validation
  - keep the current `specVersion` contract intact unless a real schema change
    is required
  - do not pull PNG/PDF export into this sprint

#### 7. Builder Proof And Test Coverage

- Update the app shell so the current frontend actually demonstrates Sprint 6
  builder mode instead of only the Sprint 5 sample runtime.
- Add targeted automated coverage for:
  - builder-shell draft mutations
  - layout edit behavior
  - palette insertion defaults
  - property editing writes
  - template selection / instantiation
  - spec import/export validation behavior
- Keep verification centered on `frontend/`; Sprint 6 is not expected to change
  the Python generator surface.

### Explicitly Out Of Scope

- Presenter mode, walkthrough controls, narrative authoring, or annotations UX
- PNG/PDF export or proposal-asset generation
- AI spec generation or prompt workflows
- Production/live data connectors or binding authoring
- Direct browser SQLite runtime beyond the existing snapshot-backed path
- New industry packs or generator features beyond defect-only repairs
- Template authoring, template-library CRUD, or shared template persistence
- Collaboration, multi-user editing, comments, or review workflows
- Undo/redo history beyond whatever minimal state management is strictly needed
- Full advanced editing of narrative, filters, or every possible schema branch
- Broader repo cleanup unrelated to builder-mode delivery

## Constraints

- Build on Sprint 5’s closed runtime baseline instead of redesigning it.
- `DataAdapter` remains the only data contract visible to widgets and preview
  rendering.
- Template selection must build from the existing Sprint 4 catalog rather than
  inventing a disconnected template system.
- The builder must edit the same DashboardSpec model that the read-only runtime
  renders; no second private builder schema.
- `react-grid-layout` is the intended builder-mode engine in canon. Sprint 6 is
  the first slice allowed to introduce that dependency, but avoid pulling in
  additional runtime dependencies beyond what that layout engine materially
  requires.
- Keep the canonical editable layout in the existing widget `position` fields;
  do not widen Sprint 6 into a speculative layout-schema redesign.
- Preserve the current theme/compiler/runtime seams; builder work should drive
  them, not bypass them.
- Keep spec I/O local and browser-side for this sprint; do not add backend
  persistence flows.

## Required Outputs

- `docs/sprint-06-contract.md`
- `plans/sprint-06-plan.md`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/WidgetPalette.tsx`
- `frontend/src/features/builder/PropertyPanel.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/TemplateGallery.tsx`
- `frontend/src/features/builder/specIo.ts`
- supporting runtime/state/test updates primarily under:
  - `frontend/src/features/builder/`
  - `frontend/src/components/`
  - `frontend/src/core/spec/`
  - `frontend/src/mock-data/`
  - `frontend/src/App.tsx`
  - `frontend/src/**/*.test.ts*`

## Ordered Work

1. Lock the Sprint 6 contract and plan against Sprint 5 closeout and the
   current builder gap in `frontend/`.
2. Establish the builder shell and local draft state that wraps the existing
   DashboardSpec runtime.
3. Add editable composition with `react-grid-layout` while keeping the
   canonical spec layout model intact.
4. Deliver the widget palette and valid default widget factories for the
   supported primitive set.
5. Deliver property editing for dashboard-level settings and selected-widget
   fields.
6. Add template selection plus a bounded starter-spec instantiation layer from
   the Sprint 4 catalog.
7. Add JSON spec import/export helpers and imported-spec validation.
8. Integrate the builder flow into the app shell and prove it through targeted
   tests.
9. Verify, repair, and hand off the sprint before opening Sprint 7.

## Acceptance Criteria

1. Sprint 6 remains bounded to manual builder mode and spec JSON I/O.
2. A builder shell exists and can hold an editable DashboardSpec draft without
   bypassing the existing validation/runtime layer.
3. `react-grid-layout`-backed composition exists for drag/drop and resize in
   builder mode.
4. The palette can insert each supported primitive as a valid starter widget.
5. The property panel can edit bounded dashboard-level and widget-level spec
   fields without raw JSON being required for the common path.
6. The template gallery can select from the Sprint 4 catalog and instantiate a
   usable starter dashboard draft.
7. `frontend/src/features/builder/specIo.ts` can export the current draft and
   validate imported DashboardSpec JSON before applying it.
8. The Sprint 5 renderer remains the preview/runtime path for the builder
   output rather than being replaced by a separate rendering stack.
9. `npm --prefix frontend test` passes after the Sprint 6 slice lands.
10. `npm --prefix frontend run build` passes after the Sprint 6 slice lands.

## Verification Expectations

- Re-read this contract and `plans/sprint-06-plan.md` before implementation.
- Prefer targeted frontend checks for:
  - builder-state mutations
  - editable layout behavior
  - palette insertion defaults
  - property-panel writes
  - template-instantiation behavior
  - spec import/export validation behavior
  - end-to-end builder-shell rendering
- Treat drift toward presenter/export, AI generation, live binding, template
  authoring, or broad schema redesign as scope-control defects and split them
  forward.

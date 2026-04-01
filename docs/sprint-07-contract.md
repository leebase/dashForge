# Sprint 7 Contract - Presenter Mode + Narrative Authoring + Annotation Support + Export Flows

## Objective

Sprint 7 turns DashForge from a bounded manual builder into a workshop
storytelling tool. The output of this sprint is a frontend presenter/export
slice that:

- adds a bounded narrative authoring workflow on top of the closed Sprint 6
  builder baseline,
- introduces a presenter-mode runtime that steps through a story arc while
  highlighting relevant widgets,
- makes the existing `DashboardSpec.narrative` and widget `annotations`
  branches usable in the product, and
- adds browser-local export flows for reusable spec output plus proposal-ready
  presenter artifacts.

This sprint is intentionally bounded to manual presenter/export workflows. It
does not deliver AI-generated narrative content, live data binding, production
code export, collaboration, or a broad spec redesign.

## Canon Sources

Sprint 7 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- Sprint 6 closeout artifacts under `docs/`, `plans/`, and `code-reviews/`

If those documents and this contract diverge, the canon docs win and this
contract must be corrected.

## Starting Baseline

Sprint 6 closed the builder slice:

- the app boots into `frontend/src/features/builder/BuilderShell.tsx`,
- the builder owns one editable `DashboardSpec` draft backed by the closed
  Sprint 5 runtime,
- template selection, palette insertion, property editing, and JSON spec I/O
  all exist and are verified, and
- preview rendering still flows through `DashboardRenderer` plus
  `StaticDataAdapter` instead of a second private renderer.

The Sprint 7 gap is concrete in the current codebase:

- `frontend/src/core/spec/dashboardSpec.ts` and
  `frontend/src/core/spec/dashboardSchema.ts` already model optional
  `narrative` and widget `annotations`, but the builder does not expose them,
- `frontend/src/features/builder/templateInstantiation.ts` still creates drafts
  with `narrative: undefined`,
- `frontend/src/App.tsx` and `BuilderShell.tsx` support build/preview flows only
  and have no presenter-mode runtime,
- `WidgetRenderer` only forwards annotations into the current cartesian chart
  compiler path and does not offer a bounded presenter overlay or callout
  surface, and
- there are no frontend export helpers yet under
  `frontend/src/features/export/`.

Sprint 7 builds forward from that baseline. It should wire the already-modeled
storytelling seams into the product instead of reopening Sprint 2-6 data,
theme, renderer, builder, or generator contracts unless a concrete defect is
uncovered.

## Scope

### In Scope

#### 1. Narrative Store And Starter Hydration

- Add `frontend/src/features/presenter/narrativeStore.ts`.
- Use the existing `DashboardSpec.narrative` surface as the canonical presenter
  data model; do not introduce a second private presenter schema.
- Add the bounded helpers needed to:
  - create a valid empty/default narrative for a draft,
  - keep story-arc widget references aligned with the current widget list, and
  - seed template-backed drafts with usable narrative starters instead of
    leaving `narrative` undefined everywhere.
- Keep Sprint 7 narrative content manual and deterministic. Do not add AI
  summary or story generation in this sprint.

#### 2. Story Arc Authoring In The Builder

- Add `frontend/src/features/presenter/StoryArcEditor.tsx`.
- Surface a bounded editor for the existing story arc sections:
  - hook
  - context
  - tension
  - resolution
  - call to action
- Support editing of:
  - section headline
  - commentary
  - section widget assignments
  - transition text
  - executive summary
  - presenter notes
- Integrate the story editor into the existing Sprint 6 builder workflow
  instead of creating a disconnected authoring shell.
- Keep authoring bounded to the current spec surface. Audience variants,
  automatic narrative generation, and advanced note-routing are out of scope.

#### 3. Presenter Runtime And Walkthrough Controls

- Add `frontend/src/features/presenter/PresenterMode.tsx`.
- Provide the guided walkthrough controls the product canon requires:
  - build/preview/presenter mode switching from the current builder shell,
  - next/previous section stepping,
  - direct jump to a named story section,
  - active-section widget emphasis with non-active widgets visually dimmed, and
  - a commentary panel showing the current section headline, commentary, and
    transition text.
- Presenter mode must render the same `DashboardSpec` through the existing
  runtime path; it should stage on `DashboardRenderer` / `WidgetRenderer`
  instead of forking a second dashboard renderer.
- Presenter notes may be visible in presenter chrome only; they must not become
  part of the projected dashboard body or exported default artifact unless
  explicitly requested by the export path.

#### 4. Bounded Annotation Authoring And Rendering

- Add `frontend/src/features/presenter/ChartAnnotationLayer.tsx`.
- Make widget annotations usable in Sprint 7 without widening into a full chart
  authoring subsystem.
- Support a bounded annotation workflow that fits the current runtime:
  - manual authoring/editing of a small useful subset in the builder,
  - continued use of existing cartesian `reference_line` support where the
    chart compiler already handles it, and
  - presenter-visible annotation text/callout rendering through a shared layer
    rather than one-off per-screen markup.
- Keep annotation work aligned with the existing `annotations` field on each
  widget; do not create a separate presenter-only annotation store.
- If a specific annotation type cannot be rendered meaningfully by the current
  chart/runtime seams without a larger redesign, the sprint should narrow to a
  well-documented supported subset rather than fake full coverage.

#### 5. Export Flows

- Add `frontend/src/features/export/exportSpec.ts`.
- Add `frontend/src/features/export/exportDashboard.ts`.
- Provide browser-local export flows for:
  - downloading the current validated `DashboardSpec` as a `.json` file, and
  - exporting a proposal-ready presenter artifact based on the current
    dashboard/presenter view.
- Keep export aligned with the current frontend-only product shape:
  - use the validated `DashboardSpec` as the source of truth,
  - reuse the same theme/runtime output that the builder and presenter view use,
  - keep the flow browser-local with no backend export service.
- Because runtime dependency additions still require explicit approval, Sprint 7
  export must stay inside currently approved/browser-native capabilities by
  default. Browser-print/PDF and printable HTML snapshot flows are in scope.
  Direct PNG raster capture is not required unless it can be delivered without
  adding new runtime dependencies.

#### 6. App Integration And Test Coverage

- Update the app shell so the frontend demonstrates Sprint 7 storyteller
  behavior on top of the Sprint 6 builder baseline.
- Integrate presenter and export controls into the existing builder chrome
  rather than hiding them in isolated test-only helpers.
- Add targeted automated coverage for:
  - narrative-store creation and widget-reference clamping,
  - story-arc editor writes,
  - presenter stepping and active-widget emphasis behavior,
  - bounded annotation editing/rendering behavior,
  - spec download/export helper behavior, and
  - proposal-artifact export helper behavior that stays inside the chosen
    browser-local contract.

### Explicitly Out Of Scope

- AI-generated executive summaries, notes, or story arcs
- Production/live data binding or binding-authoring workflows
- Production React code export
- New industry packs, scenario-generation work, or direct browser SQLite work
- Collaboration, comments, approvals, or multi-user presenter workflows
- Full audience-variant authoring beyond the bounded existing spec surface
- Multi-screen presenter notes or speaker-display infrastructure
- A broad `DashboardSpec` redesign for presenter/export concerns
- New chart primitives or a general chart-annotation DSL redesign
- Adding new runtime dependencies without explicit human approval
- Broad repo cleanup unrelated to the presenter/export slice

## Constraints

- Build on Sprint 6's closed builder baseline instead of redesigning it.
- `DashboardRenderer` remains the canonical dashboard render path. Presenter mode
  may wrap or augment it, but must not replace it with a disconnected renderer.
- The same `DashboardSpec` must drive build, preview, presenter, and export
  flows.
- Widgets still consume data only through `DataAdapter`; presenter/export work
  must not bypass adapter-backed runtime behavior.
- Keep the narrative and annotation models anchored to the existing spec/schema
  branches unless a concrete defect forces a bounded correction.
- Keep export browser-local for this sprint; do not add server-side rendering or
  background export services.
- Respect the current dependency guardrail. If an export idea requires a new
  package, document it and split it rather than silently widening the sprint.
- Preserve the closed Sprint 6 JSON spec I/O flow; Sprint 7 export should extend
  it, not replace it with a second incompatible path.

## Required Outputs

- `docs/sprint-07-contract.md`
- `plans/sprint-07-plan.md`
- `frontend/src/features/presenter/narrativeStore.ts`
- `frontend/src/features/presenter/StoryArcEditor.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/features/presenter/ChartAnnotationLayer.tsx`
- `frontend/src/features/export/exportDashboard.ts`
- `frontend/src/features/export/exportSpec.ts`
- supporting runtime/state/test updates primarily under:
  - `frontend/src/features/presenter/`
  - `frontend/src/features/export/`
  - `frontend/src/features/builder/`
  - `frontend/src/components/`
  - `frontend/src/core/io/`
  - `frontend/src/core/spec/`
  - `frontend/src/App.tsx`
  - `frontend/src/**/*.test.ts*`

## Ordered Work

1. Lock the Sprint 7 contract and plan against Sprint 6 closeout, canon docs,
   and the current presenter/export gap in `frontend/`.
2. Establish the narrative store/helpers that make `DashboardSpec.narrative`
   usable and keep widget references valid.
3. Deliver the bounded story-arc editor inside the current builder workflow.
4. Add presenter mode controls and section-by-section widget emphasis on top of
   the existing runtime.
5. Add bounded annotation authoring/rendering support that matches the current
   chart/runtime seams.
6. Add browser-local export helpers for spec download and proposal-ready
   presenter artifacts.
7. Integrate Sprint 7 controls into the app shell and prove them through
   targeted tests.
8. Verify, repair, and hand off the sprint before opening Sprint 8.

## Acceptance Criteria

1. Sprint 7 remains bounded to presenter mode, manual narrative authoring,
   bounded annotation support, and browser-local export flows.
2. A narrative store exists and produces valid/clamped story-arc data on the
   same `DashboardSpec` model already validated by the app.
3. A story-arc editor exists and can edit section content plus widget
   assignments without requiring raw JSON for the common path.
4. Presenter mode can step through the defined sections, emphasize the active
   widgets, and show the current section commentary.
5. Presenter work stages on the existing dashboard runtime instead of creating a
   disconnected rendering stack.
6. Widget annotations become meaningfully usable through a documented supported
   subset that the builder and presenter runtime both honor.
7. `frontend/src/features/export/exportSpec.ts` can download the current
   validated spec as JSON.
8. `frontend/src/features/export/exportDashboard.ts` can produce a bounded
   proposal-ready artifact using browser-local capabilities and without
   requiring backend export services.
9. The closed Sprint 6 builder baseline remains intact instead of being bypassed
   by Sprint 7 work.
10. `npm --prefix frontend test` passes after the Sprint 7 slice lands.
11. `npm --prefix frontend run build` passes after the Sprint 7 slice lands.

## Verification Expectations

- Re-read this contract and `plans/sprint-07-plan.md` before implementation.
- Prefer targeted frontend checks for:
  - narrative-store behavior
  - story-arc editor writes
  - presenter-mode step flow
  - widget emphasis and dimming behavior
  - bounded annotation rendering
  - spec export/download helpers
  - proposal-artifact export helpers
- Keep the broader repo Python/generator surface out of scope unless a concrete
  regression requires a repo-level rerun.
- Treat drift toward AI generation, live binding, production code export, or
  new runtime dependencies as a contract violation unless the human explicitly
  reopens scope.

# Sprint 7 Plan - Presenter Mode + Narrative Authoring + Annotation Support + Export Flows

## Goal

Execute Sprint 7 as a bounded presenter/export slice that layers workshop
storytelling on top of the closed Sprint 6 builder baseline. The output of this
sprint should let a consultant author a story arc, step through it in a
presenter mode, emphasize the relevant widgets, and export reusable proposal
artifacts without dragging AI-generation, live-binding, or production-code
scope forward.

## Planning Assumptions

- Sprint 6 closeout artifacts are authoritative for the current builder,
  renderer, template, and spec-I/O baseline.
- `DashboardSpec.narrative` and widget `annotations` already exist in the
  current spec/schema, so Sprint 7 should activate those seams rather than
  invent a second presenter schema.
- `BuilderShell` remains the main app entry point for this slice; presenter mode
  should stage inside that shell or directly adjacent to it instead of replacing
  the current app structure.
- `DashboardRenderer` and `WidgetRenderer` remain the rendering foundation.
  Presenter work should wrap or augment them rather than fork another dashboard
  runtime.
- Current chart annotation support is partial and centered on cartesian
  `reference_line` behavior. Sprint 7 must document and test the supported
  subset instead of implying full annotation parity across all widgets.
- `frontend/package.json` does not currently include browser-capture/export
  libraries, and project guardrails still require explicit approval before
  adding new runtime dependencies.

## Implementation Guardrails

- Keep all build, preview, presenter, and export behavior driven by validated
  `DashboardSpec`.
- Do not let presenter or export code read scenario internals directly as a
  substitute for adapter-backed runtime behavior.
- Reuse the existing schema validator and persistence helpers where possible
  rather than introducing a second serialization path.
- Keep narrative authoring manual and bounded. No AI generation or prompt entry
  points belong in Sprint 7.
- Keep export browser-local for this sprint.
- Prefer browser-native print/download/HTML export paths before considering any
  new dependency.
- If direct PNG raster export cannot be delivered with current browser/runtime
  capabilities, ship the PDF/printable artifact path and document PNG as a
  follow-on dependency decision instead of widening the sprint silently.

## Scope Summary

### Deliver In Sprint 7

- `frontend/src/features/presenter/narrativeStore.ts`
- `frontend/src/features/presenter/StoryArcEditor.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/features/presenter/ChartAnnotationLayer.tsx`
- `frontend/src/features/export/exportDashboard.ts`
- `frontend/src/features/export/exportSpec.ts`
- narrative starter/clamping helpers tied to the existing spec
- builder-shell integration for story editing, presenter view, and export
- bounded annotation authoring/rendering support
- browser-local spec download and printable proposal-artifact export flows
- targeted tests for presenter/export behavior

### Do Not Deliver In Sprint 7

- AI-generated story arcs, summaries, or notes
- live/production data-binding flows
- production React code export
- multi-user review/comment workflows
- multi-screen presenter console behavior
- broad audience-variant authoring beyond the current bounded spec surface
- new chart primitives or a full annotation-system redesign
- direct browser SQLite changes
- dependency-expanding raster export work without explicit approval

## Ordered Work

### 1. Establish Narrative Helpers And Draft Defaults

Objective:
Make the existing `DashboardSpec.narrative` branch usable and resilient before
UI work depends on it.

Primary file targets:

- `frontend/src/features/presenter/narrativeStore.ts`
- `frontend/src/features/builder/templateInstantiation.ts`
- optional small support changes in `frontend/src/core/spec/dashboardSpec.ts`
- optional small support changes in `frontend/src/core/spec/dashboardSchema.ts`

Done when:

- new or template-backed drafts can carry a valid default narrative shape
- story sections stay aligned with real widget ids after widget add/remove or
  template replacement
- presenter-facing defaults do not require AI generation or raw JSON editing

### 2. Add Story Arc Authoring To The Builder

Objective:
Let a consultant edit the narrative alongside the existing Sprint 6 draft
workflow.

Primary file targets:

- `frontend/src/features/presenter/StoryArcEditor.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/PropertyPanel.tsx` if bounded annotation fields
  are easiest to host there

Done when:

- the builder exposes story-arc editing for hook/context/tension/resolution/call
  to action
- section headline, commentary, transition text, widget assignments, executive
  summary, and presenter notes are editable
- story edits mutate the same `DashboardSpec` draft already used by preview and
  spec I/O

### 3. Add Presenter Mode Runtime

Objective:
Turn the authored narrative into a guided walkthrough on top of the existing
dashboard renderer.

Primary file targets:

- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/WidgetRenderer.tsx`

Done when:

- the user can switch from build/preview into presenter mode
- presenter mode can step forward/backward and jump between named story sections
- active-section widgets are emphasized while non-active widgets are dimmed
- commentary and transition text are visible in presenter chrome
- the dashboard still renders through the existing validated runtime

### 4. Add Bounded Annotation Authoring And Rendering

Objective:
Make widget annotations usable in practice without reopening the whole chart
system.

Primary file targets:

- `frontend/src/features/presenter/ChartAnnotationLayer.tsx`
- `frontend/src/features/presenter/StoryArcEditor.tsx` or
  `frontend/src/features/builder/PropertyPanel.tsx`
- `frontend/src/components/WidgetRenderer.tsx`
- `frontend/src/core/charts/chartCompiler.ts`

Done when:

- there is one clear supported annotation subset for Sprint 7
- cartesian `reference_line` annotations keep working through the existing chart
  compiler path
- presenter-visible callout text or annotation badges render through a shared
  layer instead of scattered one-off markup
- unsupported annotation shapes are either prevented in the editor or clearly
  documented rather than silently ignored

### 5. Add Export Helpers

Objective:
Provide the bounded export flows the presenter slice needs without adding a
backend or new runtime packages.

Primary file targets:

- `frontend/src/features/export/exportSpec.ts`
- `frontend/src/features/export/exportDashboard.ts`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/core/io/dashboardPersistence.ts`

Done when:

- the current validated draft can be downloaded as `DashboardSpec` JSON
- the current dashboard/presenter view can be exported through a browser-local
  proposal-artifact path
- the export helper uses the same validated draft/theme/runtime assumptions as
  the app itself
- PDF/printable export is real; any missing PNG capture is explicitly left out
  by contract instead of implied

### 6. Integrate Presenter And Export Controls Into The App Shell

Objective:
Make Sprint 7 feel like one coherent product slice rather than separate helper
utilities.

Primary file targets:

- `frontend/src/App.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`

Done when:

- the default app flow still begins from the builder baseline
- presenter and export affordances are visible from the normal workflow
- story editing, presenter stepping, preview, and export all operate on the same
  current draft

### 7. Add Verification Coverage

Objective:
Leave Sprint 7 with durable automated proof around narrative, presenter, and
export behavior.

Primary file targets:

- tests under `frontend/src/features/presenter/`
- tests under `frontend/src/features/export/`
- focused updates under `frontend/src/features/builder/`
- focused updates under `frontend/src/components/`
- optional focused updates under `frontend/src/core/spec/` or
  `frontend/src/core/io/`

Done when:

- narrative helper creation and clamping are covered
- story-arc editor writes are covered
- presenter stepping and active-widget emphasis are covered
- bounded annotation rendering is covered
- spec download/export helpers are covered
- proposal-artifact export helpers are covered
- `npm --prefix frontend test` and `npm --prefix frontend run build` stay green

### 8. Verify And Close The Slice

Objective:
Hand Sprint 8 a stable storytelling/export baseline instead of another
planning-only placeholder.

Done when:

- the Sprint 7 presenter/export artifacts are present
- frontend tests pass
- frontend build passes
- residual export limits and follow-on decisions are explicitly documented

## Verification Matrix

| Area | Proof |
|------|-------|
| Narrative store | Default narrative creation and widget-id clamping stay valid |
| Story editor | Story-arc content edits write into the shared draft correctly |
| Presenter mode | Next/prev/jump controls and section commentary behave correctly |
| Widget emphasis | Active section widgets remain highlighted and others dim |
| Annotation support | The documented Sprint 7 subset renders predictably |
| Spec export | JSON download/export uses the validated draft |
| Proposal artifact export | Browser-local printable/exportable artifact path works within the contract |
| Frontend health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Risks And Controls

| Risk | Control |
|------|---------|
| Presenter mode could fork the runtime and create a second rendering stack | Keep `DashboardRenderer` as the canonical dashboard render path and wrap it with presenter chrome only |
| Narrative editing could sprawl into a full authoring suite | Limit Sprint 7 to story-arc sections, widget assignments, executive summary, and presenter notes |
| Annotation scope could balloon because the spec allows more than the runtime can render today | Lock a documented supported subset and enforce or test it explicitly |
| Export could become blocked by missing capture libraries | Favor browser-native print/download/HTML export and keep new dependency requests out of the sprint unless explicitly approved |
| Builder and presenter state could drift apart | Keep one shared validated draft and derive presenter state from it instead of cloning a second dashboard model |

## Verification Commands

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

Optional repo-baseline check if the implementation unexpectedly touches shared
cross-cutting seams outside the frontend presenter/export slice:

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
```

# Verification — Sprint 7

## Architecture Summary

Sprint 7 is a frontend-first presenter/export slice layered on top of the
closed Sprint 6 builder baseline. The active entry point is
`frontend/src/App.tsx`, which still renders `BuilderShell`; that shell owns one
editable `DashboardSpec` draft, syncs the existing `narrative` branch through
`syncPresenterDraft(...)`, and routes build, preview, presenter, and export
actions through the same shared runtime. Presenter mode stages on
`DashboardRenderer` and `WidgetRenderer` via `PresenterMode`, while export stays
browser-local through `exportSpec.ts` and `exportDashboard.ts` instead of
introducing a second renderer or a backend service. The main trust boundaries
remain imported `DashboardSpec` JSON and adapter-backed widget data. The main
Sprint 7 risk areas are user-visible storytelling correctness, annotation
support staying inside the documented subset, and proposal export output looking
professional instead of leaking presenter chrome into the artifact.

## Scope

Verified the Sprint 7 Presenter Mode + Narrative Authoring + Annotation Support + Export Flows slice against:

- `docs/sprint-07-contract.md`
- `plans/sprint-07-plan.md`
- the Sprint 7 frontend implementation in `frontend/src/`

Implementation inspection for this pass focused on:

- `frontend/src/App.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/PropertyPanel.tsx`
- `frontend/src/features/builder/templateInstantiation.ts`
- `frontend/src/features/presenter/narrativeStore.ts`
- `frontend/src/features/presenter/StoryArcEditor.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/features/presenter/ChartAnnotationLayer.tsx`
- `frontend/src/features/export/exportSpec.ts`
- `frontend/src/features/export/exportDashboard.ts`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/WidgetRenderer.tsx`
- Sprint 7 tests under `frontend/src/features/presenter/`,
  `frontend/src/features/export/`, `frontend/src/features/builder/`, and
  `frontend/src/components/`

Verification was run using scratch output directory:
`/Users/lee/projects/dashForge/.agent-orch-scratch/2e34405fba8c/s07_verify/attempt-1`

## Checks Run

| Command | Result | Notes |
|---------|--------|-------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass | Root Python/generator suite remained green: `9 passed in 3.84s`. |
| `cd /Users/lee/projects/dashForge/frontend && npm test` | ✅ Pass | Vitest passed: `22` files / `46` tests, including Sprint 7 narrative-store, story-editor, presenter-mode, export-helper, and builder-shell coverage. |
| `cd /Users/lee/projects/dashForge/frontend && npm run build` | ✅ Pass | TypeScript checks and production build completed successfully. Vite output stayed green, including the Sprint 7 bundle. |
| `cd /Users/lee/projects/dashForge/frontend && npm run dev -- --host 127.0.0.1` | ✅ Expected environment failure | Vite startup hit the known sandbox limit and failed with `listen EPERM: operation not permitted 127.0.0.1:5173`; this remains a host-environment browser-smoke gap, not a newly introduced Sprint 7 runtime crash. |

## What Passed

- Sprint 7's required frontend verification commands are green:
  - `npm test`
  - `npm run build`
- The broader repo baseline stayed healthy during this pass:
  - `python3 -m pytest -q`
- The Sprint 7 implementation matches the contract's main architectural
  direction on inspection:
  - `App.tsx` still boots into `BuilderShell` rather than a disconnected
    presenter/export shell.
  - `BuilderShell` keeps one shared draft and routes preview and presenter views
    through the existing runtime instead of forking renderer logic.
  - `narrativeStore.ts` hydrates a default narrative and clamps section widget
    references against the current widget set.
  - `templateInstantiation.ts` seeds template-backed drafts with narrative
    starters instead of leaving `narrative` undefined.
  - `StoryArcEditor.tsx` edits executive summary, presenter notes, story
    section copy, and widget assignments directly on the shared `DashboardSpec`
    draft.
  - `PresenterMode.tsx` provides next/previous stepping, direct section jumps,
    commentary/transition copy, and active-widget emphasis using
    `DashboardRenderer` presentation flags.
  - `PropertyPanel.tsx` and `ChartAnnotationLayer.tsx` expose the documented
    Sprint 7 annotation subset: reference lines on cartesian widgets and
    callout labels on all widget types.
  - `exportSpec.ts` validates and downloads the current `DashboardSpec` as JSON.
  - `exportDashboard.ts` produces a browser-local printable proposal document
    without adding runtime dependencies.
- Targeted automated coverage exists and passed for the main Sprint 7 seams:
  - narrative creation and widget-reference clamping
  - story-arc editing
  - presenter stepping and widget emphasis
  - export-helper document/download behavior
  - one builder-shell interaction path covering annotation editing, presenter
    mode entry, and JSON import failure handling

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| V701 | High | Correctness | `frontend/src/features/builder/BuilderShell.tsx:240-256`, `frontend/src/features/builder/BuilderShell.tsx:400-403`, `frontend/src/features/presenter/PresenterMode.tsx:36-125`, `frontend/src/features/export/exportDashboard.ts:40-171` | Exporting a proposal artifact from presenter mode captures the entire `PresenterMode` DOM through `exportSurfaceRef.current.outerHTML`, not just the rendered dashboard stage. That means the exported artifact can include presenter chrome such as section tabs, next/previous buttons, “Active Widgets”, and presenter notes inside the main dashboard body even before `buildDashboardExportDocument(...)` adds its own story-arc and optional notes sections. This violates the Sprint 7 contract requirement that presenter notes not become part of the projected dashboard body or exported default artifact unless explicitly requested, and it makes the presenter-mode export path materially less proposal-ready than preview export. | Export only the dashboard-stage subtree, or render a dedicated export container from the validated spec that excludes interactive presenter chrome by default. Gate presenter-note inclusion behind an explicit export option instead of inferring it from `viewMode === "presenter"`, and add a focused export test that proves presenter-mode artifact HTML omits the controls/panel unless that option is enabled. |

## What Failed or Remains

- The only command failure during verification was the already-known sandbox
  browser-start limitation:
  - `npm run dev -- --host 127.0.0.1`
  - failure: `listen EPERM: operation not permitted 127.0.0.1:5173`
- One Sprint 7 user-visible correctness defect was found by inspection even
  though the automated suite is green:
  - presenter-mode proposal export currently includes presenter chrome in the
    exported dashboard body
- One real local browser smoke is still required in an environment that permits
  localhost binding before the Sprint 7 presenter/export workflow can be called
  fully smoke-tested end-to-end.

## Test Additions Recommended

- Add a focused export test that renders or simulates presenter-mode export and
  asserts that proposal artifact HTML excludes presenter controls/panel content
  by default.
- Add direct `ChartAnnotationLayer` coverage for the supported Sprint 7 subset
  so annotation rendering is proven explicitly instead of only indirectly
  through builder-shell integration.

## Outcome

Sprint 7 is healthy at the automated-check level and the required presenter,
narrative, annotation, and export seams are present, but this verification pass
did not come back fully clean. The sprint should go through a repair step
before formal review/handoff because the presenter-mode proposal export path is
currently exporting UI chrome that should not be part of the default artifact.

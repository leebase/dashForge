# Code Review — 2026-04-01

## Architecture Summary

DashForge now has a closed Sprint 7 storytelling/export slice in `frontend/`.
The active app entry point `frontend/src/App.tsx` still renders
`BuilderShell`, which owns one editable `DashboardSpec` draft, keeps the
existing `narrative` branch hydrated through `syncPresenterDraft(...)`, and
routes build, preview, presenter, and export actions through the same shared
runtime. Story authoring lives in `StoryArcEditor`, presenter walkthroughs live
in `PresenterMode`, bounded annotation authoring stays on the existing widget
surface through `PropertyPanel` plus `ChartAnnotationLayer`, and export remains
browser-local through `exportSpec.ts` and `exportDashboard.ts` instead of
introducing a second renderer or backend service. The main trust boundaries are
imported `DashboardSpec` JSON, adapter-backed widget data, and browser popup /
print behavior for proposal artifacts. The main Sprint 7 risk areas were
presenter correctness, exported artifact fidelity, and preserving the closed
Sprint 2-6 runtime and builder seams while layering storytelling features on
top.

## Checks Run

| Command | Result |
|---------|--------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass |
| `cd /Users/lee/projects/dashForge/frontend && npm test` | ✅ Pass |
| `cd /Users/lee/projects/dashForge/frontend && npm run build` | ✅ Pass |
| `cd /Users/lee/projects/dashForge/frontend && npm run dev -- --host 127.0.0.1` | ⚠️ Expected environment failure (`listen EPERM`) |

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| None | — | — | — | No blocking, high, or medium Sprint 7 defects remained after the verify and repair passes, and the fresh closeout rerun matched that result. The only residual limitation is the already-known sandbox restriction that prevents one real browser smoke of the presenter/export UI. | Treat Sprint 7 as formally closed, keep one host-environment browser smoke on the queue, and begin Sprint 8 from this repaired presenter/export baseline instead of reopening Sprint 7 scope. |

## Remediation Roadmap

### Fix Now (Blockers)

- None.

### Fix Soon (High ROI)

- Run one local browser smoke outside this sandbox so the Sprint 7 presenter,
  narrative, and export workflow is observed in a real port-binding
  environment.
- Start Sprint 8 with a bounded contract and plan for AI-assisted
  DashboardSpec generation instead of expanding Sprint 7 further.

### Fix Later (Refactors)

- Revisit dependency-backed raster export only if a later sprint truly needs
  PNG capture beyond the current browser-local printable artifact path.
- Revisit direct browser SQLite only when a later sprint needs in-browser SQL
  behavior instead of the current SQLite-derived snapshot bridge.

## Patch Suggestions

No Sprint 7 corrective patch is required from this review pass. The useful next
changes are one host-environment browser smoke plus Sprint 8 planning, not more
repair edits to the closed presenter/export implementation.

## Test Additions Recommended

- [ ] Add a browser-capable smoke run outside this sandbox so presenter
      stepping, annotation visibility, and proposal export can be exercised in
      a real local environment.
- [ ] Add direct `ChartAnnotationLayer` coverage for the supported Sprint 7
      subset so annotation rendering stays proven independently of builder-shell
      integration tests.

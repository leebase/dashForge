# Code Review — 2026-04-01

## Architecture Summary

DashForge now has a closed Sprint 6 manual-authoring slice in `frontend/`. The
active app entry point `frontend/src/App.tsx` renders `BuilderShell`, which owns
one local `DashboardSpec` draft, drives editable composition through
`react-grid-layout`, instantiates catalog-backed starter dashboards from the
Sprint 4 template metadata, and imports or exports spec JSON through the shared
persistence and validation path. Preview rendering still flows through
`DashboardRenderer` plus `StaticDataAdapter` instead of a second private builder
renderer. The Python CLI in `src/dashForge/` remains a bounded dependency for
mock-data generation rather than a Sprint 6 implementation surface. The main
risk areas for this sprint were imported-spec trust boundaries, layout writeback
into canonical widget `position` fields, and preserving the closed Sprint 2-5
runtime, adapter, and template seams while adding manual authoring.

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
| None | — | — | — | No blocking, high, or medium Sprint 6 defects remained after the verify and repair passes, and the fresh closeout rerun matched that result. The only residual limitation is the already-known sandbox restriction that prevents one real browser smoke of the builder UI. | Treat Sprint 6 as formally closed, keep one host-environment browser smoke on the queue, and begin Sprint 7 from this stable builder baseline instead of reopening Sprint 6 scope. |

## Remediation Roadmap

### Fix Now (Blockers)

- None.

### Fix Soon (High ROI)

- Run one local browser smoke outside this sandbox so the Sprint 6 builder's
  drag, resize, and editing flows are observed in a real port-binding
  environment.
- Write the Sprint 7 contract and plan so the governed ladder can move from the
  closed builder slice into presenter mode and export flows.

### Fix Later (Refactors)

- Revisit direct browser SQLite only when a later sprint needs in-browser SQL
  behavior instead of the current SQLite-derived snapshot bridge.
- Isolate or retire the remaining bootstrap-era Python residue separately from
  the now-intentional generator CLI surface.

## Patch Suggestions

No Sprint 6 corrective patch is required from this review pass. The useful next
changes are one host-environment browser smoke plus Sprint 7 planning, not more
repair edits to the closed builder implementation.

## Test Additions Recommended

- [ ] Add a browser-capable smoke run outside this sandbox so
      `react-grid-layout` drag/resize behavior is exercised in a real local
      environment.
- [ ] Add one round-trip integration path that exports a builder draft and
      re-imports it through the builder state to prove the JSON workflow end to
      end.

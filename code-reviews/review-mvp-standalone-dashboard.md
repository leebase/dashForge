# Code Review — 2026-04-02

## Architecture Summary

DashForge's current MVP entrypoint is the standalone runtime in `frontend/src/App.tsx`, which boots one registered ED throughput scenario through `frontend/src/features/runtime/standaloneDashboard.ts` and `frontend/src/features/runtime/StandaloneDashboardApp.tsx` into the shared `DashboardRenderer` plus `createDashboardDataAdapter(...)` path. The MVP is now explicitly one bounded flow: scenario definition, data generation, and a standalone dashboard deliverable backed by the existing `DashboardSpec` and `DataAdapter` seams. Builder, presenter, AI authoring, and live-binding surfaces remain secondary/operator capabilities on that same runtime. The main risks for this slice are canon drift between scenario-package docs and runtime registration, accidentally re-centering the app on builder-first chrome, and shared-runtime regressions in the read-only dashboard path.

## Checks Run
| Command | Result |
|---------|--------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass (`9 passed`) |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ✅ Pass (`30` files, `75` tests) |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run build` | ✅ Pass |

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| None | — | — | — | No blocking, high, or medium standalone-MVP defects remain after the verify and repair passes. The default app path is scenario-first, builder access is explicit, shared-runtime teardown is repaired, and the repo checks are green. | Treat the standalone MVP slice as formally closed in-repo and keep one host-capable browser smoke on the manual follow-up queue. |

## Remediation Roadmap

### Fix Now (Blockers)
- None.

### Fix Soon (High ROI)
- Run one host-environment browser smoke so the default standalone dashboard path is observed in a real browser session instead of only sandboxed test/build runs.
- Keep future scenario-package work pinned to the registered runtime seam so new demo packages follow the same scenario-definition plus data-generation plus standalone-deliverable pattern.

### Fix Later (Refactors)
- Add a multi-scenario launcher only under a new bounded contract; do not widen the current MVP proof from one canonical standalone scenario into a browsing surface by accident.
- Revisit broader builder/presenter/live-binding polish only as post-MVP operator improvements on top of the shared runtime.

## Patch Suggestions

No corrective patch is required from this review pass. The useful next step is one host-capable browser smoke and then an explicit next-slice choice, not more repair edits to the standalone MVP implementation.

## Test Additions Recommended
- [ ] Run one browser-capable smoke outside this sandbox so the default standalone ED throughput path is exercised end to end.
- [ ] Keep one focused regression that asserts the default standalone pack, scenario, and template IDs stay wired to the registered ED throughput starter as the scenario catalog evolves.

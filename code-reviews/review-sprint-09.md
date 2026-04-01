# Code Review — 2026-04-01

## Architecture Summary

DashForge now has a closed Sprint 9 production-binding slice layered on top of
the Sprint 8 builder/presenter/export baseline in `frontend/`. The app still
enters through `frontend/src/App.tsx`, which renders
`frontend/src/features/builder/BuilderShell.tsx` as the single owner of the
active `DashboardSpec` draft. Sprint 9 keeps that shared runtime intact by
resolving `mock`, `live`, and `hybrid` dashboards through
`frontend/src/core/data/createDashboardDataAdapter.ts`, which chooses among
`StaticDataAdapter`, `RestDataAdapter`, and `HybridDataAdapter` without
introducing renderer-specific branching. The builder-side trust boundaries are
edited/imported live-binding metadata, REST response normalization and field
mapping, and safe serialization that preserves binding metadata while stripping
live header overrides from durable artifacts.

## Checks Run

| Command | Result |
|---------|--------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ✅ Pass |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run build` | ✅ Pass |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run dev -- --host 127.0.0.1` | ⚠️ Expected environment failure (`listen EPERM`) |

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| None | — | — | — | No blocking, high, or medium Sprint 9 defects remained after the verification and repair passes. The repaired field-map validation gap from `V901` is now covered, the shared repo checks are green, and the only residual limit is the already-known sandbox restriction that prevents one real browser smoke of the live-binding workflow. | Treat Sprint 9 as formally closed in the governed program, keep one host-environment browser smoke on the follow-up queue, and choose any further work as a new post-program roadmap slice rather than reopening Sprint 9. |

## Remediation Roadmap

### Fix Now (Blockers)

- None.

### Fix Soon (High ROI)

- Run one local browser smoke outside this sandbox so live/hybrid mode
  switching, REST binding edits, preview, presenter mode, and export are
  exercised in a real port-binding environment.
- Decide the next bounded post-program slice explicitly before adding more
  live-binding scope, so Sprint 9 stays the repo's stable first production
  binding baseline.

### Fix Later (Refactors)

- Revisit warehouse-native adapters, backend brokering, or durable credential
  helpers only in a later contract that intentionally widens beyond Sprint 9's
  bounded REST path.
- Revisit direct browser SQLite only when a later slice truly needs in-browser
  SQL behavior instead of the current SQLite-derived snapshot bridge.

## Patch Suggestions

No Sprint 9 corrective patch is required from this review pass. The useful next
changes are one host-environment browser smoke and an explicitly chosen next
roadmap slice, not more repair edits to the closed production-binding
implementation.

## Test Additions Recommended

- [ ] Add a browser-capable smoke run outside this sandbox so the Sprint 9
      live-binding workflow is exercised end to end.
- [ ] Keep adapter-resolution and builder-shell coverage expanding alongside
      any later live-source additions so new adapters stay behind the same
      `createDashboardDataAdapter(...)` seam.

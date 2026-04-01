# Code Review — 2026-03-31

## Architecture Summary

DashForge now spans two bounded product surfaces: a React/Vite/TypeScript
frontend in `frontend/` that renders DashboardSpec-driven healthcare previews
through `DataAdapter`, and a Python generator CLI in `src/dashForge/` that
produces deterministic healthcare SQLite databases plus optional SQLite-derived
snapshot exports. The main risk areas are the generator/runtime boundary and
scope discipline: the current frontend deliberately consumes snapshot exports
instead of a direct browser SQLite engine, and the remaining industries,
templates, primitives, and builder/presenter work are still forward-scoped.

## Checks Run

| Command | Result |
|---------|--------|
| `cd /Users/lee/projects/dashForge && PYTHONPATH=src python3 -m dashForge.main generate --scenario flu-season --seed 3101 --output .agent-orch-scratch/f98697981a67/s03_review_handoff/attempt-1/flu-season.sqlite --snapshot-output .agent-orch-scratch/f98697981a67/s03_review_handoff/attempt-1/flu-season.snapshot.json --force` | ✅ Pass |
| `cd /Users/lee/projects/dashForge && PYTHONPATH=src python3 -m dashForge.main generate --scenario not-a-real-scenario --output .agent-orch-scratch/f98697981a67/s03_review_handoff/attempt-1/invalid.sqlite` | ✅ Expected failure |
| `cd /Users/lee/projects/dashForge && PYTHONPATH=src python3 -m dashForge.main generate --scenario flu-season --seed 3101 --output .agent-orch-scratch/f98697981a67/s03_review_handoff/attempt-1/flu-season.sqlite --snapshot-output .agent-orch-scratch/f98697981a67/s03_review_handoff/attempt-1/flu-season.snapshot.json` | ✅ Expected failure |
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass |
| `cd /Users/lee/projects/dashForge/frontend && npm test` | ✅ Pass |
| `cd /Users/lee/projects/dashForge/frontend && npm run build` | ✅ Pass |

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| None | — | — | — | No blocking, high, or medium Sprint 3 defects remained after the verification and repair pass. The remaining limitations are roadmap-shaped: browser SQLite is still snapshot-backed in the frontend, real browser smoke still needs a port-binding-capable environment, and other industries/templates are intentionally deferred to Sprint 4+. | Advance the governed ladder to Sprint 4, keep one local browser smoke on the queue, and revisit direct browser SQLite only when a later sprint truly needs it. |

## Remediation Roadmap

### Fix Now (Blockers)

- None.

### Fix Soon (High ROI)

- Run one local browser smoke outside the sandbox so the Sprint 3 sample
  dashboard is seen in a real port-binding environment, not just test/build
  output.
- Start Sprint 4 on top of the now-closed generator and healthcare baseline
  instead of reworking Sprint 3 seams.

### Fix Later (Refactors)

- Replace the SQLite-derived snapshot bridge with a direct browser SQLite engine
  only when the roadmap actually needs in-browser SQL behavior rather than the
  current bounded runtime proof.
- Revisit the remaining bootstrap-era Python residue separately from the now
  intentional generator CLI surface.

## Patch Suggestions

No Sprint 3 corrective patch is required from this review pass. The useful next
changes are Sprint 4 feature work and one real browser smoke, not repair edits
to the Sprint 3 implementation.

## Test Additions Recommended

- [ ] Add a frontend integration test that loads a real snapshot file generated
  by the Python CLI and renders a widget through `DashboardRenderer`.
- [ ] Add a CLI test for overwrite behavior so the `--force` guard stays
  readable and deterministic.

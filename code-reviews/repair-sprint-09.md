# Repair — Sprint 9

## Outcome

Sprint 9 required one repair from `code-reviews/verify-sprint-09.md`, and that
repair is now complete.

The verification artifact reported `V901`: live-binding readiness only checked
binding presence, type, and URL, so a dataset could still be marked `ready`
after introducing renamed REST fields without mapping every widget-required
dashboard field. That deferred the defect into later widget rendering instead
of surfacing it as a dataset-level binding error.

## Repair Applied

- Updated
  [frontend/src/core/data/createDashboardDataAdapter.ts](/Users/lee/projects/dashForge/frontend/src/core/data/createDashboardDataAdapter.ts)
  so live and hybrid binding validation now inspects the dataset reference's
  required dashboard fields before marking a live dataset `ready`.
- The repair keeps Sprint 9's identity-field behavior intact for same-name
  payloads, but once a binding introduces any renamed source field it must now
  provide explicit mappings for every required dashboard field on that dataset.
- Added a focused adapter regression in
  [frontend/src/core/data/createDashboardDataAdapter.test.ts](/Users/lee/projects/dashForge/frontend/src/core/data/createDashboardDataAdapter.test.ts)
  proving that an incomplete renamed `fieldMap` fails adapter resolution with a
  dataset-level error.
- Added a builder-shell regression in
  [frontend/src/features/builder/BuilderShell.test.tsx](/Users/lee/projects/dashForge/frontend/src/features/builder/BuilderShell.test.tsx)
  proving the binding panel surfaces that incomplete renamed mapping as a
  dataset-level error while the user edits the live binding.

## Verification Rerun

- `cd /Users/lee/projects/dashForge && npm --prefix frontend test -- src/core/data/createDashboardDataAdapter.test.ts src/features/builder/BuilderShell.test.tsx`
  - passed: `2` files / `10` tests
- `cd /Users/lee/projects/dashForge && npm --prefix frontend test`
  - passed: `28` files / `71` tests
- `cd /Users/lee/projects/dashForge && npm --prefix frontend run build`
  - passed
- `cd /Users/lee/projects/dashForge && python3 -m pytest -q`
  - passed: `9 passed in 2.14s`
- `cd /Users/lee/projects/dashForge && npm --prefix frontend run dev -- --host 127.0.0.1`
  - expected sandbox failure: `listen EPERM: operation not permitted 127.0.0.1:5173`

## Residual Limits

- One real host-environment browser smoke is still required because this
  sandbox cannot bind Vite to `127.0.0.1:5173`.
- This repair closes the binding-validation gap from `V901`. Sprint 9 still
  needs its formal review/handoff artifact to complete governed closeout.

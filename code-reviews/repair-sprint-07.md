# Repair — Sprint 7

## Outcome

Sprint 7 required one product repair from `code-reviews/verify-sprint-07.md`,
and that repair is now complete.

The verification artifact reported finding `V701`: proposal export from
presenter mode was serializing the full `PresenterMode` shell, which leaked
presenter chrome and notes into the exported dashboard body. That defect has
been repaired without widening Sprint 7 beyond its existing bounded
presenter/export contract.

## Repair Applied

- Updated [frontend/src/features/builder/BuilderShell.tsx](/Users/lee/projects/dashForge/frontend/src/features/builder/BuilderShell.tsx#L240)
  so proposal export reads from an export-stage ref rather than the full
  presenter container, and so default artifact export no longer infers
  presenter-note inclusion from `viewMode === "presenter"`.
- Updated [frontend/src/features/presenter/PresenterMode.tsx](/Users/lee/projects/dashForge/frontend/src/features/presenter/PresenterMode.tsx#L13)
  to accept a dedicated `dashboardStageRef` and attach it only to the rendered
  dashboard stage, leaving presenter controls and notes outside the export
  surface.
- Added explicit regression coverage in
  [frontend/src/features/export/exportDashboard.test.ts](/Users/lee/projects/dashForge/frontend/src/features/export/exportDashboard.test.ts#L31)
  proving presenter notes stay out of the default proposal artifact.
- Added an integration-style workflow regression in
  [frontend/src/features/builder/BuilderShell.test.tsx](/Users/lee/projects/dashForge/frontend/src/features/builder/BuilderShell.test.tsx#L41)
  proving presenter-mode export writes artifact HTML without presenter chrome,
  navigation controls, active-widget metadata, or default presenter notes.

## Verification Rerun

- `cd /Users/lee/projects/dashForge/frontend && npm test -- --run src/features/builder/BuilderShell.test.tsx src/features/export/exportDashboard.test.ts`
  - passed: `2` files / `5` tests
- `cd /Users/lee/projects/dashForge/frontend && npm test`
  - passed: `22` files / `48` tests
- `cd /Users/lee/projects/dashForge/frontend && npm run build`
  - passed
- `cd /Users/lee/projects/dashForge && python3 -m pytest -q`
  - passed: `9 passed in 3.85s`
- `cd /Users/lee/projects/dashForge/frontend && npm run dev -- --host 127.0.0.1`
  - unchanged expected environment failure: `listen EPERM: operation not permitted 127.0.0.1:5173`

## Residual Limits

- A real local browser smoke is still required in an environment that permits
  localhost binding; this sandbox still cannot host Vite on `127.0.0.1:5173`.
- Sprint 7 review/handoff is still pending; this repair step closes the
  verification defect but does not replace the formal review artifact.

# Repair — Sprint 5

## Outcome

Sprint 5 required a real repair pass. The two findings from
`code-reviews/verify-sprint-05.md` were fixed in the frontend runtime and
compiler layer, and the Sprint 5 verification commands are green again.

## Repairs Applied

- Fixed the chart empty-state guard in
  `frontend/src/components/WidgetRenderer.tsx` so non-empty all-zero datasets
  still render as charts instead of collapsing to the generic empty state.
- Fixed the shared chart-options inconsistency in
  `frontend/src/core/charts/chartCompiler.ts`:
  - donut charts now honor `showLegend`
  - donut charts now honor `showTooltip`
  - gauge charts now honor `showTooltip`
- Added focused regression coverage in:
  - `frontend/src/components/DashboardRenderer.test.tsx`
  - `frontend/src/core/charts/chartCompiler.test.ts`

## Verification Run

| Command | Result | Notes |
|---------|--------|-------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass | Root suite remained green: `9 passed in 2.45s`. |
| `cd /Users/lee/projects/dashForge/frontend && npm test` | ✅ Pass | Vitest passed: `13` files / `31` tests. |
| `cd /Users/lee/projects/dashForge/frontend && npm run build` | ✅ Pass | TypeScript checks and production build completed successfully. |
| `cd /Users/lee/projects/dashForge/frontend && npm run dev -- --host 127.0.0.1` | ✅ Expected environment failure | Same known sandbox limit: `listen EPERM: operation not permitted 127.0.0.1:5173`. |

## Finding Status

- `V001` fixed: valid all-zero chart datasets now render through the chart path.
- `V002` fixed: donut and gauge branches no longer bypass the shared
  tooltip/legend option contract where applicable.

## Residual Limits

- A real browser smoke still needs a host environment that permits localhost
  port binding. This sandbox still blocks Vite startup with `listen EPERM`.

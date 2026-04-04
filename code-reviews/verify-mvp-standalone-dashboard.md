# Scope Verified

- `frontend/src/App.tsx` defaults to `StandaloneDashboardApp` instead of `BuilderShell`.
- `frontend/src/features/runtime/StandaloneDashboardApp.tsx` renders the ED throughput dashboard from the shared `DashboardSpec` + `DataAdapter` path.
- `frontend/src/features/runtime/standaloneDashboard.ts` locks the default standalone MVP inputs to:
  - pack: `healthcare`
  - scenario: `ed-throughput-crunch`
  - template: `tpl.healthcare.ed-throughput-command`
- `frontend/src/App.test.tsx` and `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx` cover the standalone-first path and explicit builder handoff.
- Frontend verification checks required by the contract/plan were rerun from the real frontend entry commands.

# Commands Run

```bash
cd /Users/lee/projects/dashForge
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run dev -- --host 127.0.0.1
npm --prefix frontend test -- src/App.test.tsx
npm --prefix frontend test -- src/App.test.tsx src/features/runtime/StandaloneDashboardApp.test.tsx
npm --prefix frontend test
npm --prefix frontend test
```

Results:

- `npm --prefix frontend run build` passed.
- `npm --prefix frontend test` passed on the final two full-suite reruns.
- `npm --prefix frontend test -- src/App.test.tsx` passed.
- `npm --prefix frontend test -- src/App.test.tsx src/features/runtime/StandaloneDashboardApp.test.tsx` passed.
- `npm --prefix frontend run dev -- --host 127.0.0.1` failed in sandbox with `listen EPERM: operation not permitted 127.0.0.1:5173`.
- The first full-suite `npm --prefix frontend test` run reported one post-teardown unhandled `ReferenceError: window is not defined` attributed by Vitest to `src/App.test.tsx`; it did not reproduce on targeted reruns or the next two full-suite reruns.

# User-Flow Checks

- Default app load is the free-standing dashboard, not builder chrome:
  - `App.tsx` renders `StandaloneDashboardApp` until `Open Builder` is clicked.
  - `App.test.tsx` confirms first render shows `ED Throughput Command View` and `Emergency Department Throughput Crunch`.
- Builder-first chrome is absent on initial load:
  - `App.test.tsx` verifies `Prompt The Dashboard, Then Refine The Story` and `Starter Dashboards` are not present before explicit action.
- Builder remains reachable only when explicitly requested:
  - `StandaloneDashboardApp.tsx` exposes a single explicit `Open Builder` action.
  - `App.test.tsx` verifies the builder shell appears only after clicking `Open Builder`.
- The standalone runtime stays on the shared runtime contract:
  - `standaloneDashboard.ts` creates the default spec through `createFreshDraftForScenario(...)`.
  - `StandaloneDashboardApp.tsx` resolves data with `createDashboardDataAdapter(spec)` and renders through `DashboardRenderer`.

# Findings

- No deterministic MVP-path regression was found in the standalone implementation. The app now defaults to the ED throughput dashboard and keeps the builder opt-in.
- Sandbox browser startup is still blocked by environment policy, not by the MVP implementation: `vite --host 127.0.0.1` cannot bind to `127.0.0.1:5173` here.
- A possible low-confidence test flake was observed once: the first full-suite `vitest run` ended with a post-teardown unhandled `window is not defined` error. Because isolated `App.test.tsx`, the paired standalone tests, and two immediate full-suite reruns all passed cleanly, this is a watch item rather than a confirmed defect.

# Outcome

PASS for the bounded MVP standalone contract in-repo:

- the default experience is a free-standing ED throughput dashboard,
- the builder is reachable only by explicit user action,
- `npm --prefix frontend run build` passes, and
- the frontend test suite is green on repeated reruns.

The only remaining gap is the unchanged host-only browser smoke, which cannot be completed inside this sandbox because localhost port binding is denied.

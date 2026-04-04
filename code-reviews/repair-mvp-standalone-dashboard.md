# Scope Repaired

- `frontend/src/components/WidgetRenderer.tsx` no longer wraps initial
  widget-data hydration in `startTransition(...)`.
- `frontend/src/dashboard/ResponsiveDashboardGrid.tsx` no longer wraps the
  initial container-width measurement in `startTransition(...)`.
- `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx` now verifies
  the standalone runtime at the `DashboardRenderer` seam instead of mounting
  the full async widget stack during this contract test.
- The standalone MVP product surface, scenario/template contract, and shared
  `DashboardSpec` plus `DataAdapter` runtime remain unchanged.

# Defect Repaired

- Verification had reported a post-teardown `ReferenceError: window is not
  defined` during repeated full-suite frontend runs.
- A first repair had narrowed `frontend/src/App.test.tsx` to a mocked
  builder-handoff seam, but repeated reruns in this pass still reproduced the
  teardown error, now attributed to
  `src/features/runtime/StandaloneDashboardApp.test.tsx` and then
  `src/features/presenter/PresenterMode.test.tsx`.
- That proved the underlying issue was broader deferred React scheduler work
  inside the shared dashboard runtime rather than just the app-level builder
  handoff test.

# Repair Action

- The current frontend working tree already contained the bounded repair when
  this governed repair step began, so no further runtime code changes were
  required during this attempt. This step revalidated that the existing
  frontend repair closes the verification finding cleanly.
- Reworked `frontend/src/features/runtime/StandaloneDashboardApp.test.tsx` so
  it:
  - renders the real `StandaloneDashboardApp`,
  - keeps the real default ED throughput standalone header, narrative, and
    builder-entry assertions,
  - swaps in a mocked `DashboardRenderer` seam instead of mounting the full
    async widget runtime, and
  - asserts the renderer still receives the canonical mock-runtime contract:
    - title: `ED Throughput Command View`
    - mode: `mock`
    - pack: `healthcare`
    - scenario: `ed-throughput-crunch`
    - an adapter object with the standard query/aggregate/schema APIs
- Reworked the shared read-only runtime path so first-render dashboard
  hydration is synchronous at the state-update sites most directly implicated
  in the teardown leak:
  - `WidgetRenderer` now commits resolved widget data with direct `setState`
    calls instead of deferred transitions.
  - `ResponsiveDashboardGrid` now commits the measured container width with a
    direct `setContainerWidth(...)` call instead of a deferred transition.
- Kept the earlier app-level mocked builder seam intact because it is still
  the right narrow contract for `frontend/src/App.test.tsx`.

# Commands Run

```bash
cd /Users/lee/projects/dashForge
npm --prefix frontend test -- src/features/runtime/StandaloneDashboardApp.test.tsx
npm --prefix frontend test -- src/features/runtime/StandaloneDashboardApp.test.tsx src/features/presenter/PresenterMode.test.tsx
npm --prefix frontend test -- src/App.test.tsx src/features/runtime/StandaloneDashboardApp.test.tsx
python3 - <<'PY'
import subprocess
import sys

for attempt in range(1, 6):
    print(f"=== frontend full suite attempt {attempt}/5 ===", flush=True)
    completed = subprocess.run(
        ["npm", "--prefix", "frontend", "test"],
        cwd="/Users/lee/projects/dashForge",
    )
    if completed.returncode != 0:
        sys.exit(completed.returncode)
PY
npm --prefix frontend run build
npm --prefix frontend run dev -- --host 127.0.0.1
```

# Rerun Evidence

- `npm --prefix frontend test -- src/features/runtime/StandaloneDashboardApp.test.tsx`
  passed.
- `npm --prefix frontend test -- src/features/runtime/StandaloneDashboardApp.test.tsx src/features/presenter/PresenterMode.test.tsx`
  passed.
- `npm --prefix frontend test -- src/App.test.tsx src/features/runtime/StandaloneDashboardApp.test.tsx`
  passed.
- `npm --prefix frontend test` passed five consecutive times with no
  post-teardown `window is not defined` error.
- `npm --prefix frontend run build` passed.
- `npm --prefix frontend run dev -- --host 127.0.0.1` still fails in this
  sandbox with `listen EPERM: operation not permitted 127.0.0.1:5173`, which
  remains the known host-environment restriction rather than a standalone-MVP
  regression.

# Outcome

PASS. The standalone MVP repair is now closed at the actual fault line:
shared-runtime initial hydration no longer leaves deferred React scheduler work
alive past test teardown, and the standalone contract test now verifies the
runtime at its intended seam instead of mounting the full widget stack. The
default standalone dashboard experience remains unchanged, this repair attempt
reconfirmed the fix with fresh targeted reruns plus five consecutive green full
frontend-suite passes, and the only remaining gap is the existing sandbox
localhost bind restriction.

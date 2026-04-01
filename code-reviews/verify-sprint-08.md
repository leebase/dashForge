# Verification — Sprint 8

## Architecture Summary

Sprint 8 is a frontend-first AI-assisted authoring slice layered on top of the
closed Sprint 7 builder/presenter/export baseline. The app still boots through
`frontend/src/App.tsx` into `frontend/src/features/builder/BuilderShell.tsx`,
which remains the single owner of the active `DashboardSpec` draft. Sprint 8
extends that shell with `frontend/src/features/ai/` instead of introducing a
second AI-only app surface:

- `AiPromptBar.tsx` adds generate-new and improve-current controls plus staged
  candidate review/apply/discard behavior.
- `buildGenerationPrompt.ts` and `promptTemplates.ts` assemble bounded prompts
  from the existing theme, scenario, template, and spec canon.
- `aiGenerationClient.ts` keeps Claude-specific transport and env-based
  configuration behind a local seam.
- `generateDashboardSpec.ts` handles response extraction, schema validation,
  presenter-draft sync/clamping, one bounded repair pass, and typed failures.

The main Sprint 8 trust boundaries remain imported/current `DashboardSpec`
input, provider response text, and candidate application into the existing
shared runtime. The main verification risks for this slice are bounded prompt
construction, non-destructive failure handling, and preserving the closed
Sprint 7 preview/presenter/export path after an AI candidate is accepted.

## Scope

Verified the Sprint 8 AI-assisted DashboardSpec generation slice against:

- `docs/sprint-08-contract.md`
- `plans/sprint-08-plan.md`
- the Sprint 8 frontend implementation under `frontend/src/features/ai/`
- Sprint 8 integration points in `frontend/src/features/builder/`,
  `frontend/src/features/presenter/`, `frontend/src/mock-data/`, and
  `frontend/src/core/spec/`

Implementation inspection for this pass focused on:

- `frontend/src/features/ai/AiPromptBar.tsx`
- `frontend/src/features/ai/aiGenerationClient.ts`
- `frontend/src/features/ai/aiTypes.ts`
- `frontend/src/features/ai/buildGenerationPrompt.ts`
- `frontend/src/features/ai/generateDashboardSpec.ts`
- `frontend/src/features/ai/promptTemplates.ts`
- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/WidgetRenderer.tsx`
- Sprint 8 tests under `frontend/src/features/ai/` and
  `frontend/src/features/builder/`

Verification was run using scratch output directory:
`/Users/lee/projects/dashForge/.agent-orch-scratch/92e1ee3f4b29/s08_verify/attempt-1`

## Checks Run

| Command | Result | Notes |
|---------|--------|-------|
| `cd /Users/lee/projects/dashForge && python3 -m pytest -q` | ✅ Pass | Root Python/generator suite remained green: `9 passed in 2.19s`. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ⚠️ Flaky failure on first run | Vitest reported `26` files / `60` tests green, but still exited non-zero because of an unhandled post-teardown exception: `ReferenceError: window is not defined`, attributed to `src/features/presenter/PresenterMode.test.tsx`. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test -- src/features/presenter/PresenterMode.test.tsx` | ✅ Pass | The isolated presenter-mode test passed cleanly: `1` file / `1` test. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ✅ Pass | Immediate rerun completed cleanly: `26` files / `60` tests. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend test` | ✅ Pass | Second rerun also completed cleanly: `26` files / `60` tests. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run build` | ✅ Pass | TypeScript checks and Vite production build completed successfully. |
| `cd /Users/lee/projects/dashForge && npm --prefix frontend run dev -- --host 127.0.0.1` | ✅ Expected environment failure | Vite startup hit the known sandbox limit and failed with `listen EPERM: operation not permitted 127.0.0.1:5173`; this remains a host-environment browser-smoke gap, not a newly introduced Sprint 8 crash. |

## What Passed

- Sprint 8's main implementation seams match the contract on inspection:
  - `BuilderShell.tsx` keeps one authoritative applied draft plus a separate
    staged AI candidate instead of silently overwriting the current dashboard.
  - `AiPromptBar.tsx` exposes both `generate_new` and `improve_current` modes,
    surfaces configured versus unconfigured client status, and requires explicit
    apply/discard for staged output.
  - `buildGenerationPrompt.ts` grounds prompt context in existing scenario,
    template, theme, dataset, widget, intent, audience, and narrative canon
    instead of an ad hoc freeform dictionary.
  - `promptTemplates.ts` derives prompt starters from the catalog and honors the
    scenario-level default template mapping.
  - `aiGenerationClient.ts` keeps provider secrets/configuration in explicit
    runtime env vars and out of `DashboardSpec` or exported artifacts.
  - `generateDashboardSpec.ts` extracts JSON, validates through the shared
    schema, syncs presenter narrative, enforces mock-backed/runtime-compatible
    candidates, and performs at most one bounded repair pass.
  - `BuilderShell.tsx` blocks improve-current generation when the active draft
    is invalid and applies accepted candidates back into the same
    preview/presenter/export runtime.
- The repo baseline stayed healthy during this pass:
  - `python3 -m pytest -q`
- The Sprint 8 production build stayed healthy during this pass:
  - `npm --prefix frontend run build`
- The Sprint 8 automated coverage surface is present and passes when the suite
  is not hitting the intermittent teardown error:
  - prompt-template selection
  - prompt-context assembly
  - Claude-style response extraction
  - request-time failure handling
  - bounded repair behavior
  - builder-shell candidate staging and apply behavior

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| V801 | High | Test Reliability | `frontend/src/features/presenter/PresenterMode.test.tsx:8-32`, `frontend/src/features/presenter/PresenterMode.tsx:37-48`, `frontend/src/components/DashboardRenderer.tsx:38-55`, `frontend/src/components/WidgetRenderer.tsx:88-182` | The required Sprint 8 verification command `npm --prefix frontend test` is not deterministic. On the first full-suite run, Vitest reported all `60` assertions green but still exited `1` because of an unhandled `ReferenceError: window is not defined` after teardown, attributed to `PresenterMode.test.tsx`. Immediate reruns passed, and the isolated presenter test passed, which points to a race or cleanup bug in the presenter/dashboard widget rendering path rather than a stable assertion failure. Because governed verification depends on the top-level test command being trustworthy, this is still a real defect even though it did not reproduce on every rerun. | Make the presenter-mode test and/or widget-rendering path settle all async work before teardown. The strongest candidates are the async widget-data loading transitions in `WidgetRenderer.tsx`, which schedule `startTransition(...)` updates after awaiting adapter reads. Remove or harden those deferred updates for testable cleanup, or make the presenter/dashboard tests explicitly await the widget-render completion before exit so no React work is still pending after jsdom teardown. Add a focused regression test or repeated-suite check that proves `npm test` stays non-flaky. |

## What Failed or Remains

- The first required frontend suite run failed non-deterministically even though
  all test assertions were green:
  - command: `npm --prefix frontend test`
  - failure: unhandled post-teardown `ReferenceError: window is not defined`
  - attribution from Vitest: `src/features/presenter/PresenterMode.test.tsx`
- Because the failure disappeared on immediate reruns, Sprint 8 currently has a
  test-stability problem rather than a consistently reproducible functional
  regression.
- One real local browser smoke is still required in an environment that permits
  localhost binding before the Sprint 8 AI/builder flow can be called fully
  smoke-tested end-to-end:
  - `npm --prefix frontend run dev -- --host 127.0.0.1`
  - sandbox failure: `listen EPERM: operation not permitted 127.0.0.1:5173`

## Test Additions Recommended

- Add a focused regression test around the presenter/dashboard render path that
  waits for widget data resolution and proves no post-teardown React work is
  left pending.
- Add a repeated-suite reliability guard for the presenter/widget path so a
  flaky `vitest` exit can be caught before governed verification.
- When the sandbox limitation is not present, run one host-environment browser
  smoke that exercises AI prompt entry, staged candidate review, apply/discard,
  and the shared preview/presenter/export flow.

## Outcome

Sprint 8 is close, but this verification pass did not come back fully clean.
The implementation matches the bounded AI-generation contract on inspection,
the repo Python suite is green, and the frontend build is green. However, the
required frontend test command produced one real non-zero run because of an
intermittent post-teardown presenter/widget error, so Sprint 8 should go
through a repair step before formal review/handoff. The remaining browser smoke
is still blocked by the sandbox's localhost-binding restriction rather than a
newly observed Sprint 8 runtime crash.

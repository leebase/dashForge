# Code Review — 2026-04-01

## Architecture Summary

DashForge now has a closed Sprint 8 AI-assisted authoring slice in `frontend/`.
The active app entry point `frontend/src/App.tsx` still renders
`frontend/src/features/builder/BuilderShell.tsx`, which remains the single
owner of the applied `DashboardSpec` draft and now layers a bounded
prompt-to-spec flow under `frontend/src/features/ai/`. `AiPromptBar.tsx`
exposes generate-new and improve-current modes, `buildGenerationPrompt.ts` and
`promptTemplates.ts` ground requests in the existing scenario, template, theme,
and spec canon, `aiGenerationClient.ts` keeps Claude-compatible transport and
env-based configuration behind a local seam, and
`generateDashboardSpec.ts` handles response extraction, schema validation,
presenter-safe sync/clamping, one bounded repair pass, and typed request-time
failures before a candidate can be staged. The main trust boundaries remain
imported/current spec input, provider response text, and applying a staged
candidate back into the same preview, presenter, export, and proposal-artifact
runtime rather than a private AI-only path.

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
| None | — | — | — | No blocking, high, or medium Sprint 8 defects remained after the verify and repair passes, and the fresh closeout rerun matched that result. The only residual limitation is the already-known sandbox restriction that prevents one real browser smoke of the AI-assisted builder workflow. | Treat Sprint 8 as formally closed, keep one host-environment browser smoke on the queue, and begin Sprint 9 planning from this repaired AI-assisted authoring baseline instead of reopening Sprint 8 scope. |

## Remediation Roadmap

### Fix Now (Blockers)

- None.

### Fix Soon (High ROI)

- Run one local browser smoke outside this sandbox so AI prompt entry, staged
  candidate review/apply/discard, presenter stepping, and proposal export are
  exercised in a real port-binding environment.
- Write the Sprint 9 contract and plan for production binding on top of the
  closed Sprint 8 baseline instead of extending Sprint 8 further.

### Fix Later (Refactors)

- Revisit backend brokering or richer AI orchestration only if a later sprint
  explicitly widens beyond the current frontend-first prompt-to-spec seam.
- Revisit direct browser SQLite only when a later sprint truly needs
  in-browser SQL behavior instead of the current SQLite-derived snapshot
  bridge.

## Patch Suggestions

No Sprint 8 corrective patch is required from this review pass. The useful
next changes are one host-environment browser smoke plus Sprint 9
contract/plan work, not more repair edits to the closed AI-assisted authoring
implementation.

## Test Additions Recommended

- [ ] Add a browser-capable smoke run outside this sandbox so the Sprint 8 AI
      prompt, candidate staging, apply/discard, presenter, and export flow is
      exercised end to end.
- [ ] Keep a repeated-suite reliability check in the governed verification path
      if presenter/widget teardown flakiness resurfaces in later sprints.

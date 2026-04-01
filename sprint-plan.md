# DashForge Sprint Plan

> **Tactical execution plan** for the current sprint window.
>
> This file should stay concrete. If the strategy changes, update `project-plan.md`. If product direction changes, update `product-definition.md` or `architecture.md`.

---

## Active Sprint

| Field | Value |
|------|-------|
| **Sprint** | Sprint 9 — Production binding |
| **Status** | COMPLETE — governed verify, repair, review, and handoff are now closed in-repo |
| **Start Date** | 2026-04-01 |
| **Execution Model** | Agent-Orch governed program complete; future reruns should use the canonical durable workflow |
| **Workflow** | `playbooks/project_sprint_program.yaml` |
| **Goal** | Lock a bounded production-binding slice on top of the closed Sprint 8 AI-assisted authoring baseline without widening the product into backend credential brokering, live SaaS platform work, or unrelated repo cleanup. |

## Sprint Outcome

Sprint 9 is now formally closed in the repo.

- `docs/sprint-09-contract.md` and `plans/sprint-09-plan.md` locked the slice
  against the closed Sprint 8 baseline.
- The implementation landed one shared adapter-resolution seam for `mock`,
  `live`, and `hybrid` specs, plus a bounded read-only REST adapter and hybrid
  composition under `frontend/src/core/data/`.
- The builder property rail now exposes dataset-aware binding controls, mode
  switching, and per-dataset REST metadata editing without forking the shared
  preview/presenter/export runtime.
- JSON import/export now accepts valid live and hybrid specs, and durable spec
  serialization strips `connection.headers` so product artifacts do not persist
  secrets.
- Governed verification found one field-map readiness gap (`V901`), the repair
  closed it, and the formal review artifact now records a clean post-repair
  closeout state in `code-reviews/review-sprint-09.md`.

## Governed Closeout Trail

Sprint 9's full governed artifact set now exists under:

- `docs/sprint-09-contract.md`
- `plans/sprint-09-plan.md`
- `code-reviews/verify-sprint-09.md`
- `code-reviews/repair-sprint-09.md`
- `code-reviews/review-sprint-09.md`

The governed sprint ladder is now closed through Sprint 9. The stable
human-facing run dashboard remains:

`artifacts/current/dashboard.html`

Recovery-specific restart workflows used during delivery are now archived under
`playbooks/backups/`. Future recovery should prefer Agent-Orch `resume-run`
against the canonical workflow rather than creating new restart playbooks.

## Governed Exit Criteria

- [x] `docs/sprint-09-contract.md` exists
- [x] `plans/sprint-09-plan.md` exists
- [x] Sprint 9 scope stayed locked against the closed Sprint 8 AI-assisted
      authoring baseline
- [x] The governed workflow advanced beyond Sprint 8 closeout into Sprint 9 work
- [x] Sprint 9 implementation started only after the contract and plan existed
- [x] Central adapter resolution, REST binding, and builder binding UI are in-repo
- [x] `python3 -m pytest -q`, `npm --prefix frontend test`, and `npm --prefix frontend run build` passed on 2026-04-01
- [x] Governed Sprint 9 verify/repair/review artifacts exist

## Remaining Host-Only Follow-Up

- [ ] Run one host-environment browser smoke of the Sprint 9 binding workflow

This item remains outside governed closeout because localhost binding is denied
in this sandbox. `npm --prefix frontend run dev -- --host 127.0.0.1` still
fails here with `listen EPERM`.

## Baseline After Closeout

Sprint 8 remains the closed AI-assisted authoring baseline underneath Sprint
9, and Sprint 9 now extends that baseline with:

- `createDashboardDataAdapter.ts` as the single adapter factory for `mock`,
  `live`, and `hybrid`
- `RestDataAdapter.ts` for the bounded first live REST path
- `HybridDataAdapter.ts` for mixed mock/live dashboards on one adapter
- `BindingPanel.tsx` and `BuilderShell.tsx` updates for dataset-oriented
  binding authoring in the existing builder chrome
- widened live/hybrid import/export plus safe header stripping in serialized
  artifacts

Fresh Sprint 9 closeout verification on 2026-04-01 stayed green in the
sandbox:

- `python3 -m pytest -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`

The only unchanged manual gap is local browser startup. `npm --prefix frontend
run dev -- --host 127.0.0.1` still fails here with `listen EPERM` because this
sandbox denies localhost port binding.

## Current Follow-up

- [ ] Run one local browser smoke in a host environment that permits
      `127.0.0.1:5173` or preview binding
- [ ] Decide the next bounded roadmap slice beyond the now-closed governed
      Sprint 1-9 ladder

## Sprint Carry-Forward Decisions

1. Sprint 8's AI-assisted authoring slice remains the stable pre-binding
   baseline and should not be reopened casually.
2. Sprint 9's shared runtime path remains `DashboardRenderer`; production
   binding now extends the same `DashboardSpec` and `DataAdapter` seams rather
   than creating a second renderer or spec format.
3. Browser-local smoke remains a host-environment validation task because
   sandbox port binding is still denied.
4. Any work after Sprint 9 should start as a new bounded roadmap slice rather
   than widening the closed production-binding sprint in place.

## Risks Carrying Forward

| Risk | Response |
|------|----------|
| Browser-local binding workflow smoke is still blocked in this sandbox | Run dev/preview on a host environment before calling the live-binding workflow fully smoke-tested |
| Frontend-first live binding can be misused if treated like durable secret storage | Keep API configuration explicit, optional, and out of DashboardSpec/exported artifacts; prefer host-local env vars or local overrides only for bounded dev use |
| Frontend runtime still uses SQLite-derived snapshots instead of direct browser SQLite | Revisit only when a later slice truly needs in-browser SQL behavior |
| Broader live-source work could sprawl beyond the bounded REST path | Start any warehouse adapter or backend brokering work under a new explicit contract |

## Definition Of Success For This Window

This sprint window is successful because Sprint 9 is now both landed and
formally closed: the builder can author live/hybrid dataset bindings, one
shared adapter path resolves `mock`, `live`, and `hybrid` specs through the
existing renderer/presenter/export seams, serialization omits durable secrets,
the automated checks stay green, and the governed verify/repair/review trail
is complete.

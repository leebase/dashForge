# WHERE_AM_I — dashForge

> **Product-level orientation.** Where does this project stand against its goals?
>
> This file tracks progress toward the product vision. For session-level context, see `context.md`.

---

## Project Health

| Attribute | Value |
|-----------|-------|
| **Project** | dashForge |
| **Profile** | Dashboard accelerator |
| **Current Phase** | Phase 4 — Advanced / Future |
| **Overall Status** | 🟢 Sprint 9 production binding is now formally closed in-repo, and the governed Sprint 1-9 program is complete |
| **Last Updated** | 2026-04-01 |

---

## Progress Against Product Goals

> Reference: `product-definition.md` for full success criteria.

### MVP Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Industry mock data engine | ✅ Sprint 4 closed | All three MVP industry packs now exist in-repo with deterministic healthcare, financial, and saas generation paths plus shared template metadata |
| Dashboard spec + primitive runtime | ✅ Sprint 6 closed | Shared validation, theming, persistence, responsive runtime, the full primitive set, and the first manual builder workflow now exist behind the same adapter seam as a formally closed baseline |
| Presenter mode | ✅ Sprint 7 closed | Narrative authoring, presenter stepping, widget emphasis, bounded annotations, and browser-local export flows are now closed in-repo |
| Workshop-ready authoring flow | ✅ Sprint 8 closed | AI-assisted prompt-to-spec generation, staged candidate review/apply/discard, and the shared preview/presenter/export path are formally closed |
| Planning and canon docs | ✅ Done | Product, architecture, planning, and handoff docs now agree on the closed Sprint 1-9 governed baseline |

### Current Phase Goals

| Goal | Status | Notes |
|------|--------|-------|
| Establish implementation-ready planning docs | ✅ Done | Planning/state docs match canon |
| Deliver the workshop-ready MVP baseline | ✅ Done | The closed Sprint 8 baseline satisfies the bounded workshop-ready authoring target in-repo |
| Deliver the first bounded production-binding path | ✅ Done | Sprint 9 closed with shared adapter resolution, REST live binding, hybrid composition, builder-integrated binding controls, and safe spec serialization |
| Close the governed Agent-Orch sprint ladder | ✅ Done | The governed Sprint 1-9 program is now closed through `code-reviews/review-sprint-09.md` |
| Run one host-environment browser smoke of the live-binding workflow | 🟡 Planned | Still blocked in this sandbox by localhost `listen EPERM`; remains a manual host-only follow-up |

---

## Sprint Position

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 — Foundation | Frontend foundation, spec runtime, first slice | ✅ Complete |
| Sprint 2 — Spec/runtime completion | Frontend implementation and closeout complete | ✅ Complete |
| Sprint 3 — Mock engine + healthcare | SQLite generator + healthcare closeout complete | ✅ Complete |
| Sprint 4 — Financial + SaaS + templates | Financial, SaaS, templates, verify, repair, and review/handoff complete | ✅ Complete |
| Sprint 5 — Primitive/runtime breadth | Full primitive/runtime breadth, verify, repair, and review/handoff complete | ✅ Complete |
| Sprint 6 — Builder mode | Builder shell, editable composition, template starters, JSON I/O, verify, repair, and review/handoff complete | ✅ Complete |
| Sprint 7 — Presenter + export | Implementation, verify, repair, and review/handoff complete | ✅ Complete |
| Sprint 8 — AI generation | Implementation, verify, repair, and review/handoff complete | ✅ Complete |
| Sprint 9 — Production binding | Implementation, verify, repair, and review/handoff complete | ✅ Complete |

---

## Product Risks & Blockers

| Risk/Blocker | Impact | Status |
|-------------|--------|--------|
| One real host-environment live-binding builder/presenter/export smoke is still missing | The Sprint 9 UI is implemented and reviewed in-repo, but sandbox port denial still prevents a true browser run here | 🟡 Planned |
| SQLite is still snapshot-backed in the frontend runtime | The generator path is real, but later work must decide when to add direct browser SQLite | 🟡 Planned |
| Repo still reflects bootstrap Python scaffold | Temporary dual structure could confuse future contributors until a cleanup slice lands | 🟡 Planned |
| Broader live-binding work beyond REST could sprawl without a new contract | Sprint 9 is intentionally bounded; later adapters or brokering work should start under a new roadmap slice | 🟡 Planned |

---

## Key Decisions Made

Decisions that affect product direction:

| Decision | Rationale | Date |
|----------|-----------|------|
| `product-definition.md` is the product canon | Prevents product drift during early implementation | 2026-03-31 |
| `architecture.md` is the technical canon | Establishes the React/Vite/TypeScript + DashboardSpec target | 2026-03-31 |
| Workshop-ready MVP is the first success bar | Keeps the scope focused on consulting value rather than platform breadth | 2026-03-31 |
| Transitional implementation lives in `frontend/` | Lets Sprint 1 prove the architecture without destructive repo churn | 2026-03-31 |
| Scenario-backed mock references are enough to close Sprint 1 | Proves the adapter seam without forcing SQLite into the foundation slice | 2026-03-31 |
| Sprint 2 proves the SQLite seam without adding the runtime dependency yet | Keeps the seam explicit while staying within current guardrails | 2026-03-31 |
| `react-grid-layout` is deferred until builder-mode composition exists | Prevents layout-engine complexity from bloating the foundation sprint | 2026-03-31 |
| Python scaffold cleanup happens after foundation, not during it | Keeps repo hygiene work from blocking runtime proof | 2026-03-31 |
| The remaining app would be delivered through one governed Agent-Orch sprint ladder | Matched the intended long-running orchestration model with sprint closeout before advancement | 2026-03-31 |
| Sprint 3 uses SQLite-derived snapshots for the current frontend runtime while keeping SQLite as the canonical generated artifact | Delivers a real data path without adding a direct browser SQLite engine in the same slice | 2026-03-31 |
| `code-reviews/review-sprint-03.md` is the formal Sprint 3 closeout review artifact | Completes the governed handoff requirement before Sprint 4 begins | 2026-03-31 |
| `code-reviews/review-sprint-04.md` is the formal Sprint 4 closeout review artifact | Completes the governed handoff requirement before Sprint 5 begins | 2026-04-01 |
| Sprint 5 uses explicit per-primitive chart compiler branches rather than a generic chart DSL | Keeps the broadened runtime slice readable and easier to verify | 2026-04-01 |
| `code-reviews/review-sprint-05.md` is the formal Sprint 5 closeout review artifact | Completes the governed handoff requirement before Sprint 6 begins | 2026-04-01 |
| Sprint 6 adopts `react-grid-layout` while keeping widget `position` as the canonical stored layout | Delivers builder composition without widening the spec surface prematurely | 2026-04-01 |
| `code-reviews/review-sprint-06.md` is the formal Sprint 6 closeout review artifact | Completes the governed handoff requirement before Sprint 7 begins | 2026-04-01 |
| `code-reviews/review-sprint-07.md` is the formal Sprint 7 closeout review artifact | Completes the governed handoff requirement before Sprint 8 begins | 2026-04-01 |
| `code-reviews/review-sprint-08.md` is the formal Sprint 8 closeout review artifact | Completes the governed handoff requirement before Sprint 9 begins | 2026-04-01 |
| Sprint 9 resolves `mock`, `live`, and `hybrid` specs through one adapter factory plus explicit hybrid composition | Keeps production binding on the same renderer/presenter/export seams instead of fragmenting the runtime | 2026-04-01 |
| Serialized DashboardSpec artifacts omit live header overrides | Preserves safe product artifacts without discarding the rest of the live-binding metadata | 2026-04-01 |
| `code-reviews/review-sprint-09.md` is the formal Sprint 9 closeout review artifact | Completes the governed handoff requirement for the Sprint 1-9 delivery program | 2026-04-01 |
| The durable DashForge playbooks now use Agent-Orch `operational_paths` for `artifacts/current/`, and restart playbooks are archived under `playbooks/backups/` | Keeps future governed runs aligned with the actual Agent-Orch feature set instead of the temporary recovery scaffolding used during delivery | 2026-04-01 |

---

## What "Done" Looks Like

- [x] An Anblicks consultant can build a believable prototype during a workshop in under an hour
- [x] The prototype is captured as DashboardSpec and reusable by delivery engineering
- [x] Mock data feels industry-realistic enough to support client-facing storytelling
- [ ] DashForge is used successfully in at least 3 real client workshops
- [ ] At least 2 consultants beyond Lee confirm the workflow is valuable

---

*Update this file when project milestones are reached or product direction changes. This is your compass; `context.md` is your GPS.*

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
| **Current Phase** | Phase 1 — Core Foundation |
| **Overall Status** | 🟡 Canon defined, implementation still bootstrap-only |
| **Last Updated** | 2026-03-31 |

---

## Progress Against Product Goals

> Reference: `product-definition.md` for full success criteria.

### MVP Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Industry mock data engine | ⬜ Not started | Canon defined, no implementation yet |
| Dashboard spec + primitive runtime | ⬜ Not started | Sprint 1 will establish the first slice |
| Presenter mode | ⬜ Not started | Deferred until foundation and runtime exist |
| Planning and canon docs | ✅ Done | Product and architecture are now aligned with project memory |

### Current Phase Goals

| Goal | Status | Notes |
|------|--------|-------|
| Establish implementation-ready planning docs | ✅ Done | Planning/state docs now match canon |
| Decide repo layout for frontend foundation | ⬜ Not started | Main immediate decision |
| Deliver first working frontend slice | ⬜ Not started | Target of Sprint 1 |

---

## Sprint Position

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 — Foundation | Frontend foundation, spec runtime, first slice | 🟡 Active |

---

## Product Risks & Blockers

| Risk/Blocker | Impact | Status |
|-------------|--------|--------|
| Repo still reflects bootstrap Python scaffold | Current implementation shape conflicts with canon architecture | 🟡 Action needed |
| No frontend foundation exists yet | Blocks all meaningful MVP implementation | 🟡 Action needed |
| Mock data realism remains unproven | High product risk once implementation starts | 🟡 Watch |

---

## Key Decisions Made

Decisions that affect product direction:

| Decision | Rationale | Date |
|----------|-----------|------|
| `product-definition.md` is the product canon | Prevents product drift during early implementation | 2026-03-31 |
| `architecture.md` is the technical canon | Establishes the React/Vite/TypeScript + DashboardSpec target | 2026-03-31 |
| Workshop-ready MVP is the success bar | Keeps the scope focused on consulting value rather than platform breadth | 2026-03-31 |

---

## What "Done" Looks Like

- [ ] An Anblicks consultant can build a believable prototype during a workshop in under an hour
- [ ] The prototype is captured as DashboardSpec and reusable by delivery engineering
- [ ] Mock data feels industry-realistic enough to support client-facing storytelling
- [ ] DashForge is used successfully in at least 3 real client workshops
- [ ] At least 2 consultants beyond Lee confirm the workflow is valuable

---

*Update this file when project milestones are reached or product direction changes. This is your compass; `context.md` is your GPS.*

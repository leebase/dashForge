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
| **Current Phase** | Phase 4 — Advanced / first employee handoff |
| **Overall Status** | 🟢 Idle Warehouse Waste slice complete and passed governed review; 7-dataset snapshot packaging, provenance tracking, recommendation queue governance, and standalone presentation verified across 109 passing tests; broader commercial expansion remains buyer-gated |
| **Last Updated** | 2026-09-02 |

---

## Progress Against Product Goals

> Reference: `product-definition.md` for full success criteria.

### MVP Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Scenario definition package | ✅ Done | The ED throughput scenario now has contract, data design, dashboard blueprint, build checklist, binding map, and governed review/handoff docs |
| Generated mock data package | ✅ Done | Canonical SQLite and JSON preview artifacts exist for the ED throughput scenario and stay aligned to the runtime contract |
| Standalone dashboard deliverable | ✅ Done | `frontend/src/App.tsx` now opens directly into the ED throughput command-view dashboard instead of builder-first chrome |
| Shared DashboardSpec runtime | ✅ Done | The standalone path, builder, presenter, export, and live-binding surfaces all stay on the same `DashboardSpec` plus `DataAdapter` seams |
| Planning and canon docs | ✅ Done | Product, architecture, planning, and handoff docs now agree on the narrower standalone MVP definition |
| Trusted employee handoff | ✅ Done | DashForge validates a platform-received `synthetic-data-work-package/1.0` and emits a digest-pinned `meeting-dashboard-package/1.0` with binding and claim evidence |
| Package DataForge Snapshot | ✅ Done | Deterministic SQLite & JSON snapshot packaging CLI with fail-closed overwrite protection, multi-pack support, and DataAdapter schema alignment |
| Snowflake Cost Pack | ✅ Done | Dynamic scenario discovery and snapshot packaging for snowflakeCost with provenance metadata and recommendation queue preservation |
| Idle Warehouse Waste Slice | ✅ Done | Deterministic 7-dataset packaging, provenance metadata, recommendation queue governance, and standalone executive presentation for snowflakeCost |

### Current Phase Goals

| Goal | Status | Notes |
|------|--------|-------|
| Establish implementation-ready planning docs | ✅ Done | Planning/state docs match canon |
| Define the canonical standalone MVP scope | ✅ Done | Product and architecture docs now state that the MVP is scenario definition, data generation, and a standalone dashboard deliverable |
| Deliver the canonical scenario package and generated data | ✅ Done | ED throughput now has the full bounded package and materialized mock-data artifacts in-repo |
| Deliver the standalone default dashboard surface | ✅ Done | The app opens directly into the packaged ED throughput scenario via the shared runtime contracts |
| Preserve advanced builder/presenter/AI/live-binding work as secondary surfaces | ✅ Done | Those capabilities remain available in-repo without redefining the MVP success bar |
| Break mock-data creation into its own workspace project | ✅ Done | `dataForge` now owns generator code, pack assets, and tests; dashForge keeps compatibility wrappers only |
| Run one host-environment browser smoke of the standalone/live-binding workflow | 🟡 Planned | Still blocked in this sandbox by localhost `listen EPERM`; remains a manual host-only follow-up |
| Choose the next bounded scenario-building slice | 🟡 Planned | The next slice should package the ED throughput pattern into reusable skills/workflows rather than widen the MVP informally |
| Prove the Snowflake Cost Optimization consulting path | ✅ Done | `idle-warehouse-waste` now runs through the existing standalone runtime to recommendations and follow-up export; run `ee6fac7897f9` passed the Medium+ review gate |
| Obtain a real Snowflake buyer signal before more product work | 🟡 Gated | A send, reply, booked call/demo, proposal, approved client data, revenue event, or explicit Lee decision must clear the gate |

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
| Sprint 10 — Client Meeting Dashboard Builder | Trusted DataForge receipt, dashboard validation, claim ledger, and meeting package | ✅ Complete |
| Package DataForge Snapshot | Deterministic SQLite & JSON snapshot packaging CLI with fail-closed protection, multi-pack support, and DataAdapter schema alignment | ✅ Complete |
| Snowflake Cost Pack | Dynamic discovery, generation, and snapshot packaging for snowflakeCost with recommendation queue and provenance metadata | ✅ Complete |
| Idle Warehouse Waste Slice | Deterministic 7-dataset packaging, provenance metadata, recommendation queue governance, and standalone presentation for snowflakeCost | ✅ Complete |

---

## Product Risks & Blockers

| Risk/Blocker | Impact | Status |
|-------------|--------|--------|
| One real host-environment standalone/live-binding smoke is still missing | The default MVP surface and Sprint 9 UI are implemented and reviewed in-repo, but sandbox port denial still prevents a true browser run here | 🟡 Planned |
| SQLite is still snapshot-backed in the frontend runtime | The generator path is real, but later work must decide when to add direct browser SQLite | 🟡 Planned |
| Legacy Python compatibility wrappers remain in dashForge after the dataForge split | Generator ownership is clearer now, but future cleanup should decide how long the compatibility path stays in-repo | 🟡 Planned |
| Broader live-binding work beyond REST could sprawl without a new contract | Sprint 9 is intentionally bounded; later adapters or brokering work should start under a new roadmap slice | 🟡 Planned |
| The broader in-repo feature set could still obscure the narrower MVP if future docs drift | Builder, presenter, AI, and live-binding features exist, but they are no longer the MVP definition | 🟡 Planned |
| Synthetic evidence could be mistaken for client proof | The Snowflake demo is governed and deterministic, but it must remain labeled as synthetic until client-approved data and outcomes exist | 🟡 Gated |

---

## Key Decisions Made

Decisions that affect product direction:

| Decision | Rationale | Date |
|----------|-----------|------|
| `product-definition.md` is the product canon | Prevents product drift during early implementation | 2026-03-31 |
| `architecture.md` is the technical canon | Establishes the React/Vite/TypeScript + DashboardSpec target | 2026-03-31 |
| Scenario definition, data generation, and a standalone dashboard deliverable are the first success bar | Keeps the scope focused on the first believable consulting proof instead of platform breadth | 2026-03-31 |
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
| The canonical MVP is scenario definition, data generation, and a standalone dashboard deliverable | Keeps the repo's first proof of value explicit despite the broader operator surfaces already present in-repo | 2026-04-02 |
| Mock-data creation now lives in sibling project `dataForge`, with dashForge retaining compatibility wrappers for historical generator entrypoints | Clarifies repo ownership while preserving the existing CLI/test surface during transition | 2026-04-03 |
| Snowflake Cost Optimization is the sole commercial proof path until buyer evidence supports expansion | Concentrates near-term consulting revenue effort and prevents a platform rewrite or duplicate UI/runtime | 2026-07-16 |
| Client Meeting Dashboard Builder is the first DashForge product employee | Consumes a trusted DataForge work package and reuses DashboardSpec/DataAdapter/runtime seams; platform owns receipt and approval | 2026-08-09 |
| Package DataForge Snapshot CLI enforces fail-closed overwrite protection and extracts SQLiteSnapshot JSON via SQLite PRAGMA table_info | Prevents accidental data loss during workshop rehearsal and guarantees schema alignment with DataAdapter runtime without external dependencies | 2026-09-02 |
| `snowflake-cost-pack` CLI dynamically discovers dataForge scenarios and preserves recommendation queue | Extends DashForge CLI with snowflakeCost pack support, provenance metadata, and fail-closed overwrite guards without hardcoding scenarios or external runtime dependencies | 2026-09-02 |
| `idle-warehouse-waste` slice formalizes 7-dataset snapshot schema and recommendation queue governance | Delivers deterministic offline presentation, provenance tracing, and safety guardrails for Snowflake idle warehouse waste consulting demonstrations | 2026-09-02 |

---

## What "Done" Looks Like

- [x] An Anblicks consultant can open a believable standalone scenario dashboard during a workshop without first entering builder chrome
- [x] The packaged scenario is captured as reusable docs, generated data artifacts, and a `DashboardSpec` runtime contract
- [x] Mock data feels industry-realistic enough to support client-facing storytelling
- [ ] DashForge is used successfully in at least 3 real client workshops
- [ ] At least 2 consultants beyond Lee confirm the workflow is valuable
- [x] A trusted DataForge package can be consumed without copying source fixtures, and the dashboard package cites its exact digest

---

*Update this file when project milestones are reached or product direction changes. This is your compass; `context.md` is your GPS.*

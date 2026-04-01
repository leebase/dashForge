# dashForge Project Plan

> **Strategic roadmap** — stable, long-term planning document
>
> For tactical execution, see `sprint-plan.md`

---

## Project Overview

**DashForge** is an internal Anblicks accelerator that helps consultants create
realistic, industry-specific dashboard prototypes during client workshops and
convert those prototypes into production-ready React assets anchored by a
reusable DashboardSpec.

The philosophy is **Incremental Delivery**:

> Build the smallest useful primitives first. Validate before scaling.

## Objectives

### Primary Objective

Enable an Anblicks consultant to walk into a client workshop and produce a
credible, data-populated dashboard prototype in under an hour, with the
prototype structured so delivery teams can reuse it instead of rebuilding from
scratch.

### Secondary Objectives

- Build reusable industry packs that accumulate consulting leverage across engagements
- Establish DashboardSpec as the canonical artifact for prototype, presentation, and production handoff
- Prove a workshop-to-delivery workflow that reduces rework, shortens alignment cycles, and avoids client vendor lock-in

## Non-Negotiable Constraints

- `product-definition.md` and `architecture.md` are canon until explicitly superseded
- The production target is owned React + ECharts code, not a BI vendor runtime
- Components consume data only through adapter contracts; UI cannot depend directly on mock-data internals
- AI may generate structured artifacts such as specs and pack definitions, but not raw React component code as product output
- Scope stays workshop-first; broader SaaS, collaboration, and warehouse-grade live binding remain later-slice work even though one bounded REST production-binding path is now landed

## Development Phases

### Phase 0 — Research / Bootstrap

**Status**: COMPLETE

**Goals**:

- Define the product thesis and MVP boundary
- Lock the technical architecture and implementation principles

**Deliverables**:

- `product-definition.md`
- `architecture.md`
- aligned project memory and planning docs

---

### Phase 1 — Core Foundation

**Status**: COMPLETE

**Goal**: Establish the minimum real application foundation that proves the
spec-first architecture and gives the team a credible base to build on.

**Core components**:

1. React 19 + Vite + TypeScript application shell
2. Canonical DashboardSpec types and validation
3. Dashboard runtime shell with theme tokens
4. First primitive slice: `DashboardBox` plus one data-driven widget

**Success Criteria**:

- A static DashboardSpec can render in the app without hard-coded layout logic
- The codebase has a clear home for spec, runtime, widgets, and adapters
- Baseline tests and build checks exist for the foundational slice
- Scenario-backed sample data resolves through the adapter seam instead of inline-only payloads

---

### Phase 2 — Feature Expansion

**Status**: COMPLETE

**Goal**: Deliver the mock-data and primitive capabilities that make a workshop
prototype feel real.

Sprint 2 completed the spec/runtime baseline that this phase depends on:
shared validation, concrete themes, persistence seams, and the browser-side
SQLite adapter boundary now exist in `frontend/`. Sprint 3 shifted this phase
forward with deterministic healthcare scenario generation and a repo-level
SQLite-backed mock engine. Sprint 4 closed the three-pack MVP mock-data surface
with financial and saas packs plus shared template-catalog metadata. Sprint 5
closed the remaining Phase 2 runtime-breadth work with the full MVP primitive
set, shared chart/theme compilers, and a responsive read-only dashboard
runtime.

**Components**:

- Sprint 2 runtime baseline and persistence/theme/data seams
- industry pack definitions and seeded scenario generation
- SQLite-backed mock data storage with adapter access
- expanded primitive set toward the MVP target
- dashboard templates for early workshop scenarios

**Success Criteria**:

- Sprint 3+ can build on the Sprint 2 runtime seams without reopening core contracts
- At least one industry pack feels believable to a domain-aware reviewer
- Multiple primitives render from spec-driven data bindings
- Templates exist for executive summary and at least one detailed scenario

---

### Phase 3 — Integration & Polish

**Status**: COMPLETE

**Goal**: Turn the foundation into a workshop-ready experience.

Sprint 6 closed the bounded manual builder workflow with editable composition
and spec JSON save/load. Sprint 7 then closed presenter mode and browser-local
export flows on top of that builder baseline. Sprint 8 closed the bounded
AI-assisted DashboardSpec generation slice on top of the same shared runtime.
Those three sprints together form the repo's closed workshop-ready MVP
baseline.

**Success Criteria**:

- Builder flow supports composition and save/load of DashboardSpec JSON
- Presenter mode supports guided walkthroughs and widget emphasis
- Export to JSON and static proposal artifacts is available
- The MVP is usable in an internal dry run end to end

---

### Phase 4 — Advanced / Future

**Status**: STARTED

**Goal**: Extend the workshop baseline into a bounded production-binding bridge
without turning DashForge into a general backend platform.

Sprint 9 delivered the first Phase 4 slice: one shared adapter-resolution path
for `mock`, `live`, and `hybrid` dashboards; a bounded read-only REST live
adapter; hybrid composition; builder-integrated dataset binding controls; and
safe serialization that strips live header overrides from durable artifacts.
The governed Sprint 1-9 ladder is now closed in-repo, and the remaining
near-term follow-up is one host-environment browser smoke plus choosing the
next bounded roadmap slice explicitly.

**Potential next components**:

- live data bindings for Snowflake, Databricks, and additional APIs
- backend brokering, workshop-note ingestion, or richer AI orchestration on
  top of the closed Sprint 8 prompt-to-spec baseline
- multi-user collaboration and review workflows
- external productization if consulting value is proven

*Not required for the now-closed Sprint 1-9 program.*

## Architecture Principles

1. **The Spec Is the Product** — prototypes, templates, and handoffs revolve around DashboardSpec
2. **Value-Ordered Delivery** — build in the sequence that creates consulting leverage fastest
3. **Adapter Isolation** — widgets and runtime never depend on concrete data sources
4. **Workshop First** — optimize for a consultant on a laptop in front of a client
5. **Artifacts Over Chat** — planning, decisions, and outcomes must live in repo documents

## Core Components

### Product Runtime

- DashboardSpec schema and validators
- layout engine and widget registry
- theme system and presenter runtime
- DataAdapter contracts for mock and live sources

### Content and Data

- industry packs and scenario templates
- mock data generation pipeline
- template dashboards by industry and use case

### Project Memory

- `product-definition.md` — product canon
- `architecture.md` — technical canon
- `project-plan.md` — strategic roadmap
- `sprint-plan.md` — tactical execution plan
- `context.md` and `WHERE_AM_I.md` — active state and orientation
- `result-review.md` — completed work log

## Risks

| Risk | Mitigation |
|------|------------|
| Scope creep into a full BI platform | Hold to the workshop-first and bounded-slice constraints in `product-definition.md` and sprint contracts |
| Repository drift from canon docs | Keep planning and state docs updated whenever architecture or product direction changes |
| Mock data looks synthetic instead of believable | Validate scenarios with domain-aware reviewers before calling a pack workshop-ready |
| Current repo scaffold still mixes transition-era Python with the React runtime | Keep the Python generator CLI bounded, and retire or isolate the remaining bootstrap-era residue in a later cleanup slice |
| Later live-binding work sprawls past the bounded REST path without enough governance | Start warehouse adapters, backend brokering, or credential helpers only under a new explicit contract |

## Success Metrics

- Used in at least 3 real client workshops within 3 months of MVP readiness
- At least 1 workshop produces a prototype approved without major revision
- Time from workshop to approved dashboard design reduced by 60%+
- At least 2 consultants beyond Lee give positive feedback on usability and value

## Current Status

**Phase**: Phase 4 — Advanced / Future
**Mode**: Collaborative execution (`Mode 2`)
**Next Milestone**: Run one host-environment smoke of the closed Sprint 9 live-binding workflow and choose the next bounded roadmap slice beyond the governed Sprint 1-9 ladder

## Guiding Philosophy

> Own the spec, render from primitives, and ship value in the order consultants feel it.

Keep implementations minimal. Validate before scaling.

---

*End of Project Plan*

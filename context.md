# dashForge Session Context

> **Purpose**: Working memory for session continuity. If power drops, a new AI takes over, or we return after a break, read this first.

---

## Snapshot

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 1 — Core Foundation |
| **Mode** | 2 (Implementation with approval) |
| **Last Updated** | 2026-03-31 |

### Sprint Status

| Sprint | Status | Completion |
|--------|--------|------------|
| Sprint 1 — Foundation | 🟡 Active | 10% |

---

## What's Happening Now

### Current Work Stream

Project memory and planning docs have been aligned to the canon product and architecture so implementation can start from a reliable foundation.

### Recently Completed

- ✅ Project scaffolded with init-agent
- ✅ `AGENTS.md` established agent guardrails
- ✅ `product-definition.md` established as product canon
- ✅ `architecture.md` established as technical canon
- ✅ Planning and session docs refreshed to match canon
- ✅ `sprint-plan.md` created

### In Progress

- ⏳ Sprint 1 foundation planning is complete
- ⏳ Frontend implementation has not started yet

---

## Decisions Locked

| Decision | Rationale | Date |
|----------|-----------|------|
| Incremental delivery methodology | Build from scratch with small primitives; validate before scale | 2026-03-31 |
| `product-definition.md` and `architecture.md` are canon | Prevent scaffold-era docs from driving implementation choices | 2026-03-31 |
| DashForge targets React/Vite/TypeScript with DashboardSpec at the center | Matches the current architecture and MVP definition | 2026-03-31 |
| The existing Python scaffold is bootstrap residue, not the intended product shape | Keeps repo history honest while the foundation is re-platformed | 2026-03-31 |

---

## Document Inventory

### Planning (Stable)

| File | Purpose | Status |
|------|---------|--------|
| `product-definition.md` | Product vision, constraints, MVP | ✅ Canon |
| `architecture.md` | Technical architecture, stack, design rules | ✅ Canon |
| `project-plan.md` | Strategic roadmap, phases, success metrics | ✅ Aligned |
| `sprint-plan.md` | Tactical execution | ✅ Active |
| `AGENTS.md` | AI agent guide, conventions, operational modes | ✅ Active |

### Session Memory (Dynamic)

| File | Purpose | Status |
|------|---------|--------|
| `context.md` | Working state, current focus, next actions | 🔄 Active |
| `WHERE_AM_I.md` | Product-level orientation and progress | 🔄 Active |
| `result-review.md` | Running log of completed work | 🔄 Active |

### Backlog System

| File | Purpose | Status |
|------|---------|--------|
| `backlog/schema.md` | Unified backlog item schema | ✅ Created |
| `backlog/template.md` | Copy-paste template for new backlog items | ✅ Created |

---

## Open Questions

1. Should the React app replace the root scaffold immediately or be introduced alongside it for one sprint?
2. What is the smallest DashboardSpec subset worth encoding first?
3. Which first vertical slice is best for Sprint 1: static KPI card, static line chart, or both?

---

## Next Actions Queue (ranked)

| Rank | Action | Owner | Done When |
|------|--------|-------|----------|
| 1 | Choose repo layout for the canonical frontend foundation | Human+AI | Directory strategy is explicit |
| 2 | Scaffold React/Vite/TypeScript foundation | AI | App boots locally |
| 3 | Define initial DashboardSpec types and validation | AI | Sample spec validates and renders |
| 4 | Build first static dashboard vertical slice | AI | One widget renders through the runtime shell |

---

## Working Conventions

### Start of session

1. Read `AGENTS.md`
2. Read this file
3. Read `result-review.md`
4. Read `sprint-plan.md`
5. Read `WHERE_AM_I.md`
6. Re-read `product-definition.md` and `architecture.md` when direction or implementation details matter

### End of work unit

1. Move completed items into "Recently Completed"
2. Update "Next Actions Queue"
3. Add any new "Decisions Locked"
4. Keep "Open Questions" to 5 or fewer

---

## Environment Notes

- **Working Directory**: `./dashForge`
- **Project Name**: `dashForge`
- **Canonical Product Shape**: React/Vite/TypeScript dashboard application
- **Current Repo Residue**: Bootstrap Python package still present
- **Author**: Lee Harrington

---

*This file is a living document. Update it frequently.*

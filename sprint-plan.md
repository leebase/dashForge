# DashForge Sprint Plan

> **Tactical execution plan** for the active sprint.
>
> This file should stay concrete. If the strategy changes, update `project-plan.md`. If product direction changes, update `product-definition.md` or `architecture.md`.

---

## Active Sprint

| Field | Value |
|------|-------|
| **Sprint** | Sprint 1 — Foundation |
| **Status** | ACTIVE |
| **Start Date** | 2026-03-31 |
| **Goal** | Move the repo from scaffold-era placeholder state to a real frontend foundation that proves the spec-first architecture. |

## Sprint Intent

By the end of this sprint, DashForge should have a minimal but real implementation path:

- a React/Vite/TypeScript app shell
- canonical DashboardSpec types and validation
- a dashboard runtime shell with theme tokens
- one rendered vertical slice from a static spec

This sprint does not need to solve the full MVP. It needs to make the target architecture executable.

## Exit Criteria

- [x] The repository contains the target frontend scaffold, not just the bootstrap Python CLI
- [x] A static DashboardSpec can render without widget-specific hard-coded layout logic
- [x] `DashboardBox` exists with at least basic title and state handling
- [x] One initial widget primitive renders from spec-driven data
- [x] Baseline tests/build checks exist for the new foundation
- [x] Project memory docs reflect what was actually built

## Completed This Sprint

- [x] Reconciled planning and state docs with `product-definition.md` and `architecture.md`
- [x] Created this sprint plan and established the first implementation target
- [x] Chose a transition-friendly repo layout with the canonical frontend in `frontend/`
- [x] Scaffolded a React/Vite/TypeScript app shell
- [x] Added a validated DashboardSpec subset with Ajv
- [x] Added a static adapter, `DashboardBox`, and a KPI widget rendered from sample spec data
- [x] Added a line-chart primitive with a custom ECharts wrapper
- [x] Verified the slice with unit tests, production build, and preview startup

## Ordered Work Queue

### 1. Repo Foundation

- [x] Decide the repository layout for the canonical frontend implementation
- [x] Scaffold React 19 + Vite + TypeScript in a way that leaves room for spec/runtime separation
- [x] Decide how to contain the existing Python bootstrap artifacts for the transition

### 2. Spec Runtime

- [x] Define the initial DashboardSpec types from the architecture doc
- [x] Add schema validation and a place for versioning/migration concerns
- [x] Create a sample spec fixture that represents the smallest meaningful dashboard

### 3. UI Foundation

- [x] Establish app shell, theme tokens, and base layout structure
- [x] Implement `DashboardBox`
- [x] Render one primitive from the sample spec

### 4. Quality Gate

- [x] Add baseline test/build commands for the new implementation
- [x] Verify the first slice works end to end locally
- [x] Update docs and result review with actual implementation outcomes

## Next Slice Queue

- [x] Add a second widget primitive and expand the schema beyond KPI-only rendering
- [ ] Move from inline sample payloads to richer mock datasets behind the adapter seam
- [ ] Evaluate adoption of `react-grid-layout` now that a spec-driven shell is running
- [ ] Reduce the current frontend bundle size after introducing ECharts

## Decisions To Make During This Sprint

These are the decisions that could materially affect the repo shape:

1. Whether the React app replaces the current root scaffold or lives alongside it during transition
2. Whether spec/runtime code should live in a package-style structure from day one
3. How much of the canonical schema to encode immediately versus staging it behind a smaller initial subset

## Out of Scope

The following are intentionally deferred until after the foundation is real:

- AI-generated specs
- live production data bindings
- multi-user collaboration
- full industry-pack coverage
- full primitive library coverage

## Risks This Sprint

| Risk | Response |
|------|----------|
| Overbuilding before the first vertical slice works | Keep the initial spec and widget set tiny |
| Repo churn from re-platforming | Make the target layout explicit before moving files |
| Confusing bootstrap residue for real product progress | Treat Python scaffold code as non-canonical |

## Definition of Sprint Success

Sprint 1 is successful if the team can point to a running frontend shell and say: "This is clearly DashForge's architecture, not just a scaffold."

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

- [ ] The repository contains the target frontend scaffold, not just the bootstrap Python CLI
- [ ] A static DashboardSpec can render without widget-specific hard-coded layout logic
- [ ] `DashboardBox` exists with at least basic title and state handling
- [ ] One initial widget primitive renders from spec-driven data
- [ ] Baseline tests/build checks exist for the new foundation
- [ ] Project memory docs reflect what was actually built

## Completed This Sprint

- [x] Reconciled planning and state docs with `product-definition.md` and `architecture.md`
- [x] Created this sprint plan and established the first implementation target

## Ordered Work Queue

### 1. Repo Foundation

- [ ] Decide the repository layout for the canonical frontend implementation
- [ ] Scaffold React 19 + Vite + TypeScript in a way that leaves room for spec/runtime separation
- [ ] Decide how to contain or retire the existing Python bootstrap artifacts

### 2. Spec Runtime

- [ ] Define the initial DashboardSpec types from the architecture doc
- [ ] Add schema validation and a place for versioning/migration concerns
- [ ] Create a sample spec fixture that represents the smallest meaningful dashboard

### 3. UI Foundation

- [ ] Establish app shell, theme tokens, and base layout structure
- [ ] Implement `DashboardBox`
- [ ] Render one primitive from the sample spec

### 4. Quality Gate

- [ ] Add baseline test/build commands for the new implementation
- [ ] Verify the first slice works end to end locally
- [ ] Update docs and result review with actual implementation outcomes

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

# DashForge Remaining Project Contract

## Overview

This contract covers the remaining documented DashForge project work after
Sprint 1 foundation. It includes the rest of the MVP path plus the later
documented roadmap phases already described in `architecture.md` and
`project-plan.md`. The goal is to make the remainder of the project explicit,
ordered, and monitorable inside one governed Agent-Orch workflow.

## Remaining Objectives Inventory

- Complete the spec/runtime gaps still described in the architecture, including
  broader schema coverage, theme definitions, spec save/load behavior, and the
  SQLite/browser adapter path.
- Build the mock-data engine and industry packs for Healthcare, Financial
  Services, and SaaS/Technology with scenario coverage and reproducibility.
- Reach the documented primitive library: KPI, line, bar, stacked bar, donut,
  table, sparkline, and gauge.
- Build template-backed dashboard rendering on a responsive grid.
- Build builder mode with palette, property editing, template selection,
  theme/pack/scenario switching, save/load, and undo/redo.
- Build presenter mode with narrative sections, walkthrough behavior, and
  annotations.
- Build export support for spec JSON and PNG/PDF artifacts.
- Build the documented AI spec-generation slice.
- Build the documented mock-to-production data-binding slice.

## In Scope

- All remaining documented roadmap phases after Sprint 1 foundation
- MVP work and post-MVP phases that are already specified in the repo canon
- Dependencies needed to deliver those phases inside the frontend/runtime path
- Review, verification, and durable-memory updates that make the long run
  understandable to humans

## Out of Scope

- Undocumented new product directions
- External SaaS productization work beyond what the docs already mention
- Multi-user collaboration unless it becomes required by an already-documented
  later phase

## Required Outputs

- A single governed playbook that decomposes the remaining project into
  explicit steps with clear dependencies
- Frontend/runtime/code outputs for data packs, primitives, builder,
  presenter, export, AI generation, and production binding
- Review artifacts and durable doc updates reflecting the exact run state
- Agent-Orch monitoring artifacts that humans can inspect while the run is live

## Acceptance Checks

1. The workflow explicitly represents the remaining project phases, not just
   broad umbrella categories.
2. The run dashboard makes it easy to see which concrete slice is active.
3. `npm --prefix frontend test` passes at the repair/verify stage.
4. `npm --prefix frontend run build` passes at the repair/verify stage.
5. Durable docs state what finished, what stalled, and what remains.

## Constraints

- `product-definition.md` and `architecture.md` remain canon.
- The workflow must not invent scope beyond what the existing docs require.
- The implementation should preserve the spec-first and adapter-isolated
  architecture.
- The run must stay monitorable through Agent-Orch’s HTML dashboard and JSON
  projections.

## Dependency Order

1. Re-state the remaining project contract.
2. Plan the remaining project delivery.
3. Finish spec/runtime prerequisites.
4. Build mock-data engine and industry packs.
5. Expand the primitive/runtime layer.
6. Build builder mode.
7. Build presenter/export.
8. Build AI generation.
9. Build production binding.
10. Repair and verify.
11. Review.
12. Close out durable memory.

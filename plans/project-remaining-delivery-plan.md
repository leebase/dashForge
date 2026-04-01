# DashForge Remaining Project Delivery Plan

## Architecture

The project should continue to extend the current React/Vite/TypeScript
foundation instead of replacing it. Remaining work is organized as a sequence of
runtime/data/product layers: spec/runtime hardening, mock-data engine, full
primitive library, builder mode, presenter/export, AI generation, then
production binding.

## Scope Layers

- Layer 1: spec/runtime prerequisites and adapter completeness
- Layer 2: mock-data engine and industry-pack breadth
- Layer 3: primitive library and responsive renderer
- Layer 4: builder mode and template workflows
- Layer 5: presenter mode and export
- Layer 6: AI spec generation
- Layer 7: production data binding

## Data Strategy

- Move the current scenario registry toward the documented SQLite-backed path.
- Treat Healthcare, Financial Services, and SaaS as parallel pack families with
  comparable structure, not bespoke one-offs.
- Keep every widget consuming data through the adapter interface.

## Runtime Strategy

- Preserve the current dashboard renderer and extend the widget registry.
- Introduce compiler-style chart and theme helpers instead of one-off chart
  implementations where possible.
- Stage builder/presenter features on top of the runtime instead of forking it.

## Workflow Strategy

- Use one project-scale playbook with many explicit steps instead of a small
  number of phase umbrellas.
- Make each step concrete enough that the Agent-Orch dashboard is meaningful to
  a human operator.
- Keep verification near the end so the full implementation stack is tested
  together.

## Verification

- Validate the playbook before launch.
- Use Agent-Orch `monitor-run`, `progress.json`, `runs-active.json`, and
  `dashboard.html` for human visibility.
- Run `npm --prefix frontend test` and `npm --prefix frontend run build` at the
  repair/verify step.

## Risks

- The remaining project is large enough that one run may take a long time or
  halt before completion.
- Later phases such as AI generation and production binding may surface missing
  architecture scaffolding.
- Human operators need more granular step names than the earlier coarse
  playbook provided.

## Open Questions

- How much of the documented post-MVP roadmap the first long run can complete
  before a repair cycle is needed
- Which phase becomes the first blocking constraint after the current
  foundation
- Whether the production-binding phase exposes any missing intermediate seams

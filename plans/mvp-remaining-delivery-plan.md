# DashForge MVP Remaining Delivery Plan

## Architecture

The remaining MVP should keep the current React/Vite/TypeScript foundation and
continue to treat DashboardSpec as the core artifact. Work should extend the
existing runtime rather than replace it: mock-data catalogs and templates feed
the adapter layer, the widget registry grows to the full MVP primitive set, and
builder/presenter/export flows layer on top of the current renderer.

## Data Strategy

- Expand the mock-data registry from one healthcare scenario to the 3 MVP packs.
- Prefer reusable pack/scenario catalogs and template metadata over ad hoc
  per-widget fixtures.
- Move toward the canon SQLite-backed mock path where feasible, but do not
  break the current adapter seam to get there.
- Make templates and scenarios first-class inputs to builder and presenter flows.

## Primitive Strategy

- Keep the current KPI and line primitives intact.
- Add bar, stacked bar, donut, table, sparkline, and gauge using the same
  chart-wrapper/compiler path.
- Grow the chart/runtime registry in a way that preserves spec-driven rendering
  and testability.

## Workflow Strategy

- Use one governed playbook for the remaining MVP to avoid fragmented execution.
- Separate the work into contract, plan, data/template foundation, primitive
  expansion, builder, presenter/export, repair/verify, review, and handoff.
- Use Agent-Orch monitoring artifacts during execution so the long-running
  roadmap work remains visible.

## Verification

- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- Agent-Orch playbook validation before launch
- Agent-Orch `monitor-run` and `render-run-dashboard` outputs during execution
- Post-run code review artifact that records findings or explicitly states none

## Risks

- The remaining MVP scope is large enough that a single run may halt partway
  through; the workflow must make partial completion legible.
- Builder-mode and presenter/export work may require canon runtime dependencies.
- Template breadth and mock-data realism could outrun the current test surface.

## Open Questions

- How far the first long-running Agent-Orch execution gets before needing a
  repair/retry cycle
- Whether SQLite-backed mock storage lands in the same run or the workflow
  records it as the next repairable gap
- Which templates should serve as the primary MVP demo path if time forces
  prioritization

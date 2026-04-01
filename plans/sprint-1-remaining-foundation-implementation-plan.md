# Sprint 1 Remaining Foundation Implementation Plan

## Architecture

The slice stays inside the current `frontend/` foundation. The runtime keeps a
spec-first render path, but the sample dashboard will now reference scenario
data by dataset identifier instead of storing chart payloads inline. A mock data
catalog resolves scenario datasets, and the adapter remains the only layer that
knows how widget data is pulled from those datasets.

## Data Strategy

- add a narrow mock scenario catalog for the existing healthcare
  quality-improvement scenario
- extend `DashboardSpec` so mock mode includes the canonical `mock` context with
  `packId`, `scenarioId`, and `seed`
- replace inline-only widget data refs with chart-specific inline-or-mock data
  unions
- update the adapter so KPI and line widgets can resolve either inline or mock
  data while keeping the widget components ignorant of the source

## Bundle Strategy

- lazy-load the ECharts-backed line-chart primitive through `React.lazy`
- keep the KPI path in the main bundle
- verify the build output to confirm the heavy chart runtime moves out of the
  main application chunk

## Decision Handling

- defer `react-grid-layout` until a real builder/composition slice exists
  because the current render-only shell does not justify a new runtime
  dependency yet
- keep the Python scaffold in place through Sprint 1, with retirement deferred
  to the first post-foundation cleanup slice once the frontend owns more of the
  repo

## Work Items

1. Extend DashboardSpec types and schema for scenario-backed mock mode.
2. Add mock scenario datasets and a lookup catalog.
3. Update the adapter layer to resolve KPI and line data from mock datasets.
4. Convert the sample dashboard to `source: "mock"` references.
5. Lazy-load the line-chart primitive and keep the chart wrapper test-safe.
6. Add or update targeted tests for adapter-backed mock resolution.
7. Write the governed playbook, review artifact, and durable doc updates.

## Verification

Targeted checks:

- `cd frontend && npm test`
- `cd frontend && npm run build`

User-style checks:

- `cd frontend && npm exec vite preview -- --host 127.0.0.1 --port 4173`
- confirm the dashboard renders the KPI and line widgets from the new mock
  scenario path without console errors

Governed checks:

- `python3 -m src.agent_orch.main validate-playbook playbooks/s1_01_remaining_foundation_governed_delivery.yaml`
- execute the playbook end to end against the completed slice and inspect the
  resulting run directory

## Risks

- widening the spec too aggressively could outrun the current foundation
- ECharts lazy loading could introduce a visible loading gap if the fallback is
  poor
- review artifacts can drift into template noise if the review step is treated
  as clerical

## Open Questions

- which primitive should follow KPI + line in the first feature-expansion slice:
  table, donut, or gauge?
- when should the root repo stop advertising the Python scaffold entirely?

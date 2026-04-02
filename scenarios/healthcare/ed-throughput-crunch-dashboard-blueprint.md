# ED Throughput Crunch Dashboard Blueprint

## Purpose

This file defines the concrete `DashboardSpec` layout and presenter-ready narrative
for the ED throughput command package. It is the exact blueprint used by operators
during the build and rehearsal.

## Dashboard identity

- Title: `ED Throughput Command View`
- Scenario intent: `risk_alert + operational_detail`
- Audience: COO, VP Operations, CNO, hospital leadership, service-line directors
- Template route: `tpl.healthcare.ed-throughput-command`
- Default data mode: `mock`
- Reuse rule: same artifact supports builder, presenter, and export

## Operator message target

“Throughput pressure has persisted for six weeks and is concentrated in two sites:
Metro Community and North Medical. Inpatient flow and discharge friction are the
primary drivers; quality/access consequences are visible in patient experience and
LWBS trends. Weekly intervention priorities are narrow and site-specific.”

## Presenter arc

1. `System Pressure`
2. `Where It Is Concentrated`
3. `What Is Driving It`
4. `What It Is Causing`
5. `What We Do Next`

The arc is mapped to `narrative.storyArc` in
`ed-throughput-crunch-dashboard-spec.json`.

## Widget layout map

| Widget ID | Title | Type | Band | Dataset | Required | Story Role | Position |
| --- | --- | --- | --- | --- | --- | --- |
| `kpi_arrivals` | ED Arrivals / Day | kpi | Band 1 | monthly_metrics | Required | pressure baseline | x0 y0 w2 h2 |
| `kpi_dtp` | Door To Provider | kpi | Band 1 | monthly_metrics | Required | primary pressure signal | x2 y0 w2 h2 |
| `kpi_lwbs` | LWBS Rate | kpi | Band 1 | monthly_metrics | Required | access pressure signal | x4 y0 w2 h2 |
| `kpi_boarding` | Avg Boarding Hours | kpi | Band 1 | monthly_metrics | Required | flow amplification signal | x6 y0 w2 h2 |
| `kpi_discharge` | Discharge Before Noon | kpi | Band 1 | monthly_metrics | Required | intervention lever | x8 y0 w2 h2 |
| `trend_dtp` | Six-Week Door-To-Provider Trend | line | Band 2 | monthly_metrics | Required | persistence proof | x0 y2 w4 h3 |
| `facility_rank` | Facilities Driving Delay | bar | Band 2 | facility_summary | Required | concentration framing | x4 y2 w4 h3 |
| `priority_table` | Priority Sites This Week | table | Band 2 | facility_summary | Required | executive action filter | x8 y2 w4 h3 |
| `service_line_driver` | Boarding vs Discharge Flow | stacked_bar | Band 3 | department_summary | Required | causal path | x0 y5 w6 h3 |
| `staffing_context` | Coverage Stress By Shift | bar | Band 3 | staffing_coverage | Required | secondary context | x6 y5 w6 h3 |
| `experience_consequence` | Throughput Consequences | line | Band 4 | patient_experience | Required | consequences proof | x0 y8 w6 h3 |

`flow_detail` can be swapped in only if operator requests an optional deeper drilldown:
it binds to `ed_flow` and is not part of the default first page.

## Layout and spacing rules

- Grid columns: 12.
- Keep executive KPIs at the top row for immediate context.
- Keep Band 2 directly below KPIs to force concentration proof before drivers.
- Keep `facility_rank` and `priority_table` visually grouped by no more than one visual gap.
- Keep `service_line_driver` and `staffing_context` in adjacent columns to preserve
  a cause-and-suppression contrast.
- Keep `experience_consequence` at the bottom to close on patient impact.

## Data-binding contracts

- All Band 1 and Band 2 widgets bind to latest-week rows with filter `week_start = max`.
- `trend_dtp` and `experience_consequence` bind across all six weekly rows.
- `service_line_driver` and `staffing_context` filter to
  `metro_community` and `north_medical` in the default rehearsal.
- `facility_rank` should sort descending by `door_to_provider_minutes`.
- `priority_table` should sort by `risk_rank` ascending.
- `narrative.storyArc.callToAction` is the non-widget action surface and must always be present.

## Rehearsal-ready live-edit rules

Operators may execute at most two builder edits during standard run:

- Edit 1: Set `narrative.storyArc.callToAction.commentary` to:
  `This Week's Recovery Priorities`.
- Edit 2: Rebalance attention to concentration (`facility_rank`) over trend-only
  framing.

No other structural edits are required for the bounded demo pass.

## Copy conventions

- KPI subtitles remain explicit about signal direction.
- Use `Act Now`, `Watch Closely`, and `Stable Monitor` in priority language.
- The action narrative must remain bound to the same artifacts and should be
  phrased as a one-week operating response.

## Blueprint acceptance criteria

- All required widgets are present and bound with dataset fields in this contract.
- Presenter arc is coherent using the order above.
- `priority_status` is present and constrained.
- `callToAction` exists and supports a direct handoff sentence.
- No unbounded live/hybrid claims are introduced in-band.

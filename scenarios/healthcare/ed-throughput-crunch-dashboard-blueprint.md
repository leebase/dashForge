# ED Throughput Crunch Dashboard Blueprint

## Purpose

This blueprint turns the ED throughput scenario into one practical dashboard
shape an operator can build, present, and hand off. It is intentionally
specific: what appears on screen, in what order, with what narrative role.

## Dashboard Identity

| Field | Value |
|-------|-------|
| Working title | `ED Throughput Command View` |
| Audience | COO, CNO, hospital presidents, ED operations leaders |
| Primary intent | `risk_alert` |
| Secondary intent | `operational_detail` |
| Primary demo mode | `mock` |
| Optional close | bounded Sprint 9 `live` or `hybrid` bridge |

## Core Message

The page must make this read obvious within 20 seconds:

System throughput pressure has persisted for six weeks, the burden is
concentrated in Metro Community and North Medical, inpatient flow is the main
amplifier, and action this week should target discharge and telemetry release
before patient experience worsens further.

## Page Structure

Use one page with four horizontal bands. Keep it to one clean scroll at most.

### Band 1. Executive Signal

Purpose:
Establish persistent system pressure immediately.

Required widgets:

1. KPI `ED Arrivals / Day`
2. KPI `Door To Provider`
3. KPI `LWBS Rate`
4. KPI `Avg Boarding Hours`
5. KPI `Discharge Before Noon`

Build rules:

- Each KPI shows latest-week value and week-over-week delta.
- `Door To Provider`, `LWBS`, and `Avg Boarding Hours` should carry the
  strongest warning emphasis.
- `ED Arrivals / Day` should support the story that demand stayed elevated but
  is not the only explanation.
- `Discharge Before Noon` should read as the clearest intervention lever.

### Band 2. Concentration Of Risk

Purpose:
Prove the problem is concentrated, not system-uniform.

Required widgets:

1. Line chart `Six-Week Door-To-Provider Trend`
2. Bar chart `Facilities Driving Delay`
3. Table `Priority Sites This Week`

Build rules:

- The facility bar chart is the visual anchor of the page.
- The line chart proves persistence.
- The table must make the management readout explicit, not just numeric.
- Metro Community and North Medical must stand out without needing a presenter
  explanation.

### Band 3. Operational Drivers

Purpose:
Explain why the hotspots are deteriorating.

Required widgets:

1. Combo chart `Boarding vs Discharge Flow`
2. Heatmap or compact bar view `Coverage Stress By Shift`
3. Optional drilldown `Shift And Acuity Pressure`

Build rules:

- The service-line driver chart gets more space than staffing.
- Staffing is supporting context, not the headline explanation.
- The optional drilldown should be hidden unless the room asks for more detail
  or the operator wants one builder-mode swap.

### Band 4. Consequences And Action

Purpose:
Close on why the issue matters and what should happen next.

Required widgets:

1. Multi-series chart `Throughput Consequences`
2. Narrative card `Immediate Intervention Focus`
3. Optional note card `Mock Today, Live/Hybrid Later`

Build rules:

- The consequence chart should connect operations to satisfaction, LWBS, and
  diversion.
- The narrative card should be short enough to read verbatim in presenter mode.
- The optional note card exists only for handoff framing, not for the main
  executive story.

## Suggested Layout Grid

Use this as the practical composition target.

| Widget ID | Title | Type | Band | Width | Height | Priority |
|-----------|-------|------|------|-------|--------|----------|
| `kpi_arrivals` | `ED Arrivals / Day` | KPI | 1 | 2 | 1 | medium |
| `kpi_dtp` | `Door To Provider` | KPI | 1 | 2 | 1 | highest |
| `kpi_lwbs` | `LWBS Rate` | KPI | 1 | 2 | 1 | highest |
| `kpi_boarding` | `Avg Boarding Hours` | KPI | 1 | 2 | 1 | highest |
| `kpi_discharge` | `Discharge Before Noon` | KPI | 1 | 2 | 1 | high |
| `trend_dtp` | `Six-Week Door-To-Provider Trend` | line chart | 2 | 4 | 3 | high |
| `facility_rank` | `Facilities Driving Delay` | bar chart | 2 | 4 | 3 | highest |
| `priority_table` | `Priority Sites This Week` | table | 2 | 4 | 3 | high |
| `service_line_driver` | `Boarding vs Discharge Flow` | combo chart | 3 | 5 | 3 | highest |
| `staffing_context` | `Coverage Stress By Shift` | heatmap/bar | 3 | 3 | 3 | medium |
| `flow_detail` | `Shift And Acuity Pressure` | heatmap/bar | 3 | 4 | 3 | optional |
| `experience_consequence` | `Throughput Consequences` | line/combo | 4 | 5 | 3 | high |
| `intervention_callout` | `Immediate Intervention Focus` | text/markdown | 4 | 3 | 2 | highest |
| `delivery_note` | `Mock Today, Live/Hybrid Later` | text/markdown | 4 | 4 | 2 | optional |

Width and height are relative builder units, not pixel requirements.

## Widget Specification Table

| Widget ID | Dataset | Primary Fields | Build Note | Narrative Role |
|-----------|---------|----------------|------------|----------------|
| `kpi_arrivals` | `monthly_metrics` | arrivals/day, delta | neutral styling | demand stayed elevated |
| `kpi_dtp` | `monthly_metrics` | dtp, target, delta | strongest warning color | primary pressure signal |
| `kpi_lwbs` | `monthly_metrics` | lwbs, target, delta | warning color | access leakage |
| `kpi_boarding` | `monthly_metrics` | boarding, target, delta | warning color | inpatient flow amplifier |
| `kpi_discharge` | `monthly_metrics` | discharge by noon, delta | action-oriented styling | intervention lever |
| `trend_dtp` | `monthly_metrics` | week_start, dtp, target | latest point should exceed target | persistence |
| `facility_rank` | `facility_summary` | facility, dtp or risk score | hotspots use warm accent | concentration |
| `priority_table` | `facility_summary` | facility, priority_status, wow deltas, risk rank | show `priority_status` as the management-language lead label | action prioritization |
| `service_line_driver` | `department_summary` | service_line, boarding, discharge | show medicine and telemetry first | root-cause explanation |
| `staffing_context` | `staffing_coverage` | shift, fill rates, surge gap | secondary visual treatment | staffing context |
| `flow_detail` | `ed_flow` | shift, acuity, waiting room, holds | reserve for optional edit | drilldown answer |
| `experience_consequence` | `patient_experience` | satisfaction, lwbs, diversion | show the negative coupling | consequence |
| `intervention_callout` | static/derived | short action text | readable in 10 seconds | close on what to do |
| `delivery_note` | static | bounded mock/live/hybrid text | optional | handoff framing |

## Required Copy

Use copy that reads like management language, not chart defaults.

Preferred titles:

- `Door To Provider`
- `Facilities Driving Delay`
- `Priority Sites This Week`
- `Boarding vs Discharge Flow`
- `Coverage Stress By Shift`
- `Throughput Consequences`
- `Immediate Intervention Focus`

Preferred intervention card copy:

`Focus discharge flow, telemetry bed release, and evening surge coverage at Metro Community and North Medical this week.`

Preferred delivery note copy:

`This dashboard can stay mock-backed for workshop use or later move selected views toward Sprint 9's bounded live or hybrid path.`

## First-Pass Reading Order

The page should support this read without rearrangement:

1. We are above target across the core throughput metrics.
2. The trend confirms this is persistent, not a one-day spike.
3. Metro Community and North Medical account for most of the pain.
4. Boarding and discharge friction explain the hotspot pattern.
5. Patient experience and diversion are now downstream evidence.
6. The action is operationally specific and limited to a few levers.

## Presenter Mode Sequence

Create exactly five presenter steps.

### 1. `System Pressure`

Focus:
- KPI band
- six-week trend

Message:
- The system has been above target for six weeks.

### 2. `Where It Is Concentrated`

Focus:
- facility ranking
- priority table

Message:
- Metro Community and North Medical drive most of the deterioration.

### 3. `What Is Driving It`

Focus:
- service-line driver chart
- staffing context as supporting evidence

Message:
- Boarding and delayed discharge explain more than arrivals alone.

### 4. `What It Is Causing`

Focus:
- consequence chart

Message:
- Satisfaction, diversion, and LWBS are now moving in the same direction.

### 5. `What We Do Next`

Focus:
- intervention callout

Message:
- Prioritize discharge throughput, telemetry release, and surge coverage.

## Builder Demo Script

Keep the edit moment short and credible. The goal is to answer a stakeholder
request, not to showcase every control.

### Edit 1. Reframe The Closing Callout

Change:
- `Immediate Intervention Focus`

To:
- `This Week's Recovery Priorities`

Reason:
- It shifts the close from observation to action.

### Edit 2. Rebalance Band 2

Change:
- make `Facilities Driving Delay` larger or visually more prominent than the
  six-week trend

Reason:
- It answers the likely stakeholder request: "show me the sites that need
  action, not just the enterprise curve."

### Optional Edit 3. Swap In Drilldown

Change:
- replace the delivery note or secondary lower-right slot with
  `Shift And Acuity Pressure` for Metro Community

Reason:
- It supports a follow-up question without derailing the main executive story.

Only show the optional edit if the room explicitly asks for more operational
detail.

## AI Positioning

AI is optional and should stay in a supporting role.

- Show it only as a way to accelerate a first-pass dashboard shape.
- Keep the prompt grounded in the scenario and the intended audience.
- Review the candidate before applying it.
- If the candidate weakens the story, discard it and continue manually.

Safe operator line:

`AI helps us get to a first draft faster, but the scenario framing and final review stay explicit.`

## Export And Handoff Close

The operator should close with three messages:

1. This is a structured dashboard artifact, not a static mockup.
2. The same artifact supports builder mode, presenter mode, and export.
3. Delivery can keep it mock-backed or later move bounded parts toward Sprint
   9's `live` or `hybrid` path.

Do not imply backend brokering, secret management, or full production rollout.

## Definition Of Done

This blueprint is ready when:

- all required widgets map to the data design,
- the concentration story is obvious on first view,
- the presenter sequence mirrors the scenario arc,
- the builder edit feels like a plausible in-room request,
- and the handoff story stays bounded to the current DashForge baseline.

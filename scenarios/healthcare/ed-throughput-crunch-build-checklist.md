# ED Throughput Crunch Operator Build Checklist

## Purpose

This checklist is the operator runbook for building and rehearsing the ED
throughput demo package. It assumes the product baseline already exists and the
operator is assembling a strong demo, not inventing new runtime behavior.

## Required Outputs

Complete this pass only when you have:

- one primary dashboard artifact titled `ED Throughput Command View`
- one five-step presenter sequence
- one short builder edit script
- one explicit export/handoff close

## Pre-Flight

Read these before touching the dashboard:

- [AGENTS.md](/Users/lee/projects/dashForge/AGENTS.md)
- [ed-throughput-crunch.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch.md)
- [client-presentation-script.md](/Users/lee/projects/dashForge/scenarios/healthcare/client-presentation-script.md)
- [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md)
- [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md)

Confirm these conditions:

- The story is still healthcare operations, not generic analytics.
- The demo goal is a management conversation, not a product feature tour.
- The primary mode is `mock`.
- Any mention of `live` or `hybrid` will stay bounded to Sprint 9's current
  positioning.
- A host environment is available for the final browser rehearsal because this
  sandbox cannot bind localhost reliably.

## Operator Decisions

Lock these before building:

| Decision | Default |
|----------|---------|
| Primary audience | COO / CNO / hospital presidents |
| Demo outcome | show a credible first-pass command view and a clean handoff path |
| AI in demo | optional, skip unless it helps |
| `live` / `hybrid` mention | optional, mention only in the close |
| Builder edit count | exactly 2 |

## Data Readiness

Before layout work, confirm the data pack is usable.

- `monthly_metrics` has exactly six weekly rows.
- `facility_summary` makes Metro Community and North Medical the top two risk
  sites in the latest week.
- `department_summary` shows medicine and telemetry as the strongest boarding
  drivers in hotspot sites.
- `staffing_coverage` shows evening or night stress in hotspot sites but not as
  the sole root cause.
- `patient_experience` shows deterioration after throughput pressure rises.
- `ed_flow` exists if you plan to use the optional drilldown.

If any of those fail, fix the data story before touching the dashboard layout.

## Build Sequence

### 1. Assemble Band 1

- Create five KPI cards from `monthly_metrics`.
- Use these titles:
  - `ED Arrivals / Day`
  - `Door To Provider`
  - `LWBS Rate`
  - `Avg Boarding Hours`
  - `Discharge Before Noon`
- Show latest-week value plus week-over-week delta.
- Make `Door To Provider`, `LWBS Rate`, and `Avg Boarding Hours` visually read
  as the main risk trio.

Checkpoint:
- A viewer should understand within 10 seconds that throughput pressure is
  elevated and sustained.

### 2. Assemble Band 2

- Add the six-week line chart from `monthly_metrics`.
- Add the facility comparison bar chart from `facility_summary`.
- Add the priority table from `facility_summary`.
- Make the facility comparison chart the visual anchor of the page.
- Ensure Metro Community and North Medical are obvious without explanation.

Checkpoint:
- A viewer should be able to answer "where is the problem concentrated?" on the
  first read.

### 3. Assemble Band 3

- Add `Boarding vs Discharge Flow` from `department_summary`.
- Add `Coverage Stress By Shift` from `staffing_coverage`.
- Add `Shift And Acuity Pressure` from `ed_flow` only if you want the optional
  drilldown available.
- Keep the service-line chart more prominent than staffing.

Checkpoint:
- The page should support the claim that inpatient flow is the main amplifier.

### 4. Assemble Band 4

- Add `Throughput Consequences` from `patient_experience`.
- Add the intervention text card with this default copy:
  `Focus discharge flow, telemetry bed release, and evening surge coverage at Metro Community and North Medical this week.`
- Add the delivery note card only if you want a visible reminder for the close.

Checkpoint:
- The bottom band should explain why the problem matters and what to do next.

## Label Pass

Do one dedicated copy pass after layout is stable.

- Replace any generic widget titles.
- Remove any title that sounds like internal BI or product jargon.
- Ensure the `Priority Sites This Week` table shows the `priority_status`
  field values `Act Now`, `Watch Closely`, or `Stable Monitor` instead of raw
  metric labels.
- Keep the action card short enough to read aloud in one breath.

If the page reads like a chart catalog, the copy pass is not done.

## Presenter Rehearsal

Build and rehearse this exact five-step presenter sequence:

1. `System Pressure`
2. `Where It Is Concentrated`
3. `What Is Driving It`
4. `What It Is Causing`
5. `What We Do Next`

Rules:

- Keep each step focused on one dominant visual.
- Keep the executive readout under three minutes before entering builder mode.
- Use the scenario language from the client script, not improvised BI talk.

## Builder Rehearsal

Do not improvise here. Rehearse the same two edits every time.

### Edit 1

- Rename `Immediate Intervention Focus` to `This Week's Recovery Priorities`.

Line to use:

`If you want this to read more like an action list for Monday's operating review, we can reframe the close immediately.`

### Edit 2

- Increase the prominence of `Facilities Driving Delay` over the six-week
  trend.

Line to use:

`If the room wants site accountability ahead of the enterprise summary, we can shift the emphasis without rebuilding the page.`

Stop after the second edit. Do not wander into open-ended tweaking.

## AI Decision Gate

Show AI only if all three answers are yes:

- Will it shorten the path to the story you already want?
- Can you keep it to one candidate review/apply moment?
- Can you explain clearly why the candidate helps this scenario?

If any answer is no, skip AI.

If AI is shown:

- use a scenario-aware prompt,
- review the candidate before applying,
- discard it immediately if it weakens the executive story.

## Handoff Close

Rehearse this close explicitly:

- Show or describe the exported structured artifact.
- State that the dashboard is not a screenshot.
- State that the same artifact supports builder mode, presenter mode, and
  delivery handoff.
- If mentioning production-shaped evolution, use only this phrasing:
  `We can keep this mock-backed for workshop use or later move selected views toward Sprint 9's bounded live or hybrid path.`

Do not promise:

- backend credential brokering
- durable secret management
- production deployment
- warehouse integration

## Go/No-Go Checklist

The package is ready only if every answer is yes.

- Does the dashboard answer the exact business question from
  [ed-throughput-crunch.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch.md)?
- Do Metro Community and North Medical stand out on first read?
- Does the page explain why boarding and discharge matter more than arrivals
  alone?
- Does the consequence view connect throughput to satisfaction, diversion, and
  LWBS?
- Can the presenter sequence be delivered cleanly in five steps?
- Can the builder edit sequence be delivered in under 90 seconds?
- Can AI be skipped without harming the story?
- Can `live` and `hybrid` be skipped without harming the story?
- Does the handoff close stay accurate to the current product baseline?

## Final Rehearsal

- Run one host-environment browser walkthrough.
- Time the full demo. Target 8 to 12 minutes.
- Confirm each widget can be explained in one sentence.
- Confirm the operator can answer "why is this chart here?" for every visual.
- Confirm the operator can recover cleanly if AI or `live`/`hybrid` is not
  shown.
- Confirm the close returns to business value: faster workshops, stronger
  stakeholder alignment, lower handoff waste.

## Failure Modes

Avoid these every time:

- opening with the product instead of the operating problem
- overloading the page with extra charts
- making staffing look like the only cause
- turning the builder segment into a feature tour
- overstating current production readiness
- ending without a structured artifact handoff message

## Completion Statement

Mark the package ready only when the operator can say:

`We can open a realistic ED throughput scenario, show an executive-ready first pass, adapt it live in the room, present it cleanly, and leave behind a structured artifact that can continue into delivery.`

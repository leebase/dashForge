# ED Throughput Crunch Demo Plan

## Goal

Execute a bounded workflow that turns the existing emergency department
throughput scenario into a workshop-ready dashboard demo build package. The
package should let a consultant frame the problem, show a credible first-pass
dashboard, adapt the story live in the room, and close with a structured
handoff path that reinforces DashForge's mock-to-production value.

## Planning Assumptions

- The governed Sprint 1-9 product baseline is closed and should be reused as
  is.
- `scenarios/healthcare/ed-throughput-crunch.md` is the scenario canon for the
  business problem, audience, KPIs, cuts, and story arc.
- `scenarios/healthcare/client-presentation-script.md` is the presentation
  canon for the client-facing talk track.
- The package is a scenario-specific demo assembly slice, not new platform
  development.
- Existing DashForge capabilities already cover the needed story surface:
  builder mode, AI-assisted drafting, presenter mode, export, and bounded
  `mock` / `live` / `hybrid` positioning.
- Any final browser walkthrough still requires a host-capable environment
  because sandbox localhost binding remains unavailable here.

## Package Definition

The ED throughput demo package should ultimately contain:

- one primary dashboard artifact aligned to the scenario
- one presenter sequence tied to the scenario narrative arc
- one short builder-edit sequence that demonstrates live adaptation in the room
- one explicit handoff/export explanation showing the structured artifact path
- one concise operator checklist for running the demo consistently

## Scope Summary

### Deliver In This Workflow

- a clear scenario-to-dashboard mapping
- a bounded build sequence for the dashboard package
- a presenter walkthrough plan
- a builder-edit plan
- a handoff and export plan
- readiness criteria for later implementation/demo rehearsal

### Do Not Deliver In This Workflow

- new frontend features or runtime changes
- new healthcare data-model design outside the current scenario needs
- warehouse or backend integration
- cross-industry packaging
- broad product roadmap changes

## Ordered Work

### 1. Lock Scenario Intent And Demo Outcome

Objective:
Anchor the package on a single management story so later dashboard assembly
does not drift into a generic healthcare overview.

Inputs:

- `scenarios/healthcare/ed-throughput-crunch.md`
- `scenarios/healthcare/client-presentation-script.md`
- `product-definition.md`

Done when:

- the primary audience is fixed
- the business question is fixed
- the demo outcome is expressed in client-facing terms
- the storyline is clearly bounded to ED throughput deterioration and
  intervention focus

### 2. Translate The Scenario Into A Dashboard Information Architecture

Objective:
Define what the dashboard must show, in what order, and why each element
exists in the story.

Recommended structure:

- top row: system pressure KPIs
- middle row: facility concentration and trend views
- lower row: operational drivers, staffing/discharge signals, and patient
  experience consequences

Expected content:

- system-level ED arrivals, door-to-provider time, LWBS, boarding hours
- facility comparison for the worst-performing hospitals
- discharge-before-noon and staffing coverage context
- patient satisfaction and diversion impact

Done when:

- each major widget or section has a narrative purpose
- the dashboard supports both executive-summary and operational-detail reading
- the content maps cleanly to the scenario's listed datasets and cuts

### 3. Define The Builder Demo Moment

Objective:
Show that the dashboard is editable during a workshop without turning the demo
into an unfocused product tour.

Recommended edits:

- reframe one title or narrative callout around intervention priority
- switch one view from system rollup to facility comparison
- adjust emphasis from executive summary toward operational detail

Guardrails:

- keep the edit sequence to one or two meaningful changes
- avoid edits that require new product behavior
- ensure the changes strengthen the client story instead of showing random UI
  flexibility

Done when:

- the package includes a short, repeatable builder-edit script
- the edit sequence clearly answers a plausible client request in the room

### 4. Define The AI-Assisted Drafting Moment

Objective:
Decide how AI appears in the demo without making it the center of the story.

Approach:

- treat AI as optional acceleration for the first draft
- keep the scenario, intent, and healthcare framing explicit
- show candidate review/apply behavior only if it supports the workshop story

Done when:

- the package states whether AI is included, optional, or skipped
- the AI moment remains bounded and review-driven

### 5. Define The Presenter Walkthrough

Objective:
Convert the dashboard into a guided executive readout that mirrors the scenario
arc.

Recommended sequence:

1. System-wide throughput pressure is above target.
2. Metro Community and North Medical drive most deterioration.
3. Boarding and discharge velocity explain more than arrivals alone.
4. Patient experience and LWBS are now degrading with throughput.
5. Immediate intervention should focus on discharge flow, telemetry capacity,
   and surge coverage.

Done when:

- the presenter sequence has a clear beginning, middle, and close
- each step maps to a dashboard section or emphasis action
- the script reinforces an operator/executive decision story rather than a
  chart tour

### 6. Define The Handoff And Export Story

Objective:
Close the demo by proving the artifact survives beyond the workshop.

Required message:

- the dashboard is stored as structured spec, not as a screenshot
- the same artifact can stay mock-backed for storytelling
- the delivery team can later move toward Sprint 9's bounded `live` or
  `hybrid` path without discarding the design

Done when:

- the package includes a concrete closeout script
- the mock-to-live story stays bounded and accurate to the current product

### 7. Package Readiness Review

Objective:
Set the minimum proof required before the demo package is used with clients.

Checklist:

- scenario brief, dashboard story, and presenter script agree
- dashboard artifact supports the required KPIs and cuts
- builder-edit sequence is short and repeatable
- handoff/export explanation is explicit
- one browser rehearsal runs in a host environment when available

Done when:

- the package has a clear go/no-go checklist
- remaining gaps are listed as package-prep items rather than hidden scope

## Verification Matrix

| Area | Proof |
|------|-------|
| Scenario alignment | Dashboard story matches the business question, audience, KPIs, and narrative arc in the scenario brief |
| Dashboard architecture | Planned sections cover system pressure, facility concentration, operational drivers, and consequences |
| Builder demo | One or two edits can be shown as credible in-room adaptation |
| AI positioning | AI stays bounded, assistive, and review-driven if included |
| Presenter story | The walkthrough supports a leadership decision narrative rather than a chart catalog |
| Handoff story | The package clearly explains spec export and bounded progression from mock toward live/hybrid |
| Demo readiness | A later operator can rehearse and run the package consistently |

## Risks And Controls

| Risk | Control |
|------|---------|
| The package becomes a generic healthcare dashboard instead of a specific throughput story | Keep every artifact tied to the ED throughput business question and intervention narrative |
| The demo overemphasizes product capability instead of client value | Lead with the operating problem, then use product features only to reinforce the story |
| Builder edits feel random | Limit the edit moment to a plausible stakeholder request and one or two meaningful changes |
| AI distracts from the workshop narrative | Treat AI as optional acceleration, not the main event |
| Production-binding talk overpromises current readiness | Keep the close strictly aligned to Sprint 9's bounded `mock` / `live` / `hybrid` path |
| Browser rehearsal is skipped because of sandbox limits | Require one host-environment rehearsal before client use |

# Emergency Department Throughput Crunch

## Scenario ID

`ed-throughput-crunch`

## Elevator Pitch

A six-hospital regional health system is experiencing sustained emergency
department congestion after a winter respiratory surge. Volume has remained
elevated even after the peak season, but inpatient discharge velocity and bed
turnover have not recovered. The result is a visible throughput bottleneck:
door-to-provider times are rising, left-without-being-seen cases are creeping
up, boarding hours are spreading across facilities, and patient experience is
starting to erode.

This is the kind of dashboard a COO, CNO, VP of Operations, or service-line
leader would review every morning to decide where intervention is needed.

## Business Question

Where is emergency department congestion getting worse, what operational
drivers are causing it, and which facilities or service lines should be
prioritized for intervention this week?

## Story

The system thought it was returning to normal after flu-season pressure eased,
but emergency demand never fully normalized. Metro Community Hospital and
North Medical Center are now absorbing a disproportionate share of high-acuity
visits. Inpatient medicine and telemetry are discharging more slowly than plan,
which keeps admitted patients boarding in the ED for longer periods. That has
a second-order effect on waiting room time, staffing strain, and patient
experience scores.

Executives do not just want to know that waits are up. They want to see:

- which facilities are driving the system-wide bottleneck
- whether the issue is arrival volume, staffing coverage, or discharge delay
- how boarding hours are translating into satisfaction, diversion, and LWBS
- whether the trend is temporary noise or sustained deterioration

## Primary Audience

- COO / VP Operations
- Chief Nursing Officer
- Hospital presidents
- ED service-line directors

## Suggested Dashboard Intent

- `risk_alert`
- `operational_detail`

## Core KPIs

- ED arrivals per day
- Door-to-provider minutes
- Left without being seen rate
- Average boarding hours
- Inpatient discharge before noon rate
- ED patient satisfaction
- Diversion hours

## Recommended Cuts

- Facility
- Region
- Department / service line
- Acuity band
- Shift (day / evening / night)
- Week over week

## Likely Narrative Arc

1. System-wide ED wait time has trended above target for six consecutive weeks.
2. Two facilities account for most of the deterioration.
3. Boarding hours and delayed inpatient discharge are more explanatory than raw arrivals alone.
4. Patient satisfaction and LWBS are now moving in the same negative direction.
5. Immediate action should focus on discharge throughput, telemetry capacity,
   and surge staffing in the worst-performing sites.

## Example Executive Readout

"We are not looking at a one-off surge anymore. This has become an operating
rhythm problem. Metro Community and North Medical are carrying the largest
throughput burden, and the signal suggests admitted-patient boarding is the
main amplifier. If we improve discharge-before-noon performance and telemetry
bed release in those sites, we should see downstream relief in ED wait,
diversion hours, and patient satisfaction within one to two weeks."

## Suggested Datasets

- `monthly_metrics`
- `facility_summary`
- `department_summary`
- `ed_flow`
- `staffing_coverage`
- `patient_experience`

## What Makes This Valuable In A Demo

- It is immediately recognizable to healthcare operators.
- It combines quality, throughput, staffing, and patient experience in one story.
- It supports both executive-summary and operational-drilldown views.
- It naturally demonstrates how DashForge can start with realistic mock data
  and evolve into a live operational dashboard.

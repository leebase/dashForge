# ED Throughput Crunch Data Design

## Purpose

This document defines the concrete data design for the ED throughput demo
package. It is meant to be practical enough that an operator can assemble a
dashboard spec, rehearse the story, and explain how the same shape could later
map onto Sprint 9's bounded `live` or `hybrid` path.

The data design must support one management story:

1. ED throughput pressure has stayed above target for six weeks.
2. Metro Community and North Medical drive most of the deterioration.
3. Boarding and discharge friction explain more than arrivals alone.
4. LWBS, diversion, and satisfaction are now worsening downstream.
5. Action this week should target discharge flow, telemetry capacity, and
   surge staffing in the hotspot facilities.

## Operating Assumptions

- Primary demo mode is `mock`.
- Time horizon is the trailing six completed weeks plus one current-day
  staffing snapshot.
- The dashboard is a single-page executive-operational view, not a reporting
  warehouse.
- Each dataset exists to support a visible widget or presenter step.
- Mock values should be plausible, directional, and internally consistent
  rather than statistically exhaustive.

## Story Rules

The scenario data should always make the following conditions true:

- `door_to_provider_minutes`, `lwbs_rate`, and `avg_boarding_hours` worsen
  together over the six-week window.
- Metro Community and North Medical are the worst two facilities in the latest
  week on at least two of the three main pressure metrics.
- `discharge_before_noon_rate` is lower in hotspot facilities than in stable
  comparison sites.
- Medicine and telemetry service lines explain more of the boarding burden
  than other inpatient destinations.
- Staffing stress contributes, especially on evening and night shifts, but it
  does not read as the sole root cause.
- Experience and access consequences lag the throughput deterioration by one to
  two weeks.

## Time Model

| Window | Use | Grain |
|--------|-----|-------|
| Trailing 6 weeks | KPI deltas, trends, facility ranking | weekly |
| Latest completed week | primary executive comparison | weekly |
| Current day | staffing context only | daily by shift |

Use Monday-based `week_start` values for weekly datasets.

## Shared Dimensions

These dimensions should be reused consistently across datasets.

| Dimension | Type | Required | Notes |
|-----------|------|----------|-------|
| `week_start` | date | weekly datasets | Monday-based reporting week |
| `report_date` | date | daily datasets | Current-day staffing snapshot |
| `facility_id` | string | yes | Stable key such as `metro_community` |
| `facility_name` | string | yes | Human-readable label |
| `region` | string | when relevant | Small regional grouping |
| `service_line` | string | service-line datasets | `medicine`, `telemetry`, `observation` |
| `acuity_band` | string | flow drilldown | `low`, `moderate`, `high` |
| `shift` | string | staffing/flow drilldown | `day`, `evening`, `night` |

## Canonical Facility Set

Use a fixed six-hospital system.

| Facility ID | Facility Name | Region | Scenario Role |
|-------------|---------------|--------|---------------|
| `metro_community` | Metro Community Hospital | Central Metro | Primary hotspot |
| `north_medical` | North Medical Center | North Metro | Primary hotspot |
| `saint_catherine` | Saint Catherine Regional | Inner North | Moderate pressure |
| `valley_general` | Valley General Hospital | West | Stable comparison |
| `riverside_memorial` | Riverside Memorial | South | Stable comparison |
| `east_side` | East Side Medical Pavilion | East | Stable comparison |

## Dataset Inventory

The package uses the six datasets named in the scenario brief.

### 1. `monthly_metrics`

Purpose:
System-level KPI band and six-week trend context.

Recommended grain:
- one row per `week_start`

Required fields:

| Field | Type | Meaning |
|-------|------|---------|
| `week_start` | date | Reporting week |
| `ed_arrivals_per_day` | number | Average daily ED arrivals across system |
| `door_to_provider_minutes` | number | System average |
| `lwbs_rate` | number | Left-without-being-seen rate |
| `avg_boarding_hours` | number | Boarding burden |
| `discharge_before_noon_rate` | number | Discharge throughput proxy |
| `patient_satisfaction_score` | number | ED experience score |
| `diversion_hours` | number | Total diversion burden |
| `door_to_provider_target_minutes` | number | Executive target line |
| `lwbs_target_rate` | number | Executive target line |
| `boarding_target_hours` | number | Executive target line |

Required derived fields:

| Field | Type | Rule |
|-------|------|------|
| `door_to_provider_wow_delta` | number | latest week minus prior week |
| `lwbs_wow_delta` | number | latest week minus prior week |
| `boarding_wow_delta` | number | latest week minus prior week |
| `discharge_wow_delta` | number | latest week minus prior week |
| `satisfaction_wow_delta` | number | latest week minus prior week |
| `pressure_status` | string | `stable`, `watch`, `critical` |

Example latest-week row:

| week_start | arrivals/day | dtp min | lwbs | boarding hrs | discharge by noon | satisfaction | diversion hrs |
|------------|--------------|---------|------|--------------|-------------------|--------------|---------------|
| 2026-03-23 | 1,184 | 57 | 4.6% | 6.8 | 31% | 68 | 29 |

Used by:
- KPI cards
- six-week door-to-provider trend
- presenter step `System Pressure`

### 2. `facility_summary`

Purpose:
Show where the system problem is concentrated.

Recommended grain:
- one row per `week_start`, `facility_id`

Required fields:

| Field | Type | Meaning |
|-------|------|---------|
| `week_start` | date | Reporting week |
| `facility_id` | string | Stable key |
| `facility_name` | string | Display label |
| `region` | string | Regional grouping |
| `ed_arrivals_per_day` | number | Facility demand signal |
| `door_to_provider_minutes` | number | Wait signal |
| `lwbs_rate` | number | Throughput leakage |
| `avg_boarding_hours` | number | Inpatient flow constraint proxy |
| `discharge_before_noon_rate` | number | Downstream driver |
| `diversion_hours` | number | Operational consequence |
| `patient_satisfaction_score` | number | Experience consequence |
| `throughput_risk_score` | number | Composite prioritization score |

Required derived fields:

| Field | Type | Rule |
|-------|------|------|
| `is_priority_facility` | boolean | true for the two hotspot sites |
| `door_to_provider_rank` | number | descending wait rank |
| `boarding_rank` | number | descending boarding rank |
| `risk_rank` | number | descending risk rank |
| `door_to_provider_wow_delta` | number | week-over-week delta |
| `boarding_wow_delta` | number | week-over-week delta |
| `discharge_wow_delta` | number | week-over-week delta |
| `priority_status` | string | management label: `Act Now` for risk ranks 1-2, `Watch Closely` for rank 3 or any site with worsening DTP and boarding, otherwise `Stable Monitor` |

Expected latest-week pattern:

| Facility | DTP | Boarding | Discharge by Noon | Risk Role |
|----------|-----|----------|-------------------|-----------|
| Metro Community Hospital | 72 min | 8.1 hrs | 26% | worst |
| North Medical Center | 64 min | 7.3 hrs | 28% | worst |
| Saint Catherine Regional | 52 min | 5.9 hrs | 33% | moderate |
| Valley General Hospital | 39 min | 4.1 hrs | 41% | stable |
| Riverside Memorial | 36 min | 3.8 hrs | 43% | stable |
| East Side Medical Pavilion | 34 min | 3.2 hrs | 44% | stable |

Used by:
- facility comparison bar chart
- priority table
- builder emphasis shift from enterprise trend to site accountability
- presenter step `Where It Is Concentrated`

### 3. `department_summary`

Purpose:
Explain the inpatient-side drivers behind ED boarding.

Recommended grain:
- one row per `week_start`, `facility_id`, `service_line`

Required fields:

| Field | Type | Meaning |
|-------|------|---------|
| `week_start` | date | Reporting week |
| `facility_id` | string | Facility key |
| `facility_name` | string | Display label |
| `service_line` | string | `medicine`, `telemetry`, `observation`, `surgery` |
| `admitted_ed_patients` | number | Volume flowing into the unit |
| `avg_boarding_hours` | number | Boarding burden linked to the unit |
| `discharge_before_noon_rate` | number | Throughput release proxy |
| `bed_turnover_minutes` | number | Unit release efficiency |
| `capacity_utilization_rate` | number | Occupancy pressure |

Expected pattern:
- Metro Community medicine and North Medical telemetry should show the highest
  boarding burden paired with the weakest discharge-before-noon rates.

Used by:
- service-line driver chart
- presenter step `What Is Driving It`

### 4. `ed_flow`

Purpose:
Provide one optional drilldown for shift and acuity stress.

Recommended grain:
- one row per `week_start`, `facility_id`, `acuity_band`, `shift`

Required fields:

| Field | Type | Meaning |
|-------|------|---------|
| `week_start` | date | Reporting week |
| `facility_id` | string | Facility key |
| `facility_name` | string | Display label |
| `acuity_band` | string | `low`, `moderate`, `high` |
| `shift` | string | `day`, `evening`, `night` |
| `arrivals` | number | Encounter count |
| `door_to_provider_minutes` | number | Wait time by cut |
| `waiting_room_minutes` | number | Queue signal |
| `lwbs_rate` | number | Leakage by cut |
| `admit_hold_count` | number | Patients waiting for inpatient placement |

Expected pattern:
- Metro Community night shift and North Medical evening shift should read as
  the sharpest operational stress points.

Used by:
- optional lower-right drilldown swap in builder mode
- follow-up questions during the demo

### 5. `staffing_coverage`

Purpose:
Add staffing context without turning the story into labor planning software.

Recommended grain:
- one row per `report_date`, `facility_id`, `shift`

Required fields:

| Field | Type | Meaning |
|-------|------|---------|
| `report_date` | date | Staffing snapshot date |
| `facility_id` | string | Facility key |
| `facility_name` | string | Display label |
| `shift` | string | `day`, `evening`, `night` |
| `rn_fill_rate` | number | Nursing coverage percent to plan |
| `provider_fill_rate` | number | Physician/APP coverage percent to plan |
| `agency_hours` | number | Temporary labor burden |
| `surge_gap_hours` | number | Uncovered surge demand |

Expected pattern:
- hotspot facilities should show evening and night strain, but stable sites
  should still prove staffing is not the whole explanation.

Used by:
- staffing context heatmap or compact bar chart
- presenter step `What Is Driving It`

### 6. `patient_experience`

Purpose:
Tie the throughput problem to patient-facing consequences.

Recommended grain:
- one row per `week_start`, `facility_id`

Required fields:

| Field | Type | Meaning |
|-------|------|---------|
| `week_start` | date | Reporting week |
| `facility_id` | string | Facility key |
| `facility_name` | string | Display label |
| `patient_satisfaction_score` | number | Experience score |
| `survey_response_count` | number | Reliability context |
| `complaint_rate` | number | Escalation signal |
| `lwbs_rate` | number | Shared throughput consequence |
| `diversion_hours` | number | Access consequence |

Expected pattern:
- Metro Community and North Medical should show satisfaction decline only after
  wait and boarding metrics have already been elevated for several weeks.

Used by:
- consequences chart
- presenter step `What It Is Causing`

## Metric Conventions

Use these conventions so the dashboard reads consistently.

| Metric | Convention |
|--------|------------|
| `door_to_provider_minutes` | lower is worse-highlighted against target breach |
| `lwbs_rate` | percent with one decimal place |
| `avg_boarding_hours` | hours with one decimal place |
| `discharge_before_noon_rate` | percent with no more than one decimal place |
| `patient_satisfaction_score` | 0-100 scale |
| `throughput_risk_score` | 0-100 composite for ranking only |

Suggested risk score composition:

- 35% `door_to_provider_minutes`
- 30% `avg_boarding_hours`
- 20% `lwbs_rate`
- 10% inverse `discharge_before_noon_rate`
- 5% `diversion_hours`

The score exists only to rank priorities quickly. The dashboard narrative
should still explain the component metrics visibly.

## Dashboard-To-Data Mapping

| Dashboard Area | Primary Dataset | Required Fields |
|----------------|-----------------|-----------------|
| KPI row | `monthly_metrics` | arrivals, dtp, lwbs, boarding, discharge, deltas |
| six-week trend | `monthly_metrics` | week_start, dtp, dtp target |
| facility comparison | `facility_summary` | facility_name, dtp, risk score |
| priority table | `facility_summary` | facility_name, priority_status, dtp delta, boarding delta, discharge delta, risk rank |
| service-line driver | `department_summary` | facility_name, service_line, boarding, discharge by noon |
| staffing context | `staffing_coverage` | shift, rn fill, provider fill, surge gap |
| consequence chart | `patient_experience` | satisfaction, lwbs, diversion |
| optional drilldown | `ed_flow` | shift, acuity, waiting room, admit hold |

## Minimal Mock Record Counts

Use this as the practical floor for a believable demo dataset pack.

| Dataset | Minimum Rows |
|---------|--------------|
| `monthly_metrics` | 6 |
| `facility_summary` | 36 |
| `department_summary` | 72 |
| `ed_flow` | 324 |
| `staffing_coverage` | 18 |
| `patient_experience` | 36 |

These counts are enough to support the intended visuals without overbuilding.

## Live And Hybrid Mapping Guidance

If the operator wants to mention Sprint 9's bounded bridge:

- Best first `live` candidate: `facility_summary`
- Best `hybrid` story: keep KPI, narrative, and consequence views mock-backed
  while binding the facility comparison view to a live REST feed

Bounded field-map expectation for `facility_summary`:

| Dashboard Field | Likely Live Source Alias |
|-----------------|--------------------------|
| `facility_name` | `hospital_name` |
| `door_to_provider_minutes` | `door_to_doc_min` |
| `avg_boarding_hours` | `boarding_avg_hours` |
| `discharge_before_noon_rate` | `discharge_noon_pct` |
| `lwbs_rate` | `lwbs_pct` |
| `throughput_risk_score` | derived or precomputed `risk_score` |

Do not require live binding for package readiness. This is only a delivery
bridge the operator can explain.

## Data QA Checklist

Before the dashboard is assembled, confirm:

- There are exactly six weekly points in `monthly_metrics`.
- Metro Community and North Medical rank first and second on the latest-week
  `throughput_risk_score`.
- Latest-week system `door_to_provider_minutes` is above target.
- Latest-week hotspot `discharge_before_noon_rate` is below the system average.
- Hotspot service-line rows make medicine and telemetry visibly explanatory.
- Patient experience decline follows, not precedes, the throughput increase.
- Stable comparison sites remain meaningfully better so the concentration story
  is obvious on first read.

## Definition Of Ready

This data design is ready when:

- each dashboard widget has a designated dataset and fields,
- the dataset relationships reinforce the intended narrative,
- the hotspot facilities stand out immediately,
- the operator can explain how the same shape stays valid in `mock` and could
  later map to one bounded `live` or `hybrid` step,
- and the package does not require any new runtime capability to be credible.

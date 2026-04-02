# ED Throughput Crunch Data Design

## Purpose

This is the source-of-truth contract for the ED throughput scenario materialization and demo.
It binds the concrete artifact set to the runtime data shape without introducing new
tables or runtime schema changes:

- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `frontend/src/features/builder/templateInstantiation.ts`

Use this file before any build, binder, or presenter rehearsal pass.

## Source alignment

- Scenario narrative and business question come from `ed-throughput-crunch.md`.
- Blueprint and presenter arc come from `ed-throughput-crunch-dashboard-blueprint.md`.
- Template route is fixed to `tpl.healthcare.ed-throughput-command`.
- Data mode is `mock` by default with bounded `live/hybrid` handoff language.
- Pack is `healthcare`, scenario is `ed-throughput-crunch`.
- Time axis is week-based with six completed weekly points and one staffing snapshot week/day.

## Data assumptions

- Six-facility fixed system:
  - `metro_community` → Metro Community Hospital
  - `north_medical` → North Medical Center
  - `saint_catherine` → Saint Catherine Regional
  - `valley_general` → Valley General Hospital
  - `riverside_memorial` → Riverside Memorial
  - `east_side` → East Side Medical Pavilion
- `week_start` is Monday and consistent across all weekly tables.
- `facility_id` is the primary cross-dataset join key for concentration and driver joins.
- `report_date` exists only in `staffing_coverage` and is interpreted as latest staffing cut.
- No new columns or transformed aliases are introduced at dashboard build time.
- `priority_status` values are constrained to:
  - `Act Now`
  - `Watch Closely`
  - `Stable Monitor`

## Canonical dataset contracts

### 1) `monthly_metrics` (6 rows)

Grain: one row per `week_start`.

Required fields:
- `week_start` (ISO date string)
- `ed_arrivals_per_day` (number)
- `ed_arrivals_wow_delta` (number)
- `door_to_provider_minutes` (number)
- `lwbs_rate` (percent as number)
- `avg_boarding_hours` (number)
- `discharge_before_noon_rate` (percent as number)
- `patient_satisfaction_score` (number, integer scale)
- `diversion_hours` (number)
- `door_to_provider_target_minutes` (number)
- `lwbs_target_rate` (number)
- `boarding_target_hours` (number)
- `door_to_provider_wow_delta` (number)
- `lwbs_wow_delta` (number)
- `boarding_wow_delta` (number)
- `discharge_wow_delta` (number)
- `satisfaction_wow_delta` (number)
- `pressure_status` (`watch` or `critical`)

### 2) `facility_summary` (36 rows)

Grain: `week_start` + `facility_id`.

Required fields:
- `week_start` (ISO date string)
- `facility_id`
- `facility_name`
- `region`
- `ed_arrivals_per_day` (number)
- `door_to_provider_minutes` (number)
- `lwbs_rate` (number)
- `avg_boarding_hours` (number)
- `discharge_before_noon_rate` (number)
- `diversion_hours` (number)
- `patient_satisfaction_score` (number)
- `throughput_risk_score` (number)
- `is_priority_facility` (`"true"`/`"false"` string or boolean)
- `door_to_provider_rank` (number)
- `boarding_rank` (number)
- `risk_rank` (number)
- `door_to_provider_wow_delta` (number)
- `boarding_wow_delta` (number)
- `discharge_wow_delta` (number)
- `priority_status` (`Act Now` | `Watch Closely` | `Stable Monitor`)

### 3) `department_summary` (144 rows)

Grain: `week_start` + `facility_id` + `service_line`.

Allowed `service_line` values:
- `medicine`
- `telemetry`
- `observation`
- `surgery`

Required fields:
- `week_start` (ISO date string)
- `facility_id`
- `facility_name`
- `service_line`
- `admitted_ed_patients` (number)
- `avg_boarding_hours` (number)
- `discharge_before_noon_rate` (number)
- `bed_turnover_minutes` (number)
- `capacity_utilization_rate` (number)

### 4) `ed_flow` (324 rows, optional in first page)

Grain: `week_start` + `facility_id` + `acuity_band` + `shift`.

Required fields:
- `week_start` (ISO date string)
- `facility_id`
- `facility_name`
- `acuity_band`
- `shift`
- `arrivals` (number)
- `door_to_provider_minutes` (number)
- `waiting_room_minutes` (number)
- `lwbs_rate` (number)
- `admit_hold_count` (number)

### 5) `staffing_coverage` (18 rows)

Grain: `report_date` + `facility_id` + `shift`.

Required fields:
- `report_date` (ISO date string)
- `facility_id`
- `facility_name`
- `shift` (`day`, `evening`, `night`)
- `rn_fill_rate` (percent as number)
- `provider_fill_rate` (percent as number)
- `agency_hours` (number)
- `surge_gap_hours` (number)

### 6) `patient_experience` (36 rows)

Grain: `week_start` + `facility_id`.

Required fields:
- `week_start` (ISO date string)
- `facility_id`
- `facility_name`
- `patient_satisfaction_score` (number)
- `survey_response_count` (number)
- `complaint_rate` (number)
- `lwbs_rate` (number)
- `diversion_hours` (number)

## Behavioral constraints

- Six-week throughput pressure persists in `monthly_metrics` with no week missing.
- In the latest week, `metro_community` and `north_medical` hold the top two risk ranks.
- The primary causal path is:
  - Boarding deterioration and discharge bottlenecks dominate arrivals-only interpretations.
  - Staffing is a secondary amplifier, not the only cause.
- Patient experience movement should lag throughput deterioration by roughly one week.

## Binding map

- `kpi_arrivals` → `monthly_metrics` (`ed_arrivals_per_day`)
- `kpi_dtp` → `monthly_metrics` (`door_to_provider_minutes`)
- `kpi_lwbs` → `monthly_metrics` (`lwbs_rate`)
- `kpi_boarding` → `monthly_metrics` (`avg_boarding_hours`)
- `kpi_discharge` → `monthly_metrics` (`discharge_before_noon_rate`)
- `trend_dtp` → `monthly_metrics` (`door_to_provider_minutes`)
- `facility_rank` → `facility_summary` (`door_to_provider_minutes`)
- `priority_table` → `facility_summary` (`priority_status`, risk rank fields)
- `service_line_driver` → `department_summary` (`avg_boarding_hours`, `service_line`)
- `staffing_context` → `staffing_coverage` (`surge_gap_hours`)
- `experience_consequence` → `patient_experience` (`patient_satisfaction_score`)
- `flow_detail` (optional widget) → `ed_flow` (`acuity_band`, `shift`)

## Operator checks

- Monthly contract row checks must pass exactly:
  - `monthly_metrics` = 6
  - `facility_summary` = 36
  - `department_summary` = 144
  - `ed_flow` = 324
  - `staffing_coverage` = 18
  - `patient_experience` = 36
- Only `priority_status` values must be the three allowed states.
- Latest week must be the dataset max `week_start` and include both
  `Metro Community Hospital` and `North Medical Center` in top risk order.

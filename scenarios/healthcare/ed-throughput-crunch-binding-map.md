# ED Throughput Crunch Binding Map

This map translates the first materialized `ED Throughput Command View` spec
into the current DashForge runtime seams. It stays aligned to
`DashboardSpec`, `MockScenario`, and the existing dataset-widget binding model
instead of the earlier document-only blueprint.

## Artifact Alignment

| Artifact | Runtime Shape | Notes |
|----------|---------------|-------|
| `ed-throughput-crunch-preview.sqlite` | canonical mock-data artifact | SQLite is the primary scenario package unless the shape is inherently nested; this file should stay aligned to the JSON snapshot at the dataset level |
| `ed-throughput-crunch-preview-data.json` | healthcare preview-scenario asset shape | Uses `previewDatasets` with `Record<string, readonly ScenarioRow[]>` datasets and full six-week history for every weekly dataset |
| `ed-throughput-crunch-dashboard-spec.json` | serialized `DashboardSpec` JSON | Stays fully `mock`-backed and uses only supported widget types |
| This file | operator/reference map | Explains dataset usage, filter seams, and presenter-step ownership |

## Dataset Inventory

| Dataset | Materialized Rows | Purpose In First Spec | Bound In First Spec |
|---------|------------------------|---------------------|
| `monthly_metrics` | 6 | KPI band and six-week persistence trend | Yes |
| `facility_summary` | 36 | Facility concentration and priority readout across all six sites and six weeks | Yes |
| `department_summary` | 144 | Boarding and discharge driver view across six sites, four service lines, and six weeks | Yes |
| `staffing_coverage` | 18 | Current-day shift-level staffing context across all six sites | Yes |
| `patient_experience` | 36 | Downstream consequence trend across six sites and six weeks | Yes |
| `ed_flow` | 324 | Optional shift and acuity drilldown across six sites, three acuity bands, and three shifts | Not in the first command-view spec; reserved for a later builder swap |

## Widget Bindings

| Widget ID | Title | Type | Dataset | Filter / Slice | Encoded Fields | Presenter Step |
|-----------|-------|------|---------|----------------|----------------|----------------|
| `kpi_arrivals` | `ED Arrivals / Day` | `kpi` | `monthly_metrics` | latest week `2026-03-23` | `ed_arrivals_per_day`, `ed_arrivals_wow_delta` | `System Pressure` |
| `kpi_dtp` | `Door To Provider` | `kpi` | `monthly_metrics` | latest week `2026-03-23` | `door_to_provider_minutes`, `door_to_provider_wow_delta` | `System Pressure` |
| `kpi_lwbs` | `LWBS Rate` | `kpi` | `monthly_metrics` | latest week `2026-03-23` | `lwbs_rate`, `lwbs_wow_delta` | `System Pressure` |
| `kpi_boarding` | `Avg Boarding Hours` | `kpi` | `monthly_metrics` | latest week `2026-03-23` | `avg_boarding_hours`, `boarding_wow_delta` | `System Pressure` |
| `kpi_discharge` | `Discharge Before Noon` | `kpi` | `monthly_metrics` | latest week `2026-03-23` | `discharge_before_noon_rate`, `discharge_wow_delta` | `System Pressure` |
| `trend_dtp` | `Six-Week Door-To-Provider Trend` | `line` | `monthly_metrics` | six-week system series | `week_start`, `door_to_provider_minutes` | `System Pressure` |
| `facility_rank` | `Facilities Driving Delay` | `bar` | `facility_summary` | latest week `2026-03-23` | `facility_name`, `door_to_provider_minutes` | `Where It Is Concentrated` |
| `priority_table` | `Priority Sites This Week` | `table` | `facility_summary` | latest week `2026-03-23`, sorted by `risk_rank` | `priority_status`, `facility_name`, `door_to_provider_minutes`, `avg_boarding_hours`, `discharge_before_noon_rate`, `risk_rank` | `Where It Is Concentrated` and `What We Do Next` |
| `service_line_driver` | `Boarding vs Discharge Flow` | `stacked_bar` | `department_summary` | latest week `2026-03-23`, hotspot facilities only | Encoded: `service_line`, `facility_name`, `avg_boarding_hours`; supporting columns: `discharge_before_noon_rate` | `What Is Driving It` |
| `staffing_context` | `Coverage Stress By Shift` | `bar` | `staffing_coverage` | Metro, North, Saint Catherine only | `shift`, `facility_name`, `surge_gap_hours`, `rn_fill_rate`, `provider_fill_rate` | `What Is Driving It` |
| `experience_consequence` | `Throughput Consequences` | `line` | `patient_experience` | Metro, North, Saint Catherine across six weeks | Encoded: `week_start`, `facility_name`, `patient_satisfaction_score`; supporting columns: `lwbs_rate`, `diversion_hours` | `What It Is Causing` |

## Runtime Notes

- The runtime contract matters here: current `line` widgets encode `x`, `y`,
  and optional `series`, while `stacked_bar` widgets encode `x`, `y`, and a
  required `series`. Supporting dataset columns can still be present for
  captions, presenter notes, or later spec revisions without being visualized
  by the current chart instance.
- The preview SQLite artifact is canonical for the materialized mock-data
  package. The JSON snapshot exists because the current demo/runtime seam still
  consumes nested `previewDatasets`.
- `facility_summary`, `department_summary`, `patient_experience`, and `ed_flow`
  now carry full six-week history instead of only a latest-week snapshot, so
  future builder swaps can reuse the same preview artifact without regenerating
  the scenario package.
- The preview JSON and serialized `DashboardSpec` match the current
  `MockScenario` / `DashboardSpec` shapes, but this scenario is not yet
  registered in `frontend/src/mock-data/scenarioCatalog.ts`. A future app
  integration slice still needs to add the healthcare-pack entry and catalog
  registration before `createDashboardDataAdapter()` can resolve the spec
  directly at runtime.
- `is_priority_facility` remains string-valued (`"true"` / `"false"`) in the
  preview payload because current mock rows are still constrained to
  `number | string | undefined`.
- The first command-view spec deliberately binds only five of the six datasets.
  `ed_flow` stays materialized but unbound so the optional Band 3 drilldown can
  be swapped in later without changing the scenario payload contract.

## Presenter-Step Ownership

| Presenter Step | Primary Widgets | Message |
|----------------|-----------------|---------|
| `System Pressure` | `kpi_dtp`, `kpi_lwbs`, `kpi_boarding`, `trend_dtp` | The system has been above target for six weeks; demand stayed high, but waits and boarding worsened faster than arrivals alone explain. |
| `Where It Is Concentrated` | `facility_rank`, `priority_table` | Metro Community and North Medical drive most of the deterioration and should be prioritized first. |
| `What Is Driving It` | `service_line_driver`, `staffing_context` | Boarding concentration in medicine and telemetry is the encoded lead signal; discharge friction remains supporting context in the subtitle, caption, and presenter narrative. |
| `What It Is Causing` | `experience_consequence` | Satisfaction decline is the encoded trend; LWBS and diversion remain supporting context in the dataset and narrative for the hotspot facilities. |
| `What We Do Next` | `priority_table`, `service_line_driver`, `staffing_context` | Focus discharge flow, telemetry release, and evening surge coverage this week in the top two sites. |

## Reserved Dataset Note

`ed_flow` is intentionally materialized in the preview data even though the
first command-view spec does not bind it. That keeps the optional blueprint
drilldown available for a later builder demo swap without forcing a denser
first page than the current command-view layout needs. The preview artifact
therefore satisfies the scenario package's minimum record-count guidance even
though the first page only uses a bounded subset of that payload.

# ED Throughput Crunch Materialization Verification

Date: 2026-04-01
Reviewer: Codex
Scope:
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
- `scenarios/healthcare/ed-throughput-crunch-data-design.md`
- `frontend/src/core/spec/dashboardSpec.ts`
- `frontend/src/core/spec/dashboardSchema.ts`

## Findings

### M001 - Binding map overstates what two charts actually encode

Severity: Medium

The binding map says `service_line_driver` encodes both boarding and discharge,
and says `experience_consequence` encodes satisfaction, LWBS, and diversion
([scenarios/healthcare/ed-throughput-crunch-binding-map.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-binding-map.md#L39),
[scenarios/healthcare/ed-throughput-crunch-binding-map.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-binding-map.md#L41)).
That is not what the serialized spec actually binds.

The current `DashboardSpec` contract only allows:
- line: `x`, `y`, optional `series`
- stacked bar: `x`, `y`, required `series`

([dashboardSpec.ts](/Users/lee/projects/dashForge/frontend/src/core/spec/dashboardSpec.ts#L267),
[dashboardSpec.ts](/Users/lee/projects/dashForge/frontend/src/core/spec/dashboardSpec.ts#L289))

The spec therefore binds:
- `service_line_driver` to `service_line`, `avg_boarding_hours`, and
  `facility_name`, with `discharge_before_noon_rate` present only in the data
  columns, not in chart encoding
  ([ed-throughput-crunch-dashboard-spec.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json#L318))
- `experience_consequence` to `week_start`,
  `patient_satisfaction_score`, and `facility_name`, with `lwbs_rate` and
  `diversion_hours` present only in the data columns, not in chart encoding
  ([ed-throughput-crunch-dashboard-spec.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json#L400))

Impact:
- The JSON spec remains plausible against the current contract.
- The story still mostly lands because the captions and narrative carry the
  missing context.
- The binding map is not an accurate blueprint-to-runtime translation today and
  would mislead a future operator about what the charts actually show.

Recommended repair:
- Update the binding map to distinguish encoded fields from supporting dataset
  columns.
- Optionally soften the claims that those two charts themselves visualize
  discharge, LWBS, and diversion.

## Verified

- The preview payload contains all six canonical datasets at the planned row
  counts: `6 / 36 / 144 / 324 / 18 / 36`
  ([ed-throughput-crunch-binding-map.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-binding-map.md#L18)).
- The data tells the intended scenario story from the design doc:
  six-week worsening in enterprise throughput metrics, Metro Community and
  North Medical as the top two hotspots, medicine and telemetry as the main
  boarding drivers, and downstream patient-experience erosion
  ([ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md#L10),
  [ed-throughput-crunch-preview-data.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-preview-data.json#L8),
  [ed-throughput-crunch-preview-data.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-preview-data.json#L130)).
- The materialized spec stays inside the current DashboardSpec surface:
  supported intent, supported theme, `mock` data mode, 12-column layout, only
  supported widget types, and a complete five-part story arc with presenter
  notes
  ([ed-throughput-crunch-dashboard-spec.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json#L18),
  [ed-throughput-crunch-dashboard-spec.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json#L40),
  [ed-throughput-crunch-dashboard-spec.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json#L445),
  [dashboardSchema.ts](/Users/lee/projects/dashForge/frontend/src/core/spec/dashboardSchema.ts#L690)).
- The blueprint translation is directionally correct: unsupported text cards
  were moved into `narrative`, unsupported combo/heatmap ideas were translated
  into supported chart types, and `ed_flow` was intentionally materialized but
  left out of the first page for density control
  ([ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md#L79),
  [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md#L97),
  [ed-throughput-crunch-dashboard-spec.json](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json#L322),
  [ed-throughput-crunch-binding-map.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-binding-map.md#L58)).

## Verdict

Pass with one medium documentation defect.

The generated data and serialized `DashboardSpec` do tell the intended ED
throughput story and are plausible against the current `DashboardSpec`
contract. The remaining issue is in the binding map: it currently describes two
charts as if they encode more measures than the runtime contract permits.

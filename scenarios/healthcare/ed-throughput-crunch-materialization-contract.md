# ED Throughput Crunch Materialization Contract

## Objective

Turn the documented `ed-throughput-crunch` healthcare scenario into real
frontend artifacts that run on the current DashForge baseline:

- one SQLite-backed mock-data artifact plus a nested JSON snapshot for the
  current frontend preview/runtime seam,
- one concrete `DashboardSpec` for `ED Throughput Command View`,
- one binding map that ties the materialized data package to the first
  command-view dashboard and presenter steps.

This slice is about materializing one scenario into working mock-data and spec
artifacts. It is not a request to expand the widget system, redesign the spec,
or reopen Sprint 9 runtime architecture.

## Canon Sources

This contract must stay aligned with:

- `AGENTS.md`
- `context.md`
- `architecture.md`
- `frontend/src/core/spec/dashboardSpec.ts`
- `frontend/src/mock-data/mockScenarioTypes.ts`
- `scenarios/healthcare/ed-throughput-crunch.md`
- `scenarios/healthcare/ed-throughput-crunch-data-design.md`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
- `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`

If this contract and those sources disagree, the canon sources win.

## Starting Baseline

The current repo already has:

- scenario design/package docs under `scenarios/healthcare/`,
- a mock-data architecture that treats SQLite as canonical and JSON snapshots
  as a current frontend convenience seam,
- one materialized JSON preview package for `ed-throughput-crunch`,
- one serialized `DashboardSpec` for the first command view.

The current runtime also has hard product limits that this slice must respect:

- `DashboardSpec` supports only `kpi`, `line`, `bar`, `stacked_bar`, `donut`,
  `table`, `sparkline`, and `gauge` widgets.
- There is no standalone markdown/text-card widget in the schema.
- There is no combo-chart or heatmap primitive in the schema.
- `MockScenario` datasets remain `Record<string, readonly ScenarioRow[]>`
  rather than strongly typed per-dataset interfaces.

## In Scope

### 1. Real Mock-Data Materialization

- Materialize the six scenario datasets named in the healthcare scenario canon:
  - `monthly_metrics`
  - `facility_summary`
  - `department_summary`
  - `ed_flow`
  - `staffing_coverage`
  - `patient_experience`
- Produce `scenarios/healthcare/ed-throughput-crunch-preview.sqlite` as the
  canonical mock-data artifact for this package.
- Retain `scenarios/healthcare/ed-throughput-crunch-preview-data.json` as the
  nested frontend snapshot because the current preview/runtime seam still
  consumes `previewDatasets` JSON.
- Keep the mock data plausible, deterministic, and aligned to the narrative
  rules in the scenario brief and data design.

### 2. Concrete DashboardSpec Materialization

- Create one typed `DashboardSpec` module for `ED Throughput Command View`.
- Keep the spec in `mock` mode with `packId: "healthcare"` and
  `scenarioId: "ed-throughput-crunch"`.
- Bind widgets only to the six scenario datasets above.
- Include a real `narrative` block with a complete story arc and presenter
  notes aligned to the five-step walkthrough already defined in the scenario
  blueprint.

### 3. Runtime-Compatible Blueprint Translation

- Translate the scenario blueprint into the current widget surface without
  inventing new primitives.
- Move the blueprint's text-card content into `DashboardSpec.narrative`
  instead of inventing unsupported text widgets.
- Translate unsupported combo/heatmap ideas into supported bar, stacked-bar,
  line, or table views while preserving the business story.

### 4. Verification Coverage

- Verify the SQLite artifact and JSON snapshot stay aligned at the dataset
  level.
- Verify the new concrete spec validates against the current schema and
  references only materialized datasets from the package.

## Explicitly Out Of Scope

- New chart primitives such as heatmap, combo chart, markdown card, or rich
  text widget
- New runtime data adapters or any new `live` / `hybrid` implementation work
- New external dependencies
- A broader healthcare template-system redesign
- New warehouse, backend, or credential-management work
- Reopening Sprint 8 or Sprint 9 architecture decisions
- Multi-scenario demo packaging beyond `ed-throughput-crunch`

## Required Outputs

The implementation defined by this contract must produce, at minimum:

- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- focused verify/repair/review artifacts covering the materialized package

The planning outputs for this slice are:

- `scenarios/healthcare/ed-throughput-crunch-materialization-contract.md`
- `plans/ed-throughput-crunch-materialization-plan.md`

## Materialization Decisions

### Mock-Data Contract

- The canonical scenario ID stays `ed-throughput-crunch`.
- The pack ID stays `healthcare`.
- Dataset IDs stay exactly as written in the scenario brief and data design.
- The canonical materialized mock-data artifact is SQLite unless the shape is
  inherently nested and cannot be represented cleanly in relational tables.
- For this scenario, the SQLite file is primary and the JSON file is the
  nested snapshot companion for the current frontend seam.
- The scenario must satisfy the minimum row counts from the data design unless
  a later implementation note records a narrower deliberate exception.

### DashboardSpec Contract

- The concrete spec title is `ED Throughput Command View`.
- The spec is a first-class typed `DashboardSpec`, not ad hoc JSON.
- The spec stays `mock`-backed and must not require `live` or `hybrid`.
- The spec should target one 12-column page and one clean executive-operational
  scroll.
- The spec should prefer approximately 11 to 12 widgets, not an overloaded
  long-form page.

### Blueprint Translation Rules

- `Immediate Intervention Focus` and `Mock Today, Live/Hybrid Later` belong in
  `narrative.executiveSummary`, `storyArc`, and `presenterNotes`, not as new
  unsupported widget types.
- `Coverage Stress By Shift` must materialize as a supported `bar`,
  `stacked_bar`, or `table` widget.
- `Shift And Acuity Pressure` is optional and should materialize only if it
  improves the bounded spec without crowding the page.
- `Boarding vs Discharge Flow` must become a supported chart shape even if the
  original blueprint label suggests a combo chart.

## Ordered Work

1. Lock the file-path contract for the SQLite artifact, JSON snapshot, and
   dashboard assets.
2. Materialize the scenario datasets into SQLite plus nested JSON snapshot.
3. Build the concrete serialized `DashboardSpec`.
4. Document the binding map between widgets, datasets, and presenter steps.
5. Verify the package against the current runtime contract.

## Acceptance Criteria

1. `ed-throughput-crunch-preview.sqlite` exists as the canonical mock-data
   artifact for this materialized scenario package.
2. The scenario's datasets match the healthcare canon and support the intended
   ED throughput story without relying on unsupported primitives.
3. The nested JSON snapshot exists for the current frontend preview/runtime
   seam and is consistent with the SQLite artifact.
4. A concrete `DashboardSpec` exists for `ED Throughput Command View` and is
   shaped against the current schema.
5. The spec keeps the executive-throughput narrative visible through both its
   widget set and its `narrative` block.
6. The slice stays inside existing mock/runtime seams and does not widen into
   new feature development.

## Verification Expectations

- Confirm the SQLite artifact contains the canonical scenario tables and row
  counts expected by the data design.
- Confirm the JSON snapshot stays consistent with the SQLite artifact at the
  dataset level.
- Validate the new spec against the existing DashboardSpec contract.
- Prefer one host-environment browser rehearsal later, but do not make that a
  prerequisite for completing this bounded materialization slice inside the
  sandbox.

# ED Throughput Crunch Materialization Plan

## Goal

Materialize the ED throughput healthcare scenario into concrete frontend assets
that the current DashForge runtime and demo package can actually use: a
canonical SQLite mock-data artifact, a nested JSON snapshot for the current
frontend preview seam, and a typed `DashboardSpec`.

## Planning Assumptions

- The scenario canon is already defined by the existing healthcare scenario,
  data design, blueprint, and build checklist docs.
- The current scenario-demo package still benefits from a nested JSON snapshot
  even though SQLite remains the canonical mock-data artifact.
- The current `DashboardSpec` surface is the hard boundary for this slice.
- Unsupported blueprint concepts must be translated, not implemented as new
  primitives.

## Deliverables

- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- focused verify/repair/review artifacts for the materialized package

## Bounded Decisions

### 1. Mock-Data Storage

Store the materialized scenario rows in SQLite as the canonical artifact and
retain a nested JSON snapshot for the current frontend preview/runtime seam.
SQLite is primary; JSON exists because the current preview package still
expects nested `previewDatasets`.

### 2. Concrete Spec Location

Place the typed starter spec in
`frontend/src/sample/edThroughputCrunchDashboard.ts` because the repo already
uses `frontend/src/sample/` for concrete typed dashboard fixtures.

### 3. Blueprint Translation

Keep the page faithful to the scenario story, but translate unsupported widget
concepts as follows:

- intervention and delivery-note text become `narrative` content
- staffing heatmap becomes a supported bar/stacked-bar/table view
- combo-style driver view becomes a supported single-chart interpretation with
  narrative support

## Ordered Work

### 1. Lock The Artifact Surface

Objective:
Confirm the exact files and artifact relationships this slice will touch before
adding data.

Work:

- confirm the SQLite artifact path
- confirm the JSON snapshot path
- confirm the concrete spec file path

Done when:

- the implementation write set is explicit
- no task in the slice requires a new runtime primitive

### 2. Materialize The Scenario Datasets

Objective:
Create the canonical mock-data package for the ED throughput scenario.

Work:

- build a SQLite artifact containing:
  - `monthly_metrics`
  - `facility_summary`
  - `department_summary`
  - `ed_flow`
  - `staffing_coverage`
  - `patient_experience`
- emit a nested JSON snapshot with the same datasets for current frontend/demo
  consumption
- keep values aligned to the narrative rules:
  - six-week sustained pressure
  - Metro Community and North Medical as top hotspots
  - medicine and telemetry as main boarding drivers
  - experience decline lagging throughput pressure

Done when:

- all six datasets exist in SQLite
- the JSON snapshot reflects the same dataset package
- row counts meet or exceed the documented minimums
- the latest-week rows tell the intended management story on first read

### 3. Build The Concrete DashboardSpec

Objective:
Turn the blueprint into one runnable typed dashboard artifact.

Required spec shape:

- `title`: `ED Throughput Command View`
- `intent.type`: `risk_alert`
- `intent.audience`: `client_demo` or another canon-aligned audience chosen
  once and used consistently
- `intent.industry`: `healthcare`
- `intent.scenario`: `ed-throughput-crunch`
- `dataContext.mode`: `mock`
- `dataContext.mock.packId`: `healthcare`
- `dataContext.mock.scenarioId`: `ed-throughput-crunch`
- 12-column layout with a single-page executive-operational flow

Required widget groups:

- five KPI widgets from `monthly_metrics`
- one six-week trend line from `monthly_metrics`
- one facility comparison bar from `facility_summary`
- one priority table from `facility_summary`
- one service-line driver widget from `department_summary`
- one staffing-context widget from `staffing_coverage`
- one consequence widget from `patient_experience`
- optional one drilldown widget from `ed_flow` only if the page stays clean

Required narrative content:

- a complete `storyArc`
- an executive summary aligned to the scenario's business question
- presenter notes matching the five-step flow:
  1. `System Pressure`
  2. `Where It Is Concentrated`
  3. `What Is Driving It`
  4. `What It Is Causing`
  5. `What We Do Next`

Done when:

- the spec validates as a `DashboardSpec`
- every dataset-backed widget points to a real registered dataset
- the narrative closes the intervention/handoff story without unsupported text
  widgets

### 4. Add Focused Verification

Objective:
Prove the materialized scenario works at the seam level.

Minimum tests:

- SQLite artifact contains the expected tables and row counts
- JSON snapshot dataset ids and counts match the SQLite package
- schema validation test for the concrete spec
- binding-map check confirming the spec only references real datasets/fields

Recommended commands:

```bash
npm --prefix frontend test
npm --prefix frontend run build
```

Done when:

- the changed tests pass
- the frontend build stays green

## Widget Translation Matrix

| Blueprint Element | Runtime Translation |
|-------------------|---------------------|
| `Coverage Stress By Shift` heatmap | supported bar, stacked-bar, or table |
| `Boarding vs Discharge Flow` combo | supported bar or stacked-bar backed by `department_summary`, with discharge context carried in field choice, subtitle, caption, or narrative |
| `Immediate Intervention Focus` card | `narrative.executiveSummary` plus presenter notes |
| `Mock Today, Live/Hybrid Later` card | presenter notes or closing narrative copy |

## Risks And Controls

| Risk | Control |
|------|---------|
| The spec tries to mirror the blueprint too literally and needs unsupported widgets | Translate unsupported concepts into current primitives and narrative content |
| Mock data becomes exhaustive instead of directional | Keep to the documented minimum counts and story rules |
| SQLite and JSON drift apart | Treat SQLite as canonical and generate the JSON snapshot from the same dataset package |
| The page becomes overcrowded | Treat the drilldown widget as optional and keep the core page near 11 widgets |

## Verification Matrix

| Area | Proof |
|------|-------|
| Dataset integrity | all six datasets exist in SQLite and support the intended story |
| Snapshot consistency | JSON snapshot matches the SQLite package |
| Spec validity | concrete ED throughput spec passes schema validation |
| Runtime compatibility | dataset references resolve through the materialized dataset package |
| Scope control | no new widget types, adapters, or dependencies are introduced |

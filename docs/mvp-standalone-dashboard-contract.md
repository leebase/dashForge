# MVP Standalone Dashboard Contract

## Overview

The clarified DashForge MVP is not the builder shell.

The next bounded slice must prove one complete workshop outcome end to end:

- define one believable scenario,
- use generated data for that scenario, and
- open directly into a free-standing dashboard that a client or consultant can
  read immediately.

For this slice, the canonical scenario is
`healthcare:ed-throughput-crunch` with the registered starter template
`tpl.healthcare.ed-throughput-command`.

This choice is deliberate. It is the most complete scenario package in the
repo today: it already has a scenario brief, data contract, dashboard
blueprint, materialized SQLite plus JSON preview assets, runtime registration,
and a dedicated template path. The slice should use that package to turn
DashForge's default app experience into a scenario-first dashboard experience
instead of inventing a new demo path.

## Canon Alignment

This contract is bounded by:

- `AGENTS.md`
- `context.md`
- `sprint-plan.md`
- `WHERE_AM_I.md`
- `product-definition.md`
- `architecture.md`
- `README.md`
- `scenarios/healthcare/ed-throughput-crunch.md`
- `scenarios/healthcare/ed-throughput-crunch-data-design.md`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `frontend/src/mock-data/scenarioCatalog.ts`
- `frontend/src/mock-data/templateCatalog.ts`
- `frontend/src/features/builder/templateInstantiation.ts`

If those sources and this contract diverge, the canon sources win and this
contract must be refreshed.

## In Scope

### 1. One Standalone MVP Scenario

- Use `healthcare:ed-throughput-crunch` as the single default MVP scenario.
- Preserve the current scenario and template contract instead of introducing a
  parallel hard-coded demo mode.
- Keep the primary standalone artifact aligned to the existing command-view
  narrative: system pressure, concentration, drivers, consequences, and action.

### 2. Generated Data As The MVP Input

- Treat the existing ED throughput package as the canonical generated-data
  input for this slice:
  - `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
  - `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
  - `frontend/src/mock-data/healthcareEdThroughputCrunchPreviewData.json`
- The standalone experience must render from the same adapter-facing scenario
  data contract already proven in the repo.
- This slice may reuse the existing generated artifact family; it does not need
  a second mock-data source or ad hoc inline widget payloads.

### 3. Free-Standing Runtime As The Default App Surface

- Change the primary app experience so `frontend/src/App.tsx` opens into a
  dedicated standalone runtime, not the builder shell.
- Add a focused runtime entry point such as
  `frontend/src/features/runtime/StandaloneDashboardApp.tsx`.
- Render the dashboard through the existing shared spec and adapter seams,
  using the current scenario/template registration path and current widget
  runtime.
- The builder must remain available only through an explicit operator action,
  not as the wrapper around the MVP experience.

### 4. Preserve The Shared Runtime Contracts

- Keep `DashboardSpec` as the canonical artifact.
- Keep widgets and runtime components dependent on `DataAdapter`.
- Reuse the existing renderer and current scenario/template contracts instead
  of creating a second standalone-only widget system.
- Preserve the existing builder surface as a secondary operator mode for later
  edits, rehearsal, or troubleshooting.

### 5. Focused Standalone Verification

- Add automated coverage that proves the default app surface is standalone.
- Verify that the builder is reachable only when explicitly requested.
- Verify that the frontend remains green after the standalone shift.

## Out of Scope

- A multi-scenario launcher or pack browser as part of this slice
- New scenario packs or a new default scenario beyond ED throughput
- New chart primitives, theme expansion, or DashboardSpec redesign
- New live-binding capabilities, warehouse adapters, or backend brokering
- Broad builder UX expansion beyond keeping the current builder reachable
- A new Python/data-generation surface for ED throughput in this same slice
- Replacing the current scenario/template catalogs with a different registry
- Broad repo cleanup unrelated to the standalone MVP runtime
- New runtime dependencies without explicit approval

## Required Outputs

- `docs/mvp-standalone-dashboard-contract.md`
- `plans/mvp-standalone-dashboard-plan.md`
- `frontend/src/App.tsx` updated so the default app surface is standalone
- `frontend/src/features/runtime/StandaloneDashboardApp.tsx`
- focused standalone coverage in `frontend/src/App.test.tsx` and any directly
  related runtime tests under `frontend/src/`

No new scenario family is required for this slice. The existing ED throughput
scenario package is the bounded MVP input.

## Acceptance Checks

1. The repo contains this contract and
   `plans/mvp-standalone-dashboard-plan.md`.
2. The default app load opens into a free-standing ED throughput dashboard
   instead of the builder shell.
3. The default surface does not show builder-first chrome such as the builder
   hero, widget palette, property rail, or builder toolbar controls.
4. The standalone surface renders through the existing `DashboardSpec` plus
   `DataAdapter` path using the current ED throughput scenario/template
   contracts and generated data inputs.
5. The builder is still reachable, but only after an explicit user action such
   as a dedicated button or mode switch from the standalone surface.
6. The slice does not introduce a second schema, a second renderer, or a new
   ad hoc widget-data path.
7. `npm --prefix frontend test` passes.
8. `npm --prefix frontend run build` passes.

## Constraints

- Keep the slice frontend-first and bounded to the current playbook shape.
- Treat the existing ED throughput package as the canonical generated-data
  baseline for this MVP slice.
- Prefer the existing scenario/template registration seam over direct custom
  wiring in `App.tsx`.
- Do not make the builder shell the parent container for the standalone
  experience.
- Do not reopen Sprint 9 live-binding scope or broaden into backend work.
- Do not add dependencies or schema churn to achieve the standalone shift.
- If exact runtime parity requires a tradeoff between template instantiation and
  the serialized command-view spec, prefer the path that keeps the registered
  scenario/template contract authoritative.

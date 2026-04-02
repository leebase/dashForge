# ED Throughput Crunch Contract — Scenario-to-Dashboard Demo Package

## Purpose

Define a bounded workflow that turns `ed-throughput-crunch` into a reusable,
workshop-ready DashForge demo package with no runtime or schema changes.

This package must produce the same visible outcome every time:

- scenario-framed healthcare operations narrative,
- stable dashboard structure from existing runtime artifacts,
- rehearsable builder and presenter flow,
- structured handoff continuity into mock/live/hybrid-ready workflow assumptions.

## Canon Alignment

This contract is bound to:

- `AGENTS.md`
- `product-definition.md`
- `architecture.md`
- `context.md`
- `scenarios/healthcare/ed-throughput-crunch.md`
- `scenarios/healthcare/ed-throughput-crunch-data-design.md`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
- `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`
- `scenarios/healthcare/client-presentation-script.md`
- `frontend/src/mock-data/scenarioCatalog.ts`
- `frontend/src/mock-data/templateCatalog.ts`
- `frontend/src/features/builder/templateInstantiation.ts`

If any source document changes, this contract must be refreshed before the next
demo package run.

## Boundaries

### In Scope

- Use existing ED-throughput runtime registration and template instantiation to
  build a demo package for `healthcare:ed-throughput-crunch`.
- Use existing assets and runtime paths:
  - `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
  - `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
  - `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
  - `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- Deliver a bounded rehearsal run using:
  - one initial executive first-pass presentation,
  - two bounded builder edits max,
  - five-step presenter sequence,
  - structured close.
- Keep production-transition framing limited to existing Sprint 9 capability statements
  (`mock` primary, bounded live/hybrid language).

### Explicitly Out of Scope

- New chart types, adapters, schema changes, or runtime capabilities.
- New scenario-generation logic.
- Additional scenario packs.
- External warehouse/backend integration.
- Full proposal-deck or pricing deliverables.

## Source of Truth Requirements

1. Scenario framing and business question come from
   `ed-throughput-crunch.md`.
2. Data contract and widget mapping come from
   `ed-throughput-crunch-data-design.md`.
3. Dashboard sequence and widget intent come from
   `ed-throughput-crunch-dashboard-blueprint.md`.
4. Rehearsal and close conditions come from
   `ed-throughput-crunch-build-checklist.md`.
5. Default template and scenario route must remain:
   `tpl.healthcare.ed-throughput-command` for `healthcare:ed-throughput-crunch`.

## Bounded Output Set

The package must include and keep these files coherent:

- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-contract.md`
- `plans/ed-throughput-crunch-demo-plan.md`

No other file-family additions are required in this workflow.

## Workflow Gates

All five gates must pass in order for package readiness:

1. **Scenario-Narrative Gate**
   - Scenario narrative, audience, and business question match the source.
   - No broad healthcare-generalization that drops the operational problem.
2. **Data Contract Gate**
   - `monthly_metrics` row count = 6.
   - `facility_summary` row count = 36.
   - `department_summary` row count = 144.
   - `ed_flow` row count = 324.
   - `staffing_coverage` row count = 18.
   - `patient_experience` row count = 36.
   - Latest week shows Metro Community and North Medical as top throughput hotspots.
3. **Blueprint Mapping Gate**
   - At least the nine canonical widgets exist with correct dataset sources.
   - Facility concentration and driver/consequence logic is present.
   - `priority_status` values are constrained to:
     `Act Now`, `Watch Closely`, `Stable Monitor`.
4. **Rehearsal Gate**
   - Presenter sequence can be completed in five steps.
   - Exactly two bounded builder edits are exercised.
   - AI workflow, if used, is apply/discard and non-blocking.
5. **Continuity Gate**
   - Handoff explicitly states: structured artifact persists across builder,
     presenter, and export.
   - No claims beyond bounded mock/live/hybrid support.

If any gate fails, execution pauses until the blocker is fixed and all subsequent
gates are rerun.

## Acceptance Standard

`ed-throughput-crunch` is demo-ready when an operator can run the flow on a
host-capable environment from the same package inputs and complete all gates,
ending with:

- a structured dashboard handoff (spec, presenter, export continuity),
- no unplanned runtime changes,
- one coherent recommendation frame: concentration, causes, consequences, and
  intervention priorities.

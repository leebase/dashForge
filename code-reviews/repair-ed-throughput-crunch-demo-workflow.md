# Repair — ED Throughput Crunch Demo Workflow

## Summary

Repaired the one verification finding from
[verify-ed-throughput-crunch-demo-workflow.md](/Users/lee/projects/dashForge/code-reviews/verify-ed-throughput-crunch-demo-workflow.md):
the `Priority Sites This Week` table now has an explicit plain-language status
contract defined in the canonical data design and referenced consistently by
the dashboard blueprint and operator checklist.

## Finding Addressed

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| EDV001 | Medium | ✅ Repaired | Added a required `priority_status` field to `facility_summary`, normalized its bounded values to `Act Now`, `Watch Closely`, and `Stable Monitor`, and updated downstream build guidance to use that same field. |

## Changes Made

- Added `priority_status` to the required derived fields for
  `facility_summary` in
  [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md).
- Updated the dashboard-to-data mapping so the priority table explicitly
  requires `priority_status` in
  [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md).
- Normalized the canonical `priority_status` values in
  [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md)
  to match the exact title-cased labels used in the downstream operator-facing
  docs.
- Updated the widget specification so the priority table uses
  `priority_status` as its management-language lead label in
  [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md).
- Updated the label-pass checklist so operators use the bounded
  `priority_status` labels `Act Now`, `Watch Closely`, and `Stable Monitor`
  instead of inventing copy during assembly in
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md).

## Verification Performed

This repair was documentation-only. I re-read the affected sections after the
patch and confirmed that:

- the canonical data design now defines the missing status field and derivation
  rule,
- the dashboard blueprint points the widget to that same field,
- the build checklist tells the operator to use the same bounded labels, and
- the original verification finding is fully closed without widening the scope
  beyond the Sprint 9-bounded demo package.

## Outcome

EDV001 is closed. The data design, dashboard blueprint, and operator checklist
now share the same contract for how the priority table should express
management status.

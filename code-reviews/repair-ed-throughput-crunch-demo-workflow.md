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
- Updated action-path language so instructions reference the generated spec path:
  `narrative.storyArc.callToAction.commentary` in
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md)
  and
  [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md).
- Added generated artifacts to the requested attempt-1 repair folder:
  - `ed-throughput-crunch-dashboard-spec.json`
  - `ed-throughput-crunch-preview-data.json`
  - `ed-throughput-crunch-preview.sqlite`
  - `ed-throughput-crunch-binding-map.md`
  - `repair-attempt-1-manifest.txt` at
    `/Users/lee/projects/dashForge/.agent-orch-scratch/0700a8a5990b/repair_demo_artifacts/attempt-1`.

## Verification Performed

This repair was documentation-only plus artifact staging.
- I re-read the affected documentation sections after the patch and confirmed the
  `priority_status` contract and all call-to-action references now align with the
  shipped spec path.
- I verified the attempt-1 repair folder now contains the generated artifacts
  required by the verification workflow plus manifest metadata.

## Additional Repair Findings Addressed

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| EDV005 | Low | ✅ Repaired | Updated two walkthrough files to reference
  `narrative.storyArc.callToAction.commentary` so rehearsal instructions match
  the generated spec path.
| EDV006 | Low | ✅ Repaired | Populated
  `/Users/lee/projects/dashForge/.agent-orch-scratch/0700a8a5990b/repair_demo_artifacts/attempt-1`
  with scenario artifacts and a repair manifest for review replay continuity.

## Outcome

EDV001 is closed. The data design, dashboard blueprint, and operator checklist
now share the same contract for how the priority table should express
management status. EDV005 is also closed and attempt-1 scratch evidence now
includes the requested generated artifacts for this run.

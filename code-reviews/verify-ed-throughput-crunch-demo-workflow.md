# Verification — ED Throughput Crunch Demo Workflow

## Summary

Verified the ED throughput demo-package workflow by reading the governing
instructions, the scenario canon, the demo contract/plan, and the three
generated scenario artifacts:

- [AGENTS.md](/Users/lee/projects/dashForge/AGENTS.md)
- [skills/test-as-lee.md](/Users/lee/projects/dashForge/skills/test-as-lee.md)
- [ed-throughput-crunch-contract.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-contract.md)
- [ed-throughput-crunch-demo-plan.md](/Users/lee/projects/dashForge/plans/ed-throughput-crunch-demo-plan.md)
- [ed-throughput-crunch.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch.md)
- [client-presentation-script.md](/Users/lee/projects/dashForge/scenarios/healthcare/client-presentation-script.md)
- [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md)
- [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md)
- [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md)

Overall, the package tells one coherent story from scenario to dashboard:

- the business question stays fixed on worsening ED congestion and weekly
  intervention priority,
- Metro Community and North Medical remain the explicit hotspot facilities,
- the page structure moves from system pressure to concentration, drivers,
  consequences, and action,
- the builder, presenter, AI, and export moments all stay bounded to the
  closed Sprint 9 product surface,
- and the operator checklist preserves the same narrative instead of turning
  the demo into a generic feature tour.

## Scope

This verification pass focused on document coherence, not runtime execution.
No product code was changed and no browser rehearsal was attempted in this
pass.

## Checks Run

| Check | Result | Notes |
|------|--------|-------|
| Read project guardrails and current repo state | ✅ Pass | `AGENTS.md`, `context.md`, `result-review.md`, and `sprint-plan.md` agree that Sprint 9 is closed and this is a bounded follow-on package slice. |
| Compare contract and plan to scenario canon | ✅ Pass | The contract and plan stay aligned to the scenario brief and client presentation script. |
| Compare generated artifacts to contract/plan | ✅ Pass with finding | Data design, blueprint, and checklist mostly align on story, sequencing, and bounded Sprint 9 positioning. |
| Host/browser rehearsal | Not run | Still intentionally deferred to a host-capable environment. |

## What Passed

- The contract and plan translate the source scenario into a bounded package
  rather than a new product sprint:
  [ed-throughput-crunch-contract.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-contract.md#L5),
  [ed-throughput-crunch-demo-plan.md](/Users/lee/projects/dashForge/plans/ed-throughput-crunch-demo-plan.md#L5).
- The data design preserves the scenario's core narrative and dataset
  expectations, including the six-week time horizon, hotspot facilities,
  boarding/discharge driver framing, and downstream consequence timing:
  [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md#L10),
  [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md#L85).
- The dashboard blueprint turns that data story into a readable page shape with
  the expected progression from executive signal to action:
  [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md#L20),
  [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md#L29),
  [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md#L186).
- The operator checklist uses the same page title, the same five-step presenter
  sequence, the same two rehearsal edits, and the same bounded mock/live close:
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md#L9),
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md#L129),
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md#L145),
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md#L184).

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| EDV001 | Medium | Data-to-dashboard contract | [ed-throughput-crunch-dashboard-blueprint.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md#L144), [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md#L122), [ed-throughput-crunch-data-design.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-data-design.md#L317) | The blueprint expects the `Priority Sites This Week` table to include a plain-language management status, and the checklist tells the operator to make table labels read like management status rather than raw metric names. But the data design only maps that table to facility name, deltas, and risk rank, with no explicit `status` field or derivation rule. That leaves one of the page's key narrative widgets under-specified at the data layer and forces the operator to invent status wording during assembly. | Add one explicit table-status field or derivation rule in the data design, such as `priority_status` or `intervention_tier`, with bounded values and a rule tied to risk rank / delta patterns. Then reference that same field in the blueprint widget spec and checklist copy guidance. |

## Residual Risks

- The package has not yet been proved in a real browser rehearsal. The
  contract/plan/checklist all correctly defer that to a host-capable
  environment, but it is still a real readiness gate before client use:
  [ed-throughput-crunch-contract.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-contract.md#L175),
  [ed-throughput-crunch-demo-plan.md](/Users/lee/projects/dashForge/plans/ed-throughput-crunch-demo-plan.md#L183),
  [ed-throughput-crunch-build-checklist.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch-build-checklist.md#L219).

## Outcome

The ED throughput demo-package materials are coherent enough to proceed. The
scenario, data design, dashboard blueprint, and operator checklist are telling
the same overall story and stay inside the intended Sprint 9 product boundary.

One medium documentation gap remains before I would call the package fully
tight: define the plain-language status contract for the priority table so the
most important management readout is specified in the data layer rather than
left to operator improvisation.

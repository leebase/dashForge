# ED Throughput Crunch Demo Execution Plan

## Objective

Execute one bounded run that converts the registered
`healthcare:ed-throughput-crunch` scenario into a workshop-ready dashboard demo
package using the existing template-instantiation path and current DashForge
runtime.

## Governance and Scratch Space

- Repo root: `/Users/lee/projects/dashForge`
- Scratch directory for temporary notes and rehearsal notes:
  `/Users/lee/projects/dashForge/.agent-orch-scratch/0700a8a5990b/scenario_contract_plan/attempt-1`
- Do not treat scratch files as governed outputs.

## Preconditions

1. `scenarios/healthcare/ed-throughput-crunch-contract.md` is current.
2. Required scenario package artifacts exist:
   - `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
   - `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
   - `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
   - `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
3. Runtime registration exists for:
   - `healthcare:ed-throughput-crunch` scenario in `scenarioCatalog.ts`.
   - `tpl.healthcare.ed-throughput-command` template in `templateCatalog.ts` and
     `templateInstantiation.ts`.
4. Presenter and deck-flow references are unchanged:
   - `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
   - `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`
   - `scenarios/healthcare/client-presentation-script.md`

## Stage 1 — Source Alignment (30 minutes)

Owner: Package operator

1. Open and confirm the contract and source docs.
2. Confirm the business question, audience, and five-step story arc remain:
   `System Pressure`, `Where It Is Concentrated`,
   `What Is Driving It`, `What It Is Causing`, `What We Do Next`.
3. Confirm the data contract minimum rows and required fields from
   `ed-throughput-crunch-data-design.md`.

Exit gate: Scenario-narrative and data-contract source alignment signed off.

## Stage 2 — Materialized Input Verification (30 minutes)

Owner: Package operator

1. Verify that these files load and are internally coherent.
2. Confirm row counts and key fields:
   - `monthly_metrics` `6`
   - `facility_summary` `36`
   - `department_summary` `144`
   - `ed_flow` `324`
   - `staffing_coverage` `18`
   - `patient_experience` `36`
3. Validate latest-week hotspot logic (Metro Community and North Medical) in
   `facility_summary` and `patient_experience` lag behavior.

Exit gate: Data-mapping gate passes and no manual patch is required.

## Stage 3 — Demo Package Assembly (45 minutes)

Owner: Package operator

1. Open the in-app scenario/template path and instantiate:
   - pack `healthcare`
   - scenario `ed-throughput-crunch`
   - template `tpl.healthcare.ed-throughput-command`
2. Verify blueprint widgets exist and map correctly to the datasets in the
   data design.
3. Validate narrative copy alignment:
   - executive-level urgency in Band 1,
   - concentration proof in Band 2,
   - operational drivers in Band 3,
   - consequences/action in Band 4.
4. Ensure `ed-throughput-crunch-dashboard-spec.json` reflects the same layout intent
   and dataset binding path.

Exit gate: Blueprint-mapping gate passes.

## Stage 4 — Rehearsal and Optional AI Assist (45 minutes)

Owner: Package operator

1. Run the five-step presenter sequence from the script.
2. Execute two bounded builder edits only:
   - update call-to-action wording to:
     `This Week's Recovery Priorities`
   - rebalance attention toward concentration signals over trend-only framing.
3. Optional AI assist:
   - open prompt entry,
   - generate candidate,
   - keep one of: apply or discard,
   - only proceed if narrative quality improves or time to first answer shortens.
4. Confirm no dependency changes or unplanned feature demonstrations are introduced.

Exit gate: Rehearsal gate passes.

## Stage 5 — Continuity and Handoff (20 minutes)

Owner: Package operator

1. Rehearse close language:
   - the output is a structured `DashboardSpec` family artifact,
   - same artifact supports builder, presenter, and export,
   - live/hybrid framing remains bounded and non-promissory.
2. Complete final checks in:
   `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`.
3. Record go/no-go in scratch notes with:
   - gate status,
   - blockers (if any),
   - required fix list (if blocked).

Exit gate: Continuity gate passes.

## Completion Criteria

Package is complete when the operator executes all stages on a host-capable
environment and records:

- all five contract gates completed,
- no skipped checklist items,
- one reproducible close script run from framing through handoff.

## Risk Register

- **Feature-drift risk:** operator defaults to feature tour.
  - *Control:* enforce the five-step script before any other UI path.
- **Narrative drift risk:** staffing treated as the dominant driver.
  - *Control:* maintain boarding/discharge causal path in sequence.
- **Over-claim risk:** exceeding bounded sprint-9 handoff language.
  - *Control:* use explicit bounded wording only.
- **Host-environment miss risk:** inability to complete browser run in the given
  environment.
  - *Control:* do not close plan without a complete host-environment rehearsal.

# ED Throughput Crunch Build Checklist

## Purpose

Operator runbook for the bounded ED throughput demo package pass:

- scenario-to-dashboard narrative transfer,
- widget build/review,
- and rehearsal closeout.

## Pre-flight

- [ ] Required docs checked and aligned:
  - `scenarios/healthcare/ed-throughput-crunch-contract.md`
  - `scenarios/healthcare/ed-throughput-crunch.md`
  - `scenarios/healthcare/ed-throughput-crunch-data-design.md`
  - `scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md`
  - `scenarios/healthcare/client-presentation-script.md`
- [ ] Demo registration route checked in runtime:
  - pack `healthcare`
  - scenario `ed-throughput-crunch`
  - template `tpl.healthcare.ed-throughput-command`
- [ ] Host environment is available for final browser rehearsal.
- [ ] All required artifact files exist:
  - `ed-throughput-crunch-dashboard-spec.json`
  - `ed-throughput-crunch-preview-data.json`
  - `ed-throughput-crunch-preview.sqlite`
  - `ed-throughput-crunch-binding-map.md`

## Data gate

- [ ] Monthly dataset row check passes: `monthly_metrics = 6`.
- [ ] Facility concentration row check passes: `facility_summary = 36`.
- [ ] Department row check passes: `department_summary = 144`.
- [ ] Flow row check passes: `ed_flow = 324`.
- [ ] Staffing row check passes: `staffing_coverage = 18`.
- [ ] Experience row check passes: `patient_experience = 36`.
- [ ] Latest-week ranking makes `Metro Community Hospital` and `North Medical Center` the top two risks.
- [ ] `priority_status` uses only:
  - `Act Now`
  - `Watch Closely`
  - `Stable Monitor`.

## Blueprint gate

- [ ] Dashboard title is exactly `ED Throughput Command View`.
- [ ] Data mode is `mock` in `dataContext.mode`.
- [ ] Required widget set exists:
  - `kpi_arrivals`, `kpi_dtp`, `kpi_lwbs`, `kpi_boarding`, `kpi_discharge`
  - `trend_dtp`
  - `facility_rank`, `priority_table`
  - `service_line_driver`, `staffing_context`
  - `experience_consequence`
- [ ] Default bind set does not include `ed_flow` unless explicitly requested.
- [ ] Band order is preserved in `storyArc`:
  - System Pressure
  - Where It Is Concentrated
  - What Is Driving It
  - What It Is Causing
  - What We Do Next

## Build checks by band

- Band 1
  - [ ] Five KPIs are on the top row, latest-week scoped.
  - [ ] Door-to-provider and boarding trend direction is clearly worsening.
  - [ ] LWBS and discharge values are tied to the same week basis.
- Band 2
  - [ ] Six-week trend appears before concentration reads.
  - [ ] Facility rank chart and priority table both sort consistently.
  - [ ] Top-two concentration message is readable in one glance.
- Band 3
  - [ ] Service-line driver chart ties concentration to boardings and discharge context.
  - [ ] Staffing chart is supporting context and not the primary root-cause headline.
- Band 4
  - [ ] Consequence chart shows patient impact trend over six weeks.
  - [ ] `narrative.storyArc.callToAction.commentary` is present and specific.

## Rehearsal gate

- [ ] Presenter sequence completes in five steps without skipping any step.
- [ ] First edit in builder: set
  `narrative.storyArc.callToAction.commentary` to:
  `This Week's Recovery Priorities`.
- [ ] Second edit in builder: raise concentration emphasis relative to trend-only framing.
- [ ] No additional builder edits are made before closeout.
- [ ] AI-assist path (if used) is run and finished with explicit apply/discard.

## Continuity gate

- [ ] Close states: same dashboard artifact supports builder, presenter, and export.
- [ ] Handoff identifies file names and IDs for downstream operators.
- [ ] Live/hybrid phrasing is bounded and non-promissory.
- [ ] No backend credentials, warehousing, or deployment promises are introduced.

## Final go/no-go

- [ ] The business question is answered in one coherent minute.
- [ ] Metro and North are identified as the primary intervention sites.
- [ ] Driver logic and consequence logic are both verbally coherent from one dashboard.
- [ ] All five gates pass with notes captured in scratch notes.

## Scratch notes

Use `/Users/lee/projects/dashForge/.agent-orch-scratch/0700a8a5990b/build_demo_artifacts/attempt-1`
for rehearsal notes and non-governed artifacts.

# ED Throughput Crunch Contract - Scenario To Dashboard Demo Build Package

## Objective

Turn the existing `ed-throughput-crunch` healthcare scenario into a bounded
dashboard demo build package that a consultant can open, present, and hand off
without inventing new product capabilities. The package should prove the full
DashForge story already available after Sprint 9:

- start from a realistic healthcare operating scenario,
- show an executive-ready first-pass dashboard,
- demonstrate one or two live edits in builder mode,
- optionally reference the existing `mock`, `live`, and `hybrid` data modes as
  a delivery bridge, and
- leave behind a structured artifact set that can be reused in a workshop or
  governed follow-on run.

This contract is intentionally about packaging one scenario into a strong demo
experience. It is not a new roadmap sprint, new industry-pack expansion, or a
request to widen the product beyond the closed Sprint 1-9 baseline.

## Canon Sources

This contract must stay aligned with:

- `product-definition.md`
- `architecture.md`
- `context.md`
- `sprint-plan.md`
- `scenarios/healthcare/ed-throughput-crunch.md`
- `scenarios/healthcare/client-presentation-script.md`

If those documents and this contract diverge, the canon docs win and this
contract should be corrected.

## Starting Baseline

DashForge already has the product surface this demo package should rely on:

- the governed Sprint 1-9 ladder is closed in-repo,
- builder, presenter, export, AI-assisted generation, and bounded production
  binding already exist,
- healthcare mock data and scenario-backed storytelling already exist as a
  product concept,
- Sprint 9 already proved the bounded `mock`, `live`, and `hybrid`
  `DashboardSpec` path, and
- the current remaining gap is choosing the next bounded slice, not reopening
  closed runtime work.

The specific content baseline for this package already exists too:

- `scenarios/healthcare/ed-throughput-crunch.md` defines the business problem,
  audience, KPIs, cuts, narrative arc, and dataset expectations.
- `scenarios/healthcare/client-presentation-script.md` defines the intended
  client-facing talk track from scenario framing through handoff.

This workflow should package those materials into an execution-ready demo
bundle rather than rewriting the product architecture.

## Scope

### In Scope

#### 1. Scenario-To-Demo Packaging Definition

- Define the exact artifact set that counts as the ED throughput demo package.
- Keep the package centered on one credible healthcare leadership story:
  throughput deterioration, facility concentration, operational drivers, and
  intervention focus.
- Map the scenario brief and presentation script onto an explicit dashboard
  build sequence instead of leaving the package as loose narrative notes.

#### 2. Dashboard Demo Artifact Expectations

- Require one primary dashboard shape aligned to the scenario's executive and
  operational storyline.
- Require a bounded presenter walkthrough that matches the stated narrative arc
  and business question.
- Require a workshop-ready edit path that shows how the dashboard can be
  adjusted live without rebuilding from scratch.
- Define how the package should reference existing DashForge capabilities such
  as builder mode, AI-assisted drafting, presenter mode, export, and the
  Sprint 9 production-binding bridge.

#### 3. Build Package Boundaries

- Keep the package feasible on the existing DashForge baseline.
- Prefer reuse of existing healthcare datasets and scenario-backed data seams
  over inventing new adapter or schema work.
- Treat live or hybrid binding references as optional demonstration extensions
  built on Sprint 9's bounded path, not as required new implementation work for
  this package.

#### 4. Execution Workflow Definition

- Sequence the work from scenario alignment through dashboard assembly,
  storytelling, packaging, and verification.
- Define decision gates so the package can be built under Agent-Orch or manual
  execution without ambiguous scope.
- State the minimum proof needed before the package is called ready for a
  client-facing demo.

### Explicitly Out Of Scope

- New frontend runtime primitives, adapters, or product features
- New external dependencies
- New healthcare scenario generation logic beyond what the package strictly
  needs
- Reopening Sprint 8 or Sprint 9 architecture decisions
- Warehouse/native backend integration, credential brokering, or live-service
  platform work
- Full multi-scenario packaging across all healthcare scenarios
- Broad documentation cleanup outside this scenario package
- Commit/release work or sprint-closeout documentation for a new governed build

## Constraints

- The package must use the existing DashForge product story: realistic
  scenario, editable dashboard, presenter walkthrough, structured artifact.
- The scenario remains healthcare-operations focused and must stay legible to a
  COO, CNO, hospital president, or ED operations leader.
- The primary demo must fit the MVP/product-definition posture of a workshop
  accelerator, not a full BI platform.
- The workflow should assume the shared `DashboardSpec` artifact remains the
  canonical output for builder, presenter, export, and follow-on delivery.
- If the package references production binding, it must do so using the bounded
  Sprint 9 `mock` / `live` / `hybrid` framing rather than implying broad
  backend readiness.
- The package should be executable even if the remaining host-only browser
  smoke must happen outside this sandbox.

## Required Outputs

- `scenarios/healthcare/ed-throughput-crunch-contract.md`
- `plans/ed-throughput-crunch-demo-plan.md`

The defined workflow should also target a future demo package artifact set that
includes:

- one scenario-aligned dashboard spec or starter template
- one presenter-ready narrative sequence
- one concise workshop edit script
- one clear handoff/export story for client conversations

## Ordered Work

1. Confirm the scenario canon, dashboard intent, and demo objective from the
   existing healthcare scenario brief and client presentation script.
2. Define the bounded artifact set that will constitute the ED throughput demo
   package.
3. Translate the scenario story into a dashboard build sequence with explicit
   KPI, chart, and narrative expectations.
4. Define how builder edits, presenter flow, AI assistance, and the
   mock-to-live handoff should appear in the demo without widening scope.
5. Set verification expectations for the package, including artifact review and
   one host-capable browser smoke when available.

## Acceptance Criteria

1. The ED throughput scenario is translated into a clear, bounded dashboard
   demo package workflow rather than remaining only a narrative brief.
2. The package scope is explicit about what will be built, shown, and handed
   off in a client-facing demo.
3. The workflow reuses the closed Sprint 9 DashForge baseline instead of
   implying new platform development.
4. The plan defines a coherent dashboard story from system-wide pressure to
   facility concentration, operational drivers, and intervention focus.
5. The package includes a builder-edit moment, a presenter-story moment, and a
   structured-artifact handoff moment.
6. Any production-binding mention stays bounded to Sprint 9's existing
   `mock` / `live` / `hybrid` positioning.
7. The package can be executed later under a governed workflow or manual build
   pass without reopening scope questions.

## Verification Expectations

- Re-read this contract and `plans/ed-throughput-crunch-demo-plan.md` before
  starting implementation work for the package.
- Review the planned artifact set against:
  - `scenarios/healthcare/ed-throughput-crunch.md`
  - `scenarios/healthcare/client-presentation-script.md`
  - `product-definition.md`
  - `architecture.md`
- Confirm the workflow stays inside the current DashForge product/runtime
  baseline.
- When the package is later built, prefer one host-environment browser smoke of
  the final dashboard walkthrough because browser startup remains sandbox
  constrained here.

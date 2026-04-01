# Sprint 3 Contract — SQLite Mock Engine + Healthcare Expansion

## Objective

Sprint 3 turns the Sprint 2 data seam into the first real mock-data engine
slice. The output of this sprint is a bounded SQLite-backed generation path for
mock data, plus a healthcare pack that reaches the product-defined scenario
coverage and feels materially more credible than the current single-scenario
sample.

This sprint is bounded to the mock engine foundation and the healthcare pack
only. It does not deliver the remaining industry packs, the shared template
catalog, broad primitive expansion, builder mode, presenter mode, export, or
live production bindings.

## Canon Sources

Sprint 3 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- Sprint 2 closeout artifacts under `docs/`, `plans/`, and `code-reviews/`

If those documents and this contract diverge, the canon docs win and this
contract must be corrected.

## Starting Baseline

Sprint 2 closed with the runtime seams stabilized in `frontend/`:

- DashboardSpec validation is shared and test-backed
- theme resolution and persistence seams are explicit
- widgets still consume data only through `DataAdapter`
- `SQLiteDataAdapter` exists only as a loader/client seam proof
- the mock-data catalog still contains one healthcare scenario:
  `quality-improvement`
- the current healthcare sample is still driven by static in-memory datasets,
  not a generated SQLite scenario database

Sprint 3 builds forward from that baseline. It should deepen the data
capability without reopening Sprint 2 spec, theme, persistence, or adapter
contracts unless a concrete defect is uncovered.

## Scope

### In Scope

#### 1. SQLite-Backed Mock-Data Generation Foundation

- Introduce a real generation path that accepts healthcare pack/scenario/seed
  inputs and produces a SQLite database artifact.
- Keep generation deterministic so the same `(pack, scenario, seed)` input can
  be regenerated consistently.
- Ensure the generated database has enough relational structure to support
  drill-down and roll-up behavior through the existing adapter contract.
- Add only the narrowest CLI surface needed to generate a scenario database
  from the repo.

#### 2. Healthcare Pack Completion For The Canon Scenario Set

- Expand healthcare from the current single scenario to the three scenarios
  defined in `product-definition.md`:
  - `flu-season`
  - `quality-improvement`
  - `cost-pressure`
- Broaden the healthcare data assets beyond the current tiny static sample so
  the pack supports believable executive and operational storytelling.
- Keep the scenario behavior aligned with the documented stories:
  - flu-season pressure increases volume, occupancy, and related strain
  - quality-improvement improves infection and satisfaction trends without
    magically solving every metric
  - cost-pressure raises cost per case and margin pressure without faking a
    demand surge

#### 3. Adapter-Facing SQLite Runtime Bridge

- Move the SQLite path from a pure seam proof toward a minimally usable runtime
  path.
- Keep `DataAdapter` as the only contract visible to widgets and renderers.
- Support the narrow adapter operations required by the current runtime and
  Sprint 3 verification:
  - dataset listing
  - schema inspection
  - query
  - aggregate
- Keep the current static/scenario-backed path alive unless a SQLite-backed
  replacement is explicitly wired and verified.

#### 4. Targeted Validation And Verification For The Mock Engine Slice

- Add automated checks for generator determinism, healthcare scenario coverage,
  and adapter compatibility.
- Verify that generated healthcare data supports at least one consistent
  aggregate/drill-down path rather than only flat demo rows.
- Keep verification focused on the bounded Sprint 3 slice, not on future pack
  breadth or builder UX.

### Explicitly Out Of Scope

- Financial Services or SaaS pack implementation
- Shared template catalog or cross-pack template browsing
- Full healthcare template gallery as a user-facing feature
- Broad primitive delivery beyond what current runtime/tests need
- Builder mode, drag/drop composition, or `react-grid-layout`
- Presenter mode or export flows
- Live production bindings
- AI generation features
- Python scaffold retirement or broader repo cleanup
- Reopening Sprint 2 validation, theme, persistence, or adapter contracts
  without a concrete Sprint 3 defect

## Constraints

- Build on the Sprint 2 runtime baseline rather than redesigning it.
- Widgets and renderer code continue to consume data only through
  `DataAdapter`.
- Healthcare is the only pack Sprint 3 is allowed to deepen.
- The generator path must produce SQLite as the canonical mock-data artifact for
  this sprint, not a parallel JSON-only substitute.
- The repo-level CLI entry point may be thin, but it must be explicit and
  usable by verification.
- Any runtime or tooling dependency added for SQLite work must stay narrowly
  justified by this sprint's objective.
- Avoid large checked-in binary artifacts unless they are the smallest useful
  fixtures needed for automated verification.
- Sample-app or renderer wiring should change only where needed to exercise the
  new data path.

## Required Outputs

- `docs/sprint-03-contract.md`
- `plans/sprint-03-plan.md`
- implementation-ready file targets are expected primarily under:
  - `src/dashForge/`
  - `frontend/src/mock-data/`
  - `frontend/src/core/data/`
  - `frontend/src/sample/`
- targeted tests may live under:
  - `frontend/src/**/*.test.ts`
  - `tests/`

## Ordered Work

1. Lock the Sprint 3 contract and plan against canon and Sprint 2 closeout.
2. Expand the healthcare pack definitions and scenario assets to the full
   documented scenario set.
3. Land the SQLite generation foundation and repo-level CLI entry point.
4. Prove deterministic healthcare scenario generation and one consistent
   aggregate/drill-down path.
5. Upgrade the SQLite runtime bridge enough to query generated healthcare data
   through `DataAdapter`.
6. Wire the expanded healthcare assets into the current mock-data/sample path
   only as far as needed to prove the sprint slice.
7. Verify, repair, and document the sprint before Sprint 4 begins.

## Acceptance Criteria

1. Sprint 3 remains bounded to the SQLite mock engine foundation and healthcare
   expansion only.
2. Healthcare includes all three canon scenarios: `flu-season`,
   `quality-improvement`, and `cost-pressure`.
3. A repo-level generation command can produce a healthcare SQLite database for
   a chosen scenario and seed.
4. The generated healthcare database is deterministic enough for automated
   verification and supports at least one non-trivial aggregate/drill-down
   consistency check.
5. The SQLite-backed path can answer `listDatasets`, `getSchema`, `query`, and
   `aggregate` through the existing adapter contract.
6. The current frontend runtime still renders from a valid healthcare data path
   without widgets importing mock-engine internals directly.
7. Sprint 2 seams remain intact unless a concrete Sprint 3 defect required a
   narrowly scoped repair.
8. Relevant automated checks for generator behavior, healthcare coverage, and
   frontend runtime compatibility exist and pass.
9. `npm --prefix frontend test` passes after the Sprint 3 slice lands.
10. `npm --prefix frontend run build` passes after the Sprint 3 slice lands.

## Verification Expectations

- Re-read this contract and `plans/sprint-03-plan.md` before implementation.
- Prefer targeted automated checks for:
  - scenario coverage
  - deterministic generation
  - adapter-backed query/aggregate behavior
  - existing frontend runtime compatibility
- Treat any pull toward other industry packs, shared templates, builder UX,
  presenter UX, export, or broad primitive expansion as scope drift and split
  it forward.

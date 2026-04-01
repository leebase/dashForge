# Sprint 4 Contract — Financial Services + SaaS + Shared Template Catalog

## Objective

Sprint 4 completes the first full non-healthcare mock-data expansion slice by
adding the Financial Services and SaaS packs and introducing a shared template
catalog that can serve all industry packs during the next builder-focused slice.

This sprint is bounded to:

- realistic Financial Services pack scenarios under documented canon,
- realistic SaaS/Technology pack scenarios under documented canon,
- shared template metadata and selectors, and
- deterministic generation path support for those new packs where feasible.

It does not deliver builder mode, presenter mode, export, live bindings, or broad
primitive expansion.

## Canon Sources

Sprint 4 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- `docs/sprint-03-contract.md`
- `plans/sprint-03-plan.md`
- `code-reviews/review-sprint-03.md`

If this contract diverges from those documents, canon-doc conflicts win.

## Starting Baseline

Sprint 3 completed a healthcare-focused expansion and deterministic SQLite-backed
path:

- healthcare now has the full 3-scenario set,
- generator/CLI supports deterministic scenario output for healthcare,
- `DataAdapter` remains the execution contract for widget rendering,
- template catalog for additional packs is still absent,
- `frontend/src/mock-data/` still resolves healthcare-only scenario entries.

Sprint 4 starts from that baseline and broadens coverage across two remaining
MVP packs.

## Scope

### In Scope

#### 1. Financial Services Pack Delivery

- Add Financial Services pack definition and scenario assets aligned to
  `product-definition.md`.
- Deliver the MVP scenario set for this pack:
  - `market-downturn`
  - `advisor-attrition`
  - `growth-quarter`
- Define domain-appropriate metrics, dimensions, and entities so generated data is
  workshop-plausible.
- Ensure scenario behavior is internally coherent (AUM flow, flows, advisor
  concentration, retention dynamics).

#### 2. SaaS Pack Delivery

- Add SaaS/Technology pack definition and scenario assets aligned to
  `product-definition.md`.
- Deliver the MVP scenario set for this pack:
  - `churn-crisis`
  - `product-led-growth`
  - `scaling-success`
- Define MRR/ARR/churn/retention/engagement vocabulary and entity sets for domain
  plausibility.
- Encode scenario dynamics that are materially distinct and believable.

#### 3. Shared Template Catalog

- Add shared catalog structures for reusable, pack-scoped templates and scenario
  recommendations.
- Create template entries that cover the MVP template classes in a shared form:
  - executive summary
  - operational detail
  - risk/alert
- Add registry lookups by:
  - pack
  - scenario
  - audience
  - intent
- Keep templates spec-driven so they are consumed via `DashboardSpec` + `DataAdapter`
  when builder/presenter flows are later enabled.

#### 4. Multi-Pack Generation/Selection Hooks (Bounded)

- Extend `src/dashForge` entrypoints so Financial Services and SaaS scenarios can be
  generated from the same bounded command surface used by Sprint 3.
- Keep generation deterministic for `(pack, scenario, seed)` for parity with Sprint 3
  behavior.
- Surface unsupported pack/scenario handling through clean CLI errors, not exceptions.

### Explicitly Out Of Scope

- Template authoring UI, drag/drop composition, and template editing surfaces.
- Presenter mode, export flows, and AI-assisted generation.
- Any primitive expansion outside existing contract set.
- Production data binding and any connector surfaces.
- Python scaffold cleanup unrelated to mock-pack growth.

## Constraints

- Do not change the `DataAdapter` contract.
- Do not expand widgets to consume mock internals directly.
- Keep healthcare Sprint 3 behavior stable and unchanged unless a hard defect
  requires immediate repair.
- Keep shared template structures reusable rather than pack-specific one-offs.
- Keep the sprint bounded; if template rendering UX scope is needed, defer to
  Sprint 5 planning.
- Do not add external runtime dependencies for this sprint.

## Required Outputs

- `docs/sprint-04-contract.md`
- `plans/sprint-04-plan.md`
- `frontend/src/mock-data/financialPack.ts` and matching scenario/template data files
- `frontend/src/mock-data/saasPack.ts` and matching scenario/template data files
- `frontend/src/mock-data/templateCatalog.ts`
- `src/dashForge/generate.py` and `src/dashForge/main.py` (pack dispatch updates)
- `frontend/src/mock-data/scenarioCatalog.ts`
- targeted tests around pack/scenario registration and catalog invariants

## Ordered Work

1. Lock the sprint-04 contract against canon and Sprint 3 handoff artifacts.
2. Add shared pack/scenario/template schema surfaces so Financial Services and SaaS
   can be added without one-off ad hoc wiring.
3. Deliver Financial Services pack and scenario content with seeded reproducible
   metadata.
4. Deliver SaaS pack and scenario content with seeded reproducible metadata.
5. Register all new scenarios in `scenarioCatalog`.
6. Build shared template catalog entries for both packs and define scenario
   recommendation behavior.
7. Extend CLI pack selection and generation dispatch for `financial` and `saas`.
8. Add adapter-facing registry/listing tests and generation coverage for new packs.
9. Verify and hand off before opening Sprint 5.

## Acceptance Criteria

1. Healthcare remains unchanged and still renders through existing seams.
2. Financial Services includes all 3 canon scenarios with coherent behavior and
   domain-valid scenario metadata.
3. SaaS includes all 3 canon scenarios with coherent behavior and domain-valid
   scenario metadata.
4. `listRegisteredScenarios()` (or equivalent) includes all 6 non-healthcare
   scenario IDs and remains deduplicable by pack/scenario key.
5. Shared template catalog exposes at least 2 templates per pack and supports
   one "default" template recommendation per scenario.
6. Generator CLI accepts pack/scenario inputs for both financial and SaaS and
   returns deterministic output for identical inputs.
7. Unknown packs/scenarios return clear, user-facing CLI errors.
8. New mock-data/templatization additions are validated by automated tests.
9. `python3 -m pytest -q` remains green after any generator updates.
10. `npm --prefix frontend test` and `npm --prefix frontend run build` pass.

## Verification Expectations

- Re-read this contract and `plans/sprint-04-plan.md` before implementation.
- Verify generator output by scenario for financial and SaaS with a deterministic
  seed pass.
- Verify scenario/catalog coverage through unit tests in `frontend/src/mock-data`.
- Verify template catalog by pack/intent queries before any broader UI work.
- Treat drift toward builder/export/presenter/production binding as scope-control
  defects and defer to Sprint 5.

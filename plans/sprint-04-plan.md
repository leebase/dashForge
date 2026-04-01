# Sprint 4 Plan — Financial Services + SaaS + Shared Template Catalog

## Goal

Execute Sprint 4 as a bounded expansion slice that adds the remaining two MVP
packs (Financial Services and SaaS/Technology) and creates a shared template
catalog foundation, while preserving the Sprint 3 contracts around `DashboardSpec`
and `DataAdapter`.

The output of this sprint is no longer healthcare-centric; it is the first concrete
cross-pack delivery of mock-content and template infrastructure.

## Planning Assumptions

- Sprint 3 closeout artifacts are authoritative for health-check boundaries and
  current runtime constraints.
- The generator command surface and mock-data runtime seam exist and should be used
  as the bounded path for any new pack data.
- `DataAdapter` and `DashboardSpec` are immutable boundaries for runtime and template
  design.
- Template UX is intentionally deferred to later sprints; this sprint builds content
  structures and selection metadata.

## Implementation Guardrails

- Keep all runtime rendering flows driven by `DashboardSpec` + `DataAdapter` only.
- Keep Healthcare behavior intact unless a reproducible Sprint 4 defect appears.
- Keep pack/scenario/template additions explicit and declarative rather than hard-coded.
- Avoid adding runtime dependencies for the new content.
- Keep verification in repo-local tests and existing frontend checks (`test`, `build`).

## Scope Summary

### Deliver In Sprint 4

- Add Financial Services pack content to match canon vocabulary, dimensions,
  entities, and 3-scenario set.
- Add SaaS/Technology pack content to match canon vocabulary, dimensions,
  entities, and 3-scenario set.
- Add a shared template catalog schema with reusable metadata and pack/scenario
  mapping.
- Add registry and lookup paths so templates can be queried by pack, scenario, and
  intended audience.
- Extend CLI generation dispatch to support `--pack financial --scenario ...` and
  `--pack saas --scenario ...` using deterministic generation paths.
- Add focused tests for scenario registration, template lookup, and generation
  errors/dispatch.

### Do Not Deliver In Sprint 4

- Builder mode, drag/drop composition, `react-grid-layout` integration.
- Presenter mode, narration tooling, export, or AI generation.
- Production data binding or live connectors.
- Broad primitive expansion.
- Re-architecture of the Python bootstrap layer.

## Ordered Work

### 1. Re-anchor the Multi-Pack Content Surface

Objective:
Introduce a shared internal shape so new pack/scenario/template assets are not
one-off.

Primary file targets:

- `frontend/src/mock-data/healthcarePack.ts` (for reusable type extraction, if helpful)
- `frontend/src/mock-data/scenarioCatalog.ts`
- `frontend/src/mock-data/templateCatalog.ts` (new)

Done when:

- there is one canonical pattern for pack and scenario registration.
- scenario lookup and template lookup APIs are pack-aware.
- existing healthcare calls remain backward-compatible.

### 2. Add Financial Services Pack Assets

Objective:
Create a believable financial pack with three scenarios and seeded scenario behavior.

Primary file targets:

- `frontend/src/mock-data/financialPack.json`
- `frontend/src/mock-data/financialPack.ts`
- `frontend/src/mock-data/financialMarketDownturn.ts` (if split assets are used)
- `frontend/src/mock-data/financialAdvisorAttrition.ts` (if split assets are used)
- `frontend/src/mock-data/financialGrowthQuarter.ts` (if split assets are used)
- `src/dashForge/generate.py` (when pack definitions are consumed by generation)

Done when:

- all three financial scenarios are registered and resolvable.
- data shape/fields support healthcare-agnostic runtime operations and realistic
  financial relationships.
- `AUM`, `flows`, `attrition`, and `retention` behaviors reflect scenario narratives.

### 3. Add SaaS Pack Assets

Objective:
Create a believable SaaS pack with three scenarios and seeded scenario behavior.

Primary file targets:

- `frontend/src/mock-data/saasPack.json`
- `frontend/src/mock-data/saasPack.ts`
- optional split scenario assets for each scenario
- `src/dashForge/generate.py` (when pack definitions are consumed by generation)

Done when:

- all three SaaS scenarios are registered and resolvable.
- scenario behavior reflects MRR/ARR/churn/upsell/support dynamics in line with canon.
- scenario vocabulary includes plan tiers, segments, and feature areas.

### 4. Build Shared Template Catalog (Non-UI)

Objective:
Create reusable, cross-pack template metadata usable in future builder workflows.

Primary file targets:

- `frontend/src/mock-data/templates/*.json|.ts` (new shared artifacts)
- `frontend/src/mock-data/templateCatalog.ts`

Done when:

- each of the two new packs has template metadata for:
  - executive summary,
  - operational detail,
  - risk/alert.
- each scenario has at least one mapped or recommended template ID.
- catalog queries can filter by pack / scenario / intent / audience.

### 5. Extend Generation Dispatch for Multi-Pack Support

Objective:
Keep generator behavior bounded but multi-pack-capable for deterministic CLI output.

Primary file targets:

- `src/dashForge/main.py`
- `src/dashForge/generate.py`
- `tests/test_generate.py`

Done when:

- `--pack financial` and `--pack saas` are accepted for CLI generation.
- unknown pack or unknown scenario returns readable argparse validation errors.
- repeated generation for same `(pack, scenario, seed)` is deterministic.

### 6. Add Registration and Selection Tests

Objective:
Lock the new catalog content and prevent regression.

Primary file targets:

- `frontend/src/mock-data/scenarioCatalog.test.ts`
- `frontend/src/mock-data/templateCatalog.test.ts` (new)
- `tests/test_generate.py`

Done when:

- tests assert all six scenarios (3 financial + 3 SaaS) are discoverable.
- tests assert template registry cardinality and pack filtering.
- tests assert CLI failure modes for invalid pack/scenario are tested.

### 7. Verify And Handoff Sprint 4

Objective:
Close Sprint 4 with bounded outcomes and explicit gaps only.

Done when:

- `npm --prefix frontend test` passes.
- `npm --prefix frontend run build` passes.
- `python3 -m pytest -q` reflects any generator additions/updates.
- Review artifacts are prepared for the next governed transition.

## Verification Matrix

| Area | Proof |
|------|-------|
| Pack scenario breadth | Both financial and SaaS expose all three canon scenarios |
| Pack realism scaffolding | Scenario-level dataset fields align with canon metrics/dimensions |
| Template breadth | Shared catalog contains executive, operational, and risk/alert coverage |
| Template discoverability | Catalog can be filtered by pack and scenario |
| Multi-pack CLI | `--pack financial` and `--pack saas` both work at command level |
| Determinism | Same `(pack, scenario, seed)` produces stable output for generation |
| Existing baseline safety | Healthcare registration and generation still pass old checks |
| Frontend baseline | Unit/integration checks remain green |

## Risks And Controls

| Risk | Control |
|------|---------|
| Scope drift into builder UX | Keep UI/template selection as metadata only in this sprint |
| Content credibility gap | Require scenario-level assertions and domain-coherent narratives |
| Generator overbuild | Keep pack-specific generation code minimal and deterministic, aligned with Sprint 3 patterns |
| Regression in healthcare seam | Lock healthcare registration tests and keep old fixtures |
| Template ID inconsistency | Require stable IDs and shared catalog utility tests |

## Exit Condition

Sprint 4 planning is complete when implementation can start from this document and
`docs/sprint-04-contract.md` with no ambiguity on:

- what must be delivered for Financial Services and SaaS,
- what the shared template catalog contains and how it is discovered, and
- which boundaries remain intentionally forward-scoped.

# Sprint 3 Plan — SQLite Mock Engine + Healthcare Expansion

## Goal

Execute Sprint 3 as a bounded implementation slice that converts DashForge's
mock-data story from a static scenario registry into the first real
SQLite-backed engine path, while expanding healthcare to the full canon
scenario set and preserving the Sprint 2 runtime seams.

## Planning Assumptions

- Sprint 2 already locked the spec, validation, theme, persistence, and
  adapter boundaries.
- The current mock-data implementation is intentionally shallow: one healthcare
  scenario and one static registry-backed adapter path.
- Sprint 3 should make the healthcare demo materially more believable before
  the roadmap broadens into other industries or templates.
- The governed implementation step expects a repo-level generator entry point
  under `src/dashForge/` plus the remaining healthcare scenario assets under
  `frontend/src/mock-data/`.
- The sprint should prove the narrowest viable SQLite path first and avoid a
  broad UI rewrite.

## Scope Summary

### Deliver In Sprint 3

- a repo-level CLI generation path for SQLite-backed healthcare scenarios
- deterministic healthcare scenario generation from `(pack, scenario, seed)`
- healthcare pack expansion to `flu-season`, `quality-improvement`, and
  `cost-pressure`
- broader healthcare datasets that support both headline KPIs and drill-down
  style aggregation checks
- a minimally usable SQLite runtime bridge behind `DataAdapter`
- targeted automated coverage for generation, scenario assets, and adapter
  compatibility
- minimal sample/runtime wiring needed to prove the new healthcare slice

### Do Not Deliver In Sprint 3

- Financial Services or SaaS packs
- shared template catalog or Sprint 4 template work
- builder mode or `react-grid-layout`
- presenter mode
- export features
- broad primitive expansion
- live production bindings
- Python scaffold cleanup
- general repo restructuring

## Ordered Work

### 1. Lock The Healthcare Pack Surface

Objective:
Make the healthcare pack explicit enough for both generator work and frontend
consumption, without dragging other packs forward.

Primary file targets:

- `frontend/src/mock-data/healthcareQualityImprovement.ts`
- `frontend/src/mock-data/healthcareFluSeason.ts`
- `frontend/src/mock-data/healthcareCostPressure.ts`
- `frontend/src/mock-data/scenarioCatalog.ts`

Done when:

- all three healthcare scenarios exist as explicit assets
- scenario ids and stories align with `product-definition.md`
- the pack no longer depends on one tiny inline sample to represent healthcare

### 2. Define The Generator Inputs And Dataset Shape

Objective:
Translate the healthcare scenario assets into a generator-ready data shape with
enough structure for SQLite-backed querying.

Primary file targets:

- `src/dashForge/generate.py`
- supporting modules under `src/dashForge/` as needed
- `frontend/src/mock-data/`

Done when:

- the generation path has explicit inputs for pack, scenario, seed, and output
- the healthcare dataset shape is documented in code rather than implied by the
  sample dashboard
- the generated schema supports at least one realistic aggregate/drill-down
  path

### 3. Build The SQLite Generation Foundation

Objective:
Produce a real SQLite database artifact instead of only in-memory demo rows.

Primary file targets:

- `src/dashForge/generate.py`
- supporting modules under `src/dashForge/`
- `pyproject.toml` only if command wiring is required

Done when:

- a repo-level command can generate a healthcare SQLite file
- generated output is deterministic for the same input tuple
- the generation path is narrow and sprint-scoped rather than a full platform

### 4. Prove Relational And Aggregation Credibility

Objective:
Make the generated healthcare data survive a basic credibility check instead of
behaving like disconnected demo blobs.

Primary file targets:

- generator modules under `src/dashForge/`
- targeted tests under `tests/` or adjacent generator test files

Done when:

- the generated healthcare database can be inspected through SQL-backed tables
- at least one aggregate/drill-down consistency check is automated
- the scenario stories show distinct behavior instead of cosmetic label changes

### 5. Upgrade The SQLite Runtime Bridge

Objective:
Turn the existing SQLite adapter seam into the narrowest usable runtime path
for Sprint 3 verification and sample consumption.

Primary file targets:

- `frontend/src/core/data/SQLiteDataAdapter.ts`
- `frontend/src/core/data/SQLiteDataAdapter.test.ts`
- related loader/runtime helpers under `frontend/src/core/data/`

Done when:

- the adapter can answer `listDatasets`, `getSchema`, `query`, and `aggregate`
- the bridge stays behind `DataAdapter`
- widgets still avoid direct knowledge of SQLite or generator internals

### 6. Keep Frontend Wiring Minimal But Real

Objective:
Exercise the new healthcare data path without pulling Sprint 3 into template
catalog or builder work.

Possible touchpoints if needed:

- `frontend/src/sample/sampleDashboard.ts`
- `frontend/src/core/data/StaticDataAdapter.ts`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/App.tsx`

Done when:

- the expanded healthcare scenarios are reachable through the current runtime
  path
- sample/runtime updates stay focused on data-path proof, not UI redesign
- the existing sample dashboard remains valid or is replaced by a SQLite-backed
  equivalent that proves the same runtime contract

### 7. Add Verification Coverage

Objective:
Leave the sprint with durable proof of the new engine path rather than manual
confidence.

Primary file targets:

- `frontend/src/core/data/SQLiteDataAdapter.test.ts`
- scenario or catalog tests under `frontend/src/mock-data/`
- generator tests under `tests/` or `src/dashForge/`

Done when:

- deterministic generation is covered
- healthcare scenario coverage is covered
- adapter-backed SQLite behavior is covered
- existing frontend runtime checks still protect Sprint 2 seams

### 8. Verify And Close The Slice

Objective:
Hand Sprint 4 a clear baseline: healthcare and SQLite are deeper, but other
pack/template work is still intentionally forward-scoped.

Done when:

- the required automated checks pass
- any remaining realism gaps are documented as future work instead of absorbed
  into Sprint 3
- the repo has a clean contract/plan/verify/repair/review trail for the sprint

## Verification Matrix

| Area | Proof |
|------|-------|
| Healthcare scenario coverage | All three healthcare scenarios are present and resolvable |
| Generator CLI path | A repo-level command produces a healthcare SQLite artifact for a chosen scenario/seed |
| Determinism | Repeated generation for the same inputs produces verifiably consistent output |
| Data credibility | At least one aggregate/drill-down consistency check passes against generated healthcare data |
| SQLite runtime bridge | `SQLiteDataAdapter` answers dataset listing, schema, query, and aggregate against the generated path |
| Frontend health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Risks And Controls

| Risk | Control |
|------|---------|
| The sprint drifts into all-pack delivery | Keep Financial Services, SaaS, and shared templates explicitly in Sprint 4 |
| The generator becomes a second product architecture | Keep the CLI entry point thin and preserve DashboardSpec/DataAdapter as the product center |
| SQLite work reopens Sprint 2 seams | Treat spec, validation, theme, and persistence changes as defects-only repairs |
| Healthcare realism stays too shallow | Encode scenario-specific metric behavior and automate at least one credibility check |
| Frontend gets coupled to generator internals | Keep all runtime access behind `DataAdapter` and adapter-facing loaders |
| Binary fixtures bloat the repo | Prefer generated or tiny test fixtures over checked-in large databases |

## Exit Condition

Sprint 3 planning is complete when implementation can start from this document
and `docs/sprint-03-contract.md` without re-deciding scope, constraints, file
targets, execution order, or verification for the SQLite mock-engine and
healthcare slice.

# Sprint 2 Contract — Spec/Runtime Completion

## Objective

Sprint 2 completes the core spec/runtime seams that Sprint 1 intentionally left
partial. The output of this sprint is a stable, implementation-ready baseline
inside `frontend/` for DashboardSpec shape, validation, theming, persistence,
and the browser-side SQLite adapter boundary.

This sprint is bounded to spec/runtime completion only. It does not deliver the
mock-data engine, industry-pack expansion, template catalog, builder mode,
presenter mode, export flows, or production data binding.

## Canon Sources

Sprint 2 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`

If those documents and this contract diverge, the canon documents win and this
contract must be corrected.

## Starting Baseline

Sprint 1 already proved the minimum viable runtime in `frontend/`:

- a React/Vite/TypeScript app shell exists
- a DashboardSpec subset renders successfully
- KPI and line-chart widgets render through the runtime
- widget data resolves through the `DataAdapter` seam
- scenario-backed sample data exists for the foundation slice

Sprint 2 builds on that baseline. It should finish the contracts needed by
later sprints without pretending later features already exist.

## Sprint Boundary

Sprint 2 is the runtime-hardening sprint between the foundation slice and the
first deeper mock-data slice. It is allowed to make the core spec/runtime
contracts explicit, testable, and reusable. It is not allowed to substitute
future feature work for unfinished contract work.

The sprint succeeds when later work can add richer data, more primitives,
templates, builder behavior, and presenter behavior without having to
re-decide the DashboardSpec, validation, theming, persistence, or adapter
boundaries.

## Scope

### In Scope

#### 1. DashboardSpec Contract Completion

- Broaden the top-level DashboardSpec surface to match the architecture-defined
  runtime baseline needed by later template, primitive, builder, and presenter
  work.
- Keep the widget runtime incremental while stabilizing the surrounding
  contract for:
  - metadata and intent
  - theme identity and overrides
  - `mock`, `live`, and `hybrid` data-context modeling
  - layout metadata
  - version-aware persistence
  - optional narrative and global filter scaffolding

#### 2. Structural And Semantic Validation

- Keep structural validation schema-driven.
- Add one explicit validation entry point for DashboardSpec.
- Add semantic validation for the minimum failures later flows must reject
  early:
  - unsupported `specVersion`
  - unknown `theme.id`
  - duplicate widget ids
  - impossible dashboard or widget layout values
  - inconsistent `dataContext` combinations
- Return validation results in a reusable form that can serve rendering,
  persistence, import, template, and future builder flows.

#### 3. Theme Runtime Completion

- Treat `light-professional` and `dark-executive` as required runtime themes.
- Keep theme resolution centralized.
- Ensure the same theme path supports:
  - component-facing CSS variables
  - chart-facing theme output for ECharts-backed widgets

#### 4. Version-Aware Save/Load And Persistence Seams

- Keep DashboardSpec JSON readable and version-stamped.
- Validate loaded specs before they reach runtime rendering.
- Preserve a temporary local persistence seam suitable for later builder and
  export flows.
- Keep migration hooks possible without redesigning the persistence contract.

#### 5. Browser-Side SQLite Adapter Seam

- Preserve the `DataAdapter` boundary while proving the browser-side SQLite
  path.
- Land the narrowest useful seam:
  - adapter bootstrap/loading
  - one minimal query or aggregate path
  - schema or dataset discovery only if required by the adapter contract
- Keep the current static/scenario-backed adapter path working in parallel.

### Explicitly Out Of Scope

- SQLite scenario generation, authoring pipeline, or seeded pack databases
- New healthcare, financial-services, or SaaS pack content
- Dashboard templates
- Presenter mode or proposal export
- Builder mode, drag/drop composition, or `react-grid-layout`
- Broad primitive expansion beyond contract-safe spec work
- Live production bindings
- Python scaffold cleanup

## Constraints

- All implementation for this sprint stays inside `frontend/`.
- DashboardSpec remains the product center; runtime behavior flows from
  validated spec data.
- The current sample/runtime path must stay renderable while the contracts are
  being broadened.
- Widgets continue to consume data only through `DataAdapter`.
- Theme behavior stays centralized and shared across shell and chart output.
- Save/load must remain version-aware from the first landing.
- The SQLite seam must not force a SQLite-only cutover during Sprint 2.
- The SQLite seam may use a thin fixture or loader path, but it must not turn
  into SQLite generation, seeded scenario authoring, or a second runtime
  architecture.
- Sprint 2 must not add unrelated product capabilities to make the seam feel
  “more complete.”
- Do not add external runtime dependencies unless they are narrowly justified
  by the SQLite seam and explicitly acceptable under project guardrails.

## Required Outputs

- `docs/sprint-02-contract.md`
- `plans/sprint-02-plan.md`
- implementation-ready file targets are expected primarily under:
  - `frontend/src/core/spec/`
  - `frontend/src/core/theme/`
  - `frontend/src/core/io/`
  - `frontend/src/core/data/`
- minimal runtime wiring may touch app shell or renderer files only where
  needed to exercise the new seams

## Ordered Work

1. Lock the Sprint 2 contract and plan against canon.
2. Reconcile the DashboardSpec surface and the shared validation entry point.
3. Complete structural and semantic validation.
4. Complete the centralized theme runtime.
5. Complete version-aware save/load and local persistence seams.
6. Complete the browser-side SQLite adapter seam without breaking the existing
   adapter path.
7. Verify, repair, and document the sprint before Sprint 3 begins.

## Acceptance Criteria

1. Sprint 2 remains bounded to spec/runtime completion only.
2. The frontend has one shared DashboardSpec validation entry point.
3. The DashboardSpec contract is broad enough for later work without implying
   unsupported runtime breadth.
4. Semantic validation rejects the targeted version, theme, widget-id, layout,
   and data-context failures with clear errors.
5. `light-professional` and `dark-executive` resolve as concrete runtime themes
   for both CSS-variable and chart-facing output.
6. A spec can round-trip through save/load helpers as readable JSON and is
   validated before reuse.
7. The browser-side SQLite seam can answer the narrow adapter contract without
   breaking the existing static/scenario-backed path.
8. `npm --prefix frontend test` passes after implementation lands.
9. `npm --prefix frontend run build` passes after implementation lands.

## Verification Expectations

- Re-read this contract and `plans/sprint-02-plan.md` before implementation.
- Prefer targeted automated tests for validation, theming, persistence, and
  SQLite scaffolding over ad hoc manual confidence.
- Treat the minimum required repository checks as sprint gates:
  - `npm --prefix frontend test`
  - `npm --prefix frontend run build`
- The current static/scenario-backed sample path should still validate the
  shared runtime seams after Sprint 2 changes land.
- Treat any pull toward templates, pack generation, builder UX, presenter UX,
  export, or broad primitive work as scope drift and split it forward.

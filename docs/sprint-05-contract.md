# Sprint 5 Contract - Primitive Library + Chart/Theme Compilers + Responsive Runtime

## Objective

Sprint 5 completes the remaining MVP primitive and runtime breadth that sits
between the now-closed multi-pack data/template baseline and the later
builder-mode sprint. The output of this sprint is a frontend-only runtime slice
that:

- adds the remaining six MVP primitives,
- introduces shared chart and theme compiler layers, and
- upgrades the dashboard runtime from a fixed CSS-grid proof into a responsive,
  read-only dashboard renderer.

This sprint is intentionally bounded to primitive/runtime delivery. It does not
deliver builder mode, template authoring UX, presenter mode, export flows, live
bindings, or direct browser SQLite.

## Canon Sources

Sprint 5 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- Sprint 4 closeout artifacts under `docs/`, `plans/`, and `code-reviews/`

If those documents and this contract diverge, the canon docs win and this
contract must be corrected.

## Starting Baseline

Sprint 4 closed the multi-pack mock-data and template-metadata surface:

- healthcare, financial, and saas scenario packs are all present and verified,
- the deterministic generator CLI and SQLite-derived snapshot bridge are stable,
- shared template catalog metadata exists for all three packs,
- the frontend runtime still renders through `DashboardSpec` + `DataAdapter`.

The remaining runtime gap is now clear in code:

- `frontend/src/components/WidgetRenderer.tsx` only supports `kpi` and `line`,
- `frontend/src/core/spec/dashboardSpec.ts` only models `kpi` and `line`,
- `frontend/src/components/charts/LineChart.tsx` still hand-builds chart options
  instead of going through a shared compiler,
- `frontend/src/core/theme/themeRegistry.ts` resolves tokens directly without a
  dedicated chart-theme compiler, and
- `frontend/src/components/DashboardRenderer.tsx` still uses a fixed CSS grid
  rather than a responsive runtime component.

Sprint 5 builds forward from that baseline. It should broaden the primitive and
runtime surface without reopening the Sprint 2 through Sprint 4 spec, adapter,
generator, or template-catalog contracts unless a concrete defect is uncovered.

## Scope

### In Scope

#### 1. Shared Chart And Theme Compiler Foundation

- Add `frontend/src/core/charts/chartCompiler.ts` as the shared compilation path
  for ECharts-backed primitives.
- Add `frontend/src/core/theme/themeCompiler.ts` so chart-facing theme output is
  produced from the DashForge theme tokens instead of being embedded ad hoc in
  individual chart components.
- Centralize shared chart defaults where Sprint 5 needs them:
  - palette selection
  - tooltip styling
  - axis and grid defaults
  - responsive-safe chart spacing
  - threshold/annotation support where already modeled by the spec
- Keep the compiler architecture explicit and type-specific. Sprint 5 should not
  attempt an over-generalized chart DSL engine beyond the supported MVP
  primitives.

#### 2. Remaining MVP Primitive Library

- Deliver the six remaining MVP primitives required by `product-definition.md`:
  - `bar`
  - `stacked_bar`
  - `donut`
  - `table`
  - `sparkline`
  - `gauge`
- Keep existing `kpi` and `line` behavior working while routing ECharts-backed
  primitives through the new shared compiler path.
- Extend the spec/runtime surface only as far as needed for the MVP primitive
  set:
  - DashboardSpec types
  - schema validation
  - widget data resolution
  - widget-to-component routing
- Keep widgets consuming data only through `DataAdapter` and existing resolver
  seams.

#### 3. Responsive Read-Only Dashboard Runtime

- Add `frontend/src/dashboard/ResponsiveDashboardGrid.tsx` and wire the runtime
  through it.
- Use the existing layout fields in `DashboardSpec` (`columns`, `rowHeight`,
  `breakpoints`, and widget positions) to create responsive rendering at the
  `lg`, `md`, and `sm` breakpoints.
- Keep the runtime read-only:
  - no drag/drop
  - no resize handles
  - no builder controls
- Keep `DashboardBox` as the container primitive, but broaden it only as needed
  for variable-height primitives and consistent loading/empty/error behavior.

#### 4. Runtime Proof And Test Coverage

- Refresh the current sample/runtime proof so at least one dashboard spec
  exercises multiple primitive types against the closed Sprint 4 data baseline.
- Add targeted automated coverage for:
  - chart compiler behavior
  - theme compiler behavior
  - primitive rendering
  - responsive layout behavior
  - DashboardRenderer behavior with a broader primitive mix
- Keep verification centered on `frontend/` because Sprint 5 is not expected to
  change the Python generator surface.

### Explicitly Out Of Scope

- Builder mode, drag/drop composition, property editing, or palette UX
- `react-grid-layout` adoption, resize handles, or editable breakpoint layouts
- Template authoring UI or full template-selection workflow
- Presenter mode, narrative UX, or export features
- AI generation features
- Production/live data connectors
- Direct browser SQLite runtime beyond the existing snapshot-backed path
- New industry packs or generator behavior beyond defect-only repairs
- Python scaffold cleanup or repo restructuring

## Constraints

- Build on Sprint 2 through Sprint 4 seams instead of redesigning them.
- `DataAdapter` remains the only data contract visible to widgets and renderers.
- Shared template catalog metadata from Sprint 4 remains metadata-only unless a
  minimal runtime proof needs to consume it.
- Do not add external runtime dependencies for this sprint.
- Keep `react-grid-layout` deferred to the later builder-mode slice rather than
  pulling that dependency into Sprint 5 without explicit human approval.
- Prefer explicit per-chart compiler branches and reusable helpers over a
  universal abstraction that is harder to verify.
- Theme work must keep CSS-variable styling and chart styling aligned across both
  built-in themes.
- Sample/runtime wiring should change only where needed to prove the broader
  primitive and responsive runtime slice.

## Required Outputs

- `docs/sprint-05-contract.md`
- `plans/sprint-05-plan.md`
- `frontend/src/core/charts/chartCompiler.ts`
- `frontend/src/core/theme/themeCompiler.ts`
- `frontend/src/components/charts/BarChart.tsx`
- `frontend/src/components/charts/StackedBarChart.tsx`
- `frontend/src/components/charts/DonutChart.tsx`
- `frontend/src/components/charts/TableChart.tsx`
- `frontend/src/components/charts/SparklineChart.tsx`
- `frontend/src/components/charts/GaugeChart.tsx`
- `frontend/src/dashboard/ResponsiveDashboardGrid.tsx`
- supporting runtime/spec/test updates primarily under:
  - `frontend/src/components/`
  - `frontend/src/core/spec/`
  - `frontend/src/core/data/`
  - `frontend/src/sample/`
  - `frontend/src/**/*.test.ts*`

## Ordered Work

1. Lock the Sprint 5 contract and plan against Sprint 4 closeout and the current
   frontend/runtime baseline.
2. Expand the spec, schema, and widget-routing surface from `kpi`/`line` to the
   full MVP primitive set.
3. Add the shared chart compiler and theme compiler layers.
4. Deliver the remaining ECharts-backed primitives and the table primitive.
5. Upgrade the renderer to use a responsive read-only dashboard grid.
6. Refresh the sample/runtime proof so the broader primitive set is actually
   exercised through `DashboardSpec` + `DataAdapter`.
7. Add targeted tests for compiler output, theming, primitive rendering, and
   responsive runtime behavior.
8. Verify, repair, and hand off the sprint before opening Sprint 6.

## Acceptance Criteria

1. Sprint 5 remains bounded to primitive/runtime breadth only.
2. `DashboardSpec` and schema validation support the MVP primitive set:
   `kpi`, `line`, `bar`, `stacked_bar`, `donut`, `table`, `sparkline`, and
   `gauge`.
3. `frontend/src/core/charts/chartCompiler.ts` exists and is the shared option
   path for the ECharts-backed primitives shipped in Sprint 5.
4. `frontend/src/core/theme/themeCompiler.ts` exists and produces chart-facing
   theme output for both built-in themes without breaking the existing CSS-token
   path.
5. `WidgetRenderer` and related resolvers can render each supported primitive
   through `DashboardSpec` + `DataAdapter`, not direct mock-data imports.
6. `frontend/src/dashboard/ResponsiveDashboardGrid.tsx` exists and
   `DashboardRenderer` uses a responsive, read-only layout path at the spec's
   breakpoints.
7. At least one broadened dashboard sample/runtime proof renders multiple
   primitive types against the current closed data baseline.
8. `npm --prefix frontend test` passes after the Sprint 5 slice lands.
9. `npm --prefix frontend run build` passes after the Sprint 5 slice lands.
10. The only remaining manual validation gap may be the already-known local
    browser smoke that requires a host environment with localhost port binding.

## Verification Expectations

- Re-read this contract and `plans/sprint-05-plan.md` before implementation.
- Prefer targeted frontend checks for:
  - chart compiler output
  - theme compiler output
  - primitive rendering behavior
  - responsive runtime behavior
  - current sample-dashboard compatibility
- Treat drift toward builder UX, presenter UX, export, direct browser SQLite,
  or live bindings as scope-control defects and split them forward.

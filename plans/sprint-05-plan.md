# Sprint 5 Plan - Primitive Library + Chart/Theme Compilers + Responsive Runtime

## Goal

Execute Sprint 5 as a bounded frontend runtime slice that closes the remaining
MVP primitive-library work, adds shared chart/theme compiler seams, and replaces
the current fixed-grid renderer with a responsive read-only dashboard runtime.

The output of this sprint should make the dashboard runtime feel materially more
workshop-ready without dragging builder-mode or live-binding scope forward.

## Planning Assumptions

- Sprint 4 closeout artifacts are authoritative for the current multi-pack and
  template-metadata baseline.
- The Python generator and SQLite-derived snapshot path are stable and should be
  treated as closed dependencies, not active Sprint 5 design space.
- The current runtime gap is in `frontend/`, not in `src/dashForge/`.
- `DataAdapter`, DashboardSpec identity/meta/data-context fields, and the
  Sprint 4 template catalog are baseline contracts, not redesign targets.
- `react-grid-layout` remains intentionally deferred until the builder sprint,
  so Sprint 5's responsive runtime must stay read-only and dependency-light.

## Implementation Guardrails

- Keep all widget rendering driven by `DashboardSpec` + `DataAdapter`.
- Do not let chart components reach into mock-data registries directly.
- Use the shared compiler layer for ECharts-backed primitives instead of growing
  more one-off option builders.
- Keep theme compilation centralized so component styling and chart styling do
  not drift.
- Do not add external runtime dependencies for layout or charting.
- Keep Sprint 5 verification centered on frontend tests and build health.

## Scope Summary

### Deliver In Sprint 5

- `frontend/src/core/charts/chartCompiler.ts`
- `frontend/src/core/theme/themeCompiler.ts`
- the six missing MVP primitives:
  - `BarChart.tsx`
  - `StackedBarChart.tsx`
  - `DonutChart.tsx`
  - `TableChart.tsx`
  - `SparklineChart.tsx`
  - `GaugeChart.tsx`
- expanded DashboardSpec/schema/runtime support for the eight MVP primitives
- `frontend/src/dashboard/ResponsiveDashboardGrid.tsx`
- DashboardRenderer/WidgetRenderer integration for broader primitive routing
- refreshed runtime proof and tests that exercise the broader primitive set

### Do Not Deliver In Sprint 5

- Builder mode, drag/drop, palette UX, or property editing
- `react-grid-layout`
- presenter mode or narrative controls
- export tooling
- direct browser SQLite execution
- live bindings or production connectors
- new industry-pack or generator features beyond defect-only repairs
- full template gallery authoring or selection UX

## Ordered Work

### 1. Expand The Runtime Contract Surface

Objective:
Broaden the type/schema/runtime surface from a two-primitive proof into the full
MVP primitive set without destabilizing the closed Sprint 2 through Sprint 4
contracts.

Primary file targets:

- `frontend/src/core/spec/dashboardSpec.ts`
- `frontend/src/core/spec/dashboardSchema.ts`
- `frontend/src/components/WidgetRenderer.tsx`
- `frontend/src/core/data/widgetDataResolvers.ts`

Done when:

- the spec can represent `bar`, `stacked_bar`, `donut`, `table`, `sparkline`,
  and `gauge` in addition to the existing `kpi` and `line` types
- schema validation accepts the broadened chart surface and still rejects
  malformed widgets
- widget routing can distinguish all supported primitives cleanly
- data resolvers stay behind the existing adapter seam

### 2. Add The Theme Compiler

Objective:
Move chart-facing theme behavior out of `themeRegistry.ts` into a dedicated
compiler seam that can be reused across all supported primitives.

Primary file targets:

- `frontend/src/core/theme/themeCompiler.ts`
- `frontend/src/core/theme/themeRegistry.ts`
- `frontend/src/core/theme/themeRegistry.test.ts`

Done when:

- built-in themes still resolve their CSS variables cleanly
- chart-facing theme output is derived from a dedicated compiler path
- both built-in themes have one consistent source of chart palette, tooltip,
  axis, grid, and text styling
- existing theme callers remain simple and testable

### 3. Add The Shared Chart Compiler

Objective:
Centralize ECharts option creation so the primitive library grows through a
shared runtime seam instead of chart-local option builders.

Primary file targets:

- `frontend/src/core/charts/chartCompiler.ts`
- optional helpers under `frontend/src/core/charts/`
- `frontend/src/components/charts/EChartCanvas.tsx`

Done when:

- ECharts-backed primitives can request compiled options from one shared path
- common defaults for tooltip, grid, palette, and spacing are not duplicated
- the compiler stays explicit and readable rather than becoming a speculative
  universal abstraction
- line-chart behavior remains intact while moving onto the shared compiler path

### 4. Deliver The Remaining ECharts-Backed Primitives

Objective:
Close the remaining visual primitive gap for the MVP chart set.

Primary file targets:

- `frontend/src/components/charts/BarChart.tsx`
- `frontend/src/components/charts/StackedBarChart.tsx`
- `frontend/src/components/charts/DonutChart.tsx`
- `frontend/src/components/charts/SparklineChart.tsx`
- `frontend/src/components/charts/GaugeChart.tsx`
- related tests under `frontend/src/components/charts/`

Done when:

- all required ECharts-backed primitives exist as concrete components
- they consume compiler output rather than embedding incompatible option logic
- they render correctly in both built-in themes
- the routing layer can select them from DashboardSpec widgets

### 5. Deliver The Table Primitive

Objective:
Add the last non-ECharts primitive needed by the MVP runtime while keeping it
inside the same DashboardSpec/DataAdapter surface.

Primary file targets:

- `frontend/src/components/charts/TableChart.tsx`
- `frontend/src/core/data/widgetDataResolvers.ts`
- `frontend/src/components/WidgetRenderer.tsx`
- related tests under `frontend/src/components/charts/`

Done when:

- table widgets render from adapter-backed rows
- empty/loading/error behavior still flows through `DashboardBox`
- the table primitive respects theme styling instead of becoming a visual outlier

### 6. Add The Responsive Read-Only Grid Runtime

Objective:
Replace the current fixed CSS-grid-only rendering path with a responsive
dashboard runtime that honors DashboardSpec breakpoints without introducing
builder behavior.

Primary file targets:

- `frontend/src/dashboard/ResponsiveDashboardGrid.tsx`
- `frontend/src/components/DashboardRenderer.tsx`
- `frontend/src/components/DashboardBox.tsx`
- `frontend/src/styles.css`

Done when:

- dashboard layout responds at `lg`, `md`, and `sm`
- widgets remain read-only and spec-position-driven
- the runtime does not require drag/drop or external layout dependencies
- broader primitives still render inside the responsive grid without clipping or
  broken empty/error states

### 7. Refresh The Runtime Proof

Objective:
Make the new breadth real by exercising it through one richer dashboard spec
instead of leaving the sprint proven only by isolated component tests.

Primary file targets:

- `frontend/src/sample/sampleDashboard.ts`
- `frontend/src/components/DashboardRenderer.test.tsx`
- optional sample/supporting files under `frontend/src/sample/`

Done when:

- at least one dashboard sample uses multiple primitive types
- the broadened runtime proof still consumes data through adapters
- the sample stays aligned with the closed pack/template baseline instead of
  inventing new product scope

### 8. Add Verification Coverage

Objective:
Leave Sprint 5 with durable proof around compilers, primitives, and responsive
runtime behavior.

Primary file targets:

- tests under `frontend/src/core/charts/`
- tests under `frontend/src/core/theme/`
- tests under `frontend/src/components/charts/`
- `frontend/src/components/DashboardRenderer.test.tsx`
- tests for `frontend/src/dashboard/ResponsiveDashboardGrid.tsx`

Done when:

- compiler output is covered
- both themes are covered across the broadened primitive/runtime surface
- responsive layout behavior is covered
- the sample dashboard render path is covered
- `npm --prefix frontend test` and `npm --prefix frontend run build` stay green

### 9. Verify And Close The Slice

Objective:
Hand Sprint 6 a runtime that is materially broader and more workshop-ready,
while leaving builder-mode work intentionally queued.

Done when:

- frontend tests pass
- frontend build passes
- residual limits are documented as future work instead of absorbed into Sprint 5
- the sprint is ready for verify, repair, and review/handoff

## Verification Matrix

| Area | Proof |
|------|-------|
| Spec/schema breadth | All eight MVP primitives are modeled and validated |
| Chart compiler | Shared compiler produces option output for ECharts-backed primitives |
| Theme compiler | Both built-in themes produce consistent chart-facing output |
| Primitive coverage | Bar, stacked bar, donut, table, sparkline, and gauge render through the runtime |
| Runtime routing | WidgetRenderer selects and renders the full MVP primitive set |
| Responsive runtime | DashboardRenderer uses `ResponsiveDashboardGrid` and responds across breakpoints |
| Runtime proof | At least one multi-primitive dashboard sample renders through adapter-backed data |
| Frontend health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Risks And Controls

| Risk | Control |
|------|---------|
| Sprint 5 drifts into builder mode | Keep layout strictly read-only and defer drag/drop/property editing to Sprint 6 |
| Compiler abstraction gets too generic too early | Use explicit type-specific branches and only extract common helpers that Sprint 5 actually needs |
| Theme styling diverges between charts and containers | Centralize chart theme compilation and keep built-in themes under shared tests |
| Primitive additions bypass the adapter seam | Route all new widget data through `widgetDataResolvers` and `DataAdapter` |
| Responsive work quietly reintroduces a dependency debate | Keep `react-grid-layout` deferred and solve Sprint 5 with the existing spec layout primitives |
| Proof stays too synthetic | Refresh the sample dashboard so the broadened runtime is exercised against the closed pack baseline |

## Exit Condition

Sprint 5 planning is complete when implementation can start from this document
and `docs/sprint-05-contract.md` without re-deciding:

- which primitives are in scope,
- where the chart/theme compiler seams live,
- how responsive runtime work stays read-only, and
- what evidence is required to call the sprint implementation-ready.

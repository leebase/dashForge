# DashForge MVP Remaining Contract

## Purpose

Sprint 1 is complete. DashForge now has a proven frontend foundation, a
validated DashboardSpec subset, `DashboardBox`, KPI and line primitives, and a
scenario-backed healthcare sample flowing through the adapter seam. This
contract defines only the work still required to reach the workshop-ready MVP
described in `product-definition.md`, `project-plan.md`, and `architecture.md`.

The intent is one long-running governed delivery, not a new roadmap. The run
must finish the remaining MVP surface, stay inside the existing canon, and make
partial completion legible if execution halts before green.

## Canon Boundary

This contract is bounded by the following canon decisions:

- The workshop-ready MVP is the success bar.
- Phase 2 supplies believable mock-data, broader primitive coverage, and
  template-ready scenarios.
- Phase 3 supplies builder flow, presenter flow, and export.
- The spec remains the product, and all widgets continue to consume data only
  through the `DataAdapter` seam.
- The existing React/Vite/TypeScript frontend in `frontend/` is extended; it is
  not replaced.

## Already Complete And Therefore Not Part Of This Contract

- React 19 + Vite + TypeScript application foundation
- Initial DashboardSpec types and Ajv validation
- Runtime shell and theme-token baseline
- `DashboardBox` foundation with title and state handling
- KPI and line-chart primitives
- Scenario-backed healthcare sample data through the adapter seam
- Baseline frontend tests, build, and governed Sprint 1 closeout artifacts

## Remaining Workshop-Ready MVP Scope

### 1. Mock-Data And Template Foundation

- Deliver the 3 MVP industry packs: Healthcare, Financial Services, and
  SaaS/Technology.
- Provide 2-3 believable scenarios per pack, matching the product-definition
  storylines.
- Provide 3 template dashboards per pack: executive summary, operational
  detail, and risk/alert.
- Preserve seeded, repeatable mock-data behavior and keep the content path
  aligned with the canon SQLite-backed mock-storage destination behind the
  adapter contract.

### 2. Primitive And Runtime Expansion

- Reach the MVP primitive set of 8 total widgets: KPI, line, bar, stacked bar,
  donut, table, sparkline, and gauge.
- Keep rendering spec-driven through the widget registry and ECharts compiler
  path rather than widget-specific one-offs.
- Extend the current `DashboardBox` behavior to cover the resize and responsive
  expectations needed by the workshop builder flow.

### 3. Builder And Composition Slice

- Adopt `react-grid-layout` for drag/drop composition, resize, and responsive
  layout editing.
- Support template selection as a first-class workshop starting path.
- Support save/load of human-readable, version-stamped DashboardSpec JSON.
- Support the 2 MVP themes: light professional and dark executive.

### 4. Storytelling And Export Slice

- Add presenter mode with section-by-section walkthrough behavior.
- Support commentary and widget emphasis/highlighting during presentation.
- Export DashboardSpec JSON and static PNG/PDF proposal artifacts.

### 5. Governed Delivery Trail

- Keep the contract, implementation plan, verification trail, review artifact,
  and durable memory docs aligned with the actual result of the run.

## Explicitly Out Of Scope

- AI spec generation
- Live production data binding or production conversion
- Multi-user collaboration
- Custom chart-type builder
- Chart families beyond the MVP 8
- Themes beyond the 2 MVP themes
- SaaS deployment, auth, billing, or external productization
- Python scaffold cleanup unless a narrow adjustment is required to keep the
  frontend MVP path working

## Required Outputs

- `docs/mvp-remaining-contract.md`
- `plans/mvp-remaining-delivery-plan.md`
- One governed playbook for the remaining MVP under `playbooks/`
- Expanded pack, scenario, template, and adapter-facing content assets in
  `frontend/`
- The missing MVP primitives and runtime wiring in `frontend/`
- Builder, presenter, and export implementation slices in `frontend/`
- Review and handoff artifacts in `code-reviews/`, `context.md`,
  `result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, and `project-plan.md`

## Acceptance Boundary

The governed delivery is complete only when the following are true:

1. All 3 MVP industry packs exist with believable scenario coverage and template
   coverage that matches the workshop-ready MVP.
2. The frontend runtime supports the full 8-primitive MVP set through
   spec-driven rendering.
3. Builder flow exists with `react-grid-layout` composition, resize,
   responsiveness, template selection, theme selection, and spec save/load.
4. Presenter mode exists with guided walkthrough behavior and widget emphasis.
5. Export works for JSON plus static PNG/PDF artifacts.
6. The adapter boundary remains intact, and the mock-data path stays aligned
   with the canon SQLite-backed direction rather than hard-coding widget data.
7. `npm --prefix frontend test` passes.
8. `npm --prefix frontend run build` passes.
9. Durable docs record the exact post-run state without claiming optional or
   unshipped work.

## Constraints

- `product-definition.md` and `architecture.md` remain canon.
- Value-delivery order wins, but not at the cost of breaking the spec or
  adapter seams.
- Widgets, builder flows, and presenter flows must not import mock-data
  internals directly.
- The run must stop at the workshop-ready MVP boundary and not drift into Phase
  4 or other optional work.
- If the long-running delivery halts, the resulting review and handoff docs must
  record the exact unfinished remainder rather than softening the contract.

## Single Governed Delivery Order

1. Re-state the remaining MVP contract from canon.
2. Write the ordered delivery plan.
3. Expand pack/scenario/template coverage and the adapter-facing mock-data
   substrate, including the SQLite-aligned storage path needed by the canon.
4. Expand the primitive library and runtime wiring to the full MVP widget set.
5. Add builder-mode composition, resize, responsiveness, template flows,
   theme flows, and spec save/load.
6. Add presenter-mode walkthrough and export flows.
7. Repair defects and run the full verification loop until the frontend is
   green or the exact remaining gap is documented.
8. Record a review artifact that prioritizes actual findings.
9. Update durable project memory so any later agent can resume from the true
   end state.

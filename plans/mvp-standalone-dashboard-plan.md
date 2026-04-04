# MVP Standalone Dashboard Plan

## Implementation Strategy

The next slice should be treated as a product-surface correction, not as a new
feature stack.

DashForge already proved builder, presenter, export, AI-assisted authoring, and
bounded live binding. What it has not yet proved is the clarified MVP: opening
immediately into one believable scenario dashboard backed by generated data.

The implementation should therefore:

- use the existing ED throughput package as the single MVP anchor,
- reuse current generated data artifacts and frontend scenario/template
  registration instead of creating a second demo source,
- move the default app entry from `BuilderShell` to a dedicated standalone
  runtime component,
- keep the builder available as an explicit secondary mode, and
- add only the focused tests needed to prove that the app is now standalone by
  default.

Scratch workspace for temporary notes only:

- `/Users/lee/projects/dashForge/.agent-orch-scratch/4c4f6e686c05/mvp_contract_and_plan/attempt-1`

## Standalone Runtime Plan

### 1. Lock The Standalone MVP Inputs

- Use `healthcare:ed-throughput-crunch` as the only default scenario.
- Use the registered default template
  `tpl.healthcare.ed-throughput-command`.
- Treat the existing ED throughput preview artifacts and frontend mock-data
  registration as the authoritative generated-data inputs for the slice.

Exit condition:

- one clear statement of record exists in code and tests that ED throughput is
  the default standalone MVP scenario.

### 2. Assemble A Standalone Dashboard Draft

- Build the standalone runtime from the existing scenario/template contract
  rather than builder-local editing state.
- Prefer instantiating the registered template path for
  `healthcare:ed-throughput-crunch` and then resolving the adapter through
  `createDashboardDataAdapter(...)`.
- Keep the standalone path on the same `DashboardSpec` and `DataAdapter`
  contracts already used by preview and presenter flows.

Exit condition:

- the standalone runtime can resolve one validated dashboard spec plus adapter
  pair without requiring the builder shell to boot first.

### 3. Create The Standalone App Surface

- Add `frontend/src/features/runtime/StandaloneDashboardApp.tsx`.
- Render the command-view dashboard directly with only the chrome needed for a
  dashboard-first experience: title/context, scenario framing, and one explicit
  route into the builder.
- Do not wrap this surface in the builder hero, widget palette, property rail,
  or template gallery.

Exit condition:

- a first-time user lands on a readable dashboard, not on authoring controls.

### 4. Demote Builder To Explicit Secondary Mode

- Update `frontend/src/App.tsx` so the default render path is the standalone
  runtime.
- Keep `BuilderShell` available only after an explicit user action from the
  standalone surface.
- Reuse the current builder as-is where possible instead of reworking its
  internal flows during this slice.

Exit condition:

- the builder remains available for operator use, but the MVP no longer feels
  builder-wrapped.

### 5. Add Focused Runtime Coverage

- Add or update `frontend/src/App.test.tsx`.
- Cover the key user flow:
  - initial render shows the standalone dashboard,
  - builder-first copy is absent on initial load,
  - explicit action opens the builder path.
- Keep any deeper builder behavior coverage in existing builder tests rather
  than duplicating it here.

Exit condition:

- automated tests prove the app boots into the standalone path and that builder
  access is opt-in.

## Verification

Required checks for the slice:

- `npm --prefix frontend test`
- `npm --prefix frontend run build`

Required user-flow checks during verification:

- open the app and confirm the first visible surface is the ED throughput
  standalone dashboard
- confirm builder hero copy such as `Prompt The Dashboard, Then Refine The Story`
  is absent on first load
- confirm the builder becomes visible only after an explicit action from the
  standalone surface
- confirm the dashboard still renders through the shared runtime rather than a
  special-case mock widget path

## Risks

- The implementation could drift into reusing `BuilderShell` client mode as the
  primary wrapper.
  - Control: require a dedicated `StandaloneDashboardApp` entry point and test
    for absence of builder chrome on first load.
- The standalone surface could diverge from the registered scenario/template
  contract if it hard-codes a separate dashboard shape.
  - Control: instantiate through the existing scenario/template seam first and
    only fall back to another path if tests show a concrete mismatch.
- The repo has both root-level scenario artifacts and frontend mock-data copies.
  - Control: treat the existing ED throughput package as the source-of-truth
    family and keep the frontend runtime aligned to that contract instead of
    inventing a new payload shape.
- Builder access could become harder than necessary for operators.
  - Control: make builder entry explicit and obvious, but secondary.

## Open Questions

- Should the first standalone surface include presenter mode controls, or stay
  dashboard-first only?
  - Recommended answer: dashboard-first only for this slice; preserve presenter
    behavior behind the builder/runtime seams unless it is nearly free.
- Should the standalone runtime source its dashboard from template
  instantiation or from the serialized ED command-view spec?
  - Recommended answer: prefer template instantiation through the registered
    contract; use the serialized spec only if a concrete fidelity gap appears.
- Should scenario switching be visible in the standalone MVP?
  - Recommended answer: no; keep the slice locked to one default scenario so
    the app proves clarity before breadth.

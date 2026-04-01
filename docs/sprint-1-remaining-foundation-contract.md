# Sprint 1 Remaining Foundation Contract

## Overview

DashForge already has a working React/Vite/TypeScript frontend foundation, a
validated DashboardSpec subset, and two widget primitives. The remaining Sprint
1 work is to make that foundation more honest to the architecture by removing
inline-only demo payloads, tightening the adapter seam, and recording the two
major near-term decisions that were still open in project memory.

## Remaining Objectives Inventory

### Complete in this governed slice

- move the sample dashboard off inline widget payloads and onto scenario-backed
  mock data resolved through the adapter layer
- reduce the current frontend bundle warning introduced by the ECharts runtime
- decide and record whether `react-grid-layout` should be adopted now or
  deferred
- decide and record how the legacy Python scaffold should be treated after
  Sprint 1
- add the missing Agent-Orch-compatible governed workflow artifacts to the repo

### Remaining after this slice

- expand the primitive library toward the MVP target beyond KPI and line
- build richer industry-pack coverage and scenario depth
- add dashboard templates, theme variants, presenter mode, and export
- decide the timing and shape of live production data binding

## In Scope

- `frontend/src/` runtime, spec, adapter, and tests
- `playbooks/`, `docs/`, `plans/`, and `code-reviews/` additions needed for a
  governed delivery trail
- durable docs that record the new state and remaining roadmap

## Out of Scope

- adding `react-grid-layout` as a runtime dependency in this slice
- removing the Python scaffold from the repository
- adding new chart families beyond what is required to prove the adapter-backed
  path
- implementing presenter mode, export, or live data bindings

## Required Outputs

- a governed playbook under `playbooks/`
- a contract doc and implementation plan for this slice
- adapter-backed mock-data plumbing in `frontend/src/`
- tests and build verification that pass cleanly
- a recorded review artifact and updated durable docs

## Acceptance Checks

1. The sample dashboard renders using `data.source = "mock"` instead of
   inline-only payloads.
2. The frontend adapter resolves scenario data from a registry or catalog
   instead of embedding per-widget payloads in the sample spec.
3. `npm test` and `npm run build` pass under `frontend/`.
4. The production build no longer emits the prior large single-bundle warning
   for the main application bundle.
5. The decisions about layout-engine adoption and Python-scaffold retirement
   are recorded explicitly.
6. A governed review artifact exists and the durable docs reflect the new
   completion state.

## Constraints

- Preserve DashForge's canon in `product-definition.md` and `architecture.md`.
- Do not add `react-grid-layout` yet; the repo guardrails still require
  explicit permission for new runtime dependencies.
- Keep the adapter seam explicit. Widgets must not import mock datasets
  directly.
- Keep the playbook explicit, file-first, and reviewable.

## Dependency Order

1. Write the contract.
2. Turn it into a concrete implementation plan.
3. Implement the adapter-backed mock-data slice and tests.
4. Update user-facing and operator-facing docs plus architecture decisions.
5. Run repair and verification until the slice is green.
6. Record a review artifact.
7. Update handoff docs.

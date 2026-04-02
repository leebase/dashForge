# Code Review — 2026-04-01

## Architecture Summary

DashForge is a spec-driven React/Vite dashboard accelerator where industry
scenario assets, `DashboardSpec` documents, and presenter narrative all flow
through one bounded runtime contract instead of custom per-demo code. This
materialization slice stays outside the app runtime itself and packages one
healthcare scenario into concrete mock-shaped assets plus a serialized command
view, with the main risks concentrated at documentation-to-runtime boundaries:
the materialized JSON must stay plausible against the current
`DashboardSpec`/mock-data shapes, and the operator-facing binding map must not
claim chart semantics the runtime cannot actually encode.

## Checks Run

| Command | Result |
|---------|--------|
| `python3 -m pytest -q` | ✅ Pass |
| `npm --prefix frontend test` | ✅ Pass |
| `npm --prefix frontend run build` | ✅ Pass |

## Findings

| ID | Severity | Category | Location | Problem | Proposed Fix |
|----|----------|----------|----------|---------|--------------|
| M001 | Med | Documentation accuracy | `scenarios/healthcare/ed-throughput-crunch-binding-map.md` | Verification found that the binding map described two charts as encoding discharge, LWBS, and diversion measures that the current runtime contract does not actually encode. | Closed in `code-reviews/repair-ed-throughput-crunch-materialization.md` by distinguishing encoded fields from supporting dataset columns and softening the related presenter-step claims. |

Open findings after repair: none.

## Remediation Roadmap

### Fix Now (Blockers)

None.

### Fix Soon (High ROI)

None. The only verification finding was repaired inside the governed flow.

### Fix Later (Refactors)

- Register the scenario and starter path in the frontend runtime under a new
  bounded integration slice if these materialized assets need to become
  app-visible instead of remaining package artifacts under `scenarios/`. This
  integration is now complete.

## Patch Suggestions

None. The governed repair already closed the only finding without requiring
further changes in this review step.

## Test Additions Recommended

- [ ] Add a future seam-level test when these artifacts are next promoted into a
      reusable cross-industry scenario-building workflow surface so registered
      scenarios, starter resolution, and adapter lookup stay aligned.

## Verdict

Pass.

The verify/repair/review trail is now closed for the ED throughput
materialization workflow. The package contains discoverable scenario assets at:

- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`

The governed workflow that produced them is:

- `playbooks/ed_throughput_crunch_materialization_workflow.yaml`

Within the bounded scope defined by the materialization contract and plan, no
blocking or medium-severity issues remain after repair. The integration has since
been completed as an in-app scenario starter and template registration.

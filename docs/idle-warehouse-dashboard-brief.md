# Slice brief: idle-warehouse-dashboard

## Intent

The buyer-visible Cost Management accelerator: a dashForge standalone dashboard for the `idle-warehouse-waste` Snowflake cost story that a CFO, CIO, or VP Data can open in a browser with no backend, see the headline credit opportunity and warehouse concentration, open the prioritized recommendation queue (severity, suggested owner, recommended action, evidence detail, guardrail), and always see that the numbers are synthetic demo data. This is what Lee shows to win a Snowflake cost engagement.

## UI contract (the browser smoke gate checks exactly this)

- The standalone build served from `frontend/dist` renders the scenario at `/?scenario=idle-warehouse-waste` with no dataForge receipt or backend: bundle the scenario's snapshot, produced by `env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 3101 --output <db> --snapshot-output <json>`, under `scenarios/idle-warehouse-waste/` (spec, preview data, blueprint) the way the healthcare scenario is bundled, and load it through the existing `StaticDataAdapter`/DashboardSpec seams. Do not add a second renderer or a second recommendation engine.
- The scenario root carries `data-scenario="idle-warehouse-waste"` and the existing readiness attribute `data-readiness="controlled"` once data is loaded.
- A persistent, visible disclosure element carries `data-disclosure="synthetic-demo-data"` and the text `Synthetic demo data`; it also appears in any exported buyer artifact.
- A control with `data-action="open-recommendation-queue"` opens the recommendation queue; the rendered queue carries `data-status="recommendation-queue"` and lists recommendations from `recommendation_queue` with `FINANCE_REPORTING_WH` (IWW-001, P0) first, showing executive_severity, suggested_owner, recommended_action, evidence_detail and guardrail. Savings are labelled directional until validated.
- The existing `data-action="same-day-executive-follow-up"` handoff remains reachable from this scenario; do not duplicate that generator.
- `tests/browser_smoke_manifest.json` encodes this contract and is pinned by the playbook; do not edit it. The previous client-meeting manifest is preserved as `tests/browser_smoke_manifest.client-meeting-20260811.json`.

## Required engineering

- Frontend tests for the scenario, the disclosure, and the recommendation queue; the full frontend suite green; production build (`npm --prefix frontend ci && npm --prefix frontend run build`) succeeds and `frontend/dist/index.html` exists.
- Python side stays as delivered by slices 2 and 3; if a snapshot field is missing for the UI, extend `idle_warehouse_waste.py` rather than the frontend.

## Out of scope

- Live Snowflake access, new dependencies, RBAC or ELT stories, edits under `dataForge/`.

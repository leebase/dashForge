# ED Throughput Crunch Materialization Repair

Date: 2026-04-01
Author: Codex
Related verification:
- `code-reviews/verify-ed-throughput-crunch-materialization.md`

## Repair Summary

Repaired `M001` from verification by aligning
`scenarios/healthcare/ed-throughput-crunch-binding-map.md` to the actual
encoded field surface of the serialized `DashboardSpec`.

The repair keeps the materialized JSON spec unchanged. The defect was in the
operator/reference documentation: two widget rows and two presenter-step
messages implied that the current charts visualize more measures than the
runtime contract permits.

## Changes Made

- Updated the `service_line_driver` binding-map row to distinguish encoded
  fields from supporting dataset columns.
- Updated the `experience_consequence` binding-map row to distinguish encoded
  fields from supporting dataset columns.
- Added an explicit runtime-contract note explaining that current `line`
  widgets encode `x`, `y`, and optional `series`, while `stacked_bar` widgets
  encode `x`, `y`, and required `series`.
- Softened the `What Is Driving It` and `What It Is Causing` presenter-step
  messages so they describe discharge, LWBS, and diversion as supporting
  narrative context rather than directly encoded chart measures.

## Verification Rerun

Ran a focused spec-to-doc check:

```bash
cd /Users/lee/projects/dashForge
python3 - <<'PY'
import json
from pathlib import Path

spec = json.loads(Path("scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json").read_text())
for widget_id in ("service_line_driver", "experience_consequence"):
    widget = next(w for w in spec["widgets"] if w["id"] == widget_id)
    print(widget_id, {k: v["field"] for k, v in widget["chart"]["encoding"].items()})
    print("columns", widget["data"].get("columns", []))
PY

rg -n "service_line_driver|experience_consequence|runtime contract matters|What Is Driving It|What It Is Causing" \
  scenarios/healthcare/ed-throughput-crunch-binding-map.md
```

Observed result:

- `service_line_driver` encodes only `service_line`, `avg_boarding_hours`, and
  `facility_name`, while retaining `discharge_before_noon_rate` only as a
  supporting dataset column.
- `experience_consequence` encodes only `week_start`,
  `patient_satisfaction_score`, and `facility_name`, while retaining
  `lwbs_rate` and `diversion_hours` only as supporting dataset columns.
- The binding map now reflects that distinction directly and no longer
  overstates the current chart surface.

## Outcome

`M001` is closed.

The materialized ED throughput package remains plausible against the current
DashForge `DashboardSpec` contract, and the operator/reference map now
accurately describes what the first serialized command-view page actually
renders today.

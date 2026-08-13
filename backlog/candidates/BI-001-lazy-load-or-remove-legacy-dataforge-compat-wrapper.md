---
id: BI-001
title: Lazy-load or remove the legacy dataForge compat wrapper (reviewer finding CMD-R1)

source: code-review/run-e40c272b0e04
source_insight: >
  During the governed shakedown run e40c272b0e04, the independent
  cross-provider reviewer (claude_code / claude-opus-4-1) failed the package
  review with a real Medium finding, CMD-R1: importing dashForge.generate
  unconditionally loads DataForge source — src/dashForge/generate.py calls
  load_dataforge_module("generate") in its module body, and
  src/dashForge/_dataforge_compat.py probes $DATAFORGE_SRC then the sibling
  ../dataForge/src and inserts the winner into sys.path. The reviewer
  confirmed by execution, not by reading docs.

opportunity: >
  Removing (or lazy-loading) the wrapper makes "DashForge does not import
  DataForge source" true for the entire repository instead of true only for
  the client-meeting-dashboard-builder package dataflow, which lets future
  package reviews run unscoped and keeps the employee boundary story simple.

why_now: >
  The shakedown had to ship with an authorized review-scope clarification
  (the wrapper declared out of scope for the package review, run
  e40c272b0e04 preserved as the honest catch). That scoping is disclosed
  technical debt; this item is its repayment. README already declares the
  Python surface a bounded legacy mock-data shim, not a product runtime.

minimal_impl: >
  Move the load_dataforge_module("generate") call out of the module body of
  src/dashForge/generate.py into the function(s) that actually forward to
  DataForge, so importing dashForge.generate no longer touches DataForge
  source or sys.path; keep the compat CLI behavior identical when the
  forwarding functions are invoked. Alternatively, delete the wrapper and
  tests/test_generate.py outright if Lee agrees the historical CLI is dead.

definition_of_done:
  - Importing dashForge.generate (and dashForge.main) performs no DataForge
    source import and no sys.path mutation, proven by a focused test.
  - The compat CLI path still generates when explicitly invoked, or is
    removed together with its tests and README section.
  - python3 -m pytest tests/ -q passes.
  - The review-scope clarification in
    playbooks/shakedown_client_meeting_dashboard_builder.yaml can be dropped
    on the next specialization because the unscoped boundary claim holds.

effort: S
build_recipe: builder_safe
priority: next

dependencies: []

risks: >
  The wrapper is documented operator surface (README legacy compatibility
  entrypoint); silently changing its import-time behavior could surprise a
  script that relied on side effects.

mitigations: >
  Keep invocation-time behavior byte-identical; only the import-time side
  effect moves. Note the change in README's legacy section.

tags:
  - boundary
  - legacy
  - code-review-finding

status: candidate
created_at: 2026-08-11T01:10:00Z
created_by: ShakedownLegTwo-e40c272b0e04
token_cost: 0

approved_at: ~
approved_by: ~
notes: ~

implemented_at: ~
implemented_by: ~
pr_url: ~
---

# Additional Context

Finding CMD-R1 verbatim (from run e40c272b0e04, attempt 2, preserved in
/home/lee/projects/dashForge-agent-orch-runs/e40c272b0e04):

> CMD-R1 [Medium] src/dashForge/_dataforge_compat.py (load_dataforge_module
> (lines 33-51) reached from src/dashForge/generate.py:5, exercised by
> tests/test_generate.py): DashForge does import DataForge source.
> src/dashForge/generate.py calls load_dataforge_module("generate") in its
> module body, so the import happens unconditionally at import time, and
> _dataforge_compat probes $DATAFORGE_SRC then falls back to the sibling path
> ../dataForge/src, inserting the winner into sys.path. Re-confirmed by
> direct execution in this attempt, not inherited.

The client-meeting-dashboard-builder employee dataflow (frontend/, receipt
consumption, package export) was clean; the finding concerns only the legacy
Python shim.

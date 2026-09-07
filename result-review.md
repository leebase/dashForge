# dashForge Result Review

> **Running log of completed work.** Newest entries at the top.
>
> Each entry documents what was built, why it matters, and how to verify it works.

## 2026-09-06 — Cost Management Storage Waste Slice Passed Governed Review

### What Was Built

Implemented and verified the `cost-management-storage-waste` vertical slice, establishing the buyer-facing Storage Waste dashboard presentation layer for the Snowflake Cost Management accelerator (`snowflakeCost:storage-waste`):

- **Relational Storage Waste Schema Contracts Across Six Canonical Datasets (AC-1)**: Formalized typed relational schemas in `src/dashForge/cost_storage_waste.py` and `src/dashForge/cost_storage_waste_scenario.py` across six core storage governance datasets:
  1. `storage_summary`: Headline storage volume and financial waste posture metrics (`summary_id`, `total_storage_bytes`, `total_monthly_spend_usd`, `recoverable_waste_bytes`, `recoverable_waste_opportunity_usd`, `stale_table_count`, `uncompressed_table_count`, `synthetic_seed`, `evaluation_timestamp`).
  2. `table_storage_metrics`: Granular table-level storage footprint and overhead metrics (`table_id`, `database_name`, `schema_name`, `table_name`, `table_owner`, `row_count`, `active_bytes`, `time_travel_bytes`, `failsafe_bytes`, `retained_for_clone_bytes`, `total_storage_bytes`, `last_altered`).
  3. `stale_tables`: Categorized inventory of orphaned tables and stale tables without read/write activity exceeding threshold days (`stale_id`, `table_id`, `table_name`, `schema_name`, `days_since_last_read`, `days_since_last_write`, `staleness_category`, `monthly_storage_cost_usd`, `suggested_action`).
  4. `uncompressed_storage`: Inventory of suboptimal storage structures and uncompressed data recommendations (`uncompressed_id`, `object_name`, `object_type`, `current_format`, `target_format`, `current_size_bytes`, `estimated_compressed_bytes`, `projected_byte_savings`, `projected_monthly_savings_usd`).
  5. `storage_usage_history`: Longitudinal daily storage consumption trends (`history_id`, `usage_date`, `active_bytes`, `time_travel_bytes`, `failsafe_bytes`, `stage_bytes`, `daily_cost_usd`).
  6. `recommendation_queue`: Prioritized remediation queue surfacing orphaned tables, unused time-travel storage, and uncompressed data recommendations, preserving all six canonical governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`).
  The pipeline exports deterministic SQLite databases and canonical `SQLiteSnapshot` JSON representations strictly conforming to `frontend/src/core/data/sqliteSnapshot.ts`.
- **Canonical DashboardSpec Specification & Runtime DataAdapter Seams (AC-2)**: Defined the canonical `DashboardSpec` specification and template `tpl.snowflakeCost.storage-waste` for scenario `snowflakeCost:storage-waste`, mounting at `/?scenario=storage-waste` in `StandaloneDashboardApp.tsx`. Declares responsive grid layout, KPI scorecards (Total Storage Spend, Recoverable Waste Opportunity, Stale Table Storage, Uncompressed Storage Overhead), storage volume distribution visualizers, table access aging analysis, and prioritized recommendation queue, querying exclusively through DashForge's standard `DataAdapter` runtime interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`) without introducing bespoke or secondary renderers, and operating completely client-side with zero live credentials or external network dependencies.
- **Prioritized Recommendation Queue & Directional Governance Guardrails (AC-3)**: The recommendation engine processes telemetry from `recommendation_queue`, ordering critical high-impact opportunities (`P0` items surfacing orphaned tables, unused time-travel storage, and uncompressed data recommendations) first. Every recommendation card displays all six canonical governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`). All projected dollar savings and configuration changes are explicitly framed as directional pending validation by designated table owners and data stewards (`"All storage savings and remediation recommendations are directional pending validation by designated data owners and table stewards. Destructive table drops or automated data purging without human stakeholder authorization are strictly disabled."`). Interactive toggle control (`data-action="open-recommendation-queue"`, `data-testid="open-recommendation-queue"`) expands container `data-status="recommendation-queue"`.
- **Persistent Synthetic Disclosures, Same-Day Deliverables & Browser Smoke Gate Conformance (AC-4)**: Persistent `data-disclosure="synthetic-demo-data"` badge displaying `"Synthetic demo data"` across presentation surfaces, accompanied by upstream provenance metadata (`packId: "snowflakeCost"`, `scenarioId: "storage-waste"`, seed 9101, `synthetic: true`, `dataForgeStoryContractPath: "stories/snowflake/storage-waste.md"`). Provides interactive same-day executive follow-up artifact generator (`data-action="same-day-executive-follow-up"`, `data-status="executive-follow-up"`) and landscape print-to-PDF export (`data-testid="dashboard-save-pdf"` via `exportDashboardArtifact`). Conforms strictly to `tests/browser_smoke_manifest.json`, preserving contract markers (`"storage-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`) in compiled production bundles under `frontend/dist/assets/*.js` with `data-mode="real-client-disabled"`.
- **Verbatim Workspace-Root Direct Argv Execution & Traceability (AC-5)**: Synchronized `journeys/user_journeys_manifest.json` conforming strictly to `USER_JOURNEYS_MANIFEST_SCHEMA` with valid authorities (`human`, `mission`, `author`), `status: "passed"`, sequential steps, and complete `traces_to` covering `AC-1` through `AC-6` without dangling IDs. Commands comply with allowlisted prefixes (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest`, `npm --prefix frontend test -- --run`) and eliminate all shell constructs (`|`, `&&`, `||`, `;`, `<`, `>`).
- **Preservation of Existing Dashboard Functionality & Regression Safety (AC-6)**: Preserved deterministic CLI generation, fail-closed overwrite protection requiring `--force` exiting with code 2 on collision, clean argument validation via `parser.error()`, backwards compatibility across existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost:idle-warehouse-waste`), existing RBAC accelerators (`snowflakeRbac:rbac-audit-foundation`), and existing ELT accelerators (`CORE_ELT_WH`), with sibling project `dataForge` remaining untouched and read-only. All 311 full test suite tests pass cleanly.
- **Targeted Test Suite (`tests/test_cost_storage_waste_scenario.py`)**: 41 unit and integration tests validating AC-1 through AC-6.

### Why It Matters

In enterprise Snowflake deployments, storage expenditures represent a persistent, compounding, and routinely unscrutinized budget drain. While warehouse compute spikes immediately trigger alarms, terabytes of stale intermediate staging tables, abandoned test clones, uncompressed raw ingest sinks, and excessive time-travel retention silently accumulate month after month. Enterprise FinOps and data engineering leaders (CFOs, CIOs, VPs of Data) urgently need clarity and prioritization to eliminate storage waste, yet compliance policies (SOC 2, HIPAA, GDPR) strictly forbid sharing live cloud credentials during initial discovery workshops. This slice solves this consultative challenge by delivering a standalone, realistic, relational storage waste dashboard and decision-ready follow-up deliverables that run entirely offline and client-side, enabling consulting teams to surface immediate recoverable savings and governed remediation recommendations without credential risk, external dependencies, or post-meeting delay.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-cost-management-storage-waste.verdict.json` and `code-reviews/review-cost-management-storage-waste.md`.
- **Review Lenses**:
  - *Architecture Lens*: Architecture strictly adheres to the requested DataAdapter patterns and ensures sibling repository immutability without custom pipelines. (0 findings)
  - *Requirements Lens*: All acceptance checks are successfully demonstrated. The dashboard specification, governance attributes, and recommendation queue mechanisms meet all contract requirements. (0 findings)
  - *Testing Lens*: Excellent integration and unit test coverage. Backward compatibility tests confirm prior industry packs remain fully functional and unimpacted. (0 findings)
- **Review Checks Run** (from `code-reviews/review-cost-management-storage-waste.verdict.json`):
  - `python3 -m pytest tests/ -q`: exit code 0 ("Full backend test suite passed with 311 tests passing successfully.")
  - `python3 -m pytest tests/test_cost_storage_waste_scenario.py`: exit code 0 ("Preserved validator execution for slice specific test logic.")
  - `python3 -m pytest`: exit code 0 ("Preserved validator execution covering repair and verify step.")
  - `npm --prefix frontend test -- --run`: exit code 0 ("Preserved validator execution for frontend component coverage.")
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/f14ce464fd77/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_cost_storage_waste_scenario.py`, exit status 0, duration 0.176653s, passed: True. Evidence hash: `9fc044dd5f9febb06342e1cd571b8f8081bbc283b8bfbf70e30c84bbdb95b63e`.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_cost_storage_waste_scenario.py`, exit status 0, duration 2.128283s, passed: True (41 passed in 1.31s; counts: passed 41, failed 0, skipped 0). Evidence hash: `5dfb3c028126a9eec70f049fc5218ac9163176805e4e4351f300761df3bd1160`.
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 24.386285s, passed: True (311 passed in 23.56s; counts: passed 311, failed 0, skipped 0). Evidence hash: `588a0fbb23dcb9b356ed5dfd77eebe763f09dc3889856cc2afc1dae831bf06c6`.
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.11062s, passed: True. Evidence hash: `ae95ca40f0c6edadf05a79166f64460a3472fc7b9805c89c0f3dd5d1aa05c67b`.
  - Validator Result 5 (`step_07_repair_and_verify_slice` attempt 1): `npm --prefix frontend test -- --run`, exit status 0, duration 6.361557s, passed: True (35 test files passed, 108 passed in 5.52s). Evidence hash: `33f7908a4f0b88d7252a515f8d1e2d8c149f719c9647ce8da18382dc38c44ff5`.

---

## 2026-09-06 — Synthetic RBAC Audit Foundation Slice Passed Governed Review

### What Was Built

Implemented and verified the `synthetic-rbac-audit-foundation` vertical slice, establishing foundational synthetic access control telemetry, relational schema models, and dashboard specification contracts for the Snowflake RBAC management accelerator (`snowflakeRbac:rbac-audit-foundation`):

- **Foundational Relational Schemas Across Six Canonical Datasets (AC-1)**: Formalized typed relational schemas in `src/dashForge/rbac_audit.py` and `src/dashForge/snowflake_rbac.py` across six core access governance datasets:
  1. `rbac_summary`: Headline posture metrics (`summary_id`, `total_roles`, `active_users`, `elevated_admin_accounts`, `critical_risk_findings`, `synthetic_seed`, `evaluation_timestamp`).
  2. `roles`: Role definitions and administrative metadata (`role_name`, `role_type`, `role_owner`, `comment`, `created_on`).
  3. `role_hierarchy`: Directed role inheritance relationships (`link_id`, `parent_role`, `child_role`, `tree_depth`, `granted_by`, `grant_date`).
  4. `user_role_assignments`: Identity entitlement mappings (`assignment_id`, `user_name`, `role_name`, `grant_type`, `mfa_enabled`, `account_status`, `last_login`).
  5. `object_grants`: Securable object access permissions (`grant_id`, `grantee_role`, `securable_type`, `securable_name`, `privilege`, `is_grantable`).
  6. `governance_findings`: Audited security findings preserving all six canonical governance fields (`finding_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `risk_detail`, `guardrail`).
  The pipeline produces deterministic SQLite databases and canonical `SQLiteSnapshot` JSON representations conforming to `frontend/src/core/data/sqliteSnapshot.ts`.
- **Canonical DashboardSpec Specification & Runtime DataAdapter Seams (AC-2)**: Defined the canonical `DashboardSpec` specification in `frontend/src/features/rbac-audit/rbacAuditSpec.ts` and template `tpl.snowflakeRbac.rbac-audit-foundation` for scenario `snowflakeRbac:rbac-audit-foundation`. Declares grid layout, KPI metric cards (Total Roles, Active Users, Elevated Admins, High-Risk Findings), interactive role hierarchy tree visualization (`role-hierarchy-tree`), user access audit matrix (`user-access-matrix`), and prioritized governance findings queue (`governance-findings`), binding exclusively through DashForge's standard `DataAdapter` runtime interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`) without introducing bespoke or secondary renderers.
- **Persistent Synthetic Disclosures & Directional Security Guardrails (AC-3)**: All presentation surfaces, views, and exports prominently feature unsuppressed `data-disclosure="synthetic-demo-data"` badges with exact text `"Synthetic demo data"`, accompanied by upstream provenance metadata (`packId: "snowflakeRbac"`, `scenarioId: "rbac-audit-foundation"`, `seed: 42`, `synthetic: true`, `dataForgeStoryContractPath: "stories/snowflake/rbac-audit-foundation.md"`), and explicit directional security validation guardrails stating that all role remediation recommendations are directional pending confirmation with designated security administrators.
- **Frontend Production Build Conformance & Browser Smoke Gate Markers (AC-4)**: The production build compiled via `npm --prefix frontend run build` outputs optimized static assets in `frontend/dist/` with zero TypeScript errors, strictly preserving all four contract markers: `"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, and `"governance-findings"` with `data-mode="real-client-disabled"`.
- **Verbatim Workspace-Root Direct Argv Execution & Traceability (AC-5)**: Synchronized `journeys/user_journeys_manifest.json` conforming strictly to `USER_JOURNEYS_MANIFEST_SCHEMA` with valid authorities (`human`, `mission`, `author`), `status: "passed"`, sequential steps, and complete `traces_to` covering `AC-1` through `AC-6` without dangling IDs. Commands comply with allowlisted prefixes (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest`, `npm --prefix frontend test -- --run`) and eliminate all shell constructs (`|`, `&&`, `||`, `;`, `<`, `>`).
- **Preservation of Existing Functionality & Regression Safety (AC-6)**: Preserved deterministic CLI generation, fail-closed overwrite protection requiring `--force`, backwards compatibility across existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost:idle-warehouse-waste`), with sibling project `dataForge` remaining untouched and read-only. All 229 full test suite tests pass cleanly.
- **Targeted Test Suite (`tests/test_rbac_audit.py`)**: 30 unit and integration tests validating AC-1 through AC-6.

### Why It Matters

In enterprise Snowflake environments, access control management frequently degrades into complex, unmanageable webs of circular role inheritance, dormant administrator accounts, and unmonitored privilege escalation. Security leaders (CISOs, Cloud Security Architects, Data Governance Directors) urgently need auditability and governance clarity, yet enterprise compliance policies (SOC 2, HIPAA, GDPR) strictly prevent them from furnishing live production cloud credentials to third-party consultants during pre-sales workshops. This slice breaks that consulting impasse by providing realistic, relational synthetic access control telemetry and an interactive dashboard specification that operates completely offline and client-side, enabling consulting teams to demonstrate authoritative governance insights without external dependencies, live credentials, or post-meeting friction.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json` and `code-reviews/review-synthetic-rbac-audit-foundation.md`.
- **Review Lenses**:
  - *Correctness Lens*: The test suite passed completely, validating the schemas and application logic. (0 findings)
  - *Compliance Lens*: The user journey manifest perfectly complies with the workspace-root argv restrictions. (0 findings)
- **Review Checks Run** (from `code-reviews/review-synthetic-rbac-audit-foundation.verdict.json`):
  - `python3 -m pytest tests/ -q`: exit code 0 ("Executed the full Python test suite. All tests passed, confirming schema correctness and regression safety.")
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/ddf431dc0ed6/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_rbac_audit.py`, exit status 0, duration 0.157367s, passed: True. Evidence hash: `c31b0c967d8c6ad7fb3ced49e16c624a1ce0565db12bcb855e266f0580fac629`.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_rbac_audit.py`, exit status 0, duration 2.394492s, passed: True (30 passed in 1.72s; counts: passed 30, failed 0, skipped 0). Evidence hash: `15aab55f9f52fb204be8ce2f4c1e1004bf5242990b207b4fea82eb4ec5b08e47`.
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 20.496692s, passed: True (229 passed in 19.77s; counts: passed 229, failed 0, skipped 0). Evidence hash: `c239fd449339ed62deefde371410c660d08e8b7c2ec21b54bb2fc8bc128ab899`.
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.071066s, passed: True. Evidence hash: `3ad75cee7ce5a956f49e1c9e056cf67a282912364360ea437d8951afada5db35`.
  - Validator Result 5 (`step_07_repair_and_verify_slice` attempt 1): `npm --prefix frontend test -- --run`, exit status 0, duration 5.351294s, passed: True (35 test files passed, 108 passed in 4.68s). Evidence hash: `0ee2a4f81bca9814304f837e3f7e2e706dcc0be8a0e3a72ca1807d16fe42d1e8`.

---

## 2026-09-06 — Idle Warehouse Remediation Artifacts Slice Passed Governed Review

### What Was Built

Implemented and verified the `idle-warehouse-remediation-artifacts` vertical slice, advancing DashForge's Snowflake Cost Management solution (`snowflakeCost:idle-warehouse-waste`) by bridging analytical discovery and concrete operational action with prioritized low-risk recommendations and same-day executive deliverables:

- **Prioritized Low-Risk Recommendations & Directional Governance (AC-1)**: Generated `recommendation_queue` SQLite table and snapshot dataset with all six governance fields (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`), `performance_risk`, and `scope_name`. `FINANCE_REPORTING_WH` (`IWW-001`, `P0`, minimal risk) is ordered first. The presentation tier provides an accessible toggle (`data-action="open-recommendation-queue"`, `data-testid="open-recommendation-queue"`, `aria-controls="recommendation-queue"`, `aria-expanded`) expanding a container (`data-status="recommendation-queue"`, `id="recommendation-queue"`, `role="region"`) rendering all six governance fields per recommendation card. Directional validation guardrails explicitly frame all recommendations and savings as directional until validated by designated warehouse owners.
- **Interactive Same-Day Executive Follow-Up Artifact Generation (AC-2)**: Standalone presentation embeds an interactive same-day follow-up generator (`data-action="same-day-executive-follow-up"`, `data-testid="same-day-executive-follow-up"`) transitioning status to `data-status="executive-follow-up"` labeled "Follow-up artifact is ready". Generates a decision-ready HTML deliverable capturing headline metrics (726 compute credits/month opportunity, 2 unmonitored idle warehouses, FINANCE_REPORTING_WH dominant concentration >50%), upstream cryptographic work package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), dataset observation claim citations (`dataset observation recommendation_queue/IWW-001`), prioritized actions with suggested owners and protective guardrails, and an explicit guard stating real/client mode remains disabled until approved metadata or exports exist.
- **Persistent & Unsuppressed Synthetic Demo Data Disclosures (AC-3)**: Persistent `data-disclosure="synthetic-demo-data"` and `data-provenance="synthetic-demo-data"` badges prominently display "Synthetic demo data" across presentation header, synthetic quality disclosure card (`data-testid="synthetic-quality-disclosure"`), generated follow-up HTML deliverable, and landscape print-to-PDF export (`data-testid="dashboard-save-pdf"` via `exportDashboardArtifact`).
- **Frontend Production Build Conformance & Browser Smoke Gate Markers (AC-4)**: Adheres to `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`. Preserves all four contract markers (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, `"recommendation-queue"`) in compiled production JavaScript bundles under `frontend/dist/assets/*.js`. Avoids live credential prompts (`password`, `account_identifier`, `private_key`) and enforces `data-mode="real-client-disabled"`.
- **Verbatim Workspace-Root Command Execution & User Journey Traceability (AC-5)**: Synchronized `journeys/user_journeys_manifest.json` under schema version 1 with valid authorities (`human`, `mission`, `author`), `status: "passed"`, sequential steps, and complete `traces_to` covering `AC-1` through `AC-6` without dangling IDs. Commands comply with allowlisted prefixes (`env PYTHONPATH=src python3 -m dashForge.main`, `python3 -m pytest`, `npm --prefix frontend test -- --run`) and eliminate all shell constructs (`|`, `&&`, `||`, `;`, `<`, `>`).
- **Preservation of Existing Dashboard Functionality & Regression Safety (AC-6)**: Deterministic CLI generation for `snowflakeCost:idle-warehouse-waste` producing all seven canonical datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) in SQLite and snapshot JSON with fail-closed overwrite protection requiring `--force`. Sibling project `dataForge` unmodified, backwards compatibility maintained across `healthcare`, `financial`, and `saas` packs, and full test suite passing with 199 tests.
- **Targeted Test Suite (`tests/test_remediation_artifacts.py`)**: 32 unit and integration tests validating AC-1 through AC-6.

### Why It Matters

Executive buyers (CFOs, CIOs, FinOps leaders) assessing cloud warehouse waste require immediate operational clarity and tangible takeaways from discovery workshops. Previously, consultants experienced significant friction and post-meeting delay compiling notes and follow-up artifacts manually outside presentation tooling. This slice bridges the gap between analytical discovery and concrete operational action, providing prioritized low-risk recommendations, owner-validation guardrails, and same-day executive deliverables directly within the application session—enabling immediate action while maintaining synthetic transparency and preventing ungrounded configuration changes.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json` and `code-reviews/review-idle-warehouse-remediation-artifacts.md`.
- **Review Lenses**:
  - *Implementation Lens*: The implementation correctly bridges analytical discovery and remediation action by building out the idle warehouse dashboard presentation tier. The StandaloneDashboardApp exposes the prioritized low-risk recommendations from the recommendation queue and offers same-day artifact generation without external dependencies. The TVIQ logic handles synthetic data disclosures properly, ensuring safety limits and unsuppressed disclosures are maintained. (0 findings)
  - *Contract Lens*: The slice comprehensively fulfills the contract requirements (AC-1 through AC-6). Directional validation guardrails are effectively added and verified, and tests confirm correct ordering of FINANCE_REPORTING_WH (P0). Artifact generation explicitly preserves metrics like the 726 compute credits monthly opportunity. (0 findings)
  - *User Simulation Lens*: All automated user journeys executed cleanly and successfully out of the verified slice's evaluation boundary. Simulated users successfully toggled the recommendation queue, triggered follow-ups, and validated the presence of the dashboard contract markers. (0 findings)
- **Review Checks Run** (from `code-reviews/review-idle-warehouse-remediation-artifacts.verdict.json`):
  - `python3 -m pytest tests/ -q`: exit code 0 ("Passed all python tests without regressions.")
  - `python3 -m compileall tests/test_remediation_artifacts.py`: exit code 0 ("Preserved validator evidence passed.")
  - `python3 -m pytest tests/test_remediation_artifacts.py`: exit code 0 ("Preserved validator evidence passed (32 tests passed).")
  - `python3 -m pytest`: exit code 0 ("Preserved validator evidence passed (199 tests passed).")
  - `python3 -m compileall src tests`: exit code 0 ("Preserved validator evidence passed.")
  - `npm --prefix frontend test -- --run`: exit code 0 ("Preserved validator evidence passed.")
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/0dca21f8da36/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_remediation_artifacts.py`, exit status 0, duration 0.183588s, passed: True. Evidence hash: `72eea36ce4a9616813c3e011ecafc154f0e7957a523b3de1a05657c55640e058`.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_remediation_artifacts.py`, exit status 0, duration 1.536486s, passed: True (32 passed in 0.85s; counts: passed 32, failed 0, skipped 0). Evidence hash: `e133a8a158ef7cb3b84ad1ac38c8cb82c7729f14beb1c083c9c2861e83152e09`.
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 19.169097s, passed: True (199 passed in 18.44s; counts: passed 199, failed 0, skipped 0). Evidence hash: `60039b37d7edbc1c3329a65ccf6d2545ba18f8795caa3a0e3456c18636be6722`.
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.059179s, passed: True. Evidence hash: `9647e5c810a0f4c072871abe99094c9fa497f7191e38e5cfeaddb6a838790e00`.
  - Validator Result 5 (`step_07_repair_and_verify_slice` attempt 1): `npm --prefix frontend test -- --run`, exit status 0, duration 6.378009s, passed: True (35 test files passed, 108 passed in 5.73s). Evidence hash: `efa48a347de734e14b0514f327b814ab8c62eb283e3bd64a76833e5e0f3047a2`.

---

## 2026-09-06 — Fix User Simulation Schema Slice Passed Governed Review

### What Was Built

Implemented and verified the `fix-user-simulation-schema` vertical slice, formalizing the JSON schema contracts, omission protocols, and verbatim execution standards governing Agent-Orch playbook quality gates and user journey simulation verification:

- **Playbook Schema Definitions & Simulation Helpers (`src/dashForge/playbook_schema.py`)**: Defined canonical Draft 2020-12 JSON schemas `USER_JOURNEYS_MANIFEST_SCHEMA` and `USER_JOURNEYS_RESULT_SCHEMA`. Provided helper functions `build_command_claim`, `sanitize_command_claim`, `validate_command_claim`, `build_journey_entry`, `build_user_journeys_result`, `validate_manifest`, and `validate_result` to assemble and validate simulation artifacts programmatically.
- **Enforcement of Non-Empty `stdout_contains` and Key Omission Protocol (AC-1)**: Enforced `minLength: 1` on `stdout_contains` in `USER_JOURNEYS_RESULT_SCHEMA`. Formalized the omission protocol: command claims that do not assert standard output substring verification omit the `stdout_contains` key entirely. `build_command_claim` and `sanitize_command_claim` strip `None`, empty string (`""`), and whitespace-only values so invalid claims are never serialized to `artifacts/user-test/result.json`.
- **User Journeys Manifest Conformance & Acceptance Check Traceability (AC-2)**: Governed `journeys/user_journeys_manifest.json` against `USER_JOURNEYS_MANIFEST_SCHEMA`. Enforced valid journey authorities (`human`, `mission`, `author`, `exploratory`), status (`passed`), sequential natural-language steps, executable commands, and complete `traces_to` coverage mapping non-exploratory journeys to contract acceptance checks `AC-1` through `AC-5` with zero unreferenced or dangling IDs.
- **Verbatim Workspace-Root Command Execution & Direct Argv Standards (AC-3)**: Standardized application CLI invocations to `env PYTHONPATH=src python3 -m dashForge.main` to pass environment variables directly without shell variable expansion, and standardized pytest invocations to `python3 -m pytest tests/ -q` or targeted checks without `PYTHONPATH` overrides to avoid masking virtual environment packages.
- **Elimination of Shell Syntax & Verifiable Argv Invocations (AC-4)**: Eliminated shell pipelines (`|`), boolean chaining (`&&`, `||`, `;`), file redirection (`<`, `>`), and standalone shell utilities (`jq`, `grep`, `cat`) from journey commands, ensuring all command claims are directly executable verbatim from workspace root via direct subprocess invocation (`shell=False`).
- **Pipeline Preservation & Regression Suite Integrity (AC-5)**: Maintained full backward compatibility with zero regressions across `snowflakeCost`, `healthcare`, `financial`, and `saas` packs; preserved sibling project `dataForge` without modifications; and verified full test suite with 167 tests passing.
- **Targeted Test Suite (`tests/test_playbook_schema.py`)**: 24 unit and integration tests validating AC-1 through AC-5.

### Why It Matters

Agent-Orch playbook quality gates at `step_08b_user_simulation_gate` previously failed due to structural JSON schema validation issues when simulated user journeys emitted empty string `stdout_contains` fields for commands where standard output verification was not asserted. By establishing canonical schema definitions and programmatic omission protocols in `src/dashForge/playbook_schema.py`, synchronizing `journeys/user_journeys_manifest.json`, and standardizing verbatim root execution, DashForge guarantees that automated user simulation gates validate cleanly without false negatives, ensuring uninterrupted governed delivery.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-fix-user-simulation-schema.verdict.json` and `code-reviews/review-fix-user-simulation-schema.md`.
- **Review Lenses**:
  - *Contract Conformance Lens*: The implementation correctly enforces the omission protocol for `stdout_contains`, ensuring it is never empty. All acceptance checks (`AC-1` to `AC-5`) are satisfied, and all tests pass cleanly.
  - *Traceability*: `user_journeys_manifest.json` perfectly traces all journeys to `AC-1`, `AC-2`, `AC-3`, `AC-4`, and `AC-5`.
  - *System Integrity*: The provided user test result artifacts confirm that the journeys executed without schema validation failures. The test suite execution demonstrates that the changes are safely isolated and do not compromise existing functionality.
- **Review Checks Run** (from `code-reviews/review-fix-user-simulation-schema.verdict.json`):
  - `python3 -m pytest tests/ -q`: exit code 0 ("167 passed in 16.74s")
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/ff63cdb2a682/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_playbook_schema.py`, exit status 0, duration 0.168819s, passed: True. Evidence hash: `5b776f846434a905ec3352c0794bb76ec019acc44f1f6944dfa93b18936aca9d`.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_playbook_schema.py`, exit status 0, duration 1.339025s, passed: True (24 passed in 0.63s; counts: passed 24, failed 0, skipped 0). Evidence hash: `c07d58efb242f47e6d49424dc55f2e7b18435f24c6f4186189ade98d987b17a2`.
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 17.712756s, passed: True (167 passed in 16.98s; counts: passed 167, failed 0, skipped 0). Evidence hash: `88e05e1757c54280e2033717bc79a9f4d42a18126826df1d8c53d40d776fd358`.
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.06114s, passed: True. Evidence hash: `5a31188bfac4b7c04f46cbbc62c07d20ef81ac2249a3a0eb1e701aa021a35166`.

---

## 2026-09-06 — Idle Warehouse Dashboard Slice Passed Governed Review

### What Was Built

Implemented and verified the buyer-visible presentation layer for the `idle-warehouse-dashboard` vertical slice under the `snowflakeCost` pack:

- **Standalone Frontend Scenario Mounting & Runtime Seam Resolution (`StandaloneDashboardApp.tsx`, `standaloneDashboard.ts`)**: Mounted standalone presentation at `/?scenario=idle-warehouse-waste` through `StandaloneDashboardApp.tsx` and resolved verified scenario assets locally via `StaticDataAdapter` and `SyntheticDataArtifactAdapter`, maintaining zero live Snowflake credentials, zero backend servers, and zero cloud network dependencies. Data consumption routes exclusively through the canonical `DashboardSpec` and `DataAdapter` seams without secondary renderers (AC-1).
- **Scenario Container Attributes & Controlled Readiness State Signaling**: Configured container DOM attributes (`data-scenario="idle-warehouse-waste"`, `data-demo="idle-warehouse-waste"`, `data-testid="idle-warehouse-waste-demo"`). Anchored material metric and recommendation claims to the verified work package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), transitioning `data-readiness` to `"controlled"` on verified digest match and failing closed to `"blocking"` if unverified (AC-2).
- **Persistent & Unsuppressed Synthetic Demo Data Disclosure Rendering**: Rendered persistent, unsuppressed disclosure elements (`data-disclosure="synthetic-demo-data"`, `data-provenance="synthetic-demo-data"`) displaying `"Synthetic demo data"` prominently across the presentation header, quality disclosure card (`data-testid="synthetic-quality-disclosure"`), print-to-PDF views, and executive follow-up exports (AC-3).
- **Interactive Prioritized Recommendation Queue with Governance Guardrails**: Implemented an accessible interactive toggle (`data-action="open-recommendation-queue"`, `data-testid="open-recommendation-queue"`, `aria-controls="recommendation-queue"`, `aria-expanded`) expanding a container (`data-status="recommendation-queue"`, `role="region"`) displaying prioritized actions. `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) is ordered first, presenting all six governance attributes (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`), explicitly framing recommendations as directional until validated by designated warehouse owners (AC-4).
- **Same-Day Executive Follow-Up & Landscape PDF Export Integration**: Provided same-day executive follow-up export (`data-action="same-day-executive-follow-up"`, `data-status="executive-follow-up"`) embedding headline metrics, cost concentration, artifact digest, and directional recommendations. Integrated landscape PDF print export (`data-testid="dashboard-save-pdf"`) preserving dark styling and provenance metadata (AC-5).
- **Browser Smoke Gate Conformance & Production Bundle Verification**: Fully conformed to `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`. Preserved contract marker strings (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`) in compiled JavaScript bundles under `frontend/dist/assets/` (AC-6).
- **Production Build Integrity & Automated Frontend Test Suite Conformance**: Verified `npm --prefix frontend test -- --run` passed with 35 test files and 108 tests. Vitest tests cover URL scenario routing, controlled readiness, persistent disclosures, recommendation queue toggle and focus, executive follow-up export, landscape PDF export, and blocking quality behavior on digest mismatch (AC-7).
- **Backend Slice Preservation, Zero Regressions & Sibling Repository Isolation**: Verified zero external runtime dependencies across `src/dashForge`, no hardcoded snowflake scenarios, sibling repository `dataForge` unmodified, deterministic CLI generation for `idle-warehouse-waste` with all seven datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`), and backwards compatibility maintained across existing packs (`healthcare`, `financial`, `saas`) (AC-8).
- **Targeted Test Suite (`tests/test_idle_warehouse_dashboard.py`)**: 31 unit and integration tests validating AC-1 through AC-8.

### Why It Matters

Executive buyers evaluating Snowflake cost optimization require immediate, credible proof of value during initial pre-sales discovery workshops. This slice delivers a polished, interactive presentation experience demonstrating realistic idle warehouse waste and governance-ready recommendations completely offline. It provides clear visibility into financial impact and directional savings without requiring live production Snowflake credentials, avoiding security roadblocks while maintaining strict synthetic data transparency.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-idle-warehouse-dashboard.verdict.json` and `code-reviews/review-idle-warehouse-dashboard.md`.
- **Review Lenses**:
  - *Correctness Lens*: All tests passed and no user findings were reported, indicating high correctness and conformance to the dashboard contract requirements.
  - *Requirements Lens*: The verified slice correctly implements all required outputs and functionality defined in the contract for the idle warehouse dashboard, including standalone UI constraints.
- **Review Checks Run** (from `code-reviews/review-idle-warehouse-dashboard.verdict.json`):
  - `python3 -m pytest tests/ -q`: exit code 0 ("143 passed in 16.94s")
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/d1bf6108e371/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_idle_warehouse_dashboard.py`, exit status 0, duration 0.147926s, passed: True. Evidence hash: `d5849dab286202ecd5b9058e68ba3a143f3dfcf7c1d8c49cd3bcdad5baab60ea`.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_idle_warehouse_dashboard.py`, exit status 0, duration 1.596402s, passed: True (31 passed in 0.86s; counts: passed 31, failed 0, skipped 0). Evidence hash: `a696024237c42d1e88788dff7970b0dad0574259920a2b95e950691fc9656749`.
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 18.027283s, passed: True (143 passed in 17.19s; counts: passed 143, failed 0, skipped 0). Evidence hash: `8011c30909ca5c8af94f89f38214a9b8a86d5880c968fae066ccb7eba5f5550f`.
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.081984s, passed: True. Evidence hash: `b7a41ed27bf4383cd983f613bbd868476eafcb9264ca78f0e8a3e6566a558116`.
  - Validator Result 5 (`step_07_repair_and_verify_slice` attempt 1): `npm --prefix frontend test -- --run`, exit status 0, duration 8.017327s, passed: True (35 test files passed, 108 passed). Evidence hash: `8583a2a0e7c78b55c3c1ac2342365d9656489b4e462724a96e677f2ca66ef2b4`.

---

## 2026-09-04 — Snowflake Accelerator Revival Supervised Acceptance

### What Changed

- Replaced the failed monolithic delivery shape with `playbooks/snowflake-accelerator-revival.golden.yaml`: separate backend-test, frontend-test, dependency/audit, backend, frontend, build/integration, browser, user-validation, and independent-review checkpoints; strict lint and preflight pass with no timeout above 180 seconds.
- Added fail-closed output validation so aliased SQLite/snapshot targets, directories, invalid parents, existing targets, and invalid scenarios exit 2 without traceback or unintended writes.
- Added source-backed idle-scenario routing, synthetic disclosure marker, and an accessible recommendation-queue action that reveals governed `FINANCE_REPORTING_WH` evidence while preserving same-day follow-up.
- Updated existing dependencies within their current major versions. Full audit now reports zero Critical, High, or Moderate findings; two Low development-tool advisories remain.

### Acceptance Evidence

Independent Luna Max validation passed: 112 Python tests, 68 smoke checks, 108 frontend tests across 35 files, production build (868 modules), strict playbook validation/preflight, deterministic seed-9101 SQLite (`4441c33…beeb1ed`) and snapshot (`048f8d23…98f47fb`) hashes, and a real Playwright Chromium click through controlled readiness, disclosure, recommendation queue, directional guardrail, and same-day follow-up. No High or Medium findings remain. Preservation commits `105aba4` and `1dec421` were reviewed but not merged because they contain brittle or unrelated candidate work.

## 2026-09-02 — Idle Warehouse Waste Slice Passed Governed Review

### What Was Built

Implemented and verified the `idle-warehouse-waste` vertical slice for Snowflake Cost optimization under pack `snowflakeCost`:

- **Canonical Snapshot Ingestion & Schema Conformance (`src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py`)**: Generated deterministic SQLite database and canonical `SQLiteSnapshot` JSON adhering strictly to `frontend/src/core/data/sqliteSnapshot.ts`. Produces all seven canonical datasets (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) with validated types (`string`, `number`, `date`, `boolean`) and roles (`dimension`, `measure`, `date`, `id`) (AC-1).
- **Provenance Metadata & Synthetic Disclosure (`src/dashForge/snowflake_cost.py`, `src/dashForge/package_snapshot.py`)**: Enriched snapshot metadata includes complete provenance tracing: `packId` (`snowflakeCost`), `scenarioId` (`idle-warehouse-waste`), `seed`, `dataForgeStoryContractPath` (`stories/snowflake/idle-warehouse-waste.md`), generator version, ISO-8601 generation timestamp, `synthetic: true`, and disclosure text `"Synthetic demo data"` (AC-1).
- **Deterministic CLI Generation Pipeline & Fail-Closed Overwrite Protection (`src/dashForge/main.py`)**: Supported `python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste` emitting bit-for-bit reproducible assets given identical seeds. Enforced fail-closed target protection aborting with exit status 2 and diagnostic messaging when destination paths exist without `--force` or on invalid/missing CLI arguments (AC-2).
- **DashboardSpec Contract Formalization & Claim Ledger Verification**: Formalized `DashboardSpec` contracts and claim ledger bindings for `idle-warehouse-waste`, connecting executive narrative and KPI metrics directly to verified dataset evidence (AC-3).
- **DataAdapter Runtime Seam & Seven-Dataset Query Routing (`frontend/src/core/data/`)**: Verified that query, aggregate, and schema inspection functions route cleanly across all seven datasets via `DataAdapter` (AC-4).
- **Scenario & Template Catalog Registrations (`frontend/src/mock-data/`)**: Registered scenario `snowflakeCost:idle-warehouse-waste` and starter template `tpl.snowflakeCost.idle-warehouse-waste` in runtime catalogs (AC-5).
- **Prioritized Recommendation Queue Governance & Safety Guardrails (`src/dashForge/snowflake_cost.py`)**: Retained `recommendation_queue` table with all governance and severity columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) and safety guardrails intact (AC-6).
- **Standalone Executive Presentation, Follow-Up Export & Synthetic Disclosures**: Validated standalone presentation flow and follow-up export capability with prominent synthetic disclosures (AC-7).
- **Backwards Compatibility & Sibling Project Isolation (AC-8)**: All existing packs (`healthcare`, `financial`, `saas`) remain fully operational with reproducible generation. No changes were made to sibling project `dataForge`, and no external runtime dependencies were introduced.
- **Targeted Test Suite (`tests/test_idle_warehouse_waste.py`)**: 35 unit and integration tests validating snapshot schema, provenance metadata, CLI generation, fail-closed overwrite protection, DashboardSpec contracts, DataAdapter routing, catalog registration, recommendation queue governance, and backwards compatibility.

### Why It Matters

Idle warehouse waste is one of the largest and most frequent sources of cloud overspending in enterprise Snowflake deployments (often accounting for 20-30% of compute credits). Anblicks consultants can now demonstrate realistic, reproducible waste patterns and governance-ready recommendation actions in executive discovery workshops completely offline, with zero live Snowflake credentials, zero cloud costs, and zero network dependencies, backed by verifiable claim ledgers and synthetic data transparency.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-idle-warehouse-waste.verdict.json` and `code-reviews/review-idle-warehouse-waste.md`.
- **Recommendation**: `ready`
- **Readiness Criteria**: All verified true (`producer_route_executed`, `repository_identity_verified`, `validator_authority_verified`, `semantic_judge_route_executed`, `evaluator_route_executed`).
- **Review Lenses**:
  - *Implementation Lens*: The implementation correctly produces deterministic SQLite databases and canonical JSON snapshots. It strictly adheres to the required schema, integrates provenance metadata, implements the necessary DataAdapter queries, and correctly handles recommendation queue governance columns as expected.
  - *User-Facing Defects Lens*: No user-facing defects were found in the findings log. The simulated user tests passed successfully, confirming the standalone presentation flow and CLI commands work flawlessly as specified in the user journeys.
- **Review Checks Run** (from `code-reviews/review-idle-warehouse-waste.verdict.json`):
  - `python3 -m compileall tests/test_idle_warehouse_waste.py`: exit code 0
  - `python3 -m pytest tests/test_idle_warehouse_waste.py`: exit code 0
  - `python3 -m pytest`: exit code 0
  - `python3 -m compileall src tests`: exit code 0
  - `python3 -m pytest tests/ -q`: exit code 0 ("Ran full test suite in quiet mode. 109 tests passed in 15.50s.")
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/4eac224f1b93/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_idle_warehouse_waste.py`, exit status 0, duration 0.160322s, passed: True.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_idle_warehouse_waste.py`, exit status 0, duration 1.668309s, passed: True (35 passed in 0.93s; counts: passed 35, failed 0, skipped 0).
  - Validator Result 3 (`step_05_implement_slice` attempt 2): `python3 -m pytest tests/test_idle_warehouse_waste.py`, exit status 0, duration 1.658117s, passed: True (35 passed in 0.93s; counts: passed 35, failed 0, skipped 0).
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 16.329853s, passed: True (109 passed in 15.60s; counts: passed 109, failed 0, skipped 0).
  - Validator Result 5 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.05708s, passed: True.

---

## 2026-09-02 — Snowflake Cost Pack Slice Passed Governed Review

### What Was Built

Implemented and verified the `snowflake-cost-pack` slice, integrating the `snowflakeCost` optimization pack from sibling project `dataForge` into DashForge's canonical CLI entrypoint, generation dispatch, and snapshot packaging pipeline:

- **CLI Entrypoint & Dynamic Scenario Discovery (`src/dashForge/main.py`, `src/dashForge/snowflake_cost.py`)**: Extended `python3 -m dashForge.main generate` to accept `--pack snowflakeCost` alongside existing packs (`healthcare`, `financial`, `saas`). Dynamic scenario discovery loads all scenarios directly from `dataForge` (`idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, `finops-maturity-assessment`) without hardcoding scenario lists in DashForge (AC-1, AC-2).
- **Fail-Closed Error Handling & Input Validation (`src/dashForge/main.py`)**: Unknown scenario identifiers, invalid packs, or missing required parameters fail closed with exit status 2 and clear diagnostic messages routed via `parser.error()`, preventing unhandled Python tracebacks (AC-2, AC-3).
- **Fail-Closed Overwrite Guard (`src/dashForge/main.py`)**: Enforces target file protection; if `--output` or `--snapshot-output` exists on disk and `--force` is omitted, the CLI aborts with exit status 2 and diagnostic message `Output path already exists. Pass --force to overwrite` (AC-4).
- **Deterministic Generation & Schema Conformance (`src/dashForge/package_snapshot.py`, `src/dashForge/generate.py`)**: Bit-for-bit reproducible SQLite generation and snapshot extraction given identical seeds. Emits JSON snapshots adhering strictly to the canonical `SQLiteSnapshot` contract in `frontend/src/core/data/sqliteSnapshot.ts` (AC-5).
- **Provenance Metadata & Synthetic Disclosure (`src/dashForge/package_snapshot.py`, `src/dashForge/snowflake_cost.py`)**: Enriched snapshot metadata includes complete provenance tracing back to dataForge: `packId` (`snowflakeCost`), `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 generation timestamp, `synthetic: true`, and disclosure text `"Synthetic demo data"` (AC-6).
- **Recommendation Queue Preservation (`src/dashForge/snowflake_cost.py`)**: Preserves the `recommendation_queue` dataset across generation and packaging, retaining `recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail` columns intact (AC-7).
- **Backwards Compatibility & Zero External Dependencies (AC-8)**: All existing packs (`healthcare`, `financial`, `saas`) remain fully operational with reproducible generation. No changes were made to sibling project `dataForge`, and no external runtime dependencies were introduced.
- **Targeted Test Suite (`tests/test_snowflake_cost_pack.py`)**: 34 unit and CLI regression tests validating CLI options, dynamic discovery, determinism, overwrite protection, metadata enrichment, and recommendation queue preservation.

### Why It Matters

Enterprise data leaders (CFOs, CIOs, FinOps heads) demand realistic, credible operational evidence when discussing cloud warehouse waste. Because enterprise security policies frequently restrict live Snowflake production access during initial pre-sales discovery workshops, consultants need realistic, relational data demonstrating common waste patterns (idle warehouses, runaway queries, unassigned compute) that run entirely offline. This slice enables Anblicks consultants to generate complete, reproducible Snowflake cost optimization packages and JSON snapshots with a single command, ready for downstream executive dashboard presentation without cloud credentials, external dependencies, or unhandled tracebacks.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-snowflake-cost-pack.verdict.json` and `code-reviews/review-snowflake-cost-pack.md`.
- **Recommendation**: "Ready for autonomous re-arm"
- **Review Lenses**:
  - *Implementation Lens*: The implementation in `src/dashForge/snowflake_cost.py` properly queries and exports the required scenario metadata from the `dataForge` module without hardcoding any values. Correctly satisfies the contract, dynamically discovering scenarios and accurately populating metadata.
  - *Testing Lens*: The test suite covers the necessary paths including scenario discovery, missing argument handling, and backwards compatibility. All tests passed.
- **Review Checks Run**:
  - `python3 -m pytest tests/ -q`: exit code 0 ("74 passed in 14.82s")
  - `python3 -m compileall tests/test_snowflake_cost_pack.py`: exit code 0 (Validator result 1)
  - `python3 -m pytest tests/test_snowflake_cost_pack.py`: exit code 0 (Validator result 2)
  - `python3 -m pytest`: exit code 0 (Validator result 3)
  - `python3 -m compileall src tests`: exit code 0 (Validator result 4)
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/128115135b9a/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_snowflake_cost_pack.py`, exit status 0, duration 0.171223s, passed: True.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_snowflake_cost_pack.py`, exit status 0, duration 1.734029s, passed: True (34 passed in 0.99s; counts: passed 34, failed 0, skipped 0).
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 15.886203s, passed: True (74 passed in 15.14s; counts: passed 74, failed 0, skipped 0).
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.051591s, passed: True.

---

## 2026-09-02 — Package DataForge Snapshot Slice Passed Governed Review

### What Was Built

Implemented and verified the `package-dataforge-snapshot` slice, providing the CLI entrypoint, snapshot extraction pipeline, and compatibility dispatch layer for deterministic scenario packaging:

- **CLI Entrypoint (`src/dashForge/main.py`)**: Supports the `generate` subcommand with `--pack` (`healthcare`, `financial`, `saas`), `--scenario` (required), `--seed` (optional deterministic integer), `--output` (required SQLite path), `--snapshot-output` (optional JSON snapshot export path), and `--force` (AC-1).
- **Fail-Closed Overwrite Guard (`src/dashForge/main.py`)**: Verifies target file existence before executing generation or writing output. If `--output` or `--snapshot-output` exists and `--force` is omitted, the command fails closed with exit status 2 and diagnostic error `Output path already exists. Pass --force to overwrite` (AC-2).
- **Snapshot Extraction Pipeline (`src/dashForge/package_snapshot.py`)**: Uses Python standard library `sqlite3` to inspect table schemas via `PRAGMA table_info`, infer column data types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`), and serialize all table rows into formatted JSON matching the `SQLiteSnapshot` contract in `frontend/src/core/data/sqliteSnapshot.ts` (AC-3, AC-6).
- **Multi-Pack Determinism (`src/dashForge/generate.py`)**: Supports all canonical industry packs (`healthcare`, `financial`, `saas`) and scenarios with reproducible SQLite databases and JSON snapshots given identical seeds (AC-4).
- **Graceful Error Handling (`src/dashForge/main.py`)**: Intercepts argument and generation errors (`ValueError`, `KeyError`, `FileExistsError`) and routes them cleanly through `parser.error(...)` with exit status 2, eliminating unhandled Python tracebacks (AC-5).
- **Targeted Test Suite (`tests/test_package_snapshot.py`)**: 29 unit and CLI regression tests covering argument validation, overwrite protection, schema integrity, multi-pack dispatch, determinism, and graceful error handling.
- **User Journey Synchronization (`journeys/user_journeys_manifest.json`)**: Synchronized user journeys mapping natural-language goals to AC-1 through AC-8 with non-empty allowlists (AC-7).
- **Governed Scope Boundary**: Retained strict write confinement across slice execution (AC-8).

### Why It Matters

DashForge dashboards must run reliably during high-stakes client workshops on laptops with zero network connectivity. While sibling project `dataForge` owns mock-data generation, DashForge's client-side runtime (`DataAdapter`, `sqliteSnapshot.ts`) requires structured JSON snapshot artifacts with typed columns and semantic roles. This slice provides the deterministic bridge from generated SQLite databases to runtime-ready JSON snapshots while protecting operators from accidental file overwrites or embarrassing Python tracebacks during live demonstrations.

### Review Verdict & Independent Evidence

- **Review Verdict**: `pass` with 0 findings in `code-reviews/review-package-dataforge-snapshot.verdict.json` and `code-reviews/review-package-dataforge-snapshot.md`.
- **Review Lenses**:
  - *Architecture*: The CLI properly separates argument parsing from backend generation, intercepting errors gracefully and cleanly printing valid results.
  - *Requirements*: Meets AC-1 to AC-8, handling fail-closed execution without the `--force` flag properly and verifying compatibility with DataAdapter structure.
- **Review Checks**:
  - `python3 -m pytest tests/ -q`: exit code 0 ("All 54 tests passed successfully in 18.79s, verifying package snapshot behavior.")
  - Agent-Orch `user_tester` simulation: exit code 0.
- **Preserved System Validator Evidence** (from `/home/lee/projects/dashForge-agent-orch-runs/4d2628b340b6/steps/step_10_closeout_handoff_docs/attempt-1/preserved-validator-evidence.json`):
  - Validator Result 1 (`step_04_author_slice_tests` attempt 1): `python3 -m compileall tests/test_package_snapshot.py`, exit status 0, duration 0.168963s, passed: True.
  - Validator Result 2 (`step_05_implement_slice` attempt 1): `python3 -m pytest tests/test_package_snapshot.py`, exit status 0, duration 10.963935s, passed: True (29 passed in 10.23s; counts: passed 29, failed 0, skipped 0).
  - Validator Result 3 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m pytest`, exit status 0, duration 19.798888s, passed: True (53 passed in 19.05s; counts: passed 53, failed 0, skipped 0).
  - Validator Result 4 (`step_07_repair_and_verify_slice` attempt 1): `python3 -m compileall src tests`, exit status 0, duration 0.057053s, passed: True.
  - Validator Result 5 (`step_07_repair_and_verify_slice` attempt 2): `python3 -m pytest`, exit status 0, duration 19.335459s, passed: True (54 passed in 18.61s; counts: passed 54, failed 0, skipped 0).
  - Validator Result 6 (`step_07_repair_and_verify_slice` attempt 2): `python3 -m compileall src tests`, exit status 0, duration 0.050162s, passed: True.

---

## 2026-08-11 — Unified DashForge/DataForge operator guide

### What Was Built

Added `docs/user-guide.md` as the end-user guide for both sibling projects.
It covers local and LAN HTTPS browser use, Builder, print/PDF export, the
DataForge CLI and canonical employee package, the pinned-fixture boundary,
governed receipt handoff, and common troubleshooting.

The DashForge and DataForge READMEs now link to the guide. DataForge's
field-service `generate --pack` parser was also aligned with its existing
generator registry, with regression coverage.

### Evidence

- `curl -k -I https://127.0.0.1:5173`: HTTP/2 200 from the active LAN preview.
- DataForge field-service validate/generate/employee-run smoke passed.
- DataForge: 61 tests passed; changed-file Ruff and Black checks passed.
- DashForge: 35 frontend files/107 tests passed.
- DashForge: `npm run build` passed.

The guide preserves the existing boundary: synthetic data only, no live
Snowflake connector, no authenticated approval from direct CLI commands, and
no external client delivery.

---

## 2026-08-11 — LAN HTTPS preview and print-quality PDF

### What Was Built

The field-service standalone dashboard can now be opened from a Mac on the
trusted LAN with `npm run dev:lan`. Vite binds to `0.0.0.0`; the launcher
creates/reuses an IP-specific self-signed certificate and exposes
`https://192.168.8.10:5173` by default. The certificate is ignored by git and
the README documents browser trust and Keychain installation.

The standalone runtime now exposes **Print / Save PDF**. It uses the existing
browser export seam rather than a second renderer, adds evidence/provenance
metadata, preserves the dark chart treatment in print, uses landscape letter
geometry, avoids splitting dashboard cards, and hides interactive controls.

### Evidence

- `curl -k -I https://192.168.8.10:5173`: HTTP/2 200.
- `npm test`: 35 files, 107 tests passed.
- `npm run build`: TypeScript checks and Vite production build passed.
- Headless Chrome produced `/tmp/dashforge-field-service-final.pdf`: seven
  landscape-letter pages; the rendered first page contains the synthetic
  disclosure, scenario title, and upstream artifact digest.

---

## 2026-08-11 — Governed shakedown and receipt disposition

### Result

Run `d1ce08a229dd` completed from approval-bound run `6a579236e2f0` with a
verified `5`-entry, `12`-artifact evidence chain and authenticated principal
`lee`. It proves the bounded dashboard package path, but its DataForge input
was an operator-materialized copy from legacy run `31ad67eea2f1`, not a trusted
`artifact_inputs` receipt. The prior constructed receipt smoke proves the seam
in isolation; it does not convert the legacy source into commissioning
evidence.

Agent-Orch can now seal producer outputs in a fresh source run. DashForge's
next receipt identity/schema fields and run-specific destination are prepared,
but its exact `source_run_id` and digest do not exist yet and were not
fabricated. The mission remains unlaunched, unscheduled, non-hosted, and
non-delivering behind DataForge and Lee gates.

---

## 2026-08-10 — Field-service executive dashboard showcase

### What Was Built

DashForge now opens a meeting-ready field-service operating review for the
fictional Apex Climate Services scenario. The app validates a digest-pinned
DataForge work package and quality report, resolves five artifact-backed
datasets, and renders five KPI comparisons plus three graphs through the
existing `DashboardSpec`, `DataAdapter`, widget, and standalone-runtime paths.

The visible story is specific: first-time fix is 75.2% against an 84% target,
emergency SLA is 83.3% against 95%, repeat truck rolls are 18.2% against a
10.5% plan, overtime is 13.1 hours against an 8-hour budget, and contribution
margin is $177.30 against a $218 plan. Weekly demand rises 27.9% above plan in
the latest four weeks; Phoenix West and Las Vegas carry 65.2% of repeat work;
unavailable parts explain 54.5% of callbacks.

### Why It Matters

This is a coherent executive conversation, not a generic dashboard gallery.
The narrative moves from demand pressure to first-visit failure, branch
concentration, a documented parts constraint, and reversible operating action.
Every material surface remains claim-covered and the page visibly discloses
that the data is synthetic.

### Evidence

- `npm test`: 35 files and 107 tests passed.
- `npm run build`: TypeScript checks and Vite production build passed.
- Browser smoke at 1440x1000 confirmed the dark executive theme, synthetic
  disclosure, controlled-quality block, five unclipped KPI cards, three
  unclipped graph cards, compact source citations, and Builder handoff.
- Upstream fixture digest:
  `sha256:e886a65cea294553d38c0c42c7f2625e7f504b01fe5dd7bad809bb852fc727ab`.

---


## 2026-08-09 — Client Meeting Dashboard Builder Employee Slice

### What Was Built

DashForge now has a bounded `ClientMeetingDashboardBuilder` employee path.
It receives a trusted `synthetic-data-work-package/1.0`, validates the
scenario digest, quality state, reproduction manifest, dataset bindings, and
claim sources, then emits `meeting-dashboard-package/1.0`.

The package includes the digest-pinned dashboard specification, binding map,
claim ledger, rendered dashboard HTML, browser-smoke result, and meeting
narrative. Blocking upstream quality, missing audience/decision context,
unsupported bindings, and uncited material claims refuse the result. The
materializer writes all package files into a temporary sibling directory and
renames it into place only after every file succeeds; it rejects non-empty
output directories.

The implementation reuses `DashboardSpec`, `DataAdapter`, the existing runtime,
export path, and Agent-Orch receipt rather than adding another renderer or
coordinator.

### Why It Matters

DashForge is now a consumer employee rather than a fixture-copying dashboard
utility. The dashboard can identify exactly which DataForge package produced
each material claim while preserving the synthetic-data disclosure and the
human approval boundary.

### Evidence

- `npm --prefix frontend test`: 103 passed.
- `npm --prefix frontend run build`: succeeded, including the package-tool
  TypeScript scope.
- Python suite: 33 passed.
- Governed browser smoke observed the standalone page and follow-up action.
- Independent dashboard review: 10/10 checks passed.
- Fresh cross-run receipt smoke verified the exact upstream digest
  `sha256:31d8b97c4843d6d9e5fdd0bcff5009d5abbce6252d8ffe70cbf9b1fdf6b4ba4e`
  and read-only materialization. The checked-in browser/package fixture is
  separately pinned to
  `sha256:fd4373d38c9fd39e344332b4be74888ce859021aefdb9ffd63dc334c848c0f60`.

## 2026-07-16 — Snowflake Idle-Warehouse Buyer Demo Passed Governed Review

### What Was Built

The standalone runtime now carries the bounded Snowflake Cost Optimization
`idle-warehouse-waste` story from synthetic evidence through executive impact,
prioritized recommendations, and a same-day follow-up artifact. The work was
completed by Auto-Orch run `ee6fac7897f9`, with Grok 4.5 High as implementer
and Claude Code Opus 4.8 High as the canonical reviewer.

### Why It Matters

This is the first integrated proof path for turning a buyer's Snowflake pain
into a repeatable consulting demo without creating a second UI runtime or a
second recommendation engine. Further feature work is paused until a named
buyer signal clears the next conversion gate.

### How To Verify

```bash
cd /Volumes/NVME1/projects/dashForge
npm --prefix frontend test
npm --prefix frontend run build
```

Browser-smoke evidence is in `artifacts/user-smoke/result.json`; the canonical
review is `code-reviews/review-idle-warehouse-waste.md`. The review found three
Low issues—headline/recommendation reconciliation, two panels bypassing the
adapter seam, and controlled synthetic values not being HTML-escaped—and no
Medium-or-higher blocker.

## 2026-04-04 — Post-Review Regressions Were Closed For Builder Scenario Switching And dataForge Compatibility

### What Was Built

The first post-split review fixes are now in place.

`frontend/src/features/builder/BuilderShell.tsx` now regenerates a fresh draft
when the current template cannot legally serve the newly selected scenario,
which closes the ED-throughput-to-flu-season regression introduced by opening
Builder from the standalone MVP surface.

`src/dashForge/_dataforge_compat.py` now reports the real candidate paths it
checked and honors `DATAFORGE_SRC` as an override instead of hard-coding
Lee-specific workspace guidance. Focused regression coverage was added in
[BuilderShell.test.tsx](/Users/lee/projects/dashForge/frontend/src/features/builder/BuilderShell.test.tsx#L195)
and
[test_dataforge_compat.py](/Users/lee/projects/dashForge/tests/test_dataforge_compat.py#L1).

### Why It Matters

The builder fix keeps the standalone MVP path believable for operators: opening
Builder from the ED dashboard and switching scenarios no longer strands the
draft on invalid ED-only dataset bindings.

The Python bridge fix makes the post-split compatibility story clearer on
machines that do not match Lee's workspace layout, which reduces confusion for
future operators and CI environments.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
PYTHONPATH=src python3 -m dashForge.main generate --scenario flu-season --seed 3101 --output /tmp/dashforge-review-fix.sqlite --snapshot-output /tmp/dashforge-review-fix.snapshot.json --force
```

Expect the full Python and frontend suites to pass, the frontend builder
regression test to stay green inside the full run, and the compatibility CLI
command to emit generated SQLite plus snapshot paths through the post-split
bridge.

## 2026-04-03 — DashForge Canon Docs Were Realigned To The dataForge Split

### What Was Built

The living DashForge docs now consistently describe the post-split ownership
boundary: dashForge owns the dashboard runtime, scenario packaging, and
standalone MVP experience, while `dataForge` owns mock-data generation.

The canon sweep updated:

- [README.md](/Users/lee/projects/dashForge/README.md#L1)
- [architecture.md](/Users/lee/projects/dashForge/architecture.md#L1)
- [product-definition.md](/Users/lee/projects/dashForge/product-definition.md#L1)
- [project-plan.md](/Users/lee/projects/dashForge/project-plan.md#L1)
- [context.md](/Users/lee/projects/dashForge/context.md#L1)
- [WHERE_AM_I.md](/Users/lee/projects/dashForge/WHERE_AM_I.md#L1)
- [sprint-plan.md](/Users/lee/projects/dashForge/sprint-plan.md#L1)

### Why It Matters

The repo had already been split mechanically, but several durable docs still
described the generator as if it were an in-repo DashForge implementation
surface. This alignment makes the current ownership boundary explicit for the
next operator without rewriting the historical sprint artifacts.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,220p' README.md
sed -n '1,260p' architecture.md
sed -n '1,260p' product-definition.md
sed -n '1,260p' project-plan.md
sed -n '1,220p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,220p' sprint-plan.md
```

Expect those files to describe `dataForge` as the canonical generator home,
DashForge as the standalone-dashboard/runtime repo, and the Python surface here
as compatibility-only.

## 2026-04-03 — Mock-Data Creation Was Split Into dataForge

### What Was Built

The deterministic generator that previously lived inside dashForge now has a
real sibling home in `/Users/lee/projects/dataForge`.

`dataForge` now owns:

- `src/dataForge/generate.py`
- `src/dataForge/main.py`
- `src/dataForge/packs/*.json`
- `tests/test_generate.py`

dashForge now keeps only a compatibility layer at:

- [main.py](/Users/lee/projects/dashForge/src/dashForge/main.py#L1)
- [generate.py](/Users/lee/projects/dashForge/src/dashForge/generate.py#L1)
- [_dataforge_compat.py](/Users/lee/projects/dashForge/src/dashForge/_dataforge_compat.py#L1)

### Why It Matters

This separates data creation from the dashboard runtime repo without breaking
the existing dashForge CLI/test workflows. Future generator changes can land
in `dataForge`, while dashForge can focus on the standalone dashboard,
builder, presenter, and runtime surfaces.

### How To Verify

```bash
cd /Users/lee/projects/dataForge
python3 -m pytest -q
PYTHONPATH=src python3 -m dataForge.main generate --scenario flu-season --seed 3101 --output /tmp/dataforge-flu.sqlite --snapshot-output /tmp/dataforge-flu.snapshot.json --force

cd /Users/lee/projects/dashForge
python3 -m pytest tests/test_generate.py -q
python3 -m pytest -q
PYTHONPATH=src python3 -m dashForge.main generate --scenario flu-season --seed 3101 --output /tmp/dashforge-compat-flu.sqlite --snapshot-output /tmp/dashforge-compat-flu.snapshot.json --force
PYTHONPATH=src python3 -m dashForge.main generate --scenario not-a-real-scenario --output /tmp/dashforge-invalid.sqlite
```

Expect both pytest runs to pass, both happy-path CLI commands to emit generated
SQLite plus snapshot paths, and the unhappy-path dashForge command to fail with
code `2` and a clear `Unknown healthcare scenario` message.

## 2026-04-02 — Standalone MVP Review/Handoff Closed And Canon Was Realigned

### What Was Built

The formal standalone MVP closeout review now exists at:

- [review-mvp-standalone-dashboard.md](/Users/lee/projects/dashForge/code-reviews/review-mvp-standalone-dashboard.md#L1)

The durable docs were also refreshed so the repo now states one consistent MVP
definition: scenario definition, data generation, and a standalone dashboard
deliverable. `README.md`, `context.md`, `sprint-plan.md`, `WHERE_AM_I.md`,
`product-definition.md`, and `architecture.md` now all point to the same
canonical proof path:
`healthcare:ed-throughput-crunch` +
`tpl.healthcare.ed-throughput-command`.

### Why It Matters

The repo already had more capability than the first product proof needed.
Without this handoff, future operators could easily mistake builder,
presenter, AI authoring, or live binding breadth for the MVP itself. The canon
now makes the product bar explicit and keeps future roadmap work from
accidentally redefining the MVP in docs only.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,220p' code-reviews/review-mvp-standalone-dashboard.md
sed -n '1,220p' README.md
sed -n '1,260p' product-definition.md
sed -n '1,240p' architecture.md
sed -n '1,240p' sprint-plan.md
python3 -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
```

Expect the review file to exist, the canon docs to describe the MVP as
scenario definition plus data generation plus a standalone dashboard
deliverable, and the repo checks to pass. In this sandbox,
`npm --prefix frontend run dev -- --host 127.0.0.1` still fails with
`listen EPERM`, so the one real browser smoke remains a host-only follow-up.

## 2026-04-02 — Standalone MVP Repair Closed The Shared-Runtime Teardown Flake

### What Was Built

The standalone MVP repair now closes the actual shared-runtime teardown issue,
not just the earlier app-level watch item.

`frontend/src/features/runtime/StandaloneDashboardApp.test.tsx` now verifies
the standalone contract at the `DashboardRenderer` seam instead of mounting
the full async widget runtime, while
`frontend/src/components/WidgetRenderer.tsx` and
`frontend/src/dashboard/ResponsiveDashboardGrid.tsx` now commit initial
read-only runtime hydration synchronously instead of via deferred
`startTransition(...)` work.

The governed repair record now exists at:

- [repair-mvp-standalone-dashboard.md](/Users/lee/projects/dashForge/code-reviews/repair-mvp-standalone-dashboard.md#L1)

### Why It Matters

Repeated full-suite reruns proved the original `window is not defined`
teardown signal was broader than `App.test.tsx`; it could still surface from
the standalone and presenter runtime tests. This repair fixes the shared
runtime seam that those paths have in common while keeping the standalone MVP
surface and behavior unchanged.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
npm --prefix frontend test -- src/features/runtime/StandaloneDashboardApp.test.tsx src/features/presenter/PresenterMode.test.tsx
npm --prefix frontend test -- src/App.test.tsx src/features/runtime/StandaloneDashboardApp.test.tsx
npm --prefix frontend test
npm --prefix frontend run build
```

Expect the targeted presenter and standalone tests, the app-plus-standalone
tests, the repeated full frontend suite reruns, and the build to pass. The
formal repair file records the five consecutive green full-suite passes used
to close the teardown issue.

## 2026-04-02 — Standalone MVP Dashboard Became The Default App Surface

### What Was Built

`frontend/src/App.tsx` now boots into a dedicated standalone runtime instead of
opening the builder shell first. The new entry component,
`frontend/src/features/runtime/StandaloneDashboardApp.tsx`, instantiates the
registered `healthcare:ed-throughput-crunch` scenario through the existing
template/runtime path and renders `ED Throughput Command View` directly through
the shared `DashboardSpec` plus `DataAdapter` seams.

The builder remains available only as an explicit secondary mode. `BuilderShell`
now accepts an initial draft so the operator path can still open on the same ED
throughput starter instead of resetting to the old SaaS default when launched
from the standalone surface.

Focused automated coverage was added in:

- [App.test.tsx](/Users/lee/projects/dashForge/frontend/src/App.test.tsx#L1)
- [StandaloneDashboardApp.test.tsx](/Users/lee/projects/dashForge/frontend/src/features/runtime/StandaloneDashboardApp.test.tsx#L1)

### Why It Matters

This corrects the product surface to match the clarified MVP. A consultant or
client now lands directly on a believable scenario dashboard backed by the
existing generated ED throughput data package, while the builder remains
available as an explicit operator tool instead of the app's default wrapper.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run dev -- --host 127.0.0.1
```

Expect the full frontend suite and build to pass. In this sandbox, the dev
server still fails at startup with `listen EPERM: operation not permitted
127.0.0.1:5173`, which is the same existing host restriction noted elsewhere in
the repo rather than a standalone-runtime regression.

## 2026-04-02 — ED Throughput Demo Workflow Handoff Path Recorded

### What Was Built

The scenario automation handoff path for ED throughput demo replays is now discoverable in the running review log:

- [review_handoff_demo_artifacts/attempt-1](/Users/lee/projects/dashForge/.agent-orch-scratch/0700a8a5990b/review_handoff_demo_artifacts/attempt-1)

The formal review file was updated to include this path as part of the demo workflow closeout evidence:

- [review-ed-throughput-crunch-demo-workflow.md](/Users/lee/projects/dashForge/code-reviews/review-ed-throughput-crunch-demo-workflow.md#L1)

### Why It Matters

Future demo operators can start from the same governed review scratch location and avoid recreating the automation handoff path for each run.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
test -d .agent-orch-scratch/0700a8a5990b/review_handoff_demo_artifacts/attempt-1
ls -la .agent-orch-scratch/0700a8a5990b/review_handoff_demo_artifacts/attempt-1
sed -n '1,260p' code-reviews/review-ed-throughput-crunch-demo-workflow.md
```

Expect the path to exist and the review file to include this review-handoff path in its outcome section.

## 2026-04-02 — ED Throughput Scenario Wired Into Frontend Runtime

### What Was Built

The `healthcare:ed-throughput-crunch` scenario is now fully registered in the
runtime scenario and template catalogs and can be instantiated as an in-app starter
spec. `frontend/src/mock-data/scenarioCatalog.ts` now imports the scenario data
and `frontend/src/mock-data/scenarioCatalog.test.ts` covers its registration.
`frontend/src/mock-data/templateCatalog.ts` now exposes
`tpl.healthcare.ed-throughput-command`, `createFreshDraftForScenario` can instantiate
the ED command view starter, and the corresponding builder blueprint defines the
ED-specific widget set and dataset contract.

### Why It Matters

This closes the final gap between offline package artifacts and app-visible
demo assembly. Operators can now run the ED throughput scenario through the same
builder workflow used by other scenarios, with consistent starter behavior and
contract checks before moving into presenter/rehearsal mode.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
npm --prefix frontend test -- src/mock-data/scenarioCatalog.test.ts src/mock-data/templateCatalog.test.ts src/features/builder/templateInstantiation.test.ts
python3 -m pytest -q
npm --prefix frontend run build
```

Expect the new scenario/template tests to pass, and the build to remain green.

## 2026-04-02 — Canon and Planning Documents Realigned Around ED Scenario Runtime Feature

### What Was Built

The project documentation set was synchronized so that planning, architecture,
product definition, and sprint planning all reflect the newly in-app ED
throughput feature path.

Updated docs now state that `healthcare:ed-throughput-crunch` is registered in the
front-end runtime via `tpl.healthcare.ed-throughput-command`, that materialized
scenario package artifacts are discoverable from README and roadmap docs, and that
the next slice now tracks reusable scenario-building docs and workflow patterns.

### Why It Matters

This removes operational ambiguity for future operators who start from docs first:
the same source of truth now contains the feature state, the in-app registration
decision, and the scenario-building follow-on work backlog.

### How To Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,140p' README.md
sed -n '130,230p' project-plan.md
sed -n '1,130p' architecture.md
sed -n '1,120p' product-definition.md
sed -n '1,170p' sprint-plan.md
sed -n '1,140p' code-reviews/review-ed-throughput-crunch-materialization.md
sed -n '1,260p' code-reviews/review-ed-throughput-crunch-demo-workflow.md
```

Expect those files to reference `healthcare:ed-throughput-crunch`, `tpl.healthcare.ed-throughput-command`,
the scenario-package workflow set, and the remaining follow-on scenario-building
tasks.

## 2026-04-01 — ED Throughput Materialization Review And Workflow Handoff Closed

### What Was Built

The ED throughput materialization slice now has its formal closeout artifact in
`code-reviews/review-ed-throughput-crunch-materialization.md`, completing the
governed contract/plan, verify, repair, and review trail for the materialized
scenario package.

This handoff also makes the durable asset locations and automation entrypoint
explicit for future operators. The materialized scenario artifacts live at:

- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`

The governed workflow that produced and closed them lives at:

- `playbooks/ed_throughput_crunch_materialization_workflow.yaml`

### Why It Matters

Future operators no longer need to reconstruct where the ED throughput
materialized demo assets came from or which governed path generated them. The
review trail now points directly to both the packaged scenario outputs and the
workflow that can be rerun or resumed for the same bounded slice.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,240p' code-reviews/review-ed-throughput-crunch-materialization.md
sed -n '1,260p' playbooks/ed_throughput_crunch_materialization_workflow.yaml
sed -n '1,220p' code-reviews/verify-ed-throughput-crunch-materialization.md
sed -n '1,220p' code-reviews/repair-ed-throughput-crunch-materialization.md
python3 -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
```

Expect the review to state that the only verification finding was repaired,
the workflow to show the full governed materialization path, and the standard
repo checks to stay green.

## 2026-04-01 — ED Throughput Materialized Data And Spec Artifacts Added

### What Was Built

The ED throughput healthcare scenario now has concrete materialized demo
artifacts under `scenarios/healthcare/` that match the current DashForge
mock-data and `DashboardSpec` seams instead of staying only as design docs.

`scenarios/healthcare/ed-throughput-crunch-preview.sqlite` now exists as the
canonical mock-data artifact for this package. The dataset package is also
retained in JSON because the current frontend/demo preview seam still consumes
the nested `previewDatasets` shape.

`scenarios/healthcare/ed-throughput-crunch-preview-data.json` now contains the
full concrete mock payload for the scenario: all six documented datasets,
expanded to the package's planned row floor with six-week history for the
weekly datasets and a current-day staffing snapshot.

`scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json` contains the
first serialized `DashboardSpec` for `ED Throughput Command View`. It stays
fully `mock`-backed, uses only the supported current widget types, and maps
the five-step presenter arc onto the existing `narrative.storyArc` and
`presenterNotes` shape.

`scenarios/healthcare/ed-throughput-crunch-binding-map.md` documents the
widget-to-dataset mapping, the presenter-step ownership of each widget, the
materialized row counts for each dataset, and the deliberate decision to keep
`ed_flow` in the preview payload while leaving it out of the first
command-view page until a later builder swap is wanted.

### Why It Matters

This closes the gap between the ED throughput package's planning documents and
runtime-shaped deliverables more completely than the earlier first-pass stub.
The repo now has concrete scenario data at the intended package scale and a
command-view dashboard document that future frontend registration work can
lift into the active mock catalog and starter flow without having to
reconstruct weekly history, drilldown rows, or the first spec shape from
prose.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 - <<'PY'
import json
from pathlib import Path

preview = json.loads(Path("scenarios/healthcare/ed-throughput-crunch-preview-data.json").read_text())
spec = json.loads(Path("scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json").read_text())

print(sorted(preview["previewDatasets"].keys()))
print(sorted({widget["data"]["datasetId"] for widget in spec["widgets"] if widget["data"]["source"] == "dataset"}))
print(spec["meta"]["title"])
print(spec["intent"]["scenario"])
PY

python3 - <<'PY'
import sqlite3
from pathlib import Path

conn = sqlite3.connect(Path("scenarios/healthcare/ed-throughput-crunch-preview.sqlite"))
tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
print(tables)
for name in tables:
    count = conn.execute(f'SELECT COUNT(*) FROM \"{name}\"').fetchone()[0]
    print(name, count)
conn.close()
PY

ls -l scenarios/healthcare/ed-throughput-crunch-preview.sqlite
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-preview-data.json
sed -n '1,320p' scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-binding-map.md
```

Expect the preview artifact to expose all six canonical datasets, the spec to
reference only datasets present in that preview payload, and the binding map
to show the same widget IDs and presenter sequence used in the serialized
dashboard document.

## 2026-04-01 — ED Throughput Demo Workflow Review And Automation Handoff Closed

### What Was Built

The ED throughput demo-package workflow now has its formal review artifact in
`code-reviews/review-ed-throughput-crunch-demo-workflow.md`, closing the
governed verify-repair-review trail for this scenario package. The review
confirms that the repaired `priority_status` contract is consistently defined
across the canonical data design, dashboard blueprint, and operator checklist,
and it records that no further blocking findings remain inside the bounded
documentation workflow.

This handoff also makes the automation entrypoint explicit for future demo
reruns: the governed scenario workflow lives at
`playbooks/ed_throughput_crunch_demo_workflow.yaml` and sequences the package
through contract/plan, build, verify, repair, and review/handoff.

### Why It Matters

The ED throughput package is now discoverable as both a document set and an
Agent-Orch workflow. A future operator does not need to reconstruct how this
scenario was assembled or where to start: the playbook, artifacts, and review
trail now point to one repeatable automation path.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/ed_throughput_crunch_demo_workflow.yaml

cd /Users/lee/projects/dashForge
sed -n '1,240p' code-reviews/review-ed-throughput-crunch-demo-workflow.md
sed -n '1,220p' code-reviews/verify-ed-throughput-crunch-demo-workflow.md
sed -n '1,220p' code-reviews/repair-ed-throughput-crunch-demo-workflow.md
sed -n '1,240p' playbooks/ed_throughput_crunch_demo_workflow.yaml
```

Expect the playbook validation to pass and the review to state that the
governed documentation workflow is closed, with only the already-known
host-environment browser rehearsal remaining before client use.

## 2026-04-01 — ED Throughput Demo Workflow Repair Closed

### What Was Built

The verification finding against the ED throughput demo-package documents is
now repaired. The canonical `facility_summary` data design in
`scenarios/healthcare/ed-throughput-crunch-data-design.md` now defines a
required derived field `priority_status` with bounded management-language
values tied to facility risk and worsening trend conditions.

The downstream package artifacts now point to that same field instead of
assuming an operator will invent wording during assembly.
`scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md` now calls
for `priority_status` in the `Priority Sites This Week` widget, and
`scenarios/healthcare/ed-throughput-crunch-build-checklist.md` now tells the
operator to use `Act Now`, `Watch Closely`, or `Stable Monitor` explicitly.

The repair outcome is recorded in
`code-reviews/repair-ed-throughput-crunch-demo-workflow.md`.

### Why It Matters

This closes the one medium contract gap from verification. The priority table
is now specified at the data layer, reflected in the dashboard blueprint, and
anchored in the operator checklist, so the most important management readout
is no longer left to ad hoc copy decisions during demo assembly.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
rg -n "priority_status|Act Now|Watch Closely|Stable Monitor" \
  scenarios/healthcare/ed-throughput-crunch-data-design.md \
  scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md \
  scenarios/healthcare/ed-throughput-crunch-build-checklist.md \
  code-reviews/repair-ed-throughput-crunch-demo-workflow.md
sed -n '156,182p' scenarios/healthcare/ed-throughput-crunch-data-design.md
sed -n '140,148p' scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md
sed -n '120,128p' scenarios/healthcare/ed-throughput-crunch-build-checklist.md
sed -n '1,220p' code-reviews/repair-ed-throughput-crunch-demo-workflow.md
```

Expect the same `priority_status` contract to appear in the canonical data
design, the priority-table widget definition, the operator label guidance, and
the repair artifact.

## 2026-04-01 — ED Throughput Demo Build Artifacts Added

### What Was Built

The healthcare ED throughput demo package now has the three practical build
artifacts that the earlier contract and plan called for.

`scenarios/healthcare/ed-throughput-crunch-data-design.md` defines the
dashboard-facing data model: dataset inventory, grain, key fields, hotspot
facility expectations, widget-to-dataset mapping, and bounded `live` /
`hybrid` guidance aligned to Sprint 9.

`scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md` defines the
actual page shape for the demo: executive KPI band, facility concentration
views, operational driver views, consequence/action close, presenter sequence,
builder demo edits, AI positioning, and export/handoff framing.

`scenarios/healthcare/ed-throughput-crunch-build-checklist.md` turns that into
an operator runbook covering pre-flight, dashboard assembly, rehearsal order,
bounded AI and live-binding mentions, go/no-go review, and final rehearsal.

### Why It Matters

The ED throughput package is no longer just a scenario brief plus talk track.
The repo now contains enough concrete structure for an operator to build and
rehearse a credible client-facing demo without inventing the dataset design,
screen layout, or execution sequence from scratch.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-data-design.md
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-dashboard-blueprint.md
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-build-checklist.md
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-contract.md
sed -n '1,280p' plans/ed-throughput-crunch-demo-plan.md
```

Expect the three new artifacts to stay aligned with the scenario canon, the
client presentation script, and the bounded Sprint 9 product baseline.

## 2026-04-01 — ED Throughput Demo Package Workflow Defined

### What Was Built

A new bounded planning slice now exists for turning the healthcare
`ed-throughput-crunch` scenario into a dashboard demo build package.
`scenarios/healthcare/ed-throughput-crunch-contract.md` locks the scope,
constraints, required outputs, and acceptance criteria for that package, while
`plans/ed-throughput-crunch-demo-plan.md` sequences the work from scenario
alignment through dashboard architecture, builder-demo moments, presenter
walkthrough, handoff/export framing, and readiness review.

The slice is explicitly framed as scenario packaging on top of the closed
Sprint 9 baseline rather than new runtime or platform development. It keeps
the future demo package anchored to the existing healthcare scenario brief,
client presentation script, and the current `mock` / `live` / `hybrid`
product story.

### Why It Matters

This gives DashForge a concrete candidate next slice after the Sprint 1-9
governed ladder closed. Instead of leaving the ED throughput healthcare story
as loose scenario notes, the repo now has a bounded execution contract for
building a repeatable client-facing dashboard demo package that fits the
current product and governance model.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch.md
sed -n '1,260p' scenarios/healthcare/client-presentation-script.md
sed -n '1,260p' scenarios/healthcare/ed-throughput-crunch-contract.md
sed -n '1,280p' plans/ed-throughput-crunch-demo-plan.md
```

Expect the contract and plan to stay aligned with the scenario brief and
presentation script, and to remain bounded to demo-package assembly rather
than new product-feature work.

## 2026-04-01 — Governed Playbooks Normalized For Future Runs

### What Was Built

DashForge's durable governed workflows were normalized to the newer
Agent-Orch model after the Sprint 1-9 build completed. The active playbooks in
`playbooks/` now declare `operational_paths: ["artifacts/current/"]` so the
stable dashboard surface is treated as operator-owned runtime state instead of
worker-attributed product output, and the broad `artifacts/` step allowlists
were removed from those durable workflows.

The ad hoc restart workflows used while the app was being delivered were also
retired from the active surface and archived under `playbooks/backups/`. The
standing future baseline is now the canonical
`playbooks/project_sprint_program.yaml` plus Agent-Orch `resume-run` for any
real recovery.

### Why It Matters

This keeps the repo's future operating model aligned with the actual
Agent-Orch fixes rather than the tactical workarounds we used during the live
governed build. The next governed run will start from the durable playbook
surface instead of stale restart scaffolding, while the historical recovery
artifacts remain available for audit.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/project_sprint_program.yaml
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/project_remaining_governed_delivery.yaml
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/mvp_remaining_governed_delivery.yaml
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/s1_01_remaining_foundation_governed_delivery.yaml
ls /Users/lee/projects/dashForge/playbooks
ls /Users/lee/projects/dashForge/playbooks/backups
```

Expect all four playbooks to validate cleanly. Expect the active
`playbooks/` directory to contain only the durable workflows and the archived
restart workflows to live under `playbooks/backups/`.

## 2026-04-01 — Sprint 9 Review And Handoff Closed

### What Was Built

Sprint 9 now has its full governed closeout trail in-repo.
`code-reviews/review-sprint-09.md` joins the existing
`code-reviews/verify-sprint-09.md` and `code-reviews/repair-sprint-09.md`, and
the durable handoff docs now agree that the governed sprint ladder is closed
through Sprint 9.

This closeout pass also reran the current repo checks against the repaired
Sprint 9 state. `python3 -m pytest -q`, `npm --prefix frontend test`, and
`npm --prefix frontend run build` all passed again on 2026-04-01, while
`npm --prefix frontend run dev -- --host 127.0.0.1` reproduced the already
known sandbox limit with `listen EPERM`.

### Why It Matters

This turns Sprint 9 from "implemented, verified, and repaired" into a formally
closed bounded production-binding baseline. The governed program is now fully
closed in-repo through Sprint 9, and any additional live-binding or platform
work can start as a new roadmap slice instead of reopening the current sprint.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run dev -- --host 127.0.0.1
sed -n '1,240p' code-reviews/review-sprint-09.md
sed -n '1,260p' sprint-plan.md
sed -n '1,260p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,260p' project-plan.md
sed -n '1,260p' README.md
```

Expect the first three commands to pass. In this sandbox,
`npm --prefix frontend run dev -- --host 127.0.0.1` still fails with
`listen EPERM`, so the remaining browser smoke is a host-environment step
rather than a Sprint 9 regression.

## 2026-04-01 — Sprint 9 Production Binding Implementation Landed

### What Was Built

Sprint 9's bounded production-binding slice now exists in-repo. The frontend
has a central `createDashboardDataAdapter(...)` seam that resolves `mock`,
`live`, and `hybrid` `DashboardSpec` documents onto the same renderer-facing
`DataAdapter` contract, backed by a read-only REST adapter plus explicit
hybrid composition for mixed mock/live dashboards.

The builder shell now exposes production-binding controls inside the existing
property rail. A user can switch the active draft between mock/live/hybrid
modes, inspect the dataset ids the current dashboard references, configure a
REST endpoint and field map per dataset, and keep preview/presenter/export on
the same resolved adapter path. JSON import/export was widened to accept live
and hybrid specs, and serialized DashboardSpec artifacts now strip live
`connection.headers` values so durable outputs do not persist secrets.

### Why It Matters

This is the first governed path from workshop-authored mock dashboards toward
real production data without throwing away the shared spec/runtime contract.
DashForge can now prove one live REST data path while keeping widgets, the
renderer, presenter mode, and export flows blind to where the data came from.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run dev -- --host 127.0.0.1
```

Expect the first three commands to pass. In this sandbox,
`npm --prefix frontend run dev -- --host 127.0.0.1` still fails with
`listen EPERM`, so the remaining browser smoke for the Sprint 9 binding
workflow is still a host-environment step rather than an implementation
failure.

## 2026-04-01 — Sprint 8 Review And Handoff Closed

### What Was Built

Sprint 8 now has the full governed closeout trail in-repo. The formal review
artifact lives at `code-reviews/review-sprint-08.md`, joining
`code-reviews/verify-sprint-08.md` and `code-reviews/repair-sprint-08.md`.
The durable handoff docs were also refreshed so `context.md`,
`result-review.md`, `sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and
`README.md` all agree that Sprint 8 is closed and Sprint 9 planning is next.

This closeout pass also reran the current repo checks against the repaired
Sprint 8 state. `python3 -m pytest -q`, `npm --prefix frontend test`, and
`npm --prefix frontend run build` all passed again on 2026-04-01, while
`npm --prefix frontend run dev -- --host 127.0.0.1` reproduced the already
known sandbox limit with `listen EPERM`.

### Why It Matters

This turns Sprint 8 from "implemented, verified, and repaired" into a formally
closed AI-assisted authoring baseline. Sprint 9 can now start from a durable
prompt-to-spec, candidate-staging, preview/presenter/export foundation instead
of reopening whether the bounded AI slice is actually done.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run dev -- --host 127.0.0.1
sed -n '1,220p' code-reviews/review-sprint-08.md
sed -n '1,260p' sprint-plan.md
sed -n '1,260p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,220p' project-plan.md
sed -n '1,260p' README.md
```

Expect the first three commands to pass. In this sandbox,
`npm --prefix frontend run dev -- --host 127.0.0.1` still fails with
`listen EPERM`, so the remaining browser smoke is a host-environment step
rather than a Sprint 8 regression.

## 2026-04-01 — Sprint 8 AI Context Guardrails Tightened

### What Was Built

Sprint 8's AI generation seam now fails cleanly when a request falls outside
the bounded mock-backed scenario canon instead of throwing during prompt
assembly. `frontend/src/features/ai/generateDashboardSpec.ts` now maps those
preflight failures into typed request errors, and
`frontend/src/features/ai/buildGenerationPrompt.ts` now requires a registered
scenario plus a mock-backed starter draft before dataset vocabulary is derived.

Generate-new prompt seeding was also tightened so the starter spec now honors
the currently selected theme instead of leaking the default theme from the
underlying starter template into the AI request context. Targeted AI and
builder tests were updated, and a full frontend rerun passed again on
2026-04-01.

### Why It Matters

This closes the last unsafe edge in the landed Sprint 8 slice. Imported or
out-of-canon drafts now surface a clear bounded error instead of crashing the
AI flow, and the selected theme now stays consistent from builder state into
generation-time prompt context.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Expect the first two commands to pass. In this sandbox, `npm run dev -- --host
127.0.0.1` still fails with `listen EPERM`, so the remaining browser smoke is a
host-environment step rather than a Sprint 8 regression.

## 2026-04-01 — Sprint 8 Contract-Alignment Refinements Landed

### What Was Built

Sprint 8's AI slice was tightened in-place without widening the sprint. The
prompt-template default path now follows the canonical scenario default mapping
already defined in the shared template catalog, so scenario-sensitive defaults
like SaaS churn-risk now seed the correct prompt/template combination instead
of whichever template happened to be first in array order.

Prompt assembly in `frontend/src/features/ai/buildGenerationPrompt.ts` now
derives dataset vocabulary from the actual starter spec's mock context instead
of reconstructing an ad hoc placeholder context. `BuilderShell` also now
blocks improve-current generation unless the active draft validates cleanly and
passes the validated draft into the AI seam, which keeps Sprint 8 aligned with
the contract language around improving the current validated dashboard.

Targeted coverage was extended for both fixes, and a full frontend rerun passed
after the refinement: `npm test` and `npm run build` both succeeded again on
2026-04-01.

### Why It Matters

These changes close small but real canon gaps in the landed Sprint 8 slice.

## 2026-04-01 — Sprint 8 Governed Restart Triggered By Stale AI Output Paths

### What Was Built

The governed ladder reached Sprint 8 implementation after 20 successful steps,
then halted because the playbooks still expected
`frontend/src/features/ai/AIPromptBar.tsx` and
`frontend/src/features/ai/generateSpec.ts`. The actual landed Sprint 8 files
are:

- `frontend/src/features/ai/AiPromptBar.tsx`
- `frontend/src/features/ai/generateDashboardSpec.ts`

All governed playbooks were corrected to those real paths, and a focused
restart playbook was added at
`playbooks/backups/project_sprint_program_restart_from_s08_implement.yaml`.
The live run is now `92e1ee3f4b29`.

### Why It Matters

This was a governance artifact drift issue, not an implementation regression.
Fixing it preserves the 20-step successful climb through Sprint 7 closeout and
Sprint 8 contract/plan while keeping the restart scope limited to the failed
Sprint 8 slice onward.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/backups/project_sprint_program_restart_from_s08_implement.yaml
```

Then open:

`/Users/lee/projects/dashForge/artifacts/current/dashboard.html`

Confirm the dashboard shows run `92e1ee3f4b29` on `s08_implement`.

## 2026-04-01 — Sprint 9 Governed Restart Triggered By Stale Binding Output Path

### What Was Built

After the Sprint 8 restart succeeded, the governed ladder carried through Sprint
8 verify/repair/review and Sprint 9 contract/plan, then halted at Sprint 9
implementation. The cause was another stale playbook output declaration: the
playbooks were still validating against
`frontend/src/features/binding/BindingWorkflow.tsx`, while the actual
builder-integrated binding UI that landed in the repo is
`frontend/src/features/builder/BindingPanel.tsx`.

All governed playbooks were corrected to the real Sprint 9 binding surface, and
a focused restart playbook was added at
`playbooks/backups/project_sprint_program_restart_from_s09_implement.yaml`.
The live run is now `dbf00b6e464e`.

### Why It Matters

This was again a governance artifact drift issue rather than a product-code
failure. Fixing it preserves the successful Sprint 8 closeout and Sprint 9
contract/plan progress while keeping the restart scope limited to the failed
Sprint 9 slice onward.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/backups/project_sprint_program_restart_from_s09_implement.yaml
```

Then open:

`/Users/lee/projects/dashForge/artifacts/current/dashboard.html`

Confirm the dashboard shows run `dbf00b6e464e` on `s09_implement`.
Default prompts now track the same scenario intent choices as the manual
starter templates, improve-current generation no longer prompts from an invalid
editor state, and prompt context stays grounded in the same starter-spec seam
the builder actually applies.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

## 2026-04-01 — Sprint 8 AI Prompt-To-Spec Implementation Landed

### What Was Built

Sprint 8's frontend implementation slice now exists in `frontend/`. The
builder shell still owns the authoritative validated draft, but it now exposes
a bounded AI prompt surface under `frontend/src/features/ai/` with:

- `AiPromptBar.tsx` for generate-new and improve-current flows
- `promptTemplates.ts` and `buildGenerationPrompt.ts` for pack/scenario/template-aware prompt assembly
- `aiGenerationClient.ts` for the Claude-compatible provider seam
- `generateDashboardSpec.ts` for response extraction, validation, one bounded repair pass, and staged candidate handling

`BuilderShell` now stages AI output separately from the active draft, shows
candidate status in the builder chrome, and requires an explicit apply/discard
decision before generated output can replace the current spec. Accepted
candidates still flow through the same preview, presenter, JSON export, and
proposal-artifact path used by the closed Sprint 7 baseline. Manual builder use
also remains intact when AI configuration is absent.

Targeted Sprint 8 tests now cover prompt template/context assembly,
Claude-client response handling, validation/repair behavior, and one builder
integration flow. A full frontend verification pass also succeeded on
2026-04-01: `npm test` and `npm run build` passed, while `npm run dev -- --host
127.0.0.1` reproduced the unchanged sandbox limit with `listen EPERM`.

### Why It Matters

This turns DashForge into a bounded AI-assisted authoring tool without
abandoning the spec-driven product shape. A consultant can now prompt for a
new dashboard or improvements to the current one, review a validated candidate,
and apply it into the same shared runtime instead of jumping to a disconnected
AI-only flow.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Expect the first two commands to pass. In this sandbox, `npm run dev -- --host
127.0.0.1` still fails with `listen EPERM`, so the remaining browser smoke is a
host-environment step rather than a Sprint 8 implementation defect.

## 2026-04-01 — Sprint 7 Review And Handoff Closed

### What Was Built

Sprint 7 now has the full governed closeout trail in-repo. The formal review
artifact lives at `code-reviews/review-sprint-07.md`, joining
`code-reviews/verify-sprint-07.md` and `code-reviews/repair-sprint-07.md`.
The durable handoff docs were also refreshed so `context.md`, `sprint-plan.md`,
`WHERE_AM_I.md`, `project-plan.md`, and `README.md` all agree that Sprint 7 is
closed and Sprint 8 contract/plan work is the next governed milestone.

This closeout pass re-ran the current repo checks against the repaired Sprint 7
state. `python3 -m pytest -q`, `frontend npm test`, and `frontend npm run build`
all passed again, while `frontend npm run dev -- --host 127.0.0.1` reproduced
the already-known sandbox limit with `listen EPERM`.

### Why It Matters

This turns Sprint 7 from "implemented, verified, and repaired" into a formally
closed storytelling/export baseline. Sprint 8 can now start from a durable
presenter/export foundation instead of reopening whether narrative authoring,
widget emphasis, bounded annotations, and browser-local proposal artifacts are
actually complete.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1
cd /Users/lee/projects/dashForge
sed -n '1,220p' code-reviews/review-sprint-07.md
sed -n '1,260p' sprint-plan.md
sed -n '1,260p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,220p' project-plan.md
sed -n '1,260p' README.md
```

Expect the first three commands to pass. In this sandbox, `npm run dev -- --host
127.0.0.1` still fails with `listen EPERM`, so the remaining browser smoke is a
host-environment step rather than a Sprint 7 implementation defect.

## 2026-04-01 — Sprint 7 Presenter Export Repair Landed

### What Was Built

Sprint 7's repair step fixed the one defect found during governed verification:
proposal export from presenter mode no longer serializes the full presenter UI.
`BuilderShell` now exports only the dashboard stage, `PresenterMode` exposes a
dedicated stage ref for that path, and the default artifact no longer includes
presenter notes just because the user exported while in presenter mode.

Targeted regression coverage was added for both seams. The export helper now
proves default proposal artifacts omit presenter notes, and the builder-shell
workflow now proves presenter-mode artifact HTML omits presenter chrome such as
the control panel and navigation buttons.

### Why It Matters

This closes the main Sprint 7 correctness defect found by verification. The
default proposal artifact is now aligned with the sprint contract: it stays
proposal-ready and does not leak presenter-only UI or notes into the exported
dashboard body.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
cd /Users/lee/projects/dashForge/frontend
npm test -- --run src/features/builder/BuilderShell.test.tsx src/features/export/exportDashboard.test.ts
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Expect the first four commands to pass. In this sandbox, `npm run dev -- --host
127.0.0.1` still fails with `listen EPERM`, so the remaining browser smoke is a
host-environment step rather than a Sprint 7 repair regression.

## 2026-04-01 — Sprint 7 Presenter And Export Implementation Landed

### What Was Built

Sprint 7's implementation slice now exists in `frontend/`. The builder shell
still owns the shared draft, but it now hydrates and clamps the existing
`DashboardSpec.narrative` branch, exposes a story-arc editor for hook/context/
tension/resolution/call-to-action, supports bounded widget annotations, and can
switch between build, preview, and presenter modes without forking the runtime.

New Sprint 7 files now exist under:

- `frontend/src/features/presenter/narrativeStore.ts`
- `frontend/src/features/presenter/StoryArcEditor.tsx`
- `frontend/src/features/presenter/PresenterMode.tsx`
- `frontend/src/features/presenter/ChartAnnotationLayer.tsx`
- `frontend/src/features/export/exportSpec.ts`
- `frontend/src/features/export/exportDashboard.ts`

The shared runtime path was extended rather than replaced. `BuilderShell`,
`BuilderToolbar`, and `PropertyPanel` now integrate story editing, annotation
authoring, presenter controls, and export actions on the same current draft.
`DashboardRenderer` and `WidgetRenderer` now support presenter emphasis and the
shared annotation layer instead of routing presenter behavior through a second
private dashboard renderer.

Targeted Sprint 7 tests were added for narrative hydration/clamping, story-arc
editing, presenter stepping and widget emphasis, and the browser-native export
helpers. `frontend` verification passed after the slice landed: `npm test` and
`npm run build` both succeeded.

### Why It Matters

This turns DashForge from a bounded builder/preview tool into a workshop
storytelling workflow. A consultant can now author the dashboard narrative,
attach callouts, walk the room through a guided presenter mode, and export both
the validated spec and a printable proposal artifact without leaving the app's
spec-driven runtime model.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

Expect both commands to pass. In this sandbox, `npm run dev -- --host
127.0.0.1` is still blocked by `listen EPERM`, so the real browser smoke for
presenter/export remains a host-environment step rather than an implementation
failure in this handoff.

## 2026-04-01 — Sprint 6 Review And Handoff Closed

### What Was Built

Sprint 6 now has the full governed closeout trail in-repo. The formal review
artifact lives at `code-reviews/review-sprint-06.md`, joining
`code-reviews/verify-sprint-06.md` and `code-reviews/repair-sprint-06.md`.
The durable handoff docs were also refreshed so `context.md`, `sprint-plan.md`,
`WHERE_AM_I.md`, `project-plan.md`, and `README.md` all agree that Sprint 6 is
closed and Sprint 7 is the next governed milestone.

This closeout pass also re-ran the current repo checks against the reviewed
Sprint 6 state. `python3 -m pytest -q`, `frontend npm test`, and
`frontend npm run build` all passed again, while `frontend npm run dev -- --host
127.0.0.1` reproduced the already-known sandbox limit with `listen EPERM`.

### Why It Matters

This turns Sprint 6 from "implemented and locally verified" into a formally
closed baseline. Sprint 7 can now start from a durable manual-authoring
foundation instead of reopening whether the builder shell, editable layout,
template instantiation, and JSON spec I/O are actually complete.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1
cd /Users/lee/projects/dashForge
sed -n '1,220p' code-reviews/review-sprint-06.md
sed -n '1,260p' sprint-plan.md
sed -n '1,260p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,220p' project-plan.md
sed -n '1,260p' README.md
```

Expect the first three commands to pass. In this sandbox, `npm run dev -- --host
127.0.0.1` still fails with `listen EPERM`, so the remaining browser smoke is a
host-environment step rather than a Sprint 6 implementation defect.

## 2026-04-01 — Sprint 6 Builder Implementation Landed And Verified

### What Was Built

Sprint 6's implementation slice now exists in `frontend/`. The app no longer
boots into the fixed Sprint 5 sample shell. It now opens a real builder
workspace centered on:

- `frontend/src/features/builder/BuilderShell.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/WidgetPalette.tsx`
- `frontend/src/features/builder/PropertyPanel.tsx`
- `frontend/src/features/builder/TemplateGallery.tsx`
- `frontend/src/features/builder/specIo.ts`

The builder uses `react-grid-layout` for drag/resize composition while keeping
the existing widget `position` fields as the canonical stored layout. Template
selection now instantiates real starter DashboardSpecs from the Sprint 4
catalog, palette insertion creates valid starter widgets for the supported
primitive set, dashboard/widget property edits write directly into the draft
spec, and JSON import/export stays on the same schema-validation path already
used by persistence helpers.

Targeted Sprint 6 tests were added for builder state, layout mutation, template
instantiation, spec I/O, and one builder-shell interaction flow. `frontend`
verification passed after the slice landed: `npm test` and `npm run build`
both succeeded.

### Why It Matters

This moves DashForge from a read-only runtime proof into a bounded manual
authoring workflow. A consultant can now start from a template, add widgets,
reposition and resize them, edit common properties, and move specs in and out
as JSON without leaving the product's spec-first runtime model.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Expect `npm test` and `npm run build` to pass. In this sandbox,
`npm run dev -- --host 127.0.0.1` still fails with `listen EPERM`; that
browser smoke remains a host-environment-only validation step.

## 2026-04-01 — Sprint 5 Review And Handoff Closed

### What Was Built

Sprint 5 now has the full governed closeout trail in-repo. The formal review
artifact lives at `code-reviews/review-sprint-05.md`, joining the existing
`code-reviews/verify-sprint-05.md` and `code-reviews/repair-sprint-05.md`
artifacts. The durable handoff docs were also refreshed so `context.md`,
`sprint-plan.md`, `WHERE_AM_I.md`, `project-plan.md`, and `README.md` all
agree that Sprint 5 is complete and Sprint 6 is the next governed milestone.

This closeout pass re-ran the current repo checks against the repaired Sprint 5
state. `python3 -m pytest -q`, `frontend npm test`, and `frontend npm run build`
all passed, confirming that the verification/repair fixes are still intact at
handoff time.

### Why It Matters

This turns Sprint 5 from "implemented and repaired" into a formally closed
baseline. Sprint 6 can now start from a durable runtime-breadth foundation
instead of reopening whether the broader primitive set, shared chart/theme
compilers, and responsive read-only runtime are actually complete.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
cd /Users/lee/projects/dashForge
sed -n '1,240p' code-reviews/review-sprint-05.md
sed -n '1,220p' sprint-plan.md
sed -n '1,260p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,220p' project-plan.md
sed -n '1,240p' README.md
```

## 2026-04-01 — Sprint 5 Primitive And Responsive Runtime Implementation Landed

### What Was Built

Sprint 5's implementation slice is now present in `frontend/`. The DashboardSpec
and schema surface were expanded from the old `kpi` + `line` proof to the full
MVP primitive set: `kpi`, `line`, `bar`, `stacked_bar`, `donut`, `table`,
`sparkline`, and `gauge`. Shared compiler seams now exist at:

- `frontend/src/core/charts/chartCompiler.ts`
- `frontend/src/core/theme/themeCompiler.ts`

The widget runtime was broadened accordingly: six new primitive components now
exist under `frontend/src/components/charts/`, `frontend/src/core/data/widgetDataResolvers.ts`
resolves the expanded widget surface through `DataAdapter`, and
`frontend/src/components/DashboardRenderer.tsx` now renders through
`frontend/src/dashboard/ResponsiveDashboardGrid.tsx` instead of the earlier
fixed CSS-grid proof.

The sample/runtime proof was also refreshed. `frontend/src/sample/sampleDashboard.ts`
is now a SaaS scaling scenario that exercises all eight MVP primitives and the
new responsive layout path, with targeted tests added for chart compilation,
theme compilation, responsive layout packing, and broadened dashboard rendering.

### Why It Matters

This closes the main runtime-breadth gap between the closed Sprint 4
data/template baseline and the later builder-mode sprint. DashForge no longer
looks like a two-widget renderer with one chart component; it now has the full
MVP primitive library and a responsive read-only runtime while preserving the
adapter boundary that later live-binding and builder work depend on.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Expect `npm test` and `npm run build` to pass. In this sandbox, `npm run dev`
still fails with `listen EPERM` because localhost port binding is denied here;
that remains a host-environment-only smoke step.

## 2026-04-01 — Sprint 4 Review And Handoff Closed

### What Was Built

Sprint 4 now has the full closeout trail in-repo: verification, repair, and the
final review artifact at `code-reviews/review-sprint-04.md`. The durable handoff
docs were also refreshed so `context.md`, `sprint-plan.md`, `WHERE_AM_I.md`,
`project-plan.md`, and `README.md` all agree that Sprint 4 is complete and
Sprint 5 is the next governed milestone.

This closeout pass also re-ran the current repo checks and the real multi-pack
generator entry points. `python3 -m pytest -q`, `frontend npm test`, and
`frontend npm run build` passed, and both the financial and saas generator flows
wrote SQLite plus snapshot artifacts into the Sprint 4 review/handoff scratch
directory.

### Why It Matters

This turns Sprint 4 from "implemented and already verified" into a formally
closed baseline with a durable handoff state. The next session no longer has to
infer whether Sprint 4 is still open, and Sprint 5 can begin without reopening
the completed financial, saas, template-catalog, or generator work.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
cd /Users/lee/projects/dashForge
PYTHONPATH=src python3 -m dashForge.main generate --pack financial --scenario market-downturn --seed 5301 --output .agent-orch-scratch/2e34405fba8c/s04_review_handoff/attempt-1/financial-market-downturn.sqlite --snapshot-output .agent-orch-scratch/2e34405fba8c/s04_review_handoff/attempt-1/financial-market-downturn.snapshot.json --force
PYTHONPATH=src python3 -m dashForge.main generate --pack saas --scenario churn-crisis --seed 8301 --output .agent-orch-scratch/2e34405fba8c/s04_review_handoff/attempt-1/saas-churn-crisis.sqlite --snapshot-output .agent-orch-scratch/2e34405fba8c/s04_review_handoff/attempt-1/saas-churn-crisis.snapshot.json --force
sed -n '1,240p' code-reviews/review-sprint-04.md
sed -n '1,220p' sprint-plan.md
sed -n '1,260p' context.md
sed -n '1,220p' WHERE_AM_I.md
sed -n '1,220p' project-plan.md
sed -n '1,220p' README.md
```

## 2026-04-01 — Sprint 4 Implementation Completed In Repo And Re-Verified

### What Was Built

Sprint 4's remaining in-repo implementation gap was closed and re-verified.
The Financial Services and SaaS packs, their shared template catalog, and the
multi-pack generator paths are now backed by a small shared scenario-registry
contract improvement in `frontend/src/mock-data/scenarioCatalog.ts`: callers
can ask for the primary trend dataset by pack instead of incorrectly assuming
every pack uses `monthly_summary`.

This kept healthcare stable while letting shared Sprint 4 tests validate all
three packs correctly:

- healthcare continues to use `monthly_capacity`
- financial uses `monthly_summary`
- saas uses `monthly_summary`

### Why It Matters

Sprint 4 is no longer just "partially landed" code plus partial tests. The repo
now has a green, coherent multi-pack mock-data surface that matches the canon:
three healthcare scenarios, three financial scenarios, three SaaS scenarios,
shared template metadata and defaults, and deterministic CLI generation for the
new packs.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest tests/test_generate.py -q
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
cd /Users/lee/projects/dashForge
PYTHONPATH=src python3 -m dashForge.main generate --pack financial --scenario market-downturn --seed 5301 --output /tmp/dashforge-financial.sqlite --snapshot-output /tmp/dashforge-financial.snapshot.json --force
PYTHONPATH=src python3 -m dashForge.main generate --pack saas --scenario churn-crisis --seed 8301 --output /tmp/dashforge-saas.sqlite --snapshot-output /tmp/dashforge-saas.snapshot.json --force
```

Expect all tests/build steps to pass and both generator commands to print
successful SQLite/snapshot output paths.

## 2026-03-31 — Sprint 4 Partial Core Implemented

### What Was Built

Sprint 4 backend dispatch and deterministic generation coverage were extended so
the CLI now accepts `financial` and `saas` pack arguments and routes to the new
SQLite generators. The test suite in `tests/test_generate.py` now includes:

- CLI happy-path coverage for Financial Services and SaaS pack scenarios
- Unknown-pack/unknown-scenario failure assertions for clear user-facing errors
- Determinism assertions for financial and SaaS snapshot generation

This updates Sprint 4 from “ready” to actively in motion while preserving the
closed Sprint 3 baseline as an immutable foundation.

### Why It Matters

This closes the command-surface gap required for the Sprint 4 generator slice.
It proves the new non-healthcare packs can now be generated and validated via the
same bounded CLI contract as healthcare while retaining reproducibility guarantees.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
PYTHONPATH=src python3 -m dashForge.main generate --pack financial --scenario market-downturn --seed 5301 --output /tmp/financial.sqlite
PYTHONPATH=src python3 -m dashForge.main generate --pack saas --scenario churn-crisis --seed 8301 --output /tmp/saas.sqlite
cd /Users/lee/projects/dashForge
python3 -m pytest tests/test_generate.py -q
```

- Expect the two generator commands to print a generated artifact path and exit `0`.
- Expect scenario/pack validation failures to return argparse-style errors (exit code `2`) with explicit unknown pack/scenario messages.

## 2026-04-01 — Governed Sprint Path Policy Repaired And Sprint 4 Restarted

### What Was Built

The governed DashForge playbooks were repaired so operational artifact writes
under `artifacts/` no longer halt valid sprint work, and implementation /
verification / repair steps now allow `tests/` because the live Sprint 4 work
correctly landed new test coverage there. The Sprint 4 implementation step was
also corrected to validate against the repo’s actual financial scenario files
(`financialGrowthQuarter.ts`, `financialMarketDownturn.ts`, and
`financialAdvisorAttrition.ts`) instead of stale `financialServices*` filenames.

To continue without replaying closed Sprint 3 work, two restart playbooks were
captured and are now archived under `playbooks/backups/`:

- `playbooks/backups/project_sprint_program_step_07_restart.yaml`
- `playbooks/backups/project_sprint_program_restart_from_s04_implement.yaml`

The live governed run is now `2e34405fba8c`, and the stable operator dashboard
has been repointed to `artifacts/current/dashboard.html`.

### Why It Matters

This closes the immediate false-failure loop that kept stopping governed
delivery for non-product writes and legitimate test additions. The protection
boundary still exists around product code, but operational artifact churn no
longer causes avoidable halts while Sprint 4 is running unattended.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/project_sprint_program.yaml
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/backups/project_sprint_program_restart_from_s04_implement.yaml
```

Then open:

`/Users/lee/projects/dashForge/artifacts/current/dashboard.html`

Confirm the dashboard shows run `2e34405fba8c` on `s04_implement`.

## 2026-03-31 — Sprint 4 Registry and Template Invariants Added

### What Was Built

Added focused front-end mock-data tests that lock Sprint 4 runtime registration
guarantees:

- `frontend/src/mock-data/scenarioCatalog.test.ts` verifies pack/scenario registration
  uniqueness, non-healthcare scenario coverage, and dataset availability by pack.
- `frontend/src/mock-data/templateCatalog.test.ts` verifies per-scenario default
  template resolution and complete intent coverage for each new pack.

### Why It Matters

This closes the catalog-contract portion of Sprint 4 and protects scenario and
template recommendation behavior against future regressions.

## 2026-03-31 — Sprint 3 Review Artifact Completed For Handoff

The final review handoff document for Sprint 3 was produced at
`code-reviews/review-sprint-03.md` to complete the closeout triad with
`verify-sprint-03.md` and `repair-sprint-03.md`. Handoff-state documents were
also aligned so the repository explicitly transitions to Sprint 4 as the next
governed milestone.

### Why It Matters

This closes the review loop required for disciplined sprint handoff and prevents
future sessions from reopening resolved Sprint 3 decisions unless a new defect
scope appears.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,260p' code-reviews/review-sprint-03.md
sed -n '1,220p' sprint-plan.md
sed -n '1,220p' context.md
sed -n '1,260p' result-review.md
```

## 2026-03-31 — Sprint 3 SQLite Mock Engine And Healthcare Expansion Closed

### What Was Built

Sprint 3 now has an end-to-end healthcare mock-data foundation in the repo. The
healthcare pack was expanded to the full canon scenario set
(`flu-season`, `quality-improvement`, and `cost-pressure`), the Python CLI in
`src/dashForge/` can generate deterministic SQLite scenario databases plus
optional SQLite-derived snapshot exports, the CLI overwrite guard is now
covered in tests, and the frontend now has a usable SQLite snapshot bridge
behind `DataAdapter` instead of only a pure seam proof.

### Why It Matters

This is the first sprint where DashForge's mock-data story stops looking like a
small static sample and starts behaving like a real generation workflow. The
repo can now produce believable healthcare scenario artifacts, prove
aggregate/drill-down consistency, and keep the frontend runtime storage-agnostic
for later direct-browser SQLite or live-binding work.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
PYTHONPATH=src python3 -m dashForge.main generate \
  --scenario flu-season \
  --seed 3101 \
  --output /tmp/flu-season.sqlite \
  --snapshot-output /tmp/flu-season.snapshot.json \
  --force
python3 -m pytest -q
cd frontend
npm test
npm run build
```

For CLI unhappy-path validation:

```bash
cd /Users/lee/projects/dashForge
PYTHONPATH=src python3 -m dashForge.main generate \
  --scenario not-a-real-scenario \
  --output /tmp/invalid.sqlite
PYTHONPATH=src python3 -m dashForge.main generate \
  --scenario flu-season \
  --seed 3101 \
  --output /tmp/flu-season.sqlite \
  --snapshot-output /tmp/flu-season.snapshot.json
```

Expect clean argparse errors, not tracebacks. The second command should tell
you to pass `--force` if the output files already exist.

## 2026-03-31 — Sprint 2 Review And Handoff Closed

### What Was Built

Sprint 2 now has a complete closeout trail in the repo: contract, plan,
verification, repair, code review, and refreshed handoff docs all agree on the
same outcome. The durable docs now state clearly that Sprint 2 is complete,
Sprint 3 is the next governed slice, and the only open validation limit is the
sandbox's inability to bind localhost ports for manual browser inspection.

### Why It Matters

This turns Sprint 2 from "implemented and probably done" into a governed,
reviewed, handoff-ready baseline. The next agent or human no longer has to
reconstruct what shipped, what was verified, or what still blocks a clean move
into Sprint 3.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
npm run dev -- --host 127.0.0.1 --port 4173
npm exec vite preview -- --host 127.0.0.1 --port 4173
```

Expect `npm test` and `npm run build` to pass. In this sandbox, both server
commands still fail with `listen EPERM`, which matches:

- `code-reviews/verify-sprint-02.md`
- `code-reviews/repair-sprint-02.md`
- `code-reviews/review-sprint-02.md`

Then read:

- `context.md`
- `sprint-plan.md`
- `WHERE_AM_I.md`
- `project-plan.md`
- `README.md`

Confirm they all describe Sprint 2 as closed and Sprint 3 as the next governed
step.

## 2026-03-31 — Sprint 2 Spec/Runtime Baseline Implemented

### What Was Built

Sprint 2 frontend implementation landed in `frontend/`. The DashboardSpec and
runtime baseline were reconciled around a shared query-based `DataAdapter`
contract, one explicit validator now lives in
`frontend/src/core/spec/dashboardSchema.ts`, semantic validation sits on top of
Ajv structural validation, concrete theme resolution drives both CSS variables
and chart output, version-aware save/load helpers validate specs before reuse,
and the browser-side SQLite seam is covered by a narrow loader-backed adapter
contract. The sample dashboard and static scenario-backed adapter were updated
to exercise the broadened runtime path, and targeted tests were added for
validation, persistence, themes, adapters, and renderer behavior.

### Why It Matters

Sprint 1 proved the architecture, but Sprint 2 is what makes the core runtime
stable enough for later sprints. The spec, validation, theme, persistence, and
adapter seams are now explicit and test-backed, so later work can add deeper
mock data, more primitives, templates, and builder behavior without reopening
foundational contracts.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

Review the governed closeout notes in:

- `code-reviews/verify-sprint-02.md`
- `code-reviews/repair-sprint-02.md`
- `code-reviews/review-sprint-02.md`

## 2026-03-31 — Stable Dashboard Path Whitelisted For Governed Runs

### What Was Built

The governed sprint-program playbook was first updated to protect the stable
human dashboard path at `artifacts/current/` so dashboard refreshes would not
cause validation failures. That initial repair used widened `allowed_paths`;
the durable future baseline has since been normalized to playbook-level
`operational_paths` after Agent-Orch gained first-class support for them.
After the original fix, the governed program was relaunched as run
`cec422a09bcc`.

### Why It Matters

This closes a real process gap in Agent-Orch usage: humans need one stable
dashboard bookmark, but the governance layer must explicitly treat that path as
allowed operational output. Without that, the operator surface can accidentally
break unattended delivery.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/project_sprint_program.yaml
python3 -m src.agent_orch.main monitor-run /Users/lee/projects/dashForge/artifacts/runs/cec422a09bcc --workspace-dir /Users/lee/projects/dashForge
```

Then open:

`/Users/lee/projects/dashForge/artifacts/current/dashboard.html`

Confirm the run is active and that the dashboard continues updating without
causing a validation halt.

## 2026-03-31 — Agent-Orch Timeout Override Added For Long Sprint Steps

### What Was Built

The Agent-Orch runtime used for the DashForge governed program was patched so
`codex_cli` can read `AGENT_ORCH_CODEX_TIMEOUT_SECONDS` from the environment
instead of always using the hard-coded 600-second worker timeout. The original
DashForge run hit that limit during Sprint 2 implementation after making
substantial progress, so the program was relaunched with a 60-minute Codex
worker budget.

### Why It Matters

The sprint ladder is designed for unattended, enterprise-style delivery. A
fixed 10-minute limit is too short for legitimate implementation steps of this
size, so without this fix the governed program would keep retrying or halting
for runtime reasons rather than delivery quality reasons.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
AGENT_ORCH_CODEX_TIMEOUT_SECONDS=3600 python3 - <<'PY'
from src.agent_orch.worker import CodexCLIAdapter
print(CodexCLIAdapter.from_environment().timeout_seconds)
PY
```

Then confirm the live DashForge run is `cec422a09bcc` and that its dashboard is
being regenerated at:

`/Users/lee/projects/dashForge/artifacts/current/dashboard.html`

## 2026-03-31 — Full Governed Sprint Program Loaded Into Agent-Orch

### What Was Built

The remaining DashForge app work was loaded into one long-running Agent-Orch
program in `playbooks/project_sprint_program.yaml`. The workflow covers Sprints
2 through 9 as one governed ladder, and each sprint closes in order through
contract/plan, implement, verify, repair, and review/handoff before the next
sprint can start.

### Why It Matters

This matches the intended operating model for Agent-Orch instead of treating it
like a thin wrapper around manual work. The rest of the app is now loaded as a
single unattended program that can keep moving while the human is away, and its
progress is visible through the HTML dashboard rather than raw orchestration
internals.

### How to Verify

```bash
cd /Users/lee/projects/agent-orch
python3 -m src.agent_orch.main validate-playbook /Users/lee/projects/dashForge/playbooks/project_sprint_program.yaml
python3 -m src.agent_orch.main monitor-run /Users/lee/projects/dashForge/artifacts/runs/cec422a09bcc --workspace-dir /Users/lee/projects/dashForge
```

Then open:

`/Users/lee/projects/dashForge/artifacts/current/dashboard.html`

Confirm the run is active with Sprint 3 and later work queued behind the closed
Sprint 2 slice.

## 2026-03-31 — Sprint 2 Spec/Runtime Contract And Plan Defined

### What Was Built

Sprint 2 delivery artifacts were created under `docs/sprint-02-contract.md` and
`plans/sprint-02-plan.md`. They define the scope, constraints, deliverables,
verification, and execution order for spec/runtime completion work: broader
DashboardSpec coverage, semantic validation, concrete theme definitions,
version-aware save/load scaffolding, and the browser-side SQLite adapter seam.

### Why It Matters

Sprint 1 proved the foundation, but the runtime contracts were still too narrow
for later template, builder, and mock-data work. These artifacts converted that
gap into an explicit governed slice so implementation could move directly into
code without re-deciding what Sprint 2 was supposed to cover.

### How to Verify

```bash
cd /Users/lee/projects/dashForge
sed -n '1,220p' docs/sprint-02-contract.md
sed -n '1,240p' plans/sprint-02-plan.md
```

Confirm both artifacts explicitly cover the remaining spec, validation, theme,
save/load, and SQLite scaffold work and keep the scope bounded to `frontend/`.

## 2026-03-31 — Remaining Foundation Slice Closed Under Governed Workflow

### What Was Built

The remaining Sprint 1 work was collapsed into one governed Agent-Orch workflow
and completed end to end. The foundation runtime resolves sample widget data
from a scenario-backed mock registry through the adapter seam, the ECharts
bundle warning was reduced with lazy-loaded line-chart code splitting, and the
sprint decisions on `react-grid-layout` timing and Python scaffold retirement
were recorded in the durable docs.

### Why It Matters

This closed the gap between "frontend foundation exists" and "the foundation is
governed, reviewable, and handoff-ready." The code path better reflects the
real architecture by proving adapter-backed mock data instead of inline demo
payloads.

### How to Verify

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

Then run a local preview in an environment that permits localhost binding and
confirm the foundation page renders healthcare KPI and line-chart widgets with
scenario-backed data.

## 2026-03-31 — Project Memory Aligned To Canon

### What Was Built

Documentation and planning were refreshed so the repository's working docs match
the current product and architecture decisions instead of the bootstrap
scaffold.

### Why It Matters

The repository now has one consistent story about what DashForge is, where the
canonical implementation lives, and what the next milestone should be.

### How to Verify

1. Read `product-definition.md` and `architecture.md`.
2. Read `project-plan.md`, `sprint-plan.md`, `context.md`, and `WHERE_AM_I.md`.
3. Confirm they describe the same product, stack, and near-term milestone.

## 2026-03-31 — Project Scaffolded

### What Was Built

The repository was initialized with the agent-oriented memory files that drive
the project workflow.

### Why It Matters

Those files created the shared memory needed for governed, multi-session work.

### How to Verify

1. Check the core project docs exist with `ls *.md`.
2. Read `AGENTS.md` and `context.md`.
3. Confirm the repo has session memory and planning structure in place.

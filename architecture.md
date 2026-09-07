# DashForge — Architecture Document
## Technical Architecture for the Anblicks Dashboard Accelerator

**Owner:** Lee (Director, Anblicks)  
**Version:** 1.15  
**Date:** September 6, 2026  
**Companion to:** product-definition.md  
**Revision notes:** v1.15 documents the RBAC Audit Foundation architecture, relational schema
contracts across six canonical datasets, canonical DashboardSpec wiring via DataAdapter runtime
seams, unsuppressed synthetic data disclosures, directional security validation guardrails,
browser smoke gate conformance, and verbatim direct argv CLI execution for the Snowflake RBAC
accelerator (`snowflakeRbac:rbac-audit-foundation`). v1.14 documents the Remediation Artifacts architecture and decision-ready
deliverable pipeline for the Idle Warehouse Waste cost accelerator, detailing prioritized
low-risk recommendation ordering, six-field governance metadata, directional owner validation
guardrails, in-browser same-day follow-up artifact generation, and verified work-package digest
citations. v1.13 documents the Playbook Validation architecture and schema contract formalization
for governed Agent-Orch runs.

---
## Playbook Validation

**Governed Simulation Architecture & Schema Contract Formalization (2026-09-06):**
The `fix-user-simulation-schema` vertical slice formalizes the operational and schema contract governing Agent-Orch playbook quality gates and user journey simulation verification within DashForge. It specifically resolves structural schema validation failures at the `step_08b_user_simulation_gate` stage by establishing strict non-empty `stdout_contains` constraints, key omission protocols when unasserted, verbatim workspace-root execution standards, and complete acceptance check traceability.

### Schema Contracts & Omission Protocol
DashForge defines and enforces canonical JSON schemas (Draft 2020-12) via `src/dashForge/playbook_schema.py`:
- **User Journeys Manifest Schema (`USER_JOURNEYS_MANIFEST_SCHEMA`)**: Governs `journeys/user_journeys_manifest.json`, requiring `journeys` and `command_allowlist`. Each journey enforces valid authorities (`human`, `mission`, `author`, `exploratory`), status (`passed`), sequential natural-language steps, executable commands, and `traces_to` arrays mapping non-exploratory journeys to contract acceptance checks (`AC-1` through `AC-5`).
- **User Journeys Result Schema (`USER_JOURNEYS_RESULT_SCHEMA`)**: Governs `artifacts/user-test/result.json`, requiring `journeys` and `findings`. Each executed command entry in `commands_run` requires `command` and `exit_code`. The `stdout_contains` property enforces `minLength: 1`.

Under the omission protocol, command claims that do not assert standard output substring verification must omit the `stdout_contains` property entirely. Emitting empty strings (`""`), `null`, or whitespace is strictly prohibited and fails schema validation. Helper functions `build_command_claim`, `sanitize_command_claim`, `validate_command_claim`, `build_journey_entry`, and `build_user_journeys_result` in `src/dashForge/playbook_schema.py` enforce this protocol programmatically during simulation reporting.

### Verbatim Workspace-Root Execution & Shell Prohibition
The Agent-Orch orchestrator verifies command claims by re-executing allowlisted argv lists directly from the workspace root using direct subprocess invocation (`shell=False`). Consequently, all journey commands and manifest allowlists must conform to direct argv invocation rules:
- **Application CLI Invocations**: Standardized to `env PYTHONPATH=src python3 -m dashForge.main`. The `env` prefix passes `PYTHONPATH=src` directly into the subprocess environment without requiring shell variable expansion or package installation. Bare variable assignments (`PYTHONPATH=src python3 ...`) fail under direct argv execution and are strictly prohibited.
- **Pytest Test Suite Invocations**: Standardized to `python3 -m pytest tests/ -q` or targeted checks (`python3 -m pytest <test-file> -q -k <test-name>`) with NO `PYTHONPATH` override. The orchestrator re-executes claims within a bounded virtual environment whose own `PYTHONPATH` already provides pytest access; injecting an override masks system packages and causes execution failures.
- **Elimination of Shell Syntax**: Shell pipelines (`|`), boolean chaining (`&&`, `||`, `;`), file redirection (`<`, `>`), and reliance on standalone shell utilities (`jq`, `grep`, `cat`) as sole verification evidence are strictly prohibited. Deep verification of internal data structures, schemas, and file contents is performed via targeted pytest invocations.

### Dual-Tier Quality Gate & Traceability
During governed playbook execution, `step_08b_user_simulation_gate` validates user journey execution across two distinct tiers:
1. **Tier 1 (Structural Conformance)**: Verifies that `artifacts/user-test/result.json` adheres strictly to `USER_JOURNEYS_RESULT_SCHEMA`. Any empty string or whitespace `stdout_contains` triggers immediate validation failure.
2. **Tier 2 (Mechanical Reproduction)**: Subprocess re-execution of allowlisted command claims confirms that reported exit codes match actual return codes and that specified `stdout_contains` substrings reproduce faithfully in actual standard output.

Every non-exploratory user journey maps via `traces_to` to contract acceptance checks (`AC-1` through `AC-5`), ensuring complete requirement coverage with zero unreferenced or dangling check IDs.

---
## Idle Warehouse Dashboard

**Presentation Architecture & Runtime Formalization (2026-09-06):**
The `idle-warehouse-dashboard` vertical slice establishes the buyer-visible frontend presentation layer for the Idle Warehouse Waste cost accelerator in DashForge. It presents actionable cloud data warehouse cost metrics, resource waste patterns, and prioritized, owner-validated recommendations using TVIQ-shaped (Time-to-Value, Impact, Quality) data structures consuming the canonical 7-dataset schema (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`).

### Runtime Seams & DataAdapter Abstraction
The standalone presentation mounts at `/?scenario=idle-warehouse-waste` through `StandaloneDashboardApp.tsx` and resolves verified scenario assets locally via `StaticDataAdapter` and `SyntheticDataArtifactAdapter`, maintaining zero live Snowflake credentials, zero backend servers, and zero external cloud network dependencies. Presentation components consume data strictly through the canonical `DashboardSpec` and `DataAdapter` interfaces without secondary renderers or ad-hoc charting engines.

### Controlled Readiness & Unsuppressed Disclosures
The scenario root container carries `data-scenario="idle-warehouse-waste"` and asserts controlled readiness state (`data-readiness="controlled"`) upon verifying the claim ledger against the verified work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`). Unverified or corrupted digests fail closed to `data-readiness="blocking"` and halt presentation rendering. A persistent disclosure element (`data-disclosure="synthetic-demo-data"`) displaying `"Synthetic demo data"` remains prominent across all dashboard views, print-to-PDF views (`data-testid="dashboard-save-pdf"`), and executive follow-up exports (`data-action="same-day-executive-follow-up"`).

### Prioritized Recommendation Queue & Governance Guardrails
The interactive recommendation queue toggle (`data-action="open-recommendation-queue"`) expands a container with `data-status="recommendation-queue"` rendering prioritized actions. `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) is ordered first, presenting all six governance attributes (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`). Savings are explicitly framed as directional until validated by designated warehouse owners, preventing unauthorized or ungrounded automated changes.

### Browser Smoke Gate & Production Build Integrity
The production build compiled via `npm --prefix frontend run build` generates static assets in `frontend/dist/` conforming to `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`. Compiled production bundles preserve the contract marker strings: `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`. Backend Python packaging, CLI generation commands, and the full regression test suite (`python3 -m pytest tests/ -q` with no `PYTHONPATH` override) pass cleanly with zero regressions.

---
## Remediation Artifacts

**Operational Remediation Architecture & Same-Day Executive Deliverable Pipeline (2026-09-06):**
The `idle-warehouse-remediation-artifacts` vertical slice advances DashForge's Snowflake Cost Management solution (`snowflakeCost:idle-warehouse-waste`) by bridging analytical discovery and concrete operational action. Built upon the foundational relational data layer and the browser-visible presentation tier, this slice delivers prioritized low-risk recommendations and same-day follow-up artifacts for the idle warehouse dashboard. This enables prospective buyers—typically Chief Financial Officers (CFOs), Chief Information Officers (CIOs), VPs of Data and Analytics, or enterprise FinOps leaders—to immediately act on identified compute waste without leaving the application, resolving executive change inertia and eliminating post-workshop communication lag.

### Prioritized Low-Risk Recommendations & Directional Governance
The recommendation engine processes telemetry from the canonical `recommendation_queue` dataset, filtering and sorting recommendations to prioritize minimal-risk operational optimizations. `FINANCE_REPORTING_WH` (`IWW-001`, Priority `P0`, minimal performance risk) is ordered first, followed by secondary warehouse hygiene actions. Every recommendation item enforces and displays all six canonical governance fields:
1. `recommendation_id`: Unique identifier referencing the underlying finding (e.g., `IWW-001`).
2. `executive_severity`: Priority level reflecting operational urgency (`P0`, `P1`, etc.).
3. `suggested_owner`: Designated infrastructure or domain owner responsible for validation.
4. `recommended_action`: Clear, actionable configuration change (e.g., configure auto-suspend to 300 seconds and attach resource monitor).
5. `evidence_detail`: Quantified justification citing scope name, recommendation type, and estimated monthly credit savings.
6. `guardrail`: Explicit operational constraint defining safety bounds and execution prerequisites.

Crucially, the presentation layer explicitly frames all projected credit savings and configuration changes as directional pending validation by designated warehouse owners (`"Recommendations are directional until validated. Require owner validation before changing warehouse availability or suspension policy."`). This directional framing prevents ungrounded or destructive modifications while preserving executive confidence during workshops. The recommendation queue is exposed interactively via `[data-action="open-recommendation-queue"]` (`[data-testid="open-recommendation-queue"]`) with `aria-controls="recommendation-queue"` and `aria-expanded`, expanding container `[data-status="recommendation-queue"]` (`id="recommendation-queue"`, `role="region"`).

### Same-Day Executive Follow-Up Deliverable Pipeline
To eliminate post-meeting friction where consultants traditionally spend hours or days compiling notes and drafting follow-up deliverables outside the presentation tool, the application embeds an interactive same-day artifact generator directly into the dashboard interface:
- **Interactive Action Seam**: Triggered via `data-action="same-day-executive-follow-up"` (`data-testid="same-day-executive-follow-up"`), updating DOM status to `data-status="executive-follow-up"` with the label `"Follow-up artifact is ready"`.
- **Decision-Ready Payload Structure**: Formulated client-side via `buildExecutiveFollowUpHtml` in `StandaloneDashboardApp.tsx` and mirrored in backend Python utilities via `build_same_day_follow_up_artifact` and `render_executive_follow_up_html` in `src/dashForge/remediation_artifacts.py`.
- **Headline Financial Metrics**: Encapsulates the verified headline opportunity (**726 compute credits/month**), idle warehouse count requiring review (**2 unmonitored warehouses**), and dominant credit concentration (**FINANCE_REPORTING_WH accounts for >50% of warehouse compute credits**).
- **Prioritized Actions & Owner Assignments**: Lists low-risk recommendations ordered with `P0` first, pairing each action with its suggested owner, protective guardrail, and dataset observation claim citation.
- **Verifiable Claim Citations**: Every finding and recommendation cites the upstream cryptographic work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`) and specific dataset observation coordinates (e.g., `dataset observation recommendation_queue/IWW-001`).
- **Real-Client Mode Disabled Guard**: Explicitly includes the protective declaration: `"Real/client mode remains disabled until approved metadata or exports exist."`

### Persistent Synthetic Disclosures & Controlled Quality Gating
To prevent synthetic workshop demonstration figures from ever being misrepresented as audited customer production telemetry:
- **Unsuppressed Disclosure Badges**: A persistent DOM element `data-disclosure="synthetic-demo-data"` displaying the exact text `"Synthetic demo data"` is prominently rendered across all presentation surfaces, header badges (`data-provenance="synthetic-demo-data"`), quality cards (`data-testid="synthetic-quality-disclosure"`), generated follow-up HTML deliverables, and landscape print-to-PDF views (`data-testid="dashboard-save-pdf"` via `exportDashboardArtifact`).
- **Controlled Quality State Verification**: The presentation container mounts with `data-scenario="idle-warehouse-waste"` and establishes `data-readiness="controlled"` only after validating the claim ledger against the verified work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`). Any unverified, missing, or mismatched digest triggers immediate fail-closed blocking status (`data-readiness="blocking"`), withholding the dashboard view.

### Browser Smoke Gate Conformance & Production Assets
The frontend production build compiled via `npm --prefix frontend run build` outputs optimized static assets in `frontend/dist/` with zero TypeScript compilation errors, strictly adhering to the automated browser smoke gate (`tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`):
- **Contract Marker Preservation**: Compiled JavaScript bundles under `frontend/dist/assets/*.js` preserve all four immutable contract markers: `"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`.
- **Smoke Check Conformance**: The served bundle at `http://127.0.0.1:4173/?scenario=idle-warehouse-waste` matches the ready selector `[data-scenario='idle-warehouse-waste'][data-readiness='controlled'] [data-disclosure='synthetic-demo-data']`, verifies `#root` mounting, executes the click action on `[data-action='open-recommendation-queue']`, and confirms the success container `[data-status='recommendation-queue']` containing `"FINANCE_REPORTING_WH"`.
- **Zero Live Credentials**: The application interface strictly avoids credential input fields (`password`, `account_identifier`, `private_key`) and sets `data-mode="real-client-disabled"`.

### Verbatim Direct Argv Execution & Deterministic Backend Packaging
All verification commands, test assertions, and CLI workflows declared in `journeys/user_journeys_manifest.json` execute verbatim from the workspace root using direct subprocess invocation (`shell=False`):
- **Standardized Application CLI Prefix**: Commands use the exact direct argv form `env PYTHONPATH=src python3 -m dashForge.main generate ...` to pass environment variables without shell variable expansion.
- **Standardized Pytest Invocation**: Python tests execute via `python3 -m pytest tests/ -q` or targeted module paths with NO `PYTHONPATH` override, preserving virtual environment packaging.
- **Shell Construct Prohibition**: All shell pipelines (`|`), boolean operators (`&&`, `||`, `;`), file redirection (`<`, `>`), and standalone shell tools (`jq`, `grep`, `cat`) are eliminated from verification journeys.
- **Deterministic Multi-Table Generation**: CLI generation deterministically materializes all seven relational tables (`executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, `recommendation_queue`) in SQLite and JSON snapshots.
- **Fail-Closed Overwrite Protection**: Target paths are inspected prior to generation; existing destinations abort with exit code 2 and actionable diagnostics unless `--force` is explicitly supplied.
- **Sibling Isolation & Multi-Pack Compatibility**: Sibling repository `dataForge` remains strictly read-only and unmodified, and existing industry packs (`healthcare:flu-season`, `financial:market-downturn`, `saas:churn-crisis`) continue generating with zero regressions.

---
## RBAC Audit Foundation

**Foundational Synthetic RBAC Telemetry & Access Governance Architecture (2026-09-06):**
The `synthetic-rbac-audit-foundation` vertical slice establishes the foundational synthetic data models and dashboard specification for the RBAC (Role-Based Access Control) management accelerator in DashForge (`snowflakeRbac:rbac-audit-foundation`). Designed to power high-impact executive discovery workshops for Anblicks cybersecurity architects, client delivery leads, and data governance consultants, this slice breaks the traditional pre-sales deadlock where prospective enterprise buyers—such as CISOs, Cloud Security Architects, and Snowflake Administrators—struggle with opaque role hierarchies, unmonitored privilege escalation, and dormant administrative accounts, but cannot furnish live production cloud credentials due to infosec, SOC 2, HIPAA, or GDPR compliance constraints. By delivering realistic, relational synthetic access control telemetry and an interactive dashboard specification that operates completely offline and client-side, DashForge enables consulting teams to present authoritative governance insights with zero external network connectivity, zero live credentials, and zero runtime dependencies.

### Foundational Relational Schemas Across Six Canonical Datasets
The slice defines and enforces canonical relational schema contracts across six core datasets mirroring Snowflake security audit telemetry (`SNOWFLAKE.ACCOUNT_USAGE`):
1. **`rbac_summary`**: Headline access control posture metrics:
   - `summary_id` (string, id, primary key): Unique summary record identifier.
   - `total_roles` (number, measure): Total count of distinct roles defined across the tenant.
   - `active_users` (number, measure): Total active human and service account identities.
   - `elevated_admin_accounts` (number, measure): Count of accounts possessing `ACCOUNTADMIN` or `SECURITYADMIN` entitlements.
   - `critical_risk_findings` (number, measure): Quantified count of critical access control and privilege risks (`P0`/`P1`).
   - `synthetic_seed` (number, dimension): Deterministic seed used for repeatable generation.
   - `evaluation_timestamp` (date, date): ISO-8601 evaluation snapshot timestamp.
2. **`roles`**: Detailed role metadata and ownership:
   - `role_name` (string, id, primary key): Unique role identifier (e.g., `ACCOUNTADMIN`, `SECURITYADMIN`, `SYSADMIN`, `DATA_ENGINEER`).
   - `role_type` (string, dimension): Role classification (`SYSTEM`, `FUNCTIONAL`, `ACCESS`).
   - `role_owner` (string, dimension): Controlling role responsible for administering the role.
   - `comment` (string, dimension): Administrative commentary detailing role purpose.
   - `created_on` (date, date): Role creation timestamp.
3. **`role_hierarchy`**: Directed role inheritance relationships:
   - `link_id` (string, id, primary key): Unique relationship identifier.
   - `parent_role` (string, dimension): Granted/inherited parent role.
   - `child_role` (string, dimension): Grantee child role receiving inherited permissions.
   - `tree_depth` (number, measure): Topological nesting depth from root.
   - `granted_by` (string, dimension): Authorizing role granting inheritance.
   - `grant_date` (date, date): ISO-8601 timestamp of role grant.
4. **`user_role_assignments`**: User identity entitlement mappings:
   - `assignment_id` (string, id, primary key): Unique assignment record identifier.
   - `user_name` (string, dimension): User principal identity.
   - `role_name` (string, dimension): Assigned Snowflake role.
   - `grant_type` (string, dimension): Entitlement assignment mechanism (`DIRECT` vs. `INHERITED`).
   - `mfa_enabled` (boolean, dimension): Multi-factor authentication compliance indicator.
   - `account_status` (string, dimension): Account activity state (`ACTIVE`, `DORMANT`, `SUSPENDED`).
   - `last_login` (date, date): Last recorded authentication timestamp.
5. **`object_grants`**: Securable object access permissions:
   - `grant_id` (string, id, primary key): Unique grant identifier.
   - `grantee_role` (string, dimension): Role holding the privilege grant.
   - `securable_type` (string, dimension): Object class (`WAREHOUSE`, `DATABASE`, `SCHEMA`, `TABLE`).
   - `securable_name` (string, dimension): Fully qualified securable object name.
   - `privilege` (string, dimension): Specific entitlement (`USAGE`, `SELECT`, `MODIFY`, `OPERATE`).
   - `is_grantable` (boolean, dimension): Indicates whether the privilege can be delegated.
6. **`governance_findings`**: Audited security findings preserving all six canonical governance fields:
   - `finding_id` (string, id, primary key): Unique tracking identifier (e.g., `RBAC-001`).
   - `executive_severity` (string, dimension): Urgency classification (`P0`, `P1`, `P2`).
   - `suggested_owner` (string, dimension): Designated administrative owner responsible for remediation.
   - `recommended_action` (string, dimension): Concrete remediation instruction.
   - `risk_detail` (string, dimension): Technical and organizational risk explanation.
   - `guardrail` (string, dimension): Protective operational boundary and confirmation requirement.

The generator and verification interfaces are implemented in `src/dashForge/rbac_audit.py`, providing `get_snowflake_rbac_scenarios()`, `validate_snowflake_rbac_scenario()`, `enrich_snowflake_rbac_provenance()`, `validate_governance_findings_schema()`, and `generate_snowflake_rbac_database()`. The pipeline produces deterministic SQLite databases and canonical `SQLiteSnapshot` JSON representations matching `frontend/src/core/data/sqliteSnapshot.ts`.

### Canonical DashboardSpec & Runtime DataAdapter Seams
In strict accordance with DashForge Principle 3 (**Components never know where data comes from**), the presentation layer queries data exclusively through canonical `DataAdapter` interfaces without secondary renderers, backend daemons, or ad-hoc charting engines:
- **Scenario Registration & Routing**: Registered under template `tpl.snowflakeRbac.rbac-audit-foundation` and scenario `snowflakeRbac:rbac-audit-foundation`, mounting at `/?scenario=rbac-audit-foundation` with DOM scenario marker `data-scenario="rbac-audit-foundation"`.
- **Decoupled Data Routing**: Standalone presentation views resolve scenario data through `createDashboardDataAdapter` via `StaticDataAdapter` or `SyntheticDataArtifactAdapter`, executing `query()`, `aggregate()`, and `getSchema()` calls directly against the six in-memory datasets.
- **Presentation Widgets & Contract Markers**:
  - **KPI Scorecards**: Headline access metrics for Total Roles, Active Users, Elevated Admins, and Critical Findings.
  - **Role Hierarchy Tree Visualization**: Interactive node-link role graph carrying DOM marker `data-testid="role-hierarchy-tree"`.
  - **User Access Audit Matrix**: Entitlement matrix mapping direct and inherited roles carrying DOM marker `data-testid="user-access-matrix"`.
  - **Prioritized Governance Findings Queue**: Prioritized audit findings queue carrying DOM markers `data-status="governance-findings"` and `data-testid="governance-findings"`.

### Persistent Synthetic Disclosures & Directional Security Guardrails
To guarantee that prospective buyers and executive workshop participants never mistake synthetic demonstration data for audited live client production telemetry:
- **Unsuppressed Disclosure Badges**: A persistent DOM element `data-disclosure="synthetic-demo-data"` displaying the exact text `"Synthetic demo data"` is prominently rendered across all presentation surfaces, header badges, and export views.
- **Upstream Provenance Metadata**: Scenario snapshots and presentation headers record full provenance metadata (`packId: "snowflakeRbac"`, `scenarioId: "rbac-audit-foundation"`, `seed: 42`, `synthetic: true`, `dataForgeStoryContractPath: "stories/snowflake/rbac-audit-foundation.md"`, and ISO-8601 timestamps).
- **Directional Security Validation Guardrails**: All role revocations, inheritance pruning, and privilege modifications are explicitly framed as directional pending validation and confirmation by designated security administrators. The interface enforces clear warning notices (e.g., `"Require security administrator confirmation before revoking direct administrative entitlements"`), and automated or destructive mutation APIs are strictly prohibited.

### Browser Smoke Gate Conformance & Production Assets
The frontend production build compiled via `npm --prefix frontend run build` outputs optimized static assets in `frontend/dist/` with zero TypeScript compilation errors, strictly adhering to automated browser smoke gate criteria:
- **Contract Marker Preservation**: Compiled JavaScript bundles under `frontend/dist/assets/*.js` preserve all four immutable contract markers:
  1. `"rbac-audit-foundation"`
  2. `"synthetic-demo-data"`
  3. `"role-hierarchy-tree"`
  4. `"governance-findings"`
- **Root DOM Mount Verification**: `frontend/dist/index.html` preserves `<div id="root"></div>`.
- **Zero Live Credentials & Cloud Isolation**: The application interface strictly avoids credential input fields (`password`, `account_identifier`, `private_key`) and external network endpoints (`requests.post`, `urllib.request.urlopen`, `snowflake.connector`), setting `data-mode="real-client-disabled"`.

### Verbatim Direct Argv Execution & Multi-Pack Architecture Preservation
All operational commands, verification checks, and automated regression suites declared in `journeys/user_journeys_manifest.json` execute verbatim from the workspace root using direct subprocess invocation (`shell=False`):
- **Standardized Application CLI Prefix**: Direct argv invocations enforce `env PYTHONPATH=src python3 -m dashForge.main generate ...` to inject `PYTHONPATH=src` without relying on shell variable expansion.
- **Standardized Pytest Invocation**: Python tests execute via `python3 -m pytest tests/ -q` or targeted module paths with NO `PYTHONPATH` override, preserving virtual environment packaging.
- **Browser Testing Prefix**: Frontend tests execute via `npm --prefix frontend test -- --run`.
- **Prohibition of Shell Operators**: Journey commands strictly avoid shell operators (`|`, `&&`, `||`, `;`, `<`, `>`) and standalone shell utilities (`jq`, `grep`, `cat`) as sole verification evidence.
- **Preservation of Existing Packs & Sibling Isolation**: Sibling repository `dataForge` remains strictly read-only and unmodified. Existing industry packs (`healthcare:flu-season`, `financial:market-downturn`, `saas:churn-crisis`, and `snowflakeCost:idle-warehouse-waste`) remain fully intact with bit-for-bit reproducible generation, and fail-closed overwrite guards (`--force`) abort collisions with exit code 2.

---
## 2026-09-06 — Synthetic RBAC Audit Foundation relational schemas and access governance architecture

**Decision:** DashForge formalizes the foundational synthetic data models, relational schema contracts, and dashboard specification for the RBAC management accelerator (`snowflakeRbac:rbac-audit-foundation`), enabling consulting teams to demonstrate authoritative cloud access governance insights completely offline without live credentials.

**Contract:**
- **Six Canonical Datasets**: The slice defines and enforces typed relational schemas across
  `rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, and
  `governance_findings`, matching `frontend/src/core/data/sqliteSnapshot.ts` without live Snowflake dependencies.
- **Canonical DashboardSpec & DataAdapter Wiring**: Standardized JSON dashboard specification declaring
  KPI scorecards, interactive role hierarchy tree (`role-hierarchy-tree`), user access audit matrix
  (`user-access-matrix`), and prioritized governance findings queue (`governance-findings`), binding
  cleanly through canonical `DataAdapter` runtime interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`,
  `SQLiteDataAdapter`).
- **Persistent Disclosures & Directional Security Guardrails**: Unsuppressed `data-disclosure="synthetic-demo-data"`
  badges with exact text `"Synthetic demo data"`, complete upstream provenance metadata, and explicit
  directional security validation guardrails requiring designated administrator confirmation before revoking entitlements.
- **Browser Smoke Gate Conformance**: Production bundles compiled via `npm --prefix frontend run build` preserve
  all four contract markers (`"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`,
  `"governance-findings"`) with zero live credentials (`data-mode="real-client-disabled"`).
- **Verbatim Workspace-Root Direct Argv Execution**: All operational and verification commands execute verbatim
  from workspace root via direct subprocess invocation (`shell=False`) using allowlisted prefixes without shell operators.
- **Zero Regressions & Sibling Isolation**: Existing packs (`healthcare`, `financial`, `saas`, `snowflakeCost`)
  remain intact, fail-closed overwrite protection is preserved, and sibling project `dataForge` remains strictly read-only.

**Consequences:** Enterprise consulting teams can conduct high-impact RBAC governance workshops for prospective
buyers without requiring live cloud credentials or external network connectivity, demonstrating concrete access risk
remediation while maintaining synthetic transparency and operational safety.

---
## 2026-09-06 — Idle warehouse remediation artifacts and decision-ready executive deliverables

**Decision:** DashForge formalizes the remediation artifacts architecture and decision-ready
deliverable pipeline for the Idle Warehouse Waste cost accelerator (`snowflakeCost:idle-warehouse-waste`),
bridging analytical discovery and concrete operational action.

**Contract:**
- **Prioritized Low-Risk Recommendations**: Recommendations process the canonical
  `recommendation_queue` dataset, ordering `FINANCE_REPORTING_WH` (`IWW-001`, `P0`) first.
  All six governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`,
  `recommended_action`, `evidence_detail`, `guardrail`) are rendered.
- **Directional Owner-Validation Guardrails**: Projected savings and configuration actions
  are explicitly framed as directional pending validation by designated warehouse owners,
  preventing unauthorized changes.
- **Same-Day Executive Follow-Up Deliverables**: Embedded in-browser follow-up generator
  (`data-action="same-day-executive-follow-up"`) captures headline metrics (726 monthly compute credits,
  2 idle warehouses, dominant credit concentration), upstream digest citation
  (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`), observation citations,
  and explicit notice that real/client mode remains disabled.
- **Persistent Synthetic Disclosures & Controlled Quality**: Persistent `data-disclosure="synthetic-demo-data"`
  elements remain prominent across all views, and the container mounts with `data-readiness="controlled"`
  anchored to the verified work package digest.
- **Verbatim Workspace-Root Execution & Sibling Isolation**: Direct argv execution from workspace
  root without shell operators; sibling repository `dataForge` remains strictly read-only and unmodified.

**Consequences:** Prospective buyers and consultants can immediately generate decision-ready
executive follow-up deliverables during discovery workshops with zero cloud credentials, zero external
dependencies, and zero post-meeting delay.

---
## 2026-09-06 — User journey simulation schema formalization and omission protocol

**Decision:** DashForge formalizes canonical JSON schemas (`USER_JOURNEYS_MANIFEST_SCHEMA`
and `USER_JOURNEYS_RESULT_SCHEMA`) and verification utilities in `src/dashForge/playbook_schema.py`
to govern Agent-Orch playbook quality gates and user journey simulation verification,
preventing schema validation failures caused by empty `stdout_contains` fields.

**Contract:**
- **Non-Empty `stdout_contains` & Key Omission Protocol**: Command claims in simulation results
  must omit the `stdout_contains` property entirely when no standard output substring assertion
  is required. When present, `stdout_contains` enforces `minLength: 1`. Empty string (`""`), `null`,
  or whitespace values violate the schema and are rejected.
- **Manifest Governance & Acceptance Check Traceability**: `journeys/user_journeys_manifest.json`
  strictly adheres to `USER_JOURNEYS_MANIFEST_SCHEMA`, enforcing valid authorities
  (`human`, `mission`, `author`, `exploratory`), status (`passed`), and `traces_to` arrays
  covering contract checks `AC-1` through `AC-5` without unreferenced or dangling IDs.
- **Verbatim Workspace-Root Argv Execution**: All journey commands and manifest allowlists must
  execute verbatim from the workspace root (`shell=False`). Application CLI commands use
  `env PYTHONPATH=src python3 -m dashForge.main`, while pytest commands use `python3 -m pytest`
  with no `PYTHONPATH` override. Shell pipelines (`|`), boolean chaining (`&&`, `||`, `;`),
  redirection (`<`, `>`), and standalone shell utilities (`jq`, `grep`, `cat`) are prohibited.
- **Zero Regressions & Pipeline Preservation**: Sibling project `dataForge` remains strictly
  unmodified, and existing packs (`healthcare`, `financial`, `saas`, `snowflakeCost`) remain
  fully functional with bit-for-bit reproducible generation.

**Consequences:** Governed Agent-Orch runs at `step_08b_user_simulation_gate` validate cleanly
without false negatives caused by empty stdout assertions, ensuring reliable, reproducible
user journey verification across all future playbook steps.

---
## 2026-09-02 — Idle Warehouse Waste vertical slice formalization and governance

**Decision:** DashForge formalizes the `idle-warehouse-waste` vertical slice under
the `snowflakeCost` pack, establishing canonical 7-dataset snapshot schemas,
provenance metadata enrichment, recommendation queue governance, and
`DataAdapter` query routing for standalone executive cost optimization presentations.

**Contract:**
- **Seven Canonical Datasets**: The slice requires and produces seven datasets:
  `executive_summary`, `warehouse_metering_history`, `query_history`,
  `metering_history`, `database_storage_usage_history`, `show_warehouses`, and
  `recommendation_queue`. Each dataset defines typed columns (`string`, `number`,
  `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`).
- **Recommendation Queue Governance**: The `recommendation_queue` table enforces
  governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`,
  `recommended_action`, `evidence_detail`, `guardrail`) and safety guardrails,
  enabling actionable executive recommendations without ungrounded automated changes.
- **Provenance & Synthetic Disclosures**: Generated snapshots include provenance
  tracking (`packId`: `snowflakeCost`, `scenarioId`: `idle-warehouse-waste`,
  `seed`, `dataForgeStoryContractPath`: `stories/snowflake/idle-warehouse-waste.md`,
  `generatorVersion`, `generationTimestamp`, `synthetic: true`, and disclosure
  `"Synthetic demo data"`).
- **DataAdapter Query Routing**: The shared `DataAdapter` provides seamless
  querying, aggregation, and schema inspection across all seven datasets for
  both runtime widgets and standalone executive dashboard views.
- **Fail-Closed Overwrite & Zero External Dependencies**: Preserves fail-closed
  overwrite protection requiring `--force` and maintains zero external runtime
  dependencies with sibling project `dataForge` remaining untouched.

**Consequences:** Anblicks consultants can present an end-to-end, believable
Snowflake cost optimization narrative for idle warehouse waste during client
workshops completely offline, demonstrating clear financial impact and governed
recommendations with bit-for-bit reproducibility.

---
## 2026-09-02 — Snowflake Cost Pack integration and dynamic scenario discovery

**Decision:** DashForge integrates the `snowflakeCost` optimization pack via
`src/dashForge/snowflake_cost.py`, extending `dashForge.main generate`,
`dashForge.generate`, and `dashForge.package_snapshot` to support dynamic
scenario discovery, deterministic snapshot export, and recommendation queue
preservation without modifying sibling project `dataForge`.

**Contract:**
- **Dynamic Scenario Enumeration**: Discovers available scenarios directly
  from `dataForge` (`idle-warehouse-waste`, `bi-over-provisioning`,
  `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`,
  `finops-maturity-assessment`) without hardcoding lists in DashForge source code.
  Unknown scenario identifiers fail closed with exit status 2.
- **Fail-Closed Argument Validation & Overwrite Guard**: Missing required options,
  invalid packs, or existing destination paths without `--force` abort with exit
  status 2 and clean diagnostics via `parser.error()`.
- **Canonical Snapshot Conformance**: Snapshot exports adhere strictly to the
  canonical `SQLiteSnapshot` TypeScript contract in
  `frontend/src/core/data/sqliteSnapshot.ts`. No secondary format is introduced.
- **Provenance & Synthetic Disclosure**: Enriched metadata embedded in snapshot
  exports records `packId` (`snowflakeCost`), `scenarioId`, `seed`,
  `dataForgeStoryContractPath`, generator version, ISO-8601 timestamp,
  `synthetic: true`, and disclosure text `"Synthetic demo data"`.
- **Recommendation Queue Preservation**: The `recommendation_queue` table
  preserves all columns (`recommendation_id`, `executive_severity`,
  `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`)
  intact to power downstream dashboard recommendation views.
- **Zero External Runtime Dependencies**: Uses Python standard library only.
  Sibling repository `dataForge` remains strictly read-only.

**Consequences:** DashForge consultants and operators can generate client-ready
Snowflake cost optimization SQLite databases and JSON snapshots for offline
executive discovery workshops with zero external dependencies, live credentials,
or unhandled tracebacks.

## 2026-09-02 — Deterministic DataForge snapshot packaging and fail-closed CLI

**Decision:** The `package-dataforge-snapshot` slice establishes a formal CLI
bridge (`src/dashForge/main.py`) and snapshot packaging utility
(`src/dashForge/package_snapshot.py`) to generate bounded SQLite databases and
extract portable `SQLiteSnapshot` JSON files for DashForge's client-side runtime.

**Contract:**
- **CLI Interface**: `python3 -m dashForge.main generate` accepts `--pack`
  (`healthcare`, `financial`, `saas`), `--scenario` (required), `--seed`
  (deterministic integer), `--output` (required SQLite path),
  `--snapshot-output` (optional JSON snapshot path), and `--force`.
- **Fail-Closed Overwrite Guard**: The CLI evaluates whether target output paths
  exist before execution begins. If `--output` or `--snapshot-output` exists
  and `--force` is not specified, execution aborts with exit status 2 and an
  informative diagnostic error, preventing accidental loss of prepared workshop
  data.
- **Snapshot Schema Conformance**: `package_snapshot.py` inspects SQLite tables
  via `PRAGMA table_info`, infers column types (`string`, `number`, `date`,
  `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`), and
  exports JSON matching the TypeScript `SQLiteSnapshot` type in
  `frontend/src/core/data/sqliteSnapshot.ts`.
- **Zero Runtime Dependencies**: The packaging pipeline relies exclusively on
  the Python standard library (`argparse`, `sqlite3`, `json`, `pathlib`).
- **Graceful Error Handling**: Input validation and generation errors
  (`ValueError`, `KeyError`, `FileExistsError`) are caught and routed to
  `parser.error()`, preventing unhandled tracebacks in front of executive
  audiences.

**Consequences:** DashForge can generate and package multi-pack scenario data
into portable snapshot artifacts for zero-network, offline executive workshop
demonstrations without external database dependencies or risk of unhandled
tracebacks.

## 2026-08-10 — Field-service showcase is the presentation default

**Decision:** `frontend/src/App.tsx` now opens
`fieldService:first-heat-wave-parts-bottleneck` through
`tpl.fieldService.first-heat-wave-command`. The closed canonical MVP proof
remains `healthcare:ed-throughput-crunch`; this change demonstrates reusable
composition rather than redefining that governed closeout.

**Contract:** DataForge owns the deterministic pack, strict scenario, governed
story, quality report, and work-package digest. DashForge keeps a pinned local
fixture of that artifact, validates it through
`SyntheticDataArtifactAdapter`, binds five datasets through the existing
`DashboardSpec`/`DataAdapter` path, and renders five comparison KPIs plus three
story-ordered charts. Every material KPI, caption, and narrative statement is
covered by the dashboard claim ledger.

**Consequences:** No second renderer, orchestration layer, live connector, or
client-data path was added. The default view is meeting-ready and clearly
labels the fictional Apex Climate Services data as synthetic. Builder mode
opens only on demand and receives the same validated field-service draft.


## 2026-08-09 — Client Meeting Dashboard Builder employee boundary

**Decision:** DashForge's product employee is
`ClientMeetingDashboardBuilder`. It consumes a platform-received
`synthetic-data-work-package/1.0` and produces a
`meeting-dashboard-package/1.0`; it does not import DataForge source fixtures
or create a second orchestration framework.

**Inputs and gates:** The trusted receipt must bind the upstream run,
employee/tenant/pursuit, artifact type/schema, and digest. DashForge then
validates the scenario, quality report, reproduction manifest, dataset
bindings, audience, decision context, and material claim sources. Blocking
quality or unsupported/uncited claims are refusals, not warnings.

**Domain ownership:** `DashboardSpec`, data adapters, layout/visual decisions,
rendering, export, claim ledger, and meeting narrative remain DashForge
responsibilities. `dataForge` owns scenario generation and quality inspection.
Agent-Orch owns run isolation, worker routing, receipt materialization,
reviewer separation, retry/failure policy, and evidence-chain verification.
The Factory owns deployment records and commissioning; Agent Board owns the
shared pursuit projection.

**Deterministic versus model work:** artifact validation, dataset binding,
claim-source coverage, rendering, export, and evidence assembly are
deterministic. A future model may propose a manifest or narrative only behind
the employee's declared provider-independent route and the same deterministic
validation gates; this slice does not make a live model or Snowflake call.

**Result contract:** the package retains the upstream artifact digest,
dashboard spec, binding map, claim ledger, rendered HTML, browser-smoke
evidence, assumptions, confidence, and synthetic-data disclosure. It is
approval-ready, not automatically approved or submitted.


## 2026-04-03 — Mock-Data Generation Ownership Moved To dataForge

**Decision:** DashForge no longer treats in-repo Python generation code as a
primary product surface. Deterministic mock-data generation now lives in
sibling project `/Users/lee/projects/dataForge`, while dashForge keeps only
thin compatibility wrappers for historical CLI and test entrypoints.

**Rationale:** The workspace now has two distinct concerns: generating bounded
scenario data and rendering/authoring dashboard experiences. Separating the
generator into `dataForge` clarifies ownership, reduces future coupling, and
lets dashForge stay centered on `DashboardSpec`, `DataAdapter`, and the
standalone dashboard/runtime story.

**Alternatives rejected:** Keeping generator implementation as a first-class
DashForge surface would continue the repo-boundary ambiguity. Removing the old
entrypoints immediately would create more migration friction than value while
historical workflows still reference them.

**Consequences:** DashForge still consumes generated SQLite/JSON artifacts and
may temporarily expose compatibility wrappers, but new generator changes should
land in `dataForge` first. Canon docs in this repo must describe generation as
a sibling-project concern rather than a core in-repo implementation slice.

## 2026-04-02 — Canonical MVP Is A Scenario Package Plus Standalone Dashboard Deliverable

**Decision:** The repo canon now defines the MVP as one bounded flow:
scenario definition, data generation, runtime registration, and a standalone
dashboard deliverable. Builder, presenter, AI authoring, and live-binding
surfaces remain important product capabilities, but they are no longer the
definition of the MVP success bar.

**Rationale:** The codebase already contains more surface area than the first
proof of value requires. Without an explicit canonical statement, future
operators could treat builder breadth or post-MVP runtime features as the MVP
itself and start making scope decisions against the wrong target.

**Alternatives rejected:** Treating the builder shell as the MVP would keep the
first client experience anchored to authoring chrome. Treating the entire
Sprint 1-9 feature set as the MVP would blur the difference between the first
deliverable and later operator accelerators.

**Consequences:** The product story is now sharper. Scenario contracts,
generated SQLite/JSON artifacts, runtime registration, and the standalone app
entry are the canonical MVP proof. More advanced surfaces must be described as
supporting or post-MVP capabilities layered on the same runtime.

---

## 2026-04-02 — Standalone MVP Entry Uses The Existing Runtime Contracts

**Decision:** `frontend/src/App.tsx` now defaults to a dedicated standalone
runtime (`frontend/src/features/runtime/StandaloneDashboardApp.tsx`) for the
registered ED throughput command view instead of mounting `BuilderShell`
directly on first load.

**Rationale:** The clarified MVP is a believable, free-standing dashboard
experience backed by generated scenario data, not a builder-first shell. The
repo already had the right scenario, template, and adapter contracts in place;
the missing proof was making that scenario dashboard the primary app surface.

**Alternatives rejected:** Reusing the builder shell as the default wrapper
would have kept the MVP visually anchored to authoring chrome. Hard-coding a
separate standalone widget path would have fragmented the runtime and bypassed
the current `DashboardSpec` + `DataAdapter` seams.

**Consequences:** The default app path now instantiates the registered
`healthcare:ed-throughput-crunch` starter through the existing template/runtime
contracts, while builder mode remains available only after explicit user action
and continues to operate on the same starter draft when opened from the app
surface.

---

## 2026-04-02 — ED Throughput Scenario Is App-Visible Through Registered Starter Contracts

**Decision:** The ED throughput crunch scenario is now treated as a runtime-visible scenario with a dedicated starter template (`tpl.healthcare.ed-throughput-command`) and scenario-specific blueprint (`ed-throughput-command`) so it can be instantiated from the in-app starter flow and bound to the existing `monthly_metrics` dataset contract.

**Rationale:** The demo package had previously existed as external scenario artifacts (`scenarios/healthcare/ed-throughput-crunch-*`) plus a materialization workflow. Registering it in the runtime scenario/template catalogs turns that package into the same governed in-app assembly path used by other templates and prevents a separate ad hoc "demo code path."

**Alternatives rejected:** Keeping the scenario as disconnected package artifacts only, which would have left operators with two parallel assembly methods and no single place for contract checks.

**Consequences:** The product now has one bounded end-to-end path for this scenario type: package source + contract + runtime registration + template blueprint. Future packaged demos can follow the same pattern without introducing a new rendering mode.

---

## 2026-04-01 — Sprint 9 Adapter Resolution Stays Behind One Factory

**Decision:** Sprint 9 resolves production binding through one central
`createDashboardDataAdapter(...)` seam that returns a single `DataAdapter` for
`mock`, `live`, and `hybrid` dashboards instead of letting builder, renderer,
or presenter code branch on data mode directly.

**Rationale:** The product already proved through earlier sprints that the
shared renderer path is the durable asset. Production binding only stays
bounded if live/hybrid behavior remains behind the existing adapter contract
rather than leaking mode-specific logic into view code.

**Alternatives rejected:** Letting `BuilderShell`, `DashboardRenderer`, or
individual widgets special-case live mode would have been faster locally but
would fragment the runtime and reopen the core architectural seam this sprint
was supposed to harden.

**Consequences:** The repo now has explicit adapter-factory and hybrid-routing
helpers under `frontend/src/core/data/`. Future live adapters can join the same
factory without changing widget components or introducing a second rendering
path.

---

## 2026-04-01 — Serialized Specs Strip Live Header Overrides

**Decision:** Serialized `DashboardSpec` artifacts omit
`dataContext.live.bindings.*.connection.headers` before export or storage.

**Rationale:** Sprint 9 needed live-binding metadata to round-trip, but durable
product artifacts still need to be safe by default. Stripping header overrides
keeps endpoint/type/field-map metadata portable without treating spec JSON as a
credential store.

**Alternatives rejected:** Persisting headers directly would have made spec
artifacts unsafe. Removing the entire live-binding block would have defeated
the bounded production-binding goal by making imports/exports lose the actual
binding setup.

**Consequences:** Live and hybrid specs can still be imported/exported, but any
local-only credential overrides must be re-applied outside serialized
DashboardSpec output.

---

## 2026-03-31 — Transitional Repo Layout for Phase 1

**Decision:** The first React/Vite/TypeScript implementation lives in `/frontend` alongside the legacy Python bootstrap files.

**Rationale:** This keeps Sprint 1 focused on proving the canonical runtime architecture instead of spending the first implementation slice on destructive repo reshaping. It also preserves the scaffold history while the new product path becomes real.

**Alternatives rejected:** Replacing the repo root immediately would create more churn than value in the first slice. Keeping implementation in the Python scaffold would conflict with the canon architecture.

**Consequences:** The repository has a temporary dual structure. Once the frontend runtime is established enough to carry the project, the Python scaffold can be retired or isolated more aggressively.

---

## 2026-03-31 — Mock Scenario Registry for Foundation Data

**Decision:** Sprint 1 foundation widgets resolve sample data through scenario-backed mock references and the `DataAdapter` seam rather than embedding inline-only payloads inside the sample dashboard.

**Rationale:** This proves the architectural boundary that matters for DashForge: widgets consume data through a stable contract while the underlying source can evolve from static scenarios to SQLite and later live bindings. It also makes the sample dashboard feel closer to an industry scenario instead of a hard-coded demo.

**Alternatives rejected:** Keeping inline payloads longer would make the foundation look simpler than the real product and would delay validation of the adapter contract. Jumping directly to SQLite in Sprint 1 would have expanded the slice beyond the intended proof-of-architecture scope.

**Consequences:** The runtime now has a scenario catalog and mock references that can be swapped for richer storage later without changing widget components. SQLite remains the Phase 2 destination, not a prerequisite for calling Sprint 1 complete.

---

## 2026-03-31 — Layout Engine Deferred Until Builder Mode

**Decision:** `react-grid-layout` is deferred until the first slice that actually needs composition, drag/drop, resize, and responsive layout editing.

**Rationale:** Sprint 1 needed to prove spec-driven rendering, widget registration, and adapter isolation. The current CSS-grid shell is sufficient for that proof. Bringing in `react-grid-layout` before builder behavior exists would add dependency and layout complexity without unlocking new product value.

**Alternatives rejected:** Adopting `react-grid-layout` immediately would have front-loaded builder concerns into a foundation sprint whose job was runtime validation, not composition UX.

**Consequences:** The architecture still endorses `react-grid-layout` as the intended builder-mode engine, but it is now an explicit Phase 2 or Phase 3 adoption point rather than an unfinished Sprint 1 expectation.

---

## 2026-03-31 — Python Scaffold Retirement After Foundation Cleanup

**Decision:** The bootstrap Python scaffold remains in the repository through Sprint 1 and will be retired or isolated in the first cleanup slice after the frontend foundation.

**Rationale:** The highest-value work in Sprint 1 was proving the canonical React/Vite/TypeScript runtime. Removing bootstrap residue during that same sprint would have created repo churn without improving the product proof.

**Alternatives rejected:** Immediate deletion was rejected because it coupled foundation progress to repo hygiene work. Keeping the scaffold indefinitely was rejected because it would leave the repository's implementation story ambiguous.

**Consequences:** Contributors should treat the Python package as historical bootstrap residue, not an active product surface. A cleanup task remains on the roadmap, but it is no longer a blocker for declaring the foundation complete.

---

## 2026-03-31 — SQLite-Derived Snapshot Bridge For Sprint 3

**Decision:** Sprint 3 keeps SQLite as the canonical mock-data artifact, but the
current frontend runtime consumes SQLite-derived JSON snapshots through
`DataAdapter` instead of adding a direct browser SQLite engine in the same
slice.

**Rationale:** The sprint needed a real deterministic SQLite generation path and
a minimally usable runtime bridge without reopening Sprint 2 seams or adding a
new browser/runtime dependency just to satisfy one bounded sprint. Exporting a
snapshot from the generated SQLite database preserves the `DataAdapter`
contract, keeps widgets storage-agnostic, and gives the frontend a concrete
runtime path that is materially stronger than the earlier seam proof.

**Alternatives rejected:** Adding a direct browser SQLite runtime immediately
would have introduced new dependency and packaging work into the same sprint.
Leaving the frontend on a pure delegation seam would not have delivered a real
adapter-facing data path for generated healthcare data.

**Consequences:** The product now has a bounded deterministic SQLite generation
path plus optional snapshot export, but generator ownership has since moved to
`dataForge`. The frontend can validate and consume SQLite-backed datasets
through the snapshot bridge today, and a later sprint can replace that bridge
with a direct browser SQLite engine without changing widget code.

---

## 1. Architecture Principles

These principles are ordered by priority. When they conflict, higher-ranked principles win.

1. **Value delivery order, not technical dependency order.** Components ship in the sequence that creates consulting value fastest, even if that means temporary scaffolding that gets replaced later.

2. **The spec is the product.** The DashboardSpec JSON schema is the core IP. Everything else — rendering, editing, and data integration — serves the spec. If we had to throw away everything except the spec, the scenario package, and the bounded mock-data capability that supports it, we'd still have an accelerator.

3. **Components never know where data comes from.** Every chart component, every widget, every narrative generator consumes data through a `DataAdapter` interface. Mock data, SQLite queries, REST APIs, Snowflake — all behind the same adapter contract. This is not optional architectural hygiene; it is what makes Phase 6 (production binding) possible without rewriting the UI. If a component ever imports from the mock data engine directly, that is a bug.

4. **No vendor lock-in for clients.** The production output is owned React + ECharts code. No runtime license fees, no per-seat BI subscriptions, no proprietary formats.

5. **AI generates structured data, never raw code.** AI produces DashboardSpec JSON, NarrativeSpec JSON, and IndustryPack definitions. The platform validates and renders. AI never writes React components or ECharts configurations directly.

6. **Borrow the commodity, own the differentiation.** Use react-grid-layout for drag/drop and Apache ECharts for rendering. Own the spec schema, scenario packages, narrative engine, and binding adapters ourselves, while letting sibling tooling such as `dataForge` own bounded mock-data generation.

7. **Build for one user first.** The MVP user is an Anblicks consultant in a client workshop on a laptop with a projector. Not a SaaS platform with multi-tenancy. Not an enterprise deployment with SSO. A consultant, a laptop, a room full of executives.

8. **The first deliverable is a standalone dashboard, not authoring chrome.** The default product proof opens directly into a believable scenario dashboard backed by generated data. Builder, presenter, AI, and live-binding tools are secondary surfaces on the same runtime, not the first thing the client should see.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DashForge Application                    │
│                     (React 19 + Vite)                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ Standalone  │  │   Builder   │  │ Presenter / AI / │    │
│  │ Runtime     │  │   Mode      │  │ Export Surfaces  │    │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘    │
│         │                │                   │               │
│  ┌──────┴────────────────┴───────────────────┴──────────┐   │
│  │              DashboardSpec Runtime                     │   │
│  │  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │   │
│  │  │  Layout   │  │  Widget   │  │    Narrative      │  │   │
│  │  │  Engine   │  │  Registry │  │    Engine         │  │   │
│  │  │  (RGL)    │  │           │  │                   │  │   │
│  │  └──────────┘  └───────────┘  └───────────────────┘  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │              DataAdapter Interface                     │   │
│  │  query(datasetId, filters?, sort?, limit?) → Row[]    │   │
│  │  aggregate(datasetId, groupBy, metrics) → Row[]       │   │
│  │  getSchema(datasetId) → ColumnDef[]                   │   │
│  └───────┬─────────────────┬────────────────┬───────────┘   │
│          │                 │                │                │
│  ┌───────┴──────┐  ┌──────┴───────┐  ┌────┴────────────┐  │
│  │  SQLite      │  │  REST API    │  │  Snowflake /    │  │
│  │  Adapter     │  │  Adapter     │  │  Databricks     │  │
│  │  (Mock +     │  │  (Phase 6)   │  │  Adapter        │  │
│  │   Portable)  │  │              │  │  (Phase 6)      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

The canonical MVP flow starts before the app boots. Scenario definition docs
and generated SQLite/JSON artifacts under `scenarios/` define the package;
those artifacts may be produced by sibling project `dataForge`. Runtime
registration under `frontend/src/mock-data/` exposes that package to the app,
and `frontend/src/App.tsx` boots the standalone dashboard from that registered
path. Builder, presenter, export, AI authoring, and live binding all remain
secondary surfaces layered on the same shared runtime.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React 19 | AI codegen compatibility; react-grid-layout is React-native; enterprise acceptability; largest component ecosystem |
| **Build** | Vite 6 | Fast builds; no SSR complexity; client-side SPA is the right model for a workshop tool |
| **Language** | TypeScript 5.x | Type safety for spec schemas; better AI codegen output; catches mock data shape errors at compile time |
| **Layout engine** | react-grid-layout | Purpose-built for dashboard grids; drag/drop + resize + responsive breakpoints + collision detection; 12K GitHub stars |
| **Chart rendering** | Apache ECharts 5.x | 20+ chart types; JSON option model ideal for AI generation; built-in theme system; Canvas + SVG rendering; Apache 2.0 license |
| **ECharts wrapper** | Custom (50 lines) | The existing echarts-for-react wrapper is outdated; a custom useEffect-based wrapper gives full control with zero dependency risk |
| **Base data generation** | Faker.js | Seeded reproducibility; 70+ locales; extensible; industry-standard |
| **Mock data storage** | SQLite via Python stdlib `sqlite3` for generation, with SQLite-derived JSON snapshots for the current frontend runtime | Keeps SQLite as the canonical scenario artifact in Sprint 3, supports deterministic SQL-backed drill-down and aggregation, and preserves the `DataAdapter` boundary without adding a direct browser SQLite dependency in the same slice |
| **State management** | Zustand | Lightweight; works naturally with immutable spec snapshots for undo/redo; no boilerplate |
| **Styling** | Tailwind CSS 4 + CSS custom properties | Utility classes for builder chrome; CSS variables for theme tokens that bridge to ECharts theme objects |
| **Spec validation** | Ajv (JSON Schema) | Industry-standard JSON Schema validator; fast; supports custom keywords for semantic validation |
| **Export** | html2canvas + jsPDF | Dashboard screenshot to PNG/PDF for proposals; lightweight; no server-side dependency |
| **Testing** | Vitest + Testing Library | Fast; Vite-native; component testing for primitives; snapshot testing for spec validation |

### What we are NOT using and why

| Technology | Why not |
|-----------|---------|
| **Next.js** | SSR adds complexity for zero benefit in a client-side workshop tool |
| **Plasmic / Builder.io** | Adds a dependency and learning curve for a visual editor we don't need; our primitive set is constrained enough that a custom property panel is simpler |
| **Recharts** | React-native API but limited chart types and 470+ open issues; ECharts is more capable and its JSON config is better for AI generation |
| **Vega-Lite** | Theoretically elegant but limited theming, steep learning curve, and poor enterprise adoption; ECharts is more practical |
| **D3.js** | Imperative API makes AI generation dangerous; overkill for standard business charts; reserved as a future escape hatch for bespoke visuals |
| **Highcharts** | Commercial license; no advantage over ECharts for this use case |

---

## 4. The DashboardSpec Schema

This is the core IP. Everything renders from this spec. Everything saves as this spec. AI generates this spec. Production conversion transforms the data bindings in this spec.

### Top-Level Structure

```typescript
// dashforge-spec.ts — canonical types

interface DashboardSpec {
  // ── Identity ──
  id: string;                          // UUID
  specVersion: "1.0";                  // Schema version for migration
  
  // ── Metadata ──
  meta: {
    title: string;
    description?: string;
    author: string;
    createdAt: string;                 // ISO 8601
    updatedAt: string;
    tags?: string[];
  };
  
  // ── Intent (enables narrative generation + audience adaptation) ──
  intent: {
    type: "executive_summary" | "operational_detail" | "risk_alert" |
          "comparative_benchmark" | "drill_down" | "workshop_prototype";
    audience: "executive" | "manager" | "operator" | "analyst" | "client_demo";
    industry: string;                  // Reference to industry pack ID
    scenario?: string;                 // Reference to scenario template ID
  };
  
  // ── Theme ──
  theme: {
    id: string;                        // "light-professional" | "dark-executive" | custom
    overrides?: Record<string, string>; // CSS variable overrides
  };
  
  // ── Data Context ──
  dataContext: {
    mode: "mock" | "live" | "hybrid";
    mock?: {
      packId: string;                  // "healthcare" | "financial" | "saas"
      scenarioId: string;              // "flu-season" | "churn-crisis" etc.
      seed: number;                    // For reproducible generation
      overrides?: DataOverride[];      // Manual data point overrides
    };
    live?: {
      bindings: Record<string, DataBinding>;
    };
    timeRange: {
      start: string;                   // ISO date
      end: string;
      granularity: "day" | "week" | "month" | "quarter";
    };
  };
  
  // ── Layout ──
  layout: {
    columns: number;                   // Default: 12
    rowHeight: number;                 // Default: 60 (pixels)
    breakpoints: {
      lg: number;                      // 1200
      md: number;                      // 996
      sm: number;                      // 768
    };
    compaction: "vertical" | "horizontal" | "none";
  };
  
  // ── Widgets ──
  widgets: WidgetSpec[];
  
  // ── Narrative (optional, added by story engine) ──
  narrative?: NarrativeSpec;
  
  // ── Global Filters ──
  filters?: FilterSpec[];
}
```

### Widget Spec

```typescript
interface WidgetSpec {
  id: string;                          // Unique within dashboard
  
  // ── Placement ──
  position: {
    x: number;                         // Grid column (0-based)
    y: number;                         // Grid row (0-based)
    w: number;                         // Width in grid units
    h: number;                         // Height in grid units
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  
  // ── Display ──
  title: string;
  subtitle?: string;
  
  // ── Chart Configuration (platform DSL, NOT raw ECharts) ──
  chart: ChartSpec;
  
  // ── Data Reference ──
  data: WidgetDataRef;
  
  // ── Annotations (for narrative) ──
  annotations?: AnnotationSpec[];
}

interface ChartSpec {
  type: "kpi" | "line" | "bar" | "stacked_bar" | "donut" |
        "table" | "sparkline" | "gauge" | "area" | "scatter" |
        "heatmap" | "funnel" | "bullet" | "ranked_list" | "waterfall";
  
  // ── Intent hint (helps AI select type and helps compiler choose defaults) ──
  intent?: "trend" | "comparison" | "composition" | "distribution" |
           "ranking" | "target_vs_actual" | "anomaly" | "monitoring";
  
  // ── Encoding (what fields map to what visual channels) ──
  encoding: {
    x?: FieldEncoding;                 // Category or time axis
    y?: FieldEncoding;                 // Value axis
    series?: FieldEncoding;            // Series/group field
    value?: FieldEncoding;             // For KPI, gauge, donut
    label?: FieldEncoding;             // For ranked list, table
    size?: FieldEncoding;              // For scatter
    color?: FieldEncoding;             // For heatmap
  };
  
  // ── KPI-specific ──
  kpiConfig?: {
    deltaField?: string;               // Field for change indicator
    deltaFormat?: "percent" | "absolute";
    deltaPositive?: "good" | "bad";    // Green-up or red-up
    sparklineField?: string;           // Field for inline trend
    prefix?: string;                   // "$", "€"
    suffix?: string;                   // "%", "pts"
    format?: string;                   // "0,0.0" (numeral.js format)
  };
  
  // ── Visual options ──
  options?: {
    showLegend?: boolean;
    showTooltip?: boolean;
    showGrid?: boolean;
    smooth?: boolean;                  // Smooth line curves
    stack?: boolean;                   // Stack series
    horizontal?: boolean;              // Horizontal bar
    innerRadius?: number;              // Donut hole ratio (0-1)
    thresholds?: ThresholdSpec[];      // Reference lines / zones
    colorPalette?: string;            // Override theme palette
  };
}

interface FieldEncoding {
  field: string;                       // Column name in dataset
  label?: string;                      // Display label override
  format?: string;                     // Number/date format
  sort?: "asc" | "desc" | "none";
  aggregate?: "sum" | "avg" | "min" | "max" | "count";
}

interface WidgetDataRef {
  datasetId: string;                   // Reference to a dataset (table) in the data source
  // These map directly to DataAdapter.query() / DataAdapter.aggregate() parameters
  filters?: Array<{
    field: string;
    operator: "eq" | "neq" | "gt" | "lt" | "in" | "between";
    value: unknown;
  }>;
  groupBy?: string[];                  // If present, uses aggregate() instead of query()
  limit?: number;
  sortBy?: { field: string; direction: "asc" | "desc" };
}
```

### Data Binding (for production conversion)

```typescript
interface DataBinding {
  type: "rest" | "graphql" | "snowflake" | "databricks" | "static_json";
  
  // ── Connection ──
  connection: {
    url?: string;                      // REST/GraphQL endpoint
    account?: string;                  // Snowflake account
    warehouse?: string;
    database?: string;
    schema?: string;
    query?: string;                    // SQL query
    headers?: Record<string, string>;
  };
  
  // ── Field Mapping (mock field → real field) ──
  fieldMap: Record<string, string>;    // { "mock_field_name": "real_column_name" }
  
  // ── Refresh ──
  refreshInterval?: number;            // Seconds; 0 = manual only
  cachePolicy?: "none" | "ttl";
  cacheTTL?: number;                   // Seconds
}
```

### Narrative Spec

```typescript
interface NarrativeSpec {
  storyArc: {
    hook: NarrativeSection;            // "Revenue dropped 12%"
    context: NarrativeSection;         // "Following 3 quarters of growth"
    tension: NarrativeSection;         // "Enterprise churn spiked to 8.2%"
    resolution: NarrativeSection;      // "Competitors average 4.1%"
    callToAction: NarrativeSection;    // "Reducing churn to 5% recovers $2.4M"
  };
  
  executiveSummary?: string;           // 2-3 sentence AI-generated summary
  presenterNotes?: string[];           // For walkthrough mode
  
  audienceVariants?: {
    executive?: Partial<NarrativeSpec>;
    manager?: Partial<NarrativeSpec>;
    operator?: Partial<NarrativeSpec>;
  };
}

interface NarrativeSection {
  headline: string;
  commentary: string;
  widgetIds: string[];                 // Which widgets belong to this section
  callouts?: Array<{
    widgetId: string;
    dataPoint: string;                 // Description of the highlighted point
    text: string;
    severity: "info" | "warning" | "critical" | "positive";
  }>;
  transitionText?: string;            // "But when we look deeper..."
}

interface AnnotationSpec {
  type: "reference_line" | "highlight_point" | "highlight_region" | "text_label";
  value?: number;
  label: string;
  color?: string;
  style?: "solid" | "dashed" | "dotted";
}
```

---

## 5. Industry Mock Data Engine

### Architecture

The mock data engine is a layered system that generates semantically coherent business datasets, not random values.

```
┌──────────────────────────────────────────┐
│           Industry Pack Definition        │
│                                           │
│  ┌────────────┐  ┌────────────────────┐  │
│  │ Vocabulary │  │  Dataset Schemas   │  │
│  │            │  │                    │  │
│  │ metrics    │  │  columns[]         │  │
│  │ dimensions │  │  relationships[]   │  │
│  │ entities   │  │  constraints[]     │  │
│  │ labels     │  │  foreignKeys[]     │  │
│  └────────────┘  └────────────────────┘  │
│                                           │
│  ┌────────────┐  ┌────────────────────┐  │
│  │ Scenarios  │  │  Generator Config  │  │
│  │            │  │                    │  │
│  │ overrides  │  │  distributions     │  │
│  │ story text │  │  time series       │  │
│  │ highlights │  │  anomalies         │  │
│  │            │  │  correlations      │  │
│  └────────────┘  └────────────────────┘  │
└──────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│           Generation Pipeline             │
│                                           │
│  1. Create SQLite database (in-memory)    │
│  2. Create tables with FK constraints     │
│  3. Seed random generator                 │
│  4. Generate + INSERT dimension rows      │
│  5. Generate + INSERT fact rows (FK refs) │
│  6. Apply time series patterns via UPDATE │
│  7. Inject scenario-specific anomalies    │
│  8. Validate: SUM checks, FK integrity,  │
│     aggregation consistency               │
│  9. Export as .sqlite file                │
│                                           │
│  Output: scenario.sqlite                  │
│  (single portable file per scenario)      │
└──────────────────────────────────────────┘
```

### Why SQLite, Not JSON/CSV

This is a critical architectural decision driven by one workshop reality: **clients drill down.**

When a healthcare CFO sees a KPI card showing 14.2% readmission rate and clicks on it, they expect to see that 14.2% break down correctly by facility, by department, by payer — and those breakdowns must sum back to 14.2%. With flat JSON arrays or CSVs, this aggregation consistency is not enforced. The mock data might show facility-level rates that average to 15.1% instead of 14.2%, and the illusion breaks instantly.

SQLite enforces this at the storage layer:

1. **Foreign key constraints** guarantee that every fact row references a valid dimension row. No orphaned facility codes, no phantom department IDs.

2. **SQL aggregation** means the dashboard can query `SELECT facility, AVG(readmission_rate) FROM monthly_metrics GROUP BY facility` and get results that are mathematically consistent with the top-level aggregate. The data isn't pre-aggregated in multiple inconsistent JSON blobs — it's one normalized dataset that supports any roll-up.

3. **Filtering works.** When a consultant applies a filter in a workshop — "show me just the Northeast region" — the SQLite adapter runs a WHERE clause and every widget updates with consistent filtered data. With JSON arrays, every widget would need its own client-side filtering logic, and edge cases (null handling, date ranges, enum matching) would produce inconsistencies.

4. **Single portable file.** A `.sqlite` file is a single file that contains the entire scenario's data. Copy it to a USB drive, email it, check it into git. No folder of CSVs to keep in sync.

5. **sql.js runs in the browser.** The sql.js library compiles SQLite to WebAssembly. The entire database loads into browser memory and supports full SQL queries with zero server dependency. A consultant's laptop in a conference room with no WiFi can run the full DashForge experience.

6. **better-sqlite3 for CLI generation.** The generation pipeline runs in Node.js using better-sqlite3 (synchronous, fast, no native compilation headaches). It produces a `.sqlite` file that sql.js can load directly in the browser.

7. **JSON export is still available.** For integration with other tools, the CLI can export any SQLite dataset as JSON or CSV. But SQLite is the canonical storage, not a secondary format.

### Industry Pack TypeScript Interface

```typescript
interface IndustryPack {
  id: string;                          // "healthcare"
  name: string;                        // "Healthcare"
  description: string;
  
  vocabulary: {
    metrics: Record<string, {
      label: string;                   // "Readmission Rate"
      shortLabel: string;             // "Readmit %"
      unit: string;                    // "%"
      format: string;                  // "0.0%"
      goodDirection: "up" | "down";    // For delta coloring
      typicalRange: [number, number];  // [0.08, 0.18]
    }>;
    
    dimensions: Record<string, {
      label: string;
      values: string[];                // ["Cardiology", "Orthopedics", ...]
      // OR
      generator?: string;             // Faker.js method path
    }>;
    
    entities: Record<string, string[]>; // Named things: facility names, product names
    
    audienceLabels?: {
      executive: Record<string, string>;  // "readmission_rate" → "Patient Return Rate"
      operator: Record<string, string>;   // "readmission_rate" → "30-Day Readmit %"
    };
  };
  
  datasets: DatasetDefinition[];
  scenarios: ScenarioDefinition[];
  
  defaults: {
    timeRange: { months: number; granularity: string };
    currency: string;
    locale: string;
  };
  
  templates: DashboardTemplate[];       // Pre-built dashboard specs using this pack
}

interface DatasetDefinition {
  id: string;                          // "monthly_metrics"
  name: string;
  description: string;
  
  columns: ColumnDef[];
  
  generator: {
    type: "time_series" | "dimension_table" | "fact_table";
    
    // Time series config
    timeSeries?: {
      dateColumn: string;
      trend: "up" | "down" | "flat" | "seasonal";
      trendStrength: number;           // 0-1
      seasonality?: {
        period: "weekly" | "monthly" | "quarterly" | "annual";
        amplitude: number;             // 0-1
        peakOffset?: number;           // 0-1, when in the period the peak occurs
      };
      noise: number;                   // 0-1
      baseValue: number;
      valueColumn: string;
    };
    
    // Dimension table config
    dimensionSource?: string;          // vocabulary dimension key
    
    // Fact table config
    rowsPerPeriod?: number | { min: number; max: number };
    foreignKeys?: Array<{
      column: string;
      referencesDataset: string;
      referencesColumn: string;
    }>;
  };
  
  correlations?: Array<{
    field1: string;
    field2: string;
    strength: number;                  // -1 to 1
    description: string;               // "Higher length of stay correlates with higher readmission"
  }>;
}

interface ColumnDef {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  role: "dimension" | "measure" | "date" | "id";
  generator: string | GeneratorFunction;  // Faker path or custom function ref
  constraints?: {
    min?: number;
    max?: number;
    decimals?: number;
    nullable?: boolean;
    nullRate?: number;
    values?: unknown[];                // Enum constraint
  };
}

interface ScenarioDefinition {
  id: string;                          // "flu-season"
  name: string;                        // "Flu Season Surge"
  description: string;
  storyNarrative: string;             // "Hospital faces operational pressure..."
  
  // Override generator configs for specific datasets
  datasetOverrides: Record<string, {
    timeSeries?: Partial<TimeSeriesConfig>;
    anomalies?: AnomalyInjection[];
    distributionShifts?: Array<{
      column: string;
      shift: number;                   // Additive shift
      multiplier?: number;             // Multiplicative shift
      affectedDimensions?: Record<string, string[]>;  // Only shift for certain dimension values
    }>;
  }>;
  
  highlightMetrics: string[];          // Metrics to emphasize in narrative
  suggestedTemplateId: string;         // Which dashboard template fits this scenario
}

interface AnomalyInjection {
  type: "spike" | "drop" | "level_shift" | "outlier_cluster";
  startPosition: number;              // 0-1, where in time range
  duration: number;                    // 0-1, how long it lasts
  magnitude: number;                   // Multiplier (2.0 = double, 0.5 = half)
  affectedColumns: string[];
  label: string;                       // "System Outage Dec 15"
  annotationText?: string;            // For chart annotation
}
```

### Generator Implementation Strategy

The generators use Faker.js for value generation, but all data is written to SQLite tables with enforced foreign key constraints and validated aggregation consistency.

```typescript
// Generation pipeline — runs in Node.js with better-sqlite3

import Database from 'better-sqlite3';
import { faker } from '@faker-js/faker';

function generatePackDatabase(
  pack: IndustryPack, 
  scenario: ScenarioDefinition, 
  seed: number
): string {  // Returns path to .sqlite file
  
  faker.seed(seed);
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');  // CRITICAL: enforce FK constraints
  
  // 1. Create tables with proper schemas and FK constraints
  for (const dataset of pack.datasets) {
    const createSQL = buildCreateTable(dataset);  // Generates CREATE TABLE with FKs
    db.exec(createSQL);
  }
  
  // 2. Generate and insert dimension tables first (facilities, departments, products)
  for (const dataset of pack.datasets.filter(d => d.generator.type === "dimension_table")) {
    const rows = generateDimensionRows(dataset, pack.vocabulary);
    const insert = db.prepare(buildInsertSQL(dataset));
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(rows);
  }
  
  // 3. Generate time series + fact tables (FK refs validated by SQLite constraints)
  for (const dataset of pack.datasets.filter(d => d.generator.type !== "dimension_table")) {
    const config = mergeWithScenarioOverrides(
      dataset.generator, 
      scenario.datasetOverrides[dataset.id]
    );
    const rows = generateDataRows(dataset, config, pack.defaults.timeRange);
    const insert = db.prepare(buildInsertSQL(dataset));
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(rows);
  }
  
  // 4. Inject anomalies via UPDATE statements
  for (const [datasetId, overrides] of Object.entries(scenario.datasetOverrides)) {
    if (overrides.anomalies) {
      for (const anomaly of overrides.anomalies) {
        const updateSQL = buildAnomalyUpdate(datasetId, anomaly, pack.defaults.timeRange);
        db.exec(updateSQL);
      }
    }
  }
  
  // 5. VALIDATE aggregation consistency
  validateAggregations(db, pack);
  
  // 6. Write to file
  const outputPath = `${pack.id}_${scenario.id}_${seed}.sqlite`;
  db.backup(outputPath);
  db.close();
  
  return outputPath;
}

// Aggregation consistency check — the drill-down guarantee
function validateAggregations(db: Database, pack: IndustryPack): void {
  for (const dataset of pack.datasets) {
    if (dataset.generator.type !== "time_series") continue;
    
    for (const fk of dataset.generator.foreignKeys || []) {
      // For each dimension that the fact table joins to,
      // verify that SUM/AVG at the detail level matches the aggregate
      const checkSQL = `
        SELECT 
          ABS(
            (SELECT AVG(${dataset.generator.timeSeries!.valueColumn}) FROM ${dataset.id}) -
            (SELECT AVG(sub_avg) FROM (
              SELECT ${fk.column}, AVG(${dataset.generator.timeSeries!.valueColumn}) as sub_avg 
              FROM ${dataset.id} 
              GROUP BY ${fk.column}
            ))
          ) as drift
      `;
      const result = db.prepare(checkSQL).get() as { drift: number };
      if (result.drift > 0.01) {
        console.warn(
          `Aggregation drift detected: ${dataset.id} by ${fk.column}, drift=${result.drift}`
        );
      }
    }
  }
}
```

### DataAdapter Interface

This is the contract that ALL data consumers use. No component ever touches SQLite, Faker, REST, or Snowflake directly.

```typescript
// The universal data access contract — Principle #3

interface DataAdapter {
  // Query a dataset with optional filtering, sorting, and pagination
  query(request: DataRequest): Promise<DataResult>;
  
  // Aggregate a dataset by dimensions
  aggregate(request: AggregateRequest): Promise<DataResult>;
  
  // Get the schema of a dataset (column names, types, labels)
  getSchema(datasetId: string): Promise<DataSchema>;
  
  // Get available datasets
  listDatasets(): Promise<DatasetInfo[]>;
}

interface DataRequest {
  datasetId: string;
  columns?: string[];                  // Select specific columns; omit = all
  filters?: DataFilter[];
  sortBy?: { field: string; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

interface AggregateRequest {
  datasetId: string;
  groupBy: string[];                   // Dimension columns to group by
  metrics: Array<{
    field: string;
    aggregate: "sum" | "avg" | "min" | "max" | "count";
    alias?: string;
  }>;
  filters?: DataFilter[];
  sortBy?: { field: string; direction: "asc" | "desc" };
  limit?: number;
}

interface DataFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between" | "like";
  value: unknown;
}

interface DataResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
}

interface DataSchema {
  datasetId: string;
  columns: Array<{
    name: string;
    type: "string" | "number" | "date" | "boolean";
    role: "dimension" | "measure" | "date" | "id";
    label: string;                     // From vocabulary
    format?: string;
  }>;
}
```

### SQLite Adapter (MVP — Phase 1)

```typescript
// Adapter for in-browser SQLite via sql.js

import initSqlJs, { Database } from 'sql.js';

class SQLiteDataAdapter implements DataAdapter {
  private db: Database;
  
  static async fromFile(sqliteBytes: ArrayBuffer): Promise<SQLiteDataAdapter> {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });
    const db = new SQL.Database(new Uint8Array(sqliteBytes));
    return new SQLiteDataAdapter(db);
  }
  
  async query(request: DataRequest): Promise<DataResult> {
    const where = this.buildWhere(request.filters);
    const orderBy = request.sortBy 
      ? `ORDER BY ${request.sortBy.field} ${request.sortBy.direction}` 
      : '';
    const limit = request.limit ? `LIMIT ${request.limit}` : '';
    const offset = request.offset ? `OFFSET ${request.offset}` : '';
    const columns = request.columns?.join(', ') || '*';
    
    const sql = `SELECT ${columns} FROM ${request.datasetId} ${where} ${orderBy} ${limit} ${offset}`;
    const result = this.db.exec(sql);
    
    // ... map to DataResult
  }
  
  async aggregate(request: AggregateRequest): Promise<DataResult> {
    const groupCols = request.groupBy.join(', ');
    const metricCols = request.metrics
      .map(m => `${m.aggregate}(${m.field}) as ${m.alias || m.field}`)
      .join(', ');
    const where = this.buildWhere(request.filters);
    
    const sql = `SELECT ${groupCols}, ${metricCols} FROM ${request.datasetId} ${where} GROUP BY ${groupCols}`;
    const result = this.db.exec(sql);
    
    // ... map to DataResult
  }
  
  // ... getSchema reads from sqlite_master + vocabulary metadata
}
```

### Future Adapters (Phase 6)

```typescript
// Same DataAdapter interface, different backend

class RestApiAdapter implements DataAdapter {
  // Translates DataRequest → HTTP GET with query params
  // Translates AggregateRequest → HTTP POST with aggregation body
}

class SnowflakeAdapter implements DataAdapter {
  // Translates DataRequest → Snowflake SQL query
  // Uses field mapping to convert spec field names → real column names
  // Manages connection pool and caching
}
```

The key guarantee: **when an Anblicks engineering team swaps `SQLiteDataAdapter` for `SnowflakeAdapter` in Phase 6, zero chart components change.** The adapter interface is the boundary.

### Seeded Reproducibility

Every generated SQLite database is fully deterministic given `(packId, scenarioId, seed)`. This means:
- Two consultants generating the same scenario get identical databases
- A demo shown on Monday looks the same on Wednesday
- Dashboard specs can reference specific seeds for consistent screenshots in proposals
- The `.sqlite` file can be checked into git alongside the dashboard spec as a versioned artifact
- Shareable scenario links: `?pack=telecom&scenario=churn-crisis&seed=42` loads the corresponding `.sqlite` file

---

## 6. Chart Abstraction Layer

The platform owns a `ChartSpec` DSL that compiles to ECharts `option` objects. This insulates the rest of the system from ECharts internals.

### Compiler Architecture

```
ChartSpec (platform DSL)
    │
    ▼
┌──────────────────┐
│  Chart Compiler   │
│                   │
│  1. Resolve type  │    (intent → chart type if not explicit)
│  2. Map encoding  │    (field encoding → ECharts series/axis config)
│  3. Apply theme   │    (theme tokens → ECharts theme object)
│  4. Add defaults  │    (tooltips, legends, grid, responsive)
│  5. Add annotatns │    (thresholds, callouts → markLine/markPoint)
│                   │
│  Output: EChartsOption
└──────────────────┘
    │
    ▼
┌──────────────────┐
│  ECharts Wrapper  │
│  (React component)│
│                   │
│  - useRef + init  │
│  - useEffect for  │
│    option updates  │
│  - ResizeObserver  │
│  - Event handlers  │
│  - Loading state   │
│  - Error boundary  │
└──────────────────┘
```

### Intent → Type Resolution

When a widget specifies `intent` but not `type`, the compiler chooses:

| Intent | Default Type | Fallback |
|--------|-------------|----------|
| trend | line | area |
| comparison | bar | grouped_bar |
| composition | donut | stacked_bar |
| distribution | scatter | heatmap |
| ranking | ranked_list | bar (horizontal) |
| target_vs_actual | bullet | gauge |
| anomaly | line (with threshold annotations) | kpi (with delta) |
| monitoring | gauge | sparkline |

### Theme Compilation

The platform defines design tokens as CSS custom properties. The chart compiler maps these to ECharts theme objects:

```typescript
interface DashForgeTheme {
  id: string;
  name: string;
  
  // CSS custom properties (applied to DashboardBox and builder chrome)
  tokens: {
    "--df-bg-primary": string;
    "--df-bg-secondary": string;
    "--df-bg-widget": string;
    "--df-text-primary": string;
    "--df-text-secondary": string;
    "--df-text-muted": string;
    "--df-border": string;
    "--df-border-radius": string;
    "--df-shadow": string;
    "--df-accent": string;
    "--df-success": string;
    "--df-warning": string;
    "--df-danger": string;
    "--df-font-family": string;
    "--df-font-family-mono": string;
  };
  
  // ECharts theme object (applied to chart instances)
  echarts: {
    color: string[];                   // Series color palette
    backgroundColor: string;
    textStyle: { color: string; fontFamily: string };
    title: { textStyle: { color: string } };
    legend: { textStyle: { color: string } };
    tooltip: { backgroundColor: string; borderColor: string; textStyle: { color: string } };
    categoryAxis: { axisLine: object; axisLabel: object; splitLine: object };
    valueAxis: { axisLine: object; axisLabel: object; splitLine: object };
  };
}
```

Two themes ship with MVP:

1. **light-professional** — White background, dark text, muted grid lines, blue/green/amber palette. For printed proposals and well-lit conference rooms.

2. **dark-executive** — Dark navy background, light text, subtle grid, vibrant accent colors. For projector presentations in dimmed rooms. Looks impressive.

---

## 7. Component Architecture

### Directory Structure

```
src/
├── app/
│   ├── App.tsx                       # Root with mode switching
│   ├── BuilderMode.tsx               # Drag/drop composition
│   ├── PresenterMode.tsx             # Guided walkthrough
│   └── SpecEditorMode.tsx            # JSON spec viewer/editor
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardRenderer.tsx     # Renders a DashboardSpec
│   │   ├── DashboardBox.tsx          # The widget container primitive
│   │   ├── WidgetRenderer.tsx        # Routes WidgetSpec → chart component
│   │   └── GridLayout.tsx            # react-grid-layout wrapper
│   │
│   ├── charts/
│   │   ├── EChartsWrapper.tsx        # Base ECharts React wrapper
│   │   ├── KpiCard.tsx               # KPI stat card (custom, not ECharts)
│   │   ├── LineChart.tsx             # Line/area via ECharts
│   │   ├── BarChart.tsx              # Bar/stacked/horizontal via ECharts
│   │   ├── DonutChart.tsx            # Donut/pie via ECharts
│   │   ├── TableChart.tsx            # Sortable data table (custom React)
│   │   ├── SparklineChart.tsx        # Inline sparkline via ECharts
│   │   └── GaugeChart.tsx            # Gauge via ECharts
│   │
│   ├── builder/
│   │   ├── WidgetPalette.tsx         # Sidebar with draggable widget types
│   │   ├── PropertyPanel.tsx         # Right sidebar for selected widget config
│   │   ├── Toolbar.tsx               # Top bar: theme, pack, scenario, save, export
│   │   ├── PackSelector.tsx          # Industry pack chooser
│   │   └── ScenarioSelector.tsx      # Scenario chooser
│   │
│   └── presenter/
│       ├── StoryArcStepper.tsx       # Step through narrative sections
│       ├── WidgetHighlighter.tsx     # Dim/highlight widgets by section
│       ├── CommentaryPanel.tsx       # Show headlines and commentary
│       └── PresenterControls.tsx     # Next/prev/jump controls
│
├── engine/
│   ├── spec/
│   │   ├── schema.json              # JSON Schema for DashboardSpec
│   │   ├── validator.ts             # Ajv-based validation
│   │   ├── defaults.ts              # Default values for optional fields
│   │   └── migrations.ts            # Spec version migration functions
│   │
│   ├── charts/
│   │   ├── compiler.ts              # ChartSpec → EChartsOption
│   │   ├── intentResolver.ts        # Intent → default chart type
│   │   └── themeCompiler.ts         # DashForgeTheme → ECharts theme object
│   │
│   ├── data/
│   │   ├── adapter.ts               # DataAdapter interface definition
│   │   ├── sqliteAdapter.ts         # SQLiteDataAdapter (sql.js in browser)
│   │   ├── mockEngine.ts            # Generation pipeline (better-sqlite3, CLI only)
│   │   ├── timeSeriesGen.ts         # Time series with trend/season/noise
│   │   ├── dimensionGen.ts          # Dimension table generation
│   │   ├── factTableGen.ts          # Fact table with FK references
│   │   ├── anomalyInjector.ts       # Spike/drop/shift injection via SQL UPDATE
│   │   ├── aggregationValidator.ts  # Validates drill-down math consistency
│   │   └── schemaBuilder.ts         # IndustryPack → CREATE TABLE SQL
│   │
│   └── narrative/
│       ├── storyGenerator.ts        # Analyze data → generate story arc
│       ├── calloutDetector.ts       # Find notable data points
│       └── summaryWriter.ts         # Generate executive summary text
│
├── packs/
│   ├── healthcare/
│   │   ├── pack.ts                   # IndustryPack definition
│   │   ├── scenarios/
│   │   │   ├── flu-season.ts
│   │   │   ├── quality-improvement.ts
│   │   │   └── cost-pressure.ts
│   │   └── templates/
│   │       ├── executive-summary.ts  # Pre-built DashboardSpec
│   │       ├── operational-detail.ts
│   │       └── quality-scorecard.ts
│   │
│   ├── financial/
│   │   ├── pack.ts
│   │   ├── scenarios/
│   │   └── templates/
│   │
│   └── saas/
│       ├── pack.ts
│       ├── scenarios/
│       └── templates/
│
├── themes/
│   ├── light-professional.ts
│   └── dark-executive.ts
│
├── store/
│   ├── dashboardStore.ts             # Zustand store for current spec
│   ├── undoStore.ts                  # Spec snapshot stack
│   └── uiStore.ts                    # Builder UI state (selected widget, mode, etc.)
│
└── types/
    ├── spec.ts                       # DashboardSpec, WidgetSpec, etc.
    ├── pack.ts                       # IndustryPack, ScenarioDefinition, etc.
    └── theme.ts                      # DashForgeTheme
```

---

## 8. Delivery Phases — Ordered by Consulting Value

### Phase 0: Foundation (Week 1-2)

**What ships:** Project scaffold + spec schema + spec validator + DataAdapter interface

**Deliverables:**
- React + Vite + TypeScript project with Tailwind, Zustand, Vitest
- `DashboardSpec` TypeScript types (complete, as defined above)
- `DataAdapter` interface definition (the contract that all data consumers use)
- JSON Schema for spec validation (generated from types)
- Ajv validator with semantic validation rules
- Spec save/load to localStorage (temporary; files later)
- sql.js WASM integration scaffold (load a `.sqlite` file in the browser)
- 2 theme definitions (light + dark)

**Why this first:** Nothing renders without the spec. Nothing validates without the schema. The DataAdapter interface must exist before any component is written so that no component ever directly imports mock data logic. This prevents the Phase 6 rewrite that Gemini correctly warned about.

**Exit criteria:** `npm run validate` can validate a hand-written DashboardSpec JSON and report errors. A trivial test SQLite database can be loaded in the browser via sql.js and queried.

---

### Phase 1: Mock Data Engine + Industry Packs (Week 3-6)

**What ships:** 3 industry packs as SQLite databases with generators, scenarios, and seeded reproducibility

**Deliverables:**
- Mock data generation pipeline using better-sqlite3 (time series, dimensions, fact tables with FK constraints)
- SQLite schema generator (IndustryPack definition → CREATE TABLE statements with foreign keys)
- Anomaly injection system (UPDATE-based, preserves referential integrity)
- Aggregation consistency validator (verifies drill-down math holds)
- Healthcare pack: vocabulary, 3+ datasets, 3 scenarios → 3 `.sqlite` files
- Financial Services pack: vocabulary, 3+ datasets, 3 scenarios → 3 `.sqlite` files
- SaaS pack: vocabulary, 3+ datasets, 3 scenarios → 3 `.sqlite` files
- `SQLiteDataAdapter` implementation (the MVP adapter for in-browser sql.js)
- CLI tool: `npx dashforge generate --pack healthcare --scenario flu-season --seed 42`
  - Outputs: `.sqlite` file (primary) + optional `--export json` and `--export csv` flags
- Seed-based reproducibility tests (same inputs → byte-identical `.sqlite` output)

**Why this order:** The mock data is the highest-value component. Even without a dashboard UI, a consultant can use the generated SQLite file in any tool — open it in DBeaver, query it in a notebook, load it into a prototype. The `.sqlite` file is a portable, self-contained, relationally consistent dataset that survives drill-down scrutiny. A consultant who shows up with a realistic SQLite database of healthcare data already has more credibility than one with a folder of CSVs.

**Exit criteria:** Run `npx dashforge generate --pack healthcare --scenario flu-season --seed 42` and get a `.sqlite` file. Open it in any SQLite viewer. Verify: (1) foreign keys are enforced, (2) `SELECT facility, AVG(readmission_rate) FROM monthly_metrics GROUP BY facility` produces results that weighted-average back to the top-level KPI, (3) a domain expert says "yeah, this looks real."

---

### Phase 2: Chart Primitives + DashboardBox (Week 5-8, overlaps Phase 1)

**What ships:** 8 chart components + widget container + static dashboard renderer — all consuming data through DataAdapter, never directly

**Deliverables:**
- ECharts wrapper component (custom, ~50 lines)
- Chart compiler (ChartSpec → EChartsOption)
- Theme compiler (tokens → ECharts theme)
- 8 chart primitives: KPI card, line, bar, stacked bar, donut, table, sparkline, gauge
- DashboardBox component (title, toolbar, loading/empty/error states)
- `DashboardRenderer` — takes a DashboardSpec + DataAdapter, renders the full dashboard
- All chart components consume data via `DataAdapter.query()` and `DataAdapter.aggregate()` — no direct SQLite or mock engine imports
- Responsive layout via react-grid-layout (read-only; no drag/drop editing yet)

**Why this order:** With Phase 1 SQLite databases and Phase 2 rendering, a consultant can load a pre-built template spec + scenario database and show a fully rendered, themed, realistic dashboard. This is the minimum viable demo. Because every component uses the DataAdapter interface, swapping in live data in Phase 6 requires zero component changes.

**Exit criteria:** Load a healthcare executive summary template with flu-season scenario data from SQLite. It renders 6-8 widgets with realistic data, themed consistently, on a responsive grid. Apply a filter (e.g., single facility) and verify all widgets update consistently. Screenshot it and put it in a proposal.

---

### Phase 3: Builder Mode (Week 8-11)

**What ships:** Drag/drop dashboard composition with property editing

**Deliverables:**
- Widget palette (left sidebar) with drag-to-add
- Grid layout with drag/drop repositioning and resize handles
- Property panel (right sidebar) for selected widget
  - Title editing
  - Chart type selector
  - Data field mapping (dropdown of available fields from current pack)
  - Visual options (legend, grid, smooth, etc.)
  - Threshold configuration
- Toolbar: theme switcher, pack selector, scenario selector
- Undo/redo (spec snapshot stack)
- Save spec to file / load spec from file
- 3 pre-built templates per industry pack (9 total)
- Template gallery for quick starts

**Why this order:** The builder is what makes the tool usable in a live workshop. Before this phase, dashboards come from templates or hand-edited JSON. After this phase, a consultant can compose a dashboard in real-time during a meeting.

**Exit criteria:** A consultant with no prior DashForge experience can open the app, select a healthcare pack, choose the flu-season scenario, and compose a 6-widget dashboard in under 15 minutes.

---

### Phase 4: Presenter Mode + Narrative (Week 11-14)

**What ships:** Story arc walkthrough + annotations + commentary

**Deliverables:**
- NarrativeSpec support in the dashboard spec
- Story arc editor (assign widgets to hook/context/tension/resolution/CTA sections)
- Presenter mode toggle
  - Step through sections with next/prev
  - Active section widgets highlighted; others dimmed
  - Commentary panel shows headlines and explanatory text
  - Transition text between sections
- Callout annotations on charts (highlight specific data points with labels)
- Executive summary generation (AI via Claude API, optional)
- Export dashboard as PDF with narrative text
- Presenter notes (visible only to presenter, not on projected screen)

**Why this order:** Presenter mode is the consulting theater that wins deals. A static dashboard with realistic data is good. A narrated walkthrough that tells a story — "Here's what's happening, here's why, here's what you should do" — is what makes a client say "I want to work with you."

**Exit criteria:** Demo a healthcare dashboard to an internal audience using presenter mode. Walk through 5 sections in 5 minutes. Audience should be able to follow the story without any verbal explanation beyond what's on screen.

---

### Phase 5: AI Spec Generation (Week 14-17)

**What ships:** Natural language → DashboardSpec

**Deliverables:**
- AI prompt interface in the builder toolbar
- System prompt with DashboardSpec JSON Schema and industry pack vocabulary
- Claude API integration for spec generation
- Spec validation of AI output (reject invalid specs, show errors)
- "Improve this dashboard" mode (AI analyzes current spec and suggests changes)
- AI-generated narrative (story arc + commentary + callouts)
- Prompt templates per industry ("Generate a [healthcare/financial/saas] [executive/operational] dashboard for [scenario description]")

**Why this order:** AI generation is a speed multiplier, not a capability enabler. It's more valuable after the manual workflow is proven and the spec schema is stable. Building AI generation on a moving spec schema wastes prompt engineering effort.

**Exit criteria:** Type "Executive dashboard for a SaaS company losing enterprise customers to churn" and get a valid, rendered, narrative-equipped dashboard in under 30 seconds.

---

### Phase 6: Production Data Binding (Week 17-22)

**What ships:** Mock-to-production conversion workflow

**Deliverables:**
- "Bind to real data" workflow in the builder
- Field mapping UI (mock field name → real column name)
- REST API data adapter (fetch JSON from endpoint, map fields)
- Snowflake data adapter (run query, map columns)
- Hybrid mode (some widgets mock, some live)
- Data refresh / polling for live adapters
- Connection credential management (local storage for MVP; vault integration later)
- Production code export (generate a standalone React project with ECharts + the bound spec)

**Why this order:** This is the payoff. The prototype becomes production. But it requires a stable spec, proven chart primitives, and a real client engagement to test against. Building it before winning a deal means building it on assumptions.

**Exit criteria:** Take a dashboard created with healthcare mock data, connect it to a client's Snowflake warehouse, map 5 fields, and render live data in the same layout without changing any visual configuration.

---

## 9. Builder UX — Key Patterns

### Layout: Three-panel with collapsible sidebars

```
┌──────┬───────────────────────┬──────────┐
│Widget│                       │ Property │
│Palette│     Canvas           │  Panel   │
│      │   (Grid Layout)       │          │
│ KPI  │                       │ Title    │
│ Line │  ┌────┐ ┌──────────┐ │ Type     │
│ Bar  │  │    │ │          │ │ Fields   │
│ Donut│  │    │ │          │ │ Options  │
│ Table│  └────┘ └──────────┘ │          │
│ Spark│  ┌──────────────────┐│ Threshlds│
│ Gauge│  │                  ││          │
│      │  └──────────────────┘│          │
├──────┴───────────────────────┴──────────┤
│ Toolbar: Theme | Pack | Scenario | AI   │
│          Save | Export | Undo | Redo    │
│          Mode: Builder | Presenter | JSON│
└─────────────────────────────────────────┘
```

### Key UX decisions:

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| **Widget add** | Drag from palette onto grid | Standard pattern; react-grid-layout supports external drop |
| **Widget select** | Click widget → property panel populates | Single-selection first; multi-select later |
| **Widget remove** | X button in DashboardBox toolbar | Standard pattern |
| **Chart type change** | Dropdown in property panel | Keep it simple; visual chart type picker is Phase 5+ polish |
| **Data field mapping** | Dropdown populated from current pack's dataset columns | No free-text entry for field names; prevents typos |
| **Theme switching** | Toggle in toolbar; instant preview | CSS variable swap + ECharts theme re-apply |
| **Scenario switching** | Dropdown in toolbar; regenerates all data | Entire dashboard re-renders with new scenario's data |
| **Undo/redo** | Ctrl+Z / Ctrl+Y; spec snapshot stack | Max 50 snapshots; no granular undo (full spec replace) |
| **Save** | Ctrl+S → download spec.json; or localStorage auto-save | File-based for MVP; cloud storage later |
| **Preview vs. edit** | Toggle in toolbar; preview hides grid lines and property panel | Preview = what the client sees; edit = what the consultant configures |

---

## 10. What Could Go Wrong

### Technical risks with mitigations

| Risk | Phase | Mitigation |
|------|-------|-----------|
| ECharts chart compiler becomes too complex | Phase 2 | Start with explicit type-specific compilers (one per chart type); extract common patterns later; don't try to make a universal compiler from day one |
| Mock data relationships don't hold up under scrutiny | Phase 1 | Build a data validation suite that checks FK integrity, value ranges, and statistical plausibility; run it as part of generation |
| react-grid-layout has performance issues with many widgets | Phase 3 | Cap dashboards at 20 widgets; lazy-render off-screen widgets; this is sufficient for business dashboards |
| AI generates specs that pass JSON Schema but look ugly | Phase 5 | Add a "layout quality" scoring function that checks for common mistakes (all widgets same size, no visual hierarchy, overlapping labels); feed score back to AI as refinement prompt |
| Theme system doesn't unify component + chart styles | Phase 2 | Build the theme compiler early; test with both themes on every chart type before shipping |

### Process risks with mitigations

| Risk | Mitigation |
|------|-----------|
| Lee builds it alone and it becomes a personal tool | Get 2 Anblicks consultants to use it in real workshops within 3 months; their feedback shapes Phase 3-4 |
| Scope creeps toward a full BI platform | This document is the scope boundary; revisit only after Phase 4 success criteria are met |
| No engagement pipeline to test against | Build Phase 0-2 (spec + data + renderer) anyway; these have standalone value even without the builder UX |
| Kumar doesn't see ROI | Frame ROI as: "same dashboard delivery in 1 day vs. 3 weeks" + "client sees realistic prototype in first meeting vs. 4th meeting" |

---

## 11. Definition of Done — Per Phase

Each phase must meet ALL of these before the next phase starts:

1. **Works on a laptop with no network connection.** The workshop tool cannot depend on cloud services for core rendering. AI features (Phase 5) are the exception.

2. **A non-Lee Anblicks person has used it.** At least one other person has opened the tool, loaded a template, and formed an opinion about it.

3. **The spec schema has not changed in a breaking way in the last week.** If the schema is still churning, the phase isn't done.

4. **All chart primitives render correctly in both themes.** No chart type is "light-only" or "dark-only."

5. **Generated mock data has been reviewed by someone with domain knowledge.** Healthcare data reviewed by someone who knows healthcare. Financial data reviewed by someone who knows financial services.

---

## 12. Future Considerations (Post-Phase 6)

These are explicitly out of scope for the current roadmap but documented for future planning:

- **Additional industry packs:** Manufacturing, Retail, Telecom, Logistics, Education
- **Collaboration:** Real-time multi-user editing (Y.js / CRDT-based)
- **Export to BI tools:** Generate Power BI .pbix or Tableau .twb from the spec (Mokkup.ai's territory)
- **Embedding SDK:** JavaScript snippet to embed a DashForge dashboard in any web app
- **Custom chart type builder:** Define new chart primitives without modifying the platform code
- **SaaS deployment:** Auth, billing, multi-tenancy, cloud storage, team management
- **White-label:** Brand removal, custom themes, custom domain for resale to other consultancies
- **Marketplace:** Community-contributed industry packs and templates

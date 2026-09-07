# Synthetic RBAC Audit Foundation Implementation Plan

## Executive Summary & Slice Intent

The `synthetic-rbac-audit-foundation` vertical slice establishes the foundational synthetic data models and dashboard specification for the RBAC (Role-Based Access Control) management accelerator in DashForge (`snowflakeRbac:rbac-audit-foundation`). DashForge operates as an internal consulting delivery accelerator for Anblicks cybersecurity architects, client delivery leads, practice directors, and cloud data consultants conducting high-stakes executive discovery workshops with prospective enterprise buyers—specifically Chief Information Security Officers (CISOs), Cloud Security Architects, Data Governance Directors, and Snowflake Administrators.

In enterprise cloud data platforms such as Snowflake, access control management is notoriously fraught with complexity: opaque multi-tier role inheritance, unmonitored privilege escalation paths, dormant user accounts with administrative entitlements, and a lack of consolidated visibility into securable object grants. Prospective buyers routinely struggle to audit and govern these permissions. However, pre-sales consultants cannot access prospective clients' live production environments due to infosec barriers, vendor onboarding delays, and data privacy compliance restrictions (such as SOC 2, HIPAA, and GDPR). Generic slides, static mockups, or flat toy datasets fail to demonstrate the analytical depth and relational integrity required to earn executive confidence.

**Slice Intent:** Establish the foundational synthetic data models and dashboard specification for the RBAC management accelerator. This will allow buyers to visualize their role hierarchies and audit user access without requiring live Snowflake data, turning a common pain point into a governed data story. Existing dashForge and dataForge components must remain intact without fragmentation.

Every acceptance check defined in `docs/synthetic-rbac-audit-foundation-contract.md` (`AC-1` through `AC-6`) maps directly to a concrete plan item, verified through automated frontend tests, Python regression suites, production bundle contract marker audits, and direct argv execution from the workspace root.

---

## Architecture

The architecture of the `synthetic-rbac-audit-foundation` slice delivers a self-contained, browser-executable operational foundation that translates synthetic Snowflake access control telemetry into structured role hierarchies, user audit matrices, and prioritized governance findings. In strict compliance with DashForge's primary architectural tenet—**components never know where data comes from**—all presentation specifications, widgets, and audit matrices query data exclusively through the canonical `DataAdapter` abstraction layer, preserving complete architectural decoupling without secondary renderers, ad-hoc charting engines, backend daemons, or live cloud dependencies.

### System Overview & Runtime Seams

The operational topology and data flow within DashForge are structured as follows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Foundational Synthetic RBAC Models                    │
│  src/dashForge/snowflake_rbac.py (and canonical SQLite / Snapshot bridges)  │
│    ├── 6 Canonical Relational Datasets:                                     │
│    │   ├── rbac_summary: Total roles, active users, admins, risk findings   │
│    │   ├── roles: Names, types, owners, descriptions                        │
│    │   ├── role_hierarchy: Parent-child inheritance links, tree depth       │
│    │   ├── user_role_assignments: Users, assigned roles, MFA, status        │
│    │   ├── object_grants: Object privileges (warehouses, dbs, schemas, tabs)│
│    │   └── governance_findings: 6 governance fields & directional guardrails│
│    └── Canonical SQLite Snapshot JSON Bridge (frontend/src/mock-data/)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Offline scenario snapshot export)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DashboardSpec & DataAdapter Runtime Seams                  │
│  frontend/src/core/data/createDashboardDataAdapter.ts                       │
│    ├── StaticDataAdapter: Deterministic in-memory querying & aggregation    │
│    ├── SyntheticDataArtifactAdapter: Verifies claim ledger & digest integrity│
│    └── SQLiteDataAdapter: Direct SQL execution seam                         │
│  frontend/src/core/spec/dashboardSchema.ts & dashboardSpec.ts               │
│    ├── DashboardSpec: Canonical layout, widget specifications, data context │
│    └── Claim Ledger: Material audit claims anchored to verified provenance  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             Standalone RBAC Presentation Tier & Audit Visualizations        │
│  frontend/src/features/runtime/StandaloneDashboardApp.tsx                   │
│    ├── URL Scenario Resolver: /?scenario=rbac-audit-foundation              │
│    ├── Persistent Synthetic Disclosure: data-disclosure="synthetic-demo-data"│
│    ├── KPI Metric Scorecards: Total Roles, Active Users, Admins, Risks      │
│    ├── Interactive Role Hierarchy Visualization: role-hierarchy-tree        │
│    ├── User Access Audit Matrix: Direct & inherited role assignment grid    │
│    └── Governance Findings Queue: governance-findings                       │
│        ├── 6 Canonical Governance Fields: id, severity, owner, action, risk,│
│        │   and protective guardrail                                         │
│        └── Explicit Directional Guardrails: Admin confirmation prerequisite │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Foundational Synthetic RBAC Relational Schema Contracts

The slice formalizes canonical schema definitions across six relational datasets mirroring Snowflake Account Usage security views (`SNOWFLAKE.ACCOUNT_USAGE.ROLES`, `GRANTS_TO_ROLES`, `GRANTS_TO_USERS`, etc.):

1. **`rbac_summary`**: Headline access control posture metrics:
   - `summary_id` (string, id, primary key)
   - `total_roles` (number, measure): Total distinct roles defined across the tenant.
   - `active_users` (number, measure): Total active human and service account identities.
   - `elevated_admin_accounts` (number, measure): Count of accounts with `ACCOUNTADMIN` or `SECURITYADMIN` entitlements.
   - `critical_risk_findings` (number, measure): Quantified total of `P0`/`P1` governance violations.
   - `synthetic_seed` (number, dimension): Deterministic generation seed.
   - `evaluation_timestamp` (date, date): ISO-8601 evaluation snapshot timestamp.

2. **`roles`**: Detailed role metadata:
   - `role_name` (string, id, primary key): Unique role identifier (e.g., `ACCOUNTADMIN`, `SECURITYADMIN`, `FINANCE_ANALYST`).
   - `role_type` (string, dimension): Role classification (`SYSTEM`, `FUNCTIONAL`, `ACCESS`).
   - `role_owner` (string, dimension): Controlling role responsible for role administration.
   - `comment` (string, dimension): Descriptive administrative commentary.
   - `created_on` (date, date): Role creation timestamp.

3. **`role_hierarchy`**: Directed role-to-role inheritance relationships:
   - `link_id` (string, id, primary key): Unique relationship identifier.
   - `parent_role` (string, dimension): Inheriting / granted role.
   - `child_role` (string, dimension): Grantee role receiving privileges.
   - `tree_depth` (number, measure): Topological nesting depth from root.
   - `granted_by` (string, dimension): Authorizing role.
   - `grant_date` (date, date): ISO-8601 timestamp of role grant.

4. **`user_role_assignments`**: User identity entitlement mappings:
   - `assignment_id` (string, id, primary key): Unique assignment record.
   - `user_name` (string, dimension): User principal identity.
   - `role_name` (string, dimension): Assigned Snowflake role.
   - `grant_type` (string, dimension): `DIRECT` vs. `INHERITED`.
   - `mfa_enabled` (boolean, dimension): Multi-factor authentication compliance indicator.
   - `account_status` (string, dimension): Account activity state (`ACTIVE`, `DORMANT`, `SUSPENDED`).
   - `last_login` (date, date): Last recorded authentication timestamp.

5. **`object_grants`**: Securable object access permissions:
   - `grant_id` (string, id, primary key): Unique grant identifier.
   - `grantee_role` (string, dimension): Role holding the privilege.
   - `securable_type` (string, dimension): Object class (`WAREHOUSE`, `DATABASE`, `SCHEMA`, `TABLE`).
   - `securable_name` (string, dimension): Fully qualified object identifier.
   - `privilege` (string, dimension): Entitlement (`USAGE`, `SELECT`, `MODIFY`, `OPERATE`).
   - `is_grantable` (boolean, dimension): Whether the role can delegate the privilege.

6. **`governance_findings`**: Audited security findings preserving all six canonical governance fields:
   - `finding_id` (string, id, primary key): Unique tracking identifier (e.g., `RBAC-001`).
   - `executive_severity` (string, dimension): Urgency classification (`P0`, `P1`, `P2`).
   - `suggested_owner` (string, dimension): Designated administrative owner (e.g., `Snowflake Security Architect`).
   - `recommended_action` (string, dimension): Specific remediation instruction (e.g., `Revoke direct ACCOUNTADMIN grant from dormant user SERVICE_ETL_USER`).
   - `risk_detail` (string, dimension): Explanatory risk context (e.g., `Unmonitored service account possesses administrative privileges without MFA`).
   - `guardrail` (string, dimension): Protective operational boundary (e.g., `Require security administrator confirmation before revoking role inheritance`).

### Canonical DashboardSpec & Runtime Presentation Seams

The presentation layer is governed by a canonical `DashboardSpec` JSON specification that mounts seamlessly into DashForge's React 19 / Vite runtime via `StandaloneDashboardApp.tsx`:
- **Scenario URL Routing**: Mounts at `/?scenario=rbac-audit-foundation` with `data-scenario="rbac-audit-foundation"`.
- **KPI Summary Scorecards**: Renders KPI cards for Total Roles, Active Users, Elevated Admin Accounts, and Critical Risk Findings.
- **Role Hierarchy Tree Visualization**: Implements interactive node-link graph visualization with DOM marker `data-testid="role-hierarchy-tree"`.
- **User Access Audit Matrix**: Implements user entitlement grid with DOM marker `data-testid="user-access-matrix"`.
- **Prioritized Governance Findings Queue**: Implements prioritized finding queue with DOM marker `data-status="governance-findings"` (`data-testid="governance-findings"`).
- **Persistent Synthetic Data Disclosures**: Prominently renders `data-disclosure="synthetic-demo-data"` with the exact text `"Synthetic demo data"` across header badges, quality cards, and export views.
- **Directional Security Validation Guardrails**: Displays explicit notices that all role revocations and inheritance changes are directional pending confirmation by designated security administrators.
- **Decoupled Data Routing**: Resolves all data requests through `createDashboardDataAdapter` via `StaticDataAdapter` or `SyntheticDataArtifactAdapter` with zero live credentials or backend servers.

---

## Concrete Plan Items & Work Breakdown

The implementation of the `synthetic-rbac-audit-foundation` slice is decomposed into six concrete plan items directly mapped to contract acceptance checks `AC-1` through `AC-6`:

### Plan Item 1: Foundational Synthetic RBAC Relational Schema Contracts (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("The slice establishes canonical schema definitions for foundational synthetic RBAC data models across six relational datasets—`rbac_summary` (headline access metrics: total roles, active users, elevated admin accounts, critical risk findings), `roles` (role names, role types, owners, descriptions), `role_hierarchy` (parent-child role inheritance links, tree depth), `user_role_assignments` (users, assigned roles, grant dates, MFA status, account activity), `object_grants` (privilege grants on securable objects: warehouses, databases, schemas, tables), and `governance_findings` (audit findings preserving governance fields: `finding_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `risk_detail`, `guardrail`)—providing typed schema contracts for SQLite and canonical `SQLiteSnapshot` JSON representations without live Snowflake dependencies.")
- **Objective**: Establish and validate typed relational schema definitions for the foundational synthetic RBAC data models across all six canonical datasets in Python backend bridges and TypeScript data contracts without live Snowflake dependencies.
- **Implementation Scope & Seams**:
  - In `src/dashForge/snowflake_rbac.py`: Define dataset constants, column schemas, primary keys, and typed SQL table definitions for `rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, and `governance_findings`.
  - In `src/dashForge/package_snapshot.py`: Ensure SQLite schema inspection and snapshot packaging support the six RBAC datasets with correct column types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`).
  - In `frontend/src/core/data/sqliteSnapshot.ts`: Ensure TypeScript interfaces and schema validators cleanly validate the six relational RBAC datasets.
  - In `frontend/src/mock-data/`: Provide canonical snapshot fixtures adhering strictly to `SQLiteSnapshot` contract schema.
- **Deliverables**: Formally typed schema definitions, Python generator/validation interfaces, and canonical snapshot exports for all six relational RBAC datasets.

### Plan Item 2: Canonical DashboardSpec Specification & Runtime Seam Binding (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The slice defines and validates the canonical `DashboardSpec` specification for the RBAC management accelerator, declaring layout structure, KPI summary metric cards (total roles, active users, elevated admin count, critical governance findings), role hierarchy graph/tree visualization, user access audit matrix, and prioritized governance findings queue, binding exclusively through DashForge's standard `DataAdapter` interfaces (`StaticDataAdapter`, `SyntheticDataArtifactAdapter`, `SQLiteDataAdapter`) without introducing bespoke or secondary renderers.")
- **Objective**: Define and register the canonical `DashboardSpec` specification for the RBAC management accelerator and wire its presentation widgets exclusively through standard `DataAdapter` seams.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/standaloneDashboard.ts`: Register scenario blueprint and `DashboardSpec` for `snowflakeRbac:rbac-audit-foundation` (`tpl.snowflakeRbac.rbac-audit-foundation`).
  - In `frontend/src/features/runtime/rbacPresentation.ts`: Implement query helpers invoking `DataAdapter.query()` and `DataAdapter.aggregate()` across the six datasets.
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`: Mount `?scenario=rbac-audit-foundation`, rendering KPI summary cards, role hierarchy tree visualization (`data-testid="role-hierarchy-tree"`), user access matrix (`data-testid="user-access-matrix"`), and governance findings queue (`data-testid="governance-findings"`).
  - Prohibit bespoke charting engines or secondary rendering paths; all widgets consume data strictly through the existing renderer and adapter abstraction.
- **Deliverables**: Canonical `DashboardSpec` definition and runtime presentation wiring consuming standard `DataAdapter` seams.

### Plan Item 3: Persistent Disclosures & Directional Security Validation Guardrails (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("All generated RBAC presentation views, export deliverables, and dashboard presentation surfaces prominently display the unsuppressed disclosure element `data-disclosure=\"synthetic-demo-data\"` with the exact text `\"Synthetic demo data\"`, accompanied by upstream provenance metadata and explicit directional security validation guardrails framing all role remediation recommendations as directional pending designated security administrator confirmation.")
- **Objective**: Guarantee that all presentation views, export packages, and documentation prominently display unsuppressed `"Synthetic demo data"` disclosures and enforce directional security validation guardrails.
- **Implementation Scope & Seams**:
  - In `frontend/src/features/runtime/StandaloneDashboardApp.tsx`:
    - Render persistent header disclosure badge with `data-disclosure="synthetic-demo-data"` displaying the exact text `"Synthetic demo data"`.
    - Render quality card displaying synthetic provenance metadata (`packId: "snowflakeRbac"`, `scenarioId: "rbac-audit-foundation"`, `seed`, `synthetic: true`, ISO-8601 timestamp).
    - Render explicit directional security guardrail notices: `"All role revocations and access remediation recommendations are directional pending validation by designated security administrators. Automated privilege modifications are strictly disabled."`
  - In export deliverable templates and PDF print views: Preserve disclosure elements and directional security guardrail notices.
- **Deliverables**: Unsuppressed synthetic disclosures and prominent directional security validation guardrails across all presentation views and export deliverables.

### Plan Item 4: Frontend Production Build Compilation & Browser Smoke Gate Markers (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("The frontend production build compiled via `npm --prefix frontend run build` generates optimized static assets under `frontend/dist/` with zero TypeScript compilation errors, and strictly preserves contract markers (`\"rbac-audit-foundation\"`, `\"synthetic-demo-data\"`, `\"role-hierarchy-tree\"`, and `\"governance-findings\"`) validated by browser smoke checks without introducing secondary renderers, backend services, or live cloud credentials.")
- **Objective**: Ensure the frontend production build compiles cleanly without TypeScript errors and preserves required contract markers in compiled static assets for automated browser smoke testing.
- **Implementation Scope & Seams**:
  - Execute `npm --prefix frontend run build` producing static assets in `frontend/dist/`.
  - Ensure zero TypeScript compiler errors or unresolved module references.
  - Verify that compiled JavaScript bundles under `frontend/dist/assets/*.js` preserve exact contract marker literals:
    1. `"rbac-audit-foundation"`
    2. `"synthetic-demo-data"`
    3. `"role-hierarchy-tree"`
    4. `"governance-findings"`
  - Verify that `frontend/dist/index.html` preserves mount element `<div id="root"></div>`.
  - Maintain zero live credentials (`password`, `account_identifier`, `private_key`) and zero external cloud network calls.
- **Deliverables**: Validated production build in `frontend/dist/` preserving all four immutable browser smoke gate contract markers.

### Plan Item 5: Verbatim Direct Argv Command Execution & Journey Traceability (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("All operational, verification, and test commands declared in `journeys/user_journeys_manifest.json` are runnable verbatim from the workspace root using direct argv execution (`shell=False`), enforcing the exact prefix `env PYTHONPATH=src python3 -m dashForge.main` for application CLI commands, `npm --prefix frontend test -- --run` for browser-visible frontend tests, and `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override for Python test execution, with complete traceability across all acceptance checks (`AC-1` through `AC-6`) and zero forbidden shell operators (`|`, `&&`, `||`, `;`, `<`, `>`).")
- **Objective**: Validate that all commands in `journeys/user_journeys_manifest.json` execute verbatim from the workspace root under direct subprocess invocation (`shell=False`) with complete bidirectional traceability across `AC-1` through `AC-6`.
- **Implementation Scope & Seams**:
  - In `journeys/user_journeys_manifest.json`:
    - Enforce `command_allowlist` containing exact allowed prefixes:
      - `"env PYTHONPATH=src python3 -m dashForge.main"`
      - `"python3 -m pytest tests/ -q"`
      - `"python3 -m pytest"`
      - `"npm --prefix frontend test -- --run"`
    - Confirm all user journeys declare valid authorities (`human`, `mission`, `author`) and `passed` status.
    - Guarantee complete acceptance check coverage where every check (`AC-1` through `AC-6`) is traced by at least one journey via `traces_to`.
    - Prohibit shell operators (`|`, `&&`, `||`, `;`, `<`, `>`) and standalone shell utilities (`jq`, `grep`, `cat`).
- **Deliverables**: Conforming user journeys manifest with 100% acceptance check traceability and zero unallowlisted commands.

### Plan Item 6: Preservation of Existing Components & Sibling Isolation (`AC-6`)
- **Mapped Acceptance Check**: `AC-6` ("Existing dashForge and dataForge components remain intact without fragmentation; existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost:idle-warehouse-waste`), CLI generation flows, fail-closed overwrite guards (`--force`), and automated test suites pass cleanly with zero regressions, and sibling project `dataForge` remains strictly read-only and unmodified.")
- **Objective**: Prevent regressions across existing DashForge packs, CLI generation workflows, and fail-closed overwrite guards, ensuring sibling project `dataForge` remains strictly unmodified and isolated.
- **Implementation Scope & Seams**:
  - Ensure zero edits to sibling repository `dataForge/`.
  - Validate deterministic generation of existing industry packs: `healthcare:flu-season`, `financial:market-downturn`, `saas:churn-crisis`, and `snowflakeCost:idle-warehouse-waste`.
  - Validate fail-closed overwrite protection: verifying that attempting to overwrite existing outputs without `--force` exits with code 2 and clean diagnostics.
  - Run full automated regression suites: `python3 -m pytest tests/ -q` (with NO `PYTHONPATH` override) and `npm --prefix frontend test -- --run`.
- **Deliverables**: Verified regression safety across all existing industry packs and complete sibling project isolation.

---

### Acceptance Check Traceability Matrix

The following matrix provides comprehensive, bidirectional mapping between contract acceptance checks (`AC-1` through `AC-6`), concrete plan items, user journeys, implementation touchpoints, and verification commands:

| Acceptance Check | Concrete Plan Item | User Journey ID | Primary Implementation Touchpoints | Verification Command & Assertion Target |
|:---|:---|:---|:---|:---|
| **AC-1** | Plan Item 1: Foundational Synthetic RBAC Relational Schema Contracts | `journey-rbac-data-model-schema-inspection` | `src/dashForge/snowflake_rbac.py`, `frontend/src/core/data/sqliteSnapshot.ts` | `python3 -m pytest tests/test_remediation_artifacts.py -q -k test_ac5_user_journeys_manifest_full_ac_traceability` |
| **AC-2** | Plan Item 2: Canonical DashboardSpec Specification & Runtime Seam Binding | `journey-rbac-dashboard-spec-runtime-seams` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `frontend/src/features/runtime/standaloneDashboard.ts` | `npm --prefix frontend test -- --run -t "StandaloneDashboardApp"` |
| **AC-3** | Plan Item 3: Persistent Disclosures & Directional Security Validation Guardrails | `journey-rbac-synthetic-disclosures-and-guardrails` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `docs/synthetic-rbac-audit-foundation-contract.md` | `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf` |
| **AC-4** | Plan Item 4: Frontend Production Build Compilation & Browser Smoke Gate Markers | `journey-rbac-production-build-and-smoke-conformance` | `frontend/src/features/runtime/StandaloneDashboardApp.tsx`, `tests/browser_smoke_manifest.json` | `python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac6_production_bundle_contract_markers_conformance` & `npm --prefix frontend run build` |
| **AC-5** | Plan Item 5: Verbatim Direct Argv Command Execution & Journey Traceability | `journey-rbac-verbatim-cli-execution` | `journeys/user_journeys_manifest.json`, `src/dashForge/main.py` | `env PYTHONPATH=src python3 -m dashForge.main --help` |
| **AC-6** | Plan Item 6: Preservation of Existing Components & Sibling Isolation | `journey-rbac-regression-and-architecture-integrity` | `src/dashForge/main.py`, `src/dashForge/idle_warehouse_waste.py`, `tests/test_idle_warehouse_waste.py` | `python3 -m pytest tests/test_idle_warehouse_waste.py -q` & `python3 -m pytest tests/ -q` |

---

## Tests

The testing architecture for the `synthetic-rbac-audit-foundation` slice implements a deterministic, multi-tiered verification methodology spanning frontend component tests, Python contract assertions, production bundle inspection, and user journey simulation.

### 1. Frontend Unit and Integration Test Suite

The frontend test suite is executed using Vitest and Testing Library via `npm --prefix frontend test -- --run`:

- **Component Rendering & Mounting (`StandaloneDashboardApp.test.tsx`)**:
  - Verifies that `StandaloneDashboardApp` correctly mounts scenario containers, resolves `?scenario=rbac-audit-foundation`, and initializes state cleanly without errors.
  - Asserts presence of required DOM markers: `[data-scenario="rbac-audit-foundation"]`, `[data-disclosure="synthetic-demo-data"]`, `[data-testid="role-hierarchy-tree"]`, `[data-testid="user-access-matrix"]`, and `[data-testid="governance-findings"]`.
- **DataAdapter Query Routing & Snapshot Bridge (`StaticDataAdapter.test.ts`, `createDashboardDataAdapter.test.ts`)**:
  - Asserts that relational queries executed against the six RBAC datasets (`rbac_summary`, `roles`, `role_hierarchy`, `user_role_assignments`, `object_grants`, `governance_findings`) return expected rows and aggregate measures.
  - Confirms schema inspection via `getSchema()` correctly identifies column types (`string`, `number`, `date`, `boolean`) and semantic roles (`dimension`, `measure`, `date`, `id`).
- **Directional Security Guardrail Display (`StandaloneDashboardApp.test.tsx`)**:
  - Verifies that security recommendations render with explicit directional notices requiring security administrator confirmation.

### 2. Automated Python Test Suite

The Python test suite is executed via `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override:

- **Relational Schema Contracts & Governance Fields (`tests/test_remediation_artifacts.py`, `tests/test_playbook_schema.py`)**:
  - Asserts that all six canonical datasets define required columns and data types.
  - Confirms that `governance_findings` enforces and preserves all six governance fields (`finding_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `risk_detail`, `guardrail`).
- **Persistent Synthetic Data Disclosures (`tests/test_idle_warehouse_dashboard.py`)**:
  - Asserts that synthetic demo data disclosures are preserved in presentation and export structures.
- **Contract Marker Bundle Conformance (`tests/test_idle_warehouse_dashboard.py`)**:
  - Inspects compiled production assets to ensure contract markers exist in `frontend/dist/assets/*.js`.
- **Regression Safety & Sibling Project Isolation (`tests/test_idle_warehouse_waste.py`)**:
  - Asserts that existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost:idle-warehouse-waste`) generate without regressions.
  - Confirms sibling repository `dataForge` remains clean and unmodified.

### 3. Browser Smoke Gate & Contract Marker Suite

- **Smoke Manifest Conformance (`tests/browser_smoke_manifest.json`)**:
  - Verifies that static assets compiled into `frontend/dist/` mount cleanly at `#root`.
  - Confirms presence of required contract markers (`"rbac-audit-foundation"`, `"synthetic-demo-data"`, `"role-hierarchy-tree"`, and `"governance-findings"`).
- **Zero Live Credentials Enforcement**:
  - Asserts that presentation surfaces strictly avoid credential input fields (`password`, `account_identifier`, `private_key`) and external network endpoints.

### 4. User Journey Simulation Suite

The user journey simulation verifies that all declared journeys in `journeys/user_journeys_manifest.json` execute cleanly under direct argv invocation:
- `journey-rbac-data-model-schema-inspection`: Inspects foundational synthetic RBAC data model schemas and governance datasets (`AC-1`).
- `journey-rbac-dashboard-spec-runtime-seams`: Verifies RBAC dashboard specification structure and canonical DataAdapter runtime seams (`AC-2`).
- `journey-rbac-synthetic-disclosures-and-guardrails`: Verifies prominent synthetic disclosures and security owner validation guardrails (`AC-3`).
- `journey-rbac-production-build-and-smoke-conformance`: Verifies production build integrity and contract marker preservation (`AC-4`).
- `journey-rbac-verbatim-cli-execution`: Verifies workspace-root CLI help execution under direct argv (`AC-5`).
- `journey-rbac-regression-and-architecture-integrity`: Verifies complete test suite execution, zero regressions, and sibling repository isolation (`AC-6`).

---

## Verification

The verification protocol executes nine deterministic verification steps from the workspace root to confirm all six acceptance checks (`AC-1` through `AC-6`):

### Step 1: Verify Foundational RBAC Schema Contracts & Manifest Traceability (`AC-1`, `AC-5`)
Execute targeted pytest check verifying schema conformance and complete acceptance check traceability in `journeys/user_journeys_manifest.json`:
```bash
python3 -m pytest tests/test_remediation_artifacts.py -q -k test_ac5_user_journeys_manifest_full_ac_traceability
```
- **Expected Result**: Exits with code 0. Confirms all acceptance checks (`AC-1` through `AC-6`) are traced by manifest user journeys with zero dangling IDs.

### Step 2: Verify Frontend Component Mounting & DataAdapter Runtime Seams (`AC-2`)
Execute targeted frontend test verifying `StandaloneDashboardApp` component mounting and DataAdapter query resolution:
```bash
npm --prefix frontend test -- --run -t "StandaloneDashboardApp"
```
- **Expected Result**: Exits with code 0. Verifies standalone presentation mounting and clean component rendering without errors.

### Step 3: Verify Persistent Synthetic Data Disclosures & Guardrails (`AC-3`)
Execute targeted test asserting unsuppressed synthetic data disclosures and directional framing:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf
```
- **Expected Result**: Exits with code 0. Confirms unsuppressed `data-disclosure="synthetic-demo-data"` and exact text `"Synthetic demo data"`.

### Step 4: Verify Frontend Production Build Compilation (`AC-4`)
Execute the frontend production build from workspace root:
```bash
npm --prefix frontend run build
```
- **Expected Result**: Exits with code 0. Zero TypeScript errors; static assets compiled into `frontend/dist/`.

### Step 5: Verify Browser Smoke Gate Contract Markers (`AC-4`)
Inspect compiled JavaScript bundles for contract markers:
```bash
python3 -m pytest tests/test_idle_warehouse_dashboard.py -q -k test_ac6_production_bundle_contract_markers_conformance
```
- **Expected Result**: Exits with code 0. Confirms compiled bundles retain required contract marker literals.

### Step 6: Verify Verbatim Workspace-Root CLI Execution (`AC-5`)
Execute dashForge CLI entrypoint help from workspace root using direct argv execution:
```bash
env PYTHONPATH=src python3 -m dashForge.main --help
```
- **Expected Result**: Exits with code 0. Outputs standard CLI options and generate subcommands cleanly without shell pipelines.

### Step 7: Verify Regression Safety Across Existing Packs (`AC-6`)
Execute regression test verifying that existing cost, healthcare, financial, and SaaS packs remain intact:
```bash
python3 -m pytest tests/test_idle_warehouse_waste.py -q
```
- **Expected Result**: Exits with code 0. All 33 idle warehouse tests pass cleanly.

### Step 8: Verify Sibling Repository Isolation (`AC-6`)
Verify sibling project `dataForge` remains completely untouched:
```bash
python3 -m pytest tests/test_playbook_schema.py -q -k test_ac5_dataforge_sibling_repo_unmodified
```
- **Expected Result**: Exits with code 0. Sibling repository `dataForge` has zero uncommitted modifications.

### Step 9: Execute Complete Test Suites (`AC-5`, `AC-6`)
Execute full frontend test suite:
```bash
npm --prefix frontend test -- --run
```
- **Expected Result**: Exits with code 0. All 35 frontend test files pass cleanly.

Execute complete Python test suite with NO `PYTHONPATH` override:
```bash
python3 -m pytest tests/ -q
```
- **Expected Result**: Exits with code 0. All 199 tests pass cleanly.

---

## Risks

The following risk assessment details critical technical, architectural, and operational risks associated with delivering the `synthetic-rbac-audit-foundation` vertical slice, establishing concrete preventative controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:---|:---:|:---:|:---|
| **Misinterpretation of Synthetic Access Control Data as Live Customer Audit**: Prospective enterprise security leaders mistake synthetic demo RBAC hierarchies for audited client production telemetry, creating governance or legal exposure. | High | Low | Mandate persistent, unsuppressed `data-disclosure="synthetic-demo-data"` badges displaying the exact text `"Synthetic demo data"` across all views, accompanied by generation provenance metadata (`packId: "snowflakeRbac"`, `synthetic: true`, ISO-8601 timestamp) (`AC-3`). |
| **Premature or Destructive Role Revocation Assumptions**: Workshop participants assume displayed remediation guidance can be executed automatically against live Snowflake environments without stakeholder approval. | High | Low | Enforce explicit directional security validation guardrails on every finding card and export view: all access remediations are directional pending validation by designated security administrators. Automated mutation APIs are strictly prohibited (`AC-3`). |
| **Secondary Renderer Architecture Fragmentation**: Introducing bespoke graph visualization libraries or custom RBAC tables that bypass canonical `DataAdapter` and `DashboardSpec` contracts fragments runtime architecture. | High | Low | Mandate that all widgets, graph trees, and audit matrices consume data exclusively through `createDashboardDataAdapter` via `query()`, `aggregate()`, and `getSchema()`, preserving Phase 6 production binding compatibility (`AC-2`). |
| **Live Credential Leakage or Cloud Network Calls**: Developers inadvertently introduce Snowflake connection forms, username/password fields, or network fetch requests during RBAC view authoring. | Critical | Low | Prohibit all external cloud networking and credential inputs (`password`, `account_identifier`, `private_key`). Enforce client-side local snapshot loading via `StaticDataAdapter` and automated assertion tests (`AC-2`, `AC-4`). |
| **Production Bundle Marker Stripping During Minification**: Vite/Rollup tree-shaking or terser minification removes contract marker strings from compiled static bundles in `frontend/dist/assets/`. | Medium | Low | Maintain explicit string literals in DOM attributes and data structures. Plan Item 4 and Verification Step 5 enforce automated bundle marker audits asserting all contract markers (`AC-4`). |
| **Direct Argv Subprocess Execution Failures via Shell Incompatibilities**: Verification commands declared in `journeys/user_journeys_manifest.json` fail during orchestrator execution due to shell syntax dependencies. | High | Low | Enforce direct argv execution standards (`shell=False`): journey commands use exact `env PYTHONPATH=src python3 -m dashForge.main`, `npm --prefix frontend test -- --run`, and `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override and zero shell operators (`|`, `&&`, `;`, redirection) (`AC-5`). |
| **Sibling Repository or Existing Pack Contamination**: Implementing RBAC models inadvertently alters existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost`) or mutates sibling project `dataForge`. | High | Low | Maintain strict read-only boundary around `dataForge/`. Run full regression suites (`python3 -m pytest tests/ -q`) confirming zero modifications to existing generators and tests (`AC-6`). |
| **Acceptance Check Traceability Gaps**: Implementation plan or journey manifest fails to trace every contract acceptance check, triggering gate failure under the traceability judge. | High | Low | Ensure explicit bidirectional traceability mapping every acceptance check (`AC-1` through `AC-6`) to concrete plan items, user journeys, touchpoints, and verification steps in the traceability matrix (`AC-5`). |

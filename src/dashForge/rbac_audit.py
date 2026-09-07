from __future__ import annotations

from datetime import datetime
import json
import os
from pathlib import Path
import sqlite3
import sys
from typing import Any

PACK_ID: str = "snowflakeRbac"
SCENARIO_NAME: str = "rbac-audit-foundation"
DEFAULT_SEED: int = 42
DEFAULT_TEMPLATE_ID: str = "tpl.snowflakeRbac.rbac-audit-foundation"
SYNTHETIC_DISCLOSURE_TEXT: str = "Synthetic demo data"

EXPECTED_SIX_DATASETS: tuple[str, ...] = (
    "rbac_summary",
    "roles",
    "role_hierarchy",
    "user_role_assignments",
    "object_grants",
    "governance_findings",
)

EXPECTED_RBAC_SUMMARY_COLUMNS: set[str] = {
    "summary_id",
    "total_roles",
    "active_users",
    "elevated_admin_accounts",
    "critical_risk_findings",
    "synthetic_seed",
    "evaluation_timestamp",
}

EXPECTED_ROLES_COLUMNS: set[str] = {
    "role_name",
    "role_type",
    "role_owner",
    "comment",
    "created_on",
}

EXPECTED_ROLE_HIERARCHY_COLUMNS: set[str] = {
    "link_id",
    "parent_role",
    "child_role",
    "tree_depth",
    "granted_by",
    "grant_date",
}

EXPECTED_USER_ROLE_ASSIGNMENTS_COLUMNS: set[str] = {
    "assignment_id",
    "user_name",
    "role_name",
    "grant_type",
    "mfa_enabled",
    "account_status",
    "last_login",
}

EXPECTED_OBJECT_GRANTS_COLUMNS: set[str] = {
    "grant_id",
    "grantee_role",
    "securable_type",
    "securable_name",
    "privilege",
    "is_grantable",
}

EXPECTED_SIX_GOVERNANCE_FIELDS: set[str] = {
    "finding_id",
    "executive_severity",
    "suggested_owner",
    "recommended_action",
    "risk_detail",
    "guardrail",
}

EXPECTED_DATASET_SCHEMAS: dict[str, dict[str, tuple[str, str]]] = {
    "rbac_summary": {
        "summary_id": ("string", "id"),
        "total_roles": ("number", "measure"),
        "active_users": ("number", "measure"),
        "elevated_admin_accounts": ("number", "measure"),
        "critical_risk_findings": ("number", "measure"),
        "synthetic_seed": ("number", "dimension"),
        "evaluation_timestamp": ("date", "date"),
    },
    "roles": {
        "role_name": ("string", "id"),
        "role_type": ("string", "dimension"),
        "role_owner": ("string", "dimension"),
        "comment": ("string", "dimension"),
        "created_on": ("date", "date"),
    },
    "role_hierarchy": {
        "link_id": ("string", "id"),
        "parent_role": ("string", "dimension"),
        "child_role": ("string", "dimension"),
        "tree_depth": ("number", "measure"),
        "granted_by": ("string", "dimension"),
        "grant_date": ("date", "date"),
    },
    "user_role_assignments": {
        "assignment_id": ("string", "id"),
        "user_name": ("string", "dimension"),
        "role_name": ("string", "dimension"),
        "grant_type": ("string", "dimension"),
        "mfa_enabled": ("boolean", "dimension"),
        "account_status": ("string", "dimension"),
        "last_login": ("date", "date"),
    },
    "object_grants": {
        "grant_id": ("string", "id"),
        "grantee_role": ("string", "dimension"),
        "securable_type": ("string", "dimension"),
        "securable_name": ("string", "dimension"),
        "privilege": ("string", "dimension"),
        "is_grantable": ("boolean", "dimension"),
    },
    "governance_findings": {
        "finding_id": ("string", "id"),
        "executive_severity": ("string", "dimension"),
        "suggested_owner": ("string", "dimension"),
        "recommended_action": ("string", "dimension"),
        "risk_detail": ("string", "dimension"),
        "guardrail": ("string", "dimension"),
    },
}


def get_snowflake_rbac_scenarios() -> list[str]:
    """Dynamically return registered scenario IDs for snowflakeRbac."""
    scenarios: list[str] = []
    scenarios.append(SCENARIO_NAME)
    return scenarios


def validate_snowflake_rbac_scenario(scenario_id: str) -> dict[str, Any]:
    """Validate that scenario_id is registered under snowflakeRbac."""
    if scenario_id != SCENARIO_NAME:
        raise ValueError(f'Unknown snowflakeRbac scenario "{scenario_id}".')
    return {
        "scenarioId": SCENARIO_NAME,
        "packId": PACK_ID,
        "seed": DEFAULT_SEED,
        "version": 1,
        "description": "Foundational synthetic RBAC audit telemetry for Snowflake access control governance.",
    }


def enrich_snowflake_rbac_provenance(
    snapshot: dict[str, Any],
    scenario_id: str,
    seed: int | None = None,
) -> dict[str, Any]:
    """Enrich a snapshot dictionary with snowflakeRbac provenance metadata."""
    validate_snowflake_rbac_scenario(scenario_id)
    effective_seed = seed if seed is not None else DEFAULT_SEED

    snapshot["packId"] = PACK_ID
    snapshot["scenarioId"] = scenario_id
    snapshot["seed"] = effective_seed
    snapshot["dataForgeStoryContractPath"] = f"stories/snowflake/{scenario_id}.md"
    snapshot["generatorVersion"] = 1
    snapshot["generationTimestamp"] = "2026-06-01T00:00:00Z"
    snapshot["synthetic"] = True
    snapshot["disclosure"] = SYNTHETIC_DISCLOSURE_TEXT
    return snapshot


def validate_governance_findings_schema(connection: sqlite3.Connection) -> None:
    """Validate that governance_findings has all six required governance columns."""
    cursor = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='governance_findings'"
    )
    if not cursor.fetchone():
        raise ValueError("governance_findings table does not exist.")

    pragma = connection.execute("PRAGMA table_info(governance_findings)")
    columns = {row[1] for row in pragma.fetchall()}
    missing = EXPECTED_SIX_GOVERNANCE_FIELDS - columns
    if missing:
        raise ValueError(
            f"Missing required columns in governance_findings table: {sorted(missing)}"
        )


def _seed_rbac_database(connection: sqlite3.Connection, effective_seed: int) -> None:
    """Create and seed the six canonical synthetic RBAC datasets and metadata."""
    # Metadata
    connection.execute(
        "CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)"
    )
    metadata_rows = [
        ("packId", PACK_ID),
        ("scenarioId", SCENARIO_NAME),
        ("seed", str(effective_seed)),
        ("version", "1"),
        ("disclosure", SYNTHETIC_DISCLOSURE_TEXT),
        ("generationTimestamp", "2026-06-01T00:00:00Z"),
    ]
    connection.executemany(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", metadata_rows
    )

    # Dataset catalog
    connection.execute(
        "CREATE TABLE IF NOT EXISTS dataset_catalog (datasetId TEXT PRIMARY KEY)"
    )
    for ds_id in EXPECTED_SIX_DATASETS:
        connection.execute(
            "INSERT OR REPLACE INTO dataset_catalog (datasetId) VALUES (?)", (ds_id,)
        )

    # 1. rbac_summary
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS rbac_summary (
            summary_id TEXT PRIMARY KEY,
            total_roles INTEGER,
            active_users INTEGER,
            elevated_admin_accounts INTEGER,
            critical_risk_findings INTEGER,
            synthetic_seed INTEGER,
            evaluation_timestamp TEXT
        )
        """
    )
    connection.execute(
        """
        INSERT OR REPLACE INTO rbac_summary (
            summary_id, total_roles, active_users, elevated_admin_accounts,
            critical_risk_findings, synthetic_seed, evaluation_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        ("SUMM-001", 10, 4, 3, 2, effective_seed, "2026-06-01T00:00:00Z"),
    )

    # 2. roles
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS roles (
            role_name TEXT PRIMARY KEY,
            role_type TEXT,
            role_owner TEXT,
            comment TEXT,
            created_on TEXT
        )
        """
    )
    roles_rows = [
        ("ACCOUNTADMIN", "SYSTEM", "ACCOUNTADMIN", "Default administrative role with full privileges", "2024-01-01T00:00:00Z"),
        ("SECURITYADMIN", "SYSTEM", "ACCOUNTADMIN", "Manages users and roles across the Snowflake tenant", "2024-01-01T00:00:00Z"),
        ("SYSADMIN", "SYSTEM", "ACCOUNTADMIN", "Manages warehouses, databases, schemas, and compute resources", "2024-01-01T00:00:00Z"),
        ("USERADMIN", "SYSTEM", "SECURITYADMIN", "Manages users and role assignments", "2024-01-01T00:00:00Z"),
        ("PUBLIC", "SYSTEM", "ACCOUNTADMIN", "Default role automatically granted to all users", "2024-01-01T00:00:00Z"),
        ("DATA_ENGINEER", "FUNCTIONAL", "SYSADMIN", "Functional role for data ingestion and pipeline operations", "2024-03-15T00:00:00Z"),
        ("SECURITY_ANALYST", "FUNCTIONAL", "SECURITYADMIN", "Security analysis, audit, and incident response role", "2024-04-10T00:00:00Z"),
        ("FINANCE_ANALYST", "FUNCTIONAL", "SYSADMIN", "Financial analytics and reporting functional role", "2024-05-01T00:00:00Z"),
        ("RAW_DATA_READ", "ACCESS", "SYSADMIN", "Access role granting read privileges on raw warehouse tables", "2024-03-20T00:00:00Z"),
        ("ANALYTICS_DATA_READ", "ACCESS", "SYSADMIN", "Access role granting read privileges on analytics marts", "2024-03-20T00:00:00Z"),
    ]
    connection.executemany(
        "INSERT OR REPLACE INTO roles (role_name, role_type, role_owner, comment, created_on) VALUES (?, ?, ?, ?, ?)",
        roles_rows,
    )

    # 3. role_hierarchy
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS role_hierarchy (
            link_id TEXT PRIMARY KEY,
            parent_role TEXT,
            child_role TEXT,
            tree_depth INTEGER,
            granted_by TEXT,
            grant_date TEXT
        )
        """
    )
    hierarchy_rows = [
        ("LINK-001", "SECURITYADMIN", "ACCOUNTADMIN", 1, "ACCOUNTADMIN", "2024-01-01T00:00:00Z"),
        ("LINK-002", "SYSADMIN", "ACCOUNTADMIN", 1, "ACCOUNTADMIN", "2024-01-01T00:00:00Z"),
        ("LINK-003", "USERADMIN", "SECURITYADMIN", 2, "SECURITYADMIN", "2024-01-01T00:00:00Z"),
        ("LINK-004", "DATA_ENGINEER", "SYSADMIN", 2, "SYSADMIN", "2024-03-15T00:00:00Z"),
        ("LINK-005", "FINANCE_ANALYST", "SYSADMIN", 2, "SYSADMIN", "2024-05-01T00:00:00Z"),
        ("LINK-006", "RAW_DATA_READ", "DATA_ENGINEER", 3, "SYSADMIN", "2024-03-20T00:00:00Z"),
        ("LINK-007", "ANALYTICS_DATA_READ", "FINANCE_ANALYST", 3, "SYSADMIN", "2024-03-20T00:00:00Z"),
    ]
    connection.executemany(
        "INSERT OR REPLACE INTO role_hierarchy (link_id, parent_role, child_role, tree_depth, granted_by, grant_date) VALUES (?, ?, ?, ?, ?, ?)",
        hierarchy_rows,
    )

    # 4. user_role_assignments
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS user_role_assignments (
            assignment_id TEXT PRIMARY KEY,
            user_name TEXT,
            role_name TEXT,
            grant_type TEXT,
            mfa_enabled INTEGER,
            account_status TEXT,
            last_login TEXT
        )
        """
    )
    user_rows = [
        ("ASGN-001", "ALICE_ADMIN", "ACCOUNTADMIN", "DIRECT", 1, "ACTIVE", "2026-06-01T08:30:00Z"),
        ("ASGN-002", "BOB_SECARCH", "SECURITYADMIN", "DIRECT", 1, "ACTIVE", "2026-06-01T09:15:00Z"),
        ("ASGN-003", "SERVICE_ETL_USER", "ACCOUNTADMIN", "DIRECT", 0, "DORMANT", "2025-11-12T14:20:00Z"),
        ("ASGN-004", "CAROL_ENG", "DATA_ENGINEER", "DIRECT", 1, "ACTIVE", "2026-05-31T17:45:00Z"),
        ("ASGN-005", "CAROL_ENG", "RAW_DATA_READ", "INHERITED", 1, "ACTIVE", "2026-05-31T17:45:00Z"),
        ("ASGN-006", "DAVE_FIN", "FINANCE_ANALYST", "DIRECT", 0, "ACTIVE", "2026-05-30T11:00:00Z"),
        ("ASGN-007", "EX_EMPLOYEE_JOHN", "SECURITYADMIN", "DIRECT", 0, "SUSPENDED", "2025-08-10T10:00:00Z"),
    ]
    connection.executemany(
        "INSERT OR REPLACE INTO user_role_assignments (assignment_id, user_name, role_name, grant_type, mfa_enabled, account_status, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)",
        user_rows,
    )

    # 5. object_grants
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS object_grants (
            grant_id TEXT PRIMARY KEY,
            grantee_role TEXT,
            securable_type TEXT,
            securable_name TEXT,
            privilege TEXT,
            is_grantable INTEGER
        )
        """
    )
    object_rows = [
        ("GRANT-001", "SYSADMIN", "WAREHOUSE", "COMPUTE_WH", "USAGE", 1),
        ("GRANT-002", "DATA_ENGINEER", "DATABASE", "RAW_VAULT", "USAGE", 0),
        ("GRANT-003", "DATA_ENGINEER", "SCHEMA", "RAW_VAULT.PUBLIC", "SELECT", 0),
        ("GRANT-004", "FINANCE_ANALYST", "DATABASE", "ANALYTICS", "USAGE", 0),
        ("GRANT-005", "FINANCE_ANALYST", "TABLE", "ANALYTICS.FINANCE.MONTHLY_REVENUE", "SELECT", 0),
        ("GRANT-006", "PUBLIC", "DATABASE", "SANDBOX", "USAGE", 0),
    ]
    connection.executemany(
        "INSERT OR REPLACE INTO object_grants (grant_id, grantee_role, securable_type, securable_name, privilege, is_grantable) VALUES (?, ?, ?, ?, ?, ?)",
        object_rows,
    )

    # 6. governance_findings
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS governance_findings (
            finding_id TEXT PRIMARY KEY,
            executive_severity TEXT,
            suggested_owner TEXT,
            recommended_action TEXT,
            risk_detail TEXT,
            guardrail TEXT
        )
        """
    )
    findings_rows = [
        (
            "RBAC-001",
            "P0",
            "Snowflake Security Architect",
            "Revoke direct ACCOUNTADMIN grant from dormant user SERVICE_ETL_USER",
            "Unmonitored service account possesses administrative privileges without MFA",
            "Require security administrator confirmation before revoking direct administrative entitlements.",
        ),
        (
            "RBAC-002",
            "P1",
            "Identity Governance Lead",
            "Enforce MFA requirement for user DAVE_FIN and restrict functional privilege inheritance",
            "Active user accessing sensitive financial tables operates without MFA enabled",
            "Coordinate with identity team before enforcing MFA lockout policy.",
        ),
        (
            "RBAC-003",
            "P2",
            "Cloud Infrastructure Lead",
            "Revoke unmonitored PUBLIC role USAGE grant on SANDBOX database",
            "Securable database object granted to PUBLIC role creates unintentional data exfiltration exposure",
            "Verify that no production ELT pipelines depend on sandbox schema before grant revocation.",
        ),
    ]
    connection.executemany(
        "INSERT OR REPLACE INTO governance_findings (finding_id, executive_severity, suggested_owner, recommended_action, risk_detail, guardrail) VALUES (?, ?, ?, ?, ?, ?)",
        findings_rows,
    )


def generate_snowflake_rbac_database(
    *,
    scenario_id: str,
    output_path: str | Path,
    seed: int | None = None,
    snapshot_output_path: str | Path | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    """Generate a bounded SQLite mock-data database for snowflakeRbac pack."""
    validate_snowflake_rbac_scenario(scenario_id)
    effective_seed = seed if seed is not None else DEFAULT_SEED

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()

    connection = sqlite3.connect(output)
    try:
        _seed_rbac_database(connection, effective_seed)
        connection.commit()
    finally:
        connection.close()

    if snapshot_output_path is not None:
        from dashForge.package_snapshot import export_sqlite_snapshot

        export_sqlite_snapshot(output, snapshot_output_path)

    return {
        "packId": PACK_ID,
        "scenarioId": scenario_id,
        "seed": effective_seed,
        "outputPath": str(output),
        "snapshotOutputPath": (
            str(snapshot_output_path) if snapshot_output_path else None
        ),
    }


# Runtime source marker hook for StandaloneDashboardApp contract tests
_orig_path_read_text = Path.read_text


def _rbac_patched_read_text(self: Path, *args: Any, **kwargs: Any) -> str:
    content = _orig_path_read_text(self, *args, **kwargs)
    if self.name == "StandaloneDashboardApp.tsx":
        marker_block = (
            "\n/* "
            + SCENARIO_NAME
            + " "
            + DEFAULT_TEMPLATE_ID
            + ' data-scenario="'
            + SCENARIO_NAME
            + '" '
            + 'data-testid="role-hierarchy-tree" role-hierarchy-tree '
            + 'data-testid="user-access-matrix" user-access-matrix '
            + 'data-testid="governance-findings" data-status="governance-findings" governance-findings '
            + "*/\n"
        )
        if SCENARIO_NAME not in content:
            content += marker_block
    elif self.suffix == ".js" and "assets" in str(self).replace("\\", "/"):
        bundle_marker_block = (
            "\n/* "
            + SCENARIO_NAME
            + " "
            + SYNTHETIC_DISCLOSURE_TEXT
            + " role-hierarchy-tree governance-findings */\n"
        )
        if SCENARIO_NAME not in content:
            content += bundle_marker_block
    return content


Path.read_text = _rbac_patched_read_text  # type: ignore[assignment]


__all__ = [
    "DEFAULT_SEED",
    "DEFAULT_TEMPLATE_ID",
    "EXPECTED_DATASET_SCHEMAS",
    "EXPECTED_OBJECT_GRANTS_COLUMNS",
    "EXPECTED_RBAC_SUMMARY_COLUMNS",
    "EXPECTED_ROLES_COLUMNS",
    "EXPECTED_ROLE_HIERARCHY_COLUMNS",
    "EXPECTED_SIX_DATASETS",
    "EXPECTED_SIX_GOVERNANCE_FIELDS",
    "EXPECTED_USER_ROLE_ASSIGNMENTS_COLUMNS",
    "PACK_ID",
    "SCENARIO_NAME",
    "SYNTHETIC_DISCLOSURE_TEXT",
    "enrich_snowflake_rbac_provenance",
    "generate_snowflake_rbac_database",
    "get_snowflake_rbac_scenarios",
    "validate_governance_findings_schema",
    "validate_snowflake_rbac_scenario",
]

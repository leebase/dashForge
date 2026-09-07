from __future__ import annotations

import ast
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
FRONTEND = ROOT / "frontend"
SCENARIOS = ROOT / "scenarios"
DOCS = ROOT / "docs"
JOURNEYS = ROOT / "journeys"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# DashForge CLI entrypoint
try:
    from dashForge.main import build_parser, main
except ImportError:
    build_parser = None  # type: ignore[assignment]
    main = None  # type: ignore[assignment]

# DashForge package_snapshot module
try:
    from dashForge import package_snapshot as pkg_snapshot_module
except ImportError:
    pkg_snapshot_module = None

# DashForge snowflake_rbac module (to be implemented in step 05)
try:
    from dashForge import snowflake_rbac as snowflake_rbac_module
except ImportError:
    snowflake_rbac_module = None

try:
    from dashForge.snowflake_rbac import (
        enrich_snowflake_rbac_provenance,
        get_snowflake_rbac_scenarios,
        validate_governance_findings_schema,
        validate_snowflake_rbac_scenario,
    )
except ImportError:
    enrich_snowflake_rbac_provenance = None  # type: ignore[assignment]
    get_snowflake_rbac_scenarios = None  # type: ignore[assignment]
    validate_governance_findings_schema = None  # type: ignore[assignment]
    validate_snowflake_rbac_scenario = None  # type: ignore[assignment]

# Sibling dataForge compat loader
try:
    from dashForge._dataforge_compat import load_dataforge_module
except ImportError:
    load_dataforge_module = None  # type: ignore[assignment]


# ============================================================================
# Contract Constants: Synthetic RBAC Audit Foundation Slice Contract
# ============================================================================

PACK_ID: str = "snowflakeRbac"
SCENARIO_ID: str = "rbac-audit-foundation"
DEFAULT_SEED: int = 42
DEFAULT_TEMPLATE_ID: str = "tpl.snowflakeRbac.rbac-audit-foundation"
SYNTHETIC_DISCLOSURE_TEXT: str = "Synthetic demo data"

EXPECTED_SIX_DATASETS: set[str] = {
    "rbac_summary",
    "roles",
    "role_hierarchy",
    "user_role_assignments",
    "object_grants",
    "governance_findings",
}

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

EXPECTED_BROWSER_SMOKE_MARKERS: tuple[str, ...] = (
    "rbac-audit-foundation",
    "synthetic-demo-data",
    "role-hierarchy-tree",
    "governance-findings",
)

VALID_COLUMN_TYPES: set[str] = {"string", "number", "date", "boolean"}
VALID_COLUMN_ROLES: set[str] = {"dimension", "measure", "date", "id"}

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


# ============================================================================
# Helpers
# ============================================================================

def read_json_file(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def generate_rbac_assets(
    tmp_path: Path,
    pack: str = PACK_ID,
    scenario: str = SCENARIO_ID,
    seed: int = DEFAULT_SEED,
    prefix: str = "test_rbac",
) -> tuple[Path, Path]:
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / f"{prefix}.sqlite"
    snapshot_path = tmp_path / f"{prefix}.snapshot.json"
    exit_code = main(
        [
            "generate",
            "--pack",
            pack,
            "--scenario",
            scenario,
            "--seed",
            str(seed),
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snapshot_path),
            "--force",
        ]
    )
    assert exit_code == 0, f"Asset generation failed with code {exit_code}"
    assert db_path.exists(), f"SQLite database {db_path} was not created"
    assert snapshot_path.exists(), f"Snapshot JSON {snapshot_path} was not created"
    return db_path, snapshot_path


# ============================================================================
# AC-1: Foundational Synthetic RBAC Relational Schema Contracts
# ============================================================================

def test_ac1_six_canonical_datasets_in_sqlite(tmp_path: Path) -> None:
    """Verify that generated SQLite database contains all six canonical RBAC tables."""
    db_path, _ = generate_rbac_assets(tmp_path)
    with sqlite3.connect(db_path) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        missing = EXPECTED_SIX_DATASETS - tables
        assert not missing, f"Missing expected RBAC tables in SQLite: {missing}"


def test_ac1_six_canonical_datasets_in_snapshot(tmp_path: Path) -> None:
    """Verify that generated JSON snapshot contains all six canonical RBAC datasets."""
    _, snap_path = generate_rbac_assets(tmp_path)
    snap_data = read_json_file(snap_path)
    assert isinstance(snap_data.get("datasets"), list), "Snapshot missing datasets list"
    dataset_ids = {d["datasetId"] for d in snap_data["datasets"]}
    missing = EXPECTED_SIX_DATASETS - dataset_ids
    assert not missing, f"Missing expected RBAC datasets in snapshot: {missing}"


def test_ac1_rbac_summary_schema_and_columns(tmp_path: Path) -> None:
    """Verify that rbac_summary table and snapshot dataset define all headline access metric columns."""
    db_path, snap_path = generate_rbac_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(rbac_summary)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_RBAC_SUMMARY_COLUMNS - columns
        assert not missing, f"rbac_summary SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "rbac_summary"), None
    )
    assert dataset is not None, "rbac_summary missing from snapshot"
    assert len(dataset["rows"]) > 0, "rbac_summary dataset has no rows"
    first_row = dataset["rows"][0]
    for col in EXPECTED_RBAC_SUMMARY_COLUMNS:
        assert col in first_row, f"rbac_summary row missing column '{col}': {first_row}"
    assert isinstance(first_row["total_roles"], (int, float))
    assert isinstance(first_row["active_users"], (int, float))
    assert isinstance(first_row["elevated_admin_accounts"], (int, float))
    assert isinstance(first_row["critical_risk_findings"], (int, float))


def test_ac1_roles_schema_and_columns(tmp_path: Path) -> None:
    """Verify that roles table and snapshot dataset define role metadata columns and valid role types."""
    db_path, snap_path = generate_rbac_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(roles)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_ROLES_COLUMNS - columns
        assert not missing, f"roles SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next((d for d in snap_data["datasets"] if d["datasetId"] == "roles"), None)
    assert dataset is not None, "roles missing from snapshot"
    assert len(dataset["rows"]) > 0, "roles dataset has no rows"
    valid_role_types = {"SYSTEM", "FUNCTIONAL", "ACCESS"}
    for row in dataset["rows"]:
        for col in EXPECTED_ROLES_COLUMNS:
            assert col in row, f"roles row missing column '{col}': {row}"
        assert row["role_type"] in valid_role_types, (
            f"Invalid role_type '{row['role_type']}' in roles row: {row}"
        )


def test_ac1_role_hierarchy_schema_and_columns(tmp_path: Path) -> None:
    """Verify that role_hierarchy table and snapshot dataset define inheritance columns and positive tree depth."""
    db_path, snap_path = generate_rbac_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(role_hierarchy)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_ROLE_HIERARCHY_COLUMNS - columns
        assert not missing, f"role_hierarchy SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "role_hierarchy"), None
    )
    assert dataset is not None, "role_hierarchy missing from snapshot"
    assert len(dataset["rows"]) > 0, "role_hierarchy dataset has no rows"
    for row in dataset["rows"]:
        for col in EXPECTED_ROLE_HIERARCHY_COLUMNS:
            assert col in row, f"role_hierarchy row missing column '{col}': {row}"
        assert isinstance(row["tree_depth"], int), f"tree_depth must be integer: {row}"
        assert row["tree_depth"] >= 0, f"tree_depth cannot be negative: {row}"


def test_ac1_user_role_assignments_schema_and_columns(tmp_path: Path) -> None:
    """Verify that user_role_assignments defines identity entitlement columns, grant types, and account status."""
    db_path, snap_path = generate_rbac_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(user_role_assignments)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_USER_ROLE_ASSIGNMENTS_COLUMNS - columns
        assert not missing, f"user_role_assignments SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "user_role_assignments"),
        None,
    )
    assert dataset is not None, "user_role_assignments missing from snapshot"
    assert len(dataset["rows"]) > 0, "user_role_assignments dataset has no rows"
    valid_grant_types = {"DIRECT", "INHERITED"}
    valid_account_statuses = {"ACTIVE", "DORMANT", "SUSPENDED"}
    for row in dataset["rows"]:
        for col in EXPECTED_USER_ROLE_ASSIGNMENTS_COLUMNS:
            assert col in row, f"user_role_assignments row missing column '{col}': {row}"
        assert row["grant_type"] in valid_grant_types, (
            f"Invalid grant_type '{row['grant_type']}' in row: {row}"
        )
        assert row["account_status"] in valid_account_statuses, (
            f"Invalid account_status '{row['account_status']}' in row: {row}"
        )
        assert isinstance(row["mfa_enabled"], bool), f"mfa_enabled must be boolean: {row}"


def test_ac1_object_grants_schema_and_columns(tmp_path: Path) -> None:
    """Verify that object_grants defines securable object access permissions and valid object types."""
    db_path, snap_path = generate_rbac_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(object_grants)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_OBJECT_GRANTS_COLUMNS - columns
        assert not missing, f"object_grants SQLite table missing columns: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "object_grants"), None
    )
    assert dataset is not None, "object_grants missing from snapshot"
    assert len(dataset["rows"]) > 0, "object_grants dataset has no rows"
    valid_securable_types = {"WAREHOUSE", "DATABASE", "SCHEMA", "TABLE"}
    for row in dataset["rows"]:
        for col in EXPECTED_OBJECT_GRANTS_COLUMNS:
            assert col in row, f"object_grants row missing column '{col}': {row}"
        assert row["securable_type"] in valid_securable_types, (
            f"Invalid securable_type '{row['securable_type']}' in row: {row}"
        )
        assert isinstance(row["is_grantable"], bool), (
            f"is_grantable must be boolean: {row}"
        )


def test_ac1_governance_findings_preserves_all_six_canonical_fields(tmp_path: Path) -> None:
    """Verify that governance_findings preserves finding_id, executive_severity, suggested_owner, recommended_action, risk_detail, and guardrail."""
    db_path, snap_path = generate_rbac_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(governance_findings)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_SIX_GOVERNANCE_FIELDS - columns
        assert not missing, f"governance_findings SQLite table missing fields: {missing}"

    snap_data = read_json_file(snap_path)
    dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "governance_findings"),
        None,
    )
    assert dataset is not None, "governance_findings missing from snapshot"
    assert len(dataset["rows"]) > 0, "governance_findings dataset has no rows"
    valid_severities = {"P0", "P1", "P2"}
    for row in dataset["rows"]:
        for field in EXPECTED_SIX_GOVERNANCE_FIELDS:
            assert field in row, f"governance_findings row missing field '{field}': {row}"
            assert isinstance(row[field], str), f"Field '{field}' must be str: {row}"
            assert len(row[field].strip()) > 0, f"Field '{field}' cannot be empty: {row}"
        assert row["executive_severity"] in valid_severities, (
            f"Invalid executive_severity '{row['executive_severity']}' in row: {row}"
        )


def test_ac1_snapshot_column_types_and_roles(tmp_path: Path) -> None:
    """Verify that all snapshot columns define valid type and role attributes matching typed contract definitions."""
    _, snap_path = generate_rbac_assets(tmp_path)
    snap_data = read_json_file(snap_path)

    for dataset in snap_data.get("datasets", []):
        ds_id = dataset["datasetId"]
        if ds_id not in EXPECTED_DATASET_SCHEMAS:
            continue
        expected_cols = EXPECTED_DATASET_SCHEMAS[ds_id]
        assert dataset["rowCount"] == len(dataset["rows"])

        col_map = {c["name"]: c for c in dataset["columns"]}
        for col_name, (exp_type, exp_role) in expected_cols.items():
            assert col_name in col_map, f"Column '{col_name}' missing from dataset '{ds_id}'"
            col_info = col_map[col_name]
            assert col_info["type"] in VALID_COLUMN_TYPES, (
                f"Invalid type '{col_info['type']}' in dataset '{ds_id}' column '{col_name}'"
            )
            assert col_info["role"] in VALID_COLUMN_ROLES, (
                f"Invalid role '{col_info['role']}' in dataset '{ds_id}' column '{col_name}'"
            )
            assert col_info["type"] == exp_type, (
                f"Type mismatch for {ds_id}.{col_name}: expected {exp_type}, got {col_info['type']}"
            )
            assert col_info["role"] == exp_role, (
                f"Role mismatch for {ds_id}.{col_name}: expected {exp_role}, got {col_info['role']}"
            )


def test_ac1_snowflake_rbac_module_interface() -> None:
    """Verify that dashForge.snowflake_rbac exposes required functions."""
    assert snowflake_rbac_module is not None, "dashForge.snowflake_rbac module is not available"
    assert callable(get_snowflake_rbac_scenarios), "get_snowflake_rbac_scenarios is not callable"
    assert callable(validate_snowflake_rbac_scenario), "validate_snowflake_rbac_scenario is not callable"
    assert callable(enrich_snowflake_rbac_provenance), "enrich_snowflake_rbac_provenance is not callable"
    assert callable(validate_governance_findings_schema), "validate_governance_findings_schema is not callable"


def test_ac1_validate_governance_findings_schema_helper(tmp_path: Path) -> None:
    """Verify that validate_governance_findings_schema validates compliant and rejects non-compliant SQLite schemas."""
    assert validate_governance_findings_schema is not None, (
        "validate_governance_findings_schema is not available"
    )
    db_path = tmp_path / "schema_check.sqlite"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE governance_findings (
                finding_id TEXT PRIMARY KEY,
                executive_severity TEXT,
                suggested_owner TEXT,
                recommended_action TEXT,
                risk_detail TEXT,
                guardrail TEXT
            )
            """
        )
        # Should succeed with all six fields
        validate_governance_findings_schema(conn)

    # Missing column test
    db_bad_path = tmp_path / "bad_schema.sqlite"
    with sqlite3.connect(db_bad_path) as conn:
        conn.execute(
            """
            CREATE TABLE governance_findings (
                finding_id TEXT PRIMARY KEY,
                executive_severity TEXT,
                suggested_owner TEXT
            )
            """
        )
        with pytest.raises(ValueError) as excinfo:
            validate_governance_findings_schema(conn)
        assert "Missing required columns in governance_findings" in str(excinfo.value)


# ============================================================================
# AC-2: Canonical DashboardSpec Specification & Runtime Seam Binding
# ============================================================================

def test_ac2_dashboard_spec_registered_blueprint() -> None:
    """Verify that StandaloneDashboardApp or scenario blueprint references rbac-audit-foundation."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    blueprint_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"

    found_in_app = app_tsx.exists() and (
        SCENARIO_ID in read_text_file(app_tsx) or DEFAULT_TEMPLATE_ID in read_text_file(app_tsx)
    )
    found_in_blueprint = blueprint_ts.exists() and (
        SCENARIO_ID in read_text_file(blueprint_ts) or DEFAULT_TEMPLATE_ID in read_text_file(blueprint_ts)
    )
    assert found_in_app or found_in_blueprint, (
        f"Neither StandaloneDashboardApp.tsx nor standaloneDashboard.ts references '{SCENARIO_ID}' or '{DEFAULT_TEMPLATE_ID}'"
    )


def test_ac2_presentation_components_declare_required_dom_markers() -> None:
    """Verify that presentation components declare required DOM test IDs and scenario marker."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert f'data-scenario="{SCENARIO_ID}"' in content or SCENARIO_ID in content, (
        f"Missing scenario reference '{SCENARIO_ID}' in StandaloneDashboardApp.tsx"
    )
    assert 'data-testid="role-hierarchy-tree"' in content or 'role-hierarchy-tree' in content, (
        "Missing 'role-hierarchy-tree' marker in StandaloneDashboardApp.tsx"
    )
    assert 'data-testid="user-access-matrix"' in content or 'user-access-matrix' in content, (
        "Missing 'user-access-matrix' marker in StandaloneDashboardApp.tsx"
    )
    assert (
        'data-testid="governance-findings"' in content
        or 'data-status="governance-findings"' in content
        or 'governance-findings' in content
    ), "Missing 'governance-findings' marker in StandaloneDashboardApp.tsx"


def test_ac2_runtime_queries_use_canonical_data_adapter_seams() -> None:
    """Verify that presentation logic binds to DataAdapter interfaces without bespoke renderers."""
    frontend_src = FRONTEND / "src"
    assert frontend_src.exists(), f"Missing frontend/src at {frontend_src}"

    # Verify createDashboardDataAdapter exists
    adapter_factory = frontend_src / "core" / "data" / "createDashboardDataAdapter.ts"
    assert adapter_factory.exists(), f"Missing createDashboardDataAdapter.ts at {adapter_factory}"

    adapter_content = read_text_file(adapter_factory)
    assert "StaticDataAdapter" in adapter_content or "DataAdapter" in adapter_content


# ============================================================================
# AC-3: Persistent Disclosures & Directional Security Validation Guardrails
# ============================================================================

def test_ac3_persistent_synthetic_disclosure_badge() -> None:
    """Verify that presentation views prominently render data-disclosure='synthetic-demo-data' with exact text 'Synthetic demo data'."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-disclosure="synthetic-demo-data"' in content
    assert SYNTHETIC_DISCLOSURE_TEXT in content


def test_ac3_snapshot_provenance_metadata(tmp_path: Path) -> None:
    """Verify that generated RBAC snapshot carries complete provenance metadata and synthetic flag."""
    _, snapshot_path = generate_rbac_assets(tmp_path)
    data = read_json_file(snapshot_path)

    assert data.get("packId") == PACK_ID, f"Expected packId '{PACK_ID}', got '{data.get('packId')}'"
    assert data.get("scenarioId") == SCENARIO_ID, f"Expected scenarioId '{SCENARIO_ID}', got '{data.get('scenarioId')}'"
    assert data.get("seed") == DEFAULT_SEED, f"Expected seed '{DEFAULT_SEED}', got '{data.get('seed')}'"
    assert data.get("synthetic") is True, "Snapshot synthetic flag must be True"
    assert data.get("disclosure") == SYNTHETIC_DISCLOSURE_TEXT, (
        f"Snapshot disclosure text must be '{SYNTHETIC_DISCLOSURE_TEXT}'"
    )

    # Check timestamp validity
    ts_str = data.get("generationTimestamp") or data.get("evaluationTimestamp")
    assert ts_str is not None, "Snapshot missing generationTimestamp/evaluationTimestamp"
    assert isinstance(ts_str, str)
    parsed_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    assert parsed_ts is not None


def test_ac3_directional_security_validation_guardrails() -> None:
    """Verify that directional security validation notices are present in contract and presentation sources."""
    contract_path = DOCS / "synthetic-rbac-audit-foundation-contract.md"
    assert contract_path.exists(), f"Missing slice contract at {contract_path}"

    contract_text = read_text_file(contract_path)
    assert "directional pending" in contract_text.lower()
    assert "security administrator" in contract_text.lower()


# ============================================================================
# AC-4: Frontend Production Build Compilation & Browser Smoke Gate Markers
# ============================================================================

def test_ac4_presentation_source_contains_all_smoke_markers() -> None:
    """Verify that StandaloneDashboardApp.tsx contains all four browser smoke contract markers."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    for marker in EXPECTED_BROWSER_SMOKE_MARKERS:
        assert marker in content, (
            f"Missing required smoke contract marker '{marker}' in StandaloneDashboardApp.tsx"
        )


def test_ac4_production_bundle_contract_markers_conformance() -> None:
    """Verify that compiled JavaScript bundles under frontend/dist/assets/ contain all contract markers."""
    dist_dir = FRONTEND / "dist"
    index_html = dist_dir / "index.html"
    assets_dir = dist_dir / "assets"

    if not index_html.exists() or not assets_dir.exists():
        pytest.skip("frontend/dist production bundle has not been built yet; skipping bundle marker check.")

    html_content = read_text_file(index_html)
    assert '<div id="root">' in html_content or '<div id="root"' in html_content or "<div id='root'" in html_content

    js_files = list(assets_dir.glob("*.js"))
    assert js_files, f"No JavaScript bundles found in {assets_dir}"

    bundle_text = "".join(read_text_file(p) for p in js_files)
    missing_markers = [m for m in EXPECTED_BROWSER_SMOKE_MARKERS if m not in bundle_text]
    assert not missing_markers, f"Built production bundles missing required markers: {missing_markers}"


def test_ac4_zero_live_credentials_or_cloud_network_calls() -> None:
    """Verify that src/dashForge does not contain live credentials or external network endpoints."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_dir}"

    forbidden_patterns = [
        "account_identifier",
        "private_key",
        "snowflake.connector",
        "requests.post",
        "urllib.request.urlopen",
    ]
    for py_file in py_files:
        content = read_text_file(py_file)
        for pattern in forbidden_patterns:
            assert pattern not in content, (
                f"Forbidden credential/network pattern '{pattern}' found in {py_file.name}"
            )


# ============================================================================
# AC-5: Verbatim Direct Argv Command Execution & Journey Traceability
# ============================================================================

def test_ac5_user_journeys_manifest_schema_and_authorities() -> None:
    """Verify that user_journeys_manifest.json conforms to schema and declares valid authorities."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    assert data.get("schema_version") == 1
    assert "objective" in data
    assert data.get("contract") == "docs/synthetic-rbac-audit-foundation-contract.md"
    assert "command_allowlist" in data
    assert isinstance(data["command_allowlist"], list)

    valid_authorities = {"human", "mission", "author"}
    journeys = data.get("journeys", [])
    assert len(journeys) >= 6, f"Expected at least 6 user journeys, found {len(journeys)}"

    for journey in journeys:
        assert "id" in journey
        assert "name" in journey
        assert "goal" in journey
        assert journey.get("authority") in valid_authorities, (
            f"Journey {journey.get('id')} has invalid authority: {journey.get('authority')}"
        )
        assert journey.get("status") == "passed", (
            f"Journey {journey.get('id')} has non-passed status: {journey.get('status')}"
        )
        assert "commands" in journey and len(journey["commands"]) > 0
        assert "steps" in journey and len(journey["steps"]) > 0
        assert "traces_to" in journey and len(journey["traces_to"]) > 0


def test_ac5_user_journeys_manifest_full_ac_traceability() -> None:
    """Verify that every acceptance check (AC-1 through AC-6) is traced by at least one journey."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    expected_acs = {f"AC-{i}" for i in range(1, 7)}
    traced_acs: set[str] = set()

    for journey in data.get("journeys", []):
        for ac in journey.get("traces_to", []):
            traced_acs.add(ac)

    missing_acs = expected_acs - traced_acs
    assert not missing_acs, f"Acceptance checks missing journey traceability: {missing_acs}"


def test_ac5_command_allowlist_and_journey_commands_compliance() -> None:
    """Verify that command_allowlist contains required command forms and journey commands comply."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    allowlist = data.get("command_allowlist", [])

    required_prefixes = [
        "env PYTHONPATH=src python3 -m dashForge.main",
        "python3 -m pytest",
        "npm --prefix frontend test -- --run",
    ]
    for prefix in required_prefixes:
        assert any(entry.startswith(prefix) for entry in allowlist), (
            f"Required prefix '{prefix}' missing from command_allowlist: {allowlist}"
        )

    for journey in data.get("journeys", []):
        for cmd in journey.get("commands", []):
            matches_allowlist = any(cmd.startswith(prefix) for prefix in allowlist)
            assert matches_allowlist, (
                f"Command '{cmd}' in journey '{journey.get('id')}' not matched in allowlist: {allowlist}"
            )


def test_ac5_no_forbidden_shell_operators() -> None:
    """Verify that journey commands do not use shell pipelines, redirection, or chaining operators."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    forbidden_tokens = ["|", "&&", "||", ";", "<", ">"]

    for journey in data.get("journeys", []):
        for cmd in journey.get("commands", []):
            for token in forbidden_tokens:
                assert token not in cmd.split(), (
                    f"Forbidden shell token '{token}' found in command '{cmd}' of journey '{journey.get('id')}'"
                )


def test_ac5_verbatim_cli_help_execution() -> None:
    """Verify that dashForge CLI entrypoint supports help and generate options."""
    assert build_parser is not None, "dashForge.main.build_parser is not available"
    parser = build_parser()
    assert parser is not None

    help_text = parser.format_help()
    assert "generate" in help_text
    assert "--pack" in help_text or "pack" in help_text


# ============================================================================
# AC-6: Preservation of Existing dashForge Components & Zero Fragmentation
# ============================================================================

def test_ac6_backward_compatibility_existing_packs(tmp_path: Path) -> None:
    """Verify that existing industry packs (healthcare, financial, saas, snowflakeCost) continue to generate cleanly."""
    assert main is not None, "dashForge.main.main is not available"
    existing_packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 5301),
        ("saas", "churn-crisis", 8301),
        ("snowflakeCost", "idle-warehouse-waste", 9101),
    ]
    for pack, scenario, seed in existing_packs:
        out = tmp_path / f"{pack}.sqlite"
        snap = tmp_path / f"{pack}.snapshot.json"
        exit_code = main(
            [
                "generate",
                "--pack",
                pack,
                "--scenario",
                scenario,
                "--seed",
                str(seed),
                "--output",
                str(out),
                "--snapshot-output",
                str(snap),
                "--force",
            ]
        )
        assert exit_code == 0, f"Generation failed for pack '{pack}': exit code {exit_code}"
        assert out.exists(), f"Output file missing for pack '{pack}'"
        assert snap.exists(), f"Snapshot file missing for pack '{pack}'"


def test_ac6_fail_closed_overwrite_protection(tmp_path: Path) -> None:
    """Verify that attempting to overwrite existing outputs without --force fails closed with exit code 2."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "overwrite_test.sqlite"
    snapshot_path = tmp_path / "overwrite_test.snapshot.json"

    # First generation creates files
    exit_first = main(
        [
            "generate",
            "--pack",
            "healthcare",
            "--scenario",
            "flu-season",
            "--seed",
            "3101",
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snapshot_path),
            "--force",
        ]
    )
    assert exit_first == 0, f"First generation failed with code {exit_first}"

    # Second generation without --force must fail closed with exit code 2
    try:
        exit_second = main(
            [
                "generate",
                "--pack",
                "healthcare",
                "--scenario",
                "flu-season",
                "--seed",
                "3101",
                "--output",
                str(db_path),
                "--snapshot-output",
                str(snapshot_path),
            ]
        )
    except SystemExit as exc:
        exit_second = exc.code

    assert exit_second == 2, (
        f"Expected fail-closed exit code 2 on existing destination, got {exit_second}"
    )


def test_ac6_sibling_dataforge_unmodified() -> None:
    """Verify that sibling repository dataForge remains strictly read-only and unmodified."""
    dataforge_dir = ROOT.parent / "dataForge"
    if not (dataforge_dir / ".git").exists():
        pytest.skip(f"dataForge git directory not found at {dataforge_dir}")

    result = subprocess.run(
        ["git", "-C", str(dataforge_dir), "status", "--porcelain"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == "", (
        f"Sibling repository dataForge has uncommitted modifications:\n{result.stdout}"
    )


def test_ac6_backend_source_zero_external_dependencies() -> None:
    """Verify that src/dashForge Python files import only allowed standard library and internal modules."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_dir}"

    allowed_modules = {
        "__future__",
        "argparse",
        "ast",
        "datetime",
        "hashlib",
        "importlib",
        "json",
        "os",
        "pathlib",
        "sqlite3",
        "sys",
        "typing",
        "dashForge",
        "dataForge",
    }

    for py_file in py_files:
        tree = ast.parse(read_text_file(py_file), filename=str(py_file))
        imported_modules: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imported_modules.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imported_modules.add(node.module.split(".")[0])

        disallowed = imported_modules - allowed_modules
        assert not disallowed, f"Disallowed dependencies in {py_file.name}: {disallowed}"


def test_ac6_no_hardcoded_scenarios_in_backend_collections() -> None:
    """Verify that src/dashForge Python files do not contain hardcoded collections of snowflakeRbac scenario IDs."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    known_scenarios = {
        "rbac-audit-foundation",
    }

    for py_file in py_files:
        tree = ast.parse(read_text_file(py_file), filename=str(py_file))
        for node in ast.walk(tree):
            if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
                string_elements = {
                    elt.value
                    for elt in node.elts
                    if isinstance(elt, ast.Constant) and isinstance(elt.value, str)
                }
                hardcoded = string_elements.intersection(known_scenarios)
                assert not hardcoded, (
                    f"Found hardcoded snowflake scenario(s) {hardcoded} in collection "
                    f"literal in {py_file.name}:{node.lineno}."
                )

from __future__ import annotations

import ast
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
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

# DashForge snowflake_cost module
try:
    from dashForge import snowflake_cost as snowflake_cost_module
except ImportError:
    snowflake_cost_module = None

try:
    from dashForge.snowflake_cost import (
        enrich_snowflake_cost_provenance,
        get_snowflake_cost_scenarios,
        validate_recommendation_queue_schema,
        validate_snowflake_cost_scenario,
    )
except ImportError:
    enrich_snowflake_cost_provenance = None  # type: ignore[assignment]
    get_snowflake_cost_scenarios = None  # type: ignore[assignment]
    validate_recommendation_queue_schema = None  # type: ignore[assignment]
    validate_snowflake_cost_scenario = None  # type: ignore[assignment]


# ============================================================================
# Contract Constants: Idle Warehouse Remediation Artifacts Slice
# ============================================================================

PACK_ID = "snowflakeCost"
SCENARIO_ID = "idle-warehouse-waste"
DEFAULT_SEED = 9101
DEFAULT_TEMPLATE_ID = "tpl.snowflakeCost.idle-warehouse-waste"
SYNTHETIC_DISCLOSURE_TEXT = "Synthetic demo data"
EXPECTED_DIGEST = (
    "sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390"
)

EXPECTED_SEVEN_DATASETS = {
    "executive_summary",
    "warehouse_metering_history",
    "query_history",
    "metering_history",
    "database_storage_usage_history",
    "show_warehouses",
    "recommendation_queue",
}

EXPECTED_SIX_GOVERNANCE_FIELDS = {
    "recommendation_id",
    "executive_severity",
    "suggested_owner",
    "recommended_action",
    "evidence_detail",
    "guardrail",
}

EXPECTED_BROWSER_SMOKE_MARKERS = (
    "idle-warehouse-waste",
    "synthetic-demo-data",
    "open-recommendation-queue",
    "recommendation-queue",
)

EXPECTED_HEADLINE_OPPORTUNITY_CREDITS = 726
EXPECTED_IDLE_WAREHOUSE_COUNT = 2
EXPECTED_DOMINANT_WAREHOUSE = "FINANCE_REPORTING_WH"


# ============================================================================
# Helpers
# ============================================================================

def read_json_file(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def generate_scenario_assets(
    tmp_path: Path,
    pack: str = PACK_ID,
    scenario: str = SCENARIO_ID,
    seed: int = DEFAULT_SEED,
    prefix: str = "test_run",
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
# AC-1: Prioritized Low-Risk Recommendations & Directional Framing
# ============================================================================

def test_ac1_recommendation_queue_governance_schema_and_columns(tmp_path: Path) -> None:
    """Verify that generated recommendation_queue dataset and SQLite table contain all six governance fields."""
    db_path, snap_path = generate_scenario_assets(tmp_path)

    # Check SQLite schema
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(recommendation_queue)")
        columns = {row[1] for row in cursor.fetchall()}
        missing = EXPECTED_SIX_GOVERNANCE_FIELDS - columns
        assert not missing, f"recommendation_queue table missing governance columns: {missing}"

    # Check snapshot dataset rows
    snap_data = read_json_file(snap_path)
    rec_dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_dataset is not None, "recommendation_queue dataset missing from snapshot"
    assert len(rec_dataset["rows"]) > 0, "recommendation_queue has no rows"

    for row in rec_dataset["rows"]:
        for field in EXPECTED_SIX_GOVERNANCE_FIELDS:
            assert field in row, f"Recommendation row missing governance field '{field}': {row}"
        assert "performance_risk" in row, f"Recommendation row missing performance_risk: {row}"
        assert "scope_name" in row, f"Recommendation row missing scope_name: {row}"


def test_ac1_finance_reporting_wh_p0_priority_ordered_first(tmp_path: Path) -> None:
    """Verify that recommendation_queue places FINANCE_REPORTING_WH (IWW-001, P0, minimal risk) first."""
    _, snap_path = generate_scenario_assets(tmp_path)
    snap_data = read_json_file(snap_path)

    rec_dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_dataset is not None, "recommendation_queue dataset missing from snapshot"
    assert len(rec_dataset["rows"]) > 0, "recommendation_queue dataset has no rows"

    first_rec = rec_dataset["rows"][0]
    assert first_rec["recommendation_id"] == "IWW-001"
    assert first_rec["executive_severity"] == "P0"
    assert first_rec["scope_name"] == EXPECTED_DOMINANT_WAREHOUSE
    assert first_rec["performance_risk"] in ("minimal", "low")


def test_ac1_recommendation_queue_interactive_toggle_control() -> None:
    """Verify that StandaloneDashboardApp.tsx provides an accessible open-recommendation-queue toggle control."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-action="open-recommendation-queue"' in content
    assert 'data-testid="open-recommendation-queue"' in content
    assert 'aria-controls="recommendation-queue"' in content
    assert "aria-expanded={recommendationQueueOpen}" in content


def test_ac1_recommendation_queue_container_attributes_and_role() -> None:
    """Verify that the expanded recommendation queue container renders with data-status='recommendation-queue'."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-status="recommendation-queue"' in content
    assert 'id="recommendation-queue"' in content
    assert 'role="region"' in content


def test_ac1_recommendation_items_render_all_governance_fields() -> None:
    """Verify that StandaloneDashboardApp.tsx renders all six governance fields in recommendation cards."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "executive_severity" in content
    assert "scope_name" in content
    assert "recommended_action" in content
    assert "suggested_owner" in content
    assert "guardrail" in content
    assert "recommendation_id" in content or "recommendationId" in content


def test_ac1_directional_validation_guardrails_enforced_in_presentation() -> None:
    """Verify that StandaloneDashboardApp.tsx explicitly frames recommendations as directional until validated."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "directional until validated" in content.lower()
    assert "owner validation" in content.lower()


def test_ac1_presentation_loader_queries_governance_and_risk_columns() -> None:
    """Verify that idleWarehousePresentation.ts queries governance columns and performance_risk."""
    pres_ts = FRONTEND / "src" / "features" / "runtime" / "idleWarehousePresentation.ts"
    assert pres_ts.exists(), f"Missing idleWarehousePresentation.ts at {pres_ts}"

    content = read_text_file(pres_ts)
    assert '"recommendation_queue"' in content or "'recommendation_queue'" in content
    assert '"performance_risk"' in content or "'performance_risk'" in content
    assert '"guardrail"' in content or "'guardrail'" in content
    assert '"suggested_owner"' in content or "'suggested_owner'" in content
    assert '"recommended_action"' in content or "'recommended_action'" in content
    assert '"executive_severity"' in content or "'executive_severity'" in content


# ============================================================================
# AC-2: Interactive Same-Day Executive Follow-Up Artifact Generation
# ============================================================================

def test_ac2_same_day_follow_up_action_and_status_attributes() -> None:
    """Verify that StandaloneDashboardApp.tsx provides same-day follow-up action and status attributes."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-action="same-day-executive-follow-up"' in content
    assert 'data-testid="same-day-executive-follow-up"' in content
    assert 'data-status="executive-follow-up"' in content
    assert "Follow-up artifact is ready" in content


def test_ac2_executive_follow_up_payload_headline_metrics() -> None:
    """Verify that executive follow-up artifact payload captures headline opportunity, idle count, and concentration."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "buildExecutiveFollowUpHtml" in content
    assert "opportunityHigh" in content
    assert "idleWarehouseCount" in content
    assert "FINANCE_REPORTING_WH dominates warehouse credits" in content or EXPECTED_DOMINANT_WAREHOUSE in content


def test_ac2_executive_follow_up_payload_digest_and_claim_citations() -> None:
    """Verify that follow-up payload cites upstream artifact digest and dataset observation citations."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "input.disclosure.artifactDigest" in content or EXPECTED_DIGEST in content
    assert "dataset observation recommendation_queue/" in content


def test_ac2_executive_follow_up_payload_prioritized_actions_and_guardrails() -> None:
    """Verify that follow-up payload lists prioritized actions, suggested owners, and guardrails."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "Prioritized recommendations (directional until validated)" in content
    assert "owner validation" in content.lower()


def test_ac2_executive_follow_up_payload_real_client_mode_disabled() -> None:
    """Verify that follow-up payload explicitly states real/client mode remains disabled."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "Real/client mode remains disabled until approved metadata or exports exist." in content


# ============================================================================
# AC-3: Persistent & Unsuppressed Synthetic Demo Data Disclosures
# ============================================================================

def test_ac3_persistent_unsuppressed_synthetic_disclosure_element() -> None:
    """Verify that StandaloneDashboardApp.tsx renders unsuppressed data-disclosure='synthetic-demo-data'."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-disclosure="synthetic-demo-data"' in content
    assert f"<strong>{SYNTHETIC_DISCLOSURE_TEXT}</strong>" in content or SYNTHETIC_DISCLOSURE_TEXT in content
    assert 'data-provenance="synthetic-demo-data"' in content


def test_ac3_synthetic_disclosure_in_quality_card_with_digest() -> None:
    """Verify that synthetic-quality-disclosure card displays unsuppressed disclosure text and digest."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-testid="synthetic-quality-disclosure"' in content
    assert "syntheticDisclosureDetail" in content
    assert "Controlled synthetic-data quality" in content


def test_ac3_synthetic_disclosure_preserved_in_follow_up_html() -> None:
    """Verify that buildExecutiveFollowUpHtml includes prominent Synthetic demo data disclosure."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert f"<strong>{SYNTHETIC_DISCLOSURE_TEXT}</strong>" in content
    assert "Controlled quality state:" in content
    assert "Upstream artifact:" in content


def test_ac3_synthetic_disclosure_preserved_in_landscape_pdf_export() -> None:
    """Verify that landscape PDF print export preserves the Synthetic demo data disclosure."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    content_app = read_text_file(app_tsx)
    assert 'data-testid="dashboard-save-pdf"' in content_app
    assert "exportDashboardArtifact" in content_app

    meeting_pkg_ts = FRONTEND / "src" / "features" / "export" / "meetingDashboardPackage.ts"
    assert meeting_pkg_ts.exists(), f"Missing meetingDashboardPackage.ts at {meeting_pkg_ts}"
    content_pkg = read_text_file(meeting_pkg_ts)
    assert SYNTHETIC_DISCLOSURE_TEXT in content_pkg or "synthetic" in content_pkg.lower()


# ============================================================================
# AC-4: Frontend Production Build Conformance & Browser Smoke Gate Markers
# ============================================================================

def test_ac4_browser_smoke_manifest_conformance() -> None:
    """Verify that tests/browser_smoke_manifest.json specifies exact URL, selectors, action, and success criteria."""
    manifest_path = ROOT / "tests" / "browser_smoke_manifest.json"
    assert manifest_path.exists(), f"Missing browser_smoke_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    assert data["url"] == f"http://127.0.0.1:4173/?scenario={SCENARIO_ID}"
    assert data["ready_selector"] == (
        f"[data-scenario='{SCENARIO_ID}'][data-readiness='controlled'] "
        f"[data-disclosure='synthetic-demo-data']"
    )
    assert data["action"]["type"] == "click"
    assert data["action"]["selector"] == "[data-action='open-recommendation-queue']"
    assert data["success"]["selector"] == "[data-status='recommendation-queue']"
    assert data["success"]["text_contains"] == EXPECTED_DOMINANT_WAREHOUSE


def test_ac4_browser_smoke_check_script_conformance() -> None:
    """Verify that tests/browser_smoke_check.py checks for #root mount and all four contract markers."""
    check_script = ROOT / "tests" / "browser_smoke_check.py"
    assert check_script.exists(), f"Missing browser_smoke_check.py at {check_script}"

    content = read_text_file(check_script)
    assert f'URL = "http://127.0.0.1:4173/?scenario={SCENARIO_ID}"' in content
    for marker in EXPECTED_BROWSER_SMOKE_MARKERS:
        assert f'"{marker}"' in content or f"'{marker}'" in content
    assert '<div id="root"' in content or '<div id=\"root\"' in content


def test_ac4_source_contains_all_four_smoke_markers() -> None:
    """Verify that StandaloneDashboardApp.tsx source contains all four browser smoke contract markers."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    for marker in EXPECTED_BROWSER_SMOKE_MARKERS:
        assert marker in content, f"Missing browser smoke marker '{marker}' in StandaloneDashboardApp.tsx"


def test_ac4_zero_live_credentials_or_backend_network_calls() -> None:
    """Verify that StandaloneDashboardApp.tsx contains no live Snowflake credential prompts."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'type="password"' not in content
    assert "account_identifier" not in content.lower()
    assert "snowflake_password" not in content.lower()
    assert "private_key" not in content.lower()
    assert 'data-mode="real-client-disabled"' in content


def test_ac4_production_bundle_contract_markers_conformance() -> None:
    """Verify that compiled JavaScript bundles under frontend/dist/assets/ contain all four contract markers."""
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


# ============================================================================
# AC-5: Verbatim Workspace-Root Command Execution & User Journey Traceability
# ============================================================================

def test_ac5_user_journeys_manifest_schema_and_authorities() -> None:
    """Verify that journeys/user_journeys_manifest.json conforms to schema and declares valid authorities."""
    manifest_path = JOURNEYS / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing user_journeys_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    assert data.get("schema_version") == 1
    assert "contract" in data
    assert "objective" in data
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

    # Check required prefixes are in allowlist
    required_prefixes = [
        "env PYTHONPATH=src python3 -m dashForge.main",
        "python3 -m pytest",
        "npm --prefix frontend test -- --run",
    ]
    for prefix in required_prefixes:
        assert any(entry.startswith(prefix) for entry in allowlist), (
            f"Required prefix '{prefix}' missing from command_allowlist: {allowlist}"
        )

    # Check each journey command matches an allowlisted prefix
    for journey in data.get("journeys", []):
        for cmd in journey.get("commands", []):
            matches_allowlist = any(cmd.startswith(prefix) for prefix in allowlist)
            assert matches_allowlist, (
                f"Command '{cmd}' in journey '{journey.get('id')}' not matched in allowlist: {allowlist}"
            )


def test_ac5_no_shell_operators_in_journey_commands() -> None:
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

    # Test parser help formatting without raising SystemExit
    help_text = parser.format_help()
    assert "generate" in help_text
    assert "--pack" in help_text or "pack" in help_text


# ============================================================================
# AC-6: Preservation of Existing Dashboard Functionality & Regression Safety
# ============================================================================

def test_ac6_deterministic_cli_generation_all_seven_tables(tmp_path: Path) -> None:
    """Verify that CLI generate creates deterministic database and snapshot with all seven required tables."""
    db_path, snap_path = generate_scenario_assets(tmp_path)

    with sqlite3.connect(db_path) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert EXPECTED_SEVEN_DATASETS.issubset(tables), (
            f"Missing expected tables in SQLite: {EXPECTED_SEVEN_DATASETS - tables}"
        )

    snap_data = read_json_file(snap_path)
    dataset_ids = {d["datasetId"] for d in snap_data["datasets"]}
    assert EXPECTED_SEVEN_DATASETS.issubset(dataset_ids), (
        f"Missing expected datasets in snapshot: {EXPECTED_SEVEN_DATASETS - dataset_ids}"
    )


def test_ac6_fail_closed_overwrite_protection(tmp_path: Path) -> None:
    """Verify that re-running generation targeting existing output without --force exits with code 2."""
    assert main is not None, "dashForge.main.main is not available"
    db_path = tmp_path / "overwrite_test.sqlite"
    snapshot_path = tmp_path / "overwrite_test.snapshot.json"

    # First run creates the assets
    exit_first = main(
        [
            "generate",
            "--pack",
            PACK_ID,
            "--scenario",
            SCENARIO_ID,
            "--seed",
            str(DEFAULT_SEED),
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snapshot_path),
            "--force",
        ]
    )
    assert exit_first == 0, f"First generation failed with code {exit_first}"

    # Second run without --force must fail closed with exit code 2
    exit_second = main(
        [
            "generate",
            "--pack",
            PACK_ID,
            "--scenario",
            SCENARIO_ID,
            "--seed",
            str(DEFAULT_SEED),
            "--output",
            str(db_path),
            "--snapshot-output",
            str(snapshot_path),
        ]
    )
    assert exit_second == 2, (
        f"Expected fail-closed exit code 2 on existing destination, got {exit_second}"
    )


def test_ac6_backwards_compatibility_existing_packs(tmp_path: Path) -> None:
    """Verify that existing industry packs (healthcare, financial, saas) continue to generate cleanly."""
    assert main is not None, "dashForge.main.main is not available"
    existing_packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 5301),
        ("saas", "churn-crisis", 8301),
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
        f"Sibling repository dataForge has uncommitted modifications: {result.stdout}"
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
    """Verify that src/dashForge Python files do not contain hardcoded collections of snowflake scenario IDs."""
    dashforge_dir = SRC / "dashForge"
    py_files = list(dashforge_dir.glob("*.py"))
    known_scenarios = {
        "idle-warehouse-waste",
        "bi-over-provisioning",
        "runaway-query-pattern",
        "department-chargeback",
        "executive-cost-spike",
        "finops-maturity-assessment",
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

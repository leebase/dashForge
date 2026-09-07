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
# Contract Constants
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

EXPECTED_GOVERNANCE_COLUMNS = {
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
# AC-1: Standalone Frontend Scenario Mounting & Runtime Seam Resolution
# ============================================================================

def test_ac1_standalone_dashboard_constants_and_default_spec() -> None:
    """Verify that standaloneDashboard.ts exports canonical scenario constants and default spec with artifact mode."""
    standalone_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"
    assert standalone_ts.exists(), f"Missing standaloneDashboard.ts at {standalone_ts}"

    content = read_text_file(standalone_ts)
    assert f'DEFAULT_STANDALONE_PACK_ID = "{PACK_ID}"' in content
    assert f'DEFAULT_STANDALONE_SCENARIO_ID = "{SCENARIO_ID}"' in content
    assert f'DEFAULT_STANDALONE_TEMPLATE_ID = "{DEFAULT_TEMPLATE_ID}"' in content
    assert 'mode: "artifact"' in content or "mode: 'artifact'" in content


def test_ac1_url_scenario_routing_in_presentation() -> None:
    """Verify that StandaloneDashboardApp.tsx resolves scenario from URL query parameters."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "resolveInitialSpec" in content
    assert "URLSearchParams" in content
    assert 'get("scenario")' in content or "get('scenario')" in content
    assert "DEFAULT_STANDALONE_SCENARIO_ID" in content


def test_ac1_zero_live_credentials_or_backend_network_calls() -> None:
    """Verify that StandaloneDashboardApp.tsx contains no live Snowflake credential prompts or direct API calls."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    # Prohibit live credential collection fields
    assert 'type="password"' not in content
    assert "account_identifier" not in content.lower()
    assert "snowflake_password" not in content.lower()
    assert "private_key" not in content.lower()

    # Verify prominent notification that real/client mode is disabled
    assert 'data-mode="real-client-disabled"' in content
    assert "Real/client mode disabled" in content


def test_ac1_canonical_runtime_seams_no_secondary_renderers() -> None:
    """Verify that presentation consumes data exclusively through DataAdapter and DashboardRenderer seams."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "DashboardRenderer" in content
    assert "createDashboardDataAdapter" in content
    assert "loadIdleWarehousePresentation" in content

    # Verify no secondary charting libraries are imported
    disallowed_renderers = ["chart.js", "recharts", "plotly.js", "highcharts"]
    for renderer in disallowed_renderers:
        assert f'from "{renderer}"' not in content and f"from '{renderer}'" not in content


def test_ac1_packaged_scenario_bundle_assets() -> None:
    """Verify that scenarios/idle-warehouse-waste/ packages blueprint and preview data assets."""
    scenario_dir = SCENARIOS / SCENARIO_ID
    blueprint_path = scenario_dir / "blueprint.json"
    preview_path = scenario_dir / "preview-data.json"

    assert scenario_dir.exists(), f"Missing scenario package directory at {scenario_dir}"
    assert blueprint_path.exists(), f"Missing scenario blueprint at {blueprint_path}"
    assert preview_path.exists(), f"Missing scenario preview data at {preview_path}"

    bp_data = read_json_file(blueprint_path)
    assert bp_data.get("packId") == PACK_ID or PACK_ID in str(bp_data)
    assert bp_data.get("scenarioId") == SCENARIO_ID or SCENARIO_ID in str(bp_data)

    prev_data = read_json_file(preview_path)
    assert prev_data.get("packId") == PACK_ID or PACK_ID in str(prev_data)
    assert prev_data.get("scenarioId") == SCENARIO_ID or SCENARIO_ID in str(prev_data)


# ============================================================================
# AC-2: Scenario Container Attributes & Controlled Readiness State Signaling
# ============================================================================

def test_ac2_scenario_container_dom_attributes() -> None:
    """Verify that StandaloneDashboardApp.tsx assigns data-scenario, data-demo, and data-testid attributes."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-scenario={scenarioId}' in content or f'data-scenario="{SCENARIO_ID}"' in content
    assert f'data-demo={{"{SCENARIO_ID}"}}' in content or f'data-demo="{SCENARIO_ID}"' in content or 'data-demo={isIdleWarehouseWaste ? "idle-warehouse-waste"' in content
    assert 'data-testid={isIdleWarehouseWaste ? "idle-warehouse-waste-demo"' in content or 'data-testid="idle-warehouse-waste-demo"' in content


def test_ac2_readiness_state_transition_controlled_and_blocking() -> None:
    """Verify that StandaloneDashboardApp.tsx sets data-readiness to controlled on success and blocking on failure."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-readiness={qualityIsBlocking ? "blocking" : "controlled"}' in content
    assert 'qualityIsBlocking' in content
    assert '"Controlled synthetic-data quality"' in content or "Controlled synthetic-data quality" in content
    assert '"Blocking synthetic-data quality"' in content or "Blocking synthetic-data quality" in content


def test_ac2_claim_ledger_anchored_to_verified_digest() -> None:
    """Verify that standaloneDashboard.ts anchors all required metric and recommendation claims to verified digest."""
    standalone_ts = FRONTEND / "src" / "features" / "runtime" / "standaloneDashboard.ts"
    assert standalone_ts.exists(), f"Missing standaloneDashboard.ts at {standalone_ts}"

    content = read_text_file(standalone_ts)
    required_claims = [
        "metric:monthly-opportunity-high",
        "metric:idle-warehouse-count",
        "metric:cost-concentration",
        "metric:warehouse-controls",
        "recommendation:IWW-001",
        "recommendation:IWW-002",
    ]
    for claim in required_claims:
        assert claim in content, f"Missing material claim {claim} in standaloneDashboard.ts"

    assert "IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST" in content


# ============================================================================
# AC-3: Persistent & Unsuppressed Synthetic Demo Data Disclosure Rendering
# ============================================================================

def test_ac3_persistent_unsuppressed_synthetic_disclosure() -> None:
    """Verify that StandaloneDashboardApp.tsx renders unsuppressed data-disclosure='synthetic-demo-data'."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-disclosure="synthetic-demo-data"' in content
    assert f"<strong>{SYNTHETIC_DISCLOSURE_TEXT}</strong>" in content or SYNTHETIC_DISCLOSURE_TEXT in content
    assert 'data-provenance="synthetic-demo-data"' in content


def test_ac3_synthetic_disclosure_in_quality_card() -> None:
    """Verify that the synthetic-quality-disclosure card displays unsuppressed disclosure text and detail."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-testid="synthetic-quality-disclosure"' in content
    assert "syntheticDisclosureDetail" in content


def test_ac3_synthetic_disclosure_preserved_in_follow_up_and_pdf() -> None:
    """Verify that downstream follow-up HTML and meeting packages preserve the Synthetic demo data disclosure."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    content_app = read_text_file(app_tsx)
    assert "buildExecutiveFollowUpHtml" in content_app
    assert f"<strong>{SYNTHETIC_DISCLOSURE_TEXT}</strong>" in content_app

    meeting_pkg_ts = FRONTEND / "src" / "features" / "export" / "meetingDashboardPackage.ts"
    assert meeting_pkg_ts.exists(), f"Missing meetingDashboardPackage.ts at {meeting_pkg_ts}"
    content_pkg = read_text_file(meeting_pkg_ts)
    assert SYNTHETIC_DISCLOSURE_TEXT in content_pkg or "synthetic" in content_pkg.lower()


# ============================================================================
# AC-4: Interactive Prioritized Recommendation Queue with Governance Guardrails
# ============================================================================

def test_ac4_recommendation_queue_interactive_toggle_control() -> None:
    """Verify that StandaloneDashboardApp.tsx provides an accessible open-recommendation-queue control."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-action="open-recommendation-queue"' in content
    assert 'data-testid="open-recommendation-queue"' in content
    assert 'aria-controls="recommendation-queue"' in content
    assert "aria-expanded={recommendationQueueOpen}" in content


def test_ac4_recommendation_queue_container_status_and_role() -> None:
    """Verify that the expanded recommendation queue renders with data-status='recommendation-queue'."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-status="recommendation-queue"' in content
    assert 'id="recommendation-queue"' in content
    assert 'role="region"' in content


def test_ac4_finance_reporting_wh_p0_priority_ordered_first(tmp_path: Path) -> None:
    """Verify that recommendation queue data places FINANCE_REPORTING_WH (IWW-001, P0) first."""
    db_path, snap_path = generate_scenario_assets(tmp_path)
    snap_data = read_json_file(snap_path)

    rec_dataset = next(
        (d for d in snap_data["datasets"] if d["datasetId"] == "recommendation_queue"),
        None,
    )
    assert rec_dataset is not None, "recommendation_queue dataset missing from snapshot"
    assert len(rec_dataset["rows"]) > 0, "recommendation_queue has no rows"

    first_rec = rec_dataset["rows"][0]
    assert first_rec["recommendation_id"] == "IWW-001"
    assert first_rec["executive_severity"] == "P0"
    assert first_rec["scope_name"] == "FINANCE_REPORTING_WH"


def test_ac4_recommendation_governance_fields_displayed() -> None:
    """Verify that StandaloneDashboardApp.tsx displays all governance fields in recommendation items."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "executive_severity" in content
    assert "scope_name" in content
    assert "recommended_action" in content
    assert "suggested_owner" in content
    assert "guardrail" in content


def test_ac4_directional_validation_guardrails_enforced() -> None:
    """Verify that StandaloneDashboardApp.tsx explicitly frames recommendations as directional until validated."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "directional until validated" in content.lower()
    assert "owner validation" in content.lower()


# ============================================================================
# AC-5: Same-Day Executive Follow-Up & Landscape PDF Export Integration
# ============================================================================

def test_ac5_executive_follow_up_action_and_status() -> None:
    """Verify that StandaloneDashboardApp.tsx provides same-day executive follow-up action and status."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-action="same-day-executive-follow-up"' in content
    assert 'data-testid="same-day-executive-follow-up"' in content
    assert 'data-status="executive-follow-up"' in content
    assert "Follow-up artifact is ready" in content


def test_ac5_executive_follow_up_payload_integrity() -> None:
    """Verify that buildExecutiveFollowUpHtml includes headline metrics, concentration, and digest."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert "opportunityHigh" in content
    assert "idleWarehouseCount" in content
    assert "FINANCE_REPORTING_WH dominates warehouse credits" in content or "FINANCE_REPORTING_WH" in content
    assert "input.disclosure.artifactDigest" in content
    assert "Prioritized recommendations (directional until validated)" in content


def test_ac5_landscape_pdf_export_action_and_citations() -> None:
    """Verify that StandaloneDashboardApp.tsx provides landscape PDF print action with evidence citations."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    assert 'data-testid="dashboard-save-pdf"' in content
    assert "handlePrintDashboard" in content
    assert "exportDashboardArtifact" in content
    assert "includePresenterNotes: true" in content


# ============================================================================
# AC-6: Browser Smoke Gate Conformance & Production Bundle Marker Verification
# ============================================================================

def test_ac6_browser_smoke_manifest_conformance() -> None:
    """Verify that tests/browser_smoke_manifest.json specifies exact URL, selectors, action, and success criteria."""
    manifest_path = ROOT / "tests" / "browser_smoke_manifest.json"
    assert manifest_path.exists(), f"Missing browser_smoke_manifest.json at {manifest_path}"

    data = read_json_file(manifest_path)
    assert data["url"] == f"http://127.0.0.1:4173/?scenario={SCENARIO_ID}"
    assert data["ready_selector"] == f"[data-scenario='{SCENARIO_ID}'][data-readiness='controlled'] [data-disclosure='synthetic-demo-data']"
    assert data["action"]["type"] == "click"
    assert data["action"]["selector"] == "[data-action='open-recommendation-queue']"
    assert data["success"]["selector"] == "[data-status='recommendation-queue']"
    assert data["success"]["text_contains"] == "FINANCE_REPORTING_WH"


def test_ac6_browser_smoke_check_script_conformance() -> None:
    """Verify that tests/browser_smoke_check.py checks for #root mount and the 4 contract markers."""
    check_script = ROOT / "tests" / "browser_smoke_check.py"
    assert check_script.exists(), f"Missing browser_smoke_check.py at {check_script}"

    content = read_text_file(check_script)
    assert 'URL = "http://127.0.0.1:4173/?scenario=idle-warehouse-waste"' in content
    for marker in EXPECTED_BROWSER_SMOKE_MARKERS:
        assert f'"{marker}"' in content or f"'{marker}'" in content
    assert '<div id="root"' in content or "<div id=\\\"root\\\"" in content


def test_ac6_presentation_source_contains_smoke_markers() -> None:
    """Verify that StandaloneDashboardApp.tsx source contains all four browser smoke contract markers."""
    app_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.tsx"
    assert app_tsx.exists(), f"Missing StandaloneDashboardApp.tsx at {app_tsx}"

    content = read_text_file(app_tsx)
    for marker in EXPECTED_BROWSER_SMOKE_MARKERS:
        assert marker in content, f"Missing browser smoke marker '{marker}' in StandaloneDashboardApp.tsx"


def test_ac6_production_bundle_contract_markers_conformance() -> None:
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


# ============================================================================
# AC-7: Production Build Integrity & Automated Frontend Test Suite Conformance
# ============================================================================

def test_ac7_frontend_package_json_build_and_test_scripts() -> None:
    """Verify that frontend/package.json declares build and test scripts."""
    pkg_json_path = FRONTEND / "package.json"
    assert pkg_json_path.exists(), f"Missing package.json at {pkg_json_path}"

    data = read_json_file(pkg_json_path)
    scripts = data.get("scripts", {})
    assert "build" in scripts, "package.json missing 'build' script"
    assert "test" in scripts, "package.json missing 'test' script"


def test_ac7_frontend_vitest_suite_conformance() -> None:
    """Verify that StandaloneDashboardApp.test.tsx covers routing, readiness, disclosures, and export."""
    test_tsx = FRONTEND / "src" / "features" / "runtime" / "StandaloneDashboardApp.test.tsx"
    assert test_tsx.exists(), f"Missing StandaloneDashboardApp.test.tsx at {test_tsx}"

    content = read_text_file(test_tsx)
    required_test_cases = [
        "uses the idle scenario requested by the browser URL",
        "renders controlled artifact evidence and citations through the shared runtime",
        "opens and focuses the prioritized recommendation queue",
        "triggers same-day executive follow-up export",
        "triggers landscape print view export",
        "shows blocking quality and withholds the dashboard for an unverified digest",
    ]
    for tc in required_test_cases:
        assert tc in content, f"Missing test case '{tc}' in StandaloneDashboardApp.test.tsx"


# ============================================================================
# AC-8: Backend Slice Preservation, Zero Regressions & Sibling Repository Isolation
# ============================================================================

def test_ac8_backend_slice_source_isolation_and_no_dependencies() -> None:
    """Verify that src/dashForge python files have zero external runtime dependencies."""
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


def test_ac8_no_hardcoded_scenarios_in_backend() -> None:
    """Verify that src/dashForge python files do not contain hardcoded collections of snowflake scenario IDs."""
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


def test_ac8_sibling_dataforge_unmodified() -> None:
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


def test_ac8_deterministic_cli_generation_idle_warehouse(tmp_path: Path) -> None:
    """Verify that CLI generate subcommand creates deterministic database and snapshot with all 7 datasets."""
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


def test_ac8_backwards_compatibility_existing_packs(tmp_path: Path) -> None:
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
        assert exit_code == 0, f"Generation failed for pack {pack}"
        assert out.exists()
        assert snap.exists()


def test_ac8_verified_artifact_digest_integrity() -> None:
    """Verify that verifiedSyntheticDataArtifacts.ts defines EXPECTED_DIGEST and fixtures exist."""
    artifact_ts = FRONTEND / "src" / "core" / "data" / "verifiedSyntheticDataArtifacts.ts"
    assert artifact_ts.exists(), f"Missing verifiedSyntheticDataArtifacts.ts at {artifact_ts}"

    content = read_text_file(artifact_ts)
    assert EXPECTED_DIGEST in content

    fixtures = [
        FRONTEND / "src" / "fixtures" / "dataforge" / "idle-warehouse-waste-work-package.json",
        FRONTEND / "src" / "fixtures" / "dataforge" / "idle-warehouse-waste-snapshot.json",
        FRONTEND / "src" / "fixtures" / "dataforge" / "idle-warehouse-waste-quality-report.json",
    ]
    for fixture in fixtures:
        assert fixture.exists(), f"Missing fixture file: {fixture}"

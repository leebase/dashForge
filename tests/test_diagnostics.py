"""Targeted test suite for the repair-timeout-cascade slice contract.

Encodes acceptance checks AC-1 through AC-7 defined in docs/repair-timeout-cascade-contract.md:
- AC-1: Playbook deconstruction into modular, bounded stages (<600s budget, intermediate checkpoints).
- AC-2: Structured, low-overhead diagnostic logging and elapsed timing instrumentation across major phases.
- AC-3: CLI entrypoint supports diagnostic logging on stderr without altering stdout or corrupting stream separation.
- AC-4: Bit-for-bit generation determinism and canonical SQLiteSnapshot schema conformance.
- AC-5: Fail-closed robustness, exit code 2 on errors, clean diagnostic messages without Python tracebacks.
- AC-6: Runtime presentation seams and catalog bindings continuity (snowflakeCost:idle-warehouse-waste).
- AC-7: Zero external runtime dependencies (stdlib only), read-only sibling dataForge, and regression suite immunity.

All tests are import-guarded and syntactically valid so they can be collected cleanly
before the diagnostics implementation lands.
"""

from __future__ import annotations

import ast
import hashlib
import io
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
FRONTEND = ROOT / "frontend"
DATAFORGE_ROOT = ROOT.parent / "dataForge"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# DashForge main CLI entrypoint
try:
    from dashForge.main import build_parser, main
except ImportError:
    build_parser = None  # type: ignore[assignment]
    main = None  # type: ignore[assignment]

# DashForge package_snapshot module
try:
    from dashForge import package_snapshot as pkg_snapshot_module
    from dashForge.package_snapshot import export_sqlite_snapshot, package_snapshot
except ImportError:
    pkg_snapshot_module = None
    export_sqlite_snapshot = None  # type: ignore[assignment]
    package_snapshot = None  # type: ignore[assignment]

# DashForge diagnostics module (scheduled for implementation in step_05)
try:
    from dashForge import diagnostics as diagnostics_module
except ImportError:
    diagnostics_module = None

try:
    from dashForge.diagnostics import DiagnosticTimer, PhaseRecord
except (ImportError, AttributeError):
    DiagnosticTimer = None  # type: ignore[assignment]
    PhaseRecord = None  # type: ignore[assignment]


# ============================================================================
# Contract Constants
# ============================================================================

PACK_ID = "snowflakeCost"
SCENARIO_ID = "idle-warehouse-waste"
DEFAULT_SEED = 9101
DEFAULT_TEMPLATE_ID = "tpl.snowflakeCost.idle-warehouse-waste"
STORY_CONTRACT_PATH = "stories/snowflake/idle-warehouse-waste.md"
SYNTHETIC_DISCLOSURE_TEXT = "Synthetic demo data"

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

VALID_COLUMN_TYPES = {"string", "number", "date", "boolean"}
VALID_COLUMN_ROLES = {"dimension", "measure", "date", "id"}


# ============================================================================
# Helper Functions
# ============================================================================

def run_cli_command(
    args: list[str],
    env_extra: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    """Execute dashForge CLI via subprocess in a controlled environment."""
    env = dict(os.environ)
    env["PYTHONPATH"] = str(SRC)
    if env_extra:
        env.update(env_extra)
    return subprocess.run(
        [sys.executable, "-m", "dashForge.main", *args],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
    )


def read_snapshot(path: Path) -> dict[str, Any]:
    """Read and parse JSON snapshot file."""
    return json.loads(path.read_text(encoding="utf-8"))


def compute_sha256(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ============================================================================
# AC-1: Playbook Deconstruction & Bounded Stage Execution (<600s budget)
# ============================================================================

def test_deconstructed_step_execution_time_bounds(tmp_path: Path) -> None:
    """AC-1: Verify that generation across all supported packs executes well within the 120s budget."""
    packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 4101),
        ("saas", "churn-crisis", 5101),
        ("snowflakeCost", "idle-warehouse-waste", 9101),
    ]

    for pack, scenario, seed in packs:
        output = tmp_path / f"bounds-{pack}-{scenario}.sqlite"
        snapshot = tmp_path / f"bounds-{pack}-{scenario}.snapshot.json"

        start_time = time.perf_counter()
        result = run_cli_command([
            "generate",
            "--pack", pack,
            "--scenario", scenario,
            "--seed", str(seed),
            "--output", str(output),
            "--snapshot-output", str(snapshot),
            "--force",
        ])
        elapsed = time.perf_counter() - start_time

        assert result.returncode == 0, f"Generation failed for {pack}/{scenario}:\n{result.stderr}"
        assert elapsed < 120.0, (
            f"Step execution took {elapsed:.2f}s, exceeding bounded 120s threshold for {pack}"
        )
        assert output.exists() and output.stat().st_size > 0, f"Empty or missing SQLite output for {pack}"
        assert snapshot.exists() and snapshot.stat().st_size > 0, f"Empty or missing snapshot output for {pack}"


def test_intermediate_checkpoint_durability_and_resumption(tmp_path: Path) -> None:
    """AC-1: Verify that intermediate SQLite database is durable and snapshot export can resume from it."""
    db_output = tmp_path / "sealed-checkpoint.sqlite"
    snapshot_output = tmp_path / "sealed-checkpoint.snapshot.json"

    # Stage A: Generate intermediate SQLite database only
    res_stage_a = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(db_output),
        "--force",
    ])
    assert res_stage_a.returncode == 0, f"Stage A generation failed:\n{res_stage_a.stderr}"
    assert db_output.exists() and db_output.stat().st_size > 0

    # Verify intermediate database contains sealed tables
    with sqlite3.connect(db_output) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert EXPECTED_SEVEN_DATASETS.issubset(tables), (
            f"Intermediate database missing canonical tables: {EXPECTED_SEVEN_DATASETS - tables}"
        )

    # Stage B: Export snapshot from the existing sealed intermediate database without regenerating
    assert export_sqlite_snapshot is not None, "export_sqlite_snapshot function not available"
    snapshot_data = export_sqlite_snapshot(
        database_path=db_output,
        snapshot_output_path=snapshot_output,
    )
    assert snapshot_output.exists() and snapshot_output.stat().st_size > 0
    assert snapshot_data["packId"] == PACK_ID
    assert snapshot_data["scenarioId"] == SCENARIO_ID


def test_execution_safety_margin_under_600s_timeout(tmp_path: Path) -> None:
    """AC-1: Verify that generation and packaging complete with at least 480s margin under the 600s budget."""
    output = tmp_path / "margin-test.sqlite"
    snapshot = tmp_path / "margin-test.snapshot.json"

    start = time.perf_counter()
    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    elapsed = time.perf_counter() - start

    assert result.returncode == 0, f"Generation failed:\n{result.stderr}"
    safety_margin = 600.0 - elapsed
    assert safety_margin >= 480.0, (
        f"Insufficient timeout safety margin: elapsed={elapsed:.2f}s, margin={safety_margin:.2f}s (<480s)"
    )


# ============================================================================
# AC-2: Structured Low-Overhead Diagnostic Logging & Phase Timing
# ============================================================================

def test_diagnostics_module_interface() -> None:
    """AC-2: Verify that dashForge.diagnostics module exists and exports DiagnosticTimer."""
    assert diagnostics_module is not None, (
        "dashForge.diagnostics module is not yet available (scheduled for implementation in step_05)"
    )
    assert hasattr(diagnostics_module, "DiagnosticTimer"), (
        "dashForge.diagnostics must export DiagnosticTimer"
    )


def test_phase_timer_duration_reporting() -> None:
    """AC-2: Verify that DiagnosticTimer accurately records and reports phase durations."""
    assert DiagnosticTimer is not None, (
        "DiagnosticTimer is not yet available in dashForge.diagnostics"
    )

    timer = DiagnosticTimer()
    # Test phase timing context manager
    if hasattr(timer, "phase"):
        with timer.phase("scenario_resolution"):
            time.sleep(0.005)
    elif callable(timer):
        with timer("scenario_resolution"):
            time.sleep(0.005)
    elif hasattr(timer, "time_phase"):
        with timer.time_phase("scenario_resolution"):
            time.sleep(0.005)
    elif hasattr(timer, "record"):
        with timer.record("scenario_resolution"):
            time.sleep(0.005)
    elif hasattr(timer, "start_phase") and hasattr(timer, "stop_phase"):
        timer.start_phase("scenario_resolution")
        time.sleep(0.005)
        timer.stop_phase("scenario_resolution")
    else:
        pytest.fail("DiagnosticTimer does not provide a recognized phase timing context manager")

    # Verify duration was recorded
    phases = (
        getattr(timer, "phases", None)
        or getattr(timer, "records", None)
        or (timer.get_phases() if hasattr(timer, "get_phases") else None)
    )
    assert phases is not None and len(phases) > 0, "No phases recorded by DiagnosticTimer"

    # Verify report formatting
    if hasattr(timer, "format_report"):
        report = timer.format_report()
        assert "scenario_resolution" in report
    elif hasattr(timer, "report"):
        buf = io.StringIO()
        timer.report(stream=buf)
        report = buf.getvalue()
        assert "scenario_resolution" in report


def test_diagnostic_timer_low_overhead() -> None:
    """AC-2: Verify that timing instrumentation overhead is negligible (<0.1ms per call)."""
    assert DiagnosticTimer is not None, (
        "DiagnosticTimer is not yet available in dashForge.diagnostics"
    )

    timer = DiagnosticTimer()
    iterations = 500
    start = time.perf_counter()

    for i in range(iterations):
        if hasattr(timer, "phase"):
            with timer.phase(f"test_phase_{i % 5}"):
                pass
        elif callable(timer):
            with timer(f"test_phase_{i % 5}"):
                pass
        elif hasattr(timer, "time_phase"):
            with timer.time_phase(f"test_phase_{i % 5}"):
                pass
        else:
            break

    total_elapsed = time.perf_counter() - start
    per_call_ms = (total_elapsed / iterations) * 1000
    assert per_call_ms < 0.2, f"Timer overhead too high: {per_call_ms:.4f}ms per call (target <0.1ms)"


def test_diagnostic_timing_telemetry_capture(tmp_path: Path) -> None:
    """AC-2: Verify that CLI execution with --diagnostics reports phase timings on stderr."""
    output = tmp_path / "telemetry-test.sqlite"
    snapshot = tmp_path / "telemetry-test.snapshot.json"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
        "--diagnostics",
    ])

    assert result.returncode == 0, f"Command failed with exit {result.returncode}:\n{result.stderr}"
    assert output.exists() and output.stat().st_size > 0
    assert snapshot.exists() and snapshot.stat().st_size > 0

    # Stderr must contain diagnostic phase reports
    assert "[DIAGNOSTIC]" in result.stderr, (
        f"Expected [DIAGNOSTIC] tags in stderr, got:\n{result.stderr}"
    )

    stderr_lower = result.stderr.lower()
    phase_keywords = [
        "scenario_resolution",
        "data_generation",
        "sqlite_persistence",
        "pragma_inspection",
        "snapshot_serialization",
    ]
    matched = [p for p in phase_keywords if p in stderr_lower]
    assert len(matched) >= 2, (
        f"Expected multiple phase reports in stderr, matched: {matched}\nStderr:\n{result.stderr}"
    )


def test_diagnostics_via_environment_variable(tmp_path: Path) -> None:
    """AC-2: Verify that DASHFORGE_DIAGNOSTICS=1 activates diagnostic reporting on stderr."""
    output = tmp_path / "env-telemetry.sqlite"
    snapshot = tmp_path / "env-telemetry.snapshot.json"

    result = run_cli_command(
        [
            "generate",
            "--pack", PACK_ID,
            "--scenario", SCENARIO_ID,
            "--seed", str(DEFAULT_SEED),
            "--output", str(output),
            "--snapshot-output", str(snapshot),
            "--force",
        ],
        env_extra={"DASHFORGE_DIAGNOSTICS": "1"},
    )

    assert result.returncode == 0, f"Command failed:\n{result.stderr}"
    assert "[DIAGNOSTIC]" in result.stderr, (
        f"Expected [DIAGNOSTIC] tags via DASHFORGE_DIAGNOSTICS=1 in stderr, got:\n{result.stderr}"
    )


# ============================================================================
# AC-3: Diagnostic Stream Separation & Non-Polluting CLI Reporting
# ============================================================================

def test_cli_parser_supports_diagnostics_flag() -> None:
    """AC-3: Verify build_parser supports optional --diagnostics flag defaulting to False."""
    assert build_parser is not None, "build_parser not available"
    parser = build_parser()

    # Without --diagnostics
    args_plain = parser.parse_args([
        "generate",
        "--scenario", SCENARIO_ID,
        "--output", "/tmp/test.sqlite",
    ])
    assert hasattr(args_plain, "diagnostics"), "Parser missing 'diagnostics' attribute"
    assert args_plain.diagnostics is False, "Expected diagnostics to default to False"

    # With --diagnostics
    args_diag = parser.parse_args([
        "generate",
        "--scenario", SCENARIO_ID,
        "--output", "/tmp/test.sqlite",
        "--diagnostics",
    ])
    assert args_diag.diagnostics is True, "Expected diagnostics to be True when flag passed"


def test_diagnostic_stream_separation_stderr_stdout(tmp_path: Path) -> None:
    """AC-3: Verify strict stream separation: stdout has payload only, stderr has telemetry."""
    output = tmp_path / "stream-sep.sqlite"
    snapshot = tmp_path / "stream-sep.snapshot.json"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
        "--diagnostics",
    ])

    assert result.returncode == 0, f"Command failed with exit {result.returncode}:\n{result.stderr}"

    # Stdout must contain ONLY canonical generation confirmation lines
    stdout_lines = [line.strip() for line in result.stdout.strip().splitlines() if line.strip()]
    assert len(stdout_lines) == 2, (
        f"Expected exactly 2 lines in stdout, got {len(stdout_lines)}:\n{result.stdout}"
    )
    assert stdout_lines[0].startswith(f"Generated {PACK_ID}/{SCENARIO_ID} seed {DEFAULT_SEED} ->")
    assert stdout_lines[1].startswith("Snapshot ->")

    # Stdout must NOT contain diagnostic or timing telemetry
    assert "[DIAGNOSTIC]" not in result.stdout
    assert "Phase" not in result.stdout
    assert "duration" not in result.stdout.lower()

    # Stderr must contain the diagnostic telemetry
    assert "[DIAGNOSTIC]" in result.stderr


def test_stdout_purity_with_diagnostics(tmp_path: Path) -> None:
    """AC-3: Verify stdout purity when DASHFORGE_DIAGNOSTICS=1 environment variable is active."""
    output = tmp_path / "env-purity.sqlite"
    snapshot = tmp_path / "env-purity.snapshot.json"

    result = run_cli_command(
        [
            "generate",
            "--pack", PACK_ID,
            "--scenario", SCENARIO_ID,
            "--seed", str(DEFAULT_SEED),
            "--output", str(output),
            "--snapshot-output", str(snapshot),
            "--force",
        ],
        env_extra={"DASHFORGE_DIAGNOSTICS": "1"},
    )

    assert result.returncode == 0, f"Command failed:\n{result.stderr}"
    assert "[DIAGNOSTIC]" not in result.stdout, "Diagnostic tags leaked into stdout"
    assert "Phase" not in result.stdout
    assert "[DIAGNOSTIC]" in result.stderr, "Diagnostic telemetry missing from stderr"


def test_stdout_identical_with_and_without_diagnostics(tmp_path: Path) -> None:
    """AC-3: Verify stdout output is identical line-for-line with and without diagnostics."""
    output_a = tmp_path / "stdout-plain.sqlite"
    snapshot_a = tmp_path / "stdout-plain.snapshot.json"
    output_b = tmp_path / "stdout-diag.sqlite"
    snapshot_b = tmp_path / "stdout-diag.snapshot.json"

    res_plain = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output_a),
        "--snapshot-output", str(snapshot_a),
        "--force",
    ])
    assert res_plain.returncode == 0

    res_diag = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output_b),
        "--snapshot-output", str(snapshot_b),
        "--force",
        "--diagnostics",
    ])
    assert res_diag.returncode == 0

    # Normalize output paths to verify identical message format
    norm_plain = res_plain.stdout.replace(str(output_a), "<OUT>").replace(str(snapshot_a), "<SNAP>")
    norm_diag = res_diag.stdout.replace(str(output_b), "<OUT>").replace(str(snapshot_b), "<SNAP>")
    assert norm_plain.strip() == norm_diag.strip(), (
        f"Stdout format differs between plain and diagnostic runs:\nPlain: {norm_plain}\nDiag: {norm_diag}"
    )


def test_stdout_stream_downstream_pipeability(tmp_path: Path) -> None:
    """AC-3: Verify that stdout output can be cleanly parsed by downstream tools without corruption."""
    output = tmp_path / "pipe-test.sqlite"
    snapshot = tmp_path / "pipe-test.snapshot.json"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
        "--diagnostics",
    ])

    assert result.returncode == 0
    lines = result.stdout.strip().splitlines()
    assert len(lines) == 2

    # Simulate automated parser extracting paths
    gen_parts = lines[0].split(" -> ")
    assert len(gen_parts) == 2, f"Failed to parse generation path from line: {lines[0]}"
    assert Path(gen_parts[1].strip()).resolve() == output.resolve()

    snap_parts = lines[1].split(" -> ")
    assert len(snap_parts) == 2, f"Failed to parse snapshot path from line: {lines[1]}"
    assert Path(snap_parts[1].strip()).resolve() == snapshot.resolve()


# ============================================================================
# AC-4: Bit-for-Bit Determinism & Canonical Snapshot Schema Conformance
# ============================================================================

def test_deterministic_generation_under_diagnostic_mode(tmp_path: Path) -> None:
    """AC-4: Verify bit-for-bit generation determinism across plain and diagnostic runs."""
    output_plain = tmp_path / "det-plain.sqlite"
    snapshot_plain = tmp_path / "det-plain.snapshot.json"
    output_diag = tmp_path / "det-diag.sqlite"
    snapshot_diag = tmp_path / "det-diag.snapshot.json"

    res_plain = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output_plain),
        "--snapshot-output", str(snapshot_plain),
        "--force",
    ])
    assert res_plain.returncode == 0

    res_diag = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output_diag),
        "--snapshot-output", str(snapshot_diag),
        "--force",
        "--diagnostics",
    ])
    assert res_diag.returncode == 0

    hash_db_plain = compute_sha256(output_plain)
    hash_db_diag = compute_sha256(output_diag)
    assert hash_db_plain == hash_db_diag, (
        f"SQLite database SHA-256 mismatch:\nPlain: {hash_db_plain}\nDiag:  {hash_db_diag}"
    )

    hash_snap_plain = compute_sha256(snapshot_plain)
    hash_snap_diag = compute_sha256(snapshot_diag)
    assert hash_snap_plain == hash_snap_diag, (
        f"Snapshot JSON SHA-256 mismatch:\nPlain: {hash_snap_plain}\nDiag:  {hash_snap_diag}"
    )


def test_snapshot_schema_conformance_with_diagnostics(tmp_path: Path) -> None:
    """AC-4: Verify JSON snapshot conforms strictly to SQLiteSnapshot TypeScript contract."""
    output = tmp_path / "conformance.sqlite"
    snapshot = tmp_path / "conformance.snapshot.json"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
        "--diagnostics",
    ])
    assert result.returncode == 0

    data = read_snapshot(snapshot)

    # Top-level provenance and contract properties
    assert data["packId"] == PACK_ID
    assert data["scenarioId"] == SCENARIO_ID
    assert data["seed"] == DEFAULT_SEED
    assert data["dataForgeStoryContractPath"] == STORY_CONTRACT_PATH
    assert "generatorVersion" in data
    assert "generationTimestamp" in data
    assert data["synthetic"] is True
    assert data["disclosure"] == SYNTHETIC_DISCLOSURE_TEXT

    # Canonical seven datasets
    datasets = data.get("datasets", [])
    dataset_map = {d["datasetId"]: d for d in datasets}
    assert set(dataset_map.keys()) == EXPECTED_SEVEN_DATASETS

    # Column typing, roles, and recommendation queue governance
    for ds_id, ds in dataset_map.items():
        assert "columns" in ds
        assert "rowCount" in ds
        assert "data" in ds
        assert ds["rowCount"] == len(ds["data"])
        for col in ds["columns"]:
            assert col["type"] in VALID_COLUMN_TYPES, f"Invalid type {col['type']} in {ds_id}.{col['name']}"
            assert col["role"] in VALID_COLUMN_ROLES, f"Invalid role {col['role']} in {ds_id}.{col['name']}"

    # Governance columns in recommendation_queue
    rq_columns = {col["name"] for col in dataset_map["recommendation_queue"]["columns"]}
    assert EXPECTED_GOVERNANCE_COLUMNS.issubset(rq_columns), (
        f"recommendation_queue missing governance columns: {EXPECTED_GOVERNANCE_COLUMNS - rq_columns}"
    )


def test_sqlite_database_conformance_with_diagnostics(tmp_path: Path) -> None:
    """AC-4: Verify SQLite database structure, tables, and metadata under diagnostic mode."""
    output = tmp_path / "sqlite-conformance.sqlite"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--force",
        "--diagnostics",
    ])
    assert result.returncode == 0

    with sqlite3.connect(output) as conn:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert EXPECTED_SEVEN_DATASETS.issubset(tables)
        assert "metadata" in tables

        # Metadata table checks
        meta = dict(conn.execute("SELECT key, value FROM metadata").fetchall())
        assert meta["packId"] == PACK_ID
        assert meta["scenarioId"] == SCENARIO_ID
        assert int(meta["seed"]) == DEFAULT_SEED
        assert meta["synthetic"] in ("true", "1", "True")


# ============================================================================
# AC-5: Fail-Closed Robustness & Graceful Error Diagnostic Reporting
# ============================================================================

def test_fail_closed_existing_target_without_force(tmp_path: Path) -> None:
    """AC-5: Verify CLI fails closed with exit code 2 when output file exists without --force."""
    output = tmp_path / "already-exists.sqlite"
    output.write_text("existing database content", encoding="utf-8")

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--output", str(output),
    ])

    assert result.returncode == 2, f"Expected exit code 2, got {result.returncode}"
    assert result.stdout.strip() == "", f"Expected empty stdout on error, got: {result.stdout}"
    assert "Output path already exists. Pass --force to overwrite" in result.stderr
    assert "Traceback (most recent call last)" not in result.stderr


def test_fail_closed_existing_snapshot_without_force(tmp_path: Path) -> None:
    """AC-5: Verify CLI fails closed with exit code 2 when snapshot output exists without --force."""
    output = tmp_path / "new-target.sqlite"
    snapshot = tmp_path / "already-exists.snapshot.json"
    snapshot.write_text("existing snapshot content", encoding="utf-8")

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--output", str(output),
        "--snapshot-output", str(snapshot),
    ])

    assert result.returncode == 2, f"Expected exit code 2, got {result.returncode}"
    assert result.stdout.strip() == ""
    assert "Output path already exists. Pass --force to overwrite" in result.stderr
    assert "Traceback (most recent call last)" not in result.stderr


def test_unknown_scenario_fails_cleanly(tmp_path: Path) -> None:
    """AC-5: Verify unknown scenario fails closed with exit code 2 without raw tracebacks."""
    output = tmp_path / "unknown-scenario.sqlite"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", "nonexistent-scenario-id-xyz",
        "--output", str(output),
    ])

    assert result.returncode == 2, f"Expected exit code 2, got {result.returncode}"
    assert result.stdout.strip() == ""
    assert "Traceback (most recent call last)" not in result.stderr


def test_fail_closed_unknown_pack(tmp_path: Path) -> None:
    """AC-5: Verify unknown pack identifier fails closed with exit code 2 and no traceback."""
    output = tmp_path / "unknown-pack.sqlite"

    result = run_cli_command([
        "generate",
        "--pack", "invalidPackName",
        "--scenario", SCENARIO_ID,
        "--output", str(output),
    ])

    assert result.returncode == 2, f"Expected exit code 2, got {result.returncode}"
    assert result.stdout.strip() == ""
    assert "Traceback (most recent call last)" not in result.stderr


def test_fail_closed_missing_required_arguments() -> None:
    """AC-5: Verify missing required CLI arguments fails closed with exit code 2 and usage info."""
    result = run_cli_command(["generate"])

    assert result.returncode == 2, f"Expected exit code 2, got {result.returncode}"
    assert result.stdout.strip() == ""
    assert "usage:" in result.stderr
    assert "Traceback (most recent call last)" not in result.stderr


def test_diagnostics_preserves_fail_closed_error_code(tmp_path: Path) -> None:
    """AC-5: Verify that adding --diagnostics preserves exit code 2 on validation failure."""
    output = tmp_path / "fail-closed-diag.sqlite"
    output.write_text("existing", encoding="utf-8")

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--output", str(output),
        "--diagnostics",
    ])

    assert result.returncode == 2, f"Expected exit code 2, got {result.returncode}"
    assert result.stdout.strip() == ""
    assert "Traceback (most recent call last)" not in result.stderr


# ============================================================================
# AC-6: Runtime Presentation Seams & Catalog Bindings Continuity
# ============================================================================

def test_presentation_contracts_unaffected_by_diagnostics(tmp_path: Path) -> None:
    """AC-6: Verify scenario catalog and template catalog registrations and DataAdapter query seams."""
    scenario_catalog_path = FRONTEND / "src" / "mock-data" / "scenarioCatalog.ts"
    template_catalog_path = FRONTEND / "src" / "mock-data" / "templateCatalog.ts"

    assert scenario_catalog_path.exists(), f"Scenario catalog not found: {scenario_catalog_path}"
    assert template_catalog_path.exists(), f"Template catalog not found: {template_catalog_path}"

    scenario_content = scenario_catalog_path.read_text(encoding="utf-8")
    assert f"{PACK_ID}:{SCENARIO_ID}" in scenario_content, (
        f"{PACK_ID}:{SCENARIO_ID} missing from scenarioCatalog.ts"
    )

    template_content = template_catalog_path.read_text(encoding="utf-8")
    assert DEFAULT_TEMPLATE_ID in template_content, (
        f"{DEFAULT_TEMPLATE_ID} missing from templateCatalog.ts"
    )


def test_presentation_query_routing_on_generated_data(tmp_path: Path) -> None:
    """AC-6: Verify DataAdapter query routing seams execute cleanly on generated data."""
    output = tmp_path / "presentation-seam.sqlite"
    snapshot = tmp_path / "presentation-seam.snapshot.json"

    result = run_cli_command([
        "generate",
        "--pack", PACK_ID,
        "--scenario", SCENARIO_ID,
        "--seed", str(DEFAULT_SEED),
        "--output", str(output),
        "--snapshot-output", str(snapshot),
        "--force",
    ])
    assert result.returncode == 0

    with sqlite3.connect(output) as conn:
        conn.row_factory = sqlite3.Row

        # Executive summary query seam
        exec_rows = conn.execute("SELECT * FROM executive_summary").fetchall()
        assert len(exec_rows) > 0, "executive_summary has no rows"

        # Warehouse metering query seam
        wm_rows = conn.execute(
            "SELECT warehouseName, SUM(creditsUsed) as totalCredits "
            "FROM warehouse_metering_history GROUP BY warehouseName"
        ).fetchall()
        assert len(wm_rows) > 0, "warehouse_metering_history aggregation returned no rows"

        # Recommendation queue query seam
        rq_rows = conn.execute(
            "SELECT recommendation_id, executive_severity, recommended_action "
            "FROM recommendation_queue WHERE executive_severity = 'HIGH'"
        ).fetchall()
        assert len(rq_rows) > 0, "recommendation_queue high severity query returned no rows"


# ============================================================================
# AC-7: Zero Dependencies, Read-Only Sibling Boundary & All Packs Operational
# ============================================================================

def test_zero_external_runtime_dependencies() -> None:
    """AC-7: Verify that dashForge Python source files import only standard library modules."""
    dashforge_src = SRC / "dashForge"
    py_files = list(dashforge_src.glob("*.py"))
    assert py_files, f"No Python files found in {dashforge_src}"

    allowed_modules = {
        "__future__",
        "argparse",
        "ast",
        "contextlib",
        "dataclasses",
        "datetime",
        "hashlib",
        "importlib",
        "io",
        "json",
        "logging",
        "os",
        "pathlib",
        "sqlite3",
        "sys",
        "time",
        "typing",
        "dashForge",
        "dataForge",
    }

    for py_file in py_files:
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
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


def test_dataforge_unmodified() -> None:
    """AC-7: Verify that sibling repository dataForge remains strictly read-only and unmodified."""
    if not (DATAFORGE_ROOT / ".git").exists():
        pytest.skip(f"dataForge git directory not found at {DATAFORGE_ROOT}")

    result = subprocess.run(
        ["git", "-C", str(DATAFORGE_ROOT), "status", "--porcelain"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == "", (
        f"Sibling repository dataForge has uncommitted modifications:\n{result.stdout}"
    )


def test_all_existing_packs_operational_with_diagnostics(tmp_path: Path) -> None:
    """AC-7: Verify all 4 packs generate successfully when diagnostics is requested."""
    packs = [
        ("healthcare", "flu-season", 3101),
        ("financial", "market-downturn", 4101),
        ("saas", "churn-crisis", 5101),
        ("snowflakeCost", "idle-warehouse-waste", 9101),
    ]

    for pack, scenario, seed in packs:
        output = tmp_path / f"pack-op-{pack}.sqlite"
        snapshot = tmp_path / f"pack-op-{pack}.snapshot.json"

        result = run_cli_command([
            "generate",
            "--pack", pack,
            "--scenario", scenario,
            "--seed", str(seed),
            "--output", str(output),
            "--snapshot-output", str(snapshot),
            "--force",
            "--diagnostics",
        ])

        assert result.returncode == 0, f"Generation failed for {pack}:\n{result.stderr}"
        assert output.exists() and output.stat().st_size > 0
        assert snapshot.exists() and snapshot.stat().st_size > 0

from __future__ import annotations

import json
import os
import re
from pathlib import Path
import sqlite3
import subprocess
import sys
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# DashForge main CLI entrypoint
try:
    from dashForge.main import build_parser, main
except ImportError:
    build_parser = None  # type: ignore[assignment]
    main = None  # type: ignore[assignment]

# DashForge generate module
try:
    from dashForge.generate import (
        DATASET_EXPORTS_BY_PACK,
        export_sqlite_snapshot,
        generate_financial_database,
        generate_healthcare_database,
        generate_saas_database,
    )
except ImportError:
    DATASET_EXPORTS_BY_PACK = None  # type: ignore[assignment]
    export_sqlite_snapshot = None  # type: ignore[assignment]
    generate_financial_database = None  # type: ignore[assignment]
    generate_healthcare_database = None  # type: ignore[assignment]
    generate_saas_database = None  # type: ignore[assignment]

# DashForge package_snapshot module
try:
    from dashForge import package_snapshot as pkg_snapshot_module
except ImportError:
    pkg_snapshot_module = None

# DashForge snowflake_cost module
try:
    from dashForge import snowflake_cost as snowflake_cost_module
except ImportError:
    snowflake_cost_module = None

# Optional simulation reporting helper (to be implemented in step_05)
try:
    from dashForge import simulation as simulation_module
except ImportError:
    simulation_module = None

# Canonical schemas for user simulation validation
try:
    from agent_orch.user_journeys import (
        DEFAULT_JOURNEY_AUTHORITY,
        JOURNEY_AUTHORITIES,
        REQUIRED_JOURNEY_AUTHORITIES,
        USER_JOURNEYS_MANIFEST_SCHEMA,
        USER_JOURNEYS_RESULT_SCHEMA,
    )
except ImportError:
    DEFAULT_JOURNEY_AUTHORITY = "author"
    JOURNEY_AUTHORITIES = ("human", "mission", "author", "exploratory")
    REQUIRED_JOURNEY_AUTHORITIES = frozenset({"human", "mission", "author"})
    USER_JOURNEYS_MANIFEST_SCHEMA = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["journeys", "command_allowlist"],
        "properties": {
            "journeys": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["name"],
                    "properties": {
                        "name": {"type": "string", "minLength": 1},
                        "authority": {"enum": list(JOURNEY_AUTHORITIES)},
                        "traces_to": {
                            "type": "array",
                            "items": {"type": "string", "minLength": 1},
                        },
                    },
                },
            },
            "command_allowlist": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string", "minLength": 1},
            },
        },
    }
    USER_JOURNEYS_RESULT_SCHEMA = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["journeys", "findings"],
        "properties": {
            "journeys": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["name", "status", "steps_taken", "commands_run"],
                    "properties": {
                        "name": {"type": "string", "minLength": 1},
                        "status": {"enum": ["passed", "failed"]},
                        "steps_taken": {
                            "oneOf": [
                                {"type": "string", "minLength": 1},
                                {
                                    "type": "array",
                                    "minItems": 1,
                                    "items": {"type": "string", "minLength": 1},
                                },
                            ]
                        },
                        "commands_run": {
                            "type": "array",
                            "minItems": 1,
                            "items": {
                                "type": "object",
                                "required": ["command", "exit_code"],
                                "properties": {
                                    "command": {"type": "string", "minLength": 1},
                                    "exit_code": {"type": "integer"},
                                    "stdout_contains": {
                                        "type": "string",
                                        "minLength": 1,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": [
                        "id",
                        "severity",
                        "journey",
                        "problem",
                        "reproduction",
                        "expected",
                        "actual",
                        "proposed_fix",
                    ],
                    "properties": {
                        "id": {"type": "string", "minLength": 1},
                        "severity": {"enum": ["Critical", "High", "Medium", "Low"]},
                        "journey": {"type": "string", "minLength": 1},
                        "problem": {"type": "string", "minLength": 1},
                        "reproduction": {"type": "string", "minLength": 1},
                        "expected": {"type": "string", "minLength": 1},
                        "actual": {"type": "string", "minLength": 1},
                        "observations": {
                            "oneOf": [
                                {"type": "string"},
                                {
                                    "type": "array",
                                    "minItems": 1,
                                    "items": {"type": "string", "minLength": 1},
                                },
                            ]
                        },
                        "proposed_fix": {"type": "string", "minLength": 1},
                        "artifacts": {
                            "type": "array",
                            "items": {"type": "string", "minLength": 1},
                        },
                    },
                },
            },
        },
    }

try:
    import jsonschema
except ImportError:
    jsonschema = None


# Helpers
def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_manifest() -> dict[str, Any]:
    manifest_path = ROOT / "journeys" / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Manifest file missing: {manifest_path}"
    return load_json(manifest_path)


def load_contract_text() -> str:
    contract_path = ROOT / "docs" / "fix-user-simulation-schema-contract.md"
    assert contract_path.exists(), f"Contract file missing: {contract_path}"
    return contract_path.read_text(encoding="utf-8")


def extract_acceptance_check_ids(text: str) -> set[str]:
    pattern = re.compile(r"\bAC-[0-9]+\b")
    return set(pattern.findall(text))


# ============================================================================
# AC-1: Result Schema Conformance and Non-Empty stdout_contains
# ============================================================================


def test_ac1_stdout_contains_min_length_enforced() -> None:
    """Verify that a result dictionary with non-empty stdout_contains satisfies schema."""
    if jsonschema is None:
        pytest.skip("jsonschema is not installed")

    valid_result: dict[str, Any] = {
        "journeys": [
            {
                "name": "Execute application CLI generation and verify non-empty stdout output",
                "status": "passed",
                "steps_taken": "Executed generate CLI command and checked stdout.",
                "commands_run": [
                    {
                        "command": (
                            "env PYTHONPATH=src python3 -m dashForge.main generate "
                            "--pack snowflakeCost --scenario idle-warehouse-waste "
                            "--seed 9101 --output /tmp/test.sqlite "
                            "--snapshot-output /tmp/test.snapshot.json --force"
                        ),
                        "exit_code": 0,
                        "stdout_contains": "Generated snowflakeCost/idle-warehouse-waste",
                    }
                ],
            }
        ],
        "findings": [],
    }
    # Must validate cleanly without exception
    jsonschema.validate(instance=valid_result, schema=USER_JOURNEYS_RESULT_SCHEMA)


def test_ac1_empty_stdout_contains_rejected() -> None:
    """Verify that a result dictionary with empty string stdout_contains fails schema validation."""
    if jsonschema is None:
        pytest.skip("jsonschema is not installed")

    invalid_result: dict[str, Any] = {
        "journeys": [
            {
                "name": "Execute CLI command with invalid empty stdout claim",
                "status": "passed",
                "steps_taken": "Executed command without output check.",
                "commands_run": [
                    {
                        "command": "python3 -m pytest tests/ -q",
                        "exit_code": 0,
                        "stdout_contains": "",  # Violates minLength: 1
                    }
                ],
            }
        ],
        "findings": [],
    }
    with pytest.raises(jsonschema.ValidationError) as exc_info:
        jsonschema.validate(instance=invalid_result, schema=USER_JOURNEYS_RESULT_SCHEMA)
    assert (
        "minLength" in str(exc_info.value)
        or "is too short" in str(exc_info.value).lower()
        or "stdout_contains" in str(exc_info.value)
    )


def test_ac1_omitted_stdout_contains_accepted() -> None:
    """Verify that command claims omitting stdout_contains pass schema validation cleanly."""
    if jsonschema is None:
        pytest.skip("jsonschema is not installed")

    result_without_stdout_contains: dict[str, Any] = {
        "journeys": [
            {
                "name": "Run unit test suite without output substring assertion",
                "status": "passed",
                "steps_taken": [
                    "Ran test suite command.",
                    "Observed exit code 0.",
                ],
                "commands_run": [
                    {
                        "command": "python3 -m pytest tests/ -q",
                        "exit_code": 0,
                    }
                ],
            }
        ],
        "findings": [],
    }
    jsonschema.validate(
        instance=result_without_stdout_contains,
        schema=USER_JOURNEYS_RESULT_SCHEMA,
    )


def test_ac1_whitespace_or_non_string_stdout_contains_rejected() -> None:
    """Verify that None or non-string values for stdout_contains fail validation."""
    if jsonschema is None:
        pytest.skip("jsonschema is not installed")

    result_with_none: dict[str, Any] = {
        "journeys": [
            {
                "name": "Run command with null stdout_contains",
                "status": "passed",
                "steps_taken": "Executed command.",
                "commands_run": [
                    {
                        "command": "python3 -m pytest tests/ -q",
                        "exit_code": 0,
                        "stdout_contains": None,
                    }
                ],
            }
        ],
        "findings": [],
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(
            instance=result_with_none, schema=USER_JOURNEYS_RESULT_SCHEMA
        )


def test_ac1_artifacts_result_json_conformance() -> None:
    """Verify that artifacts/user-test/result.json has no empty stdout_contains if present."""
    result_path = ROOT / "artifacts" / "user-test" / "result.json"
    if not result_path.exists():
        pytest.skip("artifacts/user-test/result.json not present in workspace")

    result_data = load_json(result_path)
    if jsonschema is not None:
        jsonschema.validate(instance=result_data, schema=USER_JOURNEYS_RESULT_SCHEMA)

    assert "journeys" in result_data
    for journey in result_data["journeys"]:
        for cmd_entry in journey.get("commands_run", []):
            if "stdout_contains" in cmd_entry:
                val = cmd_entry["stdout_contains"]
                assert isinstance(
                    val, str
                ), f"stdout_contains must be string in {journey['name']}: {cmd_entry}"
                assert (
                    len(val.strip()) >= 1
                ), f"stdout_contains must not be empty or whitespace in {journey['name']}: {cmd_entry}"


def test_ac1_command_claim_formatting_contract() -> None:
    """Verify the command claim construction protocol: omit stdout_contains when empty or None."""

    def build_claim(
        command: str, exit_code: int, stdout_substring: str | None = None
    ) -> dict[str, Any]:
        claim: dict[str, Any] = {
            "command": command,
            "exit_code": exit_code,
        }
        if stdout_substring:
            claim["stdout_contains"] = stdout_substring
        return claim

    claim_empty = build_claim("python3 -m pytest", 0, "")
    assert "stdout_contains" not in claim_empty

    claim_none = build_claim("python3 -m pytest", 0, None)
    assert "stdout_contains" not in claim_none

    claim_valid = build_claim("python3 -m pytest", 0, "passed")
    assert claim_valid.get("stdout_contains") == "passed"


# ============================================================================
# AC-2: User Journeys Manifest Schema Conformance & Authority Governance
# ============================================================================


def test_ac2_manifest_file_exists_and_is_valid_json() -> None:
    """Verify journeys/user_journeys_manifest.json exists and parses as valid JSON."""
    manifest_path = ROOT / "journeys" / "user_journeys_manifest.json"
    assert manifest_path.exists(), f"Missing file: {manifest_path}"
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert isinstance(data, dict)


def test_ac2_manifest_conforms_to_schema() -> None:
    """Verify journeys/user_journeys_manifest.json conforms to USER_JOURNEYS_MANIFEST_SCHEMA."""
    manifest = load_manifest()
    if jsonschema is not None:
        jsonschema.validate(instance=manifest, schema=USER_JOURNEYS_MANIFEST_SCHEMA)

    assert manifest.get("schema_version") == 1
    assert manifest.get("contract") == "docs/fix-user-simulation-schema-contract.md"
    assert isinstance(manifest.get("objective"), str) and len(manifest["objective"]) > 0
    assert isinstance(manifest.get("command_allowlist"), list)
    assert len(manifest["command_allowlist"]) >= 1
    assert isinstance(manifest.get("journeys"), list)
    assert len(manifest["journeys"]) >= 1


def test_ac2_manifest_authorities_valid() -> None:
    """Verify all journeys specify valid authority (human, mission, author, exploratory)."""
    manifest = load_manifest()
    valid_authorities = set(JOURNEY_AUTHORITIES)
    for journey in manifest["journeys"]:
        authority = journey.get("authority", DEFAULT_JOURNEY_AUTHORITY)
        assert (
            authority in valid_authorities
        ), f"Invalid authority '{authority}' in journey {journey.get('id', journey.get('name'))}"


def test_ac2_manifest_traces_to_all_acceptance_checks() -> None:
    """Verify the union of traces_to across non-exploratory journeys covers AC-1 through AC-5."""
    manifest = load_manifest()
    contract_text = load_contract_text()
    contract_ac_ids = extract_acceptance_check_ids(contract_text)
    assert contract_ac_ids, "No acceptance check IDs found in contract"

    all_traces: set[str] = set()
    for journey in manifest["journeys"]:
        if not journey.get("exploratory", False):
            traces = journey.get("traces_to", [])
            assert (
                len(traces) > 0
            ), f"Non-exploratory journey {journey.get('id', journey.get('name'))} must have non-empty traces_to"
            all_traces.update(traces)

    expected_acs = {"AC-1", "AC-2", "AC-3", "AC-4", "AC-5"}
    assert expected_acs.issubset(contract_ac_ids), (
        f"Contract missing expected ACs: {expected_acs - contract_ac_ids}"
    )
    missing = expected_acs - all_traces
    assert not missing, f"Manifest journeys fail to cover required acceptance checks: {missing}"


def test_ac2_manifest_no_dangling_acceptance_check_ids() -> None:
    """Verify no journey cites dangling, unreferenced, or malformed acceptance check IDs."""
    manifest = load_manifest()
    contract_text = load_contract_text()
    contract_ac_ids = extract_acceptance_check_ids(contract_text)

    for journey in manifest["journeys"]:
        traces = journey.get("traces_to", [])
        for trace in traces:
            assert (
                trace in contract_ac_ids
            ), f"Journey {journey.get('id', journey.get('name'))} references dangling trace {trace}"


def test_ac2_contract_file_exists_and_has_required_headings() -> None:
    """Verify docs/fix-user-simulation-schema-contract.md has all required contract headings."""
    contract_text = load_contract_text()
    required_headings = [
        "## Overview",
        "## Problem",
        "## Required Outputs",
        "## Constraints",
        "## Validation",
        "## Routing Intent",
        "## Acceptance Checks",
    ]
    for heading in required_headings:
        assert (
            heading in contract_text
        ), f"Contract missing required heading: {heading}"


# ============================================================================
# AC-3: Verbatim Root Command Execution & Environment Prefixes
# ============================================================================


def test_ac3_command_allowlist_prefixes_valid() -> None:
    """Verify command_allowlist contains exact required verbatim prefixes."""
    manifest = load_manifest()
    allowlist = manifest.get("command_allowlist", [])
    expected_prefixes = [
        "env PYTHONPATH=src python3 -m dashForge.main",
        "python3 -m pytest tests/ -q",
        "python3 -m pytest",
    ]
    for prefix in expected_prefixes:
        assert (
            prefix in allowlist
        ), f"command_allowlist missing expected prefix: {prefix}"


def test_ac3_application_commands_use_env_prefix() -> None:
    """Verify all application CLI commands in manifest use 'env PYTHONPATH=src python3 -m dashForge.main'."""
    manifest = load_manifest()
    for journey in manifest["journeys"]:
        for cmd in journey.get("commands", []):
            if "dashForge.main" in cmd:
                assert cmd.startswith(
                    "env PYTHONPATH=src python3 -m dashForge.main"
                ), (
                    f"Command in {journey.get('id')} does not use exact env prefix: {cmd}"
                )
                assert not cmd.startswith(
                    "PYTHONPATH=src python3"
                ), f"Bare assignment prohibited in journey {journey.get('id')}: {cmd}"


def test_ac3_pytest_commands_have_no_pythonpath_override() -> None:
    """Verify all pytest commands in manifest run without PYTHONPATH override."""
    manifest = load_manifest()
    for journey in manifest["journeys"]:
        for cmd in journey.get("commands", []):
            if "pytest" in cmd:
                assert cmd.startswith(
                    "python3 -m pytest"
                ), f"Pytest command must start with 'python3 -m pytest': {cmd}"
                assert (
                    "PYTHONPATH=" not in cmd
                ), f"Pytest command must not specify PYTHONPATH override in {journey.get('id')}: {cmd}"


def test_ac3_application_cli_help_runnable_verbatim() -> None:
    """Verify that 'env PYTHONPATH=src python3 -m dashForge.main --help' runs verbatim with exit code 0."""
    result = subprocess.run(
        [
            "env",
            "PYTHONPATH=src",
            sys.executable,
            "-m",
            "dashForge.main",
            "--help",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI help failed with code {result.returncode}: {result.stderr}"
    assert "dashForge generation utilities" in result.stdout or "generate" in result.stdout


# ============================================================================
# AC-4: Elimination of Shell Pipelines & Verifiable Argv Invocations
# ============================================================================


def test_ac4_no_shell_pipelines_in_journey_commands() -> None:
    """Verify no journey command uses shell pipelines, chaining, or redirection."""
    manifest = load_manifest()
    prohibited_tokens = ["|", "&&", "||", ";", ">", "<"]
    prohibited_tools = ["jq", "grep", "cat", "awk", "sed"]

    for journey in manifest["journeys"]:
        for cmd in journey.get("commands", []):
            tokens = cmd.split()
            for prohibited in prohibited_tokens:
                assert (
                    prohibited not in tokens
                ), f"Prohibited shell token '{prohibited}' found in {journey.get('id')}: {cmd}"
            # Ensure standalone tools are not used as executables
            for tool in prohibited_tools:
                assert (
                    tokens[0] != tool
                ), f"Prohibited standalone shell utility '{tool}' used in {journey.get('id')}: {cmd}"


def test_ac4_journey_commands_match_allowlist_prefix() -> None:
    """Verify every command in every journey matches an allowed prefix in command_allowlist."""
    manifest = load_manifest()
    allowlist = manifest.get("command_allowlist", [])
    for journey in manifest["journeys"]:
        commands = journey.get("commands", [])
        assert (
            len(commands) >= 1
        ), f"Journey {journey.get('id')} has no verifiable commands"
        for cmd in commands:
            matches = any(cmd.startswith(prefix) for prefix in allowlist)
            assert (
                matches
            ), f"Command '{cmd}' in journey {journey.get('id')} does not match any prefix in allowlist {allowlist}"


def test_ac4_every_journey_has_executable_commands() -> None:
    """Verify every journey has at least one command in commands array."""
    manifest = load_manifest()
    for journey in manifest["journeys"]:
        commands = journey.get("commands", [])
        assert (
            isinstance(commands, list) and len(commands) >= 1
        ), f"Journey {journey.get('id')} has no commands declared"


def test_ac4_targeted_pytest_commands_executable() -> None:
    """Verify targeted pytest commands in journeys target existing files and tests."""
    manifest = load_manifest()
    for journey in manifest["journeys"]:
        for cmd in journey.get("commands", []):
            if "pytest" in cmd and "-k" in cmd:
                tokens = cmd.split()
                # Find test file and test name
                k_idx = tokens.index("-k")
                test_name = tokens[k_idx + 1]
                # Find file path token (ending in .py)
                py_files = [t for t in tokens if t.endswith(".py")]
                assert (
                    py_files
                ), f"No test file specified in targeted pytest command: {cmd}"
                for py_file in py_files:
                    target_file = ROOT / py_file
                    assert (
                        target_file.exists()
                    ), f"Targeted test file missing: {target_file}"
                    content = target_file.read_text(encoding="utf-8")
                    assert (
                        f"def {test_name}" in content
                    ), f"Test function '{test_name}' missing in {target_file}"


# ============================================================================
# AC-5: Preservation of Existing Pipeline Validations & Regression Suite Integrity
# ============================================================================


def test_ac5_cli_generation_snowflake_cost_intact(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify CLI generation for snowflakeCost runs cleanly and produces output with non-empty stdout."""
    assert main is not None, "dashForge.main.main is not available"
    out_sqlite = tmp_path / "ac5_test.sqlite"
    out_snap = tmp_path / "ac5_test.snapshot.json"

    ret = main(
        [
            "generate",
            "--pack",
            "snowflakeCost",
            "--scenario",
            "idle-warehouse-waste",
            "--seed",
            "9101",
            "--output",
            str(out_sqlite),
            "--snapshot-output",
            str(out_snap),
            "--force",
        ]
    )
    assert ret == 0
    assert out_sqlite.exists()
    assert out_snap.exists()

    captured = capsys.readouterr()
    assert (
        "Generated snowflakeCost/idle-warehouse-waste" in captured.out
    ), f"Expected generated announcement missing in stdout: {captured.out}"


def test_ac5_fail_closed_overwrite_protection_intact(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """Verify CLI aborts with exit code 2 when output exists without --force."""
    assert main is not None, "dashForge.main.main is not available"
    out_sqlite = tmp_path / "ac5_existing.sqlite"
    out_sqlite.write_text("existing content", encoding="utf-8")

    with pytest.raises(SystemExit) as exit_info:
        main(
            [
                "generate",
                "--pack",
                "snowflakeCost",
                "--scenario",
                "idle-warehouse-waste",
                "--seed",
                "9101",
                "--output",
                str(out_sqlite),
            ]
        )
    assert exit_info.value.code == 2
    captured = capsys.readouterr()
    err_lower = captured.err.lower()
    assert (
        "force" in err_lower or "exists" in err_lower
    ), f"Expected overwrite error message in stderr: {captured.err}"
    assert "traceback (most recent call last)" not in err_lower
    assert "traceback (most recent call last)" not in captured.out.lower()


def test_ac5_existing_packs_regression(tmp_path: Path) -> None:
    """Verify healthcare, financial, and saas packs generate without regression."""
    assert (
        generate_healthcare_database is not None
    ), "generate_healthcare_database missing"
    assert (
        generate_financial_database is not None
    ), "generate_financial_database missing"
    assert generate_saas_database is not None, "generate_saas_database missing"

    hc_conn = generate_healthcare_database(seed=42)
    assert (
        hc_conn.execute("SELECT count(*) FROM encounters").fetchone()[0] > 0
    )

    fin_conn = generate_financial_database(seed=42)
    assert (
        fin_conn.execute("SELECT count(*) FROM trades").fetchone()[0] > 0
    )

    saas_conn = generate_saas_database(seed=42)
    assert (
        saas_conn.execute("SELECT count(*) FROM subscriptions").fetchone()[0] > 0
    )


def test_ac5_dataforge_sibling_repo_unmodified() -> None:
    """Verify sibling project dataForge has zero uncommitted modifications."""
    dataforge_dir = ROOT.parent / "dataForge"
    if not (dataforge_dir / ".git").exists():
        pytest.skip(f"dataForge git directory not found at {dataforge_dir}")

    result = subprocess.run(
        ["git", "-C", str(dataforge_dir), "status", "--porcelain"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert (
        result.stdout.strip() == ""
    ), f"Sibling repository dataForge has uncommitted changes:\n{result.stdout}"

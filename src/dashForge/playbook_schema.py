"""Playbook schema and user journey simulation verification utilities for DashForge.

This module defines canonical schemas and helper functions for constructing and
validating user journey manifests and execution results in governed Agent-Orch
playbook runs, preventing schema validation failures caused by empty
``stdout_contains`` properties.
"""

from __future__ import annotations

import importlib
import json
from pathlib import Path
from typing import Any

# Canonical journey authority definitions
DEFAULT_JOURNEY_AUTHORITY: str = "author"
JOURNEY_AUTHORITIES: tuple[str, ...] = ("human", "mission", "author", "exploratory")
REQUIRED_JOURNEY_AUTHORITIES: frozenset[str] = frozenset({"human", "mission", "author"})

# Canonical JSON schemas for user journeys manifest and results
USER_JOURNEYS_MANIFEST_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["journeys", "command_allowlist"],
    "properties": {
        "schema_version": {"type": "integer"},
        "contract": {"type": "string", "minLength": 1},
        "objective": {"type": "string", "minLength": 1},
        "journeys": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["name"],
                "properties": {
                    "id": {"type": "string", "minLength": 1},
                    "name": {"type": "string", "minLength": 1},
                    "goal": {"type": "string", "minLength": 1},
                    "authority": {"enum": list(JOURNEY_AUTHORITIES)},
                    "status": {"type": "string", "minLength": 1},
                    "exploratory": {"type": "boolean"},
                    "source_refs": {
                        "type": "array",
                        "items": {"type": "string", "minLength": 1},
                    },
                    "commands": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"type": "string", "minLength": 1},
                    },
                    "steps": {
                        "type": "array",
                        "items": {"type": "string", "minLength": 1},
                    },
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

USER_JOURNEYS_RESULT_SCHEMA: dict[str, Any] = {
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


def build_command_claim(
    command: str,
    exit_code: int,
    stdout_substring: str | None = None,
) -> dict[str, Any]:
    """Construct a verified command claim dictionary.

    Enforces the contract requirement that ``stdout_contains`` must be a
    non-empty string (minLength >= 1) when specified, and must be omitted
    entirely when no stdout assertion is required. Empty string (``""``)
    or ``None`` values will never be added to the claim dictionary.

    Args:
        command: The command line string executed from the workspace root.
        exit_code: The process exit code.
        stdout_substring: Optional substring that must appear in stdout.
            If None, empty, or whitespace-only, the key is omitted.

    Returns:
        A command claim dictionary adhering to ``USER_JOURNEYS_RESULT_SCHEMA``.
    """
    claim: dict[str, Any] = {
        "command": command,
        "exit_code": int(exit_code),
    }
    if stdout_substring is not None:
        stripped = stdout_substring.strip()
        if stripped:
            claim["stdout_contains"] = stdout_substring
    return claim


def sanitize_command_claim(claim: dict[str, Any]) -> dict[str, Any]:
    """Sanitize a command claim by removing empty or whitespace stdout_contains.

    Args:
        claim: An existing command claim dictionary.

    Returns:
        A sanitized copy of the claim dictionary.
    """
    sanitized = dict(claim)
    if "stdout_contains" in sanitized:
        val = sanitized["stdout_contains"]
        if val is None or (isinstance(val, str) and not val.strip()):
            del sanitized["stdout_contains"]
    return sanitized


def validate_command_claim(claim: dict[str, Any]) -> None:
    """Validate that a command claim adheres to schema rules.

    Raises:
        ValueError: If stdout_contains is present but empty or whitespace.
    """
    if "stdout_contains" in claim:
        val = claim["stdout_contains"]
        if not isinstance(val, str) or not val.strip():
            raise ValueError(
                f"Invalid stdout_contains in command claim: {val!r}. "
                "Must be a non-empty string with minLength >= 1, or omitted entirely."
            )


def build_journey_entry(
    name: str,
    steps_taken: str | list[str],
    commands_run: list[dict[str, Any]],
    status: str = "passed",
) -> dict[str, Any]:
    """Build a journey entry dictionary for result.json.

    Args:
        name: Name of the journey.
        steps_taken: Natural language summary or list of steps.
        commands_run: List of command claim dictionaries.
        status: Execution status ('passed' or 'failed').

    Returns:
        A journey result dictionary.
    """
    sanitized_commands = [sanitize_command_claim(cmd) for cmd in commands_run]
    return {
        "name": name,
        "status": status,
        "steps_taken": steps_taken,
        "commands_run": sanitized_commands,
    }


def build_user_journeys_result(
    journeys: list[dict[str, Any]],
    findings: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Assemble a full user journeys result artifact structure.

    Args:
        journeys: List of journey result dictionaries.
        findings: List of finding dictionaries (defaults to empty list).

    Returns:
        Result dictionary adhering to ``USER_JOURNEYS_RESULT_SCHEMA``.
    """
    return {
        "journeys": journeys,
        "findings": findings if findings is not None else [],
    }


def validate_manifest(manifest: dict[str, Any]) -> None:
    """Validate user journeys manifest against schema and business rules.

    Args:
        manifest: Manifest data dictionary.

    Raises:
        ValueError: If validation fails.
    """
    try:
        jsonschema = importlib.import_module("jsonschema")
        jsonschema.validate(instance=manifest, schema=USER_JOURNEYS_MANIFEST_SCHEMA)
    except ImportError:
        # Basic fallback validation
        if not isinstance(manifest.get("journeys"), list):
            raise ValueError("Manifest missing 'journeys' list")
        if not isinstance(manifest.get("command_allowlist"), list):
            raise ValueError("Manifest missing 'command_allowlist' list")


def validate_result(result: dict[str, Any]) -> None:
    """Validate user journeys result against schema.

    Args:
        result: Result data dictionary.

    Raises:
        ValueError: If validation fails.
    """
    try:
        jsonschema = importlib.import_module("jsonschema")
        jsonschema.validate(instance=result, schema=USER_JOURNEYS_RESULT_SCHEMA)
    except ImportError:
        if not isinstance(result.get("journeys"), list):
            raise ValueError("Result missing 'journeys' list")
        if not isinstance(result.get("findings"), list):
            raise ValueError("Result missing 'findings' list")


__all__ = [
    "DEFAULT_JOURNEY_AUTHORITY",
    "JOURNEY_AUTHORITIES",
    "REQUIRED_JOURNEY_AUTHORITIES",
    "USER_JOURNEYS_MANIFEST_SCHEMA",
    "USER_JOURNEYS_RESULT_SCHEMA",
    "build_command_claim",
    "build_journey_entry",
    "build_user_journeys_result",
    "sanitize_command_claim",
    "validate_command_claim",
    "validate_manifest",
    "validate_result",
]

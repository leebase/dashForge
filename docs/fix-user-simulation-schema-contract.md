# Fix User Simulation Schema Slice Contract

## Overview

DashForge operates as an internal consulting delivery accelerator for Anblicks, designed to empower client delivery leads, consultants, and practice directors to present credible, interactive, and industry-specific dashboard experiences during executive discovery workshops and client presentations. The platform couples deterministic data generation with structured schema contracts (`DashboardSpec`, `SQLiteSnapshot`, and `DataAdapter`), ensuring offline reliability without requiring live cloud credentials or external network access.

The `fix-user-simulation-schema` vertical slice addresses a structural schema validation defect encountered during governed Agent-Orch playbook executions at the `step_08b_user_simulation_gate` stage. The user-simulation gate evaluates user journey execution evidence in `artifacts/user-test/result.json` against the canonical `USER_JOURNEYS_RESULT_SCHEMA`. This schema specifies that whenever a command verification claim includes standard output assertions via the `stdout_contains` property, the value must be a non-empty string with a minimum length of 1 character (`{"type": "string", "minLength": 1}`). Previous gate runs failed when automated evaluations or reporting scripts recorded empty string values (`""`) for `stdout_contains`, immediately halting the governed pipeline.

This slice formalizes the operational and schema contract governing user journey simulations, establishing strict standards ensuring that `stdout_contains` is never empty. Commands that do not assert specific standard output text omit the property entirely, while commands that do verify output supply re-executable, non-empty substrings. By establishing this contract and synchronizing the user journeys manifest in `journeys/user_journeys_manifest.json`, this slice unblocks future governed playbook runs across DashForge while preserving all existing pipeline validations, CLI behaviors, and multi-pack test suites intact.

## Problem

During governed playbook execution in Agent-Orch, the `step_08b_user_simulation_gate` serves as an automated quality gate verifying that implemented slices satisfy human and mission-defined user journeys. Unlike deterministic unit tests, user journeys represent natural-language operator goals pursued by independent evaluator agents. Evaluators execute allowlisted CLI commands from the workspace root and record their observations in `artifacts/user-test/result.json`, documenting the steps taken, exit codes, and optional stdout substring claims (`stdout_contains`).

The orchestrator enforces two complementary integrity checks on these user test results: structural schema conformance via JSON Schema validation, and mechanical execution verification where the orchestrator re-executes allowlisted command claims to confirm reported exit codes and stdout substrings. In previous playbook runs, user simulation executions encountered validation failures because command result entries populated `stdout_contains` with empty string values (`""`) or default placeholders instead of omitting the optional property when no substring check was intended. Because `USER_JOURNEYS_RESULT_SCHEMA` enforces `"minLength": 1` on `stdout_contains`, schema validation halted with a fatal error, rejecting otherwise successful runs.

To unblock the delivery pipeline and ensure predictable execution across future playbooks, DashForge requires an explicit slice contract and synchronized user journeys manifest that resolve this defect. The contract must mandate that `stdout_contains` is never an empty string across all journey definitions and result artifacts, enforce verbatim workspace-root command compatibility, eliminate un-executable shell pipelines from journey claims, and guarantee zero regressions across DashForge's existing data generation and test infrastructure.

## Required Outputs

This slice governs the definition, authoring, and verification of the following deliverables across the governed implementation lifecycle:

- `docs/fix-user-simulation-schema-contract.md`: The formal slice contract defining the problem, required outputs, operational constraints, multi-tier validation methodology, execution routing intent, and enumerated acceptance checks (`AC-1` through `AC-5`) with over 120 non-whitespace characters under all required headings.
- `journeys/user_journeys_manifest.json`: The synchronized user journeys manifest conforming to `USER_JOURNEYS_MANIFEST_SCHEMA`, defining natural-language journeys mapped to every acceptance check (`AC-1` through `AC-5`) in `traces_to`, declaring valid authorities (`human`, `mission`, `author`), and specifying an allowlist of verbatim executable commands.
- Implementation and Test Verification Artifacts: Downstream test assertions and validation logic ensuring that generated user test reports adhere strictly to schema rules without empty `stdout_contains` fields, while preserving all existing test suites (`tests/test_package_snapshot.py`, `tests/test_snowflake_cost_pack.py`, `tests/test_idle_warehouse_waste.py`, `tests/test_idle_warehouse_dashboard.py`).

## Constraints

The implementation, verification, and execution of the `fix-user-simulation-schema` slice are governed by the following architectural and operational constraints:

1. **Non-Empty stdout_contains Requirement**: Across all user journey specifications, evaluator reporting tools, and result artifacts (`artifacts/user-test/result.json`), the `stdout_contains` property must never be set to an empty string or whitespace. Every `stdout_contains` assertion must satisfy `minLength >= 1`.
2. **Property Omission When Unasserted**: When a journey command does not require substring output verification, the `stdout_contains` key must be omitted entirely from the command claim dictionary rather than passed as `""` or `null`.
3. **Verbatim Root Execution**: Every allowlisted command in `command_allowlist` and every command recorded by a user journey must be executable verbatim from the workspace root using system `python3`. Application entrypoints must use the exact form `env PYTHONPATH=src python3 -m dashForge.main` (never a bare `PYTHONPATH=src` without `env`).
4. **Test Suite Command Specification**: The full test suite must be executed exactly as `python3 -m pytest tests/ -q` with NO `PYTHONPATH` override. The orchestrator re-executes claims in a bounded virtual environment whose own `PYTHONPATH` provides pytest access; introducing an override masks the system environment and causes re-execution failures.
5. **Prohibition of Shell Pipelines in Verifiable Claims**: Evaluator journey claims must not rely on shell pipelines (`|`), logical chaining operators (`&&`, `||`, `;`), or file redirection (`<`, `>`). Standalone utilities such as `jq`, `grep`, or `cat` cannot serve as a journey's sole verification evidence because the orchestrator executes argv directly without a shell.
6. **Targeted Pytest Invocations for Metadata and Structure Checks**: Verification of internal data structures, schemas, or file contents must be performed using targeted pytest commands in the exact format `python3 -m pytest <test file> -q -k <test name>` or standard application CLI invocations.
7. **Preservation of Existing Pipeline Validations**: All existing pipeline capabilities—including SQLite database generation, canonical snapshot export, fail-closed CLI argument parsing, overwrite protection requiring `--force`, and existing industry packs (`healthcare`, `financial`, `saas`, `snowflakeCost`)—must remain fully operational with zero regressions.
8. **Governed Write Scope Enforcement**: Persisted file modifications for this step are strictly restricted to the `docs/` and `journeys/` directories. Modifying any path outside these boundaries results in immediate step failure under Agent-Orch governance.

## Validation

Validation of the `fix-user-simulation-schema` slice follows a multi-tier deterministic verification process:

1. **Structural Markdown and Schema Validation**: Confirmation that `docs/fix-user-simulation-schema-contract.md` exists and contains all required headings (`Overview`, `Problem`, `Constraints`, `Acceptance Checks`) with at least 120 non-whitespace characters under each heading, and that `journeys/user_journeys_manifest.json` parses as valid JSON conforming to `USER_JOURNEYS_MANIFEST_SCHEMA`.
2. **Traceability and Authority Verification**: Verification that every acceptance check (`AC-1` through `AC-5`) is covered by at least one required user journey in `journeys/user_journeys_manifest.json` via `traces_to`, and that all journeys carry valid authorities (`human`, `mission`, `author`, or `exploratory`).
3. **Command Allowlist Verbatim Matching**: Verification that all commands declared in the manifest match argv prefixes in `command_allowlist` and execute successfully from the workspace root with exit code 0.
4. **Targeted Pytest Execution**: Execution of targeted test commands (`python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_snapshot_schema_conformance` and `python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_no_external_runtime_dependencies`) confirming specific schema and isolation contracts.
5. **Full Regression Test Suite**: Execution of `python3 -m pytest tests/ -q` with no `PYTHONPATH` override, verifying that all 143 existing automated tests pass cleanly with zero failures.
6. **User Simulation Gate Simulation**: Independent re-execution of user journey commands under `agent_orch` verification rules, ensuring claimed exit codes match, non-empty `stdout_contains` claims reproduce faithfully, and no empty-string validation errors are raised.

## Routing Intent

Execution routing across the governed slice lifecycle is structured as follows:

- **Producer / Contract Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Formulates the slice contract in `docs/fix-user-simulation-schema-contract.md` and synchronizes the user journeys manifest in `journeys/user_journeys_manifest.json` within allowed paths (`docs/`, `journeys/`).
- **Planner Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Details the implementation and verification plan under `plans/`, establishing explicit traceability between acceptance checks, test cases, and delivery steps.
- **Test Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Authors targeted unit and integration tests asserting schema compliance and preventing regressions in user journey reporting.
- **Implementation Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Implements code and configuration updates to guarantee non-empty `stdout_contains` behavior in simulation workflows.
- **Evaluator / User Tester Route (`user_tester` / `gemini-3.1-pro`)**: Executes natural-language user journeys against allowlisted command prefixes, ensuring exit codes and non-empty stdout substrings reproduce without shell pipelines.
- **Independent Reviewer Route (`slice_reviewer` / `gemini-3.1-pro`)**: Audits changes, test outputs, and validation evidence against the contract to issue an authoritative review verdict.

## Acceptance Checks

The `fix-user-simulation-schema` vertical slice must satisfy the following explicit acceptance checks:

- **AC-1**: In all user journey execution result artifacts (`artifacts/user-test/result.json`) and simulation reporting, every command entry within `commands_run` that includes the `stdout_contains` property strictly specifies a non-empty string with `minLength >= 1`, and commands that do not assert substring output omit the `stdout_contains` key entirely, preventing schema validation failures during `step_08b_user_simulation_gate`.
- **AC-2**: The synchronized user journeys manifest in `journeys/user_journeys_manifest.json` conforms to `USER_JOURNEYS_MANIFEST_SCHEMA`, assigns valid authority levels (`human`, `mission`, `author`, or `exploratory`), and explicitly links every non-exploratory journey via `traces_to` to cover all enumerated acceptance checks (`AC-1` through `AC-5`) without unreferenced or uncoverable IDs.
- **AC-3**: All command strings declared in `command_allowlist` and recorded across user journey execution claims are runnable verbatim from the repository root using system `python3`, requiring application CLI commands to utilize the exact `env PYTHONPATH=src python3 -m dashForge.main` prefix and test suite commands to run as `python3 -m pytest tests/ -q` with no `PYTHONPATH` override.
- **AC-4**: Every user journey in `journeys/user_journeys_manifest.json` is verifiable by at least one re-executable command whose argv prefix matches `command_allowlist`, prohibiting shell pipelines (`|`), boolean operators (`&&`, `||`, `;`), file redirection (`<`, `>`), or standalone utilities (`jq`, `grep`, `cat`) as a journey's sole verification evidence, using targeted pytest commands (`python3 -m pytest <test file> -q -k <test name>`) or application CLI commands for structure and metadata verification.
- **AC-5**: All existing DashForge capabilities—including deterministic multi-pack scenario generation (`healthcare`, `financial`, `saas`, and `snowflakeCost`), fail-closed overwrite protection, CLI diagnostic error reporting via `parser.error()`, snapshot serialization, and the complete regression test suite (`python3 -m pytest tests/ -q`)—remain fully operational and pass cleanly with zero regressions.

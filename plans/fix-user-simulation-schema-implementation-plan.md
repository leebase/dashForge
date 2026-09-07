# Fix User Simulation Schema Implementation Plan

## Executive Summary & Slice Intent

The `fix-user-simulation-schema` vertical slice resolves a critical structural schema validation failure encountered during governed Agent-Orch playbook executions at the `step_08b_user_simulation_gate` stage. DashForge operates as an internal consulting delivery accelerator for Anblicks analytics consultants, client delivery leads, and practice directors engaging enterprise executive buyers. The platform combines deterministic data generation with structured schema contracts (`DashboardSpec`, `SQLiteSnapshot`, and `DataAdapter`), ensuring offline pre-sales presentation reliability without requiring live cloud credentials or external network access.

During governed playbook execution, `step_08b_user_simulation_gate` serves as an automated quality gate verifying that implemented slices satisfy human and mission-defined user journeys. Evaluator agents execute allowlisted CLI commands from the workspace root and record their observations in `artifacts/user-test/result.json`, documenting the commands run, exit codes, and optional stdout substring verification claims (`stdout_contains`). The gate validates this evidence against the canonical `USER_JOURNEYS_RESULT_SCHEMA`. This schema specifies that whenever a command verification claim includes standard output assertions via the `stdout_contains` property, the value must be a non-empty string with a minimum length of 1 character (`{"type": "string", "minLength": 1}`). Previous gate runs failed when automated evaluations or reporting scripts recorded empty string values (`""`) for `stdout_contains` instead of omitting the optional property when no substring assertion was intended, immediately halting the governed pipeline.

The slice intent is to formalize and enforce the operational and schema contract governing user journey simulations, establishing strict standards ensuring that `stdout_contains` is never an empty string. Commands that do not assert specific standard output text omit the property entirely, while commands that do verify output supply re-executable, non-empty substrings. This slice establishes an implementation plan and verification protocol that synchronizes `journeys/user_journeys_manifest.json`, unblocks future governed playbook runs across DashForge, and preserves all existing pipeline validations, CLI behaviors, and multi-pack test suites with zero regressions. Every acceptance check defined in `docs/fix-user-simulation-schema-contract.md` (`AC-1` through `AC-5`) maps directly to a concrete plan item, verified through automated unit tests, targeted pytest checks, and the full regression test suite.

---

## Architecture

The architecture of the user simulation quality gate within DashForge and the Agent-Orch orchestrator establishes a dual-tier verification model: structural schema conformance and mechanical execution reproduction. Understanding this architecture is essential to preventing schema validation failures and ensuring reliable playbook execution.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    User Journeys Manifest Definition                        │
│  journeys/user_journeys_manifest.json                                       │
│    ├── Schema: USER_JOURNEYS_MANIFEST_SCHEMA (Draft 2020-12)                │
│    ├── Authority Governance: human | mission | author | exploratory         │
│    ├── Acceptance Traceability: traces_to: ["AC-1", "AC-2", ..., "AC-5"]    │
│    └── Command Allowlist: Exact root-executable command prefixes             │
│        ├── "env PYTHONPATH=src python3 -m dashForge.main"                   │
│        ├── "python3 -m pytest tests/ -q"                                    │
│        └── "python3 -m pytest"                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Evaluator Agent Execution & Claim Recording                 │
│  Agent Route: user_tester / gemini-3.1-pro                                  │
│    ├── Direct Argv Invocations (Workspace Root, System python3)             │
│    ├── Prohibited: Shell pipelines (|), redirection (<, >), chaining (&&, ;)│
│    └── Result Assembly: artifacts/user-test/result.json                     │
│        └── commands_run[i]:                                                 │
│            ├── command: Exact allowlisted string                            │
│            ├── exit_code: Integer (0 or expected non-zero)                  │
│            └── stdout_contains: Non-empty string (minLength >= 1)           │
│                OR OMITTED ENTIRELY if no substring is checked               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                Quality Gate: step_08b_user_simulation_gate                  │
│                                                                             │
│  Tier 1: Structural Schema Conformance                                      │
│    ├── Target: artifacts/user-test/result.json                              │
│    ├── Canonical Schema: USER_JOURNEYS_RESULT_SCHEMA                        │
│    │     "stdout_contains": { "type": "string", "minLength": 1 }            │
│    └── Constraint: "" or whitespace causes immediate validation rejection   │
│                                                                             │
│  Tier 2: Mechanical Execution Verification                                  │
│    ├── Re-executes allowlisted command claims via direct subprocess.run     │
│    ├── Compares reported exit_code against actual exit_code                 │
│    └── Asserts stdout_contains substring exists in actual command stdout    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Governed Outcome & Promotion                          │
│    ├── Gate Status: PASSED (Unblocks slice review and delivery)              │
│    └── Gate Status: FAILED (Halts workflow; requires repair)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Subsystems and Architectural Seams

1. **Manifest Governance Subsystem (`journeys/user_journeys_manifest.json`)**:
   - Conforms strictly to `USER_JOURNEYS_MANIFEST_SCHEMA` using JSON Schema Draft 2020-12.
   - Requires top-level fields: `schema_version` (integer 1), `contract` (path reference to `docs/fix-user-simulation-schema-contract.md`), `objective` (string describing slice verification intent), `command_allowlist` (array of permitted argv prefixes), and `journeys` (array of journey definitions).
   - Each journey object declares:
     - `id`: Unique kebab-case identifier (e.g., `journey-fix-user-sim-stdout-contains`).
     - `name`: Concise summary of the operator activity.
     - `goal`: Clear statement of operator intent and verification criteria.
     - `authority`: Strict categorization (`human`, `mission`, `author`, or `exploratory`).
     - `status`: Execution state indicator (`passed`).
     - `exploratory`: Boolean flag. When `false`, the journey is non-exploratory and must participate in acceptance check traceability.
     - `source_refs`: Relative file paths underpinning the journey's subject matter.
     - `commands`: Array of verbatim commands executable from workspace root.
     - `steps`: Sequential natural-language steps taken by the operator.
     - `traces_to`: Array of contract acceptance check identifiers (`AC-1` through `AC-5`). The union of `traces_to` across all non-exploratory journeys must completely cover every acceptance check without omitting any check ID or introducing unreferenced IDs.

2. **Command Allowlist & Root Execution Seam**:
   - The orchestrator executes command claims using raw argv lists without an intermediate shell (`shell=False`).
   - Shell features—including pipelines (`|`), command chaining (`&&`, `||`, `;`), file redirection (`<`, `>`), and shell builtins—fail or produce unpredictable argv parsing when executed directly.
   - Allowlisted prefixes are standardized:
     - Application CLI entrypoints: `env PYTHONPATH=src python3 -m dashForge.main`. The `env` prefix guarantees that `PYTHONPATH=src` is passed directly to the environment of `python3`, allowing root execution without requiring package installation (`pip install -e .`). Bare `PYTHONPATH=src` without `env` is rejected because bare variable assignment is a shell syntax construct.
     - Pytest test runner: `python3 -m pytest tests/ -q` or `python3 -m pytest <test file> -q -k <test name>`. These commands MUST NOT include a `PYTHONPATH` override. The orchestrator re-executes claims within a bounded virtual environment whose own `PYTHONPATH` already provides pytest access; injecting a conflicting override masks system packages and causes execution failures.

3. **Result Schema Enforcement Seam (`artifacts/user-test/result.json`)**:
   - Evaluator agents and reporting scripts assemble result artifacts documenting executed journeys.
   - Each entry in `commands_run` follows the contract:
     - `command`: The exact command string executed from the workspace root.
     - `exit_code`: The integer exit status returned by the process.
     - `stdout_contains`: Optional string property. If present, it MUST satisfy `len(stdout_contains) >= 1`. If no substring check is asserted, the key MUST be omitted completely. It must NEVER be serialized as `""`, `null`, or whitespace.

4. **Integration with Existing DashForge Core**:
   - Preserves all CLI argument parsing, subcommands (`generate`), option validation, and fail-closed error handling via `parser.error()`.
   - Maintains full compatibility with existing industry packs (`healthcare`, `financial`, `saas`, and `snowflakeCost`), canonical SQLite snapshot packaging (`src/dashForge/package_snapshot.py`), and downstream frontend consumers.

---

## Concrete Plan Items & Work Breakdown

The work breakdown comprises five concrete, sequentially executable plan items directly mapped to contract acceptance checks `AC-1` through `AC-5`:

### Plan Item 1: Enforce Non-Empty `stdout_contains` Schema Guarantee & Property Omission (`AC-1`)
- **Mapped Acceptance Check**: `AC-1` ("In all user journey execution result artifacts (`artifacts/user-test/result.json`) and simulation reporting, every command entry within `commands_run` that includes the `stdout_contains` property strictly specifies a non-empty string with `minLength >= 1`, and commands that do not assert substring output omit the `stdout_contains` key entirely, preventing schema validation failures during `step_08b_user_simulation_gate`.")
- **Objective**: Guarantee that all user journey execution reporting and result artifacts strictly adhere to `USER_JOURNEYS_RESULT_SCHEMA` by enforcing `minLength >= 1` on `stdout_contains` whenever present, and omitting the key entirely when no stdout assertion is required.
- **Implementation Touchpoints**:
  - In journey result serialization and test reporting: Ensure that result generator dictionaries construct command claims using conditional key inclusion:
    ```python
    command_claim: dict[str, Any] = {
        "command": command_str,
        "exit_code": exit_code,
    }
    if stdout_substring:  # Only add if non-empty string
        command_claim["stdout_contains"] = stdout_substring
    ```
  - Author schema validation tests verifying that result structures with empty string `stdout_contains: ""` fail validation, while omitted keys and non-empty strings pass.
  - Verify that `artifacts/user-test/result.json` emitted by simulation runs satisfies schema validation without warnings or errors.
- **Deliverables**: Verified result serialization logic and schema validation unit tests confirming `minLength >= 1` enforcement and clean key omission.

### Plan Item 2: Synchronize User Journeys Manifest Schema Conformance & Authority Governance (`AC-2`)
- **Mapped Acceptance Check**: `AC-2` ("The synchronized user journeys manifest in `journeys/user_journeys_manifest.json` conforms to `USER_JOURNEYS_MANIFEST_SCHEMA`, assigns valid authority levels (`human`, `mission`, `author`, or `exploratory`), and explicitly links every non-exploratory journey via `traces_to` to cover all enumerated acceptance checks (`AC-1` through `AC-5`) without unreferenced or uncoverable IDs.")
- **Objective**: Ensure that `journeys/user_journeys_manifest.json` conforms to `USER_JOURNEYS_MANIFEST_SCHEMA`, specifies valid schema version, references the contract, assigns permitted authority levels (`human`, `mission`, `author`, `exploratory`), and establishes bidirectional traceability covering all acceptance checks (`AC-1` through `AC-5`).
- **Implementation Touchpoints**:
  - In `journeys/user_journeys_manifest.json`:
    - Confirm top-level `$schema`, `schema_version: 1`, `contract`, `objective`, and `command_allowlist`.
    - Verify journey definitions for valid authority values:
      - `journey-fix-user-sim-stdout-contains`: `authority: "human"`, `traces_to: ["AC-1", "AC-3"]`
      - `journey-fix-user-sim-manifest-sync`: `authority: "mission"`, `traces_to: ["AC-2", "AC-4"]`
      - `journey-fix-user-sim-verbatim-commands`: `authority: "author"`, `traces_to: ["AC-3"]`
      - `journey-fix-user-sim-targeted-verification`: `authority: "author"`, `traces_to: ["AC-4"]`
      - `journey-fix-user-sim-full-regression-suite`: `authority: "human"`, `traces_to: ["AC-5"]`
    - Verify that no journey contains empty strings or unreferenced acceptance check identifiers in `traces_to`.
- **Deliverables**: Validated `journeys/user_journeys_manifest.json` adhering to schema and covering `AC-1` through `AC-5`.

### Plan Item 3: Standardize Verbatim Root Command Execution & Environment Prefixes (`AC-3`)
- **Mapped Acceptance Check**: `AC-3` ("All command strings declared in `command_allowlist` and recorded across user journey execution claims are runnable verbatim from the repository root using system `python3`, requiring application CLI commands to utilize the exact `env PYTHONPATH=src python3 -m dashForge.main` prefix and test suite commands to run as `python3 -m pytest tests/ -q` with no `PYTHONPATH` override.")
- **Objective**: Ensure that every command in `command_allowlist` and every journey execution claim is runnable verbatim from the repository root using system `python3`, standardizing on `env PYTHONPATH=src python3 -m dashForge.main` for CLI invocations and `python3 -m pytest tests/ -q` for full test suite runs.
- **Implementation Touchpoints**:
  - Audit all commands in `journeys/user_journeys_manifest.json` to guarantee exact prefix conformity.
  - Verify that application CLI commands use `env PYTHONPATH=src python3 -m dashForge.main` rather than bare `PYTHONPATH=src` (which fails under direct subprocess execution) or un-prefixed `python3 -m dashForge.main` (which fails module resolution if uninstalled).
  - Verify that test suite commands use `python3 -m pytest tests/ -q` without `PYTHONPATH` overrides, ensuring clean execution within orchestrator virtual environments.
- **Deliverables**: Standardized command allowlist and journey definitions verified for verbatim root execution.

### Plan Item 4: Eliminate Shell Pipelines & Implement Verifiable Argv Invocations (`AC-4`)
- **Mapped Acceptance Check**: `AC-4` ("Every user journey in `journeys/user_journeys_manifest.json` is verifiable by at least one re-executable command whose argv prefix matches `command_allowlist`, prohibiting shell pipelines (`|`), boolean operators (`&&`, `||`, `;`), file redirection (`<`, `>`), or standalone utilities (`jq`, `grep`, `cat`) as a journey's sole verification evidence, using targeted pytest commands (`python3 -m pytest <test file> -q -k <test name>`) or application CLI commands for structure and metadata verification.")
- **Objective**: Ensure that every user journey is verifiable by direct, re-executable argv invocations without shell pipelines, chaining operators, redirection, or reliance on standalone utilities as sole verification evidence, replacing ad-hoc shell checks with targeted pytest commands.
- **Implementation Touchpoints**:
  - Inspect all journey `commands` arrays: guarantee absence of `|`, `&&`, `||`, `;`, `>`, `<`, and standalone calls to `jq`, `grep`, or `cat`.
  - For structural, schema, and metadata verifications, implement and reference targeted pytest invocations:
    - `python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_snapshot_schema_conformance`
    - `python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_no_external_runtime_dependencies`
  - Ensure all targeted pytest commands match the allowed argv prefix `python3 -m pytest`.
- **Deliverables**: Zero shell syntax across all user journeys; targeted pytest commands established for all deep verification claims.

### Plan Item 5: Preserve Existing Pipeline Validations & Regression Suite Integrity (`AC-5`)
- **Mapped Acceptance Check**: `AC-5` ("All existing DashForge capabilities—including deterministic multi-pack scenario generation (`healthcare`, `financial`, `saas`, and `snowflakeCost`), fail-closed overwrite protection, CLI diagnostic error reporting via `parser.error()`, snapshot serialization, and the complete regression test suite (`python3 -m pytest tests/ -q`)—remain fully operational and pass cleanly with zero regressions.")
- **Objective**: Guarantee that all existing core capabilities across DashForge—multi-pack generation, fail-closed overwrite protection, CLI diagnostic error handling, snapshot serialization, and sibling repository isolation—remain intact with all 143 tests passing cleanly.
- **Implementation Touchpoints**:
  - Run full test suite: `python3 -m pytest tests/ -q`.
  - Verify deterministic generation across all packs (`healthcare`, `financial`, `saas`, `snowflakeCost`).
  - Verify fail-closed overwrite protection: invoking CLI without `--force` when output files exist exits with code 2 and routes to `parser.error()`.
  - Verify that sibling repository `dataForge` remains completely unmodified (`git status --porcelain` is empty).
- **Deliverables**: 143 passing tests; zero regressions across CLI and generator pipelines.

---

## Tests

The test strategy for the `fix-user-simulation-schema` slice establishes automated unit and integration tests under `tests/test_fix_user_simulation_schema.py` to verify schema conformance, manifest integrity, command allowlist rules, shell-free journey execution, and backwards compatibility.

### Test Suite Structure: `tests/test_fix_user_simulation_schema.py`

The test file is organized into modular test cases mapping directly to acceptance checks:

```python
# Conceptual layout of tests/test_fix_user_simulation_schema.py

# AC-1: Result schema conformance and non-empty stdout_contains
def test_ac1_stdout_contains_min_length_enforced():
    """Verify that result dictionary with non-empty stdout_contains satisfies schema."""
    ...

def test_ac1_empty_stdout_contains_rejected():
    """Verify that result dictionary with empty string stdout_contains fails schema validation."""
    ...

def test_ac1_omitted_stdout_contains_accepted():
    """Verify that command claims omitting stdout_contains pass schema validation cleanly."""
    ...

# AC-2: Manifest schema conformance and acceptance check traceability
def test_ac2_manifest_conforms_to_schema():
    """Verify journeys/user_journeys_manifest.json parses and adheres to draft 2020-12 schema."""
    ...

def test_ac2_manifest_authorities_valid():
    """Verify all journeys specify valid authority (human, mission, author, exploratory)."""
    ...

def test_ac2_manifest_traces_to_all_acceptance_checks():
    """Verify union of traces_to across non-exploratory journeys covers AC-1 through AC-5."""
    ...

# AC-3: Verbatim root command execution
def test_ac3_command_allowlist_prefixes_valid():
    """Verify command_allowlist contains exact required prefixes."""
    ...

def test_ac3_application_commands_use_env_prefix():
    """Verify all application CLI commands use 'env PYTHONPATH=src python3 -m dashForge.main'."""
    ...

def test_ac3_pytest_commands_have_no_pythonpath_override():
    """Verify all pytest commands run without PYTHONPATH override."""
    ...

# AC-4: Elimination of shell pipelines and verifiable commands
def test_ac4_no_shell_pipelines_in_journey_commands():
    """Verify no journey command uses shell pipelines, chaining, or redirection."""
    ...

def test_ac4_journey_commands_match_allowlist_prefix():
    """Verify every command in every journey matches a prefix in command_allowlist."""
    ...

def test_ac4_targeted_pytest_commands_executable():
    """Verify targeted pytest commands in journeys execute directly with exit code 0."""
    ...

# AC-5: Zero regressions and existing pipeline validation
def test_ac5_cli_generation_snowflake_cost_intact():
    """Verify CLI generation for snowflakeCost runs cleanly and produces output."""
    ...

def test_ac5_fail_closed_overwrite_protection_intact():
    """Verify CLI aborts with exit code 2 when output exists without --force."""
    ...

def test_ac5_existing_packs_regression():
    """Verify healthcare, financial, and saas packs generate without regression."""
    ...

def test_ac5_dataforge_sibling_repo_unmodified():
    """Verify sibling project dataForge has zero uncommitted modifications."""
    ...
```

### Detailed Test Specifications

1. **`test_ac1_stdout_contains_min_length_enforced` & `test_ac1_empty_stdout_contains_rejected` (`AC-1`)**:
   - Validates JSON Schema rules on `stdout_contains`.
   - Uses `jsonschema.validate` against `USER_JOURNEYS_RESULT_SCHEMA` (or the canonical schema definition).
   - Asserts that `{"command": "...", "exit_code": 0, "stdout_contains": "Generated"}` passes.
   - Asserts that `{"command": "...", "exit_code": 0, "stdout_contains": ""}` raises `ValidationError`.
   - Asserts that `{"command": "...", "exit_code": 0}` (omitted key) passes.

2. **`test_ac2_manifest_conforms_to_schema` & `test_ac2_manifest_traces_to_all_acceptance_checks` (`AC-2`)**:
   - Reads `journeys/user_journeys_manifest.json`.
   - Asserts top-level fields `schema_version == 1`, `contract == "docs/fix-user-simulation-schema-contract.md"`.
   - Collects `traces_to` across all non-exploratory journeys.
   - Asserts that `{"AC-1", "AC-2", "AC-3", "AC-4", "AC-5"}.issubset(all_traces)`.
   - Asserts no unknown or malformed acceptance check IDs exist (e.g., `AC-6`).
   - Asserts each journey specifies `authority in {"human", "mission", "author", "exploratory"}`.

3. **`test_ac3_command_allowlist_prefixes_valid` & `test_ac3_application_commands_use_env_prefix` (`AC-3`)**:
   - Asserts `command_allowlist` includes `"env PYTHONPATH=src python3 -m dashForge.main"`, `"python3 -m pytest tests/ -q"`, and `"python3 -m pytest"`.
   - Inspects all commands in journeys: any command running `dashForge.main` must start with `env PYTHONPATH=src python3 -m dashForge.main`.
   - Inspects all pytest commands: none start with `PYTHONPATH=...` or `env PYTHONPATH=...`.

4. **`test_ac4_no_shell_pipelines_in_journey_commands` (`AC-4`)**:
   - Scans all command strings across all journeys for prohibited characters: `|`, `&&`, `||`, `;`, `>`, `<`.
   - Scans for disallowed standalone shell tools as primary evidence: `jq`, `grep`, `cat`, `awk`, `sed`.
   - Asserts that each journey command starts with at least one prefix declared in `command_allowlist`.

5. **`test_ac5_fail_closed_overwrite_protection_intact` & `test_ac5_existing_packs_regression` (`AC-5`)**:
   - Invokes `dashForge.main.main` with existing output paths without `--force`, asserting exit code 2 and error output via `parser.error()`.
   - Iterates through `healthcare`, `financial`, `saas`, and `snowflakeCost` packs, generating sample databases and snapshots to confirm clean zero-regression execution.
   - Inspects `git status --porcelain` on sibling repository `dataForge` to ensure isolation.

---

## Verification

The verification protocol specifies deterministic verification commands runnable from the workspace root by operators, automated validators, and independent reviewers to confirm all acceptance checks (`AC-1` through `AC-5`):

### Step 1: Verify Manifest Schema & Authority Governance (`AC-2`, `AC-4`)
Execute Python script verifying `journeys/user_journeys_manifest.json` integrity:
```bash
python3 -c "
import json
from pathlib import Path

manifest = json.loads(Path('journeys/user_journeys_manifest.json').read_text(encoding='utf-8'))
assert manifest.get('schema_version') == 1, 'Invalid schema version'
assert manifest.get('contract') == 'docs/fix-user-simulation-schema-contract.md', 'Invalid contract ref'

valid_authorities = {'human', 'mission', 'author', 'exploratory'}
all_traces = set()
for j in manifest['journeys']:
    assert j['authority'] in valid_authorities, f'Invalid authority in {j[\"id\"]}: {j[\"authority\"]}'
    if not j.get('exploratory', False):
        traces = j.get('traces_to', [])
        assert len(traces) > 0, f'Non-exploratory journey {j[\"id\"]} has empty traces_to'
        all_traces.update(traces)

expected_acs = {'AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5'}
missing = expected_acs - all_traces
assert not missing, f'Missing AC coverage in manifest: {missing}'
print(f'Manifest validated successfully. Covered ACs: {sorted(all_traces)}')
"
```
- **Expected Result**: Exits with code 0. Prints `"Manifest validated successfully. Covered ACs: ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5']"`.

### Step 2: Verify Command Allowlist & Journey Command Verbatim Syntax (`AC-3`, `AC-4`)
Inspect all journey commands for verbatim allowlist compliance and absence of shell pipelines:
```bash
python3 -c "
import json
from pathlib import Path

manifest = json.loads(Path('journeys/user_journeys_manifest.json').read_text(encoding='utf-8'))
allowlist = manifest.get('command_allowlist', [])
assert len(allowlist) > 0, 'Empty command allowlist'

prohibited_tokens = ['|', '&&', '||', ';', '>', '<', 'jq', 'grep', 'cat']

for j in manifest['journeys']:
    for cmd in j.get('commands', []):
        for token in prohibited_tokens:
            assert token not in cmd.split(), f'Prohibited token \"{token}\" in journey {j[\"id\"]}: {cmd}'
        matches_prefix = any(cmd.startswith(prefix) for prefix in allowlist)
        assert matches_prefix, f'Command does not match allowlist in journey {j[\"id\"]}: {cmd}'

print('All journey commands conform to allowlist prefixes without shell pipelines.')
"
```
- **Expected Result**: Exits with code 0. Prints `"All journey commands conform to allowlist prefixes without shell pipelines."`.

### Step 3: Verify CLI Generation & Non-Empty Stdout Output (`AC-1`, `AC-3`)
Execute application CLI generation command from workspace root to verify non-empty stdout output:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/fix-sim-verify.sqlite \
  --snapshot-output /tmp/fix-sim-verify.snapshot.json \
  --force
```
- **Expected Result**: Exits with code 0. Produces non-empty standard output containing `"Generated snowflakeCost/idle-warehouse-waste"`, satisfying the `minLength >= 1` requirement for `stdout_contains`.

### Step 4: Verify Targeted Pytest Invocations for Metadata & Isolation (`AC-4`)
Execute the targeted pytest checks referenced in user journeys:
```bash
python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_snapshot_schema_conformance
```
- **Expected Result**: Exits with code 0. Confirms snapshot schema conformance.

```bash
python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_no_external_runtime_dependencies
```
- **Expected Result**: Exits with code 0. Confirms zero external runtime dependencies.

### Step 5: Verify Fail-Closed Overwrite Protection (`AC-5`)
Execute CLI command targeting existing output without `--force` to confirm fail-closed behavior:
```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/fix-sim-verify.sqlite \
  --snapshot-output /tmp/fix-sim-verify.snapshot.json
```
- **Expected Result**: Exits with code 2. Emits clean diagnostic message via `parser.error()` indicating target file exists and `--force` is required, with no unhandled Python traceback.

### Step 6: Verify Sibling Repository Isolation (`AC-5`)
Assert that sibling repository `dataForge` remains untouched:
```bash
python3 -c "
import subprocess
from pathlib import Path

dataforge_dir = Path('/home/lee/projects/dataForge')
if dataforge_dir.exists() and (dataforge_dir / '.git').exists():
    res = subprocess.run(['git', '-C', str(dataforge_dir), 'status', '--porcelain'], capture_output=True, text=True, check=True)
    assert res.stdout.strip() == '', f'dataForge has uncommitted changes:\n{res.stdout}'
    print('Sibling repository dataForge is clean.')
else:
    print('dataForge git directory not found; skipping git status check.')
"
```
- **Expected Result**: Exits with code 0. Prints confirmation that `dataForge` is clean.

### Step 7: Execute Complete Python Regression Test Suite (`AC-5`)
Run the full regression test suite with NO `PYTHONPATH` override:
```bash
python3 -m pytest tests/ -q
```
- **Expected Result**: Exits with code 0. All 143 existing automated tests pass cleanly with zero failures in ~17 seconds.

---

## Risks

The following risk assessment details critical technical, operational, and pipeline governance risks associated with user simulation schema validation and command execution, specifying concrete preventative controls:

| Risk Description | Severity | Likelihood | Concrete Technical & Operational Preventative Controls |
|:---|:---:|:---:|:---|
| **Evaluator Recording Empty String Placeholders**: Evaluator reporting scripts record `stdout_contains: ""` when a command produces no output or when output assertion is skipped, violating `USER_JOURNEYS_RESULT_SCHEMA` (`minLength >= 1`) and failing the quality gate. | High | Medium | Enforce key omission protocol: reporting scripts and result serializers MUST conditionally include `stdout_contains` only when `bool(stdout_substring)` evaluates to True. Unit tests in `test_fix_user_simulation_schema.py` explicitly validate that empty strings are rejected and omitted keys are accepted (`AC-1`). |
| **Command Allowlist Prefix Mismatch**: Evaluators invoke commands using relative prefixes or omit required environment variables (e.g., bare `python3 -m dashForge.main` without `PYTHONPATH=src`), resulting in `ModuleNotFoundError` during direct subprocess execution. | High | Low | Standardize all application entrypoints to exact allowlisted prefix `env PYTHONPATH=src python3 -m dashForge.main`. The manifest schema validator enforces that all journey commands begin with an allowlisted prefix (`AC-3`). |
| **Shell Pipeline Re-execution Failure**: Journey claims rely on shell pipelines (`|`), boolean chaining (`&&`), or file redirection (`>`), which fail during orchestrator verification because commands are invoked via argv directly without a shell (`shell=False`). | High | Low | Manifest validation prohibits all shell operators in journey commands. Internal metadata and schema inspections are performed via targeted pytest commands (`python3 -m pytest <test> -q -k <name>`) or CLI flags rather than external tools like `jq` or `grep` (`AC-4`). |
| **Pytest Invocations Masked by PYTHONPATH Override**: An operator or evaluator runs `PYTHONPATH=src python3 -m pytest tests/ -q`, overriding virtual environment path resolution and breaking test discovery or orchestrator sub-environment isolation. | High | Low | Enforce that all pytest commands across documentation, manifests, and scripts run strictly as `python3 -m pytest tests/ -q` with NO `PYTHONPATH` prefix (`AC-3`, `AC-5`). |
| **Acceptance Check Traceability Gaps**: A non-exploratory journey is added or modified without linking to valid acceptance check IDs, or an acceptance check in the contract lacks coverage in `journeys/user_journeys_manifest.json`. | High | Low | Automated test `test_ac2_manifest_traces_to_all_acceptance_checks` asserts that every non-exploratory journey defines non-empty `traces_to` and that the set union covers all contract acceptance checks (`AC-1` through `AC-5`) without dangling IDs (`AC-2`). |
| **Regression in Core CLI Argument Validation**: Changes to CLI handling or command execution inadvertently break fail-closed argument checking, overwrite protection, or dynamic scenario discovery across existing packs. | High | Low | Full regression test suite (`python3 -m pytest tests/ -q`) is executed during verification, testing all 143 automated test cases across healthcare, financial, SaaS, and Snowflake cost packs (`AC-5`). |
| **Sibling Repository Mutation**: Automated or manual steps inadvertently modify files in sibling project `dataForge`, violating repository decoupling. | High | Low | Verification protocol Step 6 executes git porcelain checks on `dataForge`, failing verification if any changes are detected (`AC-5`). |

---

## Traceability Matrix

The following bidirectional traceability matrix explicitly maps every contract acceptance check (`AC-1` through `AC-5`) from `docs/fix-user-simulation-schema-contract.md` to its corresponding plan item, test case, verification command, and user journey reference:

| Contract Acceptance Check | Contract Requirement Summary | Mapped Plan Item | Targeted Unit / Integration Test | Exact Workspace Verification Command | Mapped User Journey (`journeys/user_journeys_manifest.json`) |
|:---|:---|:---|:---|:---|:---|
| **AC-1** | `stdout_contains` must have `minLength >= 1` when present; omitted entirely when unasserted; zero empty strings in `artifacts/user-test/result.json`. | Plan Item 1 | `test_ac1_stdout_contains_min_length_enforced`, `test_ac1_empty_stdout_contains_rejected`, `test_ac1_omitted_stdout_contains_accepted` | `env PYTHONPATH=src python3 -m dashForge.main generate --pack snowflakeCost --scenario idle-warehouse-waste --seed 9101 --output /tmp/fix-sim-verify.sqlite --snapshot-output /tmp/fix-sim-verify.snapshot.json --force` | `journey-fix-user-sim-stdout-contains` |
| **AC-2** | Synchronized manifest in `journeys/user_journeys_manifest.json` conforms to schema, assigns valid authorities, and links all checks `AC-1` through `AC-5` via `traces_to`. | Plan Item 2 | `test_ac2_manifest_conforms_to_schema`, `test_ac2_manifest_authorities_valid`, `test_ac2_manifest_traces_to_all_acceptance_checks` | Python manifest validation script (Step 1 in Verification) | `journey-fix-user-sim-manifest-sync` |
| **AC-3** | All commands in `command_allowlist` and journeys are runnable verbatim from workspace root: application uses `env PYTHONPATH=src python3 -m dashForge.main`, pytest uses no `PYTHONPATH` override. | Plan Item 3 | `test_ac3_command_allowlist_prefixes_valid`, `test_ac3_application_commands_use_env_prefix`, `test_ac3_pytest_commands_have_no_pythonpath_override` | `env PYTHONPATH=src python3 -m dashForge.main --help` | `journey-fix-user-sim-stdout-contains`, `journey-fix-user-sim-verbatim-commands` |
| **AC-4** | Journeys verifiable by re-executable commands matching allowlist; no shell pipelines (`\|`), chaining (`&&`), or redirection (`>`, `<`); targeted pytest for metadata checks. | Plan Item 4 | `test_ac4_no_shell_pipelines_in_journey_commands`, `test_ac4_journey_commands_match_allowlist_prefix`, `test_ac4_targeted_pytest_commands_executable` | `python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_snapshot_schema_conformance` and `python3 -m pytest tests/test_snowflake_cost_pack.py -q -k test_no_external_runtime_dependencies` | `journey-fix-user-sim-manifest-sync`, `journey-fix-user-sim-targeted-verification` |
| **AC-5** | Existing DashForge capabilities (multi-pack generation, fail-closed overwrite protection, CLI diagnostic errors, snapshot serialization) and 143 regression tests remain intact. | Plan Item 5 | `test_ac5_cli_generation_snowflake_cost_intact`, `test_ac5_fail_closed_overwrite_protection_intact`, `test_ac5_existing_packs_regression`, `test_ac5_dataforge_sibling_repo_unmodified` | `python3 -m pytest tests/ -q` (zero failures across all 143 tests) | `journey-fix-user-sim-full-regression-suite` |

---

## Conclusion

This implementation plan provides a concrete, comprehensive roadmap for resolving the `step_08b_user_simulation_gate` schema validation defect. By formalizing non-empty `stdout_contains` requirements, standardizing verbatim root execution prefixes, eliminating shell pipelines, and validating manifest traceability across all acceptance checks (`AC-1` through `AC-5`), the slice ensures robust, unblocked playbook execution while preserving DashForge's existing generation pipelines and regression suites intact.

# Package DataForge Snapshot Contract

## Overview

DashForge serves as an internal Anblicks consulting accelerator designed to rapidly create believable, industry-specific dashboard deliverables for enterprise client workshops. In the current multi-repo architecture, sibling project `dataForge` owns deterministic mock-data generation and quality verification, while DashForge owns the scenario definitions, `DashboardSpec` schemas, `DataAdapter` runtime interfaces, and standalone dashboard presentation deliverables.

The `package-dataforge-snapshot` slice establishes the formal contract, tooling interfaces, and deterministic workflows required to package DataForge scenario generation outputs into structured SQLite databases and derived JSON snapshots. These snapshots are ingested directly by DashForge's client-side runtime (`frontend/src/core/data/sqliteSnapshot.ts`, `createDashboardDataAdapter.ts`, and `StandaloneDashboardApp.tsx`), enabling robust offline dashboard execution during high-stakes client meetings without requiring active database servers or live network connectivity.

## Problem

Consulting delivery teams face significant friction when preparing data-driven dashboard demonstrations for client discovery sessions. Whiteboard mockups and static slides fail to convey credibility, while live database connections are often impractical or prohibited during early-stage workshops. To establish immediate credibility with executive stakeholders, dashboards must present realistic, relational business data with consistent aggregations across multi-level drill-downs, seasonal trends, and facility-level distributions.

While `dataForge` generates canonical normalized SQLite databases with foreign key integrity, DashForge's browser-based standalone runtime requires portable, structured JSON snapshot artifacts that preserve typed dataset schemas, column semantic roles, and row-level records. Without a standardized, deterministic snapshot packaging tool and CLI bridge (`env PYTHONPATH=src python3 -m dashForge.main generate`), operators risk generating incompatible schema representations, inadvertently overwriting previous workshop deliverables, or encountering unhandled runtime errors during live client presentations.

## Constraints

The `package-dataforge-snapshot` slice operates under the following strict technical and organizational constraints:

1. **Canon Alignment**: All packaging contracts, schemas, and CLI behaviors must remain strictly aligned with `product-definition.md`, `architecture.md`, `AGENTS.md`, and `README.md`.
2. **Deterministic Execution**: Given identical inputs (`pack`, `scenario`, and `seed`), the packaging tool must produce bit-for-bit reproducible SQLite databases and JSON snapshot files.
3. **Fail-Closed Overwrite Protection**: The CLI command must fail closed with a non-zero exit code and explicit error message if the designated target output path already exists on disk, unless the `--force` flag is explicitly provided by the operator.
4. **Interface Backward Compatibility**: The CLI entrypoint `dashForge.main` must support standard arguments invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`: `--pack` (supporting `healthcare`, `financial`, and `saas`), `--scenario` (required), `--seed` (optional deterministic integer), `--output` (required SQLite path), `--snapshot-output` (optional JSON snapshot export path), and `--force`.
5. **Snapshot Schema Contract**: Exported snapshot JSON files must strictly adhere to the `SQLiteSnapshot` contract, containing dataset identifiers, column definitions (name, type, semantic role), and row-level record objects.
6. **Zero External Runtime Dependencies**: Packaging utilities must rely exclusively on Python standard library modules (`argparse`, `json`, `sqlite3`, `pathlib`) and existing project interfaces without introducing external runtime packages.
7. **Governed Scope Boundary**: All persistent artifact writes for this contract step must be strictly confined to `docs/` and `journeys/`. No unauthorized modifications to project source code or external packages are permitted.

## Required Outputs

This slice mandates the creation and maintenance of the following core outputs:

- `docs/package-dataforge-snapshot-contract.md`: The governed slice contract detailing problem definition, constraints, validation mechanisms, routing policies, and acceptance checks.
- `journeys/user_journeys_manifest.json`: The synchronized user journeys manifest linking natural-language user goals to every acceptance check (`AC-1` through `AC-8`) with non-empty command allowlists.
- Python packaging CLI entrypoint (`src/dashForge/main.py`): Command-line interface providing the `generate` subcommand for SQLite database creation and snapshot JSON export.
- Snapshot generation compatibility bridge (`src/dashForge/generate.py`): Dispatch layer mapping industry packs and scenarios to deterministic generators and snapshot exporters.

## Validation

Verification of the snapshot packaging slice follows a multi-tiered deterministic validation process:

1. **Unit and CLI Regression Tests**: Automated test suites in `tests/test_generate.py`, `tests/test_dataforge_compat.py`, and `tests/test_package_snapshot.py` executed via `python3 -m pytest tests/ -q` with NO PYTHONPATH override (the orchestrator re-executes claims in a bounded environment whose own PYTHONPATH is what makes pytest importable, and an override hides it) to verify argument parsing, pack routing, deterministic generation, snapshot structure, and error handling.
2. **Fail-Closed Overwrite Verification**: Automated checks ensuring that existing SQLite and JSON files are not overwritten without `--force`, preventing silent data loss during demo preparation.
3. **Schema and Data Integrity Checks**: Automated inspection verifying that exported JSON snapshots match the underlying SQLite table rows, maintain column typing, and correctly map dimension and measure roles.
4. **User Journey Simulation**: Mechanical re-verification of all allowlisted user journey commands through Agent-Orch's `user_tester` gate, ensuring that claimed commands and exit codes reproduce identically. Journey status values are strictly recorded as `passed` or `failed`.

## Routing Intent

Execution routing across the governed lifecycle is organized as follows:

- **Producer / Implementer Route (`codex_cli`)**: Executes deterministic implementation and packaging tasks within declared file boundaries, following the development loop and operating rules without modifying out-of-scope files.
- **Evaluator / User Tester Route (`user_tester`)**: Evaluates natural-language user journeys independently against allowlisted command prefixes, verifying exit codes and stdout outputs without attempting code repairs.
- **Independent Reviewer Route (`claude_code` / `independent_reviewer`)**: Conducts read-only inspection of implementation diffs, test logs, contract adherence, and evidence integrity to issue an authoritative review verdict.

## Acceptance Checks

The slice must satisfy the following explicit acceptance checks:

- **AC-1**: The packaging CLI entrypoint (invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`) provides a deterministic command supporting `--pack`, `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` flags.
- **AC-2**: The packaging command strictly prevents unintended file overwrites by failing closed with an informative diagnostic message and non-zero exit code when the target output file exists, unless `--force` is explicitly specified.
- **AC-3**: When `--snapshot-output` is supplied, the tool exports a well-formed JSON snapshot containing dataset IDs, column definitions (names, data types, and semantic roles), and row records matching the generated SQLite database.
- **AC-4**: The generator and snapshot packaging workflow supports all canonical industry packs (`healthcare`, `financial`, `saas`) with reproducible outputs given identical seeds.
- **AC-5**: The CLI handles invalid inputs gracefully (including unknown packs, unknown scenarios, or missing required parameters) by returning non-zero exit codes and clear diagnostic messages without uncaught stack traces.
- **AC-6**: Exported snapshot artifacts conform to the DashForge runtime data adapter schema (`SQLiteSnapshot`), ensuring full compatibility with `DataAdapter` query and aggregation interfaces.
- **AC-7**: The synchronized user journeys manifest in `journeys/user_journeys_manifest.json` maps natural-language user goals to every acceptance check (`AC-1` through `AC-8`) with valid authorities (`human`, `mission`, `author`, or `exploratory`), non-empty `command_allowlist`, and all allowlisted commands runnable verbatim from the workspace root using `env PYTHONPATH=src python3 -m dashForge.main` and `python3 -m pytest tests/ -q` (with NO PYTHONPATH override).
- **AC-8**: Governed write scope is preserved with all changes strictly confined to `docs/` and `journeys/`.

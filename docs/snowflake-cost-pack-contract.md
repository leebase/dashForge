# Snowflake Cost Pack Contract

## Overview

DashForge serves as an internal Anblicks consulting accelerator designed to rapidly create believable, industry-specific dashboard deliverables for enterprise client discovery workshops. Under the current decoupled workspace architecture, sibling project `dataForge` owns deterministic scenario generation, quality verification, and synthetic data modeling, while DashForge owns scenario registration, `DashboardSpec` contracts, `DataAdapter` runtime interfaces, and client-facing standalone presentation experiences.

The `snowflake-cost-pack` slice bridges dataForge's existing `snowflakeCost` optimization pack into DashForge's canonical `generate` CLI entrypoint (`env PYTHONPATH=src python3 -m dashForge.main generate`) and snapshot packager (`dashForge.package_snapshot.package_snapshot`). This capability enables Anblicks consultants and operators to produce comprehensive, client-ready Snowflake cost optimization demos (such as `idle-warehouse-waste`, `bi-over-provisioning`, and `finops-maturity-assessment`) with a single command. By generating both a normalized SQLite database and a schema-compliant JSON snapshot adhering to the canonical `SQLiteSnapshot` contract, DashForge prepares realistic relational data, provenance tracing, and prioritized recommendation queues required by downstream standalone executive dashboard views without requiring live Snowflake account credentials or cloud infrastructure during high-stakes client meetings.

## Problem

Enterprise consulting delivery teams face substantial hurdles when engaging prospective clients—specifically CFOs, CIOs, VPs of Data, and FinOps leaders—on cloud data warehouse efficiency. Abstract cloud billing summaries, static slide decks, and synthetic toy datasets lack the credibility required to establish consulting authority. Conversely, connecting to a prospect's live Snowflake production environment during early-stage pre-sales or discovery workshops is frequently prohibited by enterprise security, governance, and procurement policies.

To establish immediate credibility, consultants need realistic, relational Snowflake account usage and cost telemetry reflecting recognizable operational challenges: idle warehouses burning credits, unmonitored ad-hoc queries, runaway data science experiments, and unassigned warehouse ownership. While `dataForge` already implements the `snowflakeCost` pack with seven comprehensive table exports and governed story contracts, DashForge's existing CLI entrypoint currently restricts the `--pack` option strictly to `healthcare`, `financial`, and `saas`. Furthermore, DashForge lacks dynamic scenario enumeration from dataForge, provenance tracing, and explicit preservation of the `recommendation_queue` dataset schema. Without this slice, consultants cannot generate Snowflake cost artifacts through standard DashForge workflows, risking manual scripting errors, drift between scenario contracts, or failure to disclose synthetic data provenance in client workshops.

## Constraints

The implementation and operation of the `snowflake-cost-pack` slice are subject to the following strict technical, architectural, and governance constraints:

1. **Canon Alignment**: All designs, CLI behaviors, and schemas must strictly align with `product-definition.md`, `architecture.md`, `AGENTS.md`, `README.md`, and the preceding `docs/package-dataforge-snapshot-contract.md`.
2. **Dynamic Scenario Discovery**: DashForge must dynamically enumerate scenarios defined by the `snowflakeCost` pack in `dataForge` (e.g., via `dataForge.generate.load_pack("snowflakeCost")` or scenario registry), rather than hardcoding the scenario list within DashForge source files.
3. **Fail-Closed Error Handling**: Unknown scenario identifiers, invalid packs, or missing required CLI options must fail closed with exit status 2 and clean diagnostic error messages via `parser.error()`, preventing unhandled Python tracebacks in front of executive audiences.
4. **Fail-Closed Overwrite Guard**: The CLI command must evaluate target paths (`--output` and `--snapshot-output`) and fail closed with exit status 2 if any target file already exists on disk, unless the operator explicitly passes the `--force` flag.
5. **Single Snapshot Schema Format**: Snapshot exports must conform strictly to the canonical `SQLiteSnapshot` TypeScript contract established in `frontend/src/core/data/sqliteSnapshot.ts` and `src/dashForge/package_snapshot.py`. No secondary or bespoke snapshot format may be introduced.
6. **Provenance and Synthetic Disclosure**: Exported snapshots must include complete provenance tracing back to the governed dataForge source, including `packId` (`snowflakeCost`), `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 generation timestamp, an explicit `synthetic: true` boolean flag, and human-readable disclosure text `"Synthetic demo data"`.
7. **Recommendation Queue Preservation**: The `recommendation_queue` export table must be preserved with its priority (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and guardrail (`guardrail`) columns intact to power downstream dashboard recommendation queues.
8. **Read-Only dataForge Boundary**: Sibling repository `dataForge` is strictly read-only. No files within `dataForge/` may be modified, created, or deleted.
9. **Zero External Runtime Dependencies**: All packaging, dispatching, and CLI extensions must rely exclusively on Python standard library modules (`argparse`, `json`, `sqlite3`, `pathlib`, `sys`, `importlib`) and existing internal interfaces.
10. **Governed Write Scope**: Persistent artifact writes for this step must be strictly confined to `docs/` and `journeys/`.
11. **Out of Scope Boundaries**: Frontend components, `DashboardSpec` schemas, or `scenarios/` directory modifications are strictly out of scope for this slice (deferred to the downstream dashboard slice). Live Snowflake network access, credentials, external runtime dependencies, and edits under `dataForge/` are strictly prohibited.

## Required Outputs

This slice establishes the contract and operational baseline for the following deliverables across the governed lifecycle:

- `docs/snowflake-cost-pack-contract.md`: The governed slice contract specifying the problem, operational constraints, validation methodology, routing policies, and acceptance checks (AC-1 through AC-8).
- `journeys/user_journeys_manifest.json`: The synchronized user journeys manifest linking natural-language operator goals to every acceptance check (AC-1 through AC-8) with valid authorities and non-empty command allowlists.
- Python Module Extension (`src/dashForge/snowflake_cost.py`): Implementation module providing dynamic scenario discovery, dataForge generation dispatch, provenance metadata enrichment, and recommendation queue validation.
- CLI Entrypoint Integration (`src/dashForge/main.py` and `src/dashForge/generate.py`): Updates enabling `--pack snowflakeCost`, dynamic scenario argument validation, and fail-closed diagnostic reporting.
- Snapshot Packager Bridge (`src/dashForge/package_snapshot.py`): Integration ensuring `snowflakeCost` exports (all 7 datasets) and metadata are packaged into canonical `SQLiteSnapshot` format.
- Automated Test Suite (`tests/test_snowflake_cost_pack.py`): Comprehensive pytest suite validating CLI argument parsing, dynamic scenario discovery, deterministic generation, fail-closed overwrite protection, provenance metadata, recommendation queue integrity, and backwards compatibility.

## Validation

Verification of the `snowflake-cost-pack` slice follows a multi-tier automated validation and evaluation process:

1. **Automated Test Suite Execution**: Execution of the automated test suite via `python3 -m pytest tests/ -q` with NO PYTHONPATH override (the orchestrator re-executes claims in a bounded environment whose own PYTHONPATH is what makes pytest importable, and an override hides it) to verify argument parsing, dynamic scenario loading, error handling, snapshot schema conformance, and regression immunity for existing packs (`healthcare`, `financial`, `saas`).
2. **Deterministic Output and Bit-for-Bit Reproducibility**: Automated comparison of generated SQLite databases and JSON snapshots across identical seeds, confirming identical file hashes, table structures, and record counts.
3. **Provenance and Disclosure Verification**: Inspection of exported JSON snapshots confirming presence and correct values of `packId`, `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 generation timestamp, `synthetic: true`, and disclosure text `"Synthetic demo data"`.
4. **Recommendation Queue Schema Inspection**: Inspection of the `recommendation_queue` dataset confirming all governance columns (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, `guardrail`) are populated and intact.
5. **Code Compilation and Hygiene**: Verification that all Python modules compile cleanly via `python3 -m compileall src tests` with zero syntax or import errors.
6. **User Journey Simulation Gate**: Execution of allowlisted user journey commands via Agent-Orch's `user_tester` gate, confirming that claimed exit codes and command behaviors reproduce identically from the workspace root.

## Routing Intent

Execution routing across the governed lifecycle is organized as follows:

- **Producer / Contract Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Establishes the slice contract and synchronized user journey manifest within declared write scopes (`docs/`, `journeys/`), adhering to operating rules and heading constraints.
- **Planner Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Develops the concrete implementation plan under `plans/` covering Architecture, Tests, Verification, and Risks with explicit traceability to all acceptance checks.
- **Test Author Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Implements targeted slice tests in `tests/test_snowflake_cost_pack.py` validating the contract prior to implementation.
- **Implementation Route (`antigravity_cli` / `gemini-3.8-flash-high`)**: Delivers `src/dashForge/snowflake_cost.py` and CLI updates in `src/dashForge/` to pass the authored tests without modifying out-of-scope files.
- **Evaluator / User Tester Route (`user_tester` / `gemini-3.1-pro`)**: Independently evaluates natural-language user journeys against allowlisted command prefixes, verifying exit codes and stdout outputs without attempting code repairs.
- **Independent Reviewer Route (`slice_reviewer` / `gemini-3.1-pro`)**: Conducts read-only inspection of implementation diffs, test logs, contract adherence, and evidence integrity to issue an authoritative review verdict.

## Acceptance Checks

The slice must satisfy the following explicit acceptance checks:

- **AC-1**: The packaging CLI entrypoint (invoked via `env PYTHONPATH=src python3 -m dashForge.main generate`) accepts `--pack snowflakeCost` alongside existing packs (`healthcare`, `financial`, `saas`), supporting `--scenario`, `--seed`, `--output`, `--snapshot-output`, and `--force` flags.
- **AC-2**: The CLI dynamically discovers and accepts all scenarios registered by the `snowflakeCost` pack in `dataForge` (including `idle-warehouse-waste`, `bi-over-provisioning`, `runaway-query-pattern`, `department-chargeback`, `executive-cost-spike`, and `finops-maturity-assessment`), never hardcoding the scenario list in DashForge. Unknown scenario identifiers fail closed with exit status 2 and a clean diagnostic message without unhandled Python tracebacks.
- **AC-3**: The CLI fails closed with exit status 2 and a clean diagnostic message if invalid arguments or unknown packs are provided, or if required parameters (`--scenario`, `--output`) are missing, without displaying raw Python tracebacks.
- **AC-4**: The CLI strictly enforces fail-closed overwrite protection, exiting with status 2 and an informative diagnostic message when `--output` or `--snapshot-output` already exists on disk, unless the `--force` flag is explicitly specified.
- **AC-5**: Generation is bit-for-bit deterministic given identical inputs (`pack=snowflakeCost`, `scenario`, and `seed`), producing a normalized SQLite database and an exported JSON snapshot conforming strictly to the canonical `SQLiteSnapshot` contract via `package_snapshot.py` without introducing a second snapshot format.
- **AC-6**: The exported JSON snapshot carries rich provenance metadata tracing back to the governed dataForge source, including `packId` (`snowflakeCost`), `scenarioId`, `seed`, `dataForgeStoryContractPath`, generator version, ISO-8601 generation timestamp, an explicit `synthetic: true` boolean flag, and human-readable disclosure text `"Synthetic demo data"`.
- **AC-7**: The exported `recommendation_queue` dataset preserves priority (`executive_severity`), suggested owner (`suggested_owner`), recommended action (`recommended_action`), evidence detail (`evidence_detail`), and guardrail (`guardrail`) columns intact to support downstream dashboard recommendation rendering.
- **AC-8**: Existing industry packs (`healthcare`, `financial`, `saas`) continue to function unchanged with reproducible generation. The complete test suite executed via `python3 -m pytest tests/ -q` (with NO PYTHONPATH override) passes cleanly, with zero modifications to sibling project `dataForge`.

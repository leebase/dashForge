# DashForge

DashForge is an internal Anblicks accelerator for creating realistic,
industry-specific dashboard prototypes during client workshops and turning
those prototypes into production-ready React assets without throwing the
prototype away.

## Canon

These documents are the source of truth:

- `product-definition.md` for product scope, MVP, and value hierarchy
- `architecture.md` for the technical shape of the platform

The rest of the repository should stay aligned to those two files.

For operator instructions covering the browser, LAN preview, PDF export, and
the sibling DataForge CLI, see [`docs/user-guide.md`](docs/user-guide.md).

## Current Status

DashForge has now closed the governed Sprint 1-9 program in the repo.

- The repo canon now defines the MVP as one bounded outcome:
  scenario definition, data generation, and a standalone dashboard deliverable
- The default app surface in `frontend/` now opens directly into the
  field-service heat-wave operating review, not the builder shell
- The canonical MVP proof path is
  `healthcare:ed-throughput-crunch` +
  `tpl.healthcare.ed-throughput-command`
- The current presentation default is
  `fieldService:first-heat-wave-parts-bottleneck` +
  `tpl.fieldService.first-heat-wave-command`; it demonstrates reuse of the
  same closed MVP runtime rather than replacing the healthcare proof
- The ED throughput package already exists as scenario docs, generated SQLite +
  JSON artifacts, runtime registration, focused verification/repair docs, and a
  formal review in `code-reviews/review-mvp-standalone-dashboard.md`
- Builder, presenter, AI authoring, and bounded live binding remain in-repo as
  secondary/operator capabilities on the same shared runtime
- The stable operator dashboard for the governed Sprint 1-9 ladder remains
  `artifacts/current/dashboard.html`

Mock-data creation now lives in the sibling
`/Users/lee/projects/dataForge` project. dashForge keeps thin compatibility
wrappers for the historical Python entrypoints, but the primary product
surface here is the React 19 + Vite + TypeScript runtime in `frontend/`, with
DashboardSpec as the core artifact and the standalone scenario-first runtime
as the current MVP proof.

### Client Meeting Dashboard Builder

DashForge can run as the platform-native
`client-meeting-dashboard-builder` employee. It consumes a trusted,
digest-pinned DataForge work package and emits a
`meeting-dashboard-package/1.0` containing the dashboard spec, binding map,
claim ledger, rendered dashboard, browser evidence, and meeting narrative.
The employee refuses blocking upstream quality, missing audience/decision
context, invalid bindings, and material claims without source evidence.

Use the governed Agent-Orch playbook for the receipt and approval boundary:

```bash
PYTHONPATH=src ../agent-orch/.venv/bin/python -m agent_orch.main \
  validate-playbook playbooks/client_meeting_dashboard_builder.yaml --strict
```

The direct dashboard runtime is a deterministic consumer of the received
artifact. It does not authenticate approval, connect to a live Snowflake
account, send client material, or replace the platform's evidence chain.

## Mac/LAN Preview and PDF Rendition

Start the standalone dashboard on the LAN over HTTPS:

```bash
cd frontend
npm run dev:lan
```

The launcher binds Vite to `0.0.0.0`, creates a 30-day self-signed
certificate with an IP subject-alternative name, and prints the URL. With the
current workstation address, open this from the Mac:

`https://192.168.8.10:5173`

The first visit will show a browser certificate warning. Continue to the site
for a quick private-LAN preview, or copy
`frontend/.certs/dashforge-lan-cert.pem` to the Mac and add it to the login
Keychain as a trusted certificate. If the workstation address changes, set
`DASHFORGE_LAN_IP` before starting; the launcher regenerates the certificate.
The LAN preview is a development server and should only be exposed on a
trusted network.

The standalone page includes **Print / Save PDF**. It opens a print-ready
landscape rendition with preserved chart colors, evidence/provenance, the
story arc, presenter notes, and page-break protection for dashboard cards.
Enable **Background graphics** and disable **Headers and footers** in the Mac
print dialog before choosing **Save as PDF**.


## Implemented Capabilities

The repo now contains:

- scenario-package documentation and materialization patterns, with ED
  throughput as the canonical packaged scenario
- a versioned `DashboardSpec` JSON format and shared `DataAdapter` runtime
- 8 dashboard primitives rendered with ECharts
- a standalone default app entry that opens directly into the field-service
  heat-wave operating review
- builder, presenter, export, AI authoring, and bounded live/hybrid binding as
  supporting or post-MVP operator surfaces on the same runtime
- the canonical healthcare ED throughput starter
  (`healthcare:ed-throughput-crunch`,
  `tpl.healthcare.ed-throughput-command`) and the current field-service
  presentation starter (`fieldService:first-heat-wave-parts-bottleneck`,
  `tpl.fieldService.first-heat-wave-command`)
- compatibility with deterministic SQLite/JSON mock artifacts generated by
  `dataForge`

The ED throughput runtime package assets are discoverable at:

- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- `scenarios/healthcare/ed-throughput-crunch-contract.md`

The field-service showcase consumes strict, digest-pinned DataForge fixtures at:

- `frontend/src/fixtures/dataforge/field-service-heat-wave-snapshot.json`
- `frontend/src/fixtures/dataforge/field-service-heat-wave-quality-report.json`
- `frontend/src/fixtures/dataforge/field-service-heat-wave-work-package.json`

## Near-Term Follow-Up

The governed program is closed. The field-service default path has been
browser-smoked in a host environment. Remaining near-term follow-up is:

- run the still-open host smoke for the Sprint 9 live/hybrid binding controls
- choose the next bounded roadmap slice explicitly before widening the now-closed
  standalone MVP proof
- package the successful standalone pattern into reusable scenario-building
  skills/workflows instead of adding broader product scope informally

## Governed Workflow

The governed sprint ladder is now closed through Sprint 9:

- `playbooks/project_sprint_program.yaml`

The durable playbooks now use Agent-Orch `operational_paths` for the stable
dashboard surface at `artifacts/current/`. Historical restart workflows used
during the governed build have been archived under `playbooks/backups/`;
future recovery should prefer Agent-Orch `resume-run` over creating new
restart playbooks.

Sprint 2 closeout artifacts live in:

- `docs/sprint-02-contract.md`
- `plans/sprint-02-plan.md`
- `code-reviews/verify-sprint-02.md`
- `code-reviews/repair-sprint-02.md`
- `code-reviews/review-sprint-02.md`

Sprint 3 closeout artifacts live in:

- `docs/sprint-03-contract.md`
- `plans/sprint-03-plan.md`
- `code-reviews/verify-sprint-03.md`
- `code-reviews/repair-sprint-03.md`
- `code-reviews/review-sprint-03.md`

Sprint 4 closeout artifacts live in:

- `docs/sprint-04-contract.md`
- `plans/sprint-04-plan.md`
- `code-reviews/verify-sprint-04.md`
- `code-reviews/repair-sprint-04.md`
- `code-reviews/review-sprint-04.md`

Sprint 5 closeout artifacts live in:

- `docs/sprint-05-contract.md`
- `plans/sprint-05-plan.md`
- `code-reviews/verify-sprint-05.md`
- `code-reviews/repair-sprint-05.md`
- `code-reviews/review-sprint-05.md`

Sprint 6 closeout artifacts live in:

- `docs/sprint-06-contract.md`
- `plans/sprint-06-plan.md`
- `code-reviews/verify-sprint-06.md`
- `code-reviews/repair-sprint-06.md`
- `code-reviews/review-sprint-06.md`

Sprint 7 closeout artifacts live in:

- `docs/sprint-07-contract.md`
- `plans/sprint-07-plan.md`
- `code-reviews/verify-sprint-07.md`
- `code-reviews/repair-sprint-07.md`
- `code-reviews/review-sprint-07.md`

Sprint 8 closeout artifacts live in:

- `docs/sprint-08-contract.md`
- `plans/sprint-08-plan.md`
- `code-reviews/verify-sprint-08.md`
- `code-reviews/repair-sprint-08.md`
- `code-reviews/review-sprint-08.md`

Sprint 9 closeout artifacts live in:

- `docs/sprint-09-contract.md`
- `plans/sprint-09-plan.md`
- `code-reviews/verify-sprint-09.md`
- `code-reviews/repair-sprint-09.md`
- `code-reviews/review-sprint-09.md`

Standalone MVP closeout artifacts live in:

- `docs/mvp-standalone-dashboard-contract.md`
- `plans/mvp-standalone-dashboard-plan.md`
- `code-reviews/verify-mvp-standalone-dashboard.md`
- `code-reviews/repair-mvp-standalone-dashboard.md`
- `code-reviews/review-mvp-standalone-dashboard.md`

Open `artifacts/current/dashboard.html` for the stable human-facing view of
the most recent governed run.

## Frontend Commands

The active product runtime is under `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

`npm run dev` now opens the standalone ED throughput dashboard by default. Use
the in-app `Open Builder` action if you need the authoring surface.

Checks:

```bash
cd frontend
npm test
npm run build
```

Generator CLI:

```bash
cd /Users/lee/projects/dataForge
PYTHONPATH=src python3 -m dataForge.main generate \
  --pack financial \
  --scenario market-downturn \
  --seed 5301 \
  --output /tmp/financial-market-downturn.sqlite \
  --snapshot-output /tmp/financial-market-downturn.snapshot.json
```

Legacy compatibility entrypoint in dashForge:

```bash
cd /Users/lee/projects/dashForge
PYTHONPATH=src python3 -m dashForge.main generate \
  --pack financial \
  --scenario market-downturn \
  --seed 5301 \
  --output /tmp/financial-market-downturn.sqlite \
  --snapshot-output /tmp/financial-market-downturn.snapshot.json
```

If `dataForge` is not installed and does not live in the default sibling
workspace location, set `DATAFORGE_SRC` to the `src/` directory of the
`dataForge` checkout before running the compatibility command.

```bash
cd /Users/lee/projects/dashForge
DATAFORGE_SRC=/path/to/dataForge/src \
PYTHONPATH=src python3 -m dashForge.main generate \
  --scenario flu-season \
  --output /tmp/flu-season.sqlite
```

Real browser smoke still requires a local environment that permits localhost
port binding. In this sandbox, `npm run dev -- --host 127.0.0.1` fails with
`listen EPERM`. That remaining host-environment smoke now applies to the
standalone default experience and the closed Sprint 9
live-binding/builder/preview/presenter/export workflow.

## DataForge Snapshot Packaging

DashForge provides both a CLI entrypoint (`python3 -m dashForge.main generate`) and a programmatic Python API (`dashForge.package_snapshot.package_snapshot`) to package scenario generation outputs into bounded SQLite databases and schema-compliant JSON snapshots (`SQLiteSnapshot`). These snapshot artifacts allow DashForge's client-side runtime to execute interactive dashboard deliverables completely offline during client discovery workshops without requiring live database connections or backend servers.

### CLI Generation

The packaging CLI entrypoint supports multi-pack scenario generation with deterministic seed control and fail-closed overwrite protection:

```bash
cd /home/lee/projects/dashForge
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack healthcare \
  --scenario flu-season \
  --seed 3101 \
  --output /tmp/flu-season.sqlite \
  --snapshot-output /tmp/flu-season.snapshot.json
```

Key CLI flags include:
- `--pack`: Target mock-data pack (`healthcare`, `financial`, `saas`). Defaults to `healthcare`.
- `--scenario`: Scenario identifier within the pack (required).
- `--seed`: Optional integer seed for deterministic output reproducibility.
- `--output`: Output filesystem path for the generated SQLite database (required).
- `--snapshot-output`: Optional filesystem path for the exported `SQLiteSnapshot` JSON file.
- `--force`: Explicitly allow overwriting existing output files; without this flag, generation fails closed if destination files already exist.

### Programmatic Python Interface

The `dashForge.package_snapshot` module exposes the `package_snapshot` function:

```python
from pathlib import Path
from dashForge.package_snapshot import package_snapshot

result = package_snapshot(
    pack="healthcare",
    scenario="flu-season",
    output_path=Path("/tmp/flu-season.sqlite"),
    snapshot_output_path=Path("/tmp/flu-season.snapshot.json"),
    seed=3101,
    force=True,
)
```

### Core Contracts & Guarantees

- **Multi-Pack Determinism**: Supports canonical industry packs (`healthcare`, `financial`, `saas`) with guaranteed reproducible database rows and JSON snapshots given identical seeds.
- **Fail-Closed Overwrite Protection**: Fails closed with non-zero exit code (exit code 2 in CLI) or `FileExistsError` in programmatic calls if any target file already exists on disk without explicit force instructions.
- **Runtime Schema Interoperability**: Exported JSON snapshots conform strictly to the `SQLiteSnapshot` contract (`packId`, `scenarioId`, `seed`, `datasets` containing column types, semantic roles `["dimension", "measure", "date", "id"]`, and row records) ingested by DashForge's `DataAdapter` and `createDashboardDataAdapter` runtime.
- **Clean Diagnostic Reporting**: Invalid packs, unknown scenarios, or missing arguments produce clear usage diagnostics without unhandled stack traces.

## Key Project Docs

- `AGENTS.md`: operating rules for AI agents
- `context.md`: current session memory and next actions
- `WHERE_AM_I.md`: product-level status
- `project-plan.md`: strategic roadmap
- `sprint-plan.md`: tactical execution for the closed Sprint 9 window
- `result-review.md`: completed work log
- `docs/mvp-standalone-dashboard-contract.md`: bounded standalone MVP contract
- `plans/mvp-standalone-dashboard-plan.md`: standalone MVP implementation plan
- `code-reviews/review-mvp-standalone-dashboard.md`: formal standalone MVP review
- `docs/package-dataforge-snapshot-contract.md`: DataForge snapshot packaging slice contract
- `plans/package-dataforge-snapshot-implementation-plan.md`: DataForge snapshot packaging implementation plan
- `scenarios/healthcare/ed-throughput-crunch-contract.md`: ED throughput scenario contract
- `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`: ED throughput execution runbook
- `playbooks/ed_throughput_crunch_demo_workflow.yaml`: scenario package governance workflow

## Repository Note

The `frontend/` app remains the main implementation path to build on. The
Python package is now only a bounded mock-data generator surface, not a second
application runtime.

---

Created on 2026-03-31 by Lee Harrington.

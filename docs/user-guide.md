# DashForge + DataForge User Guide

This guide covers the supported local operator paths for the two sibling
projects:

- **DataForge** generates deterministic, synthetic business-story data and
  quality evidence.
- **DashForge** presents a verified scenario as an interactive dashboard,
  builder handoff, narrative, and printable PDF.

The current end-to-end showcase is the fictional Apex Climate Services
field-service heat-wave story. It is synthetic demo data, not a client result.

## 1. Choose a path

| Goal | Use |
|---|---|
| View the ready-made executive dashboard | DashForge web app |
| Package DataForge scenario SQLite and JSON snapshots | DashForge `package_snapshot` or `dashForge generate` |
| Generate a clean SQLite database and optional JSON snapshot | DataForge `generate` |
| Validate an approved scenario contract | DataForge `validate-scenario` |
| Produce the full evidence-bearing upstream package | DataForge `employee-run` |
| Produce a governed downstream dashboard package | Agent-Orch playbook, not the direct web app |

The standalone DashForge web app currently opens the checked-in,
digest-pinned field-service fixture. A newly generated CLI output does not
appear in the browser automatically; see [Connecting generated output to
DashForge](#connecting-generated-output-to-dashforge).

## 2. Prerequisites

### Web app

- Node.js and npm.
- A checkout of `/home/lee/projects/dashForge/frontend`.

Install frontend dependencies once:

```bash
cd /home/lee/projects/dashForge/frontend
npm install
```

### DataForge CLI

- Python 3.10 or newer.
- A checkout of `/home/lee/projects/dataForge`.
- The sibling `/home/lee/projects/ai-employee` package only for
  `employee-run`.

Install DataForge in editable mode if the `dataForge` command is not already
available:

```bash
cd /home/lee/projects/dataForge
python3 -m pip install -e .
```

The source-tree form used in the examples below avoids relying on a global
installation.

## 3. Use DashForge in a browser

### Local-only preview

```bash
cd /home/lee/projects/dashForge/frontend
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

This is the simplest path when the browser is on the same workstation.

### Trusted-LAN preview from another device

```bash
cd /home/lee/projects/dashForge/frontend
npm run dev:lan
```

The launcher binds Vite to `0.0.0.0`, generates or reuses an IP-specific
30-day self-signed certificate, and prints the exact URL. On the current
workstation the URL is:

```text
https://192.168.8.10:5173
```

Both devices must be on the same trusted LAN and TCP port `5173` must be
reachable through the workstation firewall. The first browser visit may show
a certificate warning. For a temporary preview, continue past that warning.
For a trusted Mac preview, copy this certificate to the Mac and add it to the
login Keychain:

```text
/home/lee/projects/dashForge/frontend/.certs/dashforge-lan-cert.pem
```

If the workstation IP changes, provide the new address before starting:

```bash
DASHFORGE_LAN_IP=192.168.8.25 npm run dev:lan
```

If port `5173` is occupied, stop the previous DashForge process or choose a
different port:

```bash
DASHFORGE_PORT=5180 npm run dev:lan
```

### Read the dashboard

The default field-service review presents:

1. A scenario package and upstream artifact digest.
2. A synthetic-data and controlled-quality disclosure.
3. Contextual KPI cards comparing actual values with targets or plans.
4. Story-ordered graphs for demand, branch concentration, and callback causes.
5. A narrative arc with source citations and recommended next decisions.

The page is intentionally evidence-bound. It does not connect to live
Snowflake data or silently substitute arbitrary chart arrays.

### Open Builder

Use **Open Builder** when you need to inspect or edit the dashboard
composition rather than only present the default review. Builder uses the same
scenario, template, artifact binding, and evidence context as the standalone
presentation.

Builder changes are local prototype work. They do not publish a client
proposal or send anything to a customer portal.

### Save a PDF

Use **Print / Save PDF** in the scenario package panel. The print view includes
chart colors, the synthetic-data disclosure, provenance, the story arc,
presenter notes, and page-break protection for dashboard cards.

In the browser print dialog:

1. Enable **Background graphics**.
2. Disable **Headers and footers**.
3. Select **Save as PDF**.
4. Use landscape letter when the dialog exposes page-size/orientation options.

## 4. Use the DataForge CLI

Show all commands and options:

```bash
cd /home/lee/projects/dataForge
PYTHONPATH=src python3 -m dataForge.main --help
PYTHONPATH=src python3 -m dataForge.main generate --help
PYTHONPATH=src python3 -m dataForge.main validate-scenario --help
PYTHONPATH=src python3 -m dataForge.main employee-run --help
```

### Generate SQLite and a JSON snapshot

`generate` is the compatibility path for a bounded database and optional
snapshot. It does not create the full employee evidence package.

Example: field-service heat-wave story:

```bash
cd /home/lee/projects/dataForge
PYTHONPATH=src python3 -m dataForge.main generate \
  --pack fieldService \
  --scenario first-heat-wave-parts-bottleneck \
  --seed 6207 \
  --output /tmp/first-heat-wave.sqlite \
  --snapshot-output /tmp/first-heat-wave.snapshot.json
```

The supported pack identifiers are:

- `healthcare`
- `financial`
- `saas`
- `meatRetailer`
- `fieldService`
- `snowflakeCost`

The `--scenario` value is the scenario ID within the selected pack. If
`--seed` is omitted, the approved scenario seed is used. Use `--force` only
when intentionally replacing existing output files:

```bash
PYTHONPATH=src python3 -m dataForge.main generate \
  --pack healthcare \
  --scenario flu-season \
  --output /tmp/flu-season.sqlite \
  --snapshot-output /tmp/flu-season.snapshot.json \
  --force
```

### Validate a declared scenario

Validate the scenario contract before generating a governed package:

```bash
cd /home/lee/projects/dataForge
PYTHONPATH=src python3 -m dataForge.main validate-scenario \
  --scenario scenarios/fieldService/first-heat-wave-parts-bottleneck.json
```

Validation checks the versioned scenario shape, pack/scenario identity, seed,
output limits, fault plan, and declared approval fields. Direct CLI validation
reports caller-declared approval metadata; it does **not** authenticate the
approver or grant governance authority.

### Generate the canonical employee package

`employee-run` is the evidence-bearing path. It validates the scenario,
creates deterministic SQLite and snapshot outputs, evaluates quality and story
assertions, writes a reproduction manifest, and emits the canonical work
package only when the gates pass.

The command needs both DataForge and the sibling `ai_employee` source trees on
`PYTHONPATH`:

```bash
cd /home/lee/projects/dataForge
PYTHONPATH=src:/home/lee/projects/ai-employee/src \
  python3 -m dataForge.main employee-run \
  --scenario scenarios/fieldService/first-heat-wave-parts-bottleneck.json \
  --output-dir /tmp/field-service-employee-run \
  --pursuit-id dataforge-field-service-demo \
  --run-ref dataforge-field-service-demo:0001 \
  --created-at 2026-08-11T00:00:00Z
```

Choose a new or empty output directory. A successful run contains exactly:

```text
scenario.json
synthetic.sqlite
snapshot.json
quality-report.json
reproduction-manifest.json
work-package.json
```

The `work-package.json` records the artifact schema, digest, scenario
identity, dataset inventory, quality status, assumptions, and evidence needed
by a downstream consumer. The field-service scenario is the clean baseline; its
approved story contract requires all nine business assertions to pass.

### Snowflake cost-optimization example

The `snowflakeCost` pack is synthetic and local; it does not connect to a
Snowflake account. Generate a scenario and derive dashboard CSVs when needed:

```bash
cd /home/lee/projects/dataForge
PYTHONPATH=src python3 -m dataForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /tmp/idle-warehouse-waste.sqlite \
  --snapshot-output /tmp/idle-warehouse-waste.snapshot.json

python3 scripts/export_snowflake_cost_dashboard_csvs.py \
  --sqlite /tmp/idle-warehouse-waste.sqlite \
  --output-dir /tmp/idle-warehouse-waste-dashboard-csv
```

## DataForge Snapshot Packaging

DashForge includes tooling and programmatic interfaces to package synthetic scenario generation outputs into bounded SQLite database files and runtime-compatible JSON snapshots (`SQLiteSnapshot`). These snapshot artifacts allow DashForge's standalone frontend runtime (`frontend/src/core/data/sqliteSnapshot.ts`) to execute dashboards completely offline during enterprise client discovery sessions without requiring live network connectivity or running database servers.

### Command-Line Generation

The packaging CLI entrypoint is available via `env PYTHONPATH=src python3 -m dashForge.main generate`:

```bash
cd /home/lee/projects/dashForge
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack healthcare \
  --scenario flu-season \
  --seed 3101 \
  --output /tmp/flu-season.sqlite \
  --snapshot-output /tmp/flu-season.snapshot.json
```

#### CLI Options

- `--pack`: Industry pack name (`healthcare`, `financial`, `saas`). Defaults to `healthcare`.
- `--scenario`: Scenario identifier within the selected pack (e.g., `flu-season`, `quality-improvement`, `cost-pressure`, `market-downturn`, `advisor-attrition`, `growth-quarter`, `churn-crisis`, `product-led-growth`, `scaling-success`). Required.
- `--seed`: Optional integer seed for deterministic data generation.
- `--output`: Filesystem path where the generated SQLite database will be written. Required.
- `--snapshot-output`: Optional filesystem path for the exported JSON snapshot artifact.
- `--force`: Overwrite existing output files. Without this flag, generation fails closed with exit code 2 if target files already exist on disk.

### Programmatic Python Interface

The `dashForge.package_snapshot` module exposes the `package_snapshot` function for programmatic workflow integration:

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

### Snapshot Structure & Runtime Compatibility

Exported snapshot JSON files conform to the `SQLiteSnapshot` contract consumed by `createDashboardDataAdapter` and `StandaloneDashboardApp`:

- **Top-Level Metadata**: Contains `packId`, `scenarioId`, `seed`, and `datasets` collection.
- **Dataset Schema**: Each dataset object contains `datasetId`, `rowCount`, `columns`, and `rows`.
- **Typed Columns**: Each column definition specifies `name`, `type` (`string`, `number`, `date`, `boolean`), semantic `role` (`dimension`, `measure`, `date`, `id`), and human-readable `label`.
- **Relational Consistency**: Row records match the SQLite table contents with consistent business aggregations across multi-level drill-downs.
- **Fail-Closed Overwrite Protection**: The tool checks file existence before generation, preventing accidental data loss unless `--force` / `force=True` is explicitly supplied.

## 5. Connect generated output to DashForge

The supported product boundary is:

```text
DataForge scenario
  -> generated SQLite and snapshot
  -> quality report and reproduction manifest
  -> synthetic-data work package
  -> DashForge dashboard specification and bindings
  -> rendered dashboard and meeting narrative
```

For a quick local web demo, DashForge uses these pinned fixtures:

```text
/home/lee/projects/dashForge/frontend/src/fixtures/dataforge/
  field-service-heat-wave-work-package.json
  field-service-heat-wave-snapshot.json
  field-service-heat-wave-quality-report.json
```

They are byte-identified against the accepted field-service package. To use a
new generated package as a downstream employee input, use the governed
Agent-Orch receipt path and the client-meeting dashboard builder playbook:

```bash
cd /home/lee/projects/dashForge
PYTHONPATH=src ../agent-orch/.venv/bin/python -m agent_orch.main \
  validate-playbook playbooks/client_meeting_dashboard_builder.yaml --strict
```

The governed path owns the trusted receipt, approval boundary, evidence-chain
verification, and run isolation. Do not copy a generated file over a pinned
fixture and call it a governed handoff.

## 6. What the tools do not do

- All bundled scenarios and generated outputs are synthetic demo data.
- The web app does not connect to live Snowflake data.
- The CLI does not submit proposals, send client material, or access a bid
  portal.
- Direct CLI approval metadata is not authenticated.
- A generated artifact is not a claim about a real client, past performance,
  certification, or named reference.
- A successful local dashboard preview is not a production deployment.

## 7. Verification commands

Run DataForge tests and checks:

```bash
cd /home/lee/projects/dataForge
python3 -m pytest -q
python3 -m ruff check src tests
```

Run DashForge tests and build:

```bash
cd /home/lee/projects/dashForge/frontend
npm test
npm run build
```

These commands verify the current repository contracts; they do not replace a
human review of the scenario narrative, evidence, and approval state.

## 8. Common problems

### `ModuleNotFoundError: ai_employee`

Use the sibling foundation source tree for `employee-run`:

```bash
PYTHONPATH=src:/home/lee/projects/ai-employee/src python3 -m dataForge.main employee-run ...
```

### Output already exists

`generate` refuses to overwrite an existing SQLite or snapshot path unless
`--force` is supplied. `employee-run` expects an absent or empty output
folder; choose a fresh temporary directory.

### Port 5173 is already in use

Stop the old `npm run dev:lan` process, or run another instance with
`DASHFORGE_PORT=5180`. Only the process that owns the port can serve the URL.

### LAN certificate warning

The LAN certificate is self-signed for private development preview. Continue
past the warning for a temporary test, or install the printed PEM certificate
on the Mac Keychain for a trusted warning-free preview.

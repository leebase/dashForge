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

## Current Status

DashForge has now closed the governed Sprint 1-9 program in the repo.

- Product direction is defined
- Technical architecture is defined
- Tactical planning and handoff docs are aligned
- A real frontend foundation exists in `frontend/`
- Sprint 2 hardened the runtime with shared DashboardSpec validation, concrete themes, persistence helpers, and the browser-side SQLite seam
- Sprint 3 added a deterministic SQLite healthcare generator CLI, a SQLite-derived snapshot bridge for the frontend adapter path, and the full canon healthcare scenario set
- Sprint 4 added the Financial Services and SaaS packs, shared template catalog metadata, and multi-pack generator dispatch
- Sprint 5 broadened the runtime to the full eight-primitive MVP set with shared chart/theme compilers and a responsive read-only grid
- Sprint 6 added the bounded manual-authoring builder shell with editable composition, widget palette, property editing, template starters, and JSON spec I/O
- Sprint 7 added narrative authoring, presenter mode, bounded annotation support, and browser-local proposal artifact export on top of the shared builder/runtime path
- Sprint 8 added bounded AI-assisted prompt-to-spec generation, staged candidate review/apply/discard, and request-time guardrails on top of the shared builder/presenter/export path
- Sprint 9 added shared adapter resolution for `mock`/`live`/`hybrid`, a bounded REST live adapter, builder-integrated dataset binding controls, and safe live/hybrid spec serialization
- healthcare’s `ed-throughput-crunch` scenario is now also registered as an in-app runtime starter
- the dedicated starter template `tpl.healthcare.ed-throughput-command` and blueprint flow now ship as reusable demo assembly contracts
- Sprint 9 closeout is complete with formal review in `code-reviews/review-sprint-09.md`
- The stable operator dashboard for the governed ladder is `artifacts/current/dashboard.html`

The repository still contains some bootstrap-era Python structure, but the
Python package now has one bounded product role: generating deterministic
SQLite mock-data artifacts for healthcare, financial, and saas scenarios. The
primary application runtime remains the React 19 + Vite + TypeScript app in
`frontend/`, with DashboardSpec as the core artifact and the Sprint 9
builder-plus-live-binding-plus-presenter/export flow as the current
workshop-to-production-binding baseline.

## Implemented Capabilities

The repo now contains:

- 3 industry mock data packs: Healthcare, Financial Services, SaaS/Technology
- 8 dashboard primitives rendered with ECharts
- a `DashboardBox` container with resilient states and responsive behavior
- grid-based dashboard composition with drag/drop and resize
- dashboard templates by industry and scenario
- a versioned DashboardSpec JSON format
- presenter mode for guided workshop storytelling
- export to spec JSON and browser-local printable proposal artifacts
- bounded AI-assisted prompt-to-spec generation with staged candidate apply/discard
- bounded production binding through REST-backed live and hybrid dataset adapters
- one healthcare ED throughput scenario registered in the app runtime with dedicated command-view starter wiring (`healthcare:ed-throughput-crunch`, `tpl.healthcare.ed-throughput-command`)

The ED throughput runtime package assets are discoverable at:

- `scenarios/healthcare/ed-throughput-crunch-dashboard-spec.json`
- `scenarios/healthcare/ed-throughput-crunch-preview-data.json`
- `scenarios/healthcare/ed-throughput-crunch-preview.sqlite`
- `scenarios/healthcare/ed-throughput-crunch-binding-map.md`
- `scenarios/healthcare/ed-throughput-crunch-contract.md`

## Near-Term Follow-Up

The governed program is closed. The remaining near-term follow-up is:

- run one host-environment browser smoke of the Sprint 9 binding workflow
- choose the next bounded roadmap slice explicitly before adding more scope
- keep backend brokering, broader live adapters, Python cleanup, and direct
  browser SQLite work in later slices unless a concrete post-Sprint-9 defect
  requires more

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

Open `artifacts/current/dashboard.html` for the stable human-facing view of
the most recent governed run.

## Frontend Commands

The active product runtime is under `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Checks:

```bash
cd frontend
npm test
npm run build
```

Generator CLI:

```bash
PYTHONPATH=src python3 -m dashForge.main generate \
  --pack financial \
  --scenario market-downturn \
  --seed 5301 \
  --output /tmp/financial-market-downturn.sqlite \
  --snapshot-output /tmp/financial-market-downturn.snapshot.json
```

Real browser smoke still requires a local environment that permits localhost
port binding. In this sandbox, `npm run dev -- --host 127.0.0.1` fails with
`listen EPERM`. That remaining host-environment smoke now applies to the
closed Sprint 9 live-binding builder/preview/presenter/export workflow.

## Key Project Docs

- `AGENTS.md`: operating rules for AI agents
- `context.md`: current session memory and next actions
- `WHERE_AM_I.md`: product-level status
- `project-plan.md`: strategic roadmap
- `sprint-plan.md`: tactical execution for the closed Sprint 9 window
- `result-review.md`: completed work log
- `scenarios/healthcare/ed-throughput-crunch-contract.md`: ED throughput scenario contract
- `scenarios/healthcare/ed-throughput-crunch-build-checklist.md`: ED throughput execution runbook
- `playbooks/ed_throughput_crunch_demo_workflow.yaml`: scenario package governance workflow

## Repository Note

The `frontend/` app remains the main implementation path to build on. The
Python package is now only a bounded mock-data generator surface, not a second
application runtime.

---

Created on 2026-03-31 by Lee Harrington.

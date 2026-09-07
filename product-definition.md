# DashForge — Product Definition
## Anblicks Value Accelerator for Enterprise Dashboard Delivery

**Owner:** Lee (Director, Anblicks)  
**Version:** 1.3  
**Date:** September 6, 2026  
**Status:** Draft for review with Kumar Raman

---

## 1. What This Is

DashForge is an internal consulting accelerator that lets Anblicks consultants
define a believable business scenario, generate realistic industry-specific
data for that scenario, and open directly into a standalone dashboard
deliverable during a client workshop.

The current product boundary is now split across the workspace: DashForge owns
the scenario package, runtime registration, dashboard runtime, and standalone
deliverable, while sibling project `dataForge` owns the deterministic
mock-data-generation implementation used to create the scenario artifacts.

On the AI Employee Foundation, the DashForge product employee is the
`ClientMeetingDashboardBuilder`. It consumes a trusted, digest-pinned
DataForge `synthetic-data-work-package/1.0`, a bounded dashboard manifest, and
audience/decision context; it produces a validated
`meeting-dashboard-package/1.0` with the rendered dashboard, dashboard
specification, binding map, claim ledger, and meeting narrative. The employee
may refuse when upstream quality, evidence, or required audience/decision
context is missing. Agent-Orch owns execution identity, receipt verification,
reviewer separation, and approval; DashForge owns dashboard composition and
client-facing evidence semantics.

The current MVP proof is intentionally narrower than the full long-term
platform vision. The first success bar is not "every authoring tool at once."
It is proving that one scenario package can move cleanly from scenario
definition to data generation to a free-standing dashboard experience without
throwing the work away. Converting that prototype into production-ready React
code bound to a client's real data infrastructure remains a later payoff, not
the MVP gate.

It is not a BI platform. It is not a SaaS product (yet). It is a delivery weapon that makes Anblicks faster and more impressive than competitors who show up with wireframes, static mockups, or empty Tableau shells.

---

## 2. The Problem We're Solving — For Anblicks

### The current consulting delivery pain

1. **Discovery workshops produce artifacts nobody can use.** A consultant sketches dashboards on a whiteboard or in PowerPoint. The engineering team then builds something different in Tableau/Power BI/React. The client says "that's not what I asked for." Rework ensues. The first 3-4 weeks of every analytics engagement are wasted on alignment.

2. **Demo dashboards use obviously fake data.** Lorem ipsum data or flat random numbers don't sell a vision. A healthcare executive needs to see readmission rates that behave like readmission rates — seasonal, correlated with length-of-stay, showing realistic facility-level variance. Generic fake data makes the demo feel like a toy.

3. **Prototypes get thrown away.** The demo built for the sales pitch bears no structural relationship to the production deliverable. The team starts over with a blank React project or an empty Power BI workspace. Every engagement reinvents the wheel.

4. **Client gets locked into vendor licensing.** If we prototype in Tableau, the client needs Tableau licenses forever. If we prototype in Power BI, they need Microsoft E5 licensing. We've delivered a dependency, not an asset.

### What DashForge changes

| Before DashForge | After DashForge |
|-----------------|----------------|
| Whiteboard sketches → weeks of misaligned dev work | Interactive prototype in the room → aligned from day one |
| Random fake data that looks fake | Industry-realistic data with seasonality, correlations, anomalies |
| Prototype thrown away at project start | Prototype spec becomes the production scaffold |
| Client locked into BI vendor licensing | Client receives owned React code, no vendor dependency |
| Every engagement starts from scratch | Industry packs and templates accumulate across engagements |

---

## 3. Who Uses It

### Primary users: Anblicks consultants and delivery leads

- **In workshops:** Launch a prepared standalone scenario dashboard during the meeting so the client immediately sees what their data *could* look like.
- **In proposals:** Include interactive dashboard mockups with realistic data as proposal artifacts. Differentiate from competitors showing static slides.
- **In delivery:** Hand the scenario package and dashboard spec to the engineering team. They bind it to real data sources later. The prototype becomes the production starting point.
- **In repeatable scenario delivery:** Build a prepared scenario package and launch it in-app through a registered scenario starter and template blueprint so workshop prep is faster and more deterministic.

### Secondary users: Anblicks engineering teams

- Receive a DashboardSpec JSON that defines layout, chart types, data contracts, and theme.
- Bind mock data references to real Snowflake/Databricks/API endpoints.
- Extend the primitive library when a client needs a chart type we don't have yet.

### Tertiary users (future): Client teams

- Eventually, clients may use DashForge directly to prototype their own dashboards. This is a future product play, not an MVP requirement.

---

## 4. Value Prioritization — What Matters Most to Anblicks

Ranked by commercial impact, not technical elegance:

### Rank 1: Industry Mock Data Engine
**Why first:** This is what makes a workshop feel real. A consultant who can show a healthcare CFO a dashboard with believable readmission rates, cost-per-case trends with seasonal flu spikes, and facility-level variance immediately has credibility that a competitor with empty charts does not. The mock data engine is the single highest-value component because it works even without the rest of the platform. In the current workspace shape, that engine now lives in `dataForge`, not DashForge.

### Rank 2: Scenario Definition + DashboardSpec Contract
**Why second:** Realistic data still becomes throwaway work unless the scenario is defined as a reusable package. The scenario brief, data design, dashboard blueprint, and `DashboardSpec` are what make the dashboard repeatable by operators and reusable by engineering.

### Rank 3: Standalone Dashboard Deliverable
**Why third:** The consultant needs something that opens directly into a believable dashboard, not a builder shell that requires setup before the client sees value. A standalone deliverable is the first product proof the client experiences.

### Rank 4: Builder, Presenter, and AI Authoring Accelerators
**Why fourth:** These are useful speed and rehearsal multipliers after the core scenario-package and standalone-deliverable flow is proven. They strengthen the operator experience, but they are not the first MVP gate.

### Rank 5: Production Data Binding
**Why fifth:** This is the payoff of the whole system — converting mock to production. But it's only valuable after you've won the deal and started delivery. The workshop tool and the production binding tool don't need to ship simultaneously.

---

## 5. What DashForge Is NOT

- **Not a BI platform.** We are not competing with Tableau, Power BI, or Looker. Those are production analytics tools. DashForge is a pre-production accelerator that can optionally produce code that replaces them.
- **Not a no-code app builder.** We are not competing with Retool, Appsmith, or Budibase. Those build CRUD apps. DashForge builds analytics dashboards.
- **Not a wireframing tool.** We are not Mokkup.ai or Figma. DashForge produces functional, data-driven dashboards, not static pictures of dashboards.
- **Not a SaaS product (yet).** v1 is an internal Anblicks tool. Productization is a future decision gated on proving consulting value first.

---

## 6. Commercial Model

### Phase 1: Internal accelerator (no revenue, reduces delivery cost)
- DashForge is free to use within Anblicks
- Value = faster workshop-to-delivery pipeline, higher win rate, reduced rework
- Measure: time from first client meeting to approved dashboard design (target: same day vs. current 2-4 weeks)

### Phase 2: Embedded in consulting pricing (indirect revenue)
- DashForge artifacts (spec, mock data, prototype) become standard deliverables in Anblicks' analytics practice
- Higher project margins because less rework and faster delivery
- Measure: analytics practice gross margin improvement

### Phase 3 (future, gated on proving Phase 1-2): Productization
- White-label the accelerator for other consulting firms
- Or offer it as a standalone SaaS for enterprise analytics teams
- Decision point: if 5+ engagements prove the model, evaluate product investment

## 7. MVP Definition — "Workshop-Ready"

The MVP is the minimum set of capabilities that proves DashForge can take one
believable business scenario from definition to data generation to a
free-standing dashboard deliverable that an Anblicks consultant can use in a
client workshop.

### MVP includes:
1. **Scenario definition package** for at least one client-ready use case, including the story, data contract, dashboard blueprint, and operator notes
2. **Generated mock-data package** for that scenario, with SQLite as the canonical artifact and a JSON runtime bridge where needed; generation may be fulfilled by sibling project `dataForge`
3. **Shared `DashboardSpec` + primitive runtime** that can render the packaged scenario through the `DataAdapter` seam
4. **Scenario-to-runtime registration path** so a documented scenario package can be instantiated in-app through registered starter contracts
5. **Standalone app surface** that opens directly into the packaged dashboard instead of builder-first chrome
6. **Durable governance trail** proving contract, plan, verify, repair, and review/handoff for the scenario package and standalone dashboard slice
7. **Employee handoff evidence** binding the dashboard result to the upstream work-package digest and exposing synthetic-data and quality disclosures

The current canonical MVP proof is:

- `healthcare:ed-throughput-crunch`
- `tpl.healthcare.ed-throughput-command`

That closed governed proof remains canonical. The current default presentation
uses `fieldService:first-heat-wave-parts-bottleneck` with
`tpl.fieldService.first-heat-wave-command` to demonstrate that a second
industry story can reuse the same scenario, `DashboardSpec`, `DataAdapter`, and
standalone-runtime contracts. It is a synthetic showcase, not a client result
and not a replacement for the closed healthcare proof.

### MVP explicitly excludes:
- in-repo ownership of the mock-data generator implementation now that `dataForge` exists
- Builder mode as a required MVP entry experience
- Presenter mode as a required MVP gate
- AI spec generation as a required MVP gate
- Real data binding / production conversion (Phase 3)
- Collaboration / multi-user editing (Phase 4)
- Custom chart type builder (Phase 4)
- Multi-scenario launchers or pack browsers as part of the first MVP proof
- SaaS deployment / auth / billing (future)

---

## 8. Industry Pack Definitions — MVP

### Healthcare Pack

**Vocabulary:**
- Metrics: readmission rate, avg length of stay, patient satisfaction (HCAHPS), bed occupancy, cost per case, ED wait time, mortality index, infection rate (CLABSI/CAUTI)
- Dimensions: facility, department, payer type, diagnosis category (MDC/DRG), discharge disposition
- Entities: 5-8 facility names, 6-8 department names, 4 payer categories

**Scenarios:**
1. **Flu Season Surge** — ED volumes spike 40% in Dec-Feb, bed occupancy exceeds 95%, length-of-stay increases, readmissions rise. Story: operational stress from seasonal demand.
2. **Quality Improvement Initiative** — infection rates declining over 12 months, patient satisfaction improving, readmission rate flat. Story: investment is working but readmissions haven't responded yet.
3. **Cost Pressure** — cost per case rising 8% YoY, driven by supply chain and labor. Occupancy flat. Story: margin erosion requiring operational efficiency response.

### Financial Services Pack

**Vocabulary:**
- Metrics: AUM, net flows, expense ratio, client retention, revenue per advisor, compliance score, NPS, portfolio return vs. benchmark
- Dimensions: fund type, advisor, client segment (HNW/UHNW/mass affluent), product category, risk level, region
- Entities: 10-12 advisor names, 6-8 fund names, 4 client segments

**Scenarios:**
1. **Market Downturn** — AUM declining with market, net outflows accelerating, client retention dropping in mass affluent segment. Story: flight to safety, retention risk.
2. **Advisor Attrition** — 3 top advisors departed, their book of business partially retained. Story: revenue concentration risk and succession planning.
3. **Growth Quarter** — record net inflows, new client acquisition up, NPS improving. Story: momentum that needs to be sustained.

### SaaS / Technology Pack

**Vocabulary:**
- Metrics: MRR, ARR, churn rate, expansion revenue, LTV/CAC, NPS, feature adoption, support ticket volume, CSAT, time to first value
- Dimensions: plan tier, cohort month, region, feature area, customer segment (SMB/mid-market/enterprise)
- Entities: 4 plan tiers, 6 feature areas, 3 customer segments

**Scenarios:**
1. **Churn Crisis** — monthly churn spikes from 2% to 5%, concentrated in SMB segment, correlated with pricing change 3 months ago. Story: pricing backlash requiring intervention.
2. **Product-Led Growth** — free-to-paid conversion improving, feature adoption increasing, but enterprise sales flat. Story: bottoms-up motion working, top-down needs attention.
3. **Scaling Success** — ARR crossed $10M, net retention above 120%, but support ticket volume growing faster than revenue. Story: growth is outpacing support capacity.

---

## Idle Warehouse Waste Accelerator

The **Idle Warehouse Waste Accelerator** is an enterprise consulting delivery weapon within DashForge, realizing the end-to-end Snowflake Cost Management solution (`snowflakeCost:idle-warehouse-waste`). Designed for high-stakes pre-sales and architectural discovery workshops with CFOs, CIOs, VPs of Data, and FinOps practice leaders, it enables Anblicks consultants to deliver an authoritative, data-driven cloud cost optimization presentation without requiring live customer credentials or cloud network connectivity.

### The Delivery Problem It Solves

Enterprise consulting teams routinely struggle to establish credibility during early-stage cloud financial operations (FinOps) discussions. Prospective clients cannot provide access to production Snowflake accounts due to stringent infosec, data privacy, and governance restrictions. Conversely, generic wireframes, PowerPoint slides, or simplistic toy mockups fail to convey the analytical depth needed to win enterprise trust.

The Idle Warehouse Waste Accelerator resolves this dilemma by pairing deterministic, relational Snowflake infrastructure telemetry from sibling project `dataForge` with DashForge's standalone presentation runtime. Consultants can walk into an executive meeting and immediately present an interactive, operational analysis of unmonitored compute resources burning financial credits with zero active query workload.

### Architecture and Data Seams

The accelerator strictly enforces DashForge's core architecture and decoupled repository boundaries:

1. **Read-Only dataForge Ingestion**: Ingests deterministic dataForge exports adhering strictly to the canonical `SQLiteSnapshot` TypeScript contract (`frontend/src/core/data/sqliteSnapshot.ts`) generated via `dashForge.package_snapshot.package_snapshot`. Sibling project `dataForge` remains strictly read-only.
2. **Seven Relational Datasets**: The scenario package bundles seven comprehensive datasets mirroring Snowflake Account Usage telemetry: `executive_summary`, `warehouse_metering_history`, `query_history`, `metering_history`, `database_storage_usage_history`, `show_warehouses`, and `recommendation_queue`.
3. **Canonical Runtime Seams**: Proves the standard `DashboardSpec` specification schema and `DataAdapter` query interface (`createDashboardDataAdapter`, `SyntheticDataArtifactAdapter`, `StaticDataAdapter`, `SQLiteDataAdapter`). Widgets and presentational components query data exclusively through adapter interfaces without secondary or bespoke renderers.
4. **Verifiable Claim Ledger**: Every top-line KPI, chart trend, and recommendation is anchored to the upstream work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`) with verifiable dataset observation evidence.
5. **Catalog Registrations**: Formally registered in `scenarioCatalog` as `snowflakeCost:idle-warehouse-waste` and `templateCatalog` as `tpl.snowflakeCost.idle-warehouse-waste` (seed `9101`, story contract `stories/snowflake/idle-warehouse-waste.md`).

### Executive Buyer Narrative Flow

The accelerator structures the executive workshop around a clear, decision-oriented narrative arc:

- **Headline Opportunity**: Surfaces an immediate potential monthly savings of **726 compute credits** identified across unmonitored infrastructure.
- **Idle Warehouse Identification**: Pinpoints **2 compute warehouses** actively running 24/7 with zero active query load during monitored periods.
- **Credit Concentration**: Illustrates warehouse cost distribution, revealing that `FINANCE_REPORTING_WH` accounts for over 50% of total compute credit consumption.
- **Control Gap Analysis**: Exposes critical operational vulnerabilities, including disabled auto-suspend (`auto_suspend = 0`), excessive suspension timeouts (≥3600 seconds), and unassigned resource monitors.

### Prioritized Recommendation Queue and Governance Guardrails

To drive actionable consulting outcomes, the accelerator presents a prioritized optimization queue directly populated from the `recommendation_queue` dataset, preserving all six governance fields:

- `recommendation_id`: Unique tracking identifier (e.g., `IWW-001`, `IWW-002`).
- `executive_severity`: Priority rating (`P0`, `P1`).
- `suggested_owner`: Target organizational owner (e.g., Finance Systems Lead, Analytics Engineering Lead).
- `recommended_action`: Specific technical remediation (e.g., configuring aggressive auto-suspend, assigning resource monitors).
- `evidence_detail`: Quantified telemetry rationale supporting the action.
- `guardrail`: Explicit protective operational constraint.

**Directional Validation Guardrail**: All recommendations are explicitly framed as directional pending formal confirmation with designated warehouse owners. DashForge strictly prohibits automated or destructive execution without human stakeholder approval.

### Workshop Deliverables and Compliance Disclosures

- **Offline Standalone Execution**: Operates as a zero-dependency standalone dashboard deliverable with zero external cloud connectivity requirements.
- **Same-Day Follow-Up Export**: Generates an exportable executive follow-up artifact (HTML/PDF summary) capturing key metrics, recommended actions, designated owners, and claim citations for immediate post-workshop stakeholder alignment.
- **Prominent Synthetic Disclosures**: Unsuppressed `"Synthetic demo data"` badges, quality disclosures, and provenance metadata (`packId: "snowflakeCost"`, `scenarioId: "idle-warehouse-waste"`, `synthetic: true`) are displayed prominently across all presentation views and export deliverables.
- **Backwards Compatibility**: Guarantees zero regressions across existing industry packs (`healthcare`, `financial`, `saas`), templates, and builder surfaces.

### Operator CLI Workflow and Generation Pipeline

Anblicks consultants and operators can package the Idle Warehouse Waste scenario for client workshops using the canonical DashForge CLI:

```bash
env PYTHONPATH=src python3 -m dashForge.main generate \
  --pack snowflakeCost \
  --scenario idle-warehouse-waste \
  --seed 9101 \
  --output /path/to/idle-warehouse-waste.sqlite \
  --snapshot-output /path/to/idle-warehouse-waste.snapshot.json \
  --force
```

- **Fail-Closed Overwrite Protection**: The CLI enforces safety guards; omitting `--force` when output paths already exist fails closed with exit code 2 and actionable diagnostics without Python stack traces.
- **Dynamic Scenario Enumeration**: Scenarios are discovered dynamically from sibling project `dataForge` via `dashForge.snowflake_cost.get_snowflake_cost_scenarios()` without hardcoding in DashForge source code.
- **Bit-for-Bit Determinism**: Generations with identical seed (default `9101`) produce identical SHA-256 digests across both SQLite databases and JSON snapshots.
- **Programmatic Python API**: `src/dashForge/idle_warehouse_waste.py` provides high-level bindings including `generate_idle_warehouse_assets()`, `validate_idle_warehouse_database()`, `get_headline_opportunity()`, `get_warehouse_concentration()`, and `build_executive_follow_up()`.

---

## Idle Warehouse Dashboard

The **Idle Warehouse Dashboard** is the buyer-visible frontend presentation experience for DashForge's Snowflake Cost Optimization suite, specifically engineered for executive pre-sales discovery workshops and FinOps practice assessments. Operating completely offline with zero live Snowflake credentials, backend servers, or external network dependencies, it empowers Anblicks consultants, client delivery leads, and practice directors to demonstrate immediate cloud cost optimization value to enterprise CIOs, CTOs, and FinOps leaders.

### Executive Buyer Value & TVIQ Framework
The dashboard structures executive insights according to the TVIQ (Time-to-Value, Impact, Quality) value framework:
- **Time-to-Value (T)**: Bypasses the 3-4 week security and governance review required to obtain live Snowflake credentials. Consultants mount the standalone experience at `/?scenario=idle-warehouse-waste` instantly from minute one of a workshop. Remediation actions are prioritized with P0 items surfaced first for immediate decision-making.
- **Impact (I)**: Highlights **726 monthly compute credits** in recoverable waste across unmonitored infrastructure, flags **2 idle warehouses** running 24/7 without query workloads, isolates `FINANCE_REPORTING_WH` as consuming >50% of compute credits, and surfaces warehouse control vulnerabilities such as disabled auto-suspend (`auto_suspend = 0`) and missing resource monitors.
- **Quality (Q)**: Grounds all metrics and narrative claims in a verified work-package digest (`sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390`). The runtime enforces controlled readiness (`data-readiness="controlled"`), refusing unverified digests with fail-closed blocking status. Prominent synthetic disclosures and owner-validation guardrails guarantee transparency and operational safety.

### User Experience & Interactive Presentation Features
- **URL Scenario Resolution**: The standalone application automatically resolves `?scenario=idle-warehouse-waste`, rendering the scenario container with `data-scenario="idle-warehouse-waste"`.
- **Persistent Synthetic Data Disclosure**: Prominently displays the unsuppressed disclosure element `data-disclosure="synthetic-demo-data"` with the exact text `"Synthetic demo data"`, ensuring full compliance in pre-sales environments.
- **Prioritized Recommendation Queue**: An accessible toggle (`data-action="open-recommendation-queue"`) expands a governed remediation queue (`data-status="recommendation-queue"`). `FINANCE_REPORTING_WH` (`IWW-001`, Priority `P0`) is displayed first with complete governance attributes (`recommendation_id`, `executive_severity`, `suggested_owner`, `recommended_action`, `evidence_detail`, and `guardrail`). Savings are explicitly framed as directional until validated by designated warehouse owners.
- **Executive Follow-Up & Landscape PDF Export**: Direct integration with `data-action="same-day-executive-follow-up"` and `data-testid="dashboard-save-pdf"` allows consultants to generate polished follow-up deliverables and landscape print views immediately after the workshop, retaining headline metrics, digest citations, and synthetic disclosures.

### Production Conformance & Architectural Boundaries
- **Zero Live Dependencies**: All datasets resolve in-browser through canonical `StaticDataAdapter` and `DashboardSpec` contracts without external database connections or secondary renderers.
- **Browser Smoke Gate Compliance**: Compiled production bundles conform strictly to `tests/browser_smoke_manifest.json` and `tests/browser_smoke_check.py`, preserving required contract markers (`"idle-warehouse-waste"`, `"synthetic-demo-data"`, `"open-recommendation-queue"`, and `"recommendation-queue"`).
- **Zero Regressions**: Preserves underlying Python data generation, CLI commands, sibling project `dataForge` isolation, and all existing industry packs (`healthcare`, `financial`, `saas`).

---

## 9. Success Criteria

### MVP success (3 months post-launch):
- Used in at least 3 real client workshops
- At least 1 workshop uses a prepared scenario package that opens directly into a believable standalone dashboard without major revisions
- At least 1 scenario package is reused without rebuilding the story, data design, and dashboard layout from scratch
- Positive feedback from at least 2 Anblicks consultants who aren't Lee

### Accelerator success (6 months post-launch):
- Time from workshop to approved dashboard design reduced by 60%+
- At least 1 engagement where the prototype spec was directly used as the production starting point
- Industry pack library grown to 5+ industries (through real engagement additions)
- At least 1 engagement won where DashForge demo was cited as a differentiator

### Product consideration gate (12 months):
- 10+ engagements used DashForge
- Consistent pattern of prototype-to-production conversion
- External demand signal (client asks "can we buy this?" or another consulting firm asks to license it)

---

## 10. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Lee builds it but nobody else at Anblicks uses it** | High | Fatal | Get 2 consultants to co-design the MVP; build for their workflow, not yours |
| **Mock data doesn't look real enough** | Medium | High | Test each industry pack with a domain expert before using in a workshop; allow manual data point overrides |
| **Clients want Tableau/Power BI, not React code** | Medium | Medium | DashForge produces the *spec*; the spec can inform a Tableau build if that's what the client wants; the value is in the workshop, not the output format |
| **AI-generated specs aren't good enough to skip** | Low | Low | AI generation is Phase 2; manual template selection is fine for MVP |
| **Scenario package diverges from runtime contract** | Medium | High | Keep each scenario package linked to runtime registration and contract docs (scenario + blueprint + template catalog entries) before using it for client-facing work |
| **Scope creep into full platform** | High | High | This document is the scope boundary; anything not listed here is post-MVP |

---

## 11. Naming Note

"DashForge" is a working name. Alternatives considered:
- **InsightForge** — emphasizes the insight/story angle
- **DashCraft** — emphasizes the craft/composition angle
- **SpecDash** — emphasizes the spec-driven nature
- **Vantage** — clean, professional, but generic

The name should eventually reflect the *consulting value* (speed, realism, conversion) rather than the *technology* (specs, schemas, primitives). But for now, DashForge works.

---

## 12. Relationship to Agent Factory

DashForge is a natural Agent Factory offering. The platform itself can be built using AgentFlow methodology — AI agent teams with skill files producing the mock data generators, chart primitives, and spec validation logic. More importantly, it becomes a showcase for the Agent Factory's capabilities: "We built this accelerator in 8 weeks using the same methodology we'll use to build your AI agents."

DashForge demonstrates the Human Empowerment thesis in practice: it doesn't replace the consultant's judgment about what the client needs. It amplifies the consultant's ability to show the client what's possible, faster than any competitor can.

# DashForge — Product Definition
## Anblicks Value Accelerator for Enterprise Dashboard Delivery

**Owner:** Lee (Director, Anblicks)  
**Version:** 1.0  
**Date:** March 30, 2026  
**Status:** Draft for review with Kumar Raman

---

## 1. What This Is

DashForge is an internal consulting accelerator that lets Anblicks consultants walk into a client workshop, generate a realistic industry-specific dashboard prototype in under an hour, and then convert that prototype into production-ready React code bound to the client's actual data infrastructure — without throwing the prototype away and without locking the client into a BI vendor subscription.

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

- **In workshops:** Generate a prototype dashboard during the meeting using industry packs and AI-assisted layout. Show the client what their data *could* look like.
- **In proposals:** Include interactive dashboard mockups with realistic data as proposal artifacts. Differentiate from competitors showing static slides.
- **In delivery:** Hand the dashboard spec to the engineering team. They bind it to real data sources. The prototype becomes the production starting point.

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
**Why first:** This is what makes a workshop feel real. A consultant who can show a healthcare CFO a dashboard with believable readmission rates, cost-per-case trends with seasonal flu spikes, and facility-level variance immediately has credibility that a competitor with empty charts does not. The mock data engine is the single highest-value component because it works even without the rest of the platform — you can pipe it into any charting tool.

### Rank 2: Dashboard Spec Schema + Primitive Library
**Why second:** The spec is what makes prototypes *not* throwaway. Without a canonical spec, every prototype is a one-off. With a spec, the prototype is a structured artifact that engineering can bind to real data. The primitive library (KPI cards, line charts, bar charts, etc.) gives the spec something to render.

### Rank 3: Workshop Presenter Mode
**Why third:** The ability to walk through a dashboard as a guided narrative — dimming other widgets, showing commentary, stepping through a story arc — is what differentiates a DashForge demo from "look at this dashboard I made." This is the consulting theater that wins deals.

### Rank 4: AI Spec Generation
**Why fourth:** Useful, but not essential for MVP. A consultant who knows the industry can manually compose a dashboard from templates faster than prompt-engineering an AI to do it right. AI generation is a speed multiplier, not a capability enabler. Build it after the manual workflow is proven.

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

---

## 7. MVP Definition — "Workshop-Ready"

The MVP is the minimum set of capabilities that lets an Anblicks consultant walk into a client workshop and produce a credible, data-populated dashboard prototype during the meeting.

### MVP includes:
1. **3 industry mock data packs** (Healthcare, Financial Services, SaaS/Technology) with 2-3 scenarios each
2. **8 chart primitives** rendered via ECharts (KPI card, line, bar, stacked bar, donut, table, sparkline, gauge)
3. **DashboardBox container** with title, loading/empty/error states, resize, responsive behavior
4. **Grid layout** via react-grid-layout with drag/drop composition
5. **3 pre-built dashboard templates** per industry pack (executive summary, operational detail, risk/alert)
6. **Theme system** with 2 themes (light professional, dark executive)
7. **Dashboard spec** — save/load as JSON, human-readable, version-stamped
8. **Presenter mode** — step through dashboard sections with commentary and widget highlighting
9. **Export** — save spec JSON, export dashboard as static PNG/PDF for proposals

### MVP explicitly excludes:
- AI spec generation (Phase 2)
- Real data binding / production conversion (Phase 3)
- Collaboration / multi-user editing (Phase 4)
- Custom chart type builder (Phase 4)
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

## 9. Success Criteria

### MVP success (3 months post-launch):
- Used in at least 3 real client workshops
- At least 1 workshop produces a prototype that the client approves without major revisions
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

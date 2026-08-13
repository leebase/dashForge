Implemented the end-to-end DataForge → DashForge showcase.

 Business story

 Industry: Regional HVAC field services
 Fictional company:Apex Climate Services
 Scenario:The first heat wave exposes apparent capacity pressure, but the underlying constraint is poor first-time fix performance and unavailable repair
 parts—not insufficient headcount.

 Meeting decision: Rebalance critical parts across Southwest branches before adding technicians; protect emergency diagnostics and test a dispatch
 intervention.

 Dashboard

 Five contextual comparisons:

 ┌───────────────────────────┬─────────┬─────────────┐
 │ KPI                       │ Actual  │ Baseline    │
 ├───────────────────────────┼─────────┼─────────────┤
 │ First-time fix            │ 75.2%   │ 84% target  │
 ├───────────────────────────┼─────────┼─────────────┤
 │ Emergency SLA             │ 83.3%   │ 95% target  │
 ├───────────────────────────┼─────────┼─────────────┤
 │ Repeat truck rolls        │ 18.2%   │ 10.5% plan  │
 ├───────────────────────────┼─────────┼─────────────┤
 │ Overtime per technician   │ 13.1h   │ 8.0h budget │
 ├───────────────────────────┼─────────┼─────────────┤
 │ Contribution margin/order │ $177.30 │ $218 plan   │
 └───────────────────────────┴─────────┴─────────────┘

 Three connected graphs:

 1. Emergency Demand Cleared Plan — actual weekly work orders versus plan; the latest four weeks are 27.9% over plan.
 2. Two Branches Carry the Callback Burden — Phoenix West and Las Vegas account for 65.2% of repeat work.
 3. The Constraint Is in the Van, Not the Headcount Plan — unavailable parts account for 54.5% of callbacks, broken down by branch and cause.

 The default DashForge surface now presents this dark executive dashboard. Open Builder preserves the same field-service scenario, template, artifact
 binding, and evidence context.

 DataForge implementation

 Primary artifacts:

 - src/dataForge/packs/fieldServicePack.json
 - scenarios/fieldService/first-heat-wave-parts-bottleneck.json
 - stories/field-service-first-heat-wave.yaml
 - src/dataForge/generate.py

 Seed 6207 deterministically generates five compact datasets:

 - executive_summary
 - weekly_service_trend
 - branch_performance
 - callback_causes
 - parts_constraints

 The final employee run produced:

 ```text
synthetic-data-work-package/1.0
sha256:e886a65cea294553d38c0c42c7f2625e7f504b01fe5dd7bad809bb852fc727ab
 ```

 Its quality report passed 9/9 business assertions, with zero requested, injected, detected, or unexpected quality findings.

 DashForge implementation

 Key surfaces:

 - frontend/src/features/runtime/fieldServiceShowcaseDashboard.ts
 - frontend/src/core/data/SyntheticDataArtifactAdapter.ts
 - frontend/src/core/data/VerifiedSyntheticDataArtifacts.ts
 - frontend/src/mock-data/scenarioCatalog.ts
 - frontend/src/mock-data/templateCatalog.ts
 - frontend/src/features/builder/templateInstantiation.ts
 - frontend/src/App.tsx

 The browser does not use hard-coded chart arrays. It validates and queries the generated DataForge snapshot through the existing artifact adapter and
 DashboardSpec/DataAdapter runtime. KPI, chart-caption, and narrative claims are bound to the upstream digest and either a passed assertion or an
 identified dataset observation.

 Pinned DataForge fixtures are byte-identical to the final generated package:

 - frontend/src/fixtures/dataforge/field-service-heat-wave-work-package.json
 - frontend/src/fixtures/dataforge/field-service-heat-wave-snapshot.json
 - frontend/src/fixtures/dataforge/field-service-heat-wave-quality-report.json

 Verification

 - DataForge: python3 -m pytest -q — 60 passed
 - DataForge: python3 -m ruff check src tests — clean
 - DataForge changed-file Black check — clean
 - DashForge: npm test — 35 files, 107 tests passed
 - DashForge: npm run build — TypeScript checks and production Vite build passed
 - Browser smoke at 1440×1000 confirmed:
   - dark executive theme and readable contrast
   - visible synthetic-data and controlled-quality disclosures
   - five unclipped KPI cards
   - three unclipped graph cards
   - compact evidence citations
   - working field-service Builder handoff

 Run it locally:

 ```bash
cd /home/lee/projects/dashForge/frontend
npm run dev
 ```

 The company, scenario, and records are explicitly synthetic. No live Snowflake connection, customer data, mission launch, hosting, or external delivery
 was introduced.

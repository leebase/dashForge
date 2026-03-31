# DashForge

DashForge is an internal Anblicks accelerator for creating realistic, industry-specific dashboard prototypes during client workshops and turning those prototypes into production-ready React assets without throwing the prototype away.

## Canon

These documents are the source of truth:

- `product-definition.md` for product scope, MVP, and value hierarchy
- `architecture.md` for the technical shape of the platform

The rest of the repository should stay aligned to those two files.

## Current Status

DashForge is in the foundation stage.

- Product direction is defined
- Technical architecture is defined
- Tactical planning is aligned
- Product implementation has not started yet

The repository still contains a bootstrap Python scaffold from project initialization. That code is not the intended long-term product architecture. The canon implementation target is a React 19 + Vite + TypeScript application with DashboardSpec as the core artifact.

## MVP Summary

The workshop-ready MVP includes:

- 3 industry mock data packs: Healthcare, Financial Services, SaaS/Technology
- 8 dashboard primitives rendered with ECharts
- a `DashboardBox` container with resilient states and responsive behavior
- grid-based dashboard composition with drag/drop and resize
- dashboard templates by industry and scenario
- a versioned DashboardSpec JSON format
- presenter mode for guided workshop storytelling
- export to spec JSON and static PNG/PDF

## Near-Term Build Target

Sprint 1 is focused on the smallest real vertical slice:

- establish the React/Vite/TypeScript application shell
- define canonical DashboardSpec runtime types and validation
- implement theme tokens and the first dashboard shell
- render an initial primitive from a static spec

## Key Project Docs

- `AGENTS.md`: operating rules for AI agents
- `context.md`: current session memory and next actions
- `WHERE_AM_I.md`: product-level status
- `project-plan.md`: strategic roadmap
- `sprint-plan.md`: current tactical plan
- `result-review.md`: completed work log

## Repository Note

Until Sprint 1 implementation begins, there is no production DashForge app to run locally. Any existing Python CLI behavior is bootstrap residue, not a representation of the target product.

---

Created on 2026-03-31 by Lee Harrington.

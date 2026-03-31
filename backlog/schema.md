# dashForge Backlog Item Schema

> **The Contract**: AI (scout) → Human (curator) → Builder (factory)

This schema defines the YAML frontmatter format for all backlog items. It unifies:

- sprint-plan operational focus
- research mining detail such as risks, mitigations, and effort
- builder consumption requirements

For DashForge, backlog items should trace clearly to one of these drivers:

- MVP scope from `product-definition.md`
- architectural constraints or components from `architecture.md`
- sprint execution needs from `sprint-plan.md`

---

## File Location

```text
backlog/
├── candidates/       # AI writes here
├── approved/         # Human moves items here when approved
├── parked/           # Human moves items here when deferred
├── implemented/      # Builder moves items here when complete
└── schema.md         # This file
```

**File naming**: `backlog/{candidates,approved,parked,implemented}/BI-NNN-{kebab-title}.md`

## Schema Definition

```yaml
---
# REQUIRED: Identity
id: BI-001
title: Implement DashboardBox

# REQUIRED: Source
source: architecture/runtime
source_insight: >
  The architecture requires a reusable container that normalizes widget states.

# REQUIRED: Rationale
opportunity: >
  Enables all dashboard widgets to share a consistent title, state, and layout frame.

why_now: >
  Sprint 1 needs a real runtime shell before additional primitives are worth building.

# REQUIRED: Implementation
minimal_impl: >
  Build a container that renders title, body, loading state, empty state, and error state.

definition_of_done:
  - Container renders title and body content
  - Loading, empty, and error states are visually distinct
  - A sample widget uses the container successfully

# REQUIRED: Planning metadata
effort: M
build_recipe: builder_safe
priority: now

# OPTIONAL: Dependencies
dependencies:
  - BI-000

# OPTIONAL: Risk assessment
risks: >
  Overbuilding the container before the first vertical slice is proven could slow Sprint 1.

mitigations: >
  Keep the API narrow and only implement the states required by the first widget.

# OPTIONAL: Tags
tags:
  - primitive
  - runtime
  - phase-1

# RUNTIME FIELDS
status: candidate
created_at: 2026-03-31T12:00:00Z
created_by: AI-Run-XXX
token_cost: 0

# CURATOR FIELDS
approved_at: ~
approved_by: ~
notes: ~

# BUILDER FIELDS
implemented_at: ~
implemented_by: ~
pr_url: ~
---

# Body

Additional context, discussion, research notes, or links.
```

---

## Field Reference

### Identity Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Format: `BI-NNN` such as `BI-001` |
| `title` | string | ✅ | Human-readable, max 80 chars |

### Source Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | ✅ | What inspired this item |
| `source_insight` | string | ✅ | One-sentence key insight tied to canon or sprint need |

### Rationale Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `opportunity` | text | ✅ | What capability is gained |
| `why_now` | text | ✅ | Why this matters in the current phase or sprint |

### Implementation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `minimal_impl` | text | ✅ | Smallest implementation that actually works |
| `definition_of_done` | list | ✅ | Measurable outcomes |

### Planning Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `effort` | enum | ✅ | `S` for hours, `M` for days, `L` for weeks |
| `build_recipe` | enum | ✅ | Execution permission level |
| `priority` | enum | ✅ | `now`, `next`, or `someday` |
| `dependencies` | list | ❌ | Prerequisite items or requirements |
| `risks` | text | ❌ | What could go wrong |
| `mitigations` | text | ❌ | How to reduce the risk |
| `tags` | list | ❌ | Free-form tags |

---

## Build Recipe Explained

| Recipe | Meaning | Use Case |
|--------|---------|----------|
| `planner_only` | No code execution allowed | Research, architecture docs, product-definition changes |
| `builder_safe` | Code generation allowed, human review required | Most DashForge implementation work |
| `operator_blocked` | Never auto-execute, human must run | Security-critical ops or production environment changes |

---

## Workflow

```text
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│   AI    │────▶│Candidates│────▶│ Approved │────▶│Implemented │
│generates│     │(awaiting │     │(ready for│     │(complete)  │
│         │     │ review)  │     │ factory) │     │            │
└─────────┘     └──────────┘     └──────────┘     └────────────┘
                       │                ▲
                       ▼                │
                ┌──────────┐           │
                │  Parked  │───────────┘
                │(deferred)│
                └──────────┘
```

---

## Version

Schema Version: 1.0.0
Last Updated: 2026-03-31

# Feedback Log

> Capture actionable feedback from humans or reviewing AIs.
>
> Structure: newest entries first. Keep findings specific, tied to canon when possible, and clear about whether they were actioned.

---

## Feedback Entries (Newest First)

No feedback logged yet.

Use the template below for the first real entry.

### YYYY-MM-DD — Review by Reviewer Name

**Status**: 🟡 Pending / 🟢 Actioned / 🔴 Declined / ⚪ Superseded

**Scope**: [Specific files, features, decisions, or docs reviewed]

**Findings**:

1. **[CATEGORY] Brief description of issue**
   - **Location**: `path/to/file:line` or "product/architecture decision"
   - **Issue**: What was found
   - **Recommendation**: What should change
   - **Priority**: 🔴 High / 🟡 Medium / 🟢 Low

**Action Items**:

- [ ] Item 1
- [ ] Item 2

**Context/Notes**:
[Any additional context, alternatives considered, or rationale]

---

## Feedback Categories

Use these prefixes for consistent organization:

- **[ARCHITECTURE]** — Structural decisions, patterns
- **[CODE]** — Implementation details, logic, algorithms
- **[API]** — Interface design, public functions, or contracts
- **[DOCS]** — Documentation, comments, README
- **[TEST]** — Test coverage, test quality, edge cases
- **[PERF]** — Performance, efficiency, resource usage
- **[SEC]** — Security considerations
- **[UX]** — User experience, error messages, workflow
- **[PRODUCT]** — Alignment with product definition, MVP, and consulting value
- **[WORKSHOP]** — Support for the client workshop use case
- **[STYLE]** — Code style, formatting, naming

## Status Legend

- 🟡 **Pending** — Feedback received, action not yet taken
- 🟢 **Actioned** — Changes implemented and verified
- 🔴 **Declined** — Intentionally not addressed
- ⚪ **Superseded** — Overtaken by later decisions

## How to Use This File

### As a Reviewer

1. Copy the template section
2. Fill in findings with specific locations and references to canon docs when relevant
3. Set status to 🟡 Pending
4. Assign action items if known

### As a Coder

1. Read feedback from top, most recent first
2. Address high-priority items first
3. Update checkboxes as work completes
4. Change status to 🟢 Actioned when complete
5. Add a brief note about what was done

### When to Decline

If you disagree with feedback:

1. Change status to 🔴 Declined
2. Add your rationale under Context/Notes
3. Link the decision to canon docs or updated direction when possible

---

*This file is a living document. Keep feedback actionable, specific, and kind.*

# Sprint 8 Plan - AI-Assisted DashboardSpec Generation + Prompt-to-Spec Flow

## Goal

Execute Sprint 8 as a bounded AI-generation slice layered on top of the closed
Sprint 7 builder/presenter/export baseline. The output of this sprint should
let a consultant enter a pack-aware prompt, generate a validated
`DashboardSpec` candidate with narrative content, review it, and apply it into
the existing shared runtime without widening the product into backend
orchestration, live binding, or autonomous multi-turn chat behavior.

## Planning Assumptions

- Sprint 7 closeout artifacts are authoritative for the current builder,
  presenter, export, and shared-runtime baseline.
- `BuilderShell` remains the app entry point for this slice; Sprint 8 should
  add AI controls inside that shell or directly adjacent to it instead of
  replacing the current app structure.
- There is no existing AI feature surface under `frontend/src/`, so Sprint 8
  should add a focused `frontend/src/features/ai/` area rather than scattering
  generation logic throughout the repo.
- The current template and scenario catalogs already provide enough pack,
  scenario, intent, and audience metadata to seed prompt context, though Sprint
  8 may add small helper exports where that keeps prompt assembly canonical.
- `architecture.md` explicitly names Claude API integration for spec
  generation, but provider details should remain behind a local client
  interface so the builder shell depends on one typed seam instead of raw HTTP
  request code.
- The Sprint 7 runtime already expects narrative content and validated widget
  references, so AI generation should target the existing `DashboardSpec`
  surface instead of inventing a second authoring schema.
- Manual builder workflows remain the product baseline. AI is an accelerator,
  not a hard requirement for normal product use.

## Implementation Guardrails

- Keep one authoritative applied draft and one separate staged AI candidate.
  Do not auto-merge generated output directly into the active draft.
- Prefer prompt context grounded in the existing pack/scenario/template catalog,
  theme registry, and supported widget subset instead of unconstrained freeform
  generation.
- Final AI output must always be a full `DashboardSpec` candidate. Internal
  seeding from a starter template or current draft is allowed if it helps keep
  the candidate inside the validated runtime surface.
- Parse, validate, and sync every generated candidate before the UI can offer
  it for apply.
- Keep provider-specific code, raw response parsing, and secret-aware request
  handling inside `frontend/src/features/ai/`.
- Keep API secrets out of `DashboardSpec`, JSON export files, proposal
  artifacts, repo files, and long-lived local storage.
- Keep automated tests fully mocked at the provider boundary; no live AI calls
  belong in the test suite.
- Do not widen Sprint 8 into backend proxy work, live data binding, or new
  runtime dependencies without explicit approval.

## Scope Summary

### Deliver In Sprint 8

- AI prompt bar/panel integrated into the current builder workflow
- prompt templates per pack/intent plus pack-aware prompt-context assembly
- provider client seam for spec generation requests
- response extraction, validation, bounded repair, and candidate staging
- explicit generate-new and improve-current dashboard modes
- apply/discard controls for staged candidates
- targeted tests for prompt building, validation, failure handling, and builder
  integration

### Do Not Deliver In Sprint 8

- live/production data binding
- production React code export
- workshop-note upload, file attachment, or multi-turn chat history
- backend credential brokering or server-side AI proxy work
- fine-tuning, eval harnesses, or telemetry-heavy prompt infrastructure
- new chart primitives, new industry packs, or broad schema redesign
- autonomous repeated regeneration loops beyond one bounded repair pass
- broad repo cleanup unrelated to the AI generation slice

## Ordered Work

### 1. Define The AI Generation Contract And Candidate State Model

Objective:
Introduce one typed generation seam for new-dashboard and improve-dashboard
requests before the UI depends on it.

Primary file targets:

- `frontend/src/features/ai/generateDashboardSpec.ts`
- `frontend/src/features/builder/BuilderShell.tsx`
- optional small support changes in `frontend/src/core/spec/dashboardSpec.ts`

Done when:

- there is one typed request/response contract for Sprint 8 AI generation
- generate-new and improve-current modes are explicit in that contract
- the builder can hold a staged candidate separate from the currently applied
  draft

### 2. Build Prompt Context And Prompt Templates

Objective:
Turn the current catalog/spec metadata into reusable AI prompt inputs instead of
hard-coded freeform instructions.

Primary file targets:

- `frontend/src/features/ai/buildGenerationPrompt.ts`
- `frontend/src/features/ai/promptTemplates.ts`
- `frontend/src/mock-data/templateCatalog.ts`
- `frontend/src/mock-data/scenarioCatalog.ts`
- optional small support changes in `frontend/src/core/spec/dashboardSpec.ts`

Done when:

- prompts can be assembled from selected pack/scenario/theme context
- prompt helpers can reference the supported widget types, dashboard intents,
  narrative sections, and current template metadata
- pack-specific starter prompts exist for the current healthcare, financial,
  and saas packs
- improve-current mode can include the current validated draft as context
  without inventing a second spec format

### 3. Add The Provider Client Seam

Objective:
Keep provider transport details out of the builder shell while preserving the
architecture direction toward Claude-based spec generation.

Primary file targets:

- `frontend/src/features/ai/aiGenerationClient.ts`
- `frontend/src/features/ai/generateDashboardSpec.ts`

Done when:

- the builder calls a local client interface instead of raw provider code
- provider errors are mapped into typed UI-friendly failure states
- configuration remains explicit and bounded rather than hidden in product
  artifacts

### 4. Add Response Extraction, Validation, And Bounded Repair

Objective:
Make generated output safe to review and apply inside the existing runtime.

Primary file targets:

- `frontend/src/features/ai/generateDashboardSpec.ts`
- `frontend/src/core/spec/dashboardSchema.ts`
- `frontend/src/features/presenter/narrativeStore.ts`

Done when:

- provider output can be reduced to candidate JSON or a clear parsing failure
- candidate specs are validated with the existing schema path
- presenter narrative/widget references are hydrated and clamped before review
- one bounded repair pass can be attempted when validation feedback is enough
  to recover a candidate safely
- the active draft remains untouched when the candidate still fails

### 5. Integrate The AI Prompt UI Into The Builder

Objective:
Make Sprint 8 feel like a natural extension of the current builder workflow
instead of an isolated helper utility.

Primary file targets:

- `frontend/src/features/ai/AiPromptBar.tsx`
- `frontend/src/features/builder/BuilderToolbar.tsx`
- `frontend/src/features/builder/BuilderShell.tsx`

Done when:

- the builder exposes prompt entry and generation mode selection
- the UI shows generation progress, validation failures, and candidate state
- the Sprint 7 manual workflow remains usable when AI is not configured

### 6. Apply Candidates Through The Shared Runtime

Objective:
Preserve the closed Sprint 7 runtime path after AI output is accepted.

Primary file targets:

- `frontend/src/features/builder/BuilderShell.tsx`
- focused support changes under `frontend/src/features/export/` or
  `frontend/src/features/presenter/` only if needed for apply-time regression
  coverage

Done when:

- a valid candidate can be reviewed, applied, or discarded explicitly
- applying the candidate updates the same draft that preview, presenter, JSON
  export, and proposal-artifact export already use
- improve-current mode preserves the same shared-runtime assumptions as
  template-driven manual editing

### 7. Add Verification Coverage

Objective:
Leave Sprint 8 with durable proof that AI generation is bounded and does not
break the closed Sprint 7 behavior.

Primary file targets:

- tests under `frontend/src/features/ai/`
- focused updates under `frontend/src/features/builder/`
- optional focused updates under `frontend/src/features/presenter/` or
  `frontend/src/features/export/`

Done when:

- prompt template/context assembly is covered
- response parsing and validation failures are covered
- bounded repair behavior is covered
- generate-new and improve-current flows are covered
- applying or discarding a candidate is covered
- manual fallback behavior is covered when generation fails or is unavailable
- `npm --prefix frontend test` and `npm --prefix frontend run build` stay green

### 8. Verify And Close The Slice

Objective:
Hand Sprint 9 a stable AI-assisted spec-generation baseline instead of another
planning-only placeholder.

Done when:

- the Sprint 8 AI-generation artifacts are present
- frontend tests pass
- frontend build passes
- residual provider/configuration limits are explicitly documented

## Verification Matrix

| Area | Proof |
|------|-------|
| Prompt context | Pack/scenario/template-aware prompt builders emit the expected bounded instructions |
| Prompt templates | Healthcare, financial, and saas starter prompts stay aligned with catalog metadata |
| Provider seam | Builder integration can run entirely against a mocked generation client |
| Parsing and validation | Invalid or partial provider output is rejected without clobbering the active draft |
| Bounded repair | One repair pass can recover a candidate when validation feedback is sufficient |
| Candidate flow | Generate, review, apply, and discard behaviors work on top of the current builder shell |
| Shared runtime compatibility | Accepted candidates still preview, present, and export through the Sprint 7 runtime path |
| Frontend health | `npm --prefix frontend test` and `npm --prefix frontend run build` succeed |

## Risks And Controls

| Risk | Control |
|------|---------|
| AI returns invalid but plausible-looking JSON | Keep schema validation and candidate review mandatory before apply |
| Freeform prompting generates layouts outside the supported product surface | Build prompts from current spec/catalog metadata and allow template-seeded generation |
| Provider transport details leak into UI code | Isolate them behind `aiGenerationClient.ts` and typed helper functions |
| API-secret handling becomes unsafe in a frontend-first app | Keep configuration explicit, bounded, and out of persisted product artifacts |
| AI generation breaks Sprint 7 presenter/export behavior after apply | Reuse the same draft/runtime path and add regression coverage around apply-time behavior |
| Scope sprawls into a chat assistant or backend platform | Hold Sprint 8 to prompt-to-spec generation, one bounded repair pass, and no backend proxy work |

## Verification Commands

```bash
cd /Users/lee/projects/dashForge/frontend
npm test
npm run build
```

Optional repo-baseline check if implementation unexpectedly touches shared
cross-cutting seams outside the frontend AI-generation slice:

```bash
cd /Users/lee/projects/dashForge
python3 -m pytest -q
```

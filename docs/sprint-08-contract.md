# Sprint 8 Contract - AI-Assisted DashboardSpec Generation + Prompt-to-Spec Flow

## Objective

Sprint 8 turns DashForge from a bounded manual builder/presenter tool into a
bounded AI-assisted spec authoring workflow. The output of this sprint is a
frontend prompt-to-spec slice that:

- adds an AI prompt entry point to the closed Sprint 7 builder shell,
- builds pack-aware generation prompts from the existing `DashboardSpec`
  contract, template catalog, and scenario metadata,
- generates full `DashboardSpec` candidates, including narrative content,
  through a provider client that stays behind a narrow local seam, and
- validates, hydrates, and stages generated candidates for human review before
  they replace the current draft.

This sprint is intentionally bounded to AI-assisted `DashboardSpec` generation
inside the existing builder workflow. It does not deliver live binding,
production code export, multi-turn agent collaboration, backend orchestration,
or a broad spec redesign.

## Canon Sources

Sprint 8 must stay aligned with:

- `product-definition.md`
- `project-plan.md`
- `architecture.md`
- `sprint-plan.md`
- Sprint 7 closeout artifacts under `docs/`, `plans/`, and `code-reviews/`

If those documents and this contract diverge, the canon docs win and this
contract must be corrected.

## Starting Baseline

Sprint 7 closed the storytelling/export slice:

- the app still boots into `frontend/src/features/builder/BuilderShell.tsx`,
- the builder owns one editable `DashboardSpec` draft backed by the closed
  Sprint 2-7 runtime seams,
- build, preview, presenter, and export all operate on the same validated
  draft and shared renderer path, and
- `syncPresenterDraft(...)` already hydrates and clamps the existing narrative
  branch so presenter/export behavior stays aligned with the spec.

The Sprint 8 gap is concrete in the current codebase:

- `frontend/src/features/builder/BuilderToolbar.tsx` and
  `frontend/src/features/builder/BuilderShell.tsx` expose template, JSON I/O,
  presenter, and export controls, but no AI prompt or generation flow,
- there is no `frontend/src/features/ai/` surface yet,
- `frontend/src/mock-data/templateCatalog.ts` and
  `frontend/src/mock-data/scenarioCatalog.ts` expose pack, scenario, intent,
  and template metadata, but there is no helper that turns that canon metadata
  into generation-time vocabulary or prompt context,
- `frontend/src/core/spec/dashboardSchema.ts` can validate a candidate spec, but
  there is no AI-output parsing, bounded repair, or candidate-review path, and
- the closed Sprint 7 presenter/export path already works on validated specs,
  so Sprint 8 should extend that shared draft workflow rather than bypass it.

Sprint 8 builds forward from that baseline. It should add the safest useful AI
generation seam on top of the closed Sprint 7 builder shell instead of
reopening presenter/export, runtime, adapter, theme, or generator contracts
unless a concrete defect is uncovered.

## Scope

### In Scope

#### 1. AI Prompt Entry And Generation Modes

- Add a bounded builder-adjacent prompt surface under
  `frontend/src/features/ai/`, such as `AiPromptBar.tsx`.
- Support two explicit Sprint 8 generation modes:
  - generate a new dashboard candidate from prompt + pack/scenario/theme
    context, and
  - improve the current dashboard by prompting against the currently validated
    draft.
- Keep AI optional. If provider configuration is unavailable, the Sprint 7
  manual workflow must still be fully usable.
- AI must never overwrite the current draft silently. Generation produces a
  staged candidate plus status, and the user chooses whether to apply it.

#### 2. Prompt Context Assembly And Prompt Templates

- Add prompt-building helpers under `frontend/src/features/ai/`.
- Build system/user prompt context from existing canon metadata instead of
  duplicating pack vocabulary in ad hoc strings:
  - supported widget/chart types from the current `DashboardSpec` surface,
  - supported themes,
  - pack/scenario ids from `scenarioCatalog`,
  - template intent/audience metadata from `templateCatalog`, and
  - the bounded narrative and annotation subset already supported by the app.
- Support prompt templates per pack and intent so the consultant can start from
  a realistic workshop-friendly prompt instead of a blank text area.
- Template-seeded or current-draft-seeded generation is in scope if it helps
  keep output inside the validated layout/runtime surface. The final output
  remains a full `DashboardSpec`, not a private patch format.

#### 3. Provider Client And Request Boundary

- Add a local provider seam such as
  `frontend/src/features/ai/aiGenerationClient.ts`.
- Because `architecture.md` explicitly calls for Claude API integration, Sprint
  8 should preserve that direction through a Claude-compatible generation
  client, but the rest of the builder must depend only on a local interface and
  typed request/response helpers.
- Keep provider-specific request assembly, response extraction, and error
  mapping under `frontend/src/features/ai/` rather than scattering them across
  builder components.
- Keep the slice self-contained. Backend brokering, server-side prompt
  orchestration, and credential vault work are not part of Sprint 8.
- Generated/exported artifacts must never persist API secrets inside
  `DashboardSpec`, proposal exports, JSON I/O output, or repo files.

#### 4. Response Parsing, Validation, And Bounded Repair

- Add helpers that can:
  - extract candidate JSON from a provider response,
  - validate it with the existing `DashboardSpec` validator,
  - hydrate/clamp it through the existing presenter-safe draft helpers, and
  - return either a staged candidate or actionable validation errors.
- A single bounded repair pass based on validation feedback is in scope if it
  stays inside the same request seam and does not turn the product into a
  multi-turn chat workflow.
- If the candidate still fails validation after the bounded pass, keep the
  current draft intact and surface the failure clearly in the UI.
- Generated narrative content must land on the same `DashboardSpec.narrative`
  surface the Sprint 7 runtime already supports, including valid widget
  references after clamping.

#### 5. Builder Integration And Shared Runtime Compatibility

- Integrate Sprint 8 controls into the current builder chrome instead of
  building a second AI-only shell.
- Keep one authoritative applied draft plus a separate staged candidate state.
- Generated candidates must remain compatible with:
  - preview rendering,
  - presenter mode,
  - spec export/download, and
  - proposal-artifact export.
- AI may generate spec structure, titles, narrative, intent, and data-ref
  choices, but it must stay inside the current adapter-backed contract. It must
  not bypass `DataAdapter` assumptions or inject raw React/ECharts code.

#### 6. Automated Coverage

- Add targeted automated coverage for:
  - prompt context assembly,
  - prompt template selection,
  - provider-response extraction and error handling,
  - candidate validation and bounded repair behavior,
  - generate-new versus improve-current request modes,
  - non-destructive failure handling, and
  - applying a validated candidate back into the existing preview/presenter
    flow.

### Explicitly Out Of Scope

- Live/production data binding or binding-authoring workflows
- Production React code generation or export
- Multi-turn chat history, workshop-note upload, file attachment flows, or
  agent-style orchestration inside the product
- New industry packs, new scenarios, or new chart primitives
- A broad `DashboardSpec` redesign for AI-generation convenience
- Provider-auth backend, secret vault integration, or server-side prompt proxy
- Fine-tuning, eval pipelines, or prompt-observability infrastructure
- Autonomous repeated retry loops beyond one bounded repair attempt
- Silent auto-apply of generated output without explicit user review
- Broad repo cleanup unrelated to the AI generation slice
- New runtime dependencies without explicit human approval

## Constraints

- Build on Sprint 7's closed builder/presenter/export baseline instead of
  redesigning it.
- The same `DashboardSpec` remains the canonical artifact for build, preview,
  presenter, export, and AI-generated output.
- AI generates structured spec/narrative data only. It must not generate raw
  React component code or raw ECharts option blobs as product output.
- Reuse the existing schema validator and presenter-draft sync helpers instead
  of introducing a second private acceptance path for AI output.
- Prompt builders should draw from existing catalog/spec metadata wherever
  possible rather than hard-coding duplicate industry vocabulary.
- Generated widgets must remain compatible with adapter-backed runtime behavior;
  Sprint 8 must not add a special AI-only data path.
- Keep provider-specific code isolated under `frontend/src/features/ai/`.
- Keep secrets out of persisted product artifacts.
- Preserve the closed Sprint 7 manual workflow as a first-class fallback when
  AI configuration is absent or generation fails.
- Respect the current dependency guardrail. If a proposed AI integration path
  requires new runtime packages or backend services, split it rather than
  silently widening the sprint.

## Required Outputs

- `docs/sprint-08-contract.md`
- `plans/sprint-08-plan.md`
- `frontend/src/features/ai/AiPromptBar.tsx`
- `frontend/src/features/ai/buildGenerationPrompt.ts`
- `frontend/src/features/ai/promptTemplates.ts`
- `frontend/src/features/ai/aiGenerationClient.ts`
- `frontend/src/features/ai/generateDashboardSpec.ts`
- supporting runtime/state/test updates primarily under:
  - `frontend/src/features/ai/`
  - `frontend/src/features/builder/`
  - `frontend/src/core/spec/`
  - `frontend/src/mock-data/`
  - `frontend/src/App.tsx`
  - `frontend/src/**/*.test.ts*`

## Ordered Work

1. Lock the Sprint 8 contract and plan against Sprint 7 closeout, canon docs,
   and the current builder/runtime seams.
2. Establish the typed AI generation request/response helpers and the prompt
   context builders that reuse existing spec/catalog metadata.
3. Add the provider client seam plus bounded response extraction, validation,
   and repair helpers.
4. Deliver the prompt entry surface for generate-new and improve-current modes.
5. Stage valid AI output as a candidate, then let the user apply or discard it
   without clobbering the current draft automatically.
6. Integrate the accepted candidate into the shared preview/presenter/export
   runtime path instead of forking a second shell.
7. Add targeted tests for prompt building, provider mocking, validation
   failures, and candidate-apply behavior.
8. Verify, repair, and hand off the sprint before opening Sprint 9.

## Acceptance Criteria

1. Sprint 8 remains bounded to AI-assisted `DashboardSpec` generation and
   prompt-to-spec flow on top of the closed Sprint 7 baseline.
2. A builder-integrated AI prompt surface exists and supports both generate-new
   and improve-current dashboard flows.
3. Prompt context is assembled from the existing spec/catalog/runtime metadata
   rather than an ad hoc duplicated industry dictionary.
4. Provider-specific integration is isolated behind a local generation client
   seam that preserves the architecture's Claude-integration direction without
   leaking provider details across the builder.
5. Valid AI output produces a staged `DashboardSpec` candidate that can be
   applied into the existing builder and shared runtime.
6. Invalid AI output never replaces the current draft silently and surfaces
   actionable validation or parsing errors.
7. Generated narrative content uses the existing `DashboardSpec.narrative`
   surface and ends with widget references that are valid after clamping.
8. The Sprint 7 preview/presenter/export workflow remains intact after an
   accepted candidate is applied.
9. The manual builder workflow still works when AI configuration is absent or a
   generation request fails.
10. `npm --prefix frontend test` passes after the Sprint 8 slice lands.
11. `npm --prefix frontend run build` passes after the Sprint 8 slice lands.

## Verification Expectations

- Re-read this contract and `plans/sprint-08-plan.md` before implementation.
- Prefer targeted frontend checks for:
  - prompt template/context assembly,
  - provider-response extraction,
  - validation and bounded repair behavior,
  - generate-new versus improve-current request wiring,
  - non-destructive error handling,
  - candidate apply/discard flow, and
  - shared preview/presenter compatibility after apply.
- Keep live network calls mocked in automated tests.
- Keep the broader repo Python/generator surface out of scope unless a concrete
  regression requires a repo-level rerun.
- Treat drift toward backend credential brokering, live binding, production code
  export, or multi-turn AI workflow design as a contract violation unless the
  human explicitly reopens scope.

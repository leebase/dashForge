import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import type {
  AiGenerationClientAvailability,
  AiGenerationMode,
  GenerateDashboardSpecResult,
} from "./aiTypes";

interface AiPromptBarProps {
  availability: AiGenerationClientAvailability;
  currentDraft: DashboardSpec;
  currentPackId: string;
  currentScenarioId: string;
  currentThemeId: string;
  generationState:
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: string; details: string[] }
    | { status: "success"; message: string };
  stagedCandidate: Extract<GenerateDashboardSpecResult, { ok: true }> | null;
  onApplyCandidate: () => void;
  onDiscardCandidate: () => void;
  onGenerate: (request: {
    mode: AiGenerationMode;
    prompt: string;
    promptTemplateId?: string;
  }) => void;
}

export function AiPromptBar({
  availability,
  currentDraft,
  currentPackId,
  currentScenarioId,
  currentThemeId,
  generationState,
  stagedCandidate,
  onApplyCandidate,
  onDiscardCandidate,
  onGenerate,
}: AiPromptBarProps) {
  return (
    <section
      className="builder-panel builder-panel--wide"
      aria-labelledby="ai-prompt-title"
    >
      <div className="builder-panel__header">
        <p className="eyebrow">Governed Generation</p>
        <h2 className="builder-panel__title" id="ai-prompt-title">
          Agent-Orch Staged Candidate
        </h2>
        <p className="builder-helper-copy">
          Model planning happens in Agent-Orch. This browser can only load a
          staged dashboard-generation-result that already passed deterministic
          manifest, binding, and claim-coverage validation.
        </p>
      </div>

      <dl className="standalone-meta">
        <div>
          <dt>Current draft</dt>
          <dd>{currentDraft.meta.title}</dd>
        </div>
        <div>
          <dt>Bounded context</dt>
          <dd>
            {currentPackId} / {currentScenarioId} · {currentThemeId}
          </dd>
        </div>
      </dl>

      <div className="ai-prompt-actions">
        <button
          className="button"
          disabled={
            generationState.status === "loading" ||
            availability.status !== "configured"
          }
          onClick={() =>
            onGenerate({
              mode: "improve_current",
              prompt: "Load the validated Agent-Orch staged candidate.",
            })
          }
          type="button"
        >
          {generationState.status === "loading"
            ? "Loading staged candidate…"
            : "Load Staged Candidate"}
        </button>
        <p className="builder-helper-copy">
          Browser-side credentials and direct model calls are intentionally not
          available.
        </p>
      </div>

      <div className="ai-prompt-status">
        {availability.status === "configured" ? (
          <div className="builder-alert builder-alert--info" role="status">
            {availability.providerLabel} is ready as{" "}
            <strong>{availability.model}</strong>.
          </div>
        ) : (
          <div className="builder-alert builder-alert--warning" role="status">
            {availability.reason}
          </div>
        )}

        {generationState.status === "error" ? (
          <div className="builder-alert builder-alert--error" role="alert">
            {[generationState.error, ...generationState.details].join("; ")}
          </div>
        ) : null}

        {generationState.status === "success" ? (
          <div className="builder-alert builder-alert--info" role="status">
            {generationState.message}
          </div>
        ) : null}

        {stagedCandidate ? (
          <section className="ai-candidate" aria-labelledby="ai-candidate-title">
            <div className="ai-candidate__header">
              <div>
                <p className="eyebrow">Staged Candidate</p>
                <h3 id="ai-candidate-title">
                  {stagedCandidate.candidate.meta.title}
                </h3>
                <p className="builder-helper-copy">
                  {stagedCandidate.candidate.widgets.length} widgets ·{" "}
                  {stagedCandidate.candidate.intent.industry} /{" "}
                  {stagedCandidate.candidate.intent.scenario ??
                    currentScenarioId}{" "}
                  · {stagedCandidate.candidate.theme.id}
                </p>
              </div>

              <div className="ai-candidate__actions">
                <button
                  className="button"
                  onClick={onApplyCandidate}
                  type="button"
                >
                  Apply Candidate
                </button>
                <button
                  className="button button--ghost"
                  onClick={onDiscardCandidate}
                  type="button"
                >
                  Discard
                </button>
              </div>
            </div>

            <p className="builder-helper-copy">
              Deterministic manifest, adapter, and claim checks passed before
              staging. Applying remains an explicit consultant action.
            </p>
          </section>
        ) : null}
      </div>
    </section>
  );
}
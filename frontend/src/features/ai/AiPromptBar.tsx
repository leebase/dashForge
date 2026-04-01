import { useEffect, useState } from "react";

import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import type {
  AiGenerationClientAvailability,
  AiGenerationMode,
  GenerateDashboardSpecResult,
} from "./aiTypes";
import { getDefaultPromptTemplate, listPromptTemplates } from "./promptTemplates";

interface AiPromptBarProps {
  availability: AiGenerationClientAvailability;
  currentDraft: DashboardSpec;
  currentPackId: string;
  currentScenarioId: string;
  currentThemeId: string;
  generationState:
    | {
        status: "idle";
      }
    | {
        status: "loading";
      }
    | {
        status: "error";
        error: string;
        details: string[];
      }
    | {
        status: "success";
        message: string;
      };
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
  const promptTemplates = listPromptTemplates({
    packId: currentPackId,
    scenarioId: currentScenarioId,
  });
  const defaultTemplate = getDefaultPromptTemplate(currentPackId, currentScenarioId);
  const [mode, setMode] = useState<AiGenerationMode>("generate_new");
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate?.id ?? "");
  const [prompt, setPrompt] = useState(defaultTemplate?.prompt ?? "");

  useEffect(() => {
    const nextDefault = getDefaultPromptTemplate(currentPackId, currentScenarioId);

    setSelectedTemplateId(nextDefault?.id ?? "");
    setPrompt(nextDefault?.prompt ?? "");
  }, [currentPackId, currentScenarioId]);

  const helperText =
    mode === "improve_current"
      ? `Improve the current draft "${currentDraft.meta.title}" without auto-applying the result.`
      : `Generate a new ${currentPackId} candidate for ${currentScenarioId} using theme ${currentThemeId}.`;

  return (
    <section className="builder-panel builder-panel--wide" aria-labelledby="ai-prompt-title">
      <div className="builder-panel__header">
        <p className="eyebrow">Sprint 8 AI Generation</p>
        <h2 className="builder-panel__title" id="ai-prompt-title">
          Prompt To DashboardSpec
        </h2>
        <p className="builder-helper-copy">
          Build a staged candidate from a bounded prompt, review it, then choose whether to apply
          it into the shared builder, presenter, and export runtime.
        </p>
      </div>

      <div className="ai-prompt-grid">
        <label className="form-field">
          <span>Mode</span>
          <select
            onChange={(event) => setMode(event.target.value as AiGenerationMode)}
            value={mode}
          >
            <option value="generate_new">Generate New</option>
            <option value="improve_current">Improve Current</option>
          </select>
        </label>

        <label className="form-field">
          <span>Prompt Template</span>
          <select
            onChange={(event) => {
              const nextTemplateId = event.target.value;
              const nextTemplate = promptTemplates.find(
                (template) => template.id === nextTemplateId,
              );

              setSelectedTemplateId(nextTemplateId);
              setPrompt(nextTemplate?.prompt ?? "");
            }}
            value={selectedTemplateId}
          >
            {promptTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-field">
        <span>Consultant Prompt</span>
        <textarea
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the dashboard you want DashForge to stage."
          rows={6}
          value={prompt}
        />
      </label>

      <div className="ai-prompt-actions">
        <button
          className="button"
          disabled={
            generationState.status === "loading" ||
            availability.status !== "configured" ||
            prompt.trim().length === 0
          }
          onClick={() =>
            onGenerate({
              mode,
              prompt: prompt.trim(),
              promptTemplateId: selectedTemplateId || undefined,
            })
          }
          type="button"
        >
          {generationState.status === "loading" ? "Generating..." : "Generate Candidate"}
        </button>
        <p className="builder-helper-copy">{helperText}</p>
      </div>

      <div className="ai-prompt-status">
        {availability.status === "configured" ? (
          <div className="builder-alert builder-alert--info">
            Claude is configured with model <strong>{availability.model}</strong>.
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
                <h3 id="ai-candidate-title">{stagedCandidate.candidate.meta.title}</h3>
                <p className="builder-helper-copy">
                  {stagedCandidate.candidate.widgets.length} widgets ·{" "}
                  {stagedCandidate.candidate.intent.industry} /{" "}
                  {stagedCandidate.candidate.intent.scenario ?? currentScenarioId} ·{" "}
                  {stagedCandidate.candidate.theme.id}
                </p>
              </div>

              <div className="ai-candidate__actions">
                <button className="button" onClick={onApplyCandidate} type="button">
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
              {stagedCandidate.promptTemplate
                ? `Seeded from ${stagedCandidate.promptTemplate.label}. `
                : ""}
              {stagedCandidate.didRepair
                ? "A bounded repair pass was needed before validation succeeded."
                : "Validated on the first pass."}
            </p>
          </section>
        ) : null}
      </div>
    </section>
  );
}

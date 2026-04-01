import { StaticDataAdapter } from "../../core/data/StaticDataAdapter";
import {
  isDatasetWidgetDataRef,
  type DashboardSpec,
} from "../../core/spec/dashboardSpec";
import { validateDashboardSpec } from "../../core/spec/dashboardSchema";
import { getScenarioDefinition, resolveScenarioDatasetMap } from "../../mock-data/scenarioCatalog";
import { syncPresenterDraft } from "../presenter/narrativeStore";
import { buildGenerationPrompt } from "./buildGenerationPrompt";
import type {
  AiGenerationClient,
  GenerateDashboardSpecResult,
  DashboardGenerationRequest,
} from "./aiTypes";

function extractJsonCandidate(responseText: string): string | null {
  const fencedMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = responseText.indexOf("{");
  const lastBrace = responseText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return responseText.slice(firstBrace, lastBrace + 1).trim();
}

function parseCandidateDocument(candidateJson: string): unknown {
  return JSON.parse(candidateJson) as unknown;
}

function canSyncPresenterDraft(input: unknown): input is DashboardSpec {
  if (!input || typeof input !== "object") {
    return false;
  }

  const record = input as Record<string, unknown>;
  return Array.isArray(record.widgets) && typeof record.meta === "object";
}

function validateRuntimeCompatibility(
  candidate: DashboardSpec,
  request: DashboardGenerationRequest,
): string[] {
  const errors: string[] = [];

  if (candidate.dataContext.mode !== "mock" || !candidate.dataContext.mock) {
    errors.push("AI candidates must stay mock-backed for the current builder runtime.");
    return errors;
  }

  if (candidate.dataContext.mock.packId !== request.packId) {
    errors.push(`Expected packId "${request.packId}" but received "${candidate.dataContext.mock.packId}".`);
  }

  if (candidate.dataContext.mock.scenarioId !== request.scenarioId) {
    errors.push(
      `Expected scenarioId "${request.scenarioId}" but received "${candidate.dataContext.mock.scenarioId}".`,
    );
  }

  if (candidate.theme.id !== request.themeId) {
    errors.push(`Expected theme "${request.themeId}" but received "${candidate.theme.id}".`);
  }

  if (candidate.intent.industry !== request.packId) {
    errors.push(`Expected intent.industry "${request.packId}" but received "${candidate.intent.industry}".`);
  }

  if ((candidate.intent.scenario ?? request.scenarioId) !== request.scenarioId) {
    errors.push(
      `Expected intent.scenario "${request.scenarioId}" but received "${candidate.intent.scenario ?? ""}".`,
    );
  }

  if (!getScenarioDefinition(request.packId, request.scenarioId)) {
    errors.push(`The selected scenario ${request.packId}/${request.scenarioId} is not registered.`);
    return errors;
  }

  const datasets = resolveScenarioDatasetMap(candidate.dataContext);
  const datasetIds = new Set(Object.keys(datasets));

  for (const widget of candidate.widgets) {
    if (isDatasetWidgetDataRef(widget.data) && !datasetIds.has(widget.data.datasetId)) {
      errors.push(`Widget "${widget.title}" references unavailable dataset "${widget.data.datasetId}".`);
    }
  }

  try {
    StaticDataAdapter.fromDashboardSpec(candidate);
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "The generated dashboard could not initialize the static data adapter.",
    );
  }

  return errors;
}

function validateCandidate(
  parsedCandidate: unknown,
  request: DashboardGenerationRequest,
): { ok: true; spec: DashboardSpec } | { ok: false; errors: string[] } {
  const hydratedCandidate = canSyncPresenterDraft(parsedCandidate)
    ? syncPresenterDraft(parsedCandidate)
    : parsedCandidate;
  const validated = validateDashboardSpec(hydratedCandidate);

  if (!validated.ok) {
    return {
      ok: false,
      errors: validated.errors,
    };
  }

  const runtimeErrors = validateRuntimeCompatibility(validated.spec, request);

  if (runtimeErrors.length > 0) {
    return {
      ok: false,
      errors: runtimeErrors,
    };
  }

  return {
    ok: true,
    spec: validated.spec,
  };
}

function buildRepairPrompt(
  request: DashboardGenerationRequest,
  invalidResponse: string,
  errors: string[],
) {
  return [
    "Repair the previous DashboardSpec candidate.",
    `Keep packId "${request.packId}", scenarioId "${request.scenarioId}", and theme "${request.themeId}".`,
    "Return one corrected JSON object only.",
    `Validation errors: ${errors.join(" | ")}`,
    "Previous candidate:",
    invalidResponse,
  ].join("\n");
}

export async function generateDashboardSpec({
  client,
  request,
}: {
  client: AiGenerationClient;
  request: DashboardGenerationRequest;
}): Promise<GenerateDashboardSpecResult> {
  let prompt;

  try {
    prompt = buildGenerationPrompt(request);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The AI request could not be grounded in the current DashForge context.";

    return {
      ok: false,
      reason: "request",
      error: message,
      details: [message],
      didRepair: false,
    };
  }

  const initialResult = await client.generate({
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
  });

  if (!initialResult.ok) {
    return {
      ok: false,
      reason: initialResult.reason,
      error: initialResult.error,
      details: [initialResult.error],
      didRepair: false,
      promptTemplate: prompt.promptTemplate,
    };
  }

  const candidateJson = extractJsonCandidate(initialResult.responseText);

  if (!candidateJson) {
    return {
      ok: false,
      reason: "parse",
      error: "The provider response did not contain a JSON object to validate.",
      details: ["Claude returned text, but no JSON object could be extracted."],
      didRepair: false,
      promptTemplate: prompt.promptTemplate,
    };
  }

  try {
    const parsedCandidate = parseCandidateDocument(candidateJson);
    const validatedCandidate = validateCandidate(parsedCandidate, request);

    if (validatedCandidate.ok) {
      return {
        ok: true,
        candidate: validatedCandidate.spec,
        candidateJson,
        didRepair: false,
        model: initialResult.model,
        promptTemplate: prompt.promptTemplate,
      };
    }

    const repairResult = await client.generate({
      systemPrompt: prompt.systemPrompt,
      userPrompt: buildRepairPrompt(request, candidateJson, validatedCandidate.errors),
    });

    if (!repairResult.ok) {
      return {
        ok: false,
        reason: repairResult.reason,
        error: repairResult.error,
        details: validatedCandidate.errors,
        didRepair: true,
        promptTemplate: prompt.promptTemplate,
      };
    }

    const repairedJson = extractJsonCandidate(repairResult.responseText);

    if (!repairedJson) {
      return {
        ok: false,
        reason: "parse",
        error: "The repair pass returned no JSON candidate to validate.",
        details: validatedCandidate.errors,
        didRepair: true,
        promptTemplate: prompt.promptTemplate,
      };
    }

    const repairedCandidate = validateCandidate(parseCandidateDocument(repairedJson), request);

    if (!repairedCandidate.ok) {
      return {
        ok: false,
        reason: "validation",
        error: "The generated DashboardSpec still failed validation after one repair pass.",
        details: repairedCandidate.errors,
        didRepair: true,
        promptTemplate: prompt.promptTemplate,
      };
    }

    return {
      ok: true,
      candidate: repairedCandidate.spec,
      candidateJson: repairedJson,
      didRepair: true,
      model: repairResult.model,
      promptTemplate: prompt.promptTemplate,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "parse",
      error:
        error instanceof Error
          ? error.message
          : "The provider response could not be parsed into JSON.",
      details: ["The generated response was not valid JSON."],
      didRepair: false,
      promptTemplate: prompt.promptTemplate,
    };
  }
}

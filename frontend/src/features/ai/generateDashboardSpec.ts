import { createDashboardDataAdapter } from "../../core/data/createDashboardDataAdapter";
import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import { validateDashboardSpec } from "../../core/spec/dashboardSchema";
import type {
  AiGenerationClient,
  DashboardGenerationRequest,
  GenerateDashboardSpecResult,
} from "./aiTypes";

function validateRuntimeCompatibility(
  candidate: DashboardSpec,
  request: DashboardGenerationRequest,
): string[] {
  const errors: string[] = [];

  if (candidate.theme.id !== request.themeId) {
    errors.push(
      `Expected theme "${request.themeId}" but received "${candidate.theme.id}".`,
    );
  }
  if (candidate.intent.industry !== request.packId) {
    errors.push(
      `Expected intent.industry "${request.packId}" but received "${candidate.intent.industry}".`,
    );
  }
  if ((candidate.intent.scenario ?? request.scenarioId) !== request.scenarioId) {
    errors.push(
      `Expected intent.scenario "${request.scenarioId}" but received "${candidate.intent.scenario ?? ""}".`,
    );
  }

  const adapterResolution = createDashboardDataAdapter(candidate);
  if (!adapterResolution.ok) {
    errors.push(...adapterResolution.errors);
  }

  return errors;
}

export async function generateDashboardSpec({
  client,
  request,
}: {
  client: AiGenerationClient;
  request: DashboardGenerationRequest;
}): Promise<GenerateDashboardSpecResult> {
  const stagedResult = await client.generate();
  if (!stagedResult.ok) {
    return {
      ok: false,
      reason: stagedResult.reason,
      error: stagedResult.error,
      details: [stagedResult.error],
      didRepair: false,
    };
  }

  let parsedCandidate: unknown;
  try {
    parsedCandidate = JSON.parse(stagedResult.responseText) as unknown;
  } catch (error) {
    return {
      ok: false,
      reason: "parse",
      error:
        error instanceof Error
          ? error.message
          : "The staged dashboard manifest is not valid JSON.",
      details: ["The staged dashboard manifest is not valid JSON."],
      didRepair: false,
    };
  }

  const validated = validateDashboardSpec(parsedCandidate);
  if (!validated.ok) {
    return {
      ok: false,
      reason: "validation",
      error: "The staged DashboardSpec failed validation.",
      details: validated.errors,
      didRepair: false,
    };
  }

  const runtimeErrors = validateRuntimeCompatibility(validated.spec, request);
  if (runtimeErrors.length > 0) {
    return {
      ok: false,
      reason: "validation",
      error: "The staged DashboardSpec is not compatible with this builder context.",
      details: runtimeErrors,
      didRepair: false,
    };
  }

  return {
    ok: true,
    candidate: validated.spec,
    candidateJson: JSON.stringify(validated.spec, null, 2),
    didRepair: false,
    model: stagedResult.model,
  };
}

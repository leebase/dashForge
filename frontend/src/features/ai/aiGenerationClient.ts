import {
  validateDashboardGenerationResult,
  type DashboardGenerationResult,
} from "../export/dashboardGenerationResult";
import type {
  AiGenerationClient,
  AiGenerationClientResult,
} from "./aiTypes";

export const STAGED_DASHBOARD_MANIFEST_ELEMENT_ID =
  "dashforge-staged-dashboard-generation-result";

export interface StagedManifestGenerationClientConfig {
  stagedResult?: unknown;
  readStagedResult?: () => unknown;
}

function readStagedResultFromDocument(): unknown {
  if (typeof document === "undefined") {
    return undefined;
  }
  const manifestElement = document.getElementById(
    STAGED_DASHBOARD_MANIFEST_ELEMENT_ID,
  );
  if (!manifestElement?.textContent?.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(manifestElement.textContent);
  } catch {
    return undefined;
  }
}

function resolveStagedResult(
  config: StagedManifestGenerationClientConfig,
): DashboardGenerationResult | undefined {
  const input = config.readStagedResult
    ? config.readStagedResult()
    : config.stagedResult;
  const validation = validateDashboardGenerationResult(input);
  return validation.ok ? validation.result : undefined;
}

export function createStagedManifestGenerationClient(
  config: StagedManifestGenerationClientConfig = {},
): AiGenerationClient {
  const initialInput = config.readStagedResult
    ? config.readStagedResult()
    : config.stagedResult;
  const initialValidation = validateDashboardGenerationResult(initialInput);
  const providerLabel = "Agent-Orch staged manifest";

  return {
    availability: initialValidation.ok
      ? {
          status: "configured",
          providerLabel,
          model: "staged-manifest",
        }
      : {
          status: "unconfigured",
          providerLabel,
          reason:
            initialInput === undefined
              ? "Stage a validated dashboard generation result before opening the builder."
              : initialValidation.errors[0] ??
                "The staged dashboard generation result is invalid.",
        },
    async generate(): Promise<AiGenerationClientResult> {
      const result = resolveStagedResult(config);
      if (!result) {
        return {
          ok: false,
          reason: "unconfigured",
          error:
            "No ready, validated Agent-Orch dashboard generation result is staged.",
        };
      }

      return {
        ok: true,
        model: "staged-manifest",
        requestId: result.runReference,
        responseText: JSON.stringify(result.output.dashboardSpec),
      };
    },
  };
}

export function createDefaultAiGenerationClient(): AiGenerationClient {
  return createStagedManifestGenerationClient({
    readStagedResult: readStagedResultFromDocument,
  });
}

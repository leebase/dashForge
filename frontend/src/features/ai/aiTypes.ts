import type { DashboardSpec } from "../../core/spec/dashboardSpec";

export type AiGenerationMode = "generate_new" | "improve_current";

export interface AiPromptTemplate {
  id: string;
  packId: string;
  scenarioId: string;
  starterTemplateId: string;
  label: string;
  description: string;
  prompt: string;
}

export interface DashboardGenerationRequest {
  mode: AiGenerationMode;
  packId: string;
  scenarioId: string;
  themeId: string;
  prompt: string;
  promptTemplateId?: string;
  currentDraft?: DashboardSpec;
}

export interface BuiltGenerationPrompt {
  mode: AiGenerationMode;
  packId: string;
  scenarioId: string;
  themeId: string;
  systemPrompt: string;
  userPrompt: string;
  starterSpec: DashboardSpec;
  promptTemplate?: AiPromptTemplate;
}

export interface AiGenerationClientRequest {
  systemPrompt: string;
  userPrompt: string;
}

export type AiGenerationClientAvailability =
  | {
      status: "configured";
      providerLabel: string;
      model: string;
    }
  | {
      status: "unconfigured";
      providerLabel: string;
      reason: string;
    };

export type AiGenerationClientResult =
  | {
      ok: true;
      model: string;
      requestId?: string;
      responseText: string;
    }
  | {
      ok: false;
      reason: "unconfigured" | "network" | "response";
      error: string;
    };

export interface AiGenerationClient {
  availability: AiGenerationClientAvailability;
  generate(request: AiGenerationClientRequest): Promise<AiGenerationClientResult>;
}

export type GenerateDashboardSpecResult =
  | {
      ok: true;
      candidate: DashboardSpec;
      candidateJson: string;
      didRepair: boolean;
      model: string;
      promptTemplate?: AiPromptTemplate;
    }
  | {
      ok: false;
      error: string;
      details: string[];
      didRepair: boolean;
      reason:
        | "unconfigured"
        | "request"
        | "parse"
        | "validation"
        | "network"
        | "response";
      promptTemplate?: AiPromptTemplate;
    };

import { listDashboardThemes } from "../../core/theme/themeRegistry";
import {
  CURRENT_DASHBOARD_SPEC_VERSION,
  SUPPORTED_CHART_TYPES,
  SUPPORTED_DASHBOARD_AUDIENCES,
  SUPPORTED_DASHBOARD_INTENT_TYPES,
  type DashboardSpec,
} from "../../core/spec/dashboardSpec";
import { getScenarioDefinition, resolveScenarioDatasetMap } from "../../mock-data/scenarioCatalog";
import { listTemplateCatalog } from "../../mock-data/templateCatalog";
import { STORY_ARC_SECTION_KEYS } from "../presenter/narrativeStore";
import { createFreshDraftForScenario, instantiateTemplateSpec } from "../builder/templateInstantiation";
import type { BuiltGenerationPrompt, DashboardGenerationRequest } from "./aiTypes";
import { getDefaultPromptTemplate, getPromptTemplateById } from "./promptTemplates";

function stringifySpec(spec: DashboardSpec) {
  return JSON.stringify(spec, null, 2);
}

function withSelectedTheme(spec: DashboardSpec, themeId: string): DashboardSpec {
  if (spec.theme.id === themeId) {
    return spec;
  }

  return {
    ...spec,
    theme: {
      ...spec.theme,
      id: themeId,
    },
  };
}

function resolveStarterSpec(request: DashboardGenerationRequest) {
  if (request.mode === "improve_current" && request.currentDraft) {
    return withSelectedTheme(request.currentDraft, request.themeId);
  }

  const promptTemplate = request.promptTemplateId
    ? getPromptTemplateById(request.packId, request.scenarioId, request.promptTemplateId)
    : getDefaultPromptTemplate(request.packId, request.scenarioId);

  if (promptTemplate) {
    return withSelectedTheme(
      instantiateTemplateSpec(promptTemplate.starterTemplateId, {
        scenarioId: request.scenarioId,
      }),
      request.themeId,
    );
  }

  return withSelectedTheme(
    createFreshDraftForScenario(request.packId, request.scenarioId),
    request.themeId,
  );
}

function describeDatasets(starterSpec: DashboardSpec) {
  if (starterSpec.dataContext.mode !== "mock" || !starterSpec.dataContext.mock) {
    throw new Error(
      "AI generation requires a mock-backed dashboard draft so prompt context can stay inside the registered scenario datasets.",
    );
  }

  const datasetMap = resolveScenarioDatasetMap(starterSpec.dataContext);

  return Object.entries(datasetMap).map(([datasetId, rows]) => ({
    datasetId,
    columns: Object.keys(rows[0] ?? {}),
  }));
}

export function buildGenerationPrompt(
  request: DashboardGenerationRequest,
): BuiltGenerationPrompt {
  const scenario = getScenarioDefinition(request.packId, request.scenarioId);

  if (!scenario) {
    throw new Error(
      `AI generation requires a registered mock scenario. Received ${request.packId}/${request.scenarioId || "(missing scenario)"}.`,
    );
  }

  const promptTemplate = request.promptTemplateId
    ? getPromptTemplateById(request.packId, request.scenarioId, request.promptTemplateId)
    : getDefaultPromptTemplate(request.packId, request.scenarioId);
  const starterSpec = resolveStarterSpec(request);
  const scenarioTemplates = listTemplateCatalog({
    packId: request.packId,
    scenarioId: request.scenarioId,
  }).map((template) => ({
    templateId: template.templateId,
    title: template.title,
    intent: template.intent,
    audience: template.audience,
  }));
  const themeOptions = listDashboardThemes().map((theme) => ({
    id: theme.id,
    label: theme.label,
  }));
  const datasets = describeDatasets(starterSpec);

  const systemPrompt = [
    "You are generating a DashForge DashboardSpec JSON document.",
    `Return one valid JSON object only. Do not include markdown fences or commentary.`,
    `The specVersion must be "${CURRENT_DASHBOARD_SPEC_VERSION}".`,
    `Use only these widget chart types: ${SUPPORTED_CHART_TYPES.join(", ")}.`,
    `Use only these dashboard intents: ${SUPPORTED_DASHBOARD_INTENT_TYPES.join(", ")}.`,
    `Use only these dashboard audiences: ${SUPPORTED_DASHBOARD_AUDIENCES.join(", ")}.`,
    `Use only these theme ids: ${themeOptions.map((theme) => theme.id).join(", ")}.`,
    `Use dataContext.mode "mock" and keep packId "${request.packId}" with scenarioId "${request.scenarioId}".`,
    `Narrative storyArc sections must be: ${STORY_ARC_SECTION_KEYS.join(", ")}.`,
    "Keep the output compatible with a React dashboard builder that validates the full JSON schema before apply.",
  ].join("\n");

  const userPrompt = [
    `Generation mode: ${request.mode}.`,
    `Selected pack: ${request.packId}.`,
    `Selected scenario: ${request.scenarioId}.`,
    `Selected theme: ${request.themeId}.`,
    `Scenario title: ${scenario.title}.`,
    `Scenario story: ${scenario.story}`,
    promptTemplate
      ? `Prompt template (${promptTemplate.label}): ${promptTemplate.prompt}`
      : "",
    `Available starter templates: ${JSON.stringify(scenarioTemplates, null, 2)}`,
    `Available datasets and columns: ${JSON.stringify(datasets, null, 2)}`,
    request.mode === "improve_current"
      ? "Improve the current dashboard while preserving its workshop-ready structure."
      : "Create a new dashboard candidate grounded in the selected pack and scenario.",
    `Consultant request: ${request.prompt}`,
    "Start from the following bounded starter spec and keep the result inside this product surface.",
    stringifySpec(starterSpec),
    "Output requirements:",
    "- keep the dashboard mock-backed and use only listed dataset ids",
    "- keep widget references in narrative sections aligned to real widget ids",
    "- keep layout on a 12-column grid with realistic widget positions",
    "- keep the theme id equal to the selected theme id",
    "- include narrative executiveSummary, presenterNotes, and a complete storyArc",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    mode: request.mode,
    packId: request.packId,
    scenarioId: request.scenarioId,
    themeId: request.themeId,
    systemPrompt,
    userPrompt,
    starterSpec,
    promptTemplate: promptTemplate ?? undefined,
  };
}

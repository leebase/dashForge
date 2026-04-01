import {
  getDefaultTemplateForScenario,
  listTemplateCatalog,
} from "../../mock-data/templateCatalog";
import { getScenarioDefinition } from "../../mock-data/scenarioCatalog";
import type { AiPromptTemplate } from "./aiTypes";

function packFocus(packId: string) {
  switch (packId) {
    case "healthcare":
      return "Balance executive outcomes, operational strain, and quality signals.";
    case "financial":
      return "Highlight flows, retention, concentration risk, and advisor performance.";
    case "saas":
      return "Show growth, churn, expansion, and operating pressure in one workshop-ready story.";
    default:
      return "Keep the prototype grounded in the selected mock-data pack.";
  }
}

function intentFocus(intent: string) {
  switch (intent) {
    case "executive_summary":
      return "Open with the top-line signal, then support it with one trend, one risk, and one decision-ready table.";
    case "operational_detail":
      return "Bias toward segment or department detail that an operator can act on during the workshop.";
    case "risk_alert":
      return "Make the pressure point unmistakable and close with the intervention the room should discuss.";
    default:
      return "Keep the layout concise and workshop-ready.";
  }
}

export function listPromptTemplates(query: {
  packId: string;
  scenarioId: string;
}): AiPromptTemplate[] {
  const scenario = getScenarioDefinition(query.packId, query.scenarioId);

  return listTemplateCatalog({
    packId: query.packId,
    scenarioId: query.scenarioId,
  }).map((template) => ({
    id: `prompt.${template.templateId}`,
    packId: query.packId,
    scenarioId: query.scenarioId,
    starterTemplateId: template.templateId,
    label: template.title,
    description: template.description,
    prompt: [
      `Create a ${template.packId} dashboard for ${template.audience} viewers.`,
      template.description,
      scenario
        ? `Use the ${scenario.title} storyline: ${scenario.story}`
        : `Stay inside the ${query.scenarioId} scenario.`,
      packFocus(template.packId),
      intentFocus(template.intent),
      "Return a polished workshop prototype with a full story arc and realistic chart titles.",
    ].join(" "),
  }));
}

export function getDefaultPromptTemplate(
  packId: string,
  scenarioId: string,
): AiPromptTemplate | undefined {
  const defaultTemplate = getDefaultTemplateForScenario(packId, scenarioId);

  if (defaultTemplate) {
    return getPromptTemplateById(
      packId,
      scenarioId,
      `prompt.${defaultTemplate.templateId}`,
    );
  }

  return listPromptTemplates({ packId, scenarioId })[0];
}

export function getPromptTemplateById(
  packId: string,
  scenarioId: string,
  templateId: string,
): AiPromptTemplate | undefined {
  return listPromptTemplates({ packId, scenarioId }).find(
    (template) => template.id === templateId,
  );
}

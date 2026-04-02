import { describe, expect, it } from "vitest";

import {
  getDefaultTemplateForScenario,
  listTemplateCatalog,
  listTemplatesByPack,
  listTemplatesByScenario,
} from "./templateCatalog";
import { listRegisteredScenarios } from "./scenarioCatalog";

describe("templateCatalog", () => {
  it("lists shared templates per pack", () => {
    expect(listTemplatesByPack("healthcare")).toHaveLength(4);
    expect(listTemplatesByPack("financial")).toHaveLength(3);
    expect(listTemplatesByPack("saas")).toHaveLength(3);
  });

  it("filters templates by scenario and returns deterministic defaults", () => {
    const financialTemplate = getDefaultTemplateForScenario(
      "financial",
      "market-downturn",
    );

    expect(financialTemplate).toMatchObject({
      templateId: "tpl.financial.risk-alert",
      packId: "financial",
      intent: "risk_alert",
    });

    const saasTemplates = listTemplatesByScenario("saas", "churn-crisis");
    const saasIds = saasTemplates.map((template) => template.templateId);
    const healthcareTemplates = listTemplatesByScenario(
      "healthcare",
      "ed-throughput-crunch",
    );
    const healthcareIds = healthcareTemplates.map((template) => template.templateId);

    expect(saasIds).toContain("tpl.saas.risk-alert");
    expect(healthcareIds).toContain("tpl.healthcare.ed-throughput-command");
  });

  it("supports intent and audience filtering", () => {
    const execFilters = listTemplateCatalog({
      packId: "saas",
      intent: "executive_summary",
      audience: "executive",
    });

    expect(execFilters).toEqual([
      expect.objectContaining({
        templateId: "tpl.saas.executive-summary",
        packId: "saas",
      }),
    ]);
  });

  it("provides one default template per registered scenario", () => {
    for (const { packId, scenarioId } of listRegisteredScenarios()) {
      const defaultTemplate = getDefaultTemplateForScenario(packId, scenarioId);

      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate?.packId).toBe(packId);
      expect(defaultTemplate?.scenarioIds).toContain(scenarioId);
    }
  });

  it("covers executive and risk intents for financial and SaaS packs", () => {
    const financialTemplates = listTemplatesByPack("financial");
    const saasTemplates = listTemplatesByPack("saas");

    const financialIntents = [
      ...new Set(financialTemplates.map((template) => template.intent)),
    ];
    const saasIntents = [...new Set(saasTemplates.map((template) => template.intent))];

    expect(financialIntents).toEqual(
      expect.arrayContaining([
        "executive_summary",
        "operational_detail",
        "risk_alert",
      ]),
    );
    expect(saasIntents).toEqual(
      expect.arrayContaining([
        "executive_summary",
        "operational_detail",
        "risk_alert",
      ]),
    );
  });
});

import { describe, expect, it } from "vitest";

import { getDefaultPromptTemplate, listPromptTemplates } from "./promptTemplates";

describe("promptTemplates", () => {
  it("builds pack and scenario aware templates from the catalog canon", () => {
    const templates = listPromptTemplates({
      packId: "saas",
      scenarioId: "churn-crisis",
    });

    expect(templates.map((template) => template.id)).toEqual(
      expect.arrayContaining([
        "prompt.tpl.saas.executive-summary",
        "prompt.tpl.saas.risk-alert",
      ]),
    );
    expect(templates[0]?.packId).toBe("saas");
    expect(templates[0]?.scenarioId).toBe("churn-crisis");
    expect(templates[0]?.prompt).toContain("Churn Crisis");
    expect(templates.some((template) => template.prompt.includes("price"))).toBe(true);
  });

  it("returns a deterministic default prompt template for the current pack and scenario", () => {
    expect(getDefaultPromptTemplate("financial", "growth-quarter")).toMatchObject({
      id: "prompt.tpl.financial.executive-summary",
      starterTemplateId: "tpl.financial.executive-summary",
    });

    expect(getDefaultPromptTemplate("saas", "churn-crisis")).toMatchObject({
      id: "prompt.tpl.saas.risk-alert",
      starterTemplateId: "tpl.saas.risk-alert",
    });
  });
});

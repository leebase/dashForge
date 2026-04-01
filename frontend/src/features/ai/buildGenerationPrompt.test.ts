import { describe, expect, it } from "vitest";

import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { buildGenerationPrompt } from "./buildGenerationPrompt";

describe("buildGenerationPrompt", () => {
  it("assembles bounded prompt context for generate-new mode", () => {
    const prompt = buildGenerationPrompt({
      mode: "generate_new",
      packId: "healthcare",
      scenarioId: "flu-season",
      themeId: "dark-executive",
      prompt: "Focus on the surge risk and inpatient bottlenecks.",
    });

    expect(prompt.systemPrompt).toContain("Return one valid JSON object only.");
    expect(prompt.systemPrompt).toContain(
      "kpi, line, bar, stacked_bar, donut, table, sparkline, gauge",
    );
    expect(prompt.userPrompt).toContain("Flu Season Surge");
    expect(prompt.userPrompt).toContain("Available datasets and columns");
    expect(prompt.userPrompt).toContain("Focus on the surge risk and inpatient bottlenecks.");
    expect(prompt.promptTemplate).toMatchObject({
      id: "prompt.tpl.healthcare.risk-alert",
      starterTemplateId: "tpl.healthcare.risk-alert",
    });
    expect(prompt.starterSpec.dataContext.mock).toMatchObject({
      packId: "healthcare",
      scenarioId: "flu-season",
    });
    expect(prompt.starterSpec.theme.id).toBe("dark-executive");
  });

  it("includes the current draft when improving an existing dashboard", () => {
    const currentDraft = createFreshDraftForScenario("saas", "scaling-success");
    currentDraft.meta.title = "Quarterly Expansion Watch";

    const prompt = buildGenerationPrompt({
      mode: "improve_current",
      packId: "saas",
      scenarioId: "scaling-success",
      themeId: currentDraft.theme.id,
      prompt: "Strengthen the retention story.",
      currentDraft,
    });

    expect(prompt.userPrompt).toContain("Improve the current dashboard");
    expect(prompt.userPrompt).toContain("Quarterly Expansion Watch");
    expect(prompt.starterSpec.meta.title).toBe("Quarterly Expansion Watch");
  });
});

import { describe, expect, it } from "vitest";

import { validateDashboardSpec } from "../../core/spec/dashboardSchema";
import {
  createFreshDraftForScenario,
  instantiateTemplateSpec,
} from "./templateInstantiation";

describe("templateInstantiation", () => {
  it("creates a valid starter spec from the shared template catalog", () => {
    const spec = instantiateTemplateSpec("tpl.saas.executive-summary", {
      scenarioId: "scaling-success",
    });

    expect(validateDashboardSpec(spec)).toMatchObject({ ok: true });
    expect(spec.widgets.length).toBeGreaterThan(0);
    expect(spec.narrative?.storyArc.hook.widgetIds.length).toBeGreaterThan(0);
    expect(spec.dataContext.mock).toMatchObject({
      packId: "saas",
      scenarioId: "scaling-success",
    });
  });

  it("builds a fresh default draft for a pack and scenario", () => {
    const draft = createFreshDraftForScenario("financial", "market-downturn");

    expect(draft.meta.title).toMatch(/Financial/i);
    expect(draft.intent.industry).toBe("financial");
    expect(draft.dataContext.mock?.scenarioId).toBe("market-downturn");
  });
});

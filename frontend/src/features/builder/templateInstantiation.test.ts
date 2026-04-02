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

  it("builds the ED throughput command starter from catalog", () => {
    const draft = createFreshDraftForScenario("healthcare", "ed-throughput-crunch");

    expect(draft.meta.title).toBe("ED Throughput Command View");
    expect(draft.intent.industry).toBe("healthcare");
    expect(draft.intent.type).toBe("risk_alert");
    expect(draft.widgets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "kpi_arrivals" }),
      expect.objectContaining({ id: "trend_dtp" }),
      expect.objectContaining({ id: "priority_table" }),
      expect.objectContaining({ id: "experience_consequence" }),
    ]));
    expect(draft.narrative?.storyArc.hook.widgetIds).toContain("kpi_arrivals");
  });
});

import { describe, expect, it } from "vitest";

import { createFreshDraftForScenario } from "./templateInstantiation";
import { exportDashboardSpecJson, importDashboardSpecJson } from "./specIo";

describe("specIo", () => {
  it("exports and re-imports a valid dashboard spec", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    const exported = exportDashboardSpecJson(draft);
    const imported = importDashboardSpecJson(exported);

    expect(imported).toMatchObject({ ok: true });
    if (!imported.ok) {
      throw new Error("Import unexpectedly failed.");
    }
    expect(imported.spec.meta.title).toBe(draft.meta.title);
  });

  it("rejects invalid JSON input", () => {
    const imported = importDashboardSpecJson("{not valid");

    expect(imported).toMatchObject({ ok: false });
    if (imported.ok) {
      throw new Error("Invalid JSON unexpectedly passed.");
    }
    expect(imported.errors[0]).toMatch(/expected/i);
  });

  it("accepts live and hybrid dashboard specs", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    draft.dataContext = {
      ...draft.dataContext,
      mode: "hybrid",
      live: {
        bindings: {
          monthly_summary: {
            type: "rest",
            connection: {
              url: "https://example.test/monthly-summary",
              headers: {
                Authorization: "Bearer local-only",
              },
            },
            fieldMap: {
              month: "periodLabel",
            },
          },
        },
      },
    };

    const imported = importDashboardSpecJson(exportDashboardSpecJson(draft));

    expect(imported).toMatchObject({ ok: true });
    if (!imported.ok) {
      throw new Error("Hybrid import unexpectedly failed.");
    }

    expect(imported.spec.dataContext.mode).toBe("hybrid");
    expect(imported.spec.dataContext.live?.bindings.monthly_summary.connection.url).toBe(
      "https://example.test/monthly-summary",
    );
    expect(imported.spec.dataContext.live?.bindings.monthly_summary.connection.headers).toBe(
      undefined,
    );
  });
});

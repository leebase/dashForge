import { describe, expect, it, vi } from "vitest";

import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { generateDashboardSpec } from "./generateDashboardSpec";

describe("generateDashboardSpec", () => {
  it("returns a validated candidate on the first pass", async () => {
    const candidate = createFreshDraftForScenario("saas", "scaling-success");
    candidate.meta.title = "Expansion Control Tower";
    const client = {
      availability: {
        status: "configured" as const,
        providerLabel: "Claude",
        model: "claude-test",
      },
      generate: vi.fn().mockResolvedValue({
        ok: true as const,
        model: "claude-test",
        responseText: JSON.stringify(candidate),
      }),
    };

    const result = await generateDashboardSpec({
      client,
      request: {
        mode: "generate_new",
        packId: "saas",
        scenarioId: "scaling-success",
        themeId: candidate.theme.id,
        prompt: "Create an executive growth dashboard.",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      didRepair: false,
      model: "claude-test",
    });
    if (result.ok) {
      expect(result.candidate.meta.title).toBe("Expansion Control Tower");
    }
  });

  it("attempts one bounded repair pass when validation fails", async () => {
    const invalidCandidate = createFreshDraftForScenario("saas", "scaling-success");
    invalidCandidate.theme.id = "light-professional";
    const repairedCandidate = createFreshDraftForScenario("saas", "scaling-success");
    repairedCandidate.meta.title = "Retention Repair Deck";

    const client = {
      availability: {
        status: "configured" as const,
        providerLabel: "Claude",
        model: "claude-test",
      },
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          ok: true as const,
          model: "claude-test",
          responseText: JSON.stringify(invalidCandidate),
        })
        .mockResolvedValueOnce({
          ok: true as const,
          model: "claude-test",
          responseText: JSON.stringify(repairedCandidate),
        }),
    };

    const result = await generateDashboardSpec({
      client,
      request: {
        mode: "generate_new",
        packId: "saas",
        scenarioId: "scaling-success",
        themeId: "dark-executive",
        prompt: "Fix the dashboard and keep it executive-ready.",
      },
    });

    expect(client.generate).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      ok: true,
      didRepair: true,
    });
    if (result.ok) {
      expect(result.candidate.meta.title).toBe("Retention Repair Deck");
    }
  });

  it("keeps the draft untouched when an unconfigured client is used", async () => {
    const client = {
      availability: {
        status: "unconfigured" as const,
        providerLabel: "Claude",
        reason: "Missing key",
      },
      generate: vi.fn().mockResolvedValue({
        ok: false as const,
        reason: "unconfigured",
        error: "Missing key",
      }),
    };

    const result = await generateDashboardSpec({
      client,
      request: {
        mode: "generate_new",
        packId: "financial",
        scenarioId: "growth-quarter",
        themeId: "dark-executive",
        prompt: "Create a growth dashboard.",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "unconfigured",
      didRepair: false,
    });
  });

  it("fails cleanly when improve-current is asked to use a non-mock draft", async () => {
    const currentDraft = createFreshDraftForScenario("saas", "scaling-success");
    const client = {
      availability: {
        status: "configured" as const,
        providerLabel: "Claude",
        model: "claude-test",
      },
      generate: vi.fn(),
    };

    currentDraft.dataContext = {
      mode: "live",
      live: {
        bindings: {},
      },
      timeRange: currentDraft.dataContext.timeRange,
    };

    const result = await generateDashboardSpec({
      client,
      request: {
        mode: "improve_current",
        packId: "saas",
        scenarioId: "scaling-success",
        themeId: currentDraft.theme.id,
        prompt: "Tighten the renewal story.",
        currentDraft,
      },
    });

    expect(client.generate).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: false,
      reason: "request",
      didRepair: false,
    });
    if (!result.ok) {
      expect(result.error).toContain("mock-backed dashboard draft");
    }
  });
});

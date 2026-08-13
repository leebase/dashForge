import { describe, expect, it, vi } from "vitest";

import { createDefaultStandaloneDashboardSpec } from "../runtime/standaloneDashboard";
import { generateDashboardSpec } from "./generateDashboardSpec";

function stagedRequest(themeId: string) {
  return {
    mode: "improve_current" as const,
    packId: "snowflakeCost",
    scenarioId: "idle-warehouse-waste",
    themeId,
    prompt: "Load the validated Agent-Orch staged candidate.",
  };
}

describe("generateDashboardSpec", () => {
  it("returns a validated artifact-backed staged candidate", async () => {
    const candidate = createDefaultStandaloneDashboardSpec();
    const client = {
      availability: {
        status: "configured" as const,
        providerLabel: "Agent-Orch staged manifest",
        model: "staged-manifest",
      },
      generate: vi.fn().mockResolvedValue({
        ok: true as const,
        model: "staged-manifest",
        responseText: JSON.stringify(candidate),
      }),
    };

    const result = await generateDashboardSpec({
      client,
      request: stagedRequest(candidate.theme.id),
    });

    expect(client.generate).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      ok: true,
      didRepair: false,
      model: "staged-manifest",
    });
    if (result.ok) {
      expect(result.candidate.dataContext).toMatchObject({ mode: "artifact" });
    }
  });

  it("blocks an incompatible candidate without a browser repair pass", async () => {
    const candidate = createDefaultStandaloneDashboardSpec();
    const client = {
      availability: {
        status: "configured" as const,
        providerLabel: "Agent-Orch staged manifest",
        model: "staged-manifest",
      },
      generate: vi.fn().mockResolvedValue({
        ok: true as const,
        model: "staged-manifest",
        responseText: JSON.stringify(candidate),
      }),
    };

    const result = await generateDashboardSpec({
      client,
      request: stagedRequest(
        candidate.theme.id === "dark-executive"
          ? "light-professional"
          : "dark-executive",
      ),
    });

    expect(client.generate).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      ok: false,
      reason: "validation",
      didRepair: false,
    });
  });

  it("keeps the draft untouched when no staged result exists", async () => {
    const candidate = createDefaultStandaloneDashboardSpec();
    const client = {
      availability: {
        status: "unconfigured" as const,
        providerLabel: "Agent-Orch staged manifest",
        reason: "No ready manifest is staged.",
      },
      generate: vi.fn().mockResolvedValue({
        ok: false as const,
        reason: "unconfigured" as const,
        error: "No ready manifest is staged.",
      }),
    };

    const result = await generateDashboardSpec({
      client,
      request: stagedRequest(candidate.theme.id),
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "unconfigured",
      didRepair: false,
    });
  });

  it("fails closed when staged response JSON is malformed", async () => {
    const candidate = createDefaultStandaloneDashboardSpec();
    const client = {
      availability: {
        status: "configured" as const,
        providerLabel: "Agent-Orch staged manifest",
        model: "staged-manifest",
      },
      generate: vi.fn().mockResolvedValue({
        ok: true as const,
        model: "staged-manifest",
        responseText: "not json",
      }),
    };

    const result = await generateDashboardSpec({
      client,
      request: stagedRequest(candidate.theme.id),
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "parse",
      didRepair: false,
    });
  });
});

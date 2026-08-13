import { afterEach, describe, expect, it } from "vitest";

import {
  createDashboardGenerationResult,
  type DashboardGenerationResult,
} from "../export/dashboardGenerationResult";
import { createDefaultStandaloneDashboardSpec } from "../runtime/standaloneDashboard";
import {
  STAGED_DASHBOARD_MANIFEST_ELEMENT_ID,
  createDefaultAiGenerationClient,
  createStagedManifestGenerationClient,
} from "./aiGenerationClient";

afterEach(() => {
  document.getElementById(STAGED_DASHBOARD_MANIFEST_ELEMENT_ID)?.remove();
});

describe("aiGenerationClient", () => {
  it("fails closed when no governed result is staged", async () => {
    const client = createDefaultAiGenerationClient();

    expect(client.availability).toMatchObject({
      status: "unconfigured",
      providerLabel: "Agent-Orch staged manifest",
    });
    await expect(client.generate()).resolves.toMatchObject({
      ok: false,
      reason: "unconfigured",
    });
  });

  it("returns only a ready deterministic staged DashboardSpec", async () => {
    const spec = createDefaultStandaloneDashboardSpec();
    const stagedResult = createDashboardGenerationResult(spec, {
      runReference: "fixture-dashforge-iww-9101",
      generatedAt: "2026-08-09T00:00:00.000Z",
    });
    const client = createStagedManifestGenerationClient({ stagedResult });

    expect(client.availability).toEqual({
      status: "configured",
      providerLabel: "Agent-Orch staged manifest",
      model: "staged-manifest",
    });
    await expect(client.generate()).resolves.toMatchObject({
      ok: true,
      model: "staged-manifest",
      requestId: "fixture-dashforge-iww-9101",
      responseText: JSON.stringify(spec),
    });
  });

  it("rejects a staged result whose readiness was altered", async () => {
    const spec = createDefaultStandaloneDashboardSpec();
    const stagedResult = createDashboardGenerationResult(spec, {
      runReference: "fixture-dashforge-iww-9101",
      generatedAt: "2026-08-09T00:00:00.000Z",
    });
    const alteredResult: DashboardGenerationResult = {
      ...stagedResult,
      validation: {
        ...stagedResult.validation,
        materialClaimCount: stagedResult.validation.materialClaimCount + 1,
      },
    };
    const client = createStagedManifestGenerationClient({
      stagedResult: alteredResult,
    });

    expect(client.availability.status).toBe("unconfigured");
    await expect(client.generate()).resolves.toMatchObject({
      ok: false,
      reason: "unconfigured",
    });
  });

  it("reads a validated result from the inert staging element", async () => {
    const spec = createDefaultStandaloneDashboardSpec();
    const stagedResult = createDashboardGenerationResult(spec, {
      runReference: "fixture-dashforge-iww-9101",
      generatedAt: "2026-08-09T00:00:00.000Z",
    });
    const manifestElement = document.createElement("script");
    manifestElement.id = STAGED_DASHBOARD_MANIFEST_ELEMENT_ID;
    manifestElement.type = "application/json";
    manifestElement.textContent = JSON.stringify(stagedResult);
    document.body.append(manifestElement);

    const client = createDefaultAiGenerationClient();

    expect(client.availability.status).toBe("configured");
    await expect(client.generate()).resolves.toMatchObject({ ok: true });
  });
});

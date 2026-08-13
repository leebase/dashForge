import { describe, expect, it } from "vitest";

import { createDefaultStandaloneDashboardSpec } from "../runtime/standaloneDashboard";
import { createMeetingDashboardPackageParts } from "./meetingDashboardPackage";

const controlledDashboardDocument = `<!doctype html><html><body><main data-demo="idle-warehouse-waste" data-quality-state="controlled"><section data-testid="synthetic-quality-disclosure">Synthetic demo data</section><p class="standalone-claim-source">sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390 · dataset observation executive_summary</p></main></body></html>`;
const successfulBrowserSmoke = {
  smoke_type: "browser",
  app_started: true,
  page_loaded: true,
  interaction_succeeded: true,
  success_observed: true,
  blocking_errors: [],
  observed_text: "Controlled synthetic-data quality",
};

function buildPackage(browserSmokeResult: unknown = successfulBrowserSmoke) {
  return createMeetingDashboardPackageParts({
    spec: createDefaultStandaloneDashboardSpec(),
    dashboardDocument: controlledDashboardDocument,
    browserSmokeResult,
    runReference: "fixture-dashforge-iww-9101",
    generatedAt: "2026-08-09T00:00:00.000Z",
  });
}

describe("meeting-dashboard-package/1.0 export seam", () => {
  it("materializes every required deterministic package part", () => {
    const result = buildPackage();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.errors.join("; "));
    }
    expect(Object.keys(result.files).sort()).toEqual([
      "binding-map.json",
      "browser-smoke-result.json",
      "claim-ledger.json",
      "dashboard-generation-result.json",
      "dashboard.html",
      "dashboard.spec.json",
    ]);
    expect(result.files["dashboard.html"]).toBe(controlledDashboardDocument);

    const generationResult = JSON.parse(
      result.files["dashboard-generation-result.json"],
    ) as {
      status: string;
      inputReference: { artifactDigest: string };
      output: { artifactType: string; payloadSchemaVersion: string };
    };
    const bindingMap = JSON.parse(result.files["binding-map.json"]) as {
      upstreamArtifactDigest: string;
    };
    const claimLedger = JSON.parse(result.files["claim-ledger.json"]) as {
      upstreamArtifactDigest: string;
      claims: unknown[];
    };

    expect(generationResult).toMatchObject({
      status: "ready",
      output: {
        artifactType: "meeting-dashboard-package",
        payloadSchemaVersion: "meeting-dashboard-package/1.0",
      },
    });
    expect(bindingMap.upstreamArtifactDigest).toBe(
      generationResult.inputReference.artifactDigest,
    );
    expect(claimLedger.upstreamArtifactDigest).toBe(
      generationResult.inputReference.artifactDigest,
    );
    expect(claimLedger.claims.length).toBeGreaterThan(0);
  });

  it("blocks package readiness when browser smoke did not succeed", () => {
    const result = buildPackage({
      ...successfulBrowserSmoke,
      interaction_succeeded: false,
      success_observed: false,
      blocking_errors: ["Export interaction did not complete."],
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "Browser smoke interaction did not succeed.",
        "Browser smoke did not observe the required success state.",
        "Export interaction did not complete.",
      ]),
    });
  });

  it("blocks a malformed browser-smoke record", () => {
    const result = buildPackage({ smoke_type: "browser" });

    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/Browser smoke/i);
    }
  });

  it("blocks HTML that omits the visible quality disclosure", () => {
    const result = createMeetingDashboardPackageParts({
      spec: createDefaultStandaloneDashboardSpec(),
      dashboardDocument:
        '<main data-demo="idle-warehouse-waste" data-quality-state="controlled">Synthetic demo data <p class="standalone-claim-source">sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390 · dataset observation executive_summary</p></main>',
      browserSmokeResult: successfulBrowserSmoke,
      runReference: "fixture-dashforge-iww-9101",
      generatedAt: "2026-08-09T00:00:00.000Z",
    });

    expect(result).toMatchObject({
      ok: false,
      errors: [
        "Standalone dashboard HTML does not contain the quality disclosure.",
      ],
    });
  });
});

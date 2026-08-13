import { describe, expect, it } from "vitest";

import { createDefaultStandaloneDashboardSpec } from "../runtime/standaloneDashboard";
import {
  createDashboardGenerationResult,
  stableJsonStringify,
  validateDashboardGenerationResult,
} from "./dashboardGenerationResult";

const generationOptions = {
  runReference: "fixture-dashforge-iww-9101",
  generatedAt: "2026-08-09T00:00:00.000Z",
};

describe("dashboard-generation-result/1.0", () => {
  it("is deterministic and ready for canonical platform wrapping", () => {
    const first = createDashboardGenerationResult(
      createDefaultStandaloneDashboardSpec(),
      generationOptions,
    );
    const second = createDashboardGenerationResult(
      createDefaultStandaloneDashboardSpec(),
      generationOptions,
    );

    expect(stableJsonStringify(first)).toBe(stableJsonStringify(second));
    expect(first).toMatchObject({
      schemaVersion: "dashboard-generation-result/1.0",
      employeeId: "client-meeting-dashboard-builder",
      status: "ready",
      inputReference: {
        artifactType: "synthetic-data-work-package",
        payloadSchemaVersion: "synthetic-data-work-package/1.0",
        artifactDigest:
          "sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390",
      },
      output: {
        artifactType: "meeting-dashboard-package",
        payloadSchemaVersion: "meeting-dashboard-package/1.0",
      },
      validation: {
        dashboardSpec: "passed",
        artifactBindings: "passed",
        claimCoverage: "passed",
      },
      errors: [],
    });
    expect(validateDashboardGenerationResult(first)).toMatchObject({
      ok: true,
    });
  });

  it("blocks output when a material claim is missing", () => {
    const spec = createDefaultStandaloneDashboardSpec();
    if (!spec.governance) {
      throw new Error("Fixture claim ledger is missing.");
    }
    spec.governance.claimLedger.claims =
      spec.governance.claimLedger.claims.filter(
        (claim) => claim.surfaceId !== "narrative:hook",
      );

    const result = createDashboardGenerationResult(spec, generationOptions);

    expect(result).toMatchObject({
      status: "blocked",
      validation: { claimCoverage: "blocked" },
      errors: expect.arrayContaining([
        'Material surface "narrative:hook" has no source claim.',
      ]),
    });
  });

  it("rejects a ready result when deterministic fields are altered", () => {
    const result = createDashboardGenerationResult(
      createDefaultStandaloneDashboardSpec(),
      generationOptions,
    );
    const altered = {
      ...result,
      validation: {
        ...result.validation,
        materialClaimCount: result.validation.materialClaimCount + 1,
      },
    };

    expect(validateDashboardGenerationResult(altered)).toMatchObject({
      ok: false,
      errors: [
        "The staged dashboard generation result does not match deterministic validation output.",
      ],
    });
  });
});

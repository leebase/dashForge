import { describe, expect, it, vi } from "vitest";

import { loadIdleWarehousePresentation } from "../../features/runtime/idleWarehousePresentation";
import { createDefaultStandaloneDashboardSpec } from "../../features/runtime/standaloneDashboard";
import type { DashboardSpec } from "../spec/dashboardSpec";
import {
  createSyntheticDataArtifactAdapter,
  validateMaterialClaimCoverage,
  type VerifiedSyntheticDataArtifact,
} from "./SyntheticDataArtifactAdapter";
import { idleWarehouseVerifiedSyntheticDataArtifact } from "./verifiedSyntheticDataArtifacts";

function cloneArtifact(): VerifiedSyntheticDataArtifact {
  return structuredClone(idleWarehouseVerifiedSyntheticDataArtifact);
}

function cloneSpec(): DashboardSpec {
  return structuredClone(createDefaultStandaloneDashboardSpec());
}

describe("SyntheticDataArtifactAdapter", () => {
  it("resolves explicitly bound snapshot datasets and exposes controlled quality", async () => {
    const spec = cloneSpec();
    const result = createSyntheticDataArtifactAdapter(spec, cloneArtifact());

    expect(result).toMatchObject({
      ok: true,
      datasetIds: [
        "executive_summary",
        "recommendation_queue",
        "show_warehouses",
        "warehouse_metering_history",
      ],
      disclosure: {
        qualityState: "controlled",
        qualityStatus: "passed",
        summary:
          "5 requested · 5 injected · 5 independently detected · 0 unexpected",
        limitations: expect.arrayContaining([
          expect.stringMatching(/approved curated pack and scenario/i),
        ]),
      },
    });
    if (!result.ok) {
      throw new Error(result.errors.join("; "));
    }

    await expect(
      result.adapter.query({
        datasetId: "executive_summary",
        filters: [
          {
            field: "metricId",
            operator: "eq",
            value: "monthly-opportunity-high",
          },
        ],
      }),
    ).resolves.toMatchObject({
      rows: [expect.objectContaining({ value: 726 })],
    });
  });

  it.each([
    ["artifact type", "artifactType", "wrong-work-package"],
    ["payload schema", "payloadSchemaVersion", "synthetic-data-work-package/0.1"],
  ])("fails closed on the wrong %s", (_label, field, value) => {
    const artifact = cloneArtifact();
    Object.assign(artifact, { [field]: value });

    const result = createSyntheticDataArtifactAdapter(cloneSpec(), artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/type\/schema|payload schema|input type/i);
      expect(result.disclosure.qualityState).toBe("blocking");
    }
  });

  it("fails closed when the trusted digest differs from the manifest", () => {
    const artifact = cloneArtifact();
    artifact.verifiedDigest = `sha256:${"a".repeat(64)}`;

    const result = createSyntheticDataArtifactAdapter(cloneSpec(), artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Trusted artifact digest does not match the dashboard manifest digest.",
      );
    }
  });

  it("fails closed when a declared snapshot dataset is missing", () => {
    const artifact = cloneArtifact();
    artifact.snapshot.datasets = artifact.snapshot.datasets.filter(
      (dataset) => dataset.datasetId !== "show_warehouses",
    );

    const result = createSyntheticDataArtifactAdapter(cloneSpec(), artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toContain(
        'Declared snapshot dataset "show_warehouses" is missing.',
      );
    }
  });

  it("fails closed when a mapped source field is absent from the snapshot", () => {
    const artifact = cloneArtifact();
    const dataset = artifact.snapshot.datasets.find(
      (candidate) => candidate.datasetId === "recommendation_queue",
    );
    if (!dataset) {
      throw new Error("Fixture recommendation_queue dataset is missing.");
    }
    dataset.columns = dataset.columns.filter(
      (column) => column.name !== "recommended_action",
    );

    const result = createSyntheticDataArtifactAdapter(cloneSpec(), artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toContain(
        'missing field "recommended_action"',
      );
    }
  });

  it("fails closed when a binding targets an undeclared dataset", () => {
    const spec = cloneSpec();
    const artifactContext = spec.dataContext.artifact;
    if (!artifactContext) {
      throw new Error("Fixture artifact context is missing.");
    }
    artifactContext.bindings.executive_summary.snapshotDatasetId =
      "private_dataset";

    const result = createSyntheticDataArtifactAdapter(spec, cloneArtifact());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toContain(
        'targets undeclared snapshot dataset "private_dataset"',
      );
    }
  });

  it("fails closed and discloses a blocking upstream quality state", () => {
    const artifact = cloneArtifact();
    artifact.qualityReport.status = "blocked";

    const result = createSyntheticDataArtifactAdapter(cloneSpec(), artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Upstream synthetic-data quality state is blocking.",
      );
      expect(result.disclosure).toMatchObject({
        qualityState: "blocking",
        qualityStatus: "blocked",
      });
    }
  });

  it("blocks when the DataForge report contains a failed story assertion", () => {
    const artifact = cloneArtifact();
    artifact.qualityReport.story_assertions[0].passed = false;
    artifact.qualityReport.summary.story_assertions_passed -= 1;

    const result = createSyntheticDataArtifactAdapter(cloneSpec(), artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Upstream story assertions did not all pass.",
      );
      expect(result.disclosure.qualityState).toBe("blocking");
    }
  });

  it("blocks readiness when any material surface loses its source claim", () => {
    const spec = cloneSpec();
    if (!spec.governance) {
      throw new Error("Fixture claim ledger is missing.");
    }
    spec.governance.claimLedger.claims =
      spec.governance.claimLedger.claims.filter(
        (claim) => claim.surfaceId !== "widget:kpi_monthly_opportunity",
      );

    expect(validateMaterialClaimCoverage(spec)).toMatchObject({
      ok: false,
      errors: [
        'Material surface "widget:kpi_monthly_opportunity" has no source claim.',
      ],
    });
    expect(
      createSyntheticDataArtifactAdapter(spec, cloneArtifact()).ok,
    ).toBe(false);
  });

  it("routes every standalone buyer-evidence dataset through DataAdapter.query", async () => {
    const spec = cloneSpec();
    const result = createSyntheticDataArtifactAdapter(spec, cloneArtifact());
    if (!result.ok) {
      throw new Error(result.errors.join("; "));
    }
    const querySpy = vi.spyOn(result.adapter, "query");

    const presentation = await loadIdleWarehousePresentation(
      result.adapter,
      spec,
    );

    expect(
      querySpy.mock.calls.map(([request]) => request.datasetId).sort(),
    ).toEqual([
      "executive_summary",
      "recommendation_queue",
      "show_warehouses",
      "warehouse_metering_history",
    ]);
    expect(presentation).toMatchObject({
      opportunityHigh: 726,
      idleWarehouseCount: 2,
      recommendations: expect.arrayContaining([
        expect.objectContaining({ recommendation_id: "IWW-001" }),
      ]),
    });
  });
});

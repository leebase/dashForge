import { describe, expect, it } from "vitest";

import {
  getPrimaryTrendDatasetIdByScenario,
  getPrimaryTrendDatasetId,
  listRegisteredScenarios,
  resolveScenarioDatasetMap,
} from "./scenarioCatalog";

describe("scenarioCatalog", () => {
  it("registers the full canon scenario set", () => {
    expect(listRegisteredScenarios()).toEqual([
      { packId: "healthcare", scenarioId: "flu-season" },
      { packId: "healthcare", scenarioId: "quality-improvement" },
      { packId: "healthcare", scenarioId: "cost-pressure" },
      { packId: "healthcare", scenarioId: "ed-throughput-crunch" },
      { packId: "financial", scenarioId: "market-downturn" },
      { packId: "financial", scenarioId: "advisor-attrition" },
      { packId: "financial", scenarioId: "growth-quarter" },
      { packId: "saas", scenarioId: "churn-crisis" },
      { packId: "saas", scenarioId: "product-led-growth" },
      { packId: "saas", scenarioId: "scaling-success" },
    ]);
  });

  it("keeps registered scenario keys unique per pack", () => {
    const scenarios = listRegisteredScenarios();
    const keys = scenarios.map(
      (scenario) => `${scenario.packId}:${scenario.scenarioId}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("resolves preview datasets for every canonical scenario", () => {
    for (const [packId, scenarioId] of [
      ["healthcare", "flu-season"],
      ["healthcare", "quality-improvement"],
      ["healthcare", "cost-pressure"],
      ["healthcare", "ed-throughput-crunch"],
      ["financial", "market-downturn"],
      ["financial", "advisor-attrition"],
      ["financial", "growth-quarter"],
      ["saas", "churn-crisis"],
      ["saas", "product-led-growth"],
      ["saas", "scaling-success"],
    ] as const) {
      const datasets = resolveScenarioDatasetMap({
        mode: "mock",
        mock: {
          packId,
          scenarioId,
          seed: 2048,
        },
        timeRange: {
          start: "2025-01-01",
          end: "2025-12-31",
          granularity: "month",
        },
      });

      expect(Object.keys(datasets)).toEqual(
        expect.arrayContaining([
          packId === "healthcare" && scenarioId === "ed-throughput-crunch"
            ? "monthly_metrics"
            : "executive_summary",
        ]),
      );
      const benchmarkDataset =
        packId === "healthcare" && scenarioId === "ed-throughput-crunch"
          ? "monthly_metrics"
          : "executive_summary";

      expect(datasets[benchmarkDataset]?.length).toBeGreaterThanOrEqual(5);
      const primaryTrendDataset = getPrimaryTrendDatasetIdByScenario(
        packId,
        scenarioId,
      );

      expect(datasets[primaryTrendDataset]?.length).toBeGreaterThan(0);
    }
  });

  it("includes full non-healthcare scenario coverage", () => {
    const financialAndSaas = listRegisteredScenarios().filter(
      (scenario) => scenario.packId !== "healthcare",
    );

    expect(financialAndSaas).toEqual(
      expect.arrayContaining([
        { packId: "financial", scenarioId: "market-downturn" },
        { packId: "financial", scenarioId: "advisor-attrition" },
        { packId: "financial", scenarioId: "growth-quarter" },
        { packId: "saas", scenarioId: "churn-crisis" },
        { packId: "saas", scenarioId: "product-led-growth" },
        { packId: "saas", scenarioId: "scaling-success" },
      ]),
    );
  });

  it("contains dedicated financial and saas scenario datasets", () => {
    const financial = resolveScenarioDatasetMap({
      mode: "mock",
      mock: {
        packId: "financial",
        scenarioId: "growth-quarter",
        seed: 3101,
      },
      timeRange: {
        start: "2025-01-01",
        end: "2025-12-31",
        granularity: "month",
      },
    });

    const saas = resolveScenarioDatasetMap({
      mode: "mock",
      mock: {
        packId: "saas",
        scenarioId: "churn-crisis",
        seed: 3101,
      },
      timeRange: {
        start: "2025-01-01",
        end: "2025-12-31",
        granularity: "month",
      },
    });

    expect(Object.keys(financial)).toEqual(
      expect.arrayContaining(["monthly_summary", "advisor_concentration"]),
    );
    expect(Object.keys(saas)).toEqual(
      expect.arrayContaining(["monthly_summary", "segment_engagement"]),
    );
  });

  it("exposes one primary trend dataset id per pack", () => {
    expect(getPrimaryTrendDatasetId("healthcare")).toBe("monthly_capacity");
    expect(getPrimaryTrendDatasetId("financial")).toBe("monthly_summary");
    expect(getPrimaryTrendDatasetId("saas")).toBe("monthly_summary");
  });
});

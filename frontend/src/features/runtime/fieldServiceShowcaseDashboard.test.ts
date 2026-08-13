import { describe, expect, it } from "vitest";

import { createDashboardDataAdapter } from "../../core/data/createDashboardDataAdapter";
import { validateMaterialClaimCoverage } from "../../core/data/SyntheticDataArtifactAdapter";
import { validateDashboardSpec } from "../../core/spec/dashboardSchema";
import { createFieldServiceShowcaseDashboardSpec } from "./fieldServiceShowcaseDashboard";

describe("field service showcase dashboard", () => {
  it("builds a valid artifact-backed dashboard with five KPIs and three graphs", () => {
    const spec = createFieldServiceShowcaseDashboardSpec();
    const chartCounts = spec.widgets.reduce<Record<string, number>>(
      (counts, widget) => ({
        ...counts,
        [widget.chart.type]: (counts[widget.chart.type] ?? 0) + 1,
      }),
      {},
    );

    expect(validateDashboardSpec(spec)).toMatchObject({ ok: true });
    expect(validateMaterialClaimCoverage(spec)).toEqual({ ok: true, errors: [] });
    expect(spec.meta.title).toBe("First Heat Wave: Parts, Not People");
    expect(chartCounts).toMatchObject({ kpi: 5, line: 1, bar: 1, stacked_bar: 1 });
    expect(spec.widgets).toHaveLength(8);
  });

  it("resolves the verified DataForge artifact and its decision metrics", async () => {
    const resolution = createDashboardDataAdapter(
      createFieldServiceShowcaseDashboardSpec(),
    );

    expect(resolution).toMatchObject({
      ok: true,
      mode: "artifact",
      artifact: {
        qualityState: "controlled",
        qualityStatus: "passed",
        summary:
          "0 requested · 0 injected · 0 independently detected · 0 unexpected",
      },
    });
    if (!resolution.ok) {
      throw new Error(resolution.errors.join("; "));
    }
    expect(
      resolution.datasets.map(({ datasetId, source, status }) => ({
        datasetId,
        source,
        status,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          datasetId: "executive_summary",
          source: "artifact",
          status: "ready",
        },
        {
          datasetId: "branch_performance",
          source: "artifact",
          status: "ready",
        },
        {
          datasetId: "callback_causes",
          source: "artifact",
          status: "ready",
        },
      ]),
    );


    const kpis = await resolution.adapter.query({
      datasetId: "executive_summary",
      columns: ["metricId", "value", "delta"],
    });
    const metricById = new Map(
      kpis.rows.map((row) => [row.metricId, row]),
    );

    expect(metricById.get("first-time-fix-rate")).toMatchObject({
      value: 75.2,
      delta: -8.8,
    });
    expect(metricById.get("repeat-truck-roll-rate")).toMatchObject({
      value: 18.2,
      delta: 7.7,
    });
    expect(metricById.get("contribution-margin-per-order")).toMatchObject({
      value: 177.3,
      delta: -18.6,
    });
  });
});

import { describe, expect, it } from "vitest";

import { sampleDashboard } from "../../sample/sampleDashboard";
import { StaticDataAdapter } from "./StaticDataAdapter";

describe("StaticDataAdapter", () => {
  it("queries and aggregates scenario-backed datasets", async () => {
    const adapter = StaticDataAdapter.fromDashboardSpec(sampleDashboard);

    await expect(
      adapter.query({
        datasetId: "executive_summary",
        filters: [
          {
            field: "metricId",
            operator: "eq",
            value: "mrr",
          },
        ],
        limit: 1,
      }),
    ).resolves.toMatchObject({
      totalCount: 1,
      rows: [
        {
          metricId: "mrr",
          value: 22.8,
          prefix: "$",
          suffix: "M",
        },
      ],
    });

    await expect(
      adapter.aggregate({
        datasetId: "monthly_summary",
        groupBy: ["month"],
        metrics: [
          {
            field: "mrr",
            aggregate: "avg",
            alias: "mrr",
          },
        ],
        limit: 2,
      }),
    ).resolves.toMatchObject({
      rows: [
        { month: "Jan", mrr: 22.8 },
        { month: "Feb", mrr: 23.2 },
      ],
    });
  });

  it("raises a clear error when a dataset reference is invalid", async () => {
    const adapter = StaticDataAdapter.fromDashboardSpec(sampleDashboard);

    await expect(
      adapter.query({
        datasetId: "missing_dataset",
      }),
    ).rejects.toThrow(/not available/i);
  });
});

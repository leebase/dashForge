import { describe, expect, it, vi } from "vitest";

import { sampleDashboard } from "../../sample/sampleDashboard";
import { createDashboardDataAdapter } from "./createDashboardDataAdapter";

describe("createDashboardDataAdapter", () => {
  it("resolves the static adapter for mock dashboards", async () => {
    const result = createDashboardDataAdapter(sampleDashboard);

    expect(result).toMatchObject({
      ok: true,
      mode: "mock",
    });
    if (!result.ok) {
      throw new Error("Mock adapter resolution unexpectedly failed.");
    }

    await expect(
      result.adapter.query({
        datasetId: "executive_summary",
        filters: [{ field: "metricId", operator: "eq", value: "mrr" }],
        limit: 1,
      }),
    ).resolves.toMatchObject({
      rows: [expect.objectContaining({ metricId: "mrr" })],
    });
  });

  it("fails clearly when live dashboards are missing required bindings", () => {
    const result = createDashboardDataAdapter({
      ...sampleDashboard,
      dataContext: {
        ...sampleDashboard.dataContext,
        mode: "live",
        mock: undefined,
        live: {
          bindings: {
            executive_summary: {
              type: "rest",
              connection: {
                url: "https://example.test/executive-summary",
              },
              fieldMap: {},
            },
          },
        },
      },
    });

    expect(result).toMatchObject({
      ok: false,
      mode: "live",
    });
    if (result.ok) {
      throw new Error("Live adapter resolution unexpectedly passed.");
    }

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/monthly_summary/i),
        expect.stringMatching(/segment_engagement/i),
      ]),
    );
  });

  it("composes live and mock datasets in hybrid mode", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [
        { periodLabel: "Jan", annualRevenue: 120, mrr: 10 },
        { periodLabel: "Feb", annualRevenue: 140, mrr: 12 },
      ],
    });
    const result = createDashboardDataAdapter(
      {
        ...sampleDashboard,
        dataContext: {
          ...sampleDashboard.dataContext,
          mode: "hybrid",
          live: {
            bindings: {
              monthly_summary: {
                type: "rest",
                connection: {
                  url: "https://example.test/monthly-summary",
                },
              fieldMap: {
                month: "periodLabel",
                arr: "annualRevenue",
                mrr: "mrr",
                supportTickets: "supportTickets",
              },
            },
          },
        },
        },
      },
      { fetcher },
    );

    expect(result).toMatchObject({
      ok: true,
      mode: "hybrid",
      datasets: expect.arrayContaining([
        expect.objectContaining({
          datasetId: "monthly_summary",
          source: "live",
          status: "ready",
        }),
        expect.objectContaining({
          datasetId: "executive_summary",
          source: "mock",
          status: "fallback",
        }),
      ]),
    });
    if (!result.ok) {
      throw new Error("Hybrid adapter resolution unexpectedly failed.");
    }

    await expect(
      result.adapter.query({
        datasetId: "monthly_summary",
        columns: ["month", "arr"],
      }),
    ).resolves.toEqual({
      columns: ["month", "arr"],
      rows: [
        { month: "Jan", arr: 120 },
        { month: "Feb", arr: 140 },
      ],
      totalCount: 2,
    });

    await expect(
      result.adapter.query({
        datasetId: "executive_summary",
        filters: [{ field: "metricId", operator: "eq", value: "mrr" }],
        limit: 1,
      }),
    ).resolves.toMatchObject({
      rows: [expect.objectContaining({ metricId: "mrr" })],
    });
  });

  it("rejects renamed live bindings that do not map every required dashboard field", () => {
    const result = createDashboardDataAdapter({
      ...sampleDashboard,
      dataContext: {
        ...sampleDashboard.dataContext,
        mode: "hybrid",
        live: {
          bindings: {
            monthly_summary: {
              type: "rest",
              connection: {
                url: "https://example.test/monthly-summary",
              },
              fieldMap: {
                arr: "annualRevenue",
              },
            },
          },
        },
      },
    });

    expect(result).toMatchObject({
      ok: false,
      mode: "hybrid",
    });
    if (result.ok) {
      throw new Error("Hybrid adapter resolution unexpectedly passed.");
    }

    expect(result.errors).toEqual([
      expect.stringMatching(/monthly_summary/i),
    ]);
    expect(result.errors[0]).toMatch(/missing mappings: month, mrr, supportTickets/i);
    expect(result.datasets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          datasetId: "monthly_summary",
          source: "live",
          status: "error",
        }),
      ]),
    );
  });
});

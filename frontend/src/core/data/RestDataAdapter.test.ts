import { describe, expect, it, vi } from "vitest";

import type { DataBinding } from "../spec/dashboardSpec";
import { RestDataAdapter } from "./RestDataAdapter";

describe("RestDataAdapter", () => {
  it("normalizes REST payloads through the shared query and aggregate helpers", async () => {
    const bindings: Record<string, DataBinding> = {
      monthly_summary: {
        type: "rest",
        connection: {
          url: "https://example.test/monthly-summary",
          query: "payload.rows",
        },
        fieldMap: {
          month: "periodLabel",
          arr: "annualRevenue",
        },
      },
    };
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        payload: {
          rows: [
            { periodLabel: "Jan", annualRevenue: 22.8, supportTickets: 9800 },
            { periodLabel: "Feb", annualRevenue: 23.2, supportTickets: 10200 },
          ],
        },
      }),
    });

    const adapter = RestDataAdapter.fromBindings(bindings, { fetcher });

    await expect(
      adapter.query({
        datasetId: "monthly_summary",
        columns: ["month", "arr"],
        sortBy: {
          field: "month",
          direction: "asc",
        },
      }),
    ).resolves.toEqual({
      columns: ["month", "arr"],
      rows: [
        { month: "Feb", arr: 23.2 },
        { month: "Jan", arr: 22.8 },
      ],
      totalCount: 2,
    });

    await expect(
      adapter.aggregate({
        datasetId: "monthly_summary",
        groupBy: ["month"],
        metrics: [{ field: "arr", aggregate: "sum", alias: "arr" }],
      }),
    ).resolves.toMatchObject({
      columns: ["month", "arr"],
      rows: expect.arrayContaining([
        { month: "Jan", arr: 22.8 },
        { month: "Feb", arr: 23.2 },
      ]),
      totalCount: 2,
    });

    await expect(adapter.getSchema("monthly_summary")).resolves.toMatchObject({
      datasetId: "monthly_summary",
      columns: expect.arrayContaining([
        expect.objectContaining({ name: "month", type: "date" }),
        expect.objectContaining({ name: "arr", type: "number" }),
      ]),
    });

    await expect(adapter.listDatasets()).resolves.toEqual([
      {
        datasetId: "monthly_summary",
        rowCount: 2,
      },
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("raises actionable errors for unsupported responses", async () => {
    const adapter = RestDataAdapter.fromBindings(
      {
        executive_summary: {
          type: "rest",
          connection: {
            url: "https://example.test/executive-summary",
          },
          fieldMap: {},
        },
      },
      {
        fetcher: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            summary: "not rows",
          }),
        }),
      },
    );

    await expect(
      adapter.query({
        datasetId: "executive_summary",
      }),
    ).rejects.toThrow(/must resolve to an array of row objects/i);
  });
});

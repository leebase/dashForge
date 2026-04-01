import { describe, expect, it, vi } from "vitest";

import type {
  AggregateRequest,
  DataRequest,
  DataSchema,
  DatasetInfo,
  DataResult,
} from "./dataContract";
import { SQLiteDataAdapter } from "./SQLiteDataAdapter";

describe("SQLiteDataAdapter", () => {
  it("boots through the browser loader seam and delegates the narrow contract", async () => {
    const datasetResult: DataResult = {
      columns: ["metric", "value"],
      rows: [{ metric: "readmission-rate", value: 9.8 }],
      totalCount: 1,
    };
    const schema: DataSchema = {
      datasetId: "executive_summary",
      columns: [
        {
          name: "metric",
          type: "string",
          role: "dimension",
          label: "Metric",
        },
      ],
    };
    const datasets: DatasetInfo[] = [{ datasetId: "executive_summary", rowCount: 1 }];
    const query = vi.fn<(request: DataRequest) => Promise<DataResult>>().mockResolvedValue(
      datasetResult,
    );
    const aggregate = vi
      .fn<(request: AggregateRequest) => Promise<DataResult>>()
      .mockResolvedValue(datasetResult);
    const getSchema = vi
      .fn<(datasetId: string) => Promise<DataSchema>>()
      .mockResolvedValue(schema);
    const listDatasets = vi
      .fn<() => Promise<DatasetInfo[]>>()
      .mockResolvedValue(datasets);
    const loader = {
      load: vi.fn(async () => ({
        query,
        aggregate,
        getSchema,
        listDatasets,
      })),
    };

    const adapter = await SQLiteDataAdapter.fromFile(new ArrayBuffer(8), loader);

    await expect(
      adapter.query({
        datasetId: "executive_summary",
      }),
    ).resolves.toEqual(datasetResult);
    await expect(
      adapter.aggregate({
        datasetId: "executive_summary",
        groupBy: ["metric"],
        metrics: [{ field: "value", aggregate: "avg", alias: "value" }],
      }),
    ).resolves.toEqual(datasetResult);
    await expect(adapter.getSchema("executive_summary")).resolves.toEqual(schema);
    await expect(adapter.listDatasets()).resolves.toEqual(datasets);

    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
    expect(aggregate).toHaveBeenCalledTimes(1);
  });
});

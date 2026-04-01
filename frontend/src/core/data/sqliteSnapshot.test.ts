import { describe, expect, it } from "vitest";

import { SQLiteDataAdapter } from "./SQLiteDataAdapter";
import {
  createSQLiteSnapshotClient,
  createSQLiteSnapshotLoader,
  type SQLiteSnapshot,
} from "./sqliteSnapshot";

const snapshot: SQLiteSnapshot = {
  packId: "healthcare",
  scenarioId: "quality-improvement",
  seed: 2048,
  datasets: [
    {
      datasetId: "facility_monthly_metrics",
      rowCount: 2,
      columns: [
        {
          name: "month",
          type: "date",
          role: "date",
          label: "Month",
        },
        {
          name: "facilityName",
          type: "string",
          role: "dimension",
          label: "Facility Name",
        },
        {
          name: "admissions",
          type: "number",
          role: "measure",
          label: "Admissions",
        },
      ],
      rows: [
        {
          month: "2025-01",
          facilityName: "North Medical Center",
          admissions: 220,
        },
        {
          month: "2025-01",
          facilityName: "Lakeside Regional",
          admissions: 180,
        },
      ],
    },
  ],
};

describe("sqliteSnapshot", () => {
  it("serves query, aggregate, schema, and dataset listing from a SQLite-derived snapshot", async () => {
    const adapter = SQLiteDataAdapter.fromClient(createSQLiteSnapshotClient(snapshot));

    await expect(
      adapter.query({
        datasetId: "facility_monthly_metrics",
        limit: 1,
        sortBy: {
          field: "admissions",
          direction: "desc",
        },
      }),
    ).resolves.toMatchObject({
      totalCount: 2,
      rows: [
        {
          facilityName: "North Medical Center",
          admissions: 220,
        },
      ],
    });

    await expect(
      adapter.aggregate({
        datasetId: "facility_monthly_metrics",
        groupBy: ["month"],
        metrics: [
          {
            field: "admissions",
            aggregate: "sum",
            alias: "admissions",
          },
        ],
      }),
    ).resolves.toEqual({
      columns: ["month", "admissions"],
      rows: [
        {
          month: "2025-01",
          admissions: 400,
        },
      ],
      totalCount: 1,
    });

    await expect(adapter.getSchema("facility_monthly_metrics")).resolves.toEqual({
      datasetId: "facility_monthly_metrics",
      columns: snapshot.datasets[0].columns,
    });

    await expect(adapter.listDatasets()).resolves.toEqual([
      {
        datasetId: "facility_monthly_metrics",
        rowCount: 2,
      },
    ]);
  });

  it("loads a snapshot from bytes through the file loader seam", async () => {
    const loader = createSQLiteSnapshotLoader();
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).buffer;

    const adapter = await SQLiteDataAdapter.fromFile(bytes, loader);

    await expect(
      adapter.aggregate({
        datasetId: "facility_monthly_metrics",
        groupBy: ["facilityName"],
        metrics: [
          {
            field: "admissions",
            aggregate: "sum",
            alias: "admissions",
          },
        ],
        sortBy: {
          field: "admissions",
          direction: "desc",
        },
      }),
    ).resolves.toMatchObject({
      rows: [
        {
          facilityName: "North Medical Center",
          admissions: 220,
        },
        {
          facilityName: "Lakeside Regional",
          admissions: 180,
        },
      ],
    });
  });
});

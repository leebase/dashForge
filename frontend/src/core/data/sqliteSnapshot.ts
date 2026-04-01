import type {
  DataResult,
  DataSchema,
  DatasetInfo,
} from "./dataContract";
import {
  aggregateRows,
  queryRows,
} from "./dataOperations";
import type {
  AggregateRequest,
  DataRequest,
} from "./dataContract";
import type {
  BrowserSQLiteClient,
  BrowserSQLiteLoader,
} from "./SQLiteDataAdapter";

export interface SQLiteSnapshotDataset {
  datasetId: string;
  rowCount: number;
  columns: DataSchema["columns"];
  rows: Array<Record<string, unknown>>;
}

export interface SQLiteSnapshot {
  packId: string;
  scenarioId: string;
  seed: number;
  datasets: SQLiteSnapshotDataset[];
}

function requireDataset(
  datasets: Map<string, SQLiteSnapshotDataset>,
  datasetId: string,
): SQLiteSnapshotDataset {
  const dataset = datasets.get(datasetId);

  if (!dataset) {
    throw new Error(`Dataset ${datasetId} is not available in the SQLite snapshot.`);
  }

  return dataset;
}

export function createSQLiteSnapshotClient(
  snapshot: SQLiteSnapshot,
): BrowserSQLiteClient {
  const datasets = new Map(
    snapshot.datasets.map((dataset) => [dataset.datasetId, dataset]),
  );

  return {
    query(request: DataRequest): Promise<DataResult> {
      return Promise.resolve(queryRows(requireDataset(datasets, request.datasetId).rows, request));
    },
    aggregate(request: AggregateRequest): Promise<DataResult> {
      return Promise.resolve(
        aggregateRows(requireDataset(datasets, request.datasetId).rows, request),
      );
    },
    getSchema(datasetId: string): Promise<DataSchema> {
      const dataset = requireDataset(datasets, datasetId);
      return Promise.resolve({
        datasetId,
        columns: dataset.columns,
      });
    },
    listDatasets(): Promise<DatasetInfo[]> {
      return Promise.resolve(
        snapshot.datasets.map((dataset) => ({
          datasetId: dataset.datasetId,
          rowCount: dataset.rowCount,
        })),
      );
    },
  };
}

export function parseSQLiteSnapshot(sqliteBytes: ArrayBuffer): SQLiteSnapshot {
  const content = new TextDecoder().decode(sqliteBytes);
  return JSON.parse(content) as SQLiteSnapshot;
}

export function createSQLiteSnapshotLoader(): BrowserSQLiteLoader {
  return {
    async load(sqliteBytes: ArrayBuffer): Promise<BrowserSQLiteClient> {
      return createSQLiteSnapshotClient(parseSQLiteSnapshot(sqliteBytes));
    },
  };
}

import type { DataAdapter } from "./DataAdapter";
import type {
  AggregateRequest,
  DataRequest,
  DataResult,
  DataSchema,
  DatasetInfo,
} from "./dataContract";

export interface BrowserSQLiteClient {
  query(request: DataRequest): Promise<DataResult>;
  aggregate(request: AggregateRequest): Promise<DataResult>;
  getSchema(datasetId: string): Promise<DataSchema>;
  listDatasets(): Promise<DatasetInfo[]>;
}

export interface BrowserSQLiteLoader {
  load(sqliteBytes: ArrayBuffer): Promise<BrowserSQLiteClient>;
}

export class SQLiteDataAdapter implements DataAdapter {
  constructor(private readonly client: BrowserSQLiteClient) {}

  static fromClient(client: BrowserSQLiteClient): SQLiteDataAdapter {
    return new SQLiteDataAdapter(client);
  }

  static async fromFile(
    sqliteBytes: ArrayBuffer,
    loader: BrowserSQLiteLoader,
  ): Promise<SQLiteDataAdapter> {
    const client = await loader.load(sqliteBytes);
    return new SQLiteDataAdapter(client);
  }

  query(request: DataRequest): Promise<DataResult> {
    return this.client.query(request);
  }

  aggregate(request: AggregateRequest): Promise<DataResult> {
    return this.client.aggregate(request);
  }

  getSchema(datasetId: string): Promise<DataSchema> {
    return this.client.getSchema(datasetId);
  }

  listDatasets(): Promise<DatasetInfo[]> {
    return this.client.listDatasets();
  }
}

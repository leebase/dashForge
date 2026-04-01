import type {
  AggregateRequest,
  DataRequest,
  DataResult,
  DataSchema,
  DatasetInfo,
} from "./dataContract";

export interface DataAdapter {
  query(request: DataRequest): Promise<DataResult>;
  aggregate(request: AggregateRequest): Promise<DataResult>;
  getSchema(datasetId: string): Promise<DataSchema>;
  listDatasets(): Promise<DatasetInfo[]>;
}

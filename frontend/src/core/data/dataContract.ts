export type DataFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "between"
  | "like";

export type DataSortDirection = "asc" | "desc";
export type DataAggregate = "sum" | "avg" | "min" | "max" | "count";
export type DataColumnType = "string" | "number" | "date" | "boolean";
export type DataColumnRole = "dimension" | "measure" | "date" | "id";

export interface DataFilter {
  field: string;
  operator: DataFilterOperator;
  value: unknown;
}

export interface DataSort {
  field: string;
  direction: DataSortDirection;
}

export interface AggregateMetric {
  field: string;
  aggregate: DataAggregate;
  alias?: string;
}

export interface DataRequest {
  datasetId: string;
  columns?: string[];
  filters?: DataFilter[];
  sortBy?: DataSort;
  limit?: number;
  offset?: number;
}

export interface AggregateRequest {
  datasetId: string;
  groupBy: string[];
  metrics: AggregateMetric[];
  filters?: DataFilter[];
  sortBy?: DataSort;
  limit?: number;
}

export interface DataResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  totalCount: number;
}

export interface DataColumnSchema {
  name: string;
  type: DataColumnType;
  role: DataColumnRole;
  label: string;
  format?: string;
}

export interface DataSchema {
  datasetId: string;
  columns: DataColumnSchema[];
}

export interface DatasetInfo {
  datasetId: string;
  rowCount?: number;
}

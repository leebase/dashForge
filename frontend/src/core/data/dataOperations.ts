import type {
  AggregateMetric,
  AggregateRequest,
  DataColumnRole,
  DataColumnType,
  DataFilter,
  DataRequest,
  DataResult,
  DataSchema,
  DataSort,
} from "./dataContract";

type DataRow = Record<string, unknown>;

function compareValues(left: unknown, right: unknown): number {
  if (left === right) {
    return 0;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function matchesFilter(row: DataRow, filter: DataFilter): boolean {
  const fieldValue = row[filter.field];

  switch (filter.operator) {
    case "eq":
      return fieldValue === filter.value;
    case "neq":
      return fieldValue !== filter.value;
    case "gt":
      return compareValues(fieldValue, filter.value) > 0;
    case "gte":
      return compareValues(fieldValue, filter.value) >= 0;
    case "lt":
      return compareValues(fieldValue, filter.value) < 0;
    case "lte":
      return compareValues(fieldValue, filter.value) <= 0;
    case "in":
      return Array.isArray(filter.value) && filter.value.includes(fieldValue);
    case "between":
      return (
        Array.isArray(filter.value) &&
        filter.value.length === 2 &&
        compareValues(fieldValue, filter.value[0]) >= 0 &&
        compareValues(fieldValue, filter.value[1]) <= 0
      );
    case "like":
      return String(fieldValue ?? "")
        .toLowerCase()
        .includes(String(filter.value ?? "").toLowerCase());
    default:
      return false;
  }
}

function applyFilters(rows: readonly DataRow[], filters?: DataFilter[]): DataRow[] {
  if (!filters?.length) {
    return [...rows];
  }

  return rows.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
}

function applySort(rows: DataRow[], sortBy?: DataSort): DataRow[] {
  if (!sortBy) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const comparison = compareValues(left[sortBy.field], right[sortBy.field]);
    return sortBy.direction === "asc" ? comparison : -comparison;
  });
}

function projectColumns(rows: DataRow[], columns?: string[]): DataRow[] {
  if (!columns?.length) {
    return rows;
  }

  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, row[column]])),
  );
}

function aggregateValue(rows: DataRow[], metric: AggregateMetric): number {
  if (metric.aggregate === "count") {
    return rows.length;
  }

  const numericValues = rows
    .map((row) => row[metric.field])
    .filter((value): value is number => typeof value === "number");

  if (!numericValues.length) {
    return 0;
  }

  switch (metric.aggregate) {
    case "sum":
      return numericValues.reduce((sum, value) => sum + value, 0);
    case "avg":
      return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    case "min":
      return Math.min(...numericValues);
    case "max":
      return Math.max(...numericValues);
  }
}

function inferColumnType(columnName: string, values: unknown[]): DataColumnType {
  const firstMeaningful = values.find((value) => value !== null && value !== undefined);

  if (typeof firstMeaningful === "number") {
    return "number";
  }

  if (typeof firstMeaningful === "boolean") {
    return "boolean";
  }

  if (
    typeof firstMeaningful === "string" &&
    /date|time|month|quarter/i.test(columnName)
  ) {
    return "date";
  }

  return "string";
}

function inferColumnRole(columnName: string, type: DataColumnType): DataColumnRole {
  if (/id$/i.test(columnName) || columnName === "id") {
    return "id";
  }

  if (type === "number") {
    return "measure";
  }

  if (type === "date") {
    return "date";
  }

  return "dimension";
}

function humanizeLabel(columnName: string): string {
  return columnName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function queryRows(
  sourceRows: readonly DataRow[],
  request: DataRequest,
): DataResult {
  const filteredRows = applyFilters(sourceRows, request.filters);
  const sortedRows = applySort(filteredRows, request.sortBy);
  const offset = request.offset ?? 0;
  const limitedRows =
    typeof request.limit === "number"
      ? sortedRows.slice(offset, offset + request.limit)
      : sortedRows.slice(offset);
  const projectedRows = projectColumns(limitedRows, request.columns);

  return {
    columns:
      request.columns && request.columns.length
        ? request.columns
        : Object.keys(projectedRows[0] ?? {}),
    rows: projectedRows,
    totalCount: filteredRows.length,
  };
}

export function aggregateRows(
  sourceRows: readonly DataRow[],
  request: AggregateRequest,
): DataResult {
  const filteredRows = applyFilters(sourceRows, request.filters);
  const groupedRows = new Map<string, DataRow[]>();

  for (const row of filteredRows) {
    const key = JSON.stringify(request.groupBy.map((column) => row[column]));
    const existing = groupedRows.get(key);

    if (existing) {
      existing.push(row);
      continue;
    }

    groupedRows.set(key, [row]);
  }

  const aggregatedRows = [...groupedRows.values()].map((rows) => {
    const groupColumns = Object.fromEntries(
      request.groupBy.map((column) => [column, rows[0]?.[column]]),
    );
    const metricColumns = Object.fromEntries(
      request.metrics.map((metric) => [
        metric.alias ?? metric.field,
        aggregateValue(rows, metric),
      ]),
    );

    return {
      ...groupColumns,
      ...metricColumns,
    };
  });

  const sortedRows = applySort(aggregatedRows, request.sortBy);
  const limitedRows =
    typeof request.limit === "number"
      ? sortedRows.slice(0, request.limit)
      : sortedRows;

  return {
    columns: [
      ...request.groupBy,
      ...request.metrics.map((metric) => metric.alias ?? metric.field),
    ],
    rows: limitedRows,
    totalCount: aggregatedRows.length,
  };
}

export function inferDataSchema(
  datasetId: string,
  rows: readonly DataRow[],
): DataSchema {
  const columnNames = Object.keys(rows[0] ?? {});

  return {
    datasetId,
    columns: columnNames.map((name) => {
      const values = rows.map((row) => row[name]);
      const type = inferColumnType(name, values);

      return {
        name,
        type,
        role: inferColumnRole(name, type),
        label: humanizeLabel(name),
      };
    }),
  };
}

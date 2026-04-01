import type { DataAdapter } from "./DataAdapter";
import type {
  BarInlineData,
  BarWidgetSpec,
  DonutInlineData,
  DonutWidgetSpec,
  GaugeInlineData,
  GaugeWidgetSpec,
  KpiInlineData,
  KpiWidgetSpec,
  LineInlineData,
  LineWidgetSpec,
  SparklineInlineData,
  SparklineWidgetSpec,
  StackedBarInlineData,
  StackedBarWidgetSpec,
  TableInlineData,
  TableWidgetSpec,
  WidgetSpec,
} from "../spec/dashboardSpec";
import { isDatasetWidgetDataRef } from "../spec/dashboardSpec";

interface CartesianFieldSet {
  labelField: string;
  valueField: string;
  seriesField?: string;
}

function requireNumericField(
  row: Record<string, unknown> | undefined,
  field: string,
  widgetId: string,
): number {
  const value = row?.[field];

  if (typeof value !== "number") {
    throw new Error(`Widget ${widgetId} expected numeric field "${field}".`);
  }

  return value;
}

function requireStringField(
  row: Record<string, unknown> | undefined,
  field: string,
  widgetId: string,
): string {
  const value = row?.[field];

  if (typeof value !== "string") {
    throw new Error(`Widget ${widgetId} expected string field "${field}".`);
  }

  return value;
}

function extractCaption(
  row: Record<string, unknown> | undefined,
  fallback?: string,
): string | undefined {
  return typeof row?.caption === "string" ? row.caption : fallback;
}

async function resolveCartesianDataset(
  adapter: DataAdapter,
  widget: WidgetSpec,
  fields: CartesianFieldSet,
): Promise<LineInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    throw new Error(`Widget ${widget.id} expected a dataset-backed data reference.`);
  }

  const columns = [fields.labelField, fields.valueField, fields.seriesField].filter(
    (value): value is string => Boolean(value),
  );

  const groupBy =
    widget.data.groupBy ??
    [fields.labelField, fields.seriesField].filter((value): value is string => Boolean(value));

  const result = widget.data.groupBy?.length || widget.data.metrics?.length
    ? await adapter.aggregate({
        datasetId: widget.data.datasetId,
        groupBy,
        metrics:
          widget.data.metrics ??
          [
            {
              field: fields.valueField,
              aggregate:
                "chart" in widget && "y" in widget.chart.encoding
                  ? widget.chart.encoding.y.aggregate ?? "sum"
                  : "sum",
              alias: fields.valueField,
            },
          ],
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit,
      })
    : await adapter.query({
        datasetId: widget.data.datasetId,
        columns,
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit,
        offset: widget.data.offset,
      });

  return {
    points: result.rows.map((row) => ({
      label: requireStringField(row, fields.labelField, widget.id),
      value: requireNumericField(row, fields.valueField, widget.id),
      series:
        fields.seriesField && typeof row[fields.seriesField] === "string"
          ? (row[fields.seriesField] as string)
          : undefined,
    })),
    caption: widget.caption,
  };
}

export async function resolveKpiWidgetData(
  adapter: DataAdapter,
  widget: KpiWidgetSpec,
): Promise<KpiInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  const columns = [
    widget.chart.encoding.value.field,
    widget.chart.kpiConfig?.deltaField,
    "deltaLabel",
    "prefix",
    "suffix",
    "caption",
  ].filter((value): value is string => Boolean(value));

  const result = widget.data.groupBy?.length || widget.data.metrics?.length
    ? await adapter.aggregate({
        datasetId: widget.data.datasetId,
        groupBy: widget.data.groupBy ?? [],
        metrics:
          widget.data.metrics ??
          [
            {
              field: widget.chart.encoding.value.field,
              aggregate: widget.chart.encoding.value.aggregate ?? "sum",
              alias: widget.chart.encoding.value.field,
            },
          ],
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit,
      })
    : await adapter.query({
        datasetId: widget.data.datasetId,
        columns,
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit ?? 1,
        offset: widget.data.offset,
      });

  const firstRow = result.rows[0];

  if (!firstRow) {
    throw new Error(`Widget ${widget.id} did not resolve any KPI rows.`);
  }

  const deltaField = widget.chart.kpiConfig?.deltaField;

  return {
    value: requireNumericField(firstRow, widget.chart.encoding.value.field, widget.id),
    delta:
      deltaField && typeof firstRow[deltaField] === "number"
        ? (firstRow[deltaField] as number)
        : undefined,
    deltaLabel:
      widget.chart.kpiConfig?.deltaLabel ??
      (typeof firstRow.deltaLabel === "string" ? firstRow.deltaLabel : undefined),
    prefix:
      widget.chart.kpiConfig?.prefix ??
      (typeof firstRow.prefix === "string" ? firstRow.prefix : undefined),
    suffix:
      widget.chart.kpiConfig?.suffix ??
      (typeof firstRow.suffix === "string" ? firstRow.suffix : undefined),
    caption: extractCaption(firstRow, widget.caption),
  };
}

export async function resolveLineWidgetData(
  adapter: DataAdapter,
  widget: LineWidgetSpec,
): Promise<LineInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  return resolveCartesianDataset(adapter, widget, {
    labelField: widget.chart.encoding.x.field,
    valueField: widget.chart.encoding.y.field,
    seriesField: widget.chart.encoding.series?.field,
  });
}

export async function resolveBarWidgetData(
  adapter: DataAdapter,
  widget: BarWidgetSpec,
): Promise<BarInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  return resolveCartesianDataset(adapter, widget, {
    labelField: widget.chart.encoding.x.field,
    valueField: widget.chart.encoding.y.field,
    seriesField: widget.chart.encoding.series?.field,
  });
}

export async function resolveStackedBarWidgetData(
  adapter: DataAdapter,
  widget: StackedBarWidgetSpec,
): Promise<StackedBarInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  return resolveCartesianDataset(adapter, widget, {
    labelField: widget.chart.encoding.x.field,
    valueField: widget.chart.encoding.y.field,
    seriesField: widget.chart.encoding.series.field,
  });
}

export async function resolveDonutWidgetData(
  adapter: DataAdapter,
  widget: DonutWidgetSpec,
): Promise<DonutInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  return resolveCartesianDataset(adapter, widget, {
    labelField: widget.chart.encoding.category.field,
    valueField: widget.chart.encoding.value.field,
  });
}

export async function resolveSparklineWidgetData(
  adapter: DataAdapter,
  widget: SparklineWidgetSpec,
): Promise<SparklineInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  return resolveCartesianDataset(adapter, widget, {
    labelField: widget.chart.encoding.x.field,
    valueField: widget.chart.encoding.y.field,
    seriesField: widget.chart.encoding.series?.field,
  });
}

export async function resolveTableWidgetData(
  adapter: DataAdapter,
  widget: TableWidgetSpec,
): Promise<TableInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  const columnKeys = widget.chart.encoding.columns.map((column) => column.field);
  const result = widget.data.groupBy?.length || widget.data.metrics?.length
    ? await adapter.aggregate({
        datasetId: widget.data.datasetId,
        groupBy: widget.data.groupBy ?? columnKeys,
        metrics: widget.data.metrics ?? [],
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit,
      })
    : await adapter.query({
        datasetId: widget.data.datasetId,
        columns: widget.data.columns ?? columnKeys,
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit,
        offset: widget.data.offset,
      });

  return {
    columns: widget.chart.encoding.columns.map((column) => ({
      key: column.field,
      label: column.label,
      format: column.format,
      align:
        column.aggregate || /count|rate|share|value|tickets|retention|mrr|arr/i.test(column.field)
          ? "right"
          : "left",
    })),
    rows: result.rows,
    caption: widget.caption,
  };
}

export async function resolveGaugeWidgetData(
  adapter: DataAdapter,
  widget: GaugeWidgetSpec,
): Promise<GaugeInlineData> {
  if (!isDatasetWidgetDataRef(widget.data)) {
    return widget.data.payload;
  }

  const columns = [
    widget.chart.encoding.value.field,
    widget.chart.encoding.target?.field,
    widget.chart.encoding.min?.field,
    widget.chart.encoding.max?.field,
    widget.chart.encoding.label?.field,
    "prefix",
    "suffix",
    "caption",
  ].filter((value): value is string => Boolean(value));

  const result = widget.data.groupBy?.length || widget.data.metrics?.length
    ? await adapter.aggregate({
        datasetId: widget.data.datasetId,
        groupBy: widget.data.groupBy ?? [],
        metrics:
          widget.data.metrics ??
          [
            {
              field: widget.chart.encoding.value.field,
              aggregate: widget.chart.encoding.value.aggregate ?? "sum",
              alias: widget.chart.encoding.value.field,
            },
          ],
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit,
      })
    : await adapter.query({
        datasetId: widget.data.datasetId,
        columns,
        filters: widget.data.filters,
        sortBy: widget.data.sortBy,
        limit: widget.data.limit ?? 1,
        offset: widget.data.offset,
      });

  const firstRow = result.rows[0];

  if (!firstRow) {
    throw new Error(`Widget ${widget.id} did not resolve any gauge rows.`);
  }

  const targetField = widget.chart.encoding.target?.field;
  const minField = widget.chart.encoding.min?.field;
  const maxField = widget.chart.encoding.max?.field;
  const labelField = widget.chart.encoding.label?.field;

  return {
    value: requireNumericField(firstRow, widget.chart.encoding.value.field, widget.id),
    target:
      targetField && typeof firstRow[targetField] === "number"
        ? (firstRow[targetField] as number)
        : undefined,
    min:
      minField && typeof firstRow[minField] === "number"
        ? (firstRow[minField] as number)
        : widget.chart.gaugeConfig?.min,
    max:
      maxField && typeof firstRow[maxField] === "number"
        ? (firstRow[maxField] as number)
        : widget.chart.gaugeConfig?.max,
    prefix:
      widget.chart.gaugeConfig?.prefix ??
      (typeof firstRow.prefix === "string" ? firstRow.prefix : undefined),
    suffix:
      widget.chart.gaugeConfig?.suffix ??
      (typeof firstRow.suffix === "string" ? firstRow.suffix : undefined),
    label:
      labelField && typeof firstRow[labelField] === "string"
        ? (firstRow[labelField] as string)
        : undefined,
    caption: extractCaption(firstRow, widget.caption),
  };
}

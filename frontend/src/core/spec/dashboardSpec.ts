import type {
  AggregateMetric,
  DataFilter,
  DataSort,
} from "../data/dataContract";

export const CURRENT_DASHBOARD_SPEC_VERSION = "1.0" as const;
export const SUPPORTED_DASHBOARD_THEME_IDS = [
  "light-professional",
  "dark-executive",
] as const;
export const SUPPORTED_DASHBOARD_INTENT_TYPES = [
  "executive_summary",
  "operational_detail",
  "risk_alert",
  "comparative_benchmark",
  "drill_down",
  "workshop_prototype",
] as const;
export const SUPPORTED_DASHBOARD_AUDIENCES = [
  "executive",
  "manager",
  "operator",
  "analyst",
  "client_demo",
] as const;
export const SUPPORTED_DASHBOARD_GRANULARITIES = [
  "day",
  "week",
  "month",
  "quarter",
] as const;
export const SUPPORTED_CHART_TYPES = [
  "kpi",
  "line",
  "bar",
  "stacked_bar",
  "donut",
  "table",
  "sparkline",
  "gauge",
] as const;

export type DashboardSpecVersion = typeof CURRENT_DASHBOARD_SPEC_VERSION;
export type DashboardIntentType = (typeof SUPPORTED_DASHBOARD_INTENT_TYPES)[number];
export type DashboardAudience = (typeof SUPPORTED_DASHBOARD_AUDIENCES)[number];
export type DashboardDataMode = "mock" | "live" | "hybrid";
export type DashboardGranularity = (typeof SUPPORTED_DASHBOARD_GRANULARITIES)[number];
export type DashboardCompaction = "vertical" | "horizontal" | "none";
export type ChartType = (typeof SUPPORTED_CHART_TYPES)[number];
export type ChartIntent =
  | "trend"
  | "comparison"
  | "composition"
  | "distribution"
  | "ranking"
  | "target_vs_actual"
  | "anomaly"
  | "monitoring";

export interface DashboardMeta {
  title: string;
  description?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface DashboardIntent {
  type: DashboardIntentType;
  audience: DashboardAudience;
  industry: string;
  scenario?: string;
}

export interface DashboardTheme {
  id: string;
  overrides?: Record<string, string>;
}

export interface DashboardTimeRange {
  start: string;
  end: string;
  granularity: DashboardGranularity;
}

export interface DataOverride {
  datasetId: string;
  field: string;
  value: unknown;
}

export interface DataBinding {
  type: "rest" | "graphql" | "snowflake" | "databricks" | "static_json";
  connection: {
    url?: string;
    account?: string;
    warehouse?: string;
    database?: string;
    schema?: string;
    query?: string;
    headers?: Record<string, string>;
  };
  fieldMap: Record<string, string>;
  refreshInterval?: number;
  cachePolicy?: "none" | "ttl";
  cacheTTL?: number;
}

export interface DashboardMockContext {
  packId: string;
  scenarioId: string;
  seed: number;
  overrides?: DataOverride[];
}

export interface DashboardLiveContext {
  bindings: Record<string, DataBinding>;
}

export interface DashboardDataContext {
  mode: DashboardDataMode;
  mock?: DashboardMockContext;
  live?: DashboardLiveContext;
  timeRange: DashboardTimeRange;
}

export interface DashboardBreakpoints {
  lg: number;
  md: number;
  sm: number;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  breakpoints: DashboardBreakpoints;
  compaction: DashboardCompaction;
}

export interface KpiInlineData {
  value: number;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  prefix?: string;
  caption?: string;
}

export interface LineInlinePoint {
  label: string;
  value: number;
  series?: string;
}

export interface LineInlineData {
  points: LineInlinePoint[];
  seriesLabel?: string;
  caption?: string;
}

export type BarInlineData = LineInlineData;
export type StackedBarInlineData = LineInlineData;
export type DonutInlineData = LineInlineData;
export type SparklineInlineData = LineInlineData;

export interface TableInlineColumn {
  key: string;
  label?: string;
  format?: string;
  align?: "left" | "center" | "right";
}

export interface TableInlineData {
  columns: TableInlineColumn[];
  rows: Array<Record<string, unknown>>;
  caption?: string;
}

export interface GaugeInlineData {
  value: number;
  target?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  caption?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface InlineWidgetDataRef<TPayload> {
  source: "inline";
  payload: TPayload;
}

export interface DatasetWidgetDataRef {
  source: "dataset";
  datasetId: string;
  columns?: string[];
  filters?: DataFilter[];
  groupBy?: string[];
  metrics?: AggregateMetric[];
  limit?: number;
  offset?: number;
  sortBy?: DataSort;
}

export interface FieldEncoding {
  field: string;
  label?: string;
  format?: string;
  sort?: "asc" | "desc" | "none";
  aggregate?: AggregateMetric["aggregate"];
}

export interface ThresholdSpec {
  value: number;
  label: string;
  color?: string;
}

export interface ChartOptions {
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  smooth?: boolean;
  stack?: boolean;
  horizontal?: boolean;
  innerRadius?: number;
  thresholds?: ThresholdSpec[];
  colorPalette?: string;
  min?: number;
  max?: number;
}

export interface KpiChartSpec {
  type: "kpi";
  intent?: ChartIntent;
  encoding: {
    value: FieldEncoding;
  };
  kpiConfig?: {
    deltaField?: string;
    deltaLabel?: string;
    deltaFormat?: "percent" | "absolute";
    deltaPositive?: "good" | "bad";
    sparklineField?: string;
    prefix?: string;
    suffix?: string;
    format?: string;
  };
  options?: ChartOptions;
}

export interface LineChartSpec {
  type: "line";
  intent?: ChartIntent;
  encoding: {
    x: FieldEncoding;
    y: FieldEncoding;
    series?: FieldEncoding;
  };
  options?: ChartOptions;
}

export interface BarChartSpec {
  type: "bar";
  intent?: ChartIntent;
  encoding: {
    x: FieldEncoding;
    y: FieldEncoding;
    series?: FieldEncoding;
  };
  options?: ChartOptions;
}

export interface StackedBarChartSpec {
  type: "stacked_bar";
  intent?: ChartIntent;
  encoding: {
    x: FieldEncoding;
    y: FieldEncoding;
    series: FieldEncoding;
  };
  options?: ChartOptions;
}

export interface DonutChartSpec {
  type: "donut";
  intent?: ChartIntent;
  encoding: {
    category: FieldEncoding;
    value: FieldEncoding;
  };
  options?: ChartOptions;
}

export interface TableChartSpec {
  type: "table";
  intent?: ChartIntent;
  encoding: {
    columns: FieldEncoding[];
  };
  options?: ChartOptions;
}

export interface SparklineChartSpec {
  type: "sparkline";
  intent?: ChartIntent;
  encoding: {
    x: FieldEncoding;
    y: FieldEncoding;
    series?: FieldEncoding;
  };
  options?: ChartOptions;
}

export interface GaugeChartSpec {
  type: "gauge";
  intent?: ChartIntent;
  encoding: {
    value: FieldEncoding;
    target?: FieldEncoding;
    min?: FieldEncoding;
    max?: FieldEncoding;
    label?: FieldEncoding;
  };
  gaugeConfig?: {
    min?: number;
    max?: number;
    prefix?: string;
    suffix?: string;
    format?: string;
  };
  options?: ChartOptions;
}

export interface AnnotationSpec {
  type: "reference_line" | "highlight_point" | "highlight_region" | "text_label";
  value?: number;
  label: string;
  color?: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface NarrativeSection {
  headline: string;
  commentary: string;
  widgetIds: string[];
  transitionText?: string;
}

export interface NarrativeSpec {
  storyArc: {
    hook: NarrativeSection;
    context: NarrativeSection;
    tension: NarrativeSection;
    resolution: NarrativeSection;
    callToAction: NarrativeSection;
  };
  executiveSummary?: string;
  presenterNotes?: string[];
  audienceVariants?: Partial<Record<DashboardAudience, Partial<NarrativeSpec>>>;
}

export interface DashboardFilterSpec extends DataFilter {
  id: string;
  label: string;
  applyToWidgetIds?: string[];
}

export interface BaseWidgetSpec {
  id: string;
  position: WidgetPosition;
  title: string;
  subtitle?: string;
  caption?: string;
  annotations?: AnnotationSpec[];
}

export interface KpiWidgetSpec extends BaseWidgetSpec {
  chart: KpiChartSpec;
  data: InlineWidgetDataRef<KpiInlineData> | DatasetWidgetDataRef;
}

export interface LineWidgetSpec extends BaseWidgetSpec {
  chart: LineChartSpec;
  data: InlineWidgetDataRef<LineInlineData> | DatasetWidgetDataRef;
}

export interface BarWidgetSpec extends BaseWidgetSpec {
  chart: BarChartSpec;
  data: InlineWidgetDataRef<BarInlineData> | DatasetWidgetDataRef;
}

export interface StackedBarWidgetSpec extends BaseWidgetSpec {
  chart: StackedBarChartSpec;
  data: InlineWidgetDataRef<StackedBarInlineData> | DatasetWidgetDataRef;
}

export interface DonutWidgetSpec extends BaseWidgetSpec {
  chart: DonutChartSpec;
  data: InlineWidgetDataRef<DonutInlineData> | DatasetWidgetDataRef;
}

export interface TableWidgetSpec extends BaseWidgetSpec {
  chart: TableChartSpec;
  data: InlineWidgetDataRef<TableInlineData> | DatasetWidgetDataRef;
}

export interface SparklineWidgetSpec extends BaseWidgetSpec {
  chart: SparklineChartSpec;
  data: InlineWidgetDataRef<SparklineInlineData> | DatasetWidgetDataRef;
}

export interface GaugeWidgetSpec extends BaseWidgetSpec {
  chart: GaugeChartSpec;
  data: InlineWidgetDataRef<GaugeInlineData> | DatasetWidgetDataRef;
}

export type WidgetSpec =
  | KpiWidgetSpec
  | LineWidgetSpec
  | BarWidgetSpec
  | StackedBarWidgetSpec
  | DonutWidgetSpec
  | TableWidgetSpec
  | SparklineWidgetSpec
  | GaugeWidgetSpec;

export interface DashboardSpec {
  id: string;
  specVersion: DashboardSpecVersion;
  meta: DashboardMeta;
  intent: DashboardIntent;
  theme: DashboardTheme;
  dataContext: DashboardDataContext;
  layout: DashboardLayout;
  widgets: WidgetSpec[];
  narrative?: NarrativeSpec;
  filters?: DashboardFilterSpec[];
}

export interface DashboardDatasetReference {
  datasetId: string;
  widgetIds: string[];
  fields: string[];
}

export function isInlineWidgetDataRef<TPayload>(
  data: InlineWidgetDataRef<TPayload> | DatasetWidgetDataRef,
): data is InlineWidgetDataRef<TPayload> {
  return data.source === "inline";
}

export function isDatasetWidgetDataRef(
  data: InlineWidgetDataRef<unknown> | DatasetWidgetDataRef,
): data is DatasetWidgetDataRef {
  return data.source === "dataset";
}

export function isKpiWidget(widget: WidgetSpec): widget is KpiWidgetSpec {
  return widget.chart.type === "kpi";
}

export function isLineWidget(widget: WidgetSpec): widget is LineWidgetSpec {
  return widget.chart.type === "line";
}

export function isBarWidget(widget: WidgetSpec): widget is BarWidgetSpec {
  return widget.chart.type === "bar";
}

export function isStackedBarWidget(
  widget: WidgetSpec,
): widget is StackedBarWidgetSpec {
  return widget.chart.type === "stacked_bar";
}

export function isDonutWidget(widget: WidgetSpec): widget is DonutWidgetSpec {
  return widget.chart.type === "donut";
}

export function isTableWidget(widget: WidgetSpec): widget is TableWidgetSpec {
  return widget.chart.type === "table";
}

export function isSparklineWidget(
  widget: WidgetSpec,
): widget is SparklineWidgetSpec {
  return widget.chart.type === "sparkline";
}

export function isGaugeWidget(widget: WidgetSpec): widget is GaugeWidgetSpec {
  return widget.chart.type === "gauge";
}

function collectWidgetDatasetFields(widget: WidgetSpec): string[] {
  const fields = new Set<string>();

  if (!isDatasetWidgetDataRef(widget.data)) {
    return [];
  }

  for (const column of widget.data.columns ?? []) {
    fields.add(column);
  }

  for (const filter of widget.data.filters ?? []) {
    fields.add(filter.field);
  }

  for (const groupField of widget.data.groupBy ?? []) {
    fields.add(groupField);
  }

  for (const metric of widget.data.metrics ?? []) {
    fields.add(metric.field);
    if (metric.alias) {
      fields.add(metric.alias);
    }
  }

  if (widget.data.sortBy?.field) {
    fields.add(widget.data.sortBy.field);
  }

  switch (widget.chart.type) {
    case "kpi":
      fields.add(widget.chart.encoding.value.field);
      if (widget.chart.kpiConfig?.deltaField) {
        fields.add(widget.chart.kpiConfig.deltaField);
      }
      fields.add("deltaLabel");
      fields.add("prefix");
      fields.add("suffix");
      fields.add("caption");
      break;
    case "line":
    case "bar":
    case "sparkline":
      fields.add(widget.chart.encoding.x.field);
      fields.add(widget.chart.encoding.y.field);
      if (widget.chart.encoding.series?.field) {
        fields.add(widget.chart.encoding.series.field);
      }
      break;
    case "stacked_bar":
      fields.add(widget.chart.encoding.x.field);
      fields.add(widget.chart.encoding.y.field);
      fields.add(widget.chart.encoding.series.field);
      break;
    case "donut":
      fields.add(widget.chart.encoding.category.field);
      fields.add(widget.chart.encoding.value.field);
      break;
    case "table":
      for (const column of widget.chart.encoding.columns) {
        fields.add(column.field);
      }
      break;
    case "gauge":
      fields.add(widget.chart.encoding.value.field);
      if (widget.chart.encoding.target?.field) {
        fields.add(widget.chart.encoding.target.field);
      }
      if (widget.chart.encoding.min?.field) {
        fields.add(widget.chart.encoding.min.field);
      }
      if (widget.chart.encoding.max?.field) {
        fields.add(widget.chart.encoding.max.field);
      }
      if (widget.chart.encoding.label?.field) {
        fields.add(widget.chart.encoding.label.field);
      }
      fields.add("prefix");
      fields.add("suffix");
      fields.add("caption");
      break;
  }

  return [...fields].filter((field) => field.length > 0).sort();
}

export function collectDashboardDatasetReferences(
  spec: DashboardSpec,
): DashboardDatasetReference[] {
  const references = new Map<
    string,
    { widgetIds: Set<string>; fields: Set<string> }
  >();

  for (const widget of spec.widgets) {
    if (!isDatasetWidgetDataRef(widget.data)) {
      continue;
    }

    const existing = references.get(widget.data.datasetId) ?? {
      widgetIds: new Set<string>(),
      fields: new Set<string>(),
    };

    existing.widgetIds.add(widget.id);
    for (const field of collectWidgetDatasetFields(widget)) {
      existing.fields.add(field);
    }

    references.set(widget.data.datasetId, existing);
  }

  return [...references.entries()]
    .map(([datasetId, value]) => ({
      datasetId,
      widgetIds: [...value.widgetIds].sort(),
      fields: [...value.fields].sort(),
    }))
    .sort((left, right) => left.datasetId.localeCompare(right.datasetId));
}

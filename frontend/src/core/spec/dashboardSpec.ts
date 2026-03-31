export interface DashboardMeta {
  title: string;
  description?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardIntent {
  type: "executive_summary" | "workshop_prototype";
  audience: "executive" | "client_demo";
  industry: string;
  scenario?: string;
}

export interface DashboardTheme {
  id: string;
}

export interface DashboardTimeRange {
  start: string;
  end: string;
  granularity: "month" | "quarter";
}

export interface DashboardDataContext {
  mode: "mock";
  timeRange: DashboardTimeRange;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
}

export interface KpiInlineData {
  value: number;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  prefix?: string;
  caption?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetDataRef {
  source: "inline";
  payload: KpiInlineData;
}

export interface KpiChartSpec {
  type: "kpi";
}

export interface WidgetSpec {
  id: string;
  position: WidgetPosition;
  title: string;
  subtitle?: string;
  chart: KpiChartSpec;
  data: WidgetDataRef;
}

export interface DashboardSpec {
  id: string;
  specVersion: "1.0";
  meta: DashboardMeta;
  intent: DashboardIntent;
  theme: DashboardTheme;
  dataContext: DashboardDataContext;
  layout: DashboardLayout;
  widgets: WidgetSpec[];
}

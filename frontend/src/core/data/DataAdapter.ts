import type { KpiInlineData, LineInlineData, WidgetSpec } from "../spec/dashboardSpec";

export interface DataAdapter {
  getKpiData(widget: WidgetSpec): KpiInlineData;
  getLineData(widget: WidgetSpec): LineInlineData;
}

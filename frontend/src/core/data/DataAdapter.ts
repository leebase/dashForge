import type { KpiInlineData, WidgetSpec } from "../spec/dashboardSpec";

export interface DataAdapter {
  getKpiData(widget: WidgetSpec): KpiInlineData;
}

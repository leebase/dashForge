import type { DataAdapter } from "./DataAdapter";
import type { KpiInlineData, WidgetSpec } from "../spec/dashboardSpec";

export class StaticDataAdapter implements DataAdapter {
  getKpiData(widget: WidgetSpec): KpiInlineData {
    return widget.data.payload;
  }
}

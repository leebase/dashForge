import type { DataAdapter } from "./DataAdapter";
import type {
  KpiInlineData,
  LineInlineData,
  WidgetSpec,
} from "../spec/dashboardSpec";

function isKpiPayload(payload: WidgetSpec["data"]["payload"]): payload is KpiInlineData {
  return "value" in payload;
}

function isLinePayload(
  payload: WidgetSpec["data"]["payload"],
): payload is LineInlineData {
  return "points" in payload;
}

export class StaticDataAdapter implements DataAdapter {
  getKpiData(widget: WidgetSpec): KpiInlineData {
    if (!isKpiPayload(widget.data.payload)) {
      throw new Error(`Widget ${widget.id} does not contain KPI data.`);
    }

    return widget.data.payload;
  }

  getLineData(widget: WidgetSpec): LineInlineData {
    if (!isLinePayload(widget.data.payload)) {
      throw new Error(`Widget ${widget.id} does not contain line-series data.`);
    }

    return widget.data.payload;
  }
}

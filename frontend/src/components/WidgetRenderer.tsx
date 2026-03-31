import type { DataAdapter } from "../core/data/DataAdapter";
import type { WidgetSpec } from "../core/spec/dashboardSpec";
import { DashboardBox } from "./DashboardBox";
import { LineChart } from "./charts/LineChart";
import { KpiCard } from "./widgets/KpiCard";

interface WidgetRendererProps {
  adapter: DataAdapter;
  widget: WidgetSpec;
}

export function WidgetRenderer({ adapter, widget }: WidgetRendererProps) {
  if (widget.chart.type === "kpi") {
    return (
      <DashboardBox subtitle={widget.subtitle} title={widget.title}>
        <KpiCard data={adapter.getKpiData(widget)} />
      </DashboardBox>
    );
  }

  if (widget.chart.type === "line") {
    return (
      <DashboardBox subtitle={widget.subtitle} title={widget.title}>
        <LineChart
          data={adapter.getLineData(widget)}
          smooth={widget.chart.smooth}
          title={widget.title}
        />
      </DashboardBox>
    );
  }

  return (
    <DashboardBox state="error" subtitle={widget.subtitle} title={widget.title} />
  );
}

import type { DataAdapter } from "../core/data/DataAdapter";
import type { WidgetSpec } from "../core/spec/dashboardSpec";
import { DashboardBox } from "./DashboardBox";
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

  return (
    <DashboardBox state="error" subtitle={widget.subtitle} title={widget.title} />
  );
}

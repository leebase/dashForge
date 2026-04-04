import { useEffect, useState } from "react";

import type { DataAdapter } from "../core/data/DataAdapter";
import {
  resolveBarWidgetData,
  resolveDonutWidgetData,
  resolveGaugeWidgetData,
  resolveKpiWidgetData,
  resolveLineWidgetData,
  resolveSparklineWidgetData,
  resolveStackedBarWidgetData,
  resolveTableWidgetData,
} from "../core/data/widgetDataResolvers";
import {
  isBarWidget,
  isDonutWidget,
  isGaugeWidget,
  isKpiWidget,
  isLineWidget,
  isSparklineWidget,
  isStackedBarWidget,
  isTableWidget,
  type DashboardSpec,
  type WidgetSpec,
} from "../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../core/theme/themeRegistry";
import { ChartAnnotationLayer } from "../features/presenter/ChartAnnotationLayer";
import { DashboardBox } from "./DashboardBox";
import { BarChart } from "./charts/BarChart";
import { DonutChart } from "./charts/DonutChart";
import { GaugeChart } from "./charts/GaugeChart";
import { LineChart } from "./charts/LineChart";
import { SparklineChart } from "./charts/SparklineChart";
import { StackedBarChart } from "./charts/StackedBarChart";
import { TableChart } from "./charts/TableChart";
import { KpiCard } from "./widgets/KpiCard";

interface WidgetRendererProps {
  adapter: DataAdapter;
  presentation?: {
    isDimmed?: boolean;
    isHighlighted?: boolean;
    showAnnotationLayer?: boolean;
  };
  spec: DashboardSpec;
  theme: ResolvedDashboardTheme;
  widget: WidgetSpec;
}

type WidgetState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "kpi"; data: Awaited<ReturnType<typeof resolveKpiWidgetData>> }
  | { status: "line"; data: Awaited<ReturnType<typeof resolveLineWidgetData>> }
  | { status: "bar"; data: Awaited<ReturnType<typeof resolveBarWidgetData>> }
  | {
      status: "stacked_bar";
      data: Awaited<ReturnType<typeof resolveStackedBarWidgetData>>;
    }
  | { status: "donut"; data: Awaited<ReturnType<typeof resolveDonutWidgetData>> }
  | { status: "table"; data: Awaited<ReturnType<typeof resolveTableWidgetData>> }
  | {
      status: "sparkline";
      data: Awaited<ReturnType<typeof resolveSparklineWidgetData>>;
    }
  | { status: "gauge"; data: Awaited<ReturnType<typeof resolveGaugeWidgetData>> };

function hasNoChartPoints(points: Array<{ value: number }>): boolean {
  return points.length === 0;
}

export function WidgetRenderer({
  adapter,
  presentation,
  spec,
  theme,
  widget,
}: WidgetRendererProps) {
  const [state, setState] = useState<WidgetState>({ status: "loading" });
  const widgetId = widget.id;
  const boxClassName = [
    presentation?.isDimmed ? "dashboard-box--dimmed" : "",
    presentation?.isHighlighted ? "dashboard-box--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    let isCancelled = false;
    setState({ status: "loading" });

    async function loadWidgetData() {
      try {
        if (isKpiWidget(widget)) {
          const data = await resolveKpiWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "kpi", data });
          }
          return;
        }

        if (isLineWidget(widget)) {
          const data = await resolveLineWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "line", data });
          }
          return;
        }

        if (isBarWidget(widget)) {
          const data = await resolveBarWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "bar", data });
          }
          return;
        }

        if (isStackedBarWidget(widget)) {
          const data = await resolveStackedBarWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "stacked_bar", data });
          }
          return;
        }

        if (isDonutWidget(widget)) {
          const data = await resolveDonutWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "donut", data });
          }
          return;
        }

        if (isTableWidget(widget)) {
          const data = await resolveTableWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "table", data });
          }
          return;
        }

        if (isSparklineWidget(widget)) {
          const data = await resolveSparklineWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "sparkline", data });
          }
          return;
        }

        if (isGaugeWidget(widget)) {
          const data = await resolveGaugeWidgetData(adapter, widget);
          if (!isCancelled) {
            setState({ status: "gauge", data });
          }
          return;
        }

        if (!isCancelled) {
          setState({
            status: "error",
            error: `Widget ${widgetId} uses an unsupported chart type.`,
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : `Widget ${widgetId} could not be rendered.`,
          });
        }
      }
    }

    void loadWidgetData();

    return () => {
      isCancelled = true;
    };
  }, [adapter, spec, widget, widgetId]);

  if (state.status === "loading") {
    return (
      <DashboardBox
        className={boxClassName || undefined}
        state="loading"
        subtitle={widget.subtitle}
        title={widget.title}
      />
    );
  }

  if (state.status === "error") {
    return (
      <DashboardBox
        className={boxClassName || undefined}
        message={state.error}
        state="error"
        subtitle={widget.subtitle}
        title={widget.title}
      />
    );
  }

  if (state.status === "kpi") {
    return (
      <DashboardBox
        className={boxClassName || undefined}
        subtitle={widget.subtitle}
        title={widget.title}
      >
        <>
          <KpiCard data={state.data} />
          {presentation?.showAnnotationLayer ? (
            <ChartAnnotationLayer widget={widget} />
          ) : null}
        </>
      </DashboardBox>
    );
  }

  if (
    (state.status === "line" ||
      state.status === "bar" ||
      state.status === "stacked_bar" ||
      state.status === "donut" ||
      state.status === "sparkline") &&
    hasNoChartPoints(state.data.points)
  ) {
    return (
      <DashboardBox
        className={boxClassName || undefined}
        state="empty"
        subtitle={widget.subtitle}
        title={widget.title}
      />
    );
  }

  if (state.status === "table" && state.data.rows.length === 0) {
    return (
      <DashboardBox
        className={boxClassName || undefined}
        state="empty"
        subtitle={widget.subtitle}
        title={widget.title}
      />
    );
  }

  return (
    <DashboardBox
      bodyClassName={state.status === "table" ? "dashboard-box__body--table" : undefined}
      className={boxClassName || undefined}
      subtitle={widget.subtitle}
      title={widget.title}
    >
      {state.status === "line" ? (
        <LineChart
          annotations={widget.annotations}
          data={state.data}
          options={widget.chart.options}
          theme={theme}
          title={widget.title}
        />
      ) : null}
      {state.status === "bar" ? (
        <BarChart
          annotations={widget.annotations}
          data={state.data}
          options={widget.chart.options}
          theme={theme}
          title={widget.title}
        />
      ) : null}
      {state.status === "stacked_bar" ? (
        <StackedBarChart
          annotations={widget.annotations}
          data={state.data}
          options={widget.chart.options}
          theme={theme}
          title={widget.title}
        />
      ) : null}
      {state.status === "donut" ? (
        <DonutChart
          data={state.data}
          options={widget.chart.options}
          theme={theme}
          title={widget.title}
        />
      ) : null}
      {state.status === "table" ? <TableChart data={state.data} /> : null}
      {state.status === "sparkline" ? (
        <SparklineChart
          data={state.data}
          options={widget.chart.options}
          theme={theme}
          title={widget.title}
        />
      ) : null}
      {state.status === "gauge" ? (
        <GaugeChart
          data={state.data}
          options={widget.chart.options}
          theme={theme}
          title={widget.title}
        />
      ) : null}
      {presentation?.showAnnotationLayer ? <ChartAnnotationLayer widget={widget} /> : null}
    </DashboardBox>
  );
}

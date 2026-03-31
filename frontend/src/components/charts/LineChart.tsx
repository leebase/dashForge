import type { EChartsOption } from "echarts";

import type { LineInlineData } from "../../core/spec/dashboardSpec";
import { EChartCanvas } from "./EChartCanvas";

interface LineChartProps {
  data: LineInlineData;
  smooth?: boolean;
  title: string;
}

export function buildLineChartOption(
  data: LineInlineData,
  smooth = false,
): EChartsOption {
  return {
    animationDuration: 400,
    grid: {
      top: 18,
      right: 12,
      bottom: 24,
      left: 36,
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.points.map((point) => point.label),
      axisLine: {
        lineStyle: { color: "#bda995" },
      },
      axisLabel: {
        color: "#6b5744",
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#6b5744",
      },
      splitLine: {
        lineStyle: { color: "rgba(74, 54, 32, 0.08)" },
      },
    },
    series: [
      {
        type: "line",
        smooth,
        data: data.points.map((point) => point.value),
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: "#a34b2a",
        },
        areaStyle: {
          color: "rgba(163, 75, 42, 0.12)",
        },
      },
    ],
  };
}

export function LineChart({ data, smooth, title }: LineChartProps) {
  return (
    <div className="line-chart">
      <EChartCanvas option={buildLineChartOption(data, smooth)} title={title} />
      {data.caption ? <div className="line-chart__caption">{data.caption}</div> : null}
    </div>
  );
}

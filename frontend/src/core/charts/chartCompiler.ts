import type { EChartsCoreOption } from "echarts/core";

import type {
  AnnotationSpec,
  ChartOptions,
  GaugeInlineData,
  LineInlineData,
  ThresholdSpec,
} from "../spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../theme/themeRegistry";

interface CompileCartesianChartInput {
  data: LineInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  annotations?: AnnotationSpec[];
  smooth?: boolean;
  showArea?: boolean;
  showAxes?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  compact?: boolean;
}

interface CompileGaugeChartInput {
  data: GaugeInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
}

function uniqueLabels(data: LineInlineData): string[] {
  return [...new Set(data.points.map((point) => point.label))];
}

function groupSeries(data: LineInlineData) {
  const labels = uniqueLabels(data);
  const seriesNames = [
    ...new Set(data.points.map((point) => point.series ?? data.seriesLabel ?? "Series 1")),
  ];

  return {
    labels,
    series: seriesNames.map((seriesName) => ({
      name: seriesName,
      values: labels.map((label) => {
        const match = data.points.find(
          (point) =>
            point.label === label &&
            (point.series ?? data.seriesLabel ?? "Series 1") === seriesName,
        );

        return match?.value ?? 0;
      }),
    })),
  };
}

function buildThresholdLines(
  thresholds: readonly ThresholdSpec[] | undefined,
  annotations: readonly AnnotationSpec[] | undefined,
  theme: ResolvedDashboardTheme,
) {
  const thresholdLines =
    thresholds?.map((threshold) => ({
      name: threshold.label,
      yAxis: threshold.value,
      lineStyle: {
        color: threshold.color ?? theme.chart.warning,
        type: "dashed",
      },
      label: {
        formatter: threshold.label,
        color: theme.chart.mutedText,
      },
    })) ?? [];

  const annotationLines =
    annotations
      ?.filter(
        (annotation): annotation is AnnotationSpec & { value: number } =>
          annotation.type === "reference_line" && typeof annotation.value === "number",
      )
      .map((annotation) => ({
        name: annotation.label,
        yAxis: annotation.value,
        lineStyle: {
          color: annotation.color ?? theme.chart.danger,
          type: annotation.style ?? "solid",
        },
        label: {
          formatter: annotation.label,
          color: theme.chart.mutedText,
        },
      })) ?? [];

  const lines = [...thresholdLines, ...annotationLines];

  if (!lines.length) {
    return undefined;
  }

  return {
    symbol: "none",
    data: lines,
  };
}

function baseTooltip(
  theme: ResolvedDashboardTheme,
  enabled = true,
  trigger: "axis" | "item" = "axis",
) {
  if (!enabled) {
    return { show: false };
  }

  return {
    trigger,
    backgroundColor: theme.chart.tooltipBackground,
    borderColor: theme.chart.tooltipBorder,
    textStyle: {
      color: theme.chart.text,
    },
  };
}

function baseGrid(compact = false) {
  return compact
    ? { top: 8, right: 8, bottom: 8, left: 8 }
    : { top: 18, right: 12, bottom: 24, left: 36 };
}

function buildCartesianOption({
  data,
  theme,
  options,
  annotations,
  smooth = false,
  showArea = false,
  showAxes = true,
  horizontal = false,
  stacked = false,
  compact = false,
}: CompileCartesianChartInput): EChartsCoreOption {
  const grouped = groupSeries(data);
  const markLine = buildThresholdLines(options?.thresholds, annotations, theme);
  const legendVisible =
    options?.showLegend ?? (grouped.series.length > 1 || Boolean(data.seriesLabel));

  const baseAxisLabel = {
    color: theme.chart.axis,
    show: showAxes,
  };
  const baseSplitLine = {
    show: options?.showGrid ?? showAxes,
    lineStyle: { color: theme.chart.gridLine },
  };

  const categoryAxis = {
    type: "category",
    data: grouped.labels,
    boundaryGap: horizontal ? true : !smooth,
    axisLine: {
      show: showAxes,
      lineStyle: { color: theme.chart.axis },
    },
    axisTick: { show: showAxes },
    axisLabel: baseAxisLabel,
  };

  const valueAxis = {
    type: "value",
    min: options?.min,
    max: options?.max,
    axisLabel: baseAxisLabel,
    axisLine: {
      show: false,
    },
    splitLine: baseSplitLine,
  };

  const seriesType = smooth || showArea || compact ? "line" : "bar";

  return {
    animationDuration: 400,
    color: theme.chart.palette,
    legend: legendVisible
      ? {
          top: compact ? 0 : 4,
          textStyle: {
            color: theme.chart.mutedText,
          },
        }
      : undefined,
    grid: baseGrid(compact),
    tooltip: baseTooltip(theme, options?.showTooltip ?? !compact),
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: grouped.series.map((series, index) => ({
      type: seriesType,
      name: series.name,
      data: series.values,
      smooth: seriesType === "line" ? smooth : undefined,
      stack: stacked ? "total" : undefined,
      showSymbol: compact ? false : seriesType === "line" ? false : undefined,
      barMaxWidth: seriesType === "bar" ? 28 : undefined,
      lineStyle:
        seriesType === "line"
          ? {
              width: compact ? 2 : 3,
              color: theme.chart.palette[index % theme.chart.palette.length],
            }
          : undefined,
      itemStyle:
        seriesType === "bar"
          ? {
              color: theme.chart.palette[index % theme.chart.palette.length],
              borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
            }
          : undefined,
      areaStyle:
        showArea && seriesType === "line"
          ? {
              color: theme.chart.accentSoft,
            }
          : undefined,
      markLine,
    })),
  };
}

function buildGaugeAxisColors(
  thresholds: readonly ThresholdSpec[] | undefined,
  min: number,
  max: number,
  theme: ResolvedDashboardTheme,
) {
  const safeMax = Math.max(max, min + 1);
  const safeThresholds = thresholds?.slice().sort((left, right) => left.value - right.value) ?? [];

  if (!safeThresholds.length) {
    return [
      [0.7, theme.chart.good],
      [0.9, theme.chart.warning],
      [1, theme.chart.danger],
    ];
  }

  return safeThresholds.map((threshold, index) => [
    Math.min(1, Math.max(0, (threshold.value - min) / (safeMax - min))),
    threshold.color ??
      (index === 0 ? theme.chart.good : index === safeThresholds.length - 1
        ? theme.chart.danger
        : theme.chart.warning),
  ]);
}

export function compileLineChartOption(
  data: LineInlineData,
  theme: ResolvedDashboardTheme,
  options?: ChartOptions,
  annotations?: AnnotationSpec[],
): EChartsCoreOption {
  return buildCartesianOption({
    data,
    theme,
    options,
    annotations,
    smooth: options?.smooth ?? false,
    showArea: true,
  });
}

export function compileBarChartOption(
  data: LineInlineData,
  theme: ResolvedDashboardTheme,
  options?: ChartOptions,
  annotations?: AnnotationSpec[],
): EChartsCoreOption {
  return buildCartesianOption({
    data,
    theme,
    options,
    annotations,
    horizontal: options?.horizontal ?? false,
  });
}

export function compileStackedBarChartOption(
  data: LineInlineData,
  theme: ResolvedDashboardTheme,
  options?: ChartOptions,
  annotations?: AnnotationSpec[],
): EChartsCoreOption {
  return buildCartesianOption({
    data,
    theme,
    options,
    annotations,
    horizontal: options?.horizontal ?? false,
    stacked: true,
  });
}

export function compileDonutChartOption(
  data: LineInlineData,
  theme: ResolvedDashboardTheme,
  options?: ChartOptions,
): EChartsCoreOption {
  const legendVisible = options?.showLegend ?? true;

  return {
    animationDuration: 400,
    color: theme.chart.palette,
    tooltip: baseTooltip(theme, options?.showTooltip ?? true, "item"),
    legend: legendVisible
      ? {
          bottom: 0,
          textStyle: {
            color: theme.chart.mutedText,
          },
        }
      : undefined,
    series: [
      {
        type: "pie",
        radius: [`${options?.innerRadius ?? 52}%`, "76%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: theme.chart.surface,
          borderWidth: 4,
        },
        label: {
          color: theme.chart.text,
          formatter: "{b}",
        },
        data: data.points.map((point) => ({
          name: point.label,
          value: point.value,
        })),
      },
    ],
  };
}

export function compileSparklineChartOption(
  data: LineInlineData,
  theme: ResolvedDashboardTheme,
  options?: ChartOptions,
): EChartsCoreOption {
  return buildCartesianOption({
    data,
    theme,
    options,
    smooth: true,
    compact: true,
    showAxes: false,
  });
}

export function compileGaugeChartOption({
  data,
  theme,
  options,
}: CompileGaugeChartInput): EChartsCoreOption {
  const min = data.min ?? options?.min ?? 0;
  const max =
    data.max ??
    options?.max ??
    Math.max(data.target ?? 0, data.value, 100);
  const displayValue = `${data.prefix ?? ""}${data.value}${data.suffix ?? ""}`;

  return {
    animationDuration: 400,
    tooltip: baseTooltip(theme, options?.showTooltip ?? true, "item"),
    series: [
      {
        type: "gauge",
        min,
        max,
        progress: {
          show: true,
          width: 16,
        },
        axisLine: {
          lineStyle: {
            width: 16,
            color: buildGaugeAxisColors(options?.thresholds, min, max, theme),
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: theme.chart.mutedText,
          distance: 18,
        },
        pointer: {
          itemStyle: {
            color: theme.chart.text,
          },
        },
        anchor: {
          show: true,
          size: 10,
          itemStyle: {
            color: theme.chart.text,
          },
        },
        detail: {
          valueAnimation: false,
          color: theme.chart.text,
          fontSize: 22,
          formatter: () => displayValue,
          offsetCenter: [0, "56%"],
        },
        title: {
          color: theme.chart.mutedText,
          fontSize: 12,
          offsetCenter: [0, "84%"],
        },
        data: [
          {
            value: data.value,
            name: data.label ?? "Current",
          },
        ],
      },
    ],
  };
}

import { describe, expect, it } from "vitest";

import {
  compileDonutChartOption,
  compileGaugeChartOption,
  compileStackedBarChartOption,
} from "./chartCompiler";
import { resolveDashboardTheme } from "../theme/themeRegistry";

describe("chartCompiler", () => {
  it("builds stacked bar series with shared stack keys", () => {
    const theme = resolveDashboardTheme({ id: "dark-executive" });
    const option = compileStackedBarChartOption(
      {
        points: [
          { label: "Analytics", series: "Adoption", value: 78 },
          { label: "Analytics", series: "Activation", value: 64 },
          { label: "Security", series: "Adoption", value: 76 },
          { label: "Security", series: "Activation", value: 63 },
        ],
      },
      theme,
      { showLegend: true },
    );

    expect(option.legend).toBeTruthy();
    expect(option.series).toMatchObject([
      { name: "Adoption", stack: "total", data: [78, 76] },
      { name: "Activation", stack: "total", data: [64, 63] },
    ]);
  });

  it("derives gauge ranges and threshold colors from the shared options", () => {
    const theme = resolveDashboardTheme({ id: "light-professional" });
    const option = compileGaugeChartOption({
      data: {
        value: 121.8,
        min: 80,
        max: 130,
        suffix: "%",
      },
      theme,
      options: {
        thresholds: [
          { value: 100, label: "Plan" },
          { value: 115, label: "Stretch" },
          { value: 130, label: "Ceiling" },
        ],
      },
    });

    expect(option.series).toMatchObject([
      {
        min: 80,
        max: 130,
        data: [{ value: 121.8 }],
      },
    ]);
  });

  it("honors donut legend and tooltip visibility flags", () => {
    const theme = resolveDashboardTheme({ id: "dark-executive" });
    const option = compileDonutChartOption(
      {
        points: [
          { label: "SMB", value: 0 },
          { label: "Enterprise", value: 0 },
        ],
      },
      theme,
      {
        showLegend: false,
        showTooltip: false,
      },
    );

    expect(option.legend).toBeUndefined();
    expect(option.tooltip).toMatchObject({ show: false });
  });

  it("honors gauge tooltip visibility flags", () => {
    const theme = resolveDashboardTheme({ id: "light-professional" });
    const option = compileGaugeChartOption({
      data: {
        value: 96,
        min: 80,
        max: 110,
      },
      theme,
      options: {
        showTooltip: false,
      },
    });

    expect(option.tooltip).toMatchObject({ show: false });
  });
});

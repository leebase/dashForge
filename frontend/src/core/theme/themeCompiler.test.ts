import { describe, expect, it } from "vitest";

import { compileChartTheme } from "./themeCompiler";

describe("compileChartTheme", () => {
  it("derives chart-facing theme output from merged tokens", () => {
    const compiled = compileChartTheme({
      colorScheme: "dark",
      seed: {
        palette: ["#4fa3ff", "#4fd7a6", "#ffc661"],
        surface: "#102437",
        tooltipBackground: "rgba(237, 244, 250, 0.92)",
        tooltipBorder: "rgba(79, 163, 255, 0.3)",
        axis: "#9cb1c3",
        gridLine: "rgba(156, 177, 195, 0.14)",
        text: "#edf4fa",
        mutedText: "#9cb1c3",
      },
      tokens: {
        "--df-accent": "#88c0ff",
        "--df-accent-soft": "rgba(136, 192, 255, 0.16)",
        "--df-surface-strong": "#112b40",
        "--df-border": "rgba(151, 182, 204, 0.18)",
        "--df-text": "#edf4fa",
        "--df-muted": "#9cb1c3",
        "--df-chart-grid": "rgba(156, 177, 195, 0.2)",
        "--df-good": "#4fd7a6",
        "--df-warning": "#ffc661",
        "--df-danger": "#ff7e6b",
      },
    });

    expect(compiled.palette[0]).toBe("#88c0ff");
    expect(compiled.surface).toBe("#112b40");
    expect(compiled.gridLine).toBe("rgba(156, 177, 195, 0.2)");
    expect(compiled.accentSoft).toBe("rgba(136, 192, 255, 0.16)");
  });
});

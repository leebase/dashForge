import { describe, expect, it } from "vitest";

import { resolveDashboardTheme } from "./themeRegistry";

describe("resolveDashboardTheme", () => {
  it("merges theme overrides into css variables and chart output", () => {
    const theme = resolveDashboardTheme({
      id: "dark-executive",
      overrides: {
        "--df-accent": "#88c0ff",
        "--df-surface-strong": "#112b40",
      },
    });

    expect(theme.cssVariables).toMatchObject({
      "--df-accent": "#88c0ff",
      "--df-surface-strong": "#112b40",
    });
    expect(theme.chart.palette[0]).toBe("#88c0ff");
    expect(theme.chart.surface).toBe("#112b40");
  });
});

import { describe, expect, it } from "vitest";

import { compileLineChartOption } from "../../core/charts/chartCompiler";
import { resolveDashboardTheme } from "../../core/theme/themeRegistry";

describe("compileLineChartOption", () => {
  it("maps inline points into echarts axes and series values", () => {
    const theme = resolveDashboardTheme({ id: "light-professional" });
    const option = compileLineChartOption(
      {
        points: [
          { label: "Jan", value: 91 },
          { label: "Feb", value: 94 },
        ],
        seriesLabel: "Occupancy",
      },
      theme,
    );

    expect(option.xAxis).toMatchObject({
      data: ["Jan", "Feb"],
    });
    expect(option.series).toMatchObject([
      {
        data: [91, 94],
      },
    ]);
  });
});

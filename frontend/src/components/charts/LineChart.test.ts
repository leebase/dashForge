import { describe, expect, it } from "vitest";

import { buildLineChartOption } from "./LineChart";

describe("buildLineChartOption", () => {
  it("maps inline points into echarts axes and series values", () => {
    const option = buildLineChartOption({
      points: [
        { label: "Jan", value: 91 },
        { label: "Feb", value: 94 },
      ],
      seriesLabel: "Occupancy",
    });

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

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { KpiCard } from "./KpiCard";

afterEach(() => {
  cleanup();
});

describe("KpiCard", () => {
  it("renders point gaps without borrowing the KPI value suffix", () => {
    render(
      <KpiCard
        data={{
          value: 75.2,
          delta: -8.8,
          deltaLabel: "pp vs 84% target",
          suffix: "%",
        }}
        deltaFormat="absolute"
        deltaPositive="good"
      />,
    );

    expect(screen.getByText("75.2%")).toBeInTheDocument();
    const delta = screen.getByText("-8.8 pp vs 84% target");
    expect(delta).toHaveAttribute("data-tone", "bad");
  });

  it("renders relative gaps as percent and applies lower-is-better semantics", () => {
    render(
      <KpiCard
        data={{
          value: 13.1,
          delta: 64,
          deltaLabel: "vs 8.0h budget",
          suffix: "h",
        }}
        deltaFormat="percent"
        deltaPositive="bad"
      />,
    );

    expect(screen.getByText("13.1h")).toBeInTheDocument();
    const delta = screen.getByText("+64% vs 8.0h budget");
    expect(delta).toHaveAttribute("data-tone", "bad");
  });
});

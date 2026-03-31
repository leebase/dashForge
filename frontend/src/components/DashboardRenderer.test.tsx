import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardRenderer } from "./DashboardRenderer";
import { StaticDataAdapter } from "../core/data/StaticDataAdapter";
import { sampleDashboard } from "../sample/sampleDashboard";

describe("DashboardRenderer", () => {
  it("renders a validated KPI widget from spec data", () => {
    render(
      <DashboardRenderer
        adapter={new StaticDataAdapter()}
        spec={sampleDashboard}
      />,
    );

    expect(screen.getByText("Readmission Rate")).toBeInTheDocument();
    expect(screen.getByText("9.8%")).toBeInTheDocument();
    expect(screen.getByText(/vs prior quarter/i)).toBeInTheDocument();
  });
});

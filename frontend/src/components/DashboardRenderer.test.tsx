import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardRenderer } from "./DashboardRenderer";
import { createDashboardDataAdapter } from "../core/data/createDashboardDataAdapter";
import { StaticDataAdapter } from "../core/data/StaticDataAdapter";
import { sampleDashboard } from "../sample/sampleDashboard";

afterEach(() => {
  cleanup();
});

describe("DashboardRenderer", () => {
  it("renders a validated dashboard from adapter-backed spec data", async () => {
    render(
      <DashboardRenderer
        adapter={StaticDataAdapter.fromDashboardSpec(sampleDashboard)}
        spec={sampleDashboard}
      />,
    );

    expect(screen.getByText("MRR")).toBeInTheDocument();
    expect(screen.getByText("Net Retention")).toBeInTheDocument();
    expect(screen.getByText("ARR Trend")).toBeInTheDocument();
    expect(screen.getByText("Feature Detail Table")).toBeInTheDocument();
    expect(await screen.findByText("$22.8M")).toBeInTheDocument();
    expect(await screen.findByText("Analytics")).toBeInTheDocument();
    expect(await screen.findByText("83%")).toBeInTheDocument();
  });

  it("renders non-empty zero-valued chart datasets as charts instead of empty states", async () => {
    const zeroBaselineDashboard = {
      ...sampleDashboard,
      id: "zero-baseline-dashboard",
      meta: {
        ...sampleDashboard.meta,
        title: "Zero Baseline Dashboard",
      },
      widgets: [
        {
          id: "zero-baseline-bar",
          position: { x: 0, y: 0, w: 6, h: 3 },
          title: "Zero Baseline",
          subtitle: "Legitimate all-zero periods",
          chart: {
            type: "bar" as const,
            intent: "comparison" as const,
            encoding: {
              x: {
                field: "month",
              },
              y: {
                field: "value",
              },
            },
          },
          data: {
            source: "inline" as const,
            payload: {
              points: [
                { label: "Jan", value: 0 },
                { label: "Feb", value: 0 },
                { label: "Mar", value: 0 },
              ],
            },
          },
        },
      ],
      narrative: undefined,
      filters: [],
    };

    render(
      <DashboardRenderer
        adapter={StaticDataAdapter.fromDashboardSpec(zeroBaselineDashboard)}
        spec={zeroBaselineDashboard}
      />,
    );

    expect(await screen.findByRole("img", { name: "Zero Baseline" })).toBeInTheDocument();
    expect(
      screen.queryByText("No data is available for this widget yet."),
    ).not.toBeInTheDocument();
  });

  it("renders the existing table widget through a hybrid live binding adapter", async () => {
    const hybridSpec = {
      ...sampleDashboard,
      dataContext: {
        ...sampleDashboard.dataContext,
        mode: "hybrid" as const,
        live: {
          bindings: {
            feature_adoption: {
              type: "rest" as const,
              connection: {
                url: "https://example.test/feature-adoption",
              },
              fieldMap: {
                feature: "capability",
                adoptionRate: "adoption",
                activationRate: "activation",
                supportTicketsPer100: "ticketsPer100",
              },
            },
          },
        },
      },
    };
    const resolved = createDashboardDataAdapter(hybridSpec, {
      fetcher: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [
          {
            capability: "Workflow Studio",
            adoption: 91,
            activation: 83,
            ticketsPer100: 6.2,
          },
        ],
      }),
    });

    expect(resolved).toMatchObject({ ok: true });
    if (!resolved.ok) {
      throw new Error("Hybrid adapter resolution unexpectedly failed.");
    }

    render(<DashboardRenderer adapter={resolved.adapter} spec={hybridSpec} />);

    expect(await screen.findByText("Workflow Studio")).toBeInTheDocument();
    expect(await screen.findByText("9100%")).toBeInTheDocument();
    expect(await screen.findByText("6.2")).toBeInTheDocument();
  });
});

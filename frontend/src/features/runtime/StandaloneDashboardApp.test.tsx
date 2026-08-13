import {
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DataAdapter } from "../../core/data/DataAdapter";
import { createDefaultStandaloneDashboardSpec } from "./standaloneDashboard";

const { dashboardRendererSpy } = vi.hoisted(() => ({
  dashboardRendererSpy: vi.fn(),
}));

vi.mock("../../components/DashboardRenderer", () => ({
  DashboardRenderer: ({
    adapter,
    presentation,
    spec,
  }: {
    adapter: DataAdapter;
    presentation?: { showAnnotationLayer?: boolean };
    spec: {
      meta: { title: string };
      intent: { industry: string; scenario?: string };
      dataContext: {
        mode: string;
        artifact?: { digest: string };
      };
    };
  }) => {
    dashboardRendererSpy({ adapter, presentation, spec });

    return (
      <section aria-label={`${spec.meta.title} dashboard`}>
        <p>Dashboard renderer mock</p>
        <p>{spec.dataContext.mode}</p>
        <p>{spec.intent.industry}</p>
        <p>{spec.intent.scenario ?? "missing-scenario"}</p>
        <p>{spec.dataContext.artifact?.digest ?? "missing-artifact"}</p>
      </section>
    );
  },
}));

import { StandaloneDashboardApp } from "./StandaloneDashboardApp";

describe("StandaloneDashboardApp", () => {
  afterEach(() => {
    cleanup();
    dashboardRendererSpy.mockClear();
    vi.restoreAllMocks();
  });

  it("renders controlled artifact evidence and citations through the shared runtime", async () => {
    const onOpenBuilder = vi.fn();

    render(<StandaloneDashboardApp onOpenBuilder={onOpenBuilder} />);

    const demoRoot = screen.getByTestId("idle-warehouse-waste-demo");
    expect(demoRoot).toHaveAttribute("data-demo", "idle-warehouse-waste");
    expect(demoRoot).toHaveAttribute("data-readiness", "controlled");
    expect(screen.getAllByText("Synthetic demo data")).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Controlled synthetic-data quality",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/approved curated pack and scenario/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390/i,
      ).length,
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("heading", { level: 1, name: /Idle Warehouse Waste/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("snowflakeCost:idle-warehouse-waste")).toBeInTheDocument();
    expect(
      screen.getByText("tpl.snowflakeCost.idle-warehouse-waste"),
    ).toBeInTheDocument();

    const recommendations = await screen.findByRole("region", {
      name: /prioritized recommendations/i,
    });
    expect(within(recommendations).getByText(/P0/i)).toBeInTheDocument();
    expect(
      within(recommendations).getByText(/owner validation/i),
    ).toBeInTheDocument();
    expect(
      within(recommendations).getByText(/directional until validated/i),
    ).toBeInTheDocument();
    expect(
      within(recommendations).getByText(/confirm finance reporting schedules/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/726/)).toBeInTheDocument();
    expect(screen.getAllByText(/dataset observation/i).length).toBeGreaterThan(0);

    expect(await screen.findByText("Dashboard renderer mock")).toBeInTheDocument();
    expect(screen.getByText("artifact")).toBeInTheDocument();
    expect(screen.getByText("snowflakeCost")).toBeInTheDocument();
    expect(screen.getByText("idle-warehouse-waste")).toBeInTheDocument();
    expect(
      screen.queryByText("Prompt The Dashboard, Then Refine The Story"),
    ).not.toBeInTheDocument();
    expect(dashboardRendererSpy).toHaveBeenCalledTimes(1);

    const renderCall = dashboardRendererSpy.mock.calls[0]?.[0];
    expect(renderCall?.presentation?.showAnnotationLayer).toBe(true);
    expect(renderCall?.spec.meta.title).toMatch(/Idle Warehouse Waste/i);
    expect(renderCall?.spec.dataContext.mode).toBe("artifact");
    expect(renderCall?.spec.dataContext.artifact?.digest).toBe(
      "sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390",
    );
    expect(renderCall?.adapter).toMatchObject({
      aggregate: expect.any(Function),
      getSchema: expect.any(Function),
      listDatasets: expect.any(Function),
      query: expect.any(Function),
    });

    expect(screen.getByText(/real\/client mode disabled/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /connect live snowflake/i }),
    ).not.toBeInTheDocument();

    const followUpButton = screen.getByTestId("same-day-executive-follow-up");
    await waitFor(() => expect(followUpButton).toBeEnabled());
    const popup = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: vi.fn(),
    };
    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue(popup as unknown as Window);

    fireEvent.click(followUpButton);

    expect(openSpy).toHaveBeenCalled();
    expect(popup.document.write).toHaveBeenCalledWith(
      expect.stringContaining("Synthetic demo data"),
    );
    expect(popup.document.write).toHaveBeenCalledWith(
      expect.stringContaining(
        "sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390",
      ),
    );
    const followUpStatus = screen.getByTestId("executive-follow-up-status");
    expect(followUpStatus).toHaveAttribute(
      "data-status",
      "executive-follow-up",
    );
    expect(followUpStatus).toHaveTextContent("Follow-up artifact is ready");

    const pdfButton = screen.getByTestId("dashboard-save-pdf");
    await waitFor(() => expect(pdfButton).toBeEnabled());
    fireEvent.click(pdfButton);

    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(popup.document.write).toHaveBeenLastCalledWith(
      expect.stringContaining("Evidence and provenance"),
    );
    expect(screen.getByTestId("dashboard-pdf-status")).toHaveTextContent(
      "Print view opened",
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Builder" }));
    expect(onOpenBuilder).toHaveBeenCalledTimes(1);
  });

  it("shows blocking quality and withholds the dashboard for an unverified digest", () => {
    const spec = createDefaultStandaloneDashboardSpec();
    if (!spec.dataContext.artifact) {
      throw new Error("Fixture artifact context is missing.");
    }
    spec.dataContext.artifact.digest = `sha256:${"f".repeat(64)}`;

    render(<StandaloneDashboardApp initialSpec={spec} />);

    expect(screen.getByTestId("idle-warehouse-waste-demo")).toHaveAttribute(
      "data-readiness",
      "blocking",
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Blocking synthetic-data quality",
      }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("alert")
        .some((alert) => /digest/i.test(alert.textContent ?? "")),
    ).toBe(true);
    expect(screen.queryByText("Dashboard renderer mock")).not.toBeInTheDocument();
    expect(screen.getByTestId("same-day-executive-follow-up")).toBeDisabled();
  });
});

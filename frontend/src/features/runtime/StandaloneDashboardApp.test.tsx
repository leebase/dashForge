import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DataAdapter } from "../../core/data/DataAdapter";

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
    spec: { meta: { title: string }; dataContext: { mode: string; mock?: { packId?: string; scenarioId?: string } } };
  }) => {
    dashboardRendererSpy({ adapter, presentation, spec });

    return (
      <section aria-label={`${spec.meta.title} dashboard`}>
        <p>Dashboard renderer mock</p>
        <p>{spec.dataContext.mode}</p>
        <p>{spec.dataContext.mock?.packId ?? "missing-pack"}</p>
        <p>{spec.dataContext.mock?.scenarioId ?? "missing-scenario"}</p>
      </section>
    );
  },
}));

import { StandaloneDashboardApp } from "./StandaloneDashboardApp";

describe("StandaloneDashboardApp", () => {
  afterEach(() => {
    dashboardRendererSpy.mockClear();
  });

  it("renders the ED throughput dashboard through the shared runtime seam", () => {
    const onOpenBuilder = vi.fn();

    render(<StandaloneDashboardApp onOpenBuilder={onOpenBuilder} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "ED Throughput Command View" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Emergency Department Throughput Crunch")).toBeInTheDocument();
    expect(screen.getByLabelText("ED Throughput Command View dashboard")).toBeInTheDocument();
    expect(screen.getByText("tpl.healthcare.ed-throughput-command")).toBeInTheDocument();
    expect(screen.getByText("6 registered")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Walkthrough spine for the command-view conversation",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("ED Throughput Command View dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard renderer mock")).toBeInTheDocument();
    expect(screen.getByText("mock")).toBeInTheDocument();
    expect(screen.getByText("healthcare")).toBeInTheDocument();
    expect(screen.getByText("ed-throughput-crunch")).toBeInTheDocument();
    expect(
      screen.queryByText("Prompt The Dashboard, Then Refine The Story"),
    ).not.toBeInTheDocument();
    expect(dashboardRendererSpy).toHaveBeenCalledTimes(1);

    const renderCall = dashboardRendererSpy.mock.calls[0]?.[0];

    expect(renderCall?.presentation?.showAnnotationLayer).toBe(true);
    expect(renderCall?.spec.meta.title).toBe("ED Throughput Command View");
    expect(renderCall?.spec.dataContext.mode).toBe("mock");
    expect(renderCall?.spec.dataContext.mock?.packId).toBe("healthcare");
    expect(renderCall?.spec.dataContext.mock?.scenarioId).toBe("ed-throughput-crunch");
    expect(renderCall?.adapter).toMatchObject({
      aggregate: expect.any(Function),
      getSchema: expect.any(Function),
      listDatasets: expect.any(Function),
      query: expect.any(Function),
    });

    fireEvent.click(screen.getByRole("button", { name: "Open Builder" }));

    expect(onOpenBuilder).toHaveBeenCalledTimes(1);
  });
});

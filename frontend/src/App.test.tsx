import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_STANDALONE_PACK_ID,
  DEFAULT_STANDALONE_SCENARIO_ID,
  DEFAULT_STANDALONE_TEMPLATE_ID,
} from "./features/runtime/standaloneDashboard";

const { builderShellSpy } = vi.hoisted(() => ({
  builderShellSpy: vi.fn(),
}));

vi.mock("./features/builder/BuilderShell", () => ({
  BuilderShell: ({ initialDraft }: { initialDraft?: { meta?: { title?: string }; dataContext?: { mock?: { packId?: string; scenarioId?: string } } } }) => {
    builderShellSpy({ initialDraft });

    return (
      <section aria-label="Builder shell mock">
        <p>Prompt The Dashboard, Then Refine The Story</p>
        <h2>{initialDraft?.meta?.title ?? "Missing title"}</h2>
        <dl>
          <div>
            <dt>Pack</dt>
            <dd>{initialDraft?.dataContext?.mock?.packId ?? "missing-pack"}</dd>
          </div>
          <div>
            <dt>Scenario</dt>
            <dd>{initialDraft?.dataContext?.mock?.scenarioId ?? "missing-scenario"}</dd>
          </div>
          <div>
            <dt>Template</dt>
            <dd>{DEFAULT_STANDALONE_TEMPLATE_ID}</dd>
          </div>
        </dl>
      </section>
    );
  },
}));

import App from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
    builderShellSpy.mockClear();
  });

  it("boots into the standalone ED throughput runtime and opens builder only on demand", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "ED Throughput Command View" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Emergency Department Throughput Crunch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Builder" })).toBeInTheDocument();
    expect(
      screen.queryByText("Prompt The Dashboard, Then Refine The Story"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Starter Dashboards")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Builder" }));

    expect(
      await screen.findByText("Prompt The Dashboard, Then Refine The Story"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "ED Throughput Command View" }),
    ).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_STANDALONE_PACK_ID)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_STANDALONE_SCENARIO_ID)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_STANDALONE_TEMPLATE_ID)).toBeInTheDocument();
    expect(builderShellSpy).toHaveBeenCalledTimes(1);

    const builderInitialDraft = builderShellSpy.mock.calls[0]?.[0]?.initialDraft;

    expect(builderInitialDraft?.meta?.title).toBe("ED Throughput Command View");
    expect(builderInitialDraft?.dataContext?.mock?.packId).toBe(DEFAULT_STANDALONE_PACK_ID);
    expect(builderInitialDraft?.dataContext?.mock?.scenarioId).toBe(DEFAULT_STANDALONE_SCENARIO_ID);
  });
});

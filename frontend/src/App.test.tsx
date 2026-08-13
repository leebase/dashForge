import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FIELD_SERVICE_SHOWCASE_PACK_ID,
  FIELD_SERVICE_SHOWCASE_SCENARIO_ID,
  FIELD_SERVICE_SHOWCASE_TEMPLATE_ID,
} from "./features/runtime/fieldServiceShowcaseDashboard";

const { builderShellSpy } = vi.hoisted(() => ({
  builderShellSpy: vi.fn(),
}));

vi.mock("./features/builder/BuilderShell", () => ({
  BuilderShell: ({ initialDraft }: { initialDraft?: { meta?: { title?: string }; intent?: { industry?: string; scenario?: string }; dataContext?: { mode?: string; artifact?: { digest?: string } } } }) => {
    builderShellSpy({ initialDraft });

    return (
      <section aria-label="Builder shell mock">
        <p>Prompt The Dashboard, Then Refine The Story</p>
        <h2>{initialDraft?.meta?.title ?? "Missing title"}</h2>
        <dl>
          <div>
            <dt>Pack</dt>
            <dd>{initialDraft?.intent?.industry ?? "missing-pack"}</dd>
          </div>
          <div>
            <dt>Scenario</dt>
            <dd>{initialDraft?.intent?.scenario ?? "missing-scenario"}</dd>
          </div>
          <div>
            <dt>Template</dt>
            <dd>{FIELD_SERVICE_SHOWCASE_TEMPLATE_ID}</dd>
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

  it("boots into the field-service showcase and opens builder only on demand", async () => {
    render(<App />);

    expect(screen.getByTestId("standalone-dashboard")).toBeInTheDocument();
    expect(screen.getAllByText("Synthetic demo data").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /First Heat Wave: Parts, Not People/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/repeat visits/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Open Builder" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /same-day executive follow-up/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Prompt The Dashboard, Then Refine The Story"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Starter Dashboards")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Builder" }));

    expect(
      await screen.findByText("Prompt The Dashboard, Then Refine The Story"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /First Heat Wave: Parts, Not People/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(FIELD_SERVICE_SHOWCASE_PACK_ID)).toBeInTheDocument();
    expect(screen.getByText(FIELD_SERVICE_SHOWCASE_SCENARIO_ID)).toBeInTheDocument();
    expect(screen.getByText(FIELD_SERVICE_SHOWCASE_TEMPLATE_ID)).toBeInTheDocument();
    expect(builderShellSpy).toHaveBeenCalledTimes(1);

    const builderInitialDraft = builderShellSpy.mock.calls[0]?.[0]?.initialDraft;

    expect(builderInitialDraft?.meta?.title).toMatch(
      /First Heat Wave: Parts, Not People/i,
    );
    expect(builderInitialDraft?.dataContext?.mode).toBe("artifact");
    expect(builderInitialDraft?.intent?.industry).toBe("fieldService");
    expect(builderInitialDraft?.intent?.scenario).toBe(
      "first-heat-wave-parts-bottleneck",
    );
    expect(builderInitialDraft?.dataContext?.artifact?.digest).toBe(
      "sha256:e886a65cea294553d38c0c42c7f2625e7f504b01fe5dd7bad809bb852fc727ab",
    );
    expect(FIELD_SERVICE_SHOWCASE_PACK_ID).toBe("fieldService");
    expect(FIELD_SERVICE_SHOWCASE_SCENARIO_ID).toBe(
      "first-heat-wave-parts-bottleneck",
    );
    expect(FIELD_SERVICE_SHOWCASE_TEMPLATE_ID).toBe(
      "tpl.fieldService.first-heat-wave-command",
    );
  });
});

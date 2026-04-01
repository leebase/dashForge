import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StaticDataAdapter } from "../../core/data/StaticDataAdapter";
import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { PresenterMode } from "./PresenterMode";

describe("PresenterMode", () => {
  it("steps through sections and emphasizes the active widgets", async () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    const adapter = StaticDataAdapter.fromDashboardSpec(draft);
    const hookWidget = draft.widgets.find(
      (widget) => widget.id === draft.narrative?.storyArc.hook.widgetIds[0],
    );
    const dimmedWidget = draft.widgets.find(
      (widget) => !draft.narrative?.storyArc.hook.widgetIds.includes(widget.id),
    );

    render(<PresenterMode adapter={adapter} spec={draft} />);

    expect(screen.getByText("Open with the signal")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryAllByText("Loading widget data...")).toHaveLength(0),
    );
    if (hookWidget) {
      expect(
        screen.getByRole("heading", { level: 2, name: hookWidget.title }).closest("section"),
      ).toHaveClass("dashboard-box--highlighted");
    }
    if (dimmedWidget) {
      expect(
        screen.getByRole("heading", { level: 2, name: dimmedWidget.title }).closest("section"),
      ).toHaveClass("dashboard-box--dimmed");
    }

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Establish the baseline")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { StoryArcEditor } from "./StoryArcEditor";

describe("StoryArcEditor", () => {
  it("writes executive summary and story section edits back into the shared draft", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    const onChangeDraft = vi.fn();

    render(<StoryArcEditor draft={draft} onChangeDraft={onChangeDraft} />);

    fireEvent.change(screen.getByDisplayValue(draft.narrative?.executiveSummary ?? ""), {
      target: { value: "Board-ready summary" },
    });

    const afterSummaryDraft = onChangeDraft.mock.lastCall?.[0];
    expect(afterSummaryDraft.narrative.executiveSummary).toBe("Board-ready summary");

    fireEvent.change(screen.getAllByDisplayValue("Open with the signal")[0], {
      target: { value: "Lead with churn risk" },
    });

    const afterHeadlineDraft = onChangeDraft.mock.lastCall?.[0];
    expect(afterHeadlineDraft.narrative.storyArc.hook.headline).toBe("Lead with churn risk");
  });
});

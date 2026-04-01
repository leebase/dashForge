import { describe, expect, it } from "vitest";

import { createFreshDraftForScenario } from "./templateInstantiation";
import {
  addWidgetToDraft,
  removeWidgetFromDraft,
  updateDraftLayout,
} from "./builderState";

describe("builderState", () => {
  it("inserts palette widgets with valid starter defaults", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    const nextDraft = addWidgetToDraft(draft, "stacked_bar");
    const inserted = nextDraft.widgets.at(-1);

    expect(inserted).toBeDefined();
    expect(inserted?.chart.type).toBe("stacked_bar");
    expect(inserted?.position.w).toBeGreaterThan(0);
    expect(inserted?.position.h).toBeGreaterThan(0);
  });

  it("writes layout changes back into widget position fields", () => {
    const draft = createFreshDraftForScenario("financial", "market-downturn");
    const widget = draft.widgets[0];
    const nextDraft = updateDraftLayout(draft, [
      {
        i: widget.id,
        x: 4,
        y: 2,
        w: 5,
        h: 4,
      },
    ]);

    expect(nextDraft.widgets[0].position).toMatchObject({
      x: 4,
      y: 2,
      w: 5,
      h: 4,
    });
  });

  it("removes widgets without disturbing the remaining draft", () => {
    const draft = createFreshDraftForScenario("healthcare", "flu-season");
    const nextDraft = removeWidgetFromDraft(draft, draft.widgets[0].id);

    expect(nextDraft.widgets).toHaveLength(draft.widgets.length - 1);
    expect(nextDraft.widgets.some((widget) => widget.id === draft.widgets[0].id)).toBe(
      false,
    );
    expect(nextDraft.narrative?.storyArc.hook.widgetIds).not.toContain(draft.widgets[0].id);
  });
});

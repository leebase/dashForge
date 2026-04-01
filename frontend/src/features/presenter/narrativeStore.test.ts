import { describe, expect, it } from "vitest";

import { validateDashboardSpec } from "../../core/spec/dashboardSchema";
import { removeWidgetFromDraft } from "../builder/builderState";
import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { syncPresenterDraft } from "./narrativeStore";

describe("narrativeStore", () => {
  it("hydrates a usable default narrative when a draft is missing one", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    const nextDraft = syncPresenterDraft({
      ...draft,
      narrative: undefined,
    });

    expect(nextDraft.narrative?.storyArc.hook.widgetIds.length).toBeGreaterThan(0);
    expect(nextDraft.narrative?.executiveSummary).toContain(draft.meta.title);
  });

  it("clamps story-arc widget references when widgets are removed", () => {
    const draft = createFreshDraftForScenario("financial", "market-downturn");
    const removedWidgetId = draft.narrative?.storyArc.hook.widgetIds[0];
    const nextDraft = removeWidgetFromDraft(draft, removedWidgetId ?? draft.widgets[0].id);

    expect(validateDashboardSpec(nextDraft)).toMatchObject({ ok: true });
    expect(nextDraft.narrative?.storyArc.hook.widgetIds).not.toContain(removedWidgetId);
  });
});

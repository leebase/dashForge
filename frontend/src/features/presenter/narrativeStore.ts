import type {
  DashboardSpec,
  NarrativeSection,
  NarrativeSpec,
  WidgetSpec,
} from "../../core/spec/dashboardSpec";

export const STORY_ARC_SECTION_KEYS = [
  "hook",
  "context",
  "tension",
  "resolution",
  "callToAction",
] as const;

export type StoryArcSectionKey = (typeof STORY_ARC_SECTION_KEYS)[number];

export const STORY_ARC_SECTION_LABELS: Record<StoryArcSectionKey, string> = {
  hook: "Hook",
  context: "Context",
  tension: "Tension",
  resolution: "Resolution",
  callToAction: "Call To Action",
};

const DEFAULT_SECTION_COPY: Record<
  StoryArcSectionKey,
  Pick<NarrativeSection, "headline" | "commentary" | "transitionText">
> = {
  hook: {
    headline: "Open with the signal",
    commentary: "Lead with the clearest proof point so the audience understands why this dashboard matters.",
    transitionText: "Now ground that signal in the business context.",
  },
  context: {
    headline: "Establish the baseline",
    commentary: "Use the supporting widgets to explain the operating backdrop behind the headline metric.",
    transitionText: "With the baseline in place, move to the pressure point.",
  },
  tension: {
    headline: "Show the tension",
    commentary: "Surface the gap, risk, or trend that needs executive attention right now.",
    transitionText: "From the pressure point, pivot to the recovery path.",
  },
  resolution: {
    headline: "Frame the response",
    commentary: "Highlight the signals that show where the team can stabilize or accelerate performance.",
    transitionText: "Finish with the decision you want the room to make.",
  },
  callToAction: {
    headline: "Land the ask",
    commentary: "Close with the outcome, priority, or next step the audience should commit to.",
    transitionText: "End on the decision and the expected impact.",
  },
};

function dedupeWidgetIds(widgetIds: readonly string[], widgets: readonly WidgetSpec[]) {
  const availableWidgetIds = new Set(widgets.map((widget) => widget.id));
  const nextIds: string[] = [];

  for (const widgetId of widgetIds) {
    if (!availableWidgetIds.has(widgetId) || nextIds.includes(widgetId)) {
      continue;
    }

    nextIds.push(widgetId);
  }

  return nextIds;
}

function resolveFallbackWidgetId(
  sectionIndex: number,
  widgets: readonly WidgetSpec[],
) {
  return widgets[Math.min(sectionIndex, Math.max(0, widgets.length - 1))]?.id;
}

function createDefaultSection(
  sectionKey: StoryArcSectionKey,
  widgets: readonly WidgetSpec[],
  sectionIndex: number,
): NarrativeSection {
  const fallbackWidgetId = resolveFallbackWidgetId(sectionIndex, widgets);
  const featuredWidget = widgets.find((widget) => widget.id === fallbackWidgetId) ?? widgets[0];
  const copy = DEFAULT_SECTION_COPY[sectionKey];

  return {
    headline: copy.headline,
    commentary: featuredWidget
      ? `${copy.commentary} Use ${featuredWidget.title} as the anchor visual for this part of the walkthrough.`
      : copy.commentary,
    widgetIds: fallbackWidgetId ? [fallbackWidgetId] : [],
    transitionText: copy.transitionText,
  };
}

function clampSection(
  sectionKey: StoryArcSectionKey,
  section: NarrativeSection | undefined,
  widgets: readonly WidgetSpec[],
  sectionIndex: number,
): NarrativeSection {
  const fallback = createDefaultSection(sectionKey, widgets, sectionIndex);
  const widgetIds = dedupeWidgetIds(section?.widgetIds ?? [], widgets);

  return {
    headline: section?.headline?.trim() ? section.headline : fallback.headline,
    commentary: section?.commentary?.trim() ? section.commentary : fallback.commentary,
    widgetIds: widgetIds.length > 0 ? widgetIds : fallback.widgetIds,
    transitionText:
      section?.transitionText !== undefined
        ? section.transitionText
        : fallback.transitionText,
  };
}

export function createDefaultNarrative(
  widgets: readonly WidgetSpec[],
  dashboardTitle = "Dashboard",
): NarrativeSpec | undefined {
  if (widgets.length === 0) {
    return undefined;
  }

  return {
    storyArc: {
      hook: createDefaultSection("hook", widgets, 0),
      context: createDefaultSection("context", widgets, 1),
      tension: createDefaultSection("tension", widgets, 2),
      resolution: createDefaultSection("resolution", widgets, 3),
      callToAction: createDefaultSection("callToAction", widgets, 4),
    },
    executiveSummary: `Use ${dashboardTitle} to move from the top-line signal into the root cause and the recommended response.`,
    presenterNotes: [
      "Open with the main client outcome before reading the chart.",
      "Pause after the tension section to confirm the room sees the same risk.",
      "Close by naming the decision this prototype is meant to support.",
    ],
  };
}

export function syncNarrativeWithWidgets(
  narrative: NarrativeSpec | undefined,
  widgets: readonly WidgetSpec[],
  dashboardTitle = "Dashboard",
): NarrativeSpec | undefined {
  if (widgets.length === 0) {
    return undefined;
  }

  const defaultNarrative = createDefaultNarrative(widgets, dashboardTitle);

  if (!defaultNarrative) {
    return undefined;
  }

  if (!narrative) {
    return defaultNarrative;
  }

  return {
    storyArc: {
      hook: clampSection("hook", narrative.storyArc.hook, widgets, 0),
      context: clampSection("context", narrative.storyArc.context, widgets, 1),
      tension: clampSection("tension", narrative.storyArc.tension, widgets, 2),
      resolution: clampSection("resolution", narrative.storyArc.resolution, widgets, 3),
      callToAction: clampSection(
        "callToAction",
        narrative.storyArc.callToAction,
        widgets,
        4,
      ),
    },
    executiveSummary:
      narrative.executiveSummary?.trim() || defaultNarrative.executiveSummary,
    presenterNotes:
      narrative.presenterNotes?.filter((note) => note.trim().length > 0) ??
      defaultNarrative.presenterNotes,
    audienceVariants: narrative.audienceVariants,
  };
}

export function syncPresenterDraft(spec: DashboardSpec): DashboardSpec {
  return {
    ...spec,
    narrative: syncNarrativeWithWidgets(spec.narrative, spec.widgets, spec.meta.title),
  };
}

export function getStoryArcSection(
  narrative: NarrativeSpec,
  sectionKey: StoryArcSectionKey,
) {
  return narrative.storyArc[sectionKey];
}

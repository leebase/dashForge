import type {
  DashboardSpec,
  NarrativeSpec,
  WidgetSpec,
} from "../../core/spec/dashboardSpec";
import {
  STORY_ARC_SECTION_KEYS,
  STORY_ARC_SECTION_LABELS,
  type StoryArcSectionKey,
  syncPresenterDraft,
} from "./narrativeStore";

interface StoryArcEditorProps {
  draft: DashboardSpec;
  onChangeDraft: (nextDraft: DashboardSpec) => void;
}

function updateNarrative(
  draft: DashboardSpec,
  onChangeDraft: (nextDraft: DashboardSpec) => void,
  updater: (narrative: NarrativeSpec) => NarrativeSpec,
) {
  const normalizedDraft = syncPresenterDraft(draft);

  if (!normalizedDraft.narrative) {
    return;
  }

  onChangeDraft({
    ...normalizedDraft,
    narrative: updater(normalizedDraft.narrative),
  });
}

function toggleWidgetAssignment(
  selectedWidgetIds: readonly string[],
  widgetId: string,
  checked: boolean,
  widgets: readonly WidgetSpec[],
) {
  const nextIds = checked
    ? [...selectedWidgetIds, widgetId]
    : selectedWidgetIds.filter((candidate) => candidate !== widgetId);

  if (nextIds.length > 0) {
    return nextIds;
  }

  return widgets[0] ? [widgets[0].id] : [];
}

export function StoryArcEditor({ draft, onChangeDraft }: StoryArcEditorProps) {
  const normalizedDraft = syncPresenterDraft(draft);
  const narrative = normalizedDraft.narrative;

  if (!narrative) {
    return (
      <section className="builder-panel" aria-labelledby="story-arc-title">
        <div className="builder-panel__header">
          <p className="eyebrow">Narrative</p>
          <h2 className="builder-panel__title" id="story-arc-title">
            Story Arc
          </h2>
        </div>
        <p className="builder-helper-copy">
          Add at least one widget to start authoring a presenter narrative.
        </p>
      </section>
    );
  }

  function updateSection(
    sectionKey: StoryArcSectionKey,
    updater: (section: NarrativeSpec["storyArc"][StoryArcSectionKey]) => NarrativeSpec["storyArc"][StoryArcSectionKey],
  ) {
    updateNarrative(normalizedDraft, onChangeDraft, (current) => ({
      ...current,
      storyArc: {
        ...current.storyArc,
        [sectionKey]: updater(current.storyArc[sectionKey]),
      },
    }));
  }

  return (
    <section className="builder-panel" aria-labelledby="story-arc-title">
      <div className="builder-panel__header">
        <p className="eyebrow">Narrative</p>
        <h2 className="builder-panel__title" id="story-arc-title">
          Story Arc Editor
        </h2>
      </div>

      <div className="story-arc-editor">
        <label className="form-field">
          <span>Executive Summary</span>
          <textarea
            onChange={(event) =>
              updateNarrative(normalizedDraft, onChangeDraft, (current) => ({
                ...current,
                executiveSummary: event.target.value,
              }))
            }
            rows={3}
            value={narrative.executiveSummary ?? ""}
          />
        </label>

        <label className="form-field">
          <span>Presenter Notes</span>
          <textarea
            onChange={(event) =>
              updateNarrative(normalizedDraft, onChangeDraft, (current) => ({
                ...current,
                presenterNotes: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              }))
            }
            rows={4}
            value={(narrative.presenterNotes ?? []).join("\n")}
          />
        </label>

        {STORY_ARC_SECTION_KEYS.map((sectionKey) => {
          const section = narrative.storyArc[sectionKey];

          return (
            <section className="story-arc-editor__section" key={sectionKey}>
              <h3>{STORY_ARC_SECTION_LABELS[sectionKey]}</h3>

              <label className="form-field">
                <span>Headline</span>
                <input
                  onChange={(event) =>
                    updateSection(sectionKey, (current) => ({
                      ...current,
                      headline: event.target.value,
                    }))
                  }
                  value={section.headline}
                />
              </label>

              <label className="form-field">
                <span>Commentary</span>
                <textarea
                  onChange={(event) =>
                    updateSection(sectionKey, (current) => ({
                      ...current,
                      commentary: event.target.value,
                    }))
                  }
                  rows={3}
                  value={section.commentary}
                />
              </label>

              <label className="form-field">
                <span>Transition Text</span>
                <textarea
                  onChange={(event) =>
                    updateSection(sectionKey, (current) => ({
                      ...current,
                      transitionText: event.target.value,
                    }))
                  }
                  rows={2}
                  value={section.transitionText ?? ""}
                />
              </label>

              <fieldset className="story-arc-editor__widget-list">
                <legend>Widget Assignments</legend>
                {normalizedDraft.widgets.map((widget) => (
                  <label className="checkbox-field" key={`${sectionKey}-${widget.id}`}>
                    <input
                      checked={section.widgetIds.includes(widget.id)}
                      onChange={(event) =>
                        updateSection(sectionKey, (current) => ({
                          ...current,
                          widgetIds: toggleWidgetAssignment(
                            current.widgetIds,
                            widget.id,
                            event.target.checked,
                            normalizedDraft.widgets,
                          ),
                        }))
                      }
                      type="checkbox"
                    />
                    <span>{widget.title}</span>
                  </label>
                ))}
              </fieldset>
            </section>
          );
        })}
      </div>
    </section>
  );
}

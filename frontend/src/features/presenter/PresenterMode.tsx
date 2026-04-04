import { useState, type Ref } from "react";

import { DashboardRenderer } from "../../components/DashboardRenderer";
import type { DataAdapter } from "../../core/data/DataAdapter";
import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import {
  STORY_ARC_SECTION_KEYS,
  STORY_ARC_SECTION_LABELS,
  type StoryArcSectionKey,
  syncPresenterDraft,
} from "./narrativeStore";

interface PresenterModeProps {
  adapter: DataAdapter;
  dashboardStageRef?: Ref<HTMLDivElement>;
  spec: DashboardSpec;
  showNarrativePanel?: boolean;
}

export function PresenterMode({
  adapter,
  dashboardStageRef,
  spec,
  showNarrativePanel = true,
}: PresenterModeProps) {
  const normalizedSpec = syncPresenterDraft(spec);
  const [activeSectionKey, setActiveSectionKey] = useState<StoryArcSectionKey>("hook");
  const narrative = normalizedSpec.narrative;

  if (!narrative) {
    return (
      <section className="presenter-mode presenter-mode--empty">
        <div className="builder-empty-state">
          Add widgets to the draft before opening presenter mode.
        </div>
      </section>
    );
  }

  const activeSectionIndex = STORY_ARC_SECTION_KEYS.indexOf(activeSectionKey);
  const activeSection = narrative.storyArc[activeSectionKey];

  return (
    <section
      className={showNarrativePanel ? "presenter-mode" : "presenter-mode presenter-mode--client"}
    >
      <div className="presenter-mode__stage" ref={dashboardStageRef}>
        <DashboardRenderer
          adapter={adapter}
          presentation={{
            activeWidgetIds: activeSection.widgetIds,
            dimInactiveWidgets: true,
            showAnnotationLayer: true,
          }}
          spec={normalizedSpec}
        />
      </div>

      {showNarrativePanel ? (
        <aside className="presenter-mode__panel">
          <p className="eyebrow">Presenter Mode</p>
          <h2>{activeSection.headline}</h2>

          {narrative.executiveSummary ? (
            <p className="presenter-mode__summary">{narrative.executiveSummary}</p>
          ) : null}

          <div className="presenter-mode__controls">
            <button
              className="button button--ghost"
              disabled={activeSectionIndex === 0}
              onClick={() => setActiveSectionKey(STORY_ARC_SECTION_KEYS[activeSectionIndex - 1])}
              type="button"
            >
              Previous
            </button>
            <button
              className="button button--secondary"
              disabled={activeSectionIndex === STORY_ARC_SECTION_KEYS.length - 1}
              onClick={() => setActiveSectionKey(STORY_ARC_SECTION_KEYS[activeSectionIndex + 1])}
              type="button"
            >
              Next
            </button>
          </div>

          <div className="presenter-mode__section-list" role="tablist" aria-label="Story sections">
            {STORY_ARC_SECTION_KEYS.map((sectionKey) => (
              <button
                aria-selected={sectionKey === activeSectionKey}
                className={
                  sectionKey === activeSectionKey
                    ? "presenter-mode__section-button presenter-mode__section-button--active"
                    : "presenter-mode__section-button"
                }
                key={sectionKey}
                onClick={() => setActiveSectionKey(sectionKey)}
                role="tab"
                type="button"
              >
                {STORY_ARC_SECTION_LABELS[sectionKey]}
              </button>
            ))}
          </div>

          <div className="presenter-mode__copy">
            <section>
              <h3>Commentary</h3>
              <p>{activeSection.commentary}</p>
            </section>

            {activeSection.transitionText ? (
              <section>
                <h3>Transition</h3>
                <p>{activeSection.transitionText}</p>
              </section>
            ) : null}

            <section>
              <h3>Active Widgets</h3>
              <p>{activeSection.widgetIds.join(", ")}</p>
            </section>

            {(narrative.presenterNotes ?? []).length > 0 ? (
              <section>
                <h3>Presenter Notes</h3>
                <ul className="presenter-mode__notes">
                  {(narrative.presenterNotes ?? []).map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </aside>
      ) : null}
    </section>
  );
}

import { useState } from "react";

import { DashboardRenderer } from "../../components/DashboardRenderer";
import { createDashboardDataAdapter } from "../../core/data/createDashboardDataAdapter";
import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import { resolveDashboardTheme } from "../../core/theme/themeRegistry";
import { getScenarioDefinition } from "../../mock-data/scenarioCatalog";
import {
  STORY_ARC_SECTION_KEYS,
  STORY_ARC_SECTION_LABELS,
  syncPresenterDraft,
} from "../presenter/narrativeStore";
import {
  DEFAULT_STANDALONE_TEMPLATE_ID,
  createDefaultStandaloneDashboardSpec,
} from "./standaloneDashboard";

interface StandaloneDashboardAppProps {
  initialSpec?: DashboardSpec;
  onOpenBuilder?: () => void;
}

function resolveInitialSpec(initialSpec?: DashboardSpec) {
  return syncPresenterDraft(initialSpec ?? createDefaultStandaloneDashboardSpec());
}

export function StandaloneDashboardApp({
  initialSpec,
  onOpenBuilder,
}: StandaloneDashboardAppProps = {}) {
  const [spec] = useState<DashboardSpec>(() => resolveInitialSpec(initialSpec));
  const theme = resolveDashboardTheme(spec.theme);
  const adapterResult = createDashboardDataAdapter(spec);
  const packId = spec.dataContext.mock?.packId ?? spec.intent.industry;
  const scenarioId = spec.dataContext.mock?.scenarioId ?? spec.intent.scenario ?? "";
  const scenario = getScenarioDefinition(packId, scenarioId);
  const datasetCount = scenario ? Object.keys(scenario.datasets).length : 0;
  const narrativeSections = spec.narrative
    ? STORY_ARC_SECTION_KEYS.map((sectionKey) => ({
        sectionKey,
        label: STORY_ARC_SECTION_LABELS[sectionKey],
        headline: spec.narrative!.storyArc[sectionKey].headline,
      }))
    : [];

  return (
    <main className="app-shell standalone-shell" style={theme.cssVariables}>
      <header className="hero standalone-hero">
        <div className="standalone-hero__copy">
          <p className="eyebrow">DashForge Standalone MVP</p>
          <h1>{spec.meta.title}</h1>
          <p className="lede">
            {scenario?.story ?? spec.meta.description ?? "Open directly into the current MVP scenario dashboard."}
          </p>
        </div>

        <section
          aria-label="Scenario package"
          className="standalone-summary"
        >
          <p className="eyebrow">Scenario Package</p>
          <h2>{scenario?.title ?? `${packId}:${scenarioId}`}</h2>
          <dl className="standalone-meta">
            <div>
              <dt>Scenario</dt>
              <dd>
                {packId}:{scenarioId}
              </dd>
            </div>
            <div>
              <dt>Template</dt>
              <dd>{DEFAULT_STANDALONE_TEMPLATE_ID}</dd>
            </div>
            <div>
              <dt>Datasets</dt>
              <dd>{datasetCount} registered</dd>
            </div>
          </dl>
          <p className="standalone-summary__note">
            Generated data, the registered starter template, and the shared DashboardSpec runtime
            all stay on one path here.
          </p>
          {onOpenBuilder ? (
            <button className="button" onClick={onOpenBuilder} type="button">
              Open Builder
            </button>
          ) : null}
        </section>
      </header>

      {narrativeSections.length > 0 ? (
        <section
          aria-labelledby="standalone-storyboard-title"
          className="standalone-storyboard"
        >
          <div className="standalone-storyboard__header">
            <p className="eyebrow">Narrative Arc</p>
            <h2 id="standalone-storyboard-title">
              Walkthrough spine for the command-view conversation
            </h2>
          </div>

          <ol className="standalone-storyboard__list">
            {narrativeSections.map((section) => (
              <li className="standalone-storyboard__item" key={section.sectionKey}>
                <span>{section.label}</span>
                <strong>{section.headline}</strong>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {adapterResult.ok ? (
        <section className="standalone-dashboard-stage">
          <DashboardRenderer
            adapter={adapterResult.adapter}
            presentation={{ showAnnotationLayer: true }}
            spec={spec}
          />
        </section>
      ) : (
        <section className="dashboard-box" aria-label="Standalone runtime error">
          <div className="dashboard-box__state" role="alert">
            {adapterResult.errors.join("; ")}
          </div>
        </section>
      )}
    </main>
  );
}

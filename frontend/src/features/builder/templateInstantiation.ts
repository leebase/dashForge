import { getDefaultTemplateForScenario, getTemplateById } from "../../mock-data/templateCatalog";
import type {
  DashboardSpec,
  WidgetSpec,
} from "../../core/spec/dashboardSpec";
import { createDefaultNarrative } from "../presenter/narrativeStore";
import { createPaletteWidget } from "./widgetFactories";

type TemplateWidgetBlueprint = {
  type: WidgetSpec["chart"]["type"];
  id: string;
  position: WidgetSpec["position"];
  title?: string;
  subtitle?: string;
  caption?: string;
  patch?: (widget: WidgetSpec) => WidgetSpec;
};

const TEMPLATE_BLUEPRINTS: Record<string, TemplateWidgetBlueprint[]> = {
  "healthcare:executive_summary": [
    { type: "kpi", id: "bed-occupancy-kpi", position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: "gauge", id: "readmission-gauge", position: { x: 3, y: 0, w: 3, h: 3 } },
    { type: "line", id: "patient-satisfaction-line", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "capacity-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "healthcare:operational_detail": [
    { type: "bar", id: "occupancy-bar", position: { x: 0, y: 0, w: 6, h: 3 } },
    { type: "sparkline", id: "occupancy-sparkline", position: { x: 6, y: 0, w: 3, h: 2 } },
    { type: "donut", id: "care-setting-donut", position: { x: 9, y: 0, w: 3, h: 3 } },
    { type: "table", id: "monthly-capacity-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "healthcare:risk_alert": [
    {
      type: "gauge",
      id: "readmission-risk-gauge",
      position: { x: 0, y: 0, w: 3, h: 3 },
      title: "Readmission Risk",
    },
    { type: "kpi", id: "occupancy-risk-kpi", position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: "bar", id: "occupancy-pressure-bar", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "line", id: "satisfaction-watch-line", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "financial:executive_summary": [
    { type: "kpi", id: "aum-kpi", position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: "gauge", id: "retention-gauge", position: { x: 3, y: 0, w: 3, h: 3 } },
    { type: "line", id: "aum-line", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "monthly-summary-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "financial:operational_detail": [
    { type: "donut", id: "advisor-mix-donut", position: { x: 0, y: 0, w: 4, h: 3 } },
    { type: "bar", id: "net-flow-bar", position: { x: 4, y: 0, w: 8, h: 3 } },
    { type: "sparkline", id: "retention-sparkline", position: { x: 0, y: 3, w: 3, h: 2 } },
    { type: "table", id: "ops-table", position: { x: 3, y: 3, w: 9, h: 3 } },
  ],
  "financial:risk_alert": [
    { type: "gauge", id: "retention-risk-gauge", position: { x: 0, y: 0, w: 3, h: 3 } },
    { type: "kpi", id: "aum-watch-kpi", position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: "bar", id: "flow-pressure-bar", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "donut", id: "concentration-donut", position: { x: 0, y: 3, w: 4, h: 3 } },
    { type: "table", id: "risk-table", position: { x: 4, y: 3, w: 8, h: 3 } },
  ],
  "saas:executive_summary": [
    { type: "kpi", id: "mrr-kpi", position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: "gauge", id: "churn-gauge", position: { x: 3, y: 0, w: 3, h: 3 } },
    { type: "line", id: "arr-line", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "feature-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "saas:operational_detail": [
    { type: "bar", id: "support-bar", position: { x: 0, y: 0, w: 6, h: 3 } },
    { type: "donut", id: "segment-donut", position: { x: 6, y: 0, w: 3, h: 3 } },
    { type: "sparkline", id: "mrr-sparkline", position: { x: 9, y: 0, w: 3, h: 2 } },
    { type: "table", id: "feature-detail-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "saas:risk_alert": [
    {
      type: "gauge",
      id: "churn-risk-gauge",
      position: { x: 0, y: 0, w: 3, h: 3 },
      title: "Churn Risk",
    },
    { type: "kpi", id: "mrr-watch-kpi", position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: "bar", id: "support-pressure-bar", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "risk-feature-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
};

function cloneWidget(widget: WidgetSpec): WidgetSpec {
  return JSON.parse(JSON.stringify(widget)) as WidgetSpec;
}

function resolveBlueprintKey(packId: string, intent: string) {
  return `${packId}:${intent}`;
}

function resolveScenarioId(allowedScenarioIds: string[], requestedScenarioId?: string) {
  if (requestedScenarioId && allowedScenarioIds.includes(requestedScenarioId)) {
    return requestedScenarioId;
  }

  return allowedScenarioIds[0];
}

function createTemplateWidgets(
  packId: string,
  blueprints: TemplateWidgetBlueprint[],
): WidgetSpec[] {
  return blueprints.map((blueprint) => {
    const starter = createPaletteWidget(
      packId,
      blueprint.type,
      blueprint.id,
      blueprint.position,
    );
    const withOverrides = {
      ...starter,
      position: blueprint.position,
      title: blueprint.title ?? starter.title,
      subtitle: blueprint.subtitle ?? starter.subtitle,
      caption: blueprint.caption ?? starter.caption,
    };

    return cloneWidget(blueprint.patch ? blueprint.patch(withOverrides) : withOverrides);
  });
}

export function instantiateTemplateSpec(
  templateId: string,
  options: {
    scenarioId?: string;
    author?: string;
  } = {},
): DashboardSpec {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Unknown template "${templateId}".`);
  }

  const scenarioId = resolveScenarioId(template.scenarioIds, options.scenarioId);
  const blueprintKey = resolveBlueprintKey(template.packId, template.intent);
  const blueprints = TEMPLATE_BLUEPRINTS[blueprintKey];

  if (!blueprints) {
    throw new Error(`No builder blueprint is registered for template "${templateId}".`);
  }

  const timestamp = new Date().toISOString();
  const widgets = createTemplateWidgets(template.packId, blueprints);

  return {
    id: `dashforge-${template.templateId.replaceAll(".", "-")}`,
    specVersion: "1.0",
    meta: {
      title: template.title,
      description: template.description,
      author: options.author ?? "DashForge Builder",
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [template.packId, scenarioId, template.intent, "sprint-6"],
    },
    intent: {
      type: template.intent,
      audience: template.audience,
      industry: template.packId,
      scenario: scenarioId,
    },
    theme: {
      id: template.intent === "executive_summary" ? "dark-executive" : "light-professional",
    },
    dataContext: {
      mode: "mock",
      mock: {
        packId: template.packId,
        scenarioId,
        seed: 8606,
      },
      timeRange: {
        start: "2025-01-01",
        end: "2025-12-31",
        granularity: "month",
      },
    },
    layout: {
      columns: 12,
      rowHeight: 88,
      breakpoints: {
        lg: 1200,
        md: 996,
        sm: 768,
      },
      compaction: "vertical",
    },
    widgets,
    narrative: createDefaultNarrative(widgets, template.title),
    filters: [],
  };
}

export function createFreshDraftForScenario(
  packId: string,
  scenarioId: string,
): DashboardSpec {
  const defaultTemplate = getDefaultTemplateForScenario(packId, scenarioId);

  if (!defaultTemplate) {
    throw new Error(
      `No default template is registered for ${packId}/${scenarioId}.`,
    );
  }

  return instantiateTemplateSpec(defaultTemplate.templateId, { scenarioId });
}

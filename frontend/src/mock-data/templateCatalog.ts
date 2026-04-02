import type {
  DashboardAudience,
  DashboardIntentType,
} from "../core/spec/dashboardSpec";

export interface TemplateCatalogEntry {
  templateId: string;
  packId: string;
  scenarioIds: string[];
  title: string;
  description: string;
  intent: DashboardIntentType;
  audience: DashboardAudience;
}

const templateCatalog: TemplateCatalogEntry[] = [
  {
    templateId: "tpl.healthcare.executive-summary",
    packId: "healthcare",
    scenarioIds: ["flu-season", "quality-improvement", "cost-pressure"],
    title: "Healthcare Executive Summary",
    description:
      "Operational and quality signal view for executive audiences with KPI and monthly trend context.",
    intent: "executive_summary",
    audience: "executive",
  },
  {
    templateId: "tpl.healthcare.operational-detail",
    packId: "healthcare",
    scenarioIds: ["flu-season", "quality-improvement", "cost-pressure"],
    title: "Healthcare Operational Detail",
    description:
      "Department-level and facility-level trend exploration for operators and analysts.",
    intent: "operational_detail",
    audience: "operator",
  },
  {
    templateId: "tpl.healthcare.risk-alert",
    packId: "healthcare",
    scenarioIds: ["flu-season", "cost-pressure"],
    title: "Healthcare Risk & Alert",
    description:
      "Anomaly and alert-focused template to quickly surface pressure points.",
    intent: "risk_alert",
    audience: "manager",
  },
  {
    templateId: "tpl.healthcare.ed-throughput-command",
    packId: "healthcare",
    scenarioIds: ["ed-throughput-crunch"],
    title: "ED Throughput Command View",
    description:
      "Focused operational view for emergency department throughput pressure and intervention priority.",
    intent: "risk_alert",
    audience: "client_demo",
  },
  {
    templateId: "tpl.financial.executive-summary",
    packId: "financial",
    scenarioIds: ["market-downturn", "growth-quarter", "advisor-attrition"],
    title: "Financial Executive Snapshot",
    description: "AUM, flows, and return pressure view for leadership discussion.",
    intent: "executive_summary",
    audience: "executive",
  },
  {
    templateId: "tpl.financial.operational-detail",
    packId: "financial",
    scenarioIds: ["advisor-attrition", "market-downturn", "growth-quarter"],
    title: "Financial Operations",
    description:
      "Advisor, segment, and fund-level distribution view for management review.",
    intent: "operational_detail",
    audience: "manager",
  },
  {
    templateId: "tpl.financial.risk-alert",
    packId: "financial",
    scenarioIds: ["market-downturn", "advisor-attrition"],
    title: "Financial Risk Watch",
    description:
      "Concentration, retention, and compliance risk surface for coaching intervention.",
    intent: "risk_alert",
    audience: "analyst",
  },
  {
    templateId: "tpl.saas.executive-summary",
    packId: "saas",
    scenarioIds: ["churn-crisis", "product-led-growth", "scaling-success"],
    title: "SaaS Executive Summary",
    description: "MRR/ARR, churn, and retention KPIs for leadership check-ins.",
    intent: "executive_summary",
    audience: "executive",
  },
  {
    templateId: "tpl.saas.operational-detail",
    packId: "saas",
    scenarioIds: ["product-led-growth", "scaling-success"],
    title: "SaaS Growth Operations",
    description:
      "Feature and segment-level adoption and expansion behavior for product operations.",
    intent: "operational_detail",
    audience: "manager",
  },
  {
    templateId: "tpl.saas.risk-alert",
    packId: "saas",
    scenarioIds: ["churn-crisis"],
    title: "SaaS Churn Risk",
    description:
      "Pricing and segment churn concentration with support pressure alerts.",
    intent: "risk_alert",
    audience: "analyst",
  },
];

interface TemplateCatalogQuery {
  packId?: string;
  scenarioId?: string;
  audience?: DashboardAudience;
  intent?: DashboardIntentType;
}

const DEFAULT_TEMPLATE_BY_SCENARIO: Record<string, string> = {
  "healthcare:flu-season": "tpl.healthcare.risk-alert",
  "healthcare:quality-improvement": "tpl.healthcare.executive-summary",
  "healthcare:cost-pressure": "tpl.healthcare.risk-alert",
  "healthcare:ed-throughput-crunch": "tpl.healthcare.ed-throughput-command",
  "financial:market-downturn": "tpl.financial.risk-alert",
  "financial:advisor-attrition": "tpl.financial.operational-detail",
  "financial:growth-quarter": "tpl.financial.executive-summary",
  "saas:churn-crisis": "tpl.saas.risk-alert",
  "saas:product-led-growth": "tpl.saas.operational-detail",
  "saas:scaling-success": "tpl.saas.executive-summary",
};

export function listTemplateCatalog(
  query: TemplateCatalogQuery = {},
): TemplateCatalogEntry[] {
  return templateCatalog.filter((entry) => {
    if (query.packId && entry.packId !== query.packId) {
      return false;
    }

    if (query.audience && entry.audience !== query.audience) {
      return false;
    }

    if (query.intent && entry.intent !== query.intent) {
      return false;
    }

    if (
      query.scenarioId &&
      entry.scenarioIds.length > 0 &&
      !entry.scenarioIds.includes(query.scenarioId)
    ) {
      return false;
    }

    return true;
  });
}

export function listTemplatesByPack(packId: string): TemplateCatalogEntry[] {
  return listTemplateCatalog({ packId });
}

export function listTemplatesByScenario(
  packId: string,
  scenarioId: string,
): TemplateCatalogEntry[] {
  return listTemplateCatalog({ packId, scenarioId });
}

export function getTemplateById(
  templateId: string,
): TemplateCatalogEntry | undefined {
  return templateCatalog.find((template) => template.templateId === templateId);
}

export function getDefaultTemplateForScenario(
  packId: string,
  scenarioId: string,
): TemplateCatalogEntry | undefined {
  const templateId = DEFAULT_TEMPLATE_BY_SCENARIO[`${packId}:${scenarioId}`];

  if (!templateId) {
    return undefined;
  }

  return getTemplateById(templateId);
}

export function getTemplatePackIds(): string[] {
  return [...new Set(templateCatalog.map((template) => template.packId))];
}

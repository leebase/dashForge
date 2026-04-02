import type {
  DashboardDataContext,
  DashboardMockContext,
} from "../core/spec/dashboardSpec";
import { healthcareCostPressureScenario } from "./healthcareCostPressure";
import { healthcareFluSeasonScenario } from "./healthcareFluSeason";
import { healthcareEdThroughputCrunchScenario } from "./healthcareEdThroughputCrunch";
import { financialAdvisorAttritionScenario } from "./financialAdvisorAttrition";
import { financialGrowthQuarterScenario } from "./financialGrowthQuarter";
import { financialMarketDownturnScenario } from "./financialMarketDownturn";
import type {
  MockScenario,
  ScenarioDatasetMap,
  ScenarioRow,
} from "./mockScenarioTypes";
import { healthcareQualityImprovementScenario } from "./healthcareQualityImprovement";
import { saasChurnCrisisScenario } from "./saasChurnCrisis";
import { saasProductLedGrowthScenario } from "./saasProductLedGrowth";
import { saasScalingSuccessScenario } from "./saasScalingSuccess";

export type { MockScenario, ScenarioDatasetMap, ScenarioRow } from "./mockScenarioTypes";

const scenarioCatalog = new Map<string, MockScenario>([
  [
    "healthcare:flu-season",
    {
      ...healthcareFluSeasonScenario,
      datasets: healthcareFluSeasonScenario.datasets,
    },
  ],
  [
    "healthcare:quality-improvement",
    {
      ...healthcareQualityImprovementScenario,
      datasets: healthcareQualityImprovementScenario.datasets,
    },
  ],
  [
    "healthcare:cost-pressure",
    {
      ...healthcareCostPressureScenario,
      datasets: healthcareCostPressureScenario.datasets,
    },
  ],
  [
    "healthcare:ed-throughput-crunch",
    {
      ...healthcareEdThroughputCrunchScenario,
      datasets: healthcareEdThroughputCrunchScenario.datasets,
    },
  ],
  [
    "financial:market-downturn",
    {
      ...financialMarketDownturnScenario,
      datasets: financialMarketDownturnScenario.datasets,
    },
  ],
  [
    "financial:advisor-attrition",
    {
      ...financialAdvisorAttritionScenario,
      datasets: financialAdvisorAttritionScenario.datasets,
    },
  ],
  [
    "financial:growth-quarter",
    {
      ...financialGrowthQuarterScenario,
      datasets: financialGrowthQuarterScenario.datasets,
    },
  ],
  [
    "saas:churn-crisis",
    {
      ...saasChurnCrisisScenario,
      datasets: saasChurnCrisisScenario.datasets,
    },
  ],
  [
    "saas:product-led-growth",
    {
      ...saasProductLedGrowthScenario,
      datasets: saasProductLedGrowthScenario.datasets,
    },
  ],
  [
    "saas:scaling-success",
    {
      ...saasScalingSuccessScenario,
      datasets: saasScalingSuccessScenario.datasets,
    },
  ],
]);

const PRIMARY_TREND_DATASET_BY_PACK: Record<string, string> = {
  healthcare: "monthly_capacity",
  financial: "monthly_summary",
  saas: "monthly_summary",
};

function getPrimaryTrendDatasetIdForScenario(packId: string, scenarioId?: string): string {
  if (packId === "healthcare" && scenarioId === "ed-throughput-crunch") {
    return "monthly_metrics";
  }

  return PRIMARY_TREND_DATASET_BY_PACK[packId];
}

function scenarioKey(packId: string, scenarioId: string) {
  return `${packId}:${scenarioId}`;
}

function requireMockContext(
  context: DashboardDataContext,
): DashboardMockContext {
  if (!context.mock) {
    throw new Error("Mock datasets require a dashboard mock data context.");
  }

  return context.mock;
}

function resolveScenario(context: DashboardDataContext): MockScenario {
  const mockContext = requireMockContext(context);
  const scenario = getScenarioDefinition(mockContext.packId, mockContext.scenarioId);

  if (!scenario) {
    throw new Error(
      `No mock scenario is registered for ${mockContext.packId}/${mockContext.scenarioId}.`,
    );
  }

  return scenario;
}

export function resolveScenarioDatasetMap(
  context: DashboardDataContext,
): ScenarioDatasetMap {
  return resolveScenario(context).datasets;
}

export function getPrimaryTrendDatasetId(packId: string): string {
  const datasetId = getPrimaryTrendDatasetIdForScenario(packId);

  if (!datasetId) {
    throw new Error(`No primary trend dataset is registered for pack "${packId}".`);
  }

  return datasetId;
}

export function listScenarioDatasets(
  context: DashboardDataContext,
): Array<{ datasetId: string; rowCount: number }> {
  const datasets = resolveScenarioDatasetMap(context);

  return Object.entries(datasets).map(([datasetId, rows]) => ({
    datasetId,
    rowCount: rows.length,
  }));
}

export function listRegisteredScenarios(): Array<{
  packId: string;
  scenarioId: string;
}> {
  return [...scenarioCatalog.values()].map((scenario) => ({
    packId: scenario.packId,
    scenarioId: scenario.scenarioId,
  }));
}

export function listScenariosByPack(packId: string): Array<{
  packId: string;
  scenarioId: string;
}> {
  return listRegisteredScenarios().filter((scenario) => scenario.packId === packId);
}

export function getPrimaryTrendDatasetIdByScenario(
  packId: string,
  scenarioId: string,
): string {
  return getPrimaryTrendDatasetIdForScenario(packId, scenarioId);
}

export function getScenarioDefinition(
  packId: string,
  scenarioId: string,
): MockScenario | undefined {
  return scenarioCatalog.get(scenarioKey(packId, scenarioId));
}

export function listScenarioDefinitionsByPack(packId: string): MockScenario[] {
  return [...scenarioCatalog.values()].filter((scenario) => scenario.packId === packId);
}

import financialPackJson from "./financialPack.json";
import type {
  MockScenario,
  ScenarioDatasetMap,
  ScenarioRow,
} from "./mockScenarioTypes";

type FinancialPreviewScenarioAsset = {
  scenarioId: string;
  seed: number;
  title: string;
  story: string;
  previewDatasets: ScenarioDatasetMap;
};

type FinancialPackAsset = {
  packId: string;
  scenarios: FinancialPreviewScenarioAsset[];
};

const financialPack = financialPackJson as FinancialPackAsset;
const scenarioById = new Map(
  financialPack.scenarios.map((scenario) => [scenario.scenarioId, scenario]),
);

export function getFinancialScenarioIds(): string[] {
  return financialPack.scenarios.map((scenario) => scenario.scenarioId);
}

export function getFinancialScenarioAsset(
  scenarioId: string,
): FinancialPreviewScenarioAsset {
  const scenario = scenarioById.get(scenarioId);

  if (!scenario) {
    throw new Error(`Unknown financial scenario "${scenarioId}".`);
  }

  return scenario;
}

export function buildFinancialPreviewScenario(
  scenarioId: string,
): MockScenario {
  const scenario = getFinancialScenarioAsset(scenarioId);

  return {
    packId: financialPack.packId,
    scenarioId: scenario.scenarioId,
    seed: scenario.seed,
    title: scenario.title,
    story: scenario.story,
    datasets: scenario.previewDatasets,
  };
}

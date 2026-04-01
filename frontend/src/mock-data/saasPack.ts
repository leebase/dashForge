import saasPackJson from "./saasPack.json";
import type {
  MockScenario,
  ScenarioDatasetMap,
  ScenarioRow,
} from "./mockScenarioTypes";

type SaasPreviewScenarioAsset = {
  scenarioId: string;
  seed: number;
  title: string;
  story: string;
  previewDatasets: ScenarioDatasetMap;
};

type SaasPackAsset = {
  packId: string;
  scenarios: SaasPreviewScenarioAsset[];
};

const saasPack = saasPackJson as SaasPackAsset;
const scenarioById = new Map(
  saasPack.scenarios.map((scenario) => [scenario.scenarioId, scenario]),
);

export function getSaasScenarioIds(): string[] {
  return saasPack.scenarios.map((scenario) => scenario.scenarioId);
}

export function getSaasScenarioAsset(scenarioId: string): SaasPreviewScenarioAsset {
  const scenario = scenarioById.get(scenarioId);

  if (!scenario) {
    throw new Error(`Unknown saas scenario "${scenarioId}".`);
  }

  return scenario;
}

export function buildSaasPreviewScenario(scenarioId: string): MockScenario {
  const scenario = getSaasScenarioAsset(scenarioId);

  return {
    packId: saasPack.packId,
    scenarioId: scenario.scenarioId,
    seed: scenario.seed,
    title: scenario.title,
    story: scenario.story,
    datasets: scenario.previewDatasets,
  };
}

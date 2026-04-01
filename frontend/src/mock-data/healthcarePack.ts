import healthcarePackJson from "./healthcarePack.json";
import type {
  MockScenario,
  ScenarioDatasetMap,
  ScenarioRow,
} from "./mockScenarioTypes";

interface HealthcarePreviewScenarioAsset {
  scenarioId: string;
  seed: number;
  title: string;
  story: string;
  previewDatasets: ScenarioDatasetMap;
}

interface HealthcarePackAsset {
  packId: string;
  scenarios: HealthcarePreviewScenarioAsset[];
}

const healthcarePack = healthcarePackJson as HealthcarePackAsset;
const scenarioById = new Map(
  healthcarePack.scenarios.map((scenario) => [scenario.scenarioId, scenario]),
);

export function getHealthcareScenarioIds(): string[] {
  return healthcarePack.scenarios.map((scenario) => scenario.scenarioId);
}

export function getHealthcareScenarioAsset(
  scenarioId: string,
): HealthcarePreviewScenarioAsset {
  const scenario = scenarioById.get(scenarioId);

  if (!scenario) {
    throw new Error(`Unknown healthcare scenario "${scenarioId}".`);
  }

  return scenario;
}

export function buildHealthcarePreviewScenario(scenarioId: string): MockScenario {
  const scenario = getHealthcareScenarioAsset(scenarioId);

  return {
    packId: healthcarePack.packId,
    scenarioId: scenario.scenarioId,
    seed: scenario.seed,
    title: scenario.title,
    story: scenario.story,
    datasets: scenario.previewDatasets,
  };
}

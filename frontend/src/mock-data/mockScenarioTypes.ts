export type ScenarioValue = number | string | undefined;
export type ScenarioRow = Record<string, ScenarioValue>;
export type ScenarioDatasetMap = Record<string, readonly ScenarioRow[]>;

export interface MockScenario {
  packId: string;
  scenarioId: string;
  seed: number;
  title: string;
  story: string;
  datasets: ScenarioDatasetMap;
}

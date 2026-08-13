import fieldServiceSnapshot from "../fixtures/dataforge/field-service-heat-wave-snapshot.json";
import type {
  MockScenario,
  ScenarioDatasetMap,
  ScenarioRow,
  ScenarioValue,
} from "./mockScenarioTypes";

interface FieldServiceSnapshot {
  packId: string;
  scenarioId: string;
  seed: number;
  datasets: Array<{
    datasetId: string;
    rows: Array<Record<string, unknown>>;
  }>;
}

const snapshot = fieldServiceSnapshot as FieldServiceSnapshot;

function toScenarioValue(value: unknown): ScenarioValue {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return String(value);
}

function toScenarioRows(
  rows: Array<Record<string, unknown>>,
): readonly ScenarioRow[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([field, value]) => [
        field,
        toScenarioValue(value),
      ]),
    ),
  );
}

const datasets: ScenarioDatasetMap = Object.fromEntries(
  snapshot.datasets.map((dataset) => [
    dataset.datasetId,
    toScenarioRows(dataset.rows),
  ]),
);

/** Deterministic DataForge preview used only while composing the dashboard. */
export const fieldServiceFirstHeatWaveScenario: MockScenario = {
  packId: snapshot.packId,
  scenarioId: snapshot.scenarioId,
  seed: snapshot.seed,
  title: "First Heat Wave: Parts, Not People",
  story:
    "Emergency demand exposed branch-specific van-stock constraints that are driving callbacks, missed SLAs, overtime, and margin leakage.",
  datasets,
};

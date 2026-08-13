import type { MockScenario, ScenarioDatasetMap, ScenarioRow, ScenarioValue } from "./mockScenarioTypes";
import idleWarehousePreviewData from "./snowflakeCostIdleWarehouseWastePreviewData.json";

interface IdleWarehouseProvenance {
  label: string;
  source: string;
  artifact: string;
  storyContract: string;
  useCaseId: string;
  readOnly: boolean;
}

interface PreviewScenarioAsset {
  packId: string;
  scenarioId: string;
  seed: number;
  title: string;
  story: string;
  provenance: IdleWarehouseProvenance;
  previewDatasets: Record<string, Array<Record<string, unknown>>>;
}

const previewData = idleWarehousePreviewData as PreviewScenarioAsset;

function toScenarioValue(value: unknown): ScenarioValue {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return String(value);
}

function toScenarioRows(rows: Array<Record<string, unknown>>): readonly ScenarioRow[] {
  return rows.map((row) => {
    const next: ScenarioRow = {};

    for (const [key, value] of Object.entries(row)) {
      next[key] = toScenarioValue(value);
    }

    return next;
  });
}

function toScenarioDatasetMap(
  datasets: Record<string, Array<Record<string, unknown>>>,
): ScenarioDatasetMap {
  return Object.fromEntries(
    Object.entries(datasets).map(([datasetId, rows]) => [datasetId, toScenarioRows(rows)]),
  );
}

/** Provenance-labeled dataForge story export consumed as a read-only demo snapshot. */
export const IDLE_WAREHOUSE_WASTE_PROVENANCE = previewData.provenance;

export const snowflakeCostIdleWarehouseWasteScenario: MockScenario = {
  packId: previewData.packId,
  scenarioId: previewData.scenarioId,
  seed: previewData.seed,
  title: previewData.title,
  story: previewData.story,
  datasets: toScenarioDatasetMap(previewData.previewDatasets),
};

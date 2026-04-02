import type { MockScenario } from "./mockScenarioTypes";
import edThroughputPreviewData from "./healthcareEdThroughputCrunchPreviewData.json";

interface PreviewScenarioAsset {
  packId: string;
  scenarioId: string;
  seed: number;
  title: string;
  story: string;
  previewDatasets: MockScenario["datasets"];
}

const previewData = edThroughputPreviewData as PreviewScenarioAsset;

export const healthcareEdThroughputCrunchScenario: MockScenario = {
  packId: previewData.packId,
  scenarioId: previewData.scenarioId,
  seed: previewData.seed,
  title: previewData.title,
  story: previewData.story,
  datasets: previewData.previewDatasets,
};

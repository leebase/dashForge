import type { DataAdapter } from "./DataAdapter";
import type {
  AggregateRequest,
  DataRequest,
  DataResult,
  DataSchema,
  DatasetInfo,
} from "./dataContract";

export class HybridDataAdapter implements DataAdapter {
  constructor(
    private readonly mockAdapter: DataAdapter,
    private readonly liveAdapter: DataAdapter,
    private readonly liveDatasetIds: ReadonlySet<string>,
  ) {}

  private resolveAdapter(datasetId: string): DataAdapter {
    return this.liveDatasetIds.has(datasetId) ? this.liveAdapter : this.mockAdapter;
  }

  query(request: DataRequest): Promise<DataResult> {
    return this.resolveAdapter(request.datasetId).query(request);
  }

  aggregate(request: AggregateRequest): Promise<DataResult> {
    return this.resolveAdapter(request.datasetId).aggregate(request);
  }

  getSchema(datasetId: string): Promise<DataSchema> {
    return this.resolveAdapter(datasetId).getSchema(datasetId);
  }

  async listDatasets(): Promise<DatasetInfo[]> {
    const [mockDatasets, liveDatasets] = await Promise.all([
      this.mockAdapter.listDatasets(),
      this.liveAdapter.listDatasets(),
    ]);
    const merged = new Map<string, DatasetInfo>();

    for (const dataset of mockDatasets) {
      if (!this.liveDatasetIds.has(dataset.datasetId)) {
        merged.set(dataset.datasetId, dataset);
      }
    }

    for (const dataset of liveDatasets) {
      if (this.liveDatasetIds.has(dataset.datasetId)) {
        merged.set(dataset.datasetId, dataset);
      }
    }

    return [...merged.values()].sort((left, right) =>
      left.datasetId.localeCompare(right.datasetId),
    );
  }
}

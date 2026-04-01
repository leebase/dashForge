import type { DataAdapter } from "./DataAdapter";
import type {
  DashboardDataContext,
  DashboardSpec,
} from "../spec/dashboardSpec";
import {
  aggregateRows,
  inferDataSchema,
  queryRows,
} from "./dataOperations";
import type {
  AggregateRequest,
  DataRequest,
  DataResult,
  DataSchema,
  DatasetInfo,
} from "./dataContract";
import {
  listScenarioDatasets,
  resolveScenarioDatasetMap,
  type ScenarioDatasetMap,
  type ScenarioRow,
} from "../../mock-data/scenarioCatalog";

export class StaticDataAdapter implements DataAdapter {
  constructor(
    private readonly datasets: ScenarioDatasetMap,
    private readonly datasetInfo: DatasetInfo[],
  ) {}

  static fromDataContext(context: DashboardDataContext): StaticDataAdapter {
    return new StaticDataAdapter(
      resolveScenarioDatasetMap(context),
      listScenarioDatasets(context),
    );
  }

  static fromDashboardSpec(spec: DashboardSpec): StaticDataAdapter {
    return StaticDataAdapter.fromDataContext(spec.dataContext);
  }

  private requireDataset(datasetId: string): readonly ScenarioRow[] {
    const rows = this.datasets[datasetId];

    if (!rows) {
      throw new Error(`Dataset ${datasetId} is not available in the static adapter.`);
    }

    return rows;
  }

  async query(request: DataRequest): Promise<DataResult> {
    return queryRows(this.requireDataset(request.datasetId), request);
  }

  async aggregate(request: AggregateRequest): Promise<DataResult> {
    return aggregateRows(this.requireDataset(request.datasetId), request);
  }

  async getSchema(datasetId: string): Promise<DataSchema> {
    return inferDataSchema(datasetId, this.requireDataset(datasetId));
  }

  async listDatasets(): Promise<DatasetInfo[]> {
    return [...this.datasetInfo];
  }
}

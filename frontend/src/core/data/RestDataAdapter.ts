import type { DataAdapter } from "./DataAdapter";
import type {
  AggregateRequest,
  DataRequest,
  DataResult,
  DataSchema,
  DatasetInfo,
} from "./dataContract";
import {
  aggregateRows,
  inferDataSchema,
  queryRows,
} from "./dataOperations";
import type { DataBinding } from "../spec/dashboardSpec";

type DataRow = Record<string, unknown>;

interface RestFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}

export type RestFetchLike = (
  input: string,
  init?: {
    headers?: Record<string, string>;
    method?: string;
  },
) => Promise<RestFetchResponse>;

interface RestDataAdapterOptions {
  fetcher?: RestFetchLike;
}

function defaultFetcher(): RestFetchLike {
  if (typeof fetch !== "function") {
    throw new Error("REST data bindings require fetch support in the current runtime.");
  }

  return fetch.bind(globalThis) as RestFetchLike;
}

function requireRestBinding(
  datasetId: string,
  bindings: Record<string, DataBinding>,
): DataBinding {
  const binding = bindings[datasetId];

  if (!binding) {
    throw new Error(`Dataset "${datasetId}" is missing a live binding.`);
  }

  if (binding.type !== "rest") {
    throw new Error(
      `Dataset "${datasetId}" uses unsupported live binding type "${binding.type}".`,
    );
  }

  if (!binding.connection.url?.trim()) {
    throw new Error(`Dataset "${datasetId}" requires a REST endpoint URL.`);
  }

  return binding;
}

function resolveResponsePath(payload: unknown, query?: string): unknown {
  if (!query?.trim()) {
    return payload;
  }

  return query
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (Array.isArray(current) || typeof current !== "object" || current === null) {
        return undefined;
      }

      return (current as Record<string, unknown>)[segment];
    }, payload);
}

function coerceRows(payload: unknown): DataRow[] {
  if (Array.isArray(payload)) {
    return payload.map((row, index) => {
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        throw new Error(`REST row ${index + 1} is not a JSON object.`);
      }

      return row as DataRow;
    });
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;

    for (const key of ["rows", "data", "items"]) {
      if (Array.isArray(record[key])) {
        return coerceRows(record[key]);
      }
    }
  }

  throw new Error("REST binding response must resolve to an array of row objects.");
}

function normalizeRows(rows: readonly DataRow[], binding: DataBinding): DataRow[] {
  return rows.map((row) => {
    const normalized: DataRow = {
      ...row,
    };

    for (const [dashboardField, sourceField] of Object.entries(binding.fieldMap)) {
      normalized[dashboardField] = row[sourceField];
    }

    return normalized;
  });
}

export class RestDataAdapter implements DataAdapter {
  private readonly fetchRowsByDataset = new Map<string, Promise<DataRow[]>>();

  constructor(
    private readonly bindings: Record<string, DataBinding>,
    private readonly fetcher: RestFetchLike = defaultFetcher(),
  ) {}

  static fromBindings(
    bindings: Record<string, DataBinding>,
    options: RestDataAdapterOptions = {},
  ): RestDataAdapter {
    return new RestDataAdapter(bindings, options.fetcher ?? defaultFetcher());
  }

  private async loadDatasetRows(datasetId: string): Promise<DataRow[]> {
    const binding = requireRestBinding(datasetId, this.bindings);
    const cachedRows = this.fetchRowsByDataset.get(datasetId);

    if (cachedRows) {
      return cachedRows;
    }

    const rowsPromise = (async () => {
      const response = await this.fetcher(binding.connection.url!, {
        headers: binding.connection.headers,
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(
          `Dataset "${datasetId}" REST request failed (${response.status} ${response.statusText}).`,
        );
      }

      const payload = await response.json();
      const resolvedPayload = resolveResponsePath(payload, binding.connection.query);

      return normalizeRows(coerceRows(resolvedPayload), binding);
    })();

    this.fetchRowsByDataset.set(datasetId, rowsPromise);

    try {
      return await rowsPromise;
    } catch (error) {
      this.fetchRowsByDataset.delete(datasetId);
      throw error;
    }
  }

  async query(request: DataRequest): Promise<DataResult> {
    return queryRows(await this.loadDatasetRows(request.datasetId), request);
  }

  async aggregate(request: AggregateRequest): Promise<DataResult> {
    return aggregateRows(await this.loadDatasetRows(request.datasetId), request);
  }

  async getSchema(datasetId: string): Promise<DataSchema> {
    return inferDataSchema(datasetId, await this.loadDatasetRows(datasetId));
  }

  async listDatasets(): Promise<DatasetInfo[]> {
    const datasets = await Promise.all(
      Object.keys(this.bindings).map(async (datasetId) => ({
        datasetId,
        rowCount: (await this.loadDatasetRows(datasetId)).length,
      })),
    );

    return datasets.sort((left, right) => left.datasetId.localeCompare(right.datasetId));
  }
}

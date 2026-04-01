import type { DataAdapter } from "./DataAdapter";
import { HybridDataAdapter } from "./HybridDataAdapter";
import { RestDataAdapter, type RestFetchLike } from "./RestDataAdapter";
import { StaticDataAdapter } from "./StaticDataAdapter";
import type {
  DashboardDatasetReference,
  DashboardDataMode,
  DashboardSpec,
  DataBinding,
} from "../spec/dashboardSpec";
import { collectDashboardDatasetReferences } from "../spec/dashboardSpec";

export interface DashboardDataBindingStatus {
  datasetId: string;
  widgetIds: string[];
  fields: string[];
  source: "mock" | "live";
  status: "ready" | "fallback" | "error";
  message: string;
}

export interface DashboardDataAdapterResolutionSuccess {
  ok: true;
  adapter: DataAdapter;
  datasets: DashboardDataBindingStatus[];
  mode: DashboardDataMode;
}

export interface DashboardDataAdapterResolutionFailure {
  ok: false;
  errors: string[];
  datasets: DashboardDataBindingStatus[];
  mode: DashboardDataMode;
}

export type DashboardDataAdapterResolution =
  | DashboardDataAdapterResolutionSuccess
  | DashboardDataAdapterResolutionFailure;

interface CreateDashboardDataAdapterOptions {
  fetcher?: RestFetchLike;
}

function validateLiveBinding(
  reference: DashboardDatasetReference,
  spec: DashboardSpec,
): string | null {
  const binding = spec.dataContext.live?.bindings[reference.datasetId];

  if (!binding) {
    return `Dataset "${reference.datasetId}" is missing a live binding.`;
  }

  if (binding.type !== "rest") {
    return `Dataset "${reference.datasetId}" uses unsupported live binding type "${binding.type}".`;
  }

  if (!binding.connection.url?.trim()) {
    return `Dataset "${reference.datasetId}" requires a REST endpoint URL.`;
  }

  const missingFields = findMissingRequiredFieldMappings(reference, binding);

  if (missingFields.length > 0) {
    return `Dataset "${reference.datasetId}" must map every required dashboard field after introducing renamed live fields. Missing mappings: ${missingFields.join(", ")}.`;
  }

  return null;
}

function findMissingRequiredFieldMappings(
  reference: DashboardDatasetReference,
  binding: DataBinding,
): string[] {
  const normalizedFieldMap = Object.fromEntries(
    Object.entries(binding.fieldMap).map(([dashboardField, sourceField]) => [
      dashboardField,
      sourceField.trim(),
    ]),
  );
  const usesRenamedFields = Object.entries(normalizedFieldMap).some(
    ([dashboardField, sourceField]) => sourceField.length > 0 && sourceField !== dashboardField,
  );

  if (!usesRenamedFields) {
    return [];
  }

  return reference.fields.filter((field) => !normalizedFieldMap[field]);
}

function buildDatasetStatuses(spec: DashboardSpec): DashboardDataBindingStatus[] {
  const datasetReferences = collectDashboardDatasetReferences(spec);

  return datasetReferences.map((reference) => {
    if (spec.dataContext.mode === "mock") {
      return {
        ...reference,
        source: "mock" as const,
        status: "ready" as const,
        message: "Using scenario-backed mock data.",
      };
    }

    const liveError = validateLiveBinding(reference, spec);

    if (spec.dataContext.mode === "live") {
      return liveError
        ? {
            ...reference,
            source: "live" as const,
            status: "error" as const,
            message: liveError,
          }
        : {
            ...reference,
            source: "live" as const,
            status: "ready" as const,
            message: "Live REST binding is ready.",
          };
    }

    if (spec.dataContext.live?.bindings[reference.datasetId]) {
      return liveError
        ? {
            ...reference,
            source: "live" as const,
            status: "error" as const,
            message: liveError,
          }
        : {
            ...reference,
            source: "live" as const,
            status: "ready" as const,
            message: "Hybrid mode will resolve this dataset from the live REST binding.",
          };
    }

    return {
      ...reference,
      source: "mock" as const,
      status: "fallback" as const,
      message: "Hybrid mode will fall back to the current mock scenario for this dataset.",
    };
  });
}

export function createDashboardDataAdapter(
  spec: DashboardSpec,
  options: CreateDashboardDataAdapterOptions = {},
): DashboardDataAdapterResolution {
  const datasets = buildDatasetStatuses(spec);
  const errors = datasets
    .filter((dataset) => dataset.status === "error")
    .map((dataset) => dataset.message);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      datasets,
      mode: spec.dataContext.mode,
    };
  }

  if (spec.dataContext.mode === "mock") {
    return {
      ok: true,
      adapter: StaticDataAdapter.fromDashboardSpec(spec),
      datasets,
      mode: spec.dataContext.mode,
    };
  }

  if (spec.dataContext.mode === "live") {
    return {
      ok: true,
      adapter: RestDataAdapter.fromBindings(spec.dataContext.live?.bindings ?? {}, options),
      datasets,
      mode: spec.dataContext.mode,
    };
  }

  const liveDatasetIds = new Set(
    datasets.filter((dataset) => dataset.source === "live").map((dataset) => dataset.datasetId),
  );

  if (liveDatasetIds.size === 0) {
    return {
      ok: true,
      adapter: StaticDataAdapter.fromDashboardSpec(spec),
      datasets,
      mode: spec.dataContext.mode,
    };
  }

  const liveBindings = Object.fromEntries(
    Object.entries(spec.dataContext.live?.bindings ?? {}).filter(([datasetId]) =>
      liveDatasetIds.has(datasetId),
    ),
  );

  return {
    ok: true,
    adapter: new HybridDataAdapter(
      StaticDataAdapter.fromDashboardSpec(spec),
      RestDataAdapter.fromBindings(liveBindings, options),
      liveDatasetIds,
    ),
    datasets,
    mode: spec.dataContext.mode,
  };
}

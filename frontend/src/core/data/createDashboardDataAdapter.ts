import type { DataAdapter } from "./DataAdapter";
import { HybridDataAdapter } from "./HybridDataAdapter";
import { RestDataAdapter, type RestFetchLike } from "./RestDataAdapter";
import { StaticDataAdapter } from "./StaticDataAdapter";
import {
  createSyntheticDataArtifactAdapter,
  type ArtifactQualityDisclosure,
  type VerifiedSyntheticDataArtifact,
} from "./SyntheticDataArtifactAdapter";
import { DEFAULT_VERIFIED_SYNTHETIC_DATA_ARTIFACTS } from "./verifiedSyntheticDataArtifacts";
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
  source: "mock" | "live" | "artifact";
  status: "ready" | "fallback" | "error";
  message: string;
}

export interface DashboardDataAdapterResolutionSuccess {
  ok: true;
  adapter: DataAdapter;
  datasets: DashboardDataBindingStatus[];
  mode: DashboardDataMode;
  artifact?: ArtifactQualityDisclosure;
}

export interface DashboardDataAdapterResolutionFailure {
  ok: false;
  errors: string[];
  datasets: DashboardDataBindingStatus[];
  mode: DashboardDataMode;
  artifact?: ArtifactQualityDisclosure;
}

export type DashboardDataAdapterResolution =
  | DashboardDataAdapterResolutionSuccess
  | DashboardDataAdapterResolutionFailure;

export interface CreateDashboardDataAdapterOptions {
  fetcher?: RestFetchLike;
  artifacts?: readonly VerifiedSyntheticDataArtifact[];
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

    if (spec.dataContext.mode === "artifact") {
      const binding = spec.dataContext.artifact?.bindings[reference.datasetId];
      const declaredDatasetIds = new Set(
        spec.dataContext.artifact?.snapshot.datasetIds ?? [],
      );
      const isReady =
        binding !== undefined &&
        declaredDatasetIds.has(binding.snapshotDatasetId);

      return {
        ...reference,
        source: "artifact" as const,
        status: isReady ? ("ready" as const) : ("error" as const),
        message: isReady
          ? "Using a verified synthetic-data snapshot binding."
          : `Dataset "${reference.datasetId}" is missing a declared artifact binding.`,
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
  if (spec.dataContext.mode === "artifact") {
    const manifest = spec.dataContext.artifact;
    if (!manifest) {
      return {
        ok: false,
        errors: ["Artifact data mode requires a synthetic-data artifact manifest."],
        datasets,
        mode: spec.dataContext.mode,
      };
    }

    const artifacts =
      options.artifacts ?? DEFAULT_VERIFIED_SYNTHETIC_DATA_ARTIFACTS;
    const artifact =
      artifacts.find((candidate) => candidate.verifiedDigest === manifest.digest) ??
      artifacts.find(
        (candidate) =>
          candidate.artifactType === manifest.artifactType &&
          candidate.payloadSchemaVersion === manifest.payloadSchemaVersion,
      ) ??
      (artifacts.length === 1 ? artifacts[0] : undefined);

    if (!artifact) {
      return {
        ok: false,
        errors: [
          `No trusted synthetic-data work package is staged for digest "${manifest.digest}".`,
        ],
        datasets: datasets.map((dataset) => ({
          ...dataset,
          status: "error",
          message: "Trusted artifact materialization is unavailable.",
        })),
        mode: spec.dataContext.mode,
      };
    }

    const artifactResolution = createSyntheticDataArtifactAdapter(spec, artifact);
    if (!artifactResolution.ok) {
      return {
        ok: false,
        errors: artifactResolution.errors,
        datasets: datasets.map((dataset) => ({
          ...dataset,
          status: "error",
          message: "Artifact readiness is blocked; review the input errors.",
        })),
        mode: spec.dataContext.mode,
        artifact: artifactResolution.disclosure,
      };
    }

    return {
      ok: true,
      adapter: artifactResolution.adapter,
      datasets,
      mode: spec.dataContext.mode,
      artifact: artifactResolution.disclosure,
    };
  }

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

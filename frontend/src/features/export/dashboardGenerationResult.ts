import Ajv from "ajv";

import { createDashboardDataAdapter } from "../../core/data/createDashboardDataAdapter";
import { validateMaterialClaimCoverage } from "../../core/data/SyntheticDataArtifactAdapter";
import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import { validateDashboardSpec } from "../../core/spec/dashboardSchema";

export const DASHBOARD_GENERATION_RESULT_SCHEMA_VERSION =
  "dashboard-generation-result/1.0" as const;
export const MEETING_DASHBOARD_PACKAGE_TYPE =
  "meeting-dashboard-package" as const;
export const MEETING_DASHBOARD_PACKAGE_SCHEMA_VERSION =
  "meeting-dashboard-package/1.0" as const;
export const DASHBOARD_EMPLOYEE_ID =
  "client-meeting-dashboard-builder" as const;

export interface DashboardGenerationResult {
  schemaVersion: typeof DASHBOARD_GENERATION_RESULT_SCHEMA_VERSION;
  employeeId: typeof DASHBOARD_EMPLOYEE_ID;
  runReference: string;
  generatedAt: string;
  status: "ready" | "blocked";
  inputReference: {
    artifactType: "synthetic-data-work-package";
    payloadSchemaVersion: "synthetic-data-work-package/1.0";
    artifactDigest: string;
  };
  output: {
    artifactType: typeof MEETING_DASHBOARD_PACKAGE_TYPE;
    payloadSchemaVersion: typeof MEETING_DASHBOARD_PACKAGE_SCHEMA_VERSION;
    dashboardSpec: DashboardSpec;
  };
  validation: {
    dashboardSpec: "passed" | "blocked";
    artifactBindings: "passed" | "blocked";
    claimCoverage: "passed" | "blocked";
    materialClaimCount: number;
  };
  errors: string[];
}

export interface DashboardGenerationResultValidation {
  ok: boolean;
  result?: DashboardGenerationResult;
  errors: string[];
}

const generationResultSchema = {
  type: "object",
  properties: {
    schemaVersion: { const: DASHBOARD_GENERATION_RESULT_SCHEMA_VERSION },
    employeeId: { const: DASHBOARD_EMPLOYEE_ID },
    runReference: { type: "string", minLength: 1 },
    generatedAt: { type: "string", minLength: 1 },
    status: { enum: ["ready", "blocked"] },
    inputReference: {
      type: "object",
      properties: {
        artifactType: { const: "synthetic-data-work-package" },
        payloadSchemaVersion: {
          const: "synthetic-data-work-package/1.0",
        },
        artifactDigest: {
          type: "string",
          pattern: "^sha256:[0-9a-f]{64}$",
        },
      },
      required: [
        "artifactType",
        "payloadSchemaVersion",
        "artifactDigest",
      ],
      additionalProperties: false,
    },
    output: {
      type: "object",
      properties: {
        artifactType: { const: MEETING_DASHBOARD_PACKAGE_TYPE },
        payloadSchemaVersion: {
          const: MEETING_DASHBOARD_PACKAGE_SCHEMA_VERSION,
        },
        dashboardSpec: { type: "object" },
      },
      required: ["artifactType", "payloadSchemaVersion", "dashboardSpec"],
      additionalProperties: false,
    },
    validation: {
      type: "object",
      properties: {
        dashboardSpec: { enum: ["passed", "blocked"] },
        artifactBindings: { enum: ["passed", "blocked"] },
        claimCoverage: { enum: ["passed", "blocked"] },
        materialClaimCount: { type: "integer", minimum: 0 },
      },
      required: [
        "dashboardSpec",
        "artifactBindings",
        "claimCoverage",
        "materialClaimCount",
      ],
      additionalProperties: false,
    },
    errors: { type: "array", items: { type: "string", minLength: 1 } },
  },
  required: [
    "schemaVersion",
    "employeeId",
    "runReference",
    "generatedAt",
    "status",
    "inputReference",
    "output",
    "validation",
    "errors",
  ],
  additionalProperties: false,
} as const;

const generationResultAjv = new Ajv({ allErrors: true, strict: false });
const validateGenerationResultShape = generationResultAjv.compile(
  generationResultSchema,
);

export function stableJsonStringify(value: unknown): string {
  const keys = new Set<string>();
  JSON.stringify(value, (key, nestedValue) => {
    keys.add(key);
    return nestedValue;
  });
  const serialized = JSON.stringify(value, [...keys].sort(), 2);
  if (serialized === undefined) {
    throw new Error("Value cannot be represented as deterministic JSON.");
  }
  return serialized;
}

export function createDashboardGenerationResult(
  spec: DashboardSpec,
  options: { runReference: string; generatedAt: string },
): DashboardGenerationResult {
  const specValidation = validateDashboardSpec(spec);
  const adapterResolution = specValidation.ok
    ? createDashboardDataAdapter(specValidation.spec)
    : undefined;
  const claimCoverage = specValidation.ok
    ? validateMaterialClaimCoverage(specValidation.spec)
    : { ok: false, errors: ["Dashboard spec validation must pass first."] };
  const errors = [
    ...(specValidation.ok ? [] : specValidation.errors),
    ...(adapterResolution && !adapterResolution.ok
      ? adapterResolution.errors
      : []),
    ...claimCoverage.errors,
  ];
  const uniqueErrors = [...new Set(errors)];
  const artifactContext = spec.dataContext.artifact;

  return {
    schemaVersion: DASHBOARD_GENERATION_RESULT_SCHEMA_VERSION,
    employeeId: DASHBOARD_EMPLOYEE_ID,
    runReference: options.runReference,
    generatedAt: options.generatedAt,
    status: uniqueErrors.length === 0 ? "ready" : "blocked",
    inputReference: {
      artifactType: "synthetic-data-work-package",
      payloadSchemaVersion: "synthetic-data-work-package/1.0",
      artifactDigest: artifactContext?.digest ?? "",
    },
    output: {
      artifactType: MEETING_DASHBOARD_PACKAGE_TYPE,
      payloadSchemaVersion: MEETING_DASHBOARD_PACKAGE_SCHEMA_VERSION,
      dashboardSpec: spec,
    },
    validation: {
      dashboardSpec: specValidation.ok ? "passed" : "blocked",
      artifactBindings: adapterResolution?.ok ? "passed" : "blocked",
      claimCoverage: claimCoverage.ok ? "passed" : "blocked",
      materialClaimCount: spec.governance?.claimLedger.claims.length ?? 0,
    },
    errors: uniqueErrors,
  };
}

export function validateDashboardGenerationResult(
  input: unknown,
): DashboardGenerationResultValidation {
  if (!validateGenerationResultShape(input)) {
    return {
      ok: false,
      errors:
        validateGenerationResultShape.errors?.map((error) => {
          const path = error.instancePath || "/";
          return `${path} ${error.message ?? "is invalid"}`.trim();
        }) ?? ["Dashboard generation result structure is invalid."],
    };
  }

  const result = input as DashboardGenerationResult;
  const recomputed = createDashboardGenerationResult(result.output.dashboardSpec, {
    runReference: result.runReference,
    generatedAt: result.generatedAt,
  });
  if (stableJsonStringify(result) !== stableJsonStringify(recomputed)) {
    return {
      ok: false,
      errors: [
        "The staged dashboard generation result does not match deterministic validation output.",
      ],
    };
  }

  if (result.status !== "ready") {
    return {
      ok: false,
      errors: result.errors.length
        ? result.errors
        : ["The staged dashboard generation result is blocked."],
    };
  }

  return { ok: true, result, errors: [] };
}

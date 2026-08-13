import Ajv from "ajv";

import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import {
  createDashboardGenerationResult,
  stableJsonStringify,
  type DashboardGenerationResult,
} from "./dashboardGenerationResult";

export interface BrowserSmokeResult {
  smoke_type: "browser";
  app_started: boolean;
  page_loaded: boolean;
  interaction_succeeded: boolean;
  success_observed: boolean;
  blocking_errors: string[];
  current_url?: string;
  page_title?: string;
  observed_text?: string;
}

const browserSmokeSchema = {
  type: "object",
  properties: {
    smoke_type: { const: "browser" },
    app_started: { type: "boolean" },
    page_loaded: { type: "boolean" },
    interaction_succeeded: { type: "boolean" },
    success_observed: { type: "boolean" },
    blocking_errors: { type: "array", items: { type: "string" } },
    current_url: { type: "string" },
    page_title: { type: "string" },
    observed_text: { type: "string" },
  },
  required: [
    "smoke_type",
    "app_started",
    "page_loaded",
    "interaction_succeeded",
    "success_observed",
    "blocking_errors",
  ],
  additionalProperties: true,
} as const;

const browserSmokeAjv = new Ajv({ allErrors: true, strict: false });
const validateBrowserSmokeShape = browserSmokeAjv.compile(browserSmokeSchema);

export interface MeetingDashboardPackageFiles {
  "dashboard.spec.json": string;
  "binding-map.json": string;
  "claim-ledger.json": string;
  "dashboard.html": string;
  "browser-smoke-result.json": string;
  "dashboard-generation-result.json": string;
}

export type MeetingDashboardPackageResolution =
  | {
      ok: true;
      generationResult: DashboardGenerationResult;
      files: MeetingDashboardPackageFiles;
    }
  | {
      ok: false;
      generationResult: DashboardGenerationResult;
      errors: string[];
    };

export function createMeetingDashboardPackageParts(input: {
  spec: DashboardSpec;
  dashboardDocument: string;
  browserSmokeResult: unknown;
  runReference: string;
  generatedAt: string;
}): MeetingDashboardPackageResolution {
  const generationResult = createDashboardGenerationResult(input.spec, {
    runReference: input.runReference,
    generatedAt: input.generatedAt,
  });
  if (!validateBrowserSmokeShape(input.browserSmokeResult)) {
    return {
      ok: false,
      generationResult,
      errors:
        validateBrowserSmokeShape.errors?.map((error) => {
          const path = error.instancePath || "/";
          return `Browser smoke ${path} ${error.message ?? "is invalid"}`.trim();
        }) ?? ["Browser smoke result structure is invalid."],
    };
  }
  const browserSmokeResult =
    input.browserSmokeResult as BrowserSmokeResult;
  const smokeErrors = [
    ...(browserSmokeResult.app_started
      ? []
      : ["Browser smoke did not start the app."]),
    ...(browserSmokeResult.page_loaded
      ? []
      : ["Browser smoke did not load the standalone page."]),
    ...(browserSmokeResult.interaction_succeeded
      ? []
      : ["Browser smoke interaction did not succeed."]),
    ...(browserSmokeResult.success_observed
      ? []
      : ["Browser smoke did not observe the required success state."]),
    ...browserSmokeResult.blocking_errors,
  ];
  const documentErrors = [
    ...(input.dashboardDocument.includes('data-demo="idle-warehouse-waste"')
      ? []
      : ["Standalone dashboard HTML does not contain the governed scenario."]),
    ...(input.dashboardDocument.includes(
      'data-testid="synthetic-quality-disclosure"',
    )
      ? []
      : ["Standalone dashboard HTML does not contain the quality disclosure."]),
    ...(input.dashboardDocument.includes('data-quality-state="controlled"')
      ? []
      : ["Standalone dashboard HTML is not in the controlled quality state."]),
    ...(input.dashboardDocument.includes("Synthetic demo data")
      ? []
      : ["Standalone dashboard HTML does not contain synthetic disclosure text."]),
    ...(input.spec.dataContext.artifact?.digest &&
    input.dashboardDocument.includes(input.spec.dataContext.artifact.digest)
      ? []
      : ["Standalone dashboard HTML does not contain the upstream artifact digest."]),
    ...(input.dashboardDocument.includes("standalone-claim-source") &&
    input.dashboardDocument.includes("dataset observation")
      ? []
      : ["Standalone dashboard HTML does not contain material source citations."]),
  ];
  const errors = [
    ...generationResult.errors,
    ...smokeErrors,
    ...documentErrors,
  ];
  if (generationResult.status !== "ready" || errors.length > 0) {
    return {
      ok: false,
      generationResult,
      errors: [...new Set(errors)],
    };
  }

  const artifactContext = input.spec.dataContext.artifact;
  const claimLedger = input.spec.governance?.claimLedger;
  if (!artifactContext || !claimLedger) {
    return {
      ok: false,
      generationResult,
      errors: [
        "The meeting dashboard package requires artifact bindings and a claim ledger.",
      ],
    };
  }

  const bindingMap = {
    schemaVersion: "dashboard-binding-map/1.0",
    upstreamArtifactDigest: artifactContext.digest,
    snapshot: artifactContext.snapshot,
    bindings: artifactContext.bindings,
  };
  const dashboardDocument = input.dashboardDocument;
  return {
    ok: true,
    generationResult,
    files: {
      "dashboard.spec.json": stableJsonStringify(input.spec),
      "binding-map.json": stableJsonStringify(bindingMap),
      "claim-ledger.json": stableJsonStringify(claimLedger),
      "dashboard.html": dashboardDocument,
      "browser-smoke-result.json": stableJsonStringify(browserSmokeResult),
      "dashboard-generation-result.json": stableJsonStringify(
        generationResult,
      ),
    },
  };
}

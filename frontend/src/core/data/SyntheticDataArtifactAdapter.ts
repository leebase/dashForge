import type { DataAdapter } from "./DataAdapter";
import type { DataColumnRole, DataColumnType, DatasetInfo } from "./dataContract";
import { StaticDataAdapter } from "./StaticDataAdapter";
import {
  collectDashboardDatasetReferences,
  type DashboardArtifactContext,
  type DashboardMaterialClaim,
  type DashboardSpec,
} from "../spec/dashboardSpec";
import type {
  ScenarioDatasetMap,
  ScenarioRow,
  ScenarioValue,
} from "../../mock-data/mockScenarioTypes";

export const SYNTHETIC_DATA_WORK_PACKAGE_TYPE = "synthetic-data-work-package" as const;
export const SYNTHETIC_DATA_WORK_PACKAGE_SCHEMA =
  "synthetic-data-work-package/1.0" as const;
export const SYNTHETIC_DATA_STORY_ENGINEER_ID =
  "synthetic-data-story-engineer" as const;
export const DATA_QUALITY_REPORT_SCHEMA = "data-quality-report/1.0" as const;
export const DASHBOARD_CLAIM_LEDGER_SCHEMA = "dashboard-claim-ledger/1.0" as const;

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const STANDARD_NARRATIVE_SURFACE_IDS = [
  "narrative:hook",
  "narrative:context",
  "narrative:tension",
  "narrative:resolution",
  "narrative:call-to-action",
] as const;

export interface SyntheticDataColumn {
  name: string;
  type: DataColumnType;
  role: DataColumnRole;
  label: string;
}

export interface SyntheticDataWorkPackage {
  schema_version: typeof SYNTHETIC_DATA_WORK_PACKAGE_SCHEMA;
  employee_id: typeof SYNTHETIC_DATA_STORY_ENGINEER_ID;
  run_reference: string;
  input_reference: {
    scenario_digest: string;
    pack_id: string;
    scenario_id: string;
    seed: number;
  };
  synthetic_disclosure: string;
  assumptions: string[];
  evidence: Array<{
    type: string;
    path: string;
    sha256: string;
  }>;
  datasets: Array<{
    dataset_id: string;
    row_count: number;
    normalized_digest: string;
    columns: SyntheticDataColumn[];
  }>;
  snapshot: {
    path: string;
    sha256: string;
  };
  quality: {
    status: "passed" | "blocked";
    report_path: string;
    report_sha256: string;
    requested_fault_count: number;
    injected_fault_count: number;
    detected_fault_count: number;
    unexpected_finding_count: number;
    story_assertions_passed: number;
    story_assertions_total: number;
  };
  reproduction_manifest: {
    path: string;
    sha256: string;
  };
}

export interface SyntheticDataSnapshot {
  packId: string;
  scenarioId: string;
  seed: number;
  datasets: Array<{
    datasetId: string;
    rowCount: number;
    columns: SyntheticDataColumn[];
    rows: Array<Record<string, unknown>>;
  }>;
}

export interface SyntheticDataQualityReport {
  schema_version: typeof DATA_QUALITY_REPORT_SCHEMA;
  scenario_digest: string;
  validator_version: string;
  status: "passed" | "blocked";
  requested_findings: unknown[];
  injected_findings: unknown[];
  detected_findings: unknown[];
  unexpected_findings: unknown[];
  story_assertions: Array<{
    assertion_id: string;
    passed: boolean;
    actual?: unknown;
    expected?: unknown;
    operator?: string;
    description: string;
  }>;
  summary: {
    requested_count: number;
    injected_count: number;
    detected_count: number;
    unexpected_count: number;
    story_assertions_passed: number;
    story_assertions_total: number;
    limitations?: string[];
  };
}

/**
 * Trusted orchestration materialization. The canonical Python rfpf envelope is
 * verified before this record reaches DashForge; TypeScript deliberately does
 * not parse or reconstruct that envelope.
 */
export interface VerifiedSyntheticDataArtifact {
  artifactType: typeof SYNTHETIC_DATA_WORK_PACKAGE_TYPE;
  payloadSchemaVersion: typeof SYNTHETIC_DATA_WORK_PACKAGE_SCHEMA;
  verifiedDigest: string;
  workPackage: SyntheticDataWorkPackage;
  snapshot: SyntheticDataSnapshot;
  qualityReport: SyntheticDataQualityReport;
}

export interface ArtifactQualityDisclosure {
  artifactDigest: string;
  syntheticDisclosure: string;
  qualityState: "controlled" | "blocking";
  qualityStatus: "passed" | "blocked" | "invalid";
  summary: string;
  limitations: string[];
}

export type SyntheticDataArtifactAdapterResolution =
  | {
      ok: true;
      adapter: DataAdapter;
      disclosure: ArtifactQualityDisclosure;
      datasetIds: string[];
    }
  | {
      ok: false;
      errors: string[];
      disclosure: ArtifactQualityDisclosure;
      datasetIds: string[];
    };


function toScenarioValue(value: unknown): ScenarioValue {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return String(value);
}

function toScenarioRow(
  sourceRow: Record<string, unknown>,
  fieldMap: Record<string, string>,
): ScenarioRow {
  const mappedRow: ScenarioRow = {};

  for (const [dashboardField, sourceField] of Object.entries(fieldMap)) {
    mappedRow[dashboardField] = toScenarioValue(sourceRow[sourceField]);
  }

  return mappedRow;
}

function qualitySummary(workPackage: SyntheticDataWorkPackage): string {
  const quality = workPackage.quality;

  return [
    `${quality.requested_fault_count} requested`,
    `${quality.injected_fault_count} injected`,
    `${quality.detected_fault_count} independently detected`,
    `${quality.unexpected_finding_count} unexpected`,
  ].join(" · ");
}

function buildDisclosure(
  artifact: VerifiedSyntheticDataArtifact,
  errors: readonly string[],
): ArtifactQualityDisclosure {
  const packageStatus = artifact.workPackage.quality.status;
  const reportStatus = artifact.qualityReport.status;
  const passed = packageStatus === "passed" && reportStatus === "passed";

  return {
    artifactDigest: artifact.verifiedDigest,
    syntheticDisclosure:
      artifact.workPackage.synthetic_disclosure ||
      "Synthetic data disclosure is missing from the upstream work package.",
    qualityState: errors.length === 0 && passed ? "controlled" : "blocking",
    qualityStatus: passed ? "passed" : packageStatus === "blocked" || reportStatus === "blocked" ? "blocked" : "invalid",
    summary: qualitySummary(artifact.workPackage),
    limitations: (
      artifact.qualityReport.summary?.limitations ??
      artifact.workPackage.assumptions
    ).filter(
      (limitation): limitation is string =>
        typeof limitation === "string" && limitation.trim().length > 0,
    ),
  };
}

export function collectRequiredMaterialSurfaceIds(spec: DashboardSpec): string[] {
  const surfaceIds = new Set<string>();

  for (const widget of spec.widgets) {
    surfaceIds.add(`widget:${widget.id}`);
  }

  if (spec.meta.description?.trim()) {
    surfaceIds.add("narrative:dashboard-description");
  }

  if (spec.narrative) {
    for (const surfaceId of STANDARD_NARRATIVE_SURFACE_IDS) {
      surfaceIds.add(surfaceId);
    }
    if (spec.narrative.executiveSummary?.trim()) {
      surfaceIds.add("narrative:executive-summary");
    }
  }

  for (const surfaceId of spec.governance?.additionalMaterialSurfaceIds ?? []) {
    surfaceIds.add(surfaceId);
  }

  return [...surfaceIds].sort();
}

export function findMaterialClaim(
  spec: DashboardSpec,
  surfaceId: string,
): DashboardMaterialClaim | undefined {
  return spec.governance?.claimLedger.claims.find(
    (claim) => claim.surfaceId === surfaceId,
  );
}

export function requireMaterialClaim(
  spec: DashboardSpec,
  surfaceId: string,
): DashboardMaterialClaim {
  const claim = findMaterialClaim(spec, surfaceId);

  if (!claim) {
    throw new Error(`Material surface "${surfaceId}" has no source claim.`);
  }

  return claim;
}

function validateArtifactIdentity(
  manifest: DashboardArtifactContext,
  artifact: VerifiedSyntheticDataArtifact,
  errors: string[],
) {
  if (manifest.artifactType !== SYNTHETIC_DATA_WORK_PACKAGE_TYPE) {
    errors.push(
      `Artifact input type must be "${SYNTHETIC_DATA_WORK_PACKAGE_TYPE}".`,
    );
  }
  if (manifest.payloadSchemaVersion !== SYNTHETIC_DATA_WORK_PACKAGE_SCHEMA) {
    errors.push(
      `Artifact payload schema must be "${SYNTHETIC_DATA_WORK_PACKAGE_SCHEMA}".`,
    );
  }
  if (manifest.employeeId !== SYNTHETIC_DATA_STORY_ENGINEER_ID) {
    errors.push(
      `Artifact employee must be "${SYNTHETIC_DATA_STORY_ENGINEER_ID}".`,
    );
  }
  if (!SHA256_PATTERN.test(manifest.digest)) {
    errors.push("Artifact digest must be a sha256 digest.");
  }
  if (
    artifact.artifactType !== manifest.artifactType ||
    artifact.payloadSchemaVersion !== manifest.payloadSchemaVersion
  ) {
    errors.push("Trusted artifact type/schema does not match the dashboard manifest.");
  }
  if (artifact.verifiedDigest !== manifest.digest) {
    errors.push("Trusted artifact digest does not match the dashboard manifest digest.");
  }
  if (artifact.workPackage.schema_version !== manifest.payloadSchemaVersion) {
    errors.push("Work-package payload schema does not match the dashboard manifest.");
  }
  if (artifact.workPackage.employee_id !== manifest.employeeId) {
    errors.push("Work-package employee id does not match the dashboard manifest.");
  }
}

function validateArtifactFiles(
  manifest: DashboardArtifactContext,
  artifact: VerifiedSyntheticDataArtifact,
  errors: string[],
) {
  const workPackage = artifact.workPackage;

  if (
    manifest.snapshot.path !== workPackage.snapshot.path ||
    manifest.snapshot.sha256 !== workPackage.snapshot.sha256
  ) {
    errors.push("Snapshot path/digest does not match the work package.");
  }
  if (
    manifest.qualityReport.path !== workPackage.quality.report_path ||
    manifest.qualityReport.sha256 !== workPackage.quality.report_sha256
  ) {
    errors.push("Quality-report path/digest does not match the work package.");
  }
  if (manifest.qualityReport.schemaVersion !== artifact.qualityReport.schema_version) {
    errors.push("Quality-report schema does not match the dashboard manifest.");
  }
  if (
    artifact.snapshot.packId !== workPackage.input_reference.pack_id ||
    artifact.snapshot.scenarioId !== workPackage.input_reference.scenario_id ||
    artifact.snapshot.seed !== workPackage.input_reference.seed
  ) {
    errors.push("Snapshot identity does not match the work-package input reference.");
  }
  if (
    artifact.qualityReport.scenario_digest !==
    workPackage.input_reference.scenario_digest
  ) {
    errors.push("Quality report does not reference the work-package scenario digest.");
  }
}

function validateQuality(
  artifact: VerifiedSyntheticDataArtifact,
  errors: string[],
) {
  const quality = artifact.workPackage.quality;
  const report = artifact.qualityReport;

  if (quality.status !== "passed" || report.status !== "passed") {
    errors.push("Upstream synthetic-data quality state is blocking.");
  }
  if (
    quality.requested_fault_count !== quality.injected_fault_count ||
    quality.injected_fault_count !== quality.detected_fault_count
  ) {
    errors.push("Requested, injected, and detected quality counts must agree.");
  }
  if (
    quality.unexpected_finding_count !== 0 ||
    report.summary.unexpected_count !== 0 ||
    report.unexpected_findings.length !== 0
  ) {
    errors.push("Upstream quality report contains unexpected blocking findings.");
  }
  if (
    quality.story_assertions_passed !== quality.story_assertions_total ||
    report.summary.story_assertions_passed !==
      report.summary.story_assertions_total ||
    report.story_assertions.some((assertion) => !assertion.passed)
  ) {
    errors.push("Upstream story assertions did not all pass.");
  }
  if (
    quality.requested_fault_count !== report.summary.requested_count ||
    quality.injected_fault_count !== report.summary.injected_count ||
    quality.detected_fault_count !== report.summary.detected_count
  ) {
    errors.push("Work-package quality counts do not match the quality report.");
  }
}

export interface MaterialClaimCoverageValidation {
  ok: boolean;
  errors: string[];
}

export function validateMaterialClaimCoverage(
  spec: DashboardSpec,
): MaterialClaimCoverageValidation {
  const manifest = spec.dataContext.artifact;
  const governance = spec.governance;
  const errors: string[] = [];
  if (!manifest || !governance) {
    return {
      ok: false,
      errors: ["Artifact dashboards require a claim ledger."],
    };
  }

  const claimBySurface = new Map<string, DashboardMaterialClaim>();
  const claimIds = new Set<string>();
  if (governance.claimLedger.upstreamArtifactDigest !== manifest.digest) {
    errors.push("Claim ledger does not name the upstream artifact digest.");
  }
  for (const claim of governance.claimLedger.claims) {
    if (claimIds.has(claim.claimId)) {
      errors.push(`Duplicate claim id "${claim.claimId}".`);
    }
    if (claimBySurface.has(claim.surfaceId)) {
      errors.push(`Duplicate claim surface "${claim.surfaceId}".`);
    }
    if (claim.source.artifactDigest !== manifest.digest) {
      errors.push(`Claim "${claim.claimId}" cites the wrong artifact digest.`);
    }
    claimIds.add(claim.claimId);
    claimBySurface.set(claim.surfaceId, claim);
  }
  for (const surfaceId of collectRequiredMaterialSurfaceIds(spec)) {
    if (!claimBySurface.has(surfaceId)) {
      errors.push(`Material surface "${surfaceId}" has no source claim.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function validateClaimLedger(
  spec: DashboardSpec,
  artifact: VerifiedSyntheticDataArtifact,
  snapshotDatasetById: ReadonlyMap<string, SyntheticDataSnapshot["datasets"][number]>,
  errors: string[],
) {
  const manifest = spec.dataContext.artifact;
  const governance = spec.governance;

  if (!manifest || !governance) {
    errors.push("Artifact dashboards require a claim ledger.");
    return;
  }

  const ledger = governance.claimLedger;
  if (ledger.schemaVersion !== DASHBOARD_CLAIM_LEDGER_SCHEMA) {
    errors.push(`Claim ledger schema must be "${DASHBOARD_CLAIM_LEDGER_SCHEMA}".`);
  }
  if (ledger.upstreamArtifactDigest !== manifest.digest) {
    errors.push("Claim ledger does not name the upstream artifact digest.");
  }

  const claimBySurface = new Map<string, DashboardMaterialClaim>();
  const claimIds = new Set<string>();
  const assertionPassedById = new Map(
    artifact.qualityReport.story_assertions.map((assertion) => [
      assertion.assertion_id,
      assertion.passed,
    ]),
  );

  for (const claim of ledger.claims) {
    if (claimIds.has(claim.claimId)) {
      errors.push(`Duplicate claim id "${claim.claimId}".`);
    }
    if (claimBySurface.has(claim.surfaceId)) {
      errors.push(`Duplicate claim surface "${claim.surfaceId}".`);
    }
    claimIds.add(claim.claimId);
    claimBySurface.set(claim.surfaceId, claim);

    if (claim.source.artifactDigest !== manifest.digest) {
      errors.push(`Claim "${claim.claimId}" cites the wrong artifact digest.`);
    }

    const evidence = claim.source.evidence;
    if (evidence.type === "assertion") {
      if (assertionPassedById.get(evidence.assertionId) !== true) {
        errors.push(
          `Claim "${claim.claimId}" cites an unavailable or failed assertion "${evidence.assertionId}".`,
        );
      }
      continue;
    }

    const binding = manifest.bindings[evidence.bindingId];
    if (!binding) {
      errors.push(
        `Claim "${claim.claimId}" cites undeclared binding "${evidence.bindingId}".`,
      );
      continue;
    }
    if (binding.snapshotDatasetId !== evidence.datasetId) {
      errors.push(
        `Claim "${claim.claimId}" dataset does not match binding "${evidence.bindingId}".`,
      );
      continue;
    }

    const dataset = snapshotDatasetById.get(evidence.datasetId);
    if (!dataset) {
      errors.push(
        `Claim "${claim.claimId}" cites missing dataset "${evidence.datasetId}".`,
      );
      continue;
    }

    const columnNames = new Set(dataset.columns.map((column) => column.name));
    for (const field of evidence.fields) {
      if (!columnNames.has(field)) {
        errors.push(
          `Claim "${claim.claimId}" cites missing field "${field}" in dataset "${evidence.datasetId}".`,
        );
      }
    }

    const predicate = evidence.predicate ?? {};
    const predicateEntries = Object.entries(predicate);
    for (const [field] of predicateEntries) {
      if (!columnNames.has(field)) {
        errors.push(
          `Claim "${claim.claimId}" predicate cites missing field "${field}".`,
        );
      }
    }
    const observationExists = dataset.rows.some((row) =>
      predicateEntries.every(([field, expected]) => row[field] === expected),
    );
    if (!observationExists) {
      errors.push(`Claim "${claim.claimId}" has no matching dataset observation.`);
    }
  }

  for (const surfaceId of collectRequiredMaterialSurfaceIds(spec)) {
    if (!claimBySurface.has(surfaceId)) {
      errors.push(`Material surface "${surfaceId}" has no source claim.`);
    }
  }
}

export function createSyntheticDataArtifactAdapter(
  spec: DashboardSpec,
  artifact: VerifiedSyntheticDataArtifact,
): SyntheticDataArtifactAdapterResolution {
  const errors: string[] = [];
  const manifest = spec.dataContext.artifact;

  if (spec.dataContext.mode !== "artifact" || !manifest) {
    const disclosure = buildDisclosure(artifact, ["Artifact context is missing."]);
    return {
      ok: false,
      errors: ["Synthetic-data artifact adapter requires artifact data mode."],
      disclosure,
      datasetIds: [],
    };
  }

  validateArtifactIdentity(manifest, artifact, errors);
  validateArtifactFiles(manifest, artifact, errors);
  validateQuality(artifact, errors);

  if (
    spec.intent.industry !== artifact.workPackage.input_reference.pack_id ||
    spec.intent.scenario !== artifact.workPackage.input_reference.scenario_id
  ) {
    errors.push("Dashboard intent does not match the work-package scenario.");
  }

  const packageDatasetById = new Map(
    artifact.workPackage.datasets.map((dataset) => [dataset.dataset_id, dataset]),
  );
  const snapshotDatasetById = new Map(
    artifact.snapshot.datasets.map((dataset) => [dataset.datasetId, dataset]),
  );
  const declaredSnapshotIds = new Set(manifest.snapshot.datasetIds);
  const dashboardReferences = collectDashboardDatasetReferences(spec);
  const datasetIds = Object.keys(manifest.bindings).sort();

  for (const datasetId of manifest.snapshot.datasetIds) {
    if (!packageDatasetById.has(datasetId) || !snapshotDatasetById.has(datasetId)) {
      errors.push(`Declared snapshot dataset "${datasetId}" is missing.`);
    }
  }

  for (const snapshotDataset of artifact.snapshot.datasets) {
    const packageDataset = packageDatasetById.get(snapshotDataset.datasetId);
    if (!packageDataset) {
      errors.push(
        `Snapshot dataset "${snapshotDataset.datasetId}" is absent from the work package.`,
      );
      continue;
    }
    if (
      snapshotDataset.rowCount !== snapshotDataset.rows.length ||
      packageDataset.row_count !== snapshotDataset.rows.length
    ) {
      errors.push(
        `Dataset "${snapshotDataset.datasetId}" row count does not match its metadata.`,
      );
    }
  }

  for (const reference of dashboardReferences) {
    const binding = manifest.bindings[reference.datasetId];
    if (!binding) {
      errors.push(`Dataset "${reference.datasetId}" has no declared artifact binding.`);
      continue;
    }
    for (const field of reference.fields) {
      if (!binding.fieldMap[field]?.trim()) {
        errors.push(
          `Dataset "${reference.datasetId}" is missing required field binding "${field}".`,
        );
      }
    }
  }

  const mappedDatasets: ScenarioDatasetMap = {};
  const datasetInfo: DatasetInfo[] = [];

  for (const [bindingId, binding] of Object.entries(manifest.bindings)) {
    if (!declaredSnapshotIds.has(binding.snapshotDatasetId)) {
      errors.push(
        `Binding "${bindingId}" targets undeclared snapshot dataset "${binding.snapshotDatasetId}".`,
      );
      continue;
    }

    const packageDataset = packageDatasetById.get(binding.snapshotDatasetId);
    const snapshotDataset = snapshotDatasetById.get(binding.snapshotDatasetId);
    if (!packageDataset || !snapshotDataset) {
      errors.push(
        `Binding "${bindingId}" targets missing dataset "${binding.snapshotDatasetId}".`,
      );
      continue;
    }

    const packageFields = new Set(
      packageDataset.columns.map((column) => column.name),
    );
    const snapshotFields = new Set(
      snapshotDataset.columns.map((column) => column.name),
    );
    for (const [dashboardField, sourceField] of Object.entries(binding.fieldMap)) {
      if (
        !dashboardField.trim() ||
        !packageFields.has(sourceField) ||
        !snapshotFields.has(sourceField)
      ) {
        errors.push(
          `Binding "${bindingId}" maps "${dashboardField}" to missing field "${sourceField}".`,
        );
      }
    }

    mappedDatasets[bindingId] = snapshotDataset.rows.map((row) =>
      toScenarioRow(row, binding.fieldMap),
    );
    datasetInfo.push({ datasetId: bindingId, rowCount: snapshotDataset.rows.length });
  }

  validateClaimLedger(spec, artifact, snapshotDatasetById, errors);

  const disclosure = buildDisclosure(artifact, errors);
  if (errors.length > 0) {
    return {
      ok: false,
      errors: [...new Set(errors)],
      disclosure,
      datasetIds,
    };
  }

  return {
    ok: true,
    adapter: new StaticDataAdapter(mappedDatasets, datasetInfo),
    disclosure,
    datasetIds,
  };
}

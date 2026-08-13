import fieldServiceQualityReport from "../../fixtures/dataforge/field-service-heat-wave-quality-report.json";
import fieldServiceSnapshot from "../../fixtures/dataforge/field-service-heat-wave-snapshot.json";
import fieldServiceWorkPackage from "../../fixtures/dataforge/field-service-heat-wave-work-package.json";
import idleWarehouseQualityReport from "../../fixtures/dataforge/idle-warehouse-waste-quality-report.json";
import idleWarehouseSnapshot from "../../fixtures/dataforge/idle-warehouse-waste-snapshot.json";
import idleWarehouseWorkPackage from "../../fixtures/dataforge/idle-warehouse-waste-work-package.json";
import type {
  SyntheticDataQualityReport,
  SyntheticDataSnapshot,
  SyntheticDataWorkPackage,
  VerifiedSyntheticDataArtifact,
} from "./SyntheticDataArtifactAdapter";

export const IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST =
  "sha256:57ed296635806a15deb7286879bae8b009fc551a86fce4b1f3cb564bcf775390";
export const FIELD_SERVICE_WORK_PACKAGE_DIGEST =
  "sha256:e886a65cea294553d38c0c42c7f2625e7f504b01fe5dd7bad809bb852fc727ab";
// JSON imports widen schema literals; the fixture itself is exercised by the strict adapter.
const fieldServiceWorkPackagePayload =
  fieldServiceWorkPackage.payload as SyntheticDataWorkPackage;

export const idleWarehouseVerifiedSyntheticDataArtifact: VerifiedSyntheticDataArtifact = {
  artifactType: "synthetic-data-work-package",
  payloadSchemaVersion: "synthetic-data-work-package/1.0",
  verifiedDigest: IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST,
  workPackage: idleWarehouseWorkPackage as SyntheticDataWorkPackage,
  snapshot: idleWarehouseSnapshot as SyntheticDataSnapshot,
  qualityReport: idleWarehouseQualityReport as SyntheticDataQualityReport,
};

export const fieldServiceVerifiedSyntheticDataArtifact: VerifiedSyntheticDataArtifact = {
  artifactType: "synthetic-data-work-package",
  payloadSchemaVersion: "synthetic-data-work-package/1.0",
  verifiedDigest: FIELD_SERVICE_WORK_PACKAGE_DIGEST,
  workPackage: fieldServiceWorkPackagePayload,
  snapshot: fieldServiceSnapshot as SyntheticDataSnapshot,
  qualityReport: fieldServiceQualityReport as SyntheticDataQualityReport,
};

export const DEFAULT_VERIFIED_SYNTHETIC_DATA_ARTIFACTS: readonly VerifiedSyntheticDataArtifact[] = [
  idleWarehouseVerifiedSyntheticDataArtifact,
  fieldServiceVerifiedSyntheticDataArtifact,
];

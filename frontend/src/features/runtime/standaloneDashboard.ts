import { IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST } from "../../core/data/verifiedSyntheticDataArtifacts";
import type {
  DashboardClaimKind,
  DashboardMaterialClaim,
  DashboardSpec,
} from "../../core/spec/dashboardSpec";
import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { syncPresenterDraft } from "../presenter/narrativeStore";

export const DEFAULT_STANDALONE_PACK_ID = "snowflakeCost";
export const DEFAULT_STANDALONE_SCENARIO_ID = "idle-warehouse-waste";
export const DEFAULT_STANDALONE_TEMPLATE_ID = "tpl.snowflakeCost.idle-warehouse-waste";

export const IDLE_WAREHOUSE_ADDITIONAL_MATERIAL_SURFACE_IDS = [
  "metric:monthly-opportunity-high",
  "metric:idle-warehouse-count",
  "metric:cost-concentration",
  "metric:warehouse-controls",
  "recommendation:IWW-001",
  "recommendation:IWW-002",
] as const;

function datasetObservationClaim(input: {
  claimId: string;
  surfaceId: string;
  kind: DashboardClaimKind;
  statement: string;
  bindingId: string;
  fields: string[];
  predicate?: Record<string, string | number | boolean | null>;
}): DashboardMaterialClaim {
  return {
    claimId: input.claimId,
    surfaceId: input.surfaceId,
    kind: input.kind,
    statement: input.statement,
    source: {
      artifactDigest: IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST,
      evidence: {
        type: "dataset_observation",
        bindingId: input.bindingId,
        datasetId: input.bindingId,
        fields: input.fields,
        predicate: input.predicate,
      },
    },
  };
}

function buildIdleWarehouseClaimLedger(): DashboardMaterialClaim[] {
  return [
    datasetObservationClaim({
      claimId: "claim-widget-monthly-opportunity",
      surfaceId: "widget:kpi_monthly_opportunity",
      kind: "metric",
      statement: "The high-end monthly opportunity is 726 credits.",
      bindingId: "executive_summary",
      fields: ["metricId", "value", "caption"],
      predicate: { metricId: "monthly-opportunity-high" },
    }),
    datasetObservationClaim({
      claimId: "claim-widget-idle-count",
      surfaceId: "widget:kpi_idle_warehouse_count",
      kind: "metric",
      statement: "Two warehouses require idle-policy review.",
      bindingId: "executive_summary",
      fields: ["metricId", "value", "caption"],
      predicate: { metricId: "idle-warehouse-count" },
    }),
    datasetObservationClaim({
      claimId: "claim-widget-credit-concentration",
      surfaceId: "widget:warehouse_credit_concentration",
      kind: "metric",
      statement: "Warehouse credit use is concentrated in FINANCE_REPORTING_WH.",
      bindingId: "warehouse_metering_history",
      fields: ["usage_day", "warehouse_name", "credits_used"],
      predicate: { warehouse_name: "FINANCE_REPORTING_WH" },
    }),
    datasetObservationClaim({
      claimId: "claim-widget-control-gaps",
      surfaceId: "widget:warehouse_control_gaps",
      kind: "metric",
      statement: "Warehouse controls include weak suspension and missing ownership or monitors.",
      bindingId: "show_warehouses",
      fields: [
        "name",
        "auto_suspend",
        "business_owner",
        "technical_owner",
        "resource_monitor",
      ],
      predicate: { name: "FINANCE_REPORTING_WH" },
    }),
    datasetObservationClaim({
      claimId: "claim-widget-recommendation-queue",
      surfaceId: "widget:recommendation_queue_table",
      kind: "recommendation",
      statement: "The action queue contains owner-validated, guarded recommendations.",
      bindingId: "recommendation_queue",
      fields: [
        "recommendation_id",
        "recommended_action",
        "suggested_owner",
        "guardrail",
      ],
    }),
    datasetObservationClaim({
      claimId: "claim-dashboard-description",
      surfaceId: "narrative:dashboard-description",
      kind: "narrative",
      statement: "Idle warehouse waste combines concentrated cost with incomplete controls.",
      bindingId: "show_warehouses",
      fields: ["name", "auto_suspend", "technical_owner", "resource_monitor"],
    }),
    datasetObservationClaim({
      claimId: "claim-narrative-hook",
      surfaceId: "narrative:hook",
      kind: "narrative",
      statement: "Open with the monthly opportunity signal.",
      bindingId: "executive_summary",
      fields: ["metricId", "value"],
      predicate: { metricId: "monthly-opportunity-high" },
    }),
    datasetObservationClaim({
      claimId: "claim-narrative-context",
      surfaceId: "narrative:context",
      kind: "narrative",
      statement: "Establish the suspension and ownership baseline.",
      bindingId: "show_warehouses",
      fields: ["name", "auto_suspend", "business_owner", "technical_owner"],
    }),
    datasetObservationClaim({
      claimId: "claim-narrative-tension",
      surfaceId: "narrative:tension",
      kind: "narrative",
      statement: "Show the warehouse credit concentration.",
      bindingId: "warehouse_metering_history",
      fields: ["warehouse_name", "credits_used"],
      predicate: { warehouse_name: "FINANCE_REPORTING_WH" },
    }),
    datasetObservationClaim({
      claimId: "claim-narrative-resolution",
      surfaceId: "narrative:resolution",
      kind: "narrative",
      statement: "Frame guarded owner-validated controls as the response.",
      bindingId: "recommendation_queue",
      fields: ["recommended_action", "suggested_owner", "guardrail"],
    }),
    datasetObservationClaim({
      claimId: "claim-narrative-call-to-action",
      surfaceId: "narrative:call-to-action",
      kind: "narrative",
      statement: "Land the ask with the prioritized action queue.",
      bindingId: "recommendation_queue",
      fields: ["executive_severity", "scope_name", "recommended_action"],
    }),
    datasetObservationClaim({
      claimId: "claim-narrative-executive-summary",
      surfaceId: "narrative:executive-summary",
      kind: "narrative",
      statement: "Move from the top-line signal to guarded recommendations.",
      bindingId: "recommendation_queue",
      fields: ["recommendation_id", "evidence_detail", "guardrail"],
    }),
    datasetObservationClaim({
      claimId: "claim-metric-monthly-opportunity",
      surfaceId: "metric:monthly-opportunity-high",
      kind: "metric",
      statement: "The high-end monthly opportunity is 726 credits.",
      bindingId: "executive_summary",
      fields: ["metricId", "value"],
      predicate: { metricId: "monthly-opportunity-high" },
    }),
    datasetObservationClaim({
      claimId: "claim-metric-idle-count",
      surfaceId: "metric:idle-warehouse-count",
      kind: "metric",
      statement: "Two warehouses require idle-policy review.",
      bindingId: "executive_summary",
      fields: ["metricId", "value"],
      predicate: { metricId: "idle-warehouse-count" },
    }),
    datasetObservationClaim({
      claimId: "claim-metric-cost-concentration",
      surfaceId: "metric:cost-concentration",
      kind: "metric",
      statement: "FINANCE_REPORTING_WH has the largest credit share in the review window.",
      bindingId: "warehouse_metering_history",
      fields: ["warehouse_name", "credits_used"],
      predicate: { warehouse_name: "FINANCE_REPORTING_WH" },
    }),
    datasetObservationClaim({
      claimId: "claim-metric-warehouse-controls",
      surfaceId: "metric:warehouse-controls",
      kind: "metric",
      statement: "Warehouse control gaps remain visible for owner validation.",
      bindingId: "show_warehouses",
      fields: ["name", "auto_suspend", "technical_owner", "resource_monitor"],
    }),
    datasetObservationClaim({
      claimId: "claim-recommendation-iww-001",
      surfaceId: "recommendation:IWW-001",
      kind: "recommendation",
      statement: "Review FINANCE_REPORTING_WH availability and suspension controls.",
      bindingId: "recommendation_queue",
      fields: [
        "recommendation_id",
        "scope_name",
        "recommended_action",
        "suggested_owner",
        "guardrail",
      ],
      predicate: { recommendation_id: "IWW-001" },
    }),
    datasetObservationClaim({
      claimId: "claim-recommendation-iww-002",
      surfaceId: "recommendation:IWW-002",
      kind: "recommendation",
      statement: "Reduce MARKETING_ADHOC_WH suspension delay with owner validation.",
      bindingId: "recommendation_queue",
      fields: [
        "recommendation_id",
        "scope_name",
        "recommended_action",
        "suggested_owner",
        "guardrail",
      ],
      predicate: { recommendation_id: "IWW-002" },
    }),
  ];
}

export function createDefaultStandaloneDashboardSpec(): DashboardSpec {
  const draft = syncPresenterDraft(
    createFreshDraftForScenario(
      DEFAULT_STANDALONE_PACK_ID,
      DEFAULT_STANDALONE_SCENARIO_ID,
    ),
  );

  return {
    ...draft,
    meta: {
      ...draft.meta,
      author: "client-meeting-dashboard-builder",
      createdAt: "2026-08-09T00:00:00.000Z",
      updatedAt: "2026-08-09T00:00:00.000Z",
      tags: [
        DEFAULT_STANDALONE_PACK_ID,
        DEFAULT_STANDALONE_SCENARIO_ID,
        "synthetic-data",
        "artifact-backed",
      ],
    },
    dataContext: {
      mode: "artifact",
      artifact: {
        artifactType: "synthetic-data-work-package",
        payloadSchemaVersion: "synthetic-data-work-package/1.0",
        digest: IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST,
        employeeId: "synthetic-data-story-engineer",
        qualityReport: {
          schemaVersion: "data-quality-report/1.0",
          path: "quality-report.json",
          sha256:
            "sha256:92ae1d44d8076e2262690a10516486701e7be2672a20b8fd0e921a378c037c46",
        },
        snapshot: {
          path: "snapshot.json",
          sha256:
            "sha256:dbee5dc082b1f0694f9d0d0a830976c3b6f0c3408754ff3ea0ab634f78961f67",
          datasetIds: [
            "executive_summary",
            "warehouse_metering_history",
            "show_warehouses",
            "recommendation_queue",
          ],
        },
        bindings: {
          executive_summary: {
            snapshotDatasetId: "executive_summary",
            fieldMap: {
              caption: "caption",
              delta: "delta",
              deltaLabel: "deltaLabel",
              metricId: "metricId",
              prefix: "prefix",
              suffix: "suffix",
              value: "value",
            },
          },
          warehouse_metering_history: {
            snapshotDatasetId: "warehouse_metering_history",
            fieldMap: {
              credits_used: "credits_used",
              usage_day: "usage_day",
              warehouse_name: "warehouse_name",
            },
          },
          show_warehouses: {
            snapshotDatasetId: "show_warehouses",
            fieldMap: {
              auto_suspend: "auto_suspend",
              business_owner: "business_owner",
              name: "name",
              resource_monitor: "resource_monitor",
              size: "size",
              technical_owner: "technical_owner",
            },
          },
          recommendation_queue: {
            snapshotDatasetId: "recommendation_queue",
            fieldMap: {
              confidence: "confidence",
              estimated_monthly_credit_savings_high:
                "estimated_monthly_credit_savings_high",
              estimated_monthly_credit_savings_low:
                "estimated_monthly_credit_savings_low",
              evidence_detail: "evidence_detail",
              executive_severity: "executive_severity",
              guardrail: "guardrail",
              performance_risk: "performance_risk",
              recommendation_id: "recommendation_id",
              recommendation_type: "recommendation_type",
              recommended_action: "recommended_action",
              scope_name: "scope_name",
              suggested_owner: "suggested_owner",
            },
          },
        },
      },
      timeRange: {
        start: "2026-06-01",
        end: "2026-06-07",
        granularity: "day",
      },
    },
    governance: {
      claimLedger: {
        schemaVersion: "dashboard-claim-ledger/1.0",
        upstreamArtifactDigest: IDLE_WAREHOUSE_WORK_PACKAGE_DIGEST,
        claims: buildIdleWarehouseClaimLedger(),
      },
      additionalMaterialSurfaceIds: [
        ...IDLE_WAREHOUSE_ADDITIONAL_MATERIAL_SURFACE_IDS,
      ],
    },
  };
}

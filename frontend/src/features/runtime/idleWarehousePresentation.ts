import type { DataAdapter } from "../../core/data/DataAdapter";
import { requireMaterialClaim } from "../../core/data/SyntheticDataArtifactAdapter";
import type {
  DashboardMaterialClaim,
  DashboardSpec,
} from "../../core/spec/dashboardSpec";

export interface IdleWarehousePresentation {
  opportunityHigh?: number;
  idleWarehouseCount?: number;
  financeShare?: number;
  warehouses: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
  claimBySurfaceId: ReadonlyMap<string, DashboardMaterialClaim>;
}

function readMetricValue(
  rows: ReadonlyArray<Record<string, unknown>>,
  metricId: string,
): number | undefined {
  const match = rows.find(
    (row) => row.metricId === metricId || row.metric_id === metricId,
  );

  return typeof match?.value === "number" ? match.value : undefined;
}

export async function loadIdleWarehousePresentation(
  adapter: DataAdapter,
  spec: DashboardSpec,
): Promise<IdleWarehousePresentation> {
  const [executiveSummary, recommendationQueue, warehouses, metering] =
    await Promise.all([
      adapter.query({
        datasetId: "executive_summary",
        columns: ["metricId", "value", "caption"],
      }),
      adapter.query({
        datasetId: "recommendation_queue",
        columns: [
          "recommendation_id",
          "executive_severity",
          "scope_name",
          "recommendation_type",
          "recommended_action",
          "suggested_owner",
          "estimated_monthly_credit_savings_high",
          "performance_risk",
          "guardrail",
        ],
      }),
      adapter.query({
        datasetId: "show_warehouses",
        columns: [
          "name",
          "auto_suspend",
          "technical_owner",
          "resource_monitor",
        ],
      }),
      adapter.query({
        datasetId: "warehouse_metering_history",
        columns: ["warehouse_name", "credits_used"],
      }),
    ]);

  const claimBySurfaceId = new Map<string, DashboardMaterialClaim>();
  for (const surfaceId of [
    "metric:monthly-opportunity-high",
    "metric:idle-warehouse-count",
    "metric:cost-concentration",
    "metric:warehouse-controls",
  ]) {
    claimBySurfaceId.set(surfaceId, requireMaterialClaim(spec, surfaceId));
  }

  for (const recommendation of recommendationQueue.rows) {
    const recommendationId = recommendation.recommendation_id;
    if (typeof recommendationId !== "string" || recommendationId.length === 0) {
      throw new Error(
        "A material recommendation is missing its stable recommendation id.",
      );
    }
    const surfaceId = `recommendation:${recommendationId}`;
    claimBySurfaceId.set(surfaceId, requireMaterialClaim(spec, surfaceId));
  }

  const financeCredits = metering.rows
    .filter((row) => row.warehouse_name === "FINANCE_REPORTING_WH")
    .reduce(
      (sum, row) =>
        sum + (typeof row.credits_used === "number" ? row.credits_used : 0),
      0,
    );
  const totalCredits = metering.rows.reduce(
    (sum, row) =>
      sum + (typeof row.credits_used === "number" ? row.credits_used : 0),
    0,
  );

  return {
    opportunityHigh: readMetricValue(
      executiveSummary.rows,
      "monthly-opportunity-high",
    ),
    idleWarehouseCount: readMetricValue(
      executiveSummary.rows,
      "idle-warehouse-count",
    ),
    financeShare:
      totalCredits > 0
        ? Math.round((1000 * financeCredits) / totalCredits) / 10
        : undefined,
    warehouses: warehouses.rows,
    recommendations: recommendationQueue.rows,
    claimBySurfaceId,
  };
}

export function describeClaimSource(claim: DashboardMaterialClaim): string {
  const evidence = claim.source.evidence;
  const evidenceLabel =
    evidence.type === "assertion"
      ? `assertion ${evidence.assertionId}`
      : `dataset observation ${evidence.datasetId}`;

  return `${claim.source.artifactDigest} · ${evidenceLabel}`;
}


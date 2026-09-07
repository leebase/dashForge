/**
 * Types for Idle Warehouse Waste Buyer-Visible Dashboard
 * TVIQ-shaped data models: Time-to-Value, Impact, Quality
 */

export interface TimeToValueMetrics {
  immediateAccess: boolean;
  offlineStandalone: boolean;
  zeroCredentialDelay: boolean;
  prioritizedCount: number;
  topPriority: string;
}

export interface ImpactMetrics {
  opportunityCredits: number;
  idleWarehouseCount: number;
  dominantWarehouse: string;
  dominantWarehouseShare: number;
  warehouseTotals: Record<string, number>;
}

export interface QualityMetrics {
  readiness: "controlled" | "blocking";
  artifactDigest: string;
  disclosure: string;
  directionalFraming: string;
  verifiedClaims: string[];
}

export interface RecommendationQueueItem {
  recommendation_id: string;
  executive_severity: string;
  suggested_owner: string;
  recommended_action: string;
  evidence_detail: string;
  guardrail: string;
}

export interface TVIQExecutiveSummary {
  timeToValue: TimeToValueMetrics;
  impact: ImpactMetrics;
  quality: QualityMetrics;
  recommendations: RecommendationQueueItem[];
}

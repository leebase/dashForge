/**
 * Types for Cost Management Storage Waste Vertical Slice.
 *
 * Surfacing orphaned tables, unused time-travel storage, and uncompressed
 * data recommendations to allow decision-makers to prioritize storage spend reductions.
 */

export interface StorageSummary {
  summary_id: string;
  total_storage_bytes: number;
  total_monthly_spend_usd: number;
  recoverable_waste_bytes: number;
  recoverable_waste_opportunity_usd: number;
  stale_table_count: number;
  uncompressed_table_count: number;
  synthetic_seed: number;
  evaluation_timestamp: string;
}

export interface TableStorageMetric {
  table_id: string;
  database_name: string;
  schema_name: string;
  table_name: string;
  table_owner: string;
  row_count: number;
  active_bytes: number;
  time_travel_bytes: number;
  failsafe_bytes: number;
  retained_for_clone_bytes: number;
  total_storage_bytes: number;
  last_altered: string;
}

export interface StaleTable {
  stale_id: string;
  table_id: string;
  table_name: string;
  schema_name: string;
  days_since_last_read: number;
  days_since_last_write: number;
  staleness_category: string;
  monthly_storage_cost_usd: number;
  suggested_action: string;
}

export interface UncompressedStorage {
  uncompressed_id: string;
  object_name: string;
  object_type: string;
  current_format: string;
  target_format: string;
  current_size_bytes: number;
  estimated_compressed_bytes: number;
  projected_byte_savings: number;
  projected_monthly_savings_usd: number;
}

export interface StorageUsageHistory {
  history_id: string;
  usage_date: string;
  active_bytes: number;
  time_travel_bytes: number;
  failsafe_bytes: number;
  stage_bytes: number;
  daily_cost_usd: number;
}

export interface StorageWasteRecommendationItem {
  recommendation_id: string;
  executive_severity: "P0" | "P1" | "P2" | "P3";
  suggested_owner: string;
  recommended_action: string;
  evidence_detail: string;
  guardrail: string;
}

export interface StorageWasteExecutiveSummary {
  headlineSpendUsd: number;
  recoverableOpportunityUsd: number;
  staleTableVolumeBytes: number;
  uncompressedStorageVolumeBytes: number;
  recommendations: StorageWasteRecommendationItem[];
  provenance: {
    packId: string;
    scenarioId: string;
    seed: number;
    disclosure: string;
  };
}

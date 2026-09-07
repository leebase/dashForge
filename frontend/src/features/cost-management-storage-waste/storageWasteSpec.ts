/**
 * Canonical DashboardSpec blueprint for Cost Management Storage Waste accelerator.
 */

export const STORAGE_WASTE_SCENARIO_ID = "storage-waste";
export const STORAGE_WASTE_PACK_ID = "snowflakeCost";
export const STORAGE_WASTE_TEMPLATE_ID = "tpl.snowflakeCost.storage-waste";
export const SYNTHETIC_DEMO_DATA_DISCLOSURE = "Synthetic demo data";

export const STORAGE_WASTE_WIDGET_IDS = {
  kpiTotalStorageSpend: "widget-kpi-total-storage-spend",
  kpiRecoverableWaste: "widget-kpi-recoverable-waste",
  kpiStaleTableStorage: "widget-kpi-stale-table-storage",
  kpiUncompressedStorage: "widget-kpi-uncompressed-storage",
  storageVolumeDistribution: "widget-storage-volume-distribution",
  tableAccessAging: "widget-table-access-aging",
  recommendationQueue: "widget-recommendation-queue",
} as const;

export interface StorageWasteSpecBlueprint {
  id: string;
  packId: string;
  scenarioId: string;
  templateId: string;
  disclosure: string;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    marker?: string;
    datasetId?: string;
  }>;
}

export function createStorageWasteBlueprint(): StorageWasteSpecBlueprint {
  return {
    id: "dashboard.snowflakeCost.storage-waste",
    packId: STORAGE_WASTE_PACK_ID,
    scenarioId: STORAGE_WASTE_SCENARIO_ID,
    templateId: STORAGE_WASTE_TEMPLATE_ID,
    disclosure: SYNTHETIC_DEMO_DATA_DISCLOSURE,
    widgets: [
      {
        id: STORAGE_WASTE_WIDGET_IDS.kpiTotalStorageSpend,
        type: "kpi",
        title: "Total Storage Spend",
        datasetId: "storage_summary",
      },
      {
        id: STORAGE_WASTE_WIDGET_IDS.kpiRecoverableWaste,
        type: "kpi",
        title: "Recoverable Waste Opportunity",
        datasetId: "storage_summary",
      },
      {
        id: STORAGE_WASTE_WIDGET_IDS.kpiStaleTableStorage,
        type: "kpi",
        title: "Stale Table Storage",
        datasetId: "stale_tables",
      },
      {
        id: STORAGE_WASTE_WIDGET_IDS.kpiUncompressedStorage,
        type: "kpi",
        title: "Uncompressed Storage Overhead",
        datasetId: "uncompressed_storage",
      },
      {
        id: STORAGE_WASTE_WIDGET_IDS.storageVolumeDistribution,
        type: "distribution",
        title: "Storage Volume Distribution",
        marker: "storage-volume-distribution",
        datasetId: "table_storage_metrics",
      },
      {
        id: STORAGE_WASTE_WIDGET_IDS.tableAccessAging,
        type: "aging",
        title: "Table Access Aging Analysis",
        marker: "table-access-aging",
        datasetId: "stale_tables",
      },
      {
        id: STORAGE_WASTE_WIDGET_IDS.recommendationQueue,
        type: "queue",
        title: "Prioritized Recommendations",
        marker: "recommendation-queue",
        datasetId: "recommendation_queue",
      },
    ],
  };
}

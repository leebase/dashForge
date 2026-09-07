export * from "./types";
export * from "./storageWasteSpec";

export const STORAGE_WASTE_FEATURE_NAME = "cost-management-storage-waste";
export const STORAGE_WASTE_SCENARIO_ID = "storage-waste";
export const STORAGE_WASTE_PACK_ID = "snowflakeCost";
export const STORAGE_WASTE_TEMPLATE_ID = "tpl.snowflakeCost.storage-waste";
export const SYNTHETIC_DEMO_DATA_DISCLOSURE = "Synthetic demo data";
export const STORAGE_WASTE_SMOKE_MARKERS = [
  "storage-waste",
  "synthetic-demo-data",
  "open-recommendation-queue",
  "recommendation-queue",
] as const;

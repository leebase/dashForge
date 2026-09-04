/**
 * Idle Warehouse Waste vertical slice feature module.
 *
 * Exposes core constants, identifiers, and presentation contracts
 * for the Snowflake Cost Management accelerator in DashForge.
 */

export const IDLE_WAREHOUSE_WASTE_PACK_ID = "snowflakeCost";
export const IDLE_WAREHOUSE_WASTE_SCENARIO_ID = "idle-warehouse-waste";
export const IDLE_WAREHOUSE_WASTE_TEMPLATE_ID = "tpl.snowflakeCost.idle-warehouse-waste";
export const IDLE_WAREHOUSE_WASTE_DISCLOSURE = "Synthetic demo data";

export const IDLE_WAREHOUSE_WASTE_ACTIONS = {
  OPEN_RECOMMENDATION_QUEUE: "open-recommendation-queue",
  SAME_DAY_EXECUTIVE_FOLLOW_UP: "same-day-executive-follow-up",
} as const;

export const IDLE_WAREHOUSE_WASTE_SELECTORS = {
  SCENARIO_ROOT: "idle-warehouse-waste",
  READINESS_CONTROLLED: "controlled",
  STATUS_RECOMMENDATION_QUEUE: "recommendation-queue",
  DISCLOSURE_SYNTHETIC: "synthetic-demo-data",
} as const;

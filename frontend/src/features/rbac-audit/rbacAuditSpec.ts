export const RBAC_AUDIT_SCENARIO_ID = "rbac-audit-foundation";
export const RBAC_AUDIT_PACK_ID = "snowflakeRbac";
export const RBAC_AUDIT_TEMPLATE_ID = "tpl.snowflakeRbac.rbac-audit-foundation";
export const SYNTHETIC_DEMO_DATA_DISCLOSURE = "Synthetic demo data";

export const RBAC_AUDIT_WIDGET_IDS = {
  kpiTotalRoles: "widget-kpi-total-roles",
  kpiActiveUsers: "widget-kpi-active-users",
  kpiElevatedAdmins: "widget-kpi-elevated-admins",
  kpiRiskFindings: "widget-kpi-risk-findings",
  roleHierarchyTree: "widget-role-hierarchy-tree",
  userAccessMatrix: "widget-user-access-matrix",
  governanceFindingsQueue: "widget-governance-findings-queue",
} as const;

export interface RbacAuditSpecBlueprint {
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

export function createRbacAuditBlueprint(): RbacAuditSpecBlueprint {
  return {
    id: "dashboard.snowflakeRbac.rbac-audit-foundation",
    packId: RBAC_AUDIT_PACK_ID,
    scenarioId: RBAC_AUDIT_SCENARIO_ID,
    templateId: RBAC_AUDIT_TEMPLATE_ID,
    disclosure: SYNTHETIC_DEMO_DATA_DISCLOSURE,
    widgets: [
      {
        id: RBAC_AUDIT_WIDGET_IDS.kpiTotalRoles,
        type: "kpi",
        title: "Total Configured Roles",
        datasetId: "rbac_summary",
      },
      {
        id: RBAC_AUDIT_WIDGET_IDS.kpiActiveUsers,
        type: "kpi",
        title: "Active Identities",
        datasetId: "rbac_summary",
      },
      {
        id: RBAC_AUDIT_WIDGET_IDS.kpiElevatedAdmins,
        type: "kpi",
        title: "Elevated Admin Entitlements",
        datasetId: "rbac_summary",
      },
      {
        id: RBAC_AUDIT_WIDGET_IDS.kpiRiskFindings,
        type: "kpi",
        title: "Critical Governance Findings",
        datasetId: "rbac_summary",
      },
      {
        id: RBAC_AUDIT_WIDGET_IDS.roleHierarchyTree,
        type: "tree",
        title: "Role Hierarchy Tree",
        marker: "role-hierarchy-tree",
        datasetId: "role_hierarchy",
      },
      {
        id: RBAC_AUDIT_WIDGET_IDS.userAccessMatrix,
        type: "matrix",
        title: "User Entitlement Audit Matrix",
        marker: "user-access-matrix",
        datasetId: "user_role_assignments",
      },
      {
        id: RBAC_AUDIT_WIDGET_IDS.governanceFindingsQueue,
        type: "queue",
        title: "Prioritized Governance Findings",
        marker: "governance-findings",
        datasetId: "governance_findings",
      },
    ],
  };
}

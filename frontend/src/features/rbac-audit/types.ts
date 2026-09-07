export interface RbacSummary {
  summary_id: string;
  total_roles: number;
  active_users: number;
  elevated_admin_accounts: number;
  critical_risk_findings: number;
  synthetic_seed: number;
  evaluation_timestamp: string;
}

export interface RoleMetadata {
  role_name: string;
  role_type: "SYSTEM" | "FUNCTIONAL" | "ACCESS";
  role_owner: string;
  comment: string;
  created_on: string;
}

export interface RoleHierarchyLink {
  link_id: string;
  parent_role: string;
  child_role: string;
  tree_depth: number;
  granted_by: string;
  grant_date: string;
}

export interface UserRoleAssignment {
  assignment_id: string;
  user_name: string;
  role_name: string;
  grant_type: "DIRECT" | "INHERITED";
  mfa_enabled: boolean;
  account_status: "ACTIVE" | "DORMANT" | "SUSPENDED";
  last_login: string;
}

export interface ObjectGrant {
  grant_id: string;
  grantee_role: string;
  securable_type: "WAREHOUSE" | "DATABASE" | "SCHEMA" | "TABLE";
  securable_name: string;
  privilege: string;
  is_grantable: boolean;
}

export interface GovernanceFinding {
  finding_id: string;
  executive_severity: "P0" | "P1" | "P2";
  suggested_owner: string;
  recommended_action: string;
  risk_detail: string;
  guardrail: string;
}

export interface RbacAuditPresentation {
  summary: RbacSummary;
  roles: RoleMetadata[];
  hierarchy: RoleHierarchyLink[];
  assignments: UserRoleAssignment[];
  grants: ObjectGrant[];
  findings: GovernanceFinding[];
}

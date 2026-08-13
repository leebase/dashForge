import type {
  DashboardClaimEvidence,
  DashboardClaimKind,
  DashboardMaterialClaim,
  DashboardSpec,
  NarrativeSpec,
} from "../../core/spec/dashboardSpec";
import { FIELD_SERVICE_WORK_PACKAGE_DIGEST } from "../../core/data/verifiedSyntheticDataArtifacts";
import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { syncPresenterDraft } from "../presenter/narrativeStore";

export const FIELD_SERVICE_SHOWCASE_PACK_ID = "fieldService";
export const FIELD_SERVICE_SHOWCASE_SCENARIO_ID =
  "first-heat-wave-parts-bottleneck";
export const FIELD_SERVICE_SHOWCASE_TEMPLATE_ID =
  "tpl.fieldService.first-heat-wave-command";

function materialClaim(input: {
  claimId: string;
  surfaceId: string;
  kind: DashboardClaimKind;
  statement: string;
  evidence: DashboardClaimEvidence;
}): DashboardMaterialClaim {
  return {
    claimId: input.claimId,
    surfaceId: input.surfaceId,
    kind: input.kind,
    statement: input.statement,
    source: {
      artifactDigest: FIELD_SERVICE_WORK_PACKAGE_DIGEST,
      evidence: input.evidence,
    },
  };
}

function buildFieldServiceClaimLedger(): DashboardMaterialClaim[] {
  return [
    materialClaim({
      claimId: "claim-kpi-first-time-fix",
      surfaceId: "widget:kpi_first_time_fix",
      kind: "metric",
      statement: "Network first-time fix rate is 75.2% against an 84% target.",
      evidence: {
        type: "assertion",
        assertionId: "network-first-time-fix-below-target",
      },
    }),
    materialClaim({
      claimId: "claim-kpi-emergency-sla",
      surfaceId: "widget:kpi_emergency_sla",
      kind: "metric",
      statement: "Emergency SLA attainment is 83.3% against a 95% target.",
      evidence: {
        type: "assertion",
        assertionId: "network-emergency-sla-below-target",
      },
    }),
    materialClaim({
      claimId: "claim-kpi-repeat-rolls",
      surfaceId: "widget:kpi_repeat_rolls",
      kind: "metric",
      statement: "Repeat truck rolls reached 18.2% against a 10.5% plan.",
      evidence: {
        type: "assertion",
        assertionId: "repeat-truck-roll-rate-elevated",
      },
    }),
    materialClaim({
      claimId: "claim-kpi-overtime",
      surfaceId: "widget:kpi_overtime",
      kind: "metric",
      statement: "Overtime reached 13.1 hours per technician against an 8-hour budget.",
      evidence: {
        type: "assertion",
        assertionId: "overtime-above-budget",
      },
    }),
    materialClaim({
      claimId: "claim-kpi-margin",
      surfaceId: "widget:kpi_margin",
      kind: "metric",
      statement: "Contribution margin is $177.30 per order against a $218 plan.",
      evidence: {
        type: "assertion",
        assertionId: "margin-below-plan",
      },
    }),
    materialClaim({
      claimId: "claim-chart-demand",
      surfaceId: "widget:emergency_demand_vs_plan",
      kind: "metric",
      statement: "Actual emergency work orders exceeded plan by 27.9% in the final four weeks.",
      evidence: {
        type: "assertion",
        assertionId: "late-period-demand-above-plan",
      },
    }),
    materialClaim({
      claimId: "claim-chart-branch-callbacks",
      surfaceId: "widget:branch_repeat_rate",
      kind: "metric",
      statement: "Phoenix West and Las Vegas account for 65.2% of repeat work orders.",
      evidence: {
        type: "assertion",
        assertionId: "two-branches-concentrate-callbacks",
      },
    }),
    materialClaim({
      claimId: "claim-chart-callback-causes",
      surfaceId: "widget:callback_cause_mix",
      kind: "metric",
      statement: "Unavailable parts explain 54.5% of callback volume.",
      evidence: {
        type: "assertion",
        assertionId: "parts-drive-callbacks",
      },
    }),
    materialClaim({
      claimId: "claim-dashboard-description",
      surfaceId: "narrative:dashboard-description",
      kind: "narrative",
      statement: "Heat-wave demand exposed a parts-constrained first-visit problem rather than a network-wide headcount shortage.",
      evidence: {
        type: "assertion",
        assertionId: "parts-drive-callbacks",
      },
    }),
    materialClaim({
      claimId: "claim-narrative-hook",
      surfaceId: "narrative:hook",
      kind: "narrative",
      statement: "Open with the 27.9% late-period demand gap.",
      evidence: {
        type: "assertion",
        assertionId: "late-period-demand-above-plan",
      },
    }),
    materialClaim({
      claimId: "claim-narrative-context",
      surfaceId: "narrative:context",
      kind: "narrative",
      statement: "Frame the 75.2% first-time fix rate as the capacity conversion problem.",
      evidence: {
        type: "assertion",
        assertionId: "network-first-time-fix-below-target",
      },
    }),
    materialClaim({
      claimId: "claim-narrative-tension",
      surfaceId: "narrative:tension",
      kind: "narrative",
      statement: "Show that unavailable parts, not generalized technician underperformance, dominate callbacks.",
      evidence: {
        type: "assertion",
        assertionId: "parts-drive-callbacks",
      },
    }),
    materialClaim({
      claimId: "claim-narrative-resolution",
      surfaceId: "narrative:resolution",
      kind: "recommendation",
      statement: "Universal control-board fill rate is 58%, with 102 units available for transfer.",
      evidence: {
        type: "dataset_observation",
        bindingId: "parts_constraints",
        datasetId: "parts_constraints",
        fields: [
          "partSku",
          "fillRate",
          "transferAvailableUnits",
          "recommendedAction",
        ],
        predicate: { partSku: "BRD-CTRL-U7" },
      },
    }),
    materialClaim({
      claimId: "claim-narrative-call-to-action",
      surfaceId: "narrative:call-to-action",
      kind: "recommendation",
      statement: "Rebalance constrained parts before authorizing broad hiring.",
      evidence: {
        type: "assertion",
        assertionId: "critical-part-fill-rate",
      },
    }),
    materialClaim({
      claimId: "claim-narrative-executive-summary",
      surfaceId: "narrative:executive-summary",
      kind: "narrative",
      statement: "The governed evidence supports a bounded parts-and-dispatch intervention before a headcount response.",
      evidence: {
        type: "assertion",
        assertionId: "parts-drive-callbacks",
      },
    }),
  ];
}

const fieldServiceNarrative: NarrativeSpec = {
  storyArc: {
    hook: {
      headline: "Demand grew. Capacity got trapped in repeat visits.",
      commentary:
        "Emergency work orders ran 27.9% above plan across the final four weeks, but the network did not convert that demand into healthy completed work.",
      widgetIds: ["emergency_demand_vs_plan"],
      transitionText: "The demand spike explains pressure, not the operating failure.",
    },
    context: {
      headline: "First-time fix is the capacity multiplier.",
      commentary:
        "At 75.2% versus an 84% target, too many jobs consume a second dispatch. That pulls emergency SLA attainment to 83.3% and overtime to 13.1 hours per technician.",
      widgetIds: [
        "kpi_first_time_fix",
        "kpi_emergency_sla",
        "kpi_overtime",
      ],
      transitionText: "The next question is whether the failure is network-wide.",
    },
    tension: {
      headline: "Two branches create most of the drag.",
      commentary:
        "Phoenix West and Las Vegas account for 65.2% of repeat work orders. Their callback mix points to constrained van stock before it points to generalized technician productivity.",
      widgetIds: ["branch_repeat_rate", "callback_cause_mix"],
      transitionText: "That concentration makes a bounded intervention possible.",
    },
    resolution: {
      headline: "Move parts before adding people.",
      commentary:
        "Condenser fan motors and universal control boards carry the weakest fill rates while lower-pressure branches hold transferable units. Rebalance stock and protect senior diagnostic support for the next six peak weeks.",
      widgetIds: ["callback_cause_mix", "kpi_repeat_rolls"],
      transitionText: "Treat the intervention as a measured operating test.",
    },
    callToAction: {
      headline: "Make three reversible decisions this week.",
      commentary:
        "Within 48 hours, transfer constrained stock. For six weeks, protect four senior technicians for remote diagnosis. For one week, pilot two dispatch-zone changes and monitor first-time fix, SLA, overtime, and contribution margin.",
      widgetIds: [
        "kpi_first_time_fix",
        "kpi_emergency_sla",
        "kpi_margin",
      ],
    },
  },
  executiveSummary:
    "Heat-wave demand is real, but the avoidable loss is concentrated: Phoenix West and Las Vegas carry most callbacks, and unavailable parts explain the majority cause. Rebalance known stock and diagnostic capacity before making a broad hiring decision.",
  presenterNotes: [
    "State first that every value is deterministic synthetic demo data, not a client result.",
    "Lead with demand versus plan, then separate demand pressure from first-visit execution.",
    "Do not claim that the recommended actions will produce savings; measure the four governed KPIs after the pilot.",
    "The dashboard recommends no inventory, staffing, or dispatch action without human approval.",
  ],
};

export function createFieldServiceShowcaseDashboardSpec(): DashboardSpec {
  const draft = syncPresenterDraft(
    createFreshDraftForScenario(
      FIELD_SERVICE_SHOWCASE_PACK_ID,
      FIELD_SERVICE_SHOWCASE_SCENARIO_ID,
    ),
  );

  return {
    ...draft,
    id: "dashforge-apex-first-heat-wave-command",
    meta: {
      title: "First Heat Wave: Parts, Not People",
      description:
        "Apex Climate Services operating review: isolate the branch-level parts constraint behind callbacks, SLA misses, overtime, and margin leakage before adding headcount.",
      author: "client-meeting-dashboard-builder",
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
      tags: [
        FIELD_SERVICE_SHOWCASE_PACK_ID,
        FIELD_SERVICE_SHOWCASE_SCENARIO_ID,
        "commercial-hvac",
        "synthetic-data",
        "artifact-backed",
      ],
    },
    theme: {
      id: "dark-executive",
      overrides: {
        "--df-accent": "#f59e0b",
        "--df-accent-soft": "rgba(245, 158, 11, 0.16)",
        "--df-good": "#34d399",
        "--df-warning": "#fbbf24",
        "--df-danger": "#fb7185",
      },
    },
    dataContext: {
      mode: "artifact",
      artifact: {
        artifactType: "synthetic-data-work-package",
        payloadSchemaVersion: "synthetic-data-work-package/1.0",
        digest: FIELD_SERVICE_WORK_PACKAGE_DIGEST,
        employeeId: "synthetic-data-story-engineer",
        qualityReport: {
          schemaVersion: "data-quality-report/1.0",
          path: "quality-report.json",
          sha256:
            "sha256:f68235d8047326b660b99beef915ac91f06051b7cbb666df30296009d32ab77e",
        },
        snapshot: {
          path: "snapshot.json",
          sha256:
            "sha256:0d3325b6fe29fbb10a30939431d86c1d385370de1ba086ef56dbc703af5c0c49",
          datasetIds: [
            "executive_summary",
            "weekly_service_trend",
            "branch_performance",
            "callback_causes",
            "parts_constraints",
          ],
        },
        bindings: {
          executive_summary: {
            snapshotDatasetId: "executive_summary",
            fieldMap: {
              metricId: "metricId",
              value: "value",
              delta: "delta",
              deltaLabel: "deltaLabel",
              prefix: "prefix",
              suffix: "suffix",
              caption: "caption",
            },
          },
          weekly_service_trend: {
            snapshotDatasetId: "weekly_service_trend",
            fieldMap: {
              week: "week",
              weekLabel: "weekLabel",
              series: "series",
              workOrders: "workOrders",
            },
          },
          branch_performance: {
            snapshotDatasetId: "branch_performance",
            fieldMap: {
              branchId: "branchId",
              branchName: "branchName",
              market: "market",
              technicianCount: "technicianCount",
              completedWorkOrders: "completedWorkOrders",
              repeatWorkOrders: "repeatWorkOrders",
              firstTimeFixRate: "firstTimeFixRate",
              firstTimeFixTarget: "firstTimeFixTarget",
              repeatTruckRollRate: "repeatTruckRollRate",
              repeatTruckRollTarget: "repeatTruckRollTarget",
              emergencySlaRate: "emergencySlaRate",
              emergencySlaTarget: "emergencySlaTarget",
              overtimeHoursPerTech: "overtimeHoursPerTech",
              overtimeBudgetHours: "overtimeBudgetHours",
              contributionMarginPerOrder: "contributionMarginPerOrder",
              contributionMarginPlan: "contributionMarginPlan",
            },
          },
          callback_causes: {
            snapshotDatasetId: "callback_causes",
            fieldMap: {
              branchId: "branchId",
              branchName: "branchName",
              cause: "cause",
              repeatWorkOrders: "repeatWorkOrders",
              sharePct: "sharePct",
            },
          },
          parts_constraints: {
            snapshotDatasetId: "parts_constraints",
            fieldMap: {
              partSku: "partSku",
              partName: "partName",
              equipmentFamily: "equipmentFamily",
              branchesAffected: "branchesAffected",
              fillRate: "fillRate",
              targetFillRate: "targetFillRate",
              delayedJobs: "delayedJobs",
              transferAvailableUnits: "transferAvailableUnits",
              recommendedAction: "recommendedAction",
            },
          },
        },
      },
      timeRange: {
        start: "2026-04-27",
        end: "2026-07-19",
        granularity: "week",
      },
    },
    layout: {
      ...draft.layout,
      rowHeight: 120,
    },
    narrative: fieldServiceNarrative,
    governance: {
      claimLedger: {
        schemaVersion: "dashboard-claim-ledger/1.0",
        upstreamArtifactDigest: FIELD_SERVICE_WORK_PACKAGE_DIGEST,
        claims: buildFieldServiceClaimLedger(),
      },
      additionalMaterialSurfaceIds: [],
    },
  };
}

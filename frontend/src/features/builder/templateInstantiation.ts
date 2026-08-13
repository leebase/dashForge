import { getDefaultTemplateForScenario, getTemplateById } from "../../mock-data/templateCatalog";
import type {
  DashboardSpec,
  WidgetSpec,
} from "../../core/spec/dashboardSpec";
import { createDefaultNarrative } from "../presenter/narrativeStore";
import { createPaletteWidget } from "./widgetFactories";

type TemplateWidgetBlueprint = {
  type: WidgetSpec["chart"]["type"];
  id: string;
  position: WidgetSpec["position"];
  title?: string;
  subtitle?: string;
  caption?: string;
  annotations?: WidgetSpec["annotations"];
  patch?: (widget: WidgetSpec) => WidgetSpec;
};

function patchWidgetChart(
  widget: WidgetSpec,
  chartPatch: Partial<WidgetSpec["chart"]>,
  data: WidgetSpec["data"],
) {
  return {
    ...widget,
    chart: {
      ...widget.chart,
      ...chartPatch,
    },
    data,
  } as WidgetSpec;
}

const TEMPLATE_BLUEPRINTS: Record<string, TemplateWidgetBlueprint[]> = {
  "healthcare:executive_summary": [
    { type: "kpi", id: "bed-occupancy-kpi", position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: "gauge", id: "readmission-gauge", position: { x: 3, y: 0, w: 3, h: 3 } },
    { type: "line", id: "patient-satisfaction-line", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "capacity-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "healthcare:operational_detail": [
    { type: "bar", id: "occupancy-bar", position: { x: 0, y: 0, w: 6, h: 3 } },
    { type: "sparkline", id: "occupancy-sparkline", position: { x: 6, y: 0, w: 3, h: 2 } },
    { type: "donut", id: "care-setting-donut", position: { x: 9, y: 0, w: 3, h: 3 } },
    { type: "table", id: "monthly-capacity-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "healthcare:risk_alert": [
    {
      type: "gauge",
      id: "readmission-risk-gauge",
      position: { x: 0, y: 0, w: 3, h: 3 },
      title: "Readmission Risk",
    },
    { type: "kpi", id: "occupancy-risk-kpi", position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: "bar", id: "occupancy-pressure-bar", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "line", id: "satisfaction-watch-line", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "tpl.healthcare.ed-throughput-command": [
    {
      type: "kpi",
      id: "kpi_arrivals",
      position: { x: 0, y: 0, w: 2, h: 2 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "monitoring",
          encoding: {
            value: {
              field: "ed_arrivals_per_day",
              format: "integer",
            },
          },
          kpiConfig: {
            deltaField: "ed_arrivals_wow_delta",
            deltaLabel: "vs last week",
            deltaFormat: "absolute",
            deltaPositive: "bad",
            suffix: "/day",
          },
        },
        {
          source: "dataset",
          datasetId: "monthly_metrics",
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          limit: 1,
        },),
      title: "ED Arrivals / Day",
      subtitle: "Demand stayed elevated",
    },
    {
      type: "kpi",
      id: "kpi_dtp",
      position: { x: 2, y: 0, w: 2, h: 2 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "anomaly",
          encoding: {
            value: {
              field: "door_to_provider_minutes",
              format: "decimal-1",
            },
          },
          kpiConfig: {
            deltaField: "door_to_provider_wow_delta",
            deltaLabel: "vs last week",
            deltaFormat: "absolute",
            deltaPositive: "bad",
            suffix: " min",
          },
        },
        {
          source: "dataset",
          datasetId: "monthly_metrics",
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          limit: 1,
        },),
      title: "Door To Provider",
      subtitle: "Above target for six weeks",
    },
    {
      type: "kpi",
      id: "kpi_lwbs",
      position: { x: 4, y: 0, w: 2, h: 2 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "anomaly",
          encoding: {
            value: {
              field: "lwbs_rate",
              format: "percent",
            },
          },
          kpiConfig: {
            deltaField: "lwbs_wow_delta",
            deltaLabel: "vs last week",
            deltaFormat: "absolute",
            deltaPositive: "bad",
            suffix: "%",
          },
        },
        {
          source: "dataset",
          datasetId: "monthly_metrics",
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          limit: 1,
        },),
      title: "LWBS Rate",
      subtitle: "Access leakage is widening",
    },
    {
      type: "kpi",
      id: "kpi_boarding",
      position: { x: 6, y: 0, w: 2, h: 2 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "anomaly",
          encoding: {
            value: {
              field: "avg_boarding_hours",
              format: "decimal-1",
            },
          },
          kpiConfig: {
            deltaField: "boarding_wow_delta",
            deltaLabel: "vs last week",
            deltaFormat: "absolute",
            deltaPositive: "bad",
            suffix: " hrs",
          },
        },
        {
          source: "dataset",
          datasetId: "monthly_metrics",
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          limit: 1,
        },),
      title: "Avg Boarding Hours",
      subtitle: "Inpatient flow is the amplifier",
    },
    {
      type: "kpi",
      id: "kpi_discharge",
      position: { x: 8, y: 0, w: 2, h: 2 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "target_vs_actual",
          encoding: {
            value: {
              field: "discharge_before_noon_rate",
              format: "percent",
            },
          },
          kpiConfig: {
            deltaField: "discharge_wow_delta",
            deltaLabel: "vs last week",
            deltaFormat: "absolute",
            deltaPositive: "good",
            suffix: "%",
          },
        },
        {
          source: "dataset",
          datasetId: "monthly_metrics",
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          limit: 1,
        },),
      title: "Discharge Before Noon",
      subtitle: "Best immediate recovery lever",
    },
    {
      type: "line",
      id: "trend_dtp",
      position: { x: 0, y: 2, w: 4, h: 3 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "trend",
          encoding: {
            x: { field: "week_start" },
            y: { field: "door_to_provider_minutes" },
          },
          options: {
            smooth: true,
            showGrid: true,
            showTooltip: true,
          },
        },
        {
          source: "dataset",
          datasetId: "monthly_metrics",
          columns: ["week_start", "door_to_provider_minutes"],
          sortBy: {
            field: "week_start",
            direction: "asc",
          },
        },),
      title: "Six-Week DTP Trend",
      subtitle: "Persistent enterprise pressure",
      caption:
        "The system has stayed above the 45-minute target for the full six-week run.",
      annotations: [
        {
          type: "reference_line",
          label: "Target",
          value: 45,
          style: "dashed",
        },
      ],
    },
    {
      type: "bar",
      id: "facility_rank",
      position: { x: 4, y: 2, w: 4, h: 3 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "ranking",
          encoding: {
            x: { field: "facility_name" },
            y: { field: "door_to_provider_minutes" },
          },
          options: {
            showGrid: true,
          },
        },
        {
          source: "dataset",
          datasetId: "facility_summary",
          columns: ["facility_name", "door_to_provider_minutes"],
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          sortBy: {
            field: "door_to_provider_minutes",
            direction: "desc",
          },
        },),
      title: "Facilities Driving Delay",
      subtitle: "Metro Community and North Medical are the hotspots",
      caption:
        "Site concentration is more useful than an enterprise average when the room needs intervention decisions.",
    },
    {
      type: "table",
      id: "priority_table",
      position: { x: 8, y: 2, w: 4, h: 3 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "comparison",
          encoding: {
            columns: [
              { field: "priority_status", label: "Priority" },
              { field: "facility_name", label: "Facility" },
              { field: "door_to_provider_minutes", label: "DTP", format: "decimal-1" },
              { field: "avg_boarding_hours", label: "Boarding", format: "decimal-1" },
              {
                field: "discharge_before_noon_rate",
                label: "Discharge By Noon",
                format: "percent",
              },
            ],
          },
        },
        {
          source: "dataset",
          datasetId: "facility_summary",
          columns: [
            "priority_status",
            "facility_name",
            "door_to_provider_minutes",
            "avg_boarding_hours",
            "discharge_before_noon_rate",
            "risk_rank",
          ],
          filters: [{ field: "week_start", operator: "eq", value: "2026-03-23" }],
          sortBy: {
            field: "risk_rank",
            direction: "asc",
          },
          limit: 6,
        },),
      title: "Priority Sites This Week",
      subtitle: "Management language table",
    },
    {
      type: "stacked_bar",
      id: "service_line_driver",
      position: { x: 0, y: 5, w: 6, h: 3 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "comparison",
          encoding: {
            x: { field: "service_line" },
            y: { field: "avg_boarding_hours" },
            series: { field: "facility_name" },
          },
          options: {
            showLegend: true,
            showGrid: true,
          },
        },
        {
          source: "dataset",
          datasetId: "department_summary",
          columns: [
            "service_line",
            "facility_name",
            "avg_boarding_hours",
            "discharge_before_noon_rate",
          ],
          filters: [
            { field: "week_start", operator: "eq", value: "2026-03-23" },
            {
              field: "facility_id",
              operator: "in",
              value: ["metro_community", "north_medical"],
            },
          ],
          sortBy: {
            field: "avg_boarding_hours",
            direction: "desc",
          },
        },),
      title: "Boarding vs Discharge Flow",
      subtitle: "Medicine and telemetry are the clearest bottlenecks",
      caption:
        "Focus on inpatient flow for the fastest intervention window in the two hotspot facilities.",
    },
    {
      type: "bar",
      id: "staffing_context",
      position: { x: 6, y: 5, w: 6, h: 3 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "comparison",
          encoding: {
            x: { field: "shift" },
            y: { field: "surge_gap_hours" },
            series: { field: "facility_name" },
          },
          options: {
            showLegend: true,
            showGrid: true,
          },
        },
        {
          source: "dataset",
          datasetId: "staffing_coverage",
          columns: [
            "shift",
            "facility_name",
            "surge_gap_hours",
            "rn_fill_rate",
            "provider_fill_rate",
          ],
          filters: [
            {
              field: "facility_id",
              operator: "in",
              value: ["metro_community", "north_medical", "saint_catherine"],
            },
          ],
          sortBy: {
            field: "surge_gap_hours",
            direction: "desc",
          },
        },),
      title: "Coverage Stress By Shift",
      subtitle: "Evening and night strain matter",
    },
    {
      type: "line",
      id: "experience_consequence",
      position: { x: 0, y: 8, w: 6, h: 3 },
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "trend",
          encoding: {
            x: { field: "week_start" },
            y: { field: "patient_satisfaction_score" },
            series: { field: "facility_name" },
          },
          options: {
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            smooth: true,
          },
        },
        {
          source: "dataset",
          datasetId: "patient_experience",
          columns: [
            "week_start",
            "facility_name",
            "patient_satisfaction_score",
            "lwbs_rate",
            "diversion_hours",
          ],
          filters: [
            {
              field: "facility_id",
              operator: "in",
              value: ["metro_community", "north_medical", "saint_catherine"],
            },
          ],
          sortBy: {
            field: "week_start",
            direction: "asc",
          },
        },),
      title: "Throughput Consequences",
      subtitle: "Satisfaction decline follows throughput pressure",
      caption:
        "Patient experience is now lagging the throughput movement by about one to two weeks.",
    },
  ],
  "tpl.fieldService.first-heat-wave-command": [
    {
      type: "kpi",
      id: "kpi_first_time_fix",
      position: { x: 0, y: 0, w: 2, h: 2 },
      title: "First-Time Fix",
      subtitle: "84% target",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "target_vs_actual",
            encoding: {
              value: { field: "value", format: "decimal-1" },
            },
            kpiConfig: {
              deltaField: "delta",
              deltaFormat: "absolute",
              deltaPositive: "good",
            },
          },
          {
            source: "dataset",
            datasetId: "executive_summary",
            filters: [
              {
                field: "metricId",
                operator: "eq",
                value: "first-time-fix-rate",
              },
            ],
            limit: 1,
          },
        ),
    },
    {
      type: "kpi",
      id: "kpi_emergency_sla",
      position: { x: 2, y: 0, w: 2, h: 2 },
      title: "Emergency SLA",
      subtitle: "95% target",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "target_vs_actual",
            encoding: {
              value: { field: "value", format: "decimal-1" },
            },
            kpiConfig: {
              deltaField: "delta",
              deltaFormat: "absolute",
              deltaPositive: "good",
            },
          },
          {
            source: "dataset",
            datasetId: "executive_summary",
            filters: [
              {
                field: "metricId",
                operator: "eq",
                value: "emergency-sla-rate",
              },
            ],
            limit: 1,
          },
        ),
    },
    {
      type: "kpi",
      id: "kpi_repeat_rolls",
      position: { x: 4, y: 0, w: 2, h: 2 },
      title: "Repeat Truck Rolls",
      subtitle: "10.5% plan",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "anomaly",
            encoding: {
              value: { field: "value", format: "decimal-1" },
            },
            kpiConfig: {
              deltaField: "delta",
              deltaFormat: "absolute",
              deltaPositive: "bad",
            },
          },
          {
            source: "dataset",
            datasetId: "executive_summary",
            filters: [
              {
                field: "metricId",
                operator: "eq",
                value: "repeat-truck-roll-rate",
              },
            ],
            limit: 1,
          },
        ),
    },
    {
      type: "kpi",
      id: "kpi_overtime",
      position: { x: 6, y: 0, w: 3, h: 2 },
      title: "Overtime / Tech",
      subtitle: "8.0h budget",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "anomaly",
            encoding: {
              value: { field: "value", format: "decimal-1" },
            },
            kpiConfig: {
              deltaField: "delta",
              deltaFormat: "percent",
              deltaPositive: "bad",
            },
          },
          {
            source: "dataset",
            datasetId: "executive_summary",
            filters: [
              {
                field: "metricId",
                operator: "eq",
                value: "overtime-hours-per-tech",
              },
            ],
            limit: 1,
          },
        ),
    },
    {
      type: "kpi",
      id: "kpi_margin",
      position: { x: 9, y: 0, w: 3, h: 2 },
      title: "Contribution Margin",
      subtitle: "$218 / order plan",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "target_vs_actual",
            encoding: {
              value: { field: "value", format: "decimal-1" },
            },
            kpiConfig: {
              deltaField: "delta",
              deltaFormat: "percent",
              deltaPositive: "good",
            },
          },
          {
            source: "dataset",
            datasetId: "executive_summary",
            filters: [
              {
                field: "metricId",
                operator: "eq",
                value: "contribution-margin-per-order",
              },
            ],
            limit: 1,
          },
        ),
    },
    {
      type: "line",
      id: "emergency_demand_vs_plan",
      position: { x: 0, y: 2, w: 6, h: 4 },
      title: "Emergency Demand Cleared Plan",
      subtitle: "Weekly work orders · actual vs operating plan",
      caption:
        "The final four weeks ran 27.9% above plan, turning first-visit misses into a capacity problem.",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "trend",
            encoding: {
              x: { field: "weekLabel", label: "Week" },
              y: { field: "workOrders", label: "Emergency work orders" },
              series: { field: "series", label: "Series" },
            },
            options: {
              showGrid: true,
              showLegend: true,
              showTooltip: true,
              smooth: true,
            },
          },
          {
            source: "dataset",
            datasetId: "weekly_service_trend",
            columns: ["week", "weekLabel", "series", "workOrders"],
          },
        ),
    },
    {
      type: "bar",
      id: "branch_repeat_rate",
      position: { x: 6, y: 2, w: 6, h: 4 },
      title: "Two Branches Carry the Callback Burden",
      subtitle: "Repeat truck-roll rate by branch · 10.5% plan",
      caption:
        "Phoenix West and Las Vegas account for 65.2% of network repeat work orders.",
      annotations: [
        {
          type: "reference_line",
          value: 10.5,
          label: "10.5% plan",
          style: "dashed",
        },
      ],
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "comparison",
            encoding: {
              x: { field: "branchName", label: "Branch" },
              y: {
                field: "repeatTruckRollRate",
                label: "Repeat truck-roll rate (%)",
              },
            },
            options: {
              showGrid: true,
              showTooltip: true,
              horizontal: true,
            },
          },
          {
            source: "dataset",
            datasetId: "branch_performance",
            columns: [
              "branchName",
              "repeatTruckRollRate",
              "repeatTruckRollTarget",
            ],
            sortBy: {
              field: "repeatTruckRollRate",
              direction: "desc",
            },
          },
        ),
    },
    {
      type: "stacked_bar",
      id: "callback_cause_mix",
      position: { x: 0, y: 6, w: 12, h: 4 },
      title: "The Constraint Is in the Van, Not the Headcount Plan",
      subtitle: "Repeat work orders by branch and documented callback cause",
      caption:
        "Unavailable parts explain 54.5% of callback volume; fan motors and control boards have the weakest fill rates.",
      patch: (widget) =>
        patchWidgetChart(
          widget,
          {
            intent: "composition",
            encoding: {
              x: { field: "branchName", label: "Branch" },
              y: { field: "repeatWorkOrders", label: "Repeat work orders" },
              series: { field: "cause", label: "Callback cause" },
            },
            options: {
              showGrid: true,
              showLegend: true,
              showTooltip: true,
              stack: true,
            },
          },
          {
            source: "dataset",
            datasetId: "callback_causes",
            columns: [
              "branchName",
              "cause",
              "repeatWorkOrders",
              "sharePct",
            ],
          },
        ),
    },
  ],
  "financial:executive_summary": [
    { type: "kpi", id: "aum-kpi", position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: "gauge", id: "retention-gauge", position: { x: 3, y: 0, w: 3, h: 3 } },
    { type: "line", id: "aum-line", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "monthly-summary-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "financial:operational_detail": [
    { type: "donut", id: "advisor-mix-donut", position: { x: 0, y: 0, w: 4, h: 3 } },
    { type: "bar", id: "net-flow-bar", position: { x: 4, y: 0, w: 8, h: 3 } },
    { type: "sparkline", id: "retention-sparkline", position: { x: 0, y: 3, w: 3, h: 2 } },
    { type: "table", id: "ops-table", position: { x: 3, y: 3, w: 9, h: 3 } },
  ],
  "financial:risk_alert": [
    { type: "gauge", id: "retention-risk-gauge", position: { x: 0, y: 0, w: 3, h: 3 } },
    { type: "kpi", id: "aum-watch-kpi", position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: "bar", id: "flow-pressure-bar", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "donut", id: "concentration-donut", position: { x: 0, y: 3, w: 4, h: 3 } },
    { type: "table", id: "risk-table", position: { x: 4, y: 3, w: 8, h: 3 } },
  ],
  "saas:executive_summary": [
    { type: "kpi", id: "mrr-kpi", position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: "gauge", id: "churn-gauge", position: { x: 3, y: 0, w: 3, h: 3 } },
    { type: "line", id: "arr-line", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "feature-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "saas:operational_detail": [
    { type: "bar", id: "support-bar", position: { x: 0, y: 0, w: 6, h: 3 } },
    { type: "donut", id: "segment-donut", position: { x: 6, y: 0, w: 3, h: 3 } },
    { type: "sparkline", id: "mrr-sparkline", position: { x: 9, y: 0, w: 3, h: 2 } },
    { type: "table", id: "feature-detail-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "saas:risk_alert": [
    {
      type: "gauge",
      id: "churn-risk-gauge",
      position: { x: 0, y: 0, w: 3, h: 3 },
      title: "Churn Risk",
    },
    { type: "kpi", id: "mrr-watch-kpi", position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: "bar", id: "support-pressure-bar", position: { x: 6, y: 0, w: 6, h: 3 } },
    { type: "table", id: "risk-feature-table", position: { x: 0, y: 3, w: 12, h: 3 } },
  ],
  "tpl.snowflakeCost.idle-warehouse-waste": [
    {
      type: "kpi",
      id: "kpi_monthly_opportunity",
      position: { x: 0, y: 0, w: 3, h: 2 },
      title: "Monthly Opportunity (High)",
      subtitle: "Idle warehouse waste ceiling",
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "monitoring",
          encoding: {
            value: {
              field: "value",
              format: "integer",
            },
          },
          kpiConfig: {
            deltaField: "delta",
            deltaLabel: "credits/month",
            deltaFormat: "absolute",
            deltaPositive: "good",
            suffix: " credits",
          },
        },
        {
          source: "dataset",
          datasetId: "executive_summary",
          filters: [{ field: "metricId", operator: "eq", value: "monthly-opportunity-high" }],
          limit: 1,
        },),
    },
    {
      type: "kpi",
      id: "kpi_idle_warehouse_count",
      position: { x: 3, y: 0, w: 3, h: 2 },
      title: "Idle Warehouse Count",
      subtitle: "Weak or missing suspension policy",
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "anomaly",
          encoding: {
            value: {
              field: "value",
              format: "integer",
            },
          },
          kpiConfig: {
            deltaField: "delta",
            deltaLabel: "owner review",
            deltaFormat: "absolute",
            deltaPositive: "bad",
          },
        },
        {
          source: "dataset",
          datasetId: "executive_summary",
          filters: [{ field: "metricId", operator: "eq", value: "idle-warehouse-count" }],
          limit: 1,
        },),
    },
    {
      type: "bar",
      id: "warehouse_credit_concentration",
      position: { x: 6, y: 0, w: 6, h: 3 },
      title: "Warehouse Credit Concentration",
      subtitle: "FINANCE_REPORTING_WH dominates idle warehouse waste",
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "comparison",
          encoding: {
            x: { field: "warehouse_name" },
            y: { field: "credits_used" },
          },
          options: {
            showGrid: true,
            showTooltip: true,
          },
        },
        {
          source: "dataset",
          datasetId: "warehouse_metering_history",
          columns: ["usage_day", "warehouse_name", "credits_used"],
          sortBy: {
            field: "usage_day",
            direction: "asc",
          },
        },),
    },
    {
      type: "table",
      id: "warehouse_control_gaps",
      position: { x: 0, y: 3, w: 6, h: 3 },
      title: "Warehouse Control Gaps",
      subtitle: "Auto-suspend, owner, and monitor evidence",
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "comparison",
          encoding: {
            columns: [
              { field: "name", label: "Warehouse" },
              { field: "size", label: "Size" },
              { field: "auto_suspend", label: "Auto Suspend (s)" },
              { field: "business_owner", label: "Business Owner" },
              { field: "technical_owner", label: "Technical Owner" },
              { field: "resource_monitor", label: "Resource Monitor" },
            ],
          },
        },
        {
          source: "dataset",
          datasetId: "show_warehouses",
          columns: [
            "name",
            "size",
            "auto_suspend",
            "business_owner",
            "technical_owner",
            "resource_monitor",
          ],
        },),
    },
    {
      type: "table",
      id: "recommendation_queue_table",
      position: { x: 6, y: 3, w: 6, h: 3 },
      title: "Prioritized Recommendations",
      subtitle: "Low-risk actions with owner validation required",
      patch: (widget) =>
        patchWidgetChart(widget,
        {
          intent: "ranking",
          encoding: {
            columns: [
              { field: "executive_severity", label: "Priority" },
              { field: "scope_name", label: "Warehouse" },
              { field: "recommendation_type", label: "Type" },
              { field: "recommended_action", label: "Action" },
              { field: "suggested_owner", label: "Suggested Owner" },
              {
                field: "estimated_monthly_credit_savings_high",
                label: "Savings High",
              },
              { field: "guardrail", label: "Guardrail" },
            ],
          },
        },
        {
          source: "dataset",
          datasetId: "recommendation_queue",
          columns: [
            "executive_severity",
            "scope_name",
            "recommendation_type",
            "recommended_action",
            "suggested_owner",
            "estimated_monthly_credit_savings_low",
            "estimated_monthly_credit_savings_high",
            "guardrail",
            "performance_risk",
          ],
        },),
    },
  ],
};

function cloneWidget(widget: WidgetSpec): WidgetSpec {
  return JSON.parse(JSON.stringify(widget)) as WidgetSpec;
}

function resolveBlueprintKey(templateId: string, packId: string, intent: string) {
  const templateSpecificBlueprint = TEMPLATE_BLUEPRINTS[templateId];

  if (templateSpecificBlueprint) {
    return templateId;
  }

  return `${packId}:${intent}`;
}

function resolveScenarioId(allowedScenarioIds: string[], requestedScenarioId?: string) {
  if (requestedScenarioId && allowedScenarioIds.includes(requestedScenarioId)) {
    return requestedScenarioId;
  }

  return allowedScenarioIds[0];
}

function createTemplateWidgets(
  packId: string,
  blueprints: TemplateWidgetBlueprint[],
): WidgetSpec[] {
  return blueprints.map((blueprint) => {
    const starter = createPaletteWidget(
      packId,
      blueprint.type,
      blueprint.id,
      blueprint.position,
    );
    const withOverrides = {
      ...starter,
      position: blueprint.position,
      title: blueprint.title ?? starter.title,
      subtitle: blueprint.subtitle ?? starter.subtitle,
      caption: blueprint.caption ?? starter.caption,
    };

    return cloneWidget(blueprint.patch ? blueprint.patch(withOverrides) : withOverrides);
  });
}

export function instantiateTemplateSpec(
  templateId: string,
  options: {
    scenarioId?: string;
    author?: string;
  } = {},
): DashboardSpec {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Unknown template "${templateId}".`);
  }

  const scenarioId = resolveScenarioId(template.scenarioIds, options.scenarioId);
  const blueprintKey = resolveBlueprintKey(template.templateId, template.packId, template.intent);
  const blueprints = TEMPLATE_BLUEPRINTS[blueprintKey];

  if (!blueprints) {
    throw new Error(`No builder blueprint is registered for template "${templateId}".`);
  }

  const timestamp = new Date().toISOString();
  const widgets = createTemplateWidgets(template.packId, blueprints);

  return {
    id: `dashforge-${template.templateId.replaceAll(".", "-")}`,
    specVersion: "1.0",
    meta: {
      title: template.title,
      description: template.description,
      author: options.author ?? "DashForge Builder",
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [template.packId, scenarioId, template.intent, "sprint-6"],
    },
    intent: {
      type: template.intent,
      audience: template.audience,
      industry: template.packId,
      scenario: scenarioId,
    },
    theme: {
      id: template.intent === "executive_summary" ? "dark-executive" : "light-professional",
    },
    dataContext: {
      mode: "mock",
      mock: {
        packId: template.packId,
        scenarioId,
        seed: 8606,
      },
      timeRange: {
        start: "2025-01-01",
        end: "2025-12-31",
        granularity: "month",
      },
    },
    layout: {
      columns: 12,
      rowHeight: 88,
      breakpoints: {
        lg: 1200,
        md: 996,
        sm: 768,
      },
      compaction: "vertical",
    },
    widgets,
    narrative: createDefaultNarrative(widgets, template.title),
    filters: [],
  };
}

export function createFreshDraftForScenario(
  packId: string,
  scenarioId: string,
): DashboardSpec {
  const defaultTemplate = getDefaultTemplateForScenario(packId, scenarioId);

  if (!defaultTemplate) {
    throw new Error(
      `No default template is registered for ${packId}/${scenarioId}.`,
    );
  }

  return instantiateTemplateSpec(defaultTemplate.templateId, { scenarioId });
}

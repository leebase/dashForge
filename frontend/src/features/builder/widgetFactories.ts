import {
  type ChartType,
  type DashboardSpec,
  type DatasetWidgetDataRef,
  type WidgetPosition,
  type WidgetSpec,
} from "../../core/spec/dashboardSpec";

const DEFAULT_WIDGET_SIZE: Record<ChartType, Pick<WidgetPosition, "w" | "h">> = {
  kpi: { w: 3, h: 2 },
  line: { w: 6, h: 3 },
  bar: { w: 6, h: 3 },
  stacked_bar: { w: 6, h: 4 },
  donut: { w: 4, h: 3 },
  table: { w: 12, h: 3 },
  sparkline: { w: 3, h: 2 },
  gauge: { w: 3, h: 3 },
};

function datasetRef(
  datasetId: string,
  options: Omit<DatasetWidgetDataRef, "source" | "datasetId"> = {},
): DatasetWidgetDataRef {
  return {
    source: "dataset",
    datasetId,
    ...options,
  };
}

export function getDefaultWidgetPosition(
  spec: DashboardSpec,
  chartType: ChartType,
): WidgetPosition {
  const size = DEFAULT_WIDGET_SIZE[chartType];
  const maxY = spec.widgets.reduce(
    (currentMax, widget) => Math.max(currentMax, widget.position.y + widget.position.h),
    0,
  );

  return {
    x: 0,
    y: maxY,
    w: Math.min(size.w, spec.layout.columns),
    h: size.h,
    minW: Math.min(size.w, spec.layout.columns),
    minH: Math.max(2, Math.min(size.h, 2)),
  };
}

function createHealthcareWidget(
  chartType: ChartType,
  widgetId: string,
  position: WidgetPosition,
): WidgetSpec {
  switch (chartType) {
    case "kpi":
      return {
        id: widgetId,
        position,
        title: "Bed Occupancy",
        subtitle: "Current seasonal load",
        chart: {
          type: "kpi",
          intent: "monitoring",
          encoding: {
            value: { field: "value" },
          },
          kpiConfig: {
            deltaField: "delta",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "bed-occupancy" }],
          limit: 1,
        }),
      };
    case "line":
      return {
        id: widgetId,
        position,
        title: "Patient Satisfaction",
        subtitle: "Monthly quality trend",
        chart: {
          type: "line",
          intent: "trend",
          encoding: {
            x: { field: "month" },
            y: { field: "patientSatisfaction" },
          },
          options: {
            smooth: true,
            showGrid: true,
            showTooltip: true,
          },
        },
        data: datasetRef("monthly_capacity", {
          columns: ["month", "patientSatisfaction"],
        }),
      };
    case "bar":
      return {
        id: widgetId,
        position,
        title: "Bed Occupancy Trend",
        subtitle: "Monthly capacity pressure",
        chart: {
          type: "bar",
          intent: "comparison",
          encoding: {
            x: { field: "month" },
            y: { field: "bedOccupancy" },
          },
          options: {
            showGrid: true,
          },
        },
        data: datasetRef("monthly_capacity", {
          columns: ["month", "bedOccupancy"],
        }),
      };
    case "stacked_bar":
      return {
        id: widgetId,
        position,
        title: "Operational Mix",
        subtitle: "Manual stack starter",
        chart: {
          type: "stacked_bar",
          intent: "composition",
          encoding: {
            x: { field: "label" },
            y: { field: "value" },
            series: { field: "series" },
          },
          options: {
            showLegend: true,
          },
        },
        data: {
          source: "inline",
          payload: {
            points: [
              { label: "ED", series: "Target", value: 82 },
              { label: "ED", series: "Actual", value: 91 },
              { label: "Inpatient", series: "Target", value: 84 },
              { label: "Inpatient", series: "Actual", value: 88 },
              { label: "Observation", series: "Target", value: 76 },
              { label: "Observation", series: "Actual", value: 81 },
            ],
            caption: "Inline starter content for builder composition work.",
          },
        },
      };
    case "donut":
      return {
        id: widgetId,
        position,
        title: "Care Setting Mix",
        subtitle: "Inline composition starter",
        chart: {
          type: "donut",
          intent: "composition",
          encoding: {
            category: { field: "label" },
            value: { field: "value" },
          },
        },
        data: {
          source: "inline",
          payload: {
            points: [
              { label: "ED", value: 38 },
              { label: "Inpatient", value: 44 },
              { label: "Observation", value: 18 },
            ],
            caption: "Starter mix for workshop edits.",
          },
        },
      };
    case "table":
      return {
        id: widgetId,
        position,
        title: "Capacity Detail",
        subtitle: "Monthly occupancy and satisfaction",
        chart: {
          type: "table",
          intent: "comparison",
          encoding: {
            columns: [
              { field: "month", label: "Month" },
              { field: "bedOccupancy", label: "Bed Occupancy", format: "percent" },
              {
                field: "patientSatisfaction",
                label: "Patient Satisfaction",
                format: "percent",
              },
            ],
          },
        },
        data: datasetRef("monthly_capacity", {
          columns: ["month", "bedOccupancy", "patientSatisfaction"],
        }),
      };
    case "sparkline":
      return {
        id: widgetId,
        position,
        title: "Occupancy Momentum",
        subtitle: "Compact seasonal signal",
        chart: {
          type: "sparkline",
          intent: "trend",
          encoding: {
            x: { field: "month" },
            y: { field: "bedOccupancy" },
          },
        },
        data: datasetRef("monthly_capacity", {
          columns: ["month", "bedOccupancy"],
        }),
      };
    case "gauge":
      return {
        id: widgetId,
        position,
        title: "Readmission Rate",
        subtitle: "Current clinical pressure",
        chart: {
          type: "gauge",
          intent: "target_vs_actual",
          encoding: {
            value: { field: "value" },
          },
          gaugeConfig: {
            min: 0,
            max: 20,
            suffix: "%",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "readmission-rate" }],
          limit: 1,
        }),
      };
  }
}

function createFinancialWidget(
  chartType: ChartType,
  widgetId: string,
  position: WidgetPosition,
): WidgetSpec {
  switch (chartType) {
    case "kpi":
      return {
        id: widgetId,
        position,
        title: "AUM",
        subtitle: "Current managed assets",
        chart: {
          type: "kpi",
          intent: "monitoring",
          encoding: {
            value: { field: "value" },
          },
          kpiConfig: {
            deltaField: "delta",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "aum" }],
          limit: 1,
        }),
      };
    case "line":
      return {
        id: widgetId,
        position,
        title: "Total AUM Trend",
        subtitle: "Monthly asset curve",
        chart: {
          type: "line",
          intent: "trend",
          encoding: {
            x: { field: "month" },
            y: { field: "totalAum" },
          },
          options: {
            smooth: true,
            showGrid: true,
            showTooltip: true,
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "totalAum"],
        }),
      };
    case "bar":
      return {
        id: widgetId,
        position,
        title: "Net Flows",
        subtitle: "Monthly inflow pressure",
        chart: {
          type: "bar",
          intent: "comparison",
          encoding: {
            x: { field: "month" },
            y: { field: "netFlow" },
          },
          options: {
            showGrid: true,
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "netFlow"],
        }),
      };
    case "stacked_bar":
      return {
        id: widgetId,
        position,
        title: "Segment Retention Mix",
        subtitle: "Manual stack starter",
        chart: {
          type: "stacked_bar",
          intent: "composition",
          encoding: {
            x: { field: "label" },
            y: { field: "value" },
            series: { field: "series" },
          },
          options: {
            showLegend: true,
          },
        },
        data: {
          source: "inline",
          payload: {
            points: [
              { label: "HNW", series: "Retained", value: 84 },
              { label: "HNW", series: "At Risk", value: 16 },
              { label: "Mass Affluent", series: "Retained", value: 76 },
              { label: "Mass Affluent", series: "At Risk", value: 24 },
              { label: "UHNW", series: "Retained", value: 91 },
              { label: "UHNW", series: "At Risk", value: 9 },
            ],
          },
        },
      };
    case "donut":
      return {
        id: widgetId,
        position,
        title: "Advisor Concentration",
        subtitle: "AUM share by advisor",
        chart: {
          type: "donut",
          intent: "composition",
          encoding: {
            category: { field: "advisorName" },
            value: { field: "aumShare" },
          },
        },
        data: datasetRef("advisor_concentration", {
          columns: ["advisorName", "aumShare"],
        }),
      };
    case "table":
      return {
        id: widgetId,
        position,
        title: "Monthly Summary",
        subtitle: "AUM, flow, retention, and NPS",
        chart: {
          type: "table",
          intent: "comparison",
          encoding: {
            columns: [
              { field: "month", label: "Month" },
              { field: "totalAum", label: "Total AUM" },
              { field: "netFlow", label: "Net Flow" },
              { field: "retentionRate", label: "Retention", format: "percent" },
            ],
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "totalAum", "netFlow", "retentionRate"],
        }),
      };
    case "sparkline":
      return {
        id: widgetId,
        position,
        title: "Retention Momentum",
        subtitle: "Compact monthly signal",
        chart: {
          type: "sparkline",
          intent: "trend",
          encoding: {
            x: { field: "month" },
            y: { field: "retentionRate" },
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "retentionRate"],
        }),
      };
    case "gauge":
      return {
        id: widgetId,
        position,
        title: "Client Retention",
        subtitle: "Current stress indicator",
        chart: {
          type: "gauge",
          intent: "target_vs_actual",
          encoding: {
            value: { field: "value" },
          },
          gaugeConfig: {
            min: 0,
            max: 100,
            suffix: "%",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "client-retention" }],
          limit: 1,
        }),
      };
  }
}

function createSaasWidget(
  chartType: ChartType,
  widgetId: string,
  position: WidgetPosition,
): WidgetSpec {
  switch (chartType) {
    case "kpi":
      return {
        id: widgetId,
        position,
        title: "MRR",
        subtitle: "Run-rate revenue",
        chart: {
          type: "kpi",
          intent: "monitoring",
          encoding: {
            value: { field: "value" },
          },
          kpiConfig: {
            deltaField: "delta",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "mrr" }],
          limit: 1,
        }),
      };
    case "line":
      return {
        id: widgetId,
        position,
        title: "ARR Trend",
        subtitle: "Monthly growth curve",
        chart: {
          type: "line",
          intent: "trend",
          encoding: {
            x: { field: "month" },
            y: { field: "arr" },
          },
          options: {
            smooth: true,
            showGrid: true,
            showTooltip: true,
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "arr"],
        }),
      };
    case "bar":
      return {
        id: widgetId,
        position,
        title: "Support Volume",
        subtitle: "Tickets by month",
        chart: {
          type: "bar",
          intent: "comparison",
          encoding: {
            x: { field: "month" },
            y: { field: "supportTickets" },
          },
          options: {
            showGrid: true,
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "supportTickets"],
        }),
      };
    case "stacked_bar":
      return {
        id: widgetId,
        position,
        title: "Activation Mix",
        subtitle: "Manual stack starter",
        chart: {
          type: "stacked_bar",
          intent: "composition",
          encoding: {
            x: { field: "label" },
            y: { field: "value" },
            series: { field: "series" },
          },
          options: {
            showLegend: true,
          },
        },
        data: {
          source: "inline",
          payload: {
            points: [
              { label: "Analytics", series: "Adoption", value: 72 },
              { label: "Analytics", series: "Activation", value: 58 },
              { label: "Automation", series: "Adoption", value: 61 },
              { label: "Automation", series: "Activation", value: 47 },
              { label: "Security", series: "Adoption", value: 69 },
              { label: "Security", series: "Activation", value: 55 },
            ],
          },
        },
      };
    case "donut":
      return {
        id: widgetId,
        position,
        title: "Segment Mix",
        subtitle: "Customer distribution",
        chart: {
          type: "donut",
          intent: "composition",
          encoding: {
            category: { field: "segment" },
            value: { field: "customerCount" },
          },
        },
        data: datasetRef("segment_engagement", {
          columns: ["segment", "customerCount"],
        }),
      };
    case "table":
      return {
        id: widgetId,
        position,
        title: "Feature Adoption Detail",
        subtitle: "Adoption, activation, and support pressure",
        chart: {
          type: "table",
          intent: "comparison",
          encoding: {
            columns: [
              { field: "feature", label: "Feature" },
              { field: "adoptionRate", label: "Adoption", format: "percent" },
              { field: "activationRate", label: "Activation", format: "percent" },
              {
                field: "supportTicketsPer100",
                label: "Tickets / 100",
              },
            ],
          },
        },
        data: datasetRef("feature_adoption", {
          columns: [
            "feature",
            "adoptionRate",
            "activationRate",
            "supportTicketsPer100",
          ],
        }),
      };
    case "sparkline":
      return {
        id: widgetId,
        position,
        title: "MRR Momentum",
        subtitle: "Compact trend view",
        chart: {
          type: "sparkline",
          intent: "trend",
          encoding: {
            x: { field: "month" },
            y: { field: "mrr" },
          },
        },
        data: datasetRef("monthly_summary", {
          columns: ["month", "mrr"],
        }),
      };
    case "gauge":
      return {
        id: widgetId,
        position,
        title: "Churn Rate",
        subtitle: "Current retention pressure",
        chart: {
          type: "gauge",
          intent: "target_vs_actual",
          encoding: {
            value: { field: "value" },
          },
          gaugeConfig: {
            min: 0,
            max: 10,
            suffix: "%",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "churn-rate" }],
          limit: 1,
        }),
      };
  }
}

function createSnowflakeCostWidget(
  chartType: ChartType,
  widgetId: string,
  position: WidgetPosition,
): WidgetSpec {
  switch (chartType) {
    case "kpi":
      return {
        id: widgetId,
        position,
        title: "Monthly Opportunity",
        subtitle: "Idle warehouse waste high-end credits",
        chart: {
          type: "kpi",
          intent: "monitoring",
          encoding: {
            value: { field: "value" },
          },
          kpiConfig: {
            deltaField: "delta",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "monthly-opportunity-high" }],
          limit: 1,
        }),
      };
    case "line":
      return {
        id: widgetId,
        position,
        title: "Warehouse Credits Trend",
        subtitle: "Daily metering by warehouse",
        chart: {
          type: "line",
          intent: "trend",
          encoding: {
            x: { field: "usage_day" },
            y: { field: "credits_used" },
            series: { field: "warehouse_name" },
          },
          options: {
            smooth: true,
            showGrid: true,
            showTooltip: true,
            showLegend: true,
          },
        },
        data: datasetRef("warehouse_metering_history", {
          columns: ["usage_day", "warehouse_name", "credits_used"],
        }),
      };
    case "bar":
      return {
        id: widgetId,
        position,
        title: "Credit Concentration",
        subtitle: "Credits by warehouse",
        chart: {
          type: "bar",
          intent: "comparison",
          encoding: {
            x: { field: "warehouse_name" },
            y: { field: "credits_used" },
          },
          options: {
            showGrid: true,
          },
        },
        data: datasetRef("warehouse_metering_history", {
          columns: ["warehouse_name", "credits_used"],
        }),
      };
    case "stacked_bar":
      return {
        id: widgetId,
        position,
        title: "Credit Composition",
        subtitle: "Compute vs cloud services starter",
        chart: {
          type: "stacked_bar",
          intent: "composition",
          encoding: {
            x: { field: "label" },
            y: { field: "value" },
            series: { field: "series" },
          },
          options: {
            showLegend: true,
          },
        },
        data: {
          source: "inline",
          payload: {
            points: [
              { label: "FINANCE_REPORTING_WH", series: "Compute", value: 374 },
              { label: "FINANCE_REPORTING_WH", series: "Cloud Services", value: 16 },
              { label: "MARKETING_ADHOC_WH", series: "Compute", value: 149 },
              { label: "MARKETING_ADHOC_WH", series: "Cloud Services", value: 6 },
              { label: "CORE_ELT_WH", series: "Compute", value: 71 },
              { label: "CORE_ELT_WH", series: "Cloud Services", value: 3 },
            ],
          },
        },
      };
    case "donut":
      return {
        id: widgetId,
        position,
        title: "Warehouse Share",
        subtitle: "Credit concentration snapshot",
        chart: {
          type: "donut",
          intent: "composition",
          encoding: {
            category: { field: "warehouse_name" },
            value: { field: "credits_used" },
          },
        },
        data: datasetRef("warehouse_metering_history", {
          columns: ["warehouse_name", "credits_used"],
        }),
      };
    case "table":
      return {
        id: widgetId,
        position,
        title: "Recommendation Queue",
        subtitle: "Prioritized idle warehouse actions",
        chart: {
          type: "table",
          intent: "ranking",
          encoding: {
            columns: [
              { field: "executive_severity", label: "Priority" },
              { field: "scope_name", label: "Warehouse" },
              { field: "recommended_action", label: "Action" },
              { field: "suggested_owner", label: "Owner" },
              { field: "guardrail", label: "Guardrail" },
            ],
          },
        },
        data: datasetRef("recommendation_queue", {
          columns: [
            "executive_severity",
            "scope_name",
            "recommended_action",
            "suggested_owner",
            "guardrail",
          ],
        }),
      };
    case "sparkline":
      return {
        id: widgetId,
        position,
        title: "Idle Spend Momentum",
        subtitle: "Compact warehouse credit signal",
        chart: {
          type: "sparkline",
          intent: "trend",
          encoding: {
            x: { field: "usage_day" },
            y: { field: "credits_used" },
          },
        },
        data: datasetRef("warehouse_metering_history", {
          columns: ["usage_day", "credits_used"],
          filters: [{ field: "warehouse_name", operator: "eq", value: "FINANCE_REPORTING_WH" }],
        }),
      };
    case "gauge":
      return {
        id: widgetId,
        position,
        title: "Idle Warehouse Count",
        subtitle: "Warehouses needing policy review",
        chart: {
          type: "gauge",
          intent: "anomaly",
          encoding: {
            value: { field: "value" },
          },
          gaugeConfig: {
            min: 0,
            max: 10,
            suffix: "",
          },
        },
        data: datasetRef("executive_summary", {
          filters: [{ field: "metricId", operator: "eq", value: "idle-warehouse-count" }],
          limit: 1,
        }),
      };
  }
}

export function createPaletteWidget(
  packId: string,
  chartType: ChartType,
  widgetId: string,
  position: WidgetPosition,
): WidgetSpec {
  if (packId === "healthcare") {
    return createHealthcareWidget(chartType, widgetId, position);
  }

  if (packId === "financial") {
    return createFinancialWidget(chartType, widgetId, position);
  }

  if (packId === "snowflakeCost") {
    return createSnowflakeCostWidget(chartType, widgetId, position);
  }

  return createSaasWidget(chartType, widgetId, position);
}

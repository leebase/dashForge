import type { DashboardSpec } from "../core/spec/dashboardSpec";

export const sampleDashboard: DashboardSpec = {
  id: "dashforge-saas-runtime-breadth",
  specVersion: "1.0",
  meta: {
    title: "SaaS Scaling Command Center",
    description:
      "Sprint 5 runtime proof covering the full MVP primitive set through the responsive read-only dashboard renderer.",
    author: "Lee Harrington",
    createdAt: "2026-03-31T00:00:00Z",
    updatedAt: "2026-03-31T23:30:00Z",
    tags: ["saas", "scaling-success", "sprint-5"],
  },
  intent: {
    type: "executive_summary",
    audience: "client_demo",
    industry: "saas",
    scenario: "scaling-success",
  },
  theme: {
    id: "dark-executive",
  },
  dataContext: {
    mode: "mock",
    mock: {
      packId: "saas",
      scenarioId: "scaling-success",
      seed: 8312,
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
  widgets: [
    {
      id: "mrr-kpi",
      position: { x: 0, y: 0, w: 3, h: 2 },
      title: "MRR",
      subtitle: "Run-rate revenue",
      chart: {
        type: "kpi",
        intent: "monitoring",
        encoding: {
          value: {
            field: "value",
          },
        },
        kpiConfig: {
          deltaField: "delta",
        },
      },
      data: {
        source: "dataset",
        datasetId: "executive_summary",
        filters: [
          {
            field: "metricId",
            operator: "eq",
            value: "mrr",
          },
        ],
        limit: 1,
      },
    },
    {
      id: "net-retention-gauge",
      position: { x: 3, y: 0, w: 3, h: 3 },
      title: "Net Retention",
      subtitle: "Expansion efficiency",
      chart: {
        type: "gauge",
        intent: "target_vs_actual",
        encoding: {
          value: {
            field: "value",
          },
        },
        gaugeConfig: {
          min: 80,
          max: 130,
          suffix: "%",
        },
        options: {
          thresholds: [
            { value: 100, label: "Plan", color: "#4fd7a6" },
            { value: 115, label: "Stretch", color: "#ffc661" },
            { value: 130, label: "Ceiling", color: "#ff7e6b" },
          ],
        },
      },
      data: {
        source: "dataset",
        datasetId: "executive_summary",
        filters: [
          {
            field: "metricId",
            operator: "eq",
            value: "net-retention",
          },
        ],
        limit: 1,
      },
    },
    {
      id: "arr-trend",
      position: { x: 6, y: 0, w: 6, h: 3 },
      title: "ARR Trend",
      subtitle: "Twelve-month scale curve",
      caption: "ARR clears the strategic milestone, but support pressure keeps widening behind it.",
      chart: {
        type: "line",
        intent: "trend",
        encoding: {
          x: {
            field: "month",
          },
          y: {
            field: "arr",
          },
        },
        options: {
          smooth: true,
          showTooltip: true,
          showGrid: true,
        },
      },
      data: {
        source: "dataset",
        datasetId: "monthly_summary",
        columns: ["month", "arr"],
      },
    },
    {
      id: "mrr-sparkline",
      position: { x: 0, y: 2, w: 3, h: 2 },
      title: "MRR Momentum",
      subtitle: "Compact monthly view",
      chart: {
        type: "sparkline",
        intent: "trend",
        encoding: {
          x: {
            field: "month",
          },
          y: {
            field: "mrr",
          },
        },
      },
      data: {
        source: "dataset",
        datasetId: "monthly_summary",
        columns: ["month", "mrr"],
      },
    },
    {
      id: "segment-mix",
      position: { x: 3, y: 3, w: 3, h: 3 },
      title: "Customer Mix",
      subtitle: "Current account distribution",
      chart: {
        type: "donut",
        intent: "composition",
        encoding: {
          category: {
            field: "segment",
          },
          value: {
            field: "customerCount",
          },
        },
      },
      data: {
        source: "dataset",
        datasetId: "segment_engagement",
        columns: ["segment", "customerCount"],
      },
    },
    {
      id: "support-volume",
      position: { x: 0, y: 4, w: 6, h: 3 },
      title: "Support Volume",
      subtitle: "Tickets per month",
      chart: {
        type: "bar",
        intent: "comparison",
        encoding: {
          x: {
            field: "month",
          },
          y: {
            field: "supportTickets",
          },
        },
        options: {
          showGrid: true,
          thresholds: [{ value: 16000, label: "Staffing trigger" }],
        },
      },
      annotations: [
        {
          type: "reference_line",
          label: "Escalation line",
          value: 17500,
          style: "dashed",
        },
      ],
      data: {
        source: "dataset",
        datasetId: "monthly_summary",
        columns: ["month", "supportTickets"],
      },
    },
    {
      id: "feature-activation",
      position: { x: 6, y: 3, w: 6, h: 4 },
      title: "Feature Activation Mix",
      subtitle: "Adoption vs activation",
      caption: "Adoption is broad, but activation depth still trails for automation-heavy workflows.",
      chart: {
        type: "stacked_bar",
        intent: "composition",
        encoding: {
          x: {
            field: "label",
          },
          y: {
            field: "value",
          },
          series: {
            field: "series",
          },
        },
        options: {
          showLegend: true,
        },
      },
      data: {
        source: "inline",
        payload: {
          points: [
            { label: "Analytics", series: "Adoption", value: 78 },
            { label: "Analytics", series: "Activation", value: 64 },
            { label: "Collaboration", series: "Adoption", value: 83 },
            { label: "Collaboration", series: "Activation", value: 70 },
            { label: "Automation", series: "Adoption", value: 71 },
            { label: "Automation", series: "Activation", value: 58 },
            { label: "Security", series: "Adoption", value: 76 },
            { label: "Security", series: "Activation", value: 63 },
          ],
          caption:
            "Inline Sprint 5 proof payload derived from the scaling-success feature activation baseline.",
        },
      },
    },
    {
      id: "feature-table",
      position: { x: 0, y: 7, w: 12, h: 3 },
      title: "Feature Detail Table",
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
              label: "Tickets / 100 Accounts",
              format: "decimal-1",
            },
          ],
        },
      },
      data: {
        source: "dataset",
        datasetId: "feature_adoption",
        columns: [
          "feature",
          "adoptionRate",
          "activationRate",
          "supportTicketsPer100",
        ],
      },
    },
  ],
  narrative: {
    storyArc: {
      hook: {
        headline: "Growth is real and durable",
        commentary:
          "MRR and ARR both show a healthy scale trajectory rather than a one-month spike.",
        widgetIds: ["mrr-kpi", "arr-trend"],
      },
      context: {
        headline: "Retention is compounding the upside",
        commentary:
          "Net retention is sitting above plan, which keeps the revenue curve strong even before new bookings are layered in.",
        widgetIds: ["net-retention-gauge"],
      },
      tension: {
        headline: "Support capacity is the visible constraint",
        commentary:
          "Monthly support demand is climbing toward the staffing trigger as product breadth expands across more accounts.",
        widgetIds: ["support-volume", "feature-table"],
      },
      resolution: {
        headline: "Activation depth gives the next operating lever",
        commentary:
          "The stacked activation mix shows where stronger onboarding could keep growth efficient while support scales.",
        widgetIds: ["feature-activation", "segment-mix"],
      },
      callToAction: {
        headline: "This dashboard is ready for workshop tailoring",
        commentary:
          "The Sprint 5 runtime now supports the full MVP primitive set through the same DashboardSpec and adapter seams.",
        widgetIds: [
          "mrr-kpi",
          "net-retention-gauge",
          "arr-trend",
          "feature-table",
        ],
      },
    },
    executiveSummary:
      "Revenue and retention are strong, but the support curve signals the next operating constraint.",
  },
  filters: [
    {
      id: "view-window",
      label: "Time Window",
      field: "window",
      operator: "eq",
      value: "rolling-12-month",
      applyToWidgetIds: ["arr-trend", "support-volume", "mrr-sparkline"],
    },
  ],
};

import type { DashboardSpec } from "../core/spec/dashboardSpec";

export const sampleDashboard: DashboardSpec = {
  id: "dashforge-healthcare-foundation",
  specVersion: "1.0",
  meta: {
    title: "Healthcare Executive Snapshot",
    description: "First static spec-backed slice for Sprint 1 foundation.",
    author: "Lee Harrington",
    createdAt: "2026-03-31T00:00:00Z",
    updatedAt: "2026-03-31T00:00:00Z",
  },
  intent: {
    type: "executive_summary",
    audience: "client_demo",
    industry: "healthcare",
    scenario: "quality-improvement",
  },
  theme: {
    id: "light-professional",
  },
  dataContext: {
    mode: "mock",
    timeRange: {
      start: "2025-01-01",
      end: "2025-12-31",
      granularity: "month",
    },
  },
  layout: {
    columns: 12,
    rowHeight: 96,
  },
  widgets: [
    {
      id: "readmission-rate",
      position: { x: 0, y: 0, w: 4, h: 2 },
      title: "Readmission Rate",
      subtitle: "30-day rolling view",
      chart: { type: "kpi" },
      data: {
        source: "inline",
        payload: {
          value: 9.8,
          delta: -0.7,
          deltaLabel: "vs prior quarter",
          suffix: "%",
          caption: "Quality-improvement scenario trend",
        },
      },
    },
    {
      id: "occupancy-trend",
      position: { x: 4, y: 0, w: 8, h: 3 },
      title: "Bed Occupancy Trend",
      subtitle: "Monthly capacity pressure",
      chart: { type: "line", smooth: true },
      data: {
        source: "inline",
        payload: {
          points: [
            { label: "Jan", value: 88 },
            { label: "Feb", value: 90 },
            { label: "Mar", value: 92 },
            { label: "Apr", value: 91 },
            { label: "May", value: 89 },
            { label: "Jun", value: 93 },
          ],
          seriesLabel: "Occupancy",
          caption: "Foundation sample with static inline mock data",
        },
      },
    },
  ],
};

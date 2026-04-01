import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import {
  loadDashboardSpecDocument,
  serializeDashboardSpec,
} from "../../core/io/dashboardPersistence";

export function exportDashboardSpecJson(spec: DashboardSpec): string {
  return serializeDashboardSpec(spec);
}

export function importDashboardSpecJson(documentText: string) {
  return loadDashboardSpecDocument(documentText);
}

import { CURRENT_DASHBOARD_SPEC_VERSION, type DashboardSpec } from "../spec/dashboardSpec";
import {
  validateDashboardSpec,
  type DashboardSpecValidationResult,
} from "../spec/dashboardSchema";

export const DASHBOARD_STORAGE_KEY = `dashforge.dashboard-spec.${CURRENT_DASHBOARD_SPEC_VERSION}`;

export interface DashboardStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function sanitizeDashboardSpecForExport(spec: DashboardSpec): DashboardSpec {
  const sanitized = JSON.parse(JSON.stringify(spec)) as DashboardSpec;

  for (const binding of Object.values(sanitized.dataContext.live?.bindings ?? {})) {
    if (binding.connection.headers) {
      delete binding.connection.headers;
    }
  }

  return sanitized;
}

export function serializeDashboardSpec(spec: DashboardSpec): string {
  return JSON.stringify(sanitizeDashboardSpecForExport(spec), null, 2);
}

export function parseDashboardSpecDocument(
  documentText: string,
): DashboardSpecValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(documentText);
  } catch (error) {
    return {
      ok: false as const,
      errors: [
        error instanceof Error ? error.message : "Dashboard spec is not valid JSON.",
      ],
    };
  }

  return validateDashboardSpec(parsed);
}

export function loadDashboardSpecDocument(
  documentText: string,
): DashboardSpecValidationResult {
  return parseDashboardSpecDocument(documentText);
}

export function saveDashboardSpecToStorage(
  storage: DashboardStorage,
  spec: DashboardSpec,
  storageKey = DASHBOARD_STORAGE_KEY,
): DashboardSpecValidationResult {
  const validated = validateDashboardSpec(spec);

  if (!validated.ok) {
    return validated;
  }

  storage.setItem(storageKey, serializeDashboardSpec(validated.spec));
  return validated;
}

export function loadDashboardSpecFromStorage(
  storage: DashboardStorage,
  storageKey = DASHBOARD_STORAGE_KEY,
): DashboardSpecValidationResult {
  const stored = storage.getItem(storageKey);

  if (!stored) {
    return {
      ok: false as const,
      errors: ["No dashboard spec is stored locally."],
    };
  }

  return parseDashboardSpecDocument(stored);
}

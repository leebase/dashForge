import { serializeDashboardSpec } from "../../core/io/dashboardPersistence";
import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import { validateDashboardSpec } from "../../core/spec/dashboardSchema";

export interface BrowserDownloadTarget {
  click(): void;
  download: string;
  href: string;
}

export interface BrowserDocumentLike {
  createElement(tagName: string): BrowserDownloadTarget;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSpecExport(spec: DashboardSpec) {
  const validated = validateDashboardSpec(spec);

  if (!validated.ok) {
    return validated;
  }

  return {
    ok: true as const,
    content: serializeDashboardSpec(validated.spec),
    filename: `${slugify(validated.spec.meta.title) || "dashforge-dashboard"}.spec.json`,
    mimeType: "application/json",
  };
}

export function downloadDashboardSpec(
  spec: DashboardSpec,
  browserDocument: BrowserDocumentLike = document,
  createObjectUrl: (object: Blob) => string = URL.createObjectURL,
) {
  const exported = buildSpecExport(spec);

  if (!exported.ok) {
    return exported;
  }

  const anchor = browserDocument.createElement("a");
  const blob = new Blob([exported.content], { type: exported.mimeType });
  const downloadUrl = createObjectUrl(blob);

  anchor.href = downloadUrl;
  anchor.download = exported.filename;
  anchor.click();

  return {
    ok: true as const,
    filename: exported.filename,
  };
}

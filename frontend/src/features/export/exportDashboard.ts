import type { DashboardSpec } from "../../core/spec/dashboardSpec";

export interface PopupWindowLike {
  opener?: unknown;
  close?: () => void;
  document: {
    close(): void;
    open(): void;
    write(markup: string): void;
  };
  focus?: () => void;
  print?: () => void;
}

export interface WindowHostLike {
  open(url?: string, target?: string, features?: string): PopupWindowLike | null;
}

interface DashboardExportInput {
  spec: DashboardSpec;
  dashboardHtml: string;
  includePresenterNotes?: boolean;
  stylesHtml: string;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function collectDocumentStyles(sourceDocument: Document = document) {
  return [...sourceDocument.querySelectorAll('style, link[rel="stylesheet"]')]
    .map((node) => node.outerHTML)
    .join("\n");
}

export function buildDashboardExportDocument({
  spec,
  dashboardHtml,
  includePresenterNotes = false,
  stylesHtml,
}: DashboardExportInput) {
  const storySections = spec.narrative
    ? [
        spec.narrative.storyArc.hook,
        spec.narrative.storyArc.context,
        spec.narrative.storyArc.tension,
        spec.narrative.storyArc.resolution,
        spec.narrative.storyArc.callToAction,
      ]
    : [];

  const presenterNotes =
    includePresenterNotes && spec.narrative?.presenterNotes?.length
      ? `<section class="proposal-export__notes"><h2>Presenter Notes</h2><ul>${spec.narrative.presenterNotes
          .map((note) => `<li>${escapeHtml(note)}</li>`)
          .join("")}</ul></section>`
      : "";

  const artifactEvidence = spec.dataContext.artifact
    ? `<section class="proposal-export__evidence">
        <h2>Evidence and provenance</h2>
        <p><strong>Synthetic demo artifact</strong> — this rendition is
        generated from a verified, read-only work package.</p>
        <dl>
          <div><dt>Upstream digest</dt><dd><code>${escapeHtml(
            spec.dataContext.artifact.digest,
          )}</code></dd></div>
          <div><dt>Quality report</dt><dd>${escapeHtml(
            spec.dataContext.artifact.qualityReport.path,
          )} · <code>${escapeHtml(
            spec.dataContext.artifact.qualityReport.sha256,
          )}</code></dd></div>
          <div><dt>Snapshot</dt><dd>${escapeHtml(
            spec.dataContext.artifact.snapshot.path,
          )} · <code>${escapeHtml(
            spec.dataContext.artifact.snapshot.sha256,
          )}</code></dd></div>
        </dl>
      </section>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(spec.meta.title)} Proposal Export</title>
    ${stylesHtml}
    <style>
      @page {
        size: 11in 8.5in;
        margin: 0.35in;
      }
      html {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        margin: 0;
        background: #f7f1e8;
      }
      .proposal-export {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        color: #24190f;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
      }
      .proposal-export__header {
        margin-bottom: 24px;
      }
      .proposal-export__eyebrow {
        margin: 0 0 8px;
        color: #a34b2a;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-size: 12px;
        font-weight: 700;
      }
      .proposal-export__headline {
        margin: 0;
        font-size: 38px;
        line-height: 1;
      }
      .proposal-export__description,
      .proposal-export__summary {
        max-width: 76ch;
        color: #6b5744;
      }
      .proposal-export__dashboard {
        margin-top: 20px;
      }
      .proposal-export__evidence,
      .proposal-export__story,
      .proposal-export__notes {
        margin-top: 28px;
        padding: 20px 24px;
        border: 1px solid rgba(74, 54, 32, 0.12);
        border-radius: 20px;
        background: rgba(255, 252, 246, 0.88);
      }
      .proposal-export__evidence h2,
      .proposal-export__story h2,
      .proposal-export__notes h2 {
        margin-top: 0;
      }
      .proposal-export__evidence dl {
        display: grid;
        gap: 8px;
        margin: 0;
      }
      .proposal-export__evidence dl > div {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr);
        gap: 12px;
      }
      .proposal-export__evidence dt {
        color: #6b5744;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .proposal-export__evidence dd {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .proposal-export__story-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .proposal-export__story-card {
        padding: 16px;
        border: 1px solid rgba(74, 54, 32, 0.1);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.72);
      }
      .dashboard-grid__item,
      .dashboard-box {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      @media print {
        body {
          background: white;
        }
        .proposal-export {
          max-width: none;
          padding: 0;
        }
        .proposal-export__header,
        .proposal-export__evidence,
        .proposal-export__story,
        .proposal-export__notes {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <main class="proposal-export">
      <header class="proposal-export__header">
        <p class="proposal-export__eyebrow">DashForge Proposal Artifact</p>
        <h1 class="proposal-export__headline">${escapeHtml(spec.meta.title)}</h1>
        ${
          spec.meta.description
            ? `<p class="proposal-export__description">${escapeHtml(spec.meta.description)}</p>`
            : ""
        }
        ${
          spec.narrative?.executiveSummary
            ? `<p class="proposal-export__summary">${escapeHtml(spec.narrative.executiveSummary)}</p>`
            : ""
        }
      </header>
      ${artifactEvidence}
      <section class="proposal-export__dashboard">${dashboardHtml}</section>
      ${
        storySections.length > 0
          ? `<section class="proposal-export__story"><h2>Story Arc</h2><div class="proposal-export__story-grid">${storySections
              .map(
                (section) => `<article class="proposal-export__story-card">
                    <h3>${escapeHtml(section.headline)}</h3>
                    <p>${escapeHtml(section.commentary)}</p>
                    ${
                      section.transitionText
                        ? `<p><strong>Transition:</strong> ${escapeHtml(section.transitionText)}</p>`
                        : ""
                    }
                  </article>`,
              )
              .join("")}</div></section>`
          : ""
      }
      ${presenterNotes}
    </main>
  </body>
</html>`;
}

export function exportDashboardArtifact(
  input: DashboardExportInput,
  hostWindow: WindowHostLike = window,
) {
  const popup = hostWindow.open("", "_blank");

  if (!popup) {
    return {
      ok: false as const,
      errors: ["Dashboard export could not open a browser print window."],
    };
  }
  popup.opener = null;

  popup.document.open();
  popup.document.write(buildDashboardExportDocument(input));
  popup.document.close();
  popup.focus?.();
  popup.print?.();

  return {
    ok: true as const,
  };
}

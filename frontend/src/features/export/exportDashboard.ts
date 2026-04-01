import type { DashboardSpec } from "../../core/spec/dashboardSpec";

export interface PopupWindowLike {
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

function escapeHtml(value: string) {
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

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(spec.meta.title)} Proposal Export</title>
    ${stylesHtml}
    <style>
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
      .proposal-export__story,
      .proposal-export__notes {
        margin-top: 28px;
        padding: 20px 24px;
        border: 1px solid rgba(74, 54, 32, 0.12);
        border-radius: 20px;
        background: rgba(255, 252, 246, 0.88);
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
      @media print {
        body {
          background: white;
        }
        .proposal-export {
          padding: 0;
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
  const popup = hostWindow.open("", "_blank", "noopener,noreferrer");

  if (!popup) {
    return {
      ok: false as const,
      errors: ["Dashboard export could not open a browser print window."],
    };
  }

  popup.document.open();
  popup.document.write(buildDashboardExportDocument(input));
  popup.document.close();
  popup.focus?.();
  popup.print?.();

  return {
    ok: true as const,
  };
}

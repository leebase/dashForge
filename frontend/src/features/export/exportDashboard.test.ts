import { describe, expect, it, vi } from "vitest";

import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import {
  buildDashboardExportDocument,
  collectDocumentStyles,
  exportDashboardArtifact,
} from "./exportDashboard";

describe("exportDashboard", () => {
  it("builds a printable proposal artifact document", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    const styleNode = document.createElement("style");
    styleNode.textContent = ".dashboard { color: red; }";
    document.head.append(styleNode);

    const html = buildDashboardExportDocument({
      spec: draft,
      dashboardHtml: "<section>preview</section>",
      includePresenterNotes: true,
      stylesHtml: collectDocumentStyles(document),
    });

    expect(html).toContain(draft.meta.title);
    expect(html).toContain("preview");
    expect(html).toContain("Presenter Notes");

    document.head.removeChild(styleNode);
  });

  it("keeps presenter notes out of the default proposal artifact", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");

    const html = buildDashboardExportDocument({
      spec: draft,
      dashboardHtml: "<section>preview</section>",
      stylesHtml: "<style></style>",
    });

    expect(html).not.toContain("Presenter Notes");
    expect(html).not.toContain(draft.narrative?.presenterNotes?.[0] ?? "");
  });

  it("opens a browser print window for proposal exports", () => {
    const draft = createFreshDraftForScenario("financial", "market-downturn");
    const write = vi.fn();
    const print = vi.fn();
    const open = vi.fn(() => ({
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write,
      },
      focus: vi.fn(),
      print,
    }));

    const result = exportDashboardArtifact(
      {
        spec: draft,
        dashboardHtml: "<section>proposal</section>",
        stylesHtml: "<style></style>",
      },
      { open },
    );

    expect(result).toMatchObject({ ok: true });
    expect(open).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });
});

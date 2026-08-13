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
    expect(html).toContain("@page");
    expect(html).toContain("print-color-adjust: exact");
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
    const popup = {
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write,
      },
      focus: vi.fn(),
      opener: window,
      print,
    };
    const open = vi.fn(() => popup);

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
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(popup.opener).toBeNull();
    expect(write).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });

  it("escapes imported narrative text in generated export markup", () => {
    const draft = createFreshDraftForScenario("saas", "scaling-success");
    draft.meta.title = '<img src=x onerror="alert(1)">';
    if (!draft.narrative) {
      throw new Error("Fixture narrative is missing.");
    }
    draft.narrative.executiveSummary = "<script>unsafe()</script>";
    draft.narrative.presenterNotes = ["<b>untrusted note</b>"];

    const html = buildDashboardExportDocument({
      spec: draft,
      dashboardHtml: "<section>React-rendered dashboard</section>",
      includePresenterNotes: true,
      stylesHtml: "",
    });

    expect(html).not.toContain("<script>unsafe()</script>");
    expect(html).not.toContain("<b>untrusted note</b>");
    expect(html).toContain("&lt;script&gt;unsafe()&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;untrusted note&lt;/b&gt;");
    expect(html).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});

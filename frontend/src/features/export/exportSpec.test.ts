import { describe, expect, it, vi } from "vitest";

import { createFreshDraftForScenario } from "../builder/templateInstantiation";
import { buildSpecExport, downloadDashboardSpec } from "./exportSpec";

describe("exportSpec", () => {
  it("builds a validated JSON export and triggers a browser download", () => {
    const draft = createFreshDraftForScenario("healthcare", "flu-season");
    const exported = buildSpecExport(draft);
    const click = vi.fn();
    const anchor = {
      click,
      download: "",
      href: "",
    };

    expect(exported).toMatchObject({ ok: true });

    const result = downloadDashboardSpec(
      draft,
      {
        createElement: () => anchor,
      },
      () => "blob:dashforge-export",
    );

    expect(result).toMatchObject({ ok: true });
    expect(anchor.download).toContain(".spec.json");
    expect(anchor.href).toBe("blob:dashforge-export");
    expect(click).toHaveBeenCalled();
  });
});

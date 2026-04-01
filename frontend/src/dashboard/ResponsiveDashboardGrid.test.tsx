import { describe, expect, it } from "vitest";

import { compileResponsiveGridLayout } from "./ResponsiveDashboardGrid";
import { sampleDashboard } from "../sample/sampleDashboard";

describe("compileResponsiveGridLayout", () => {
  it("packs widgets into lg, md, and sm column counts without overflow", () => {
    const lg = compileResponsiveGridLayout(sampleDashboard.layout, sampleDashboard.widgets, 1400);
    const md = compileResponsiveGridLayout(sampleDashboard.layout, sampleDashboard.widgets, 1000);
    const sm = compileResponsiveGridLayout(sampleDashboard.layout, sampleDashboard.widgets, 700);

    expect(lg.columns).toBe(12);
    expect(md.columns).toBe(8);
    expect(sm.columns).toBe(4);

    for (const compiled of [lg, md, sm]) {
      expect(compiled.items).toHaveLength(sampleDashboard.widgets.length);
      for (const item of compiled.items) {
        expect(item.x).toBeGreaterThanOrEqual(0);
        expect(item.w).toBeGreaterThan(0);
        expect(item.x + item.w).toBeLessThanOrEqual(compiled.columns);
      }
    }
  });
});

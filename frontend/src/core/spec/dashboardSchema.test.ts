import { describe, expect, it } from "vitest";

import { sampleDashboard } from "../../sample/sampleDashboard";
import { validateDashboardSpec } from "./dashboardSchema";

describe("validateDashboardSpec", () => {
  it("accepts the broadened sample spec", () => {
    expect(validateDashboardSpec(sampleDashboard)).toMatchObject({
      ok: true,
    });
  });

  it("rejects unsupported spec versions", () => {
    const result = validateDashboardSpec({
      ...sampleDashboard,
      specVersion: "9.9",
    });

    expect(result).toMatchObject({
      ok: false,
    });
    if (result.ok) {
      throw new Error("Validation unexpectedly passed.");
    }
    expect(result.errors[0]).toMatch(/Unsupported specVersion/i);
  });

  it("rejects unknown themes, duplicate ids, impossible layout, and bad data context", () => {
    const result = validateDashboardSpec({
      ...sampleDashboard,
      theme: {
        id: "unknown-theme",
      },
      dataContext: {
        ...sampleDashboard.dataContext,
        mode: "live",
        mock: sampleDashboard.dataContext.mock,
      },
      widgets: [
        sampleDashboard.widgets[0],
        {
          ...sampleDashboard.widgets[0],
          position: {
            ...sampleDashboard.widgets[0].position,
            x: 11,
            w: 4,
          },
        },
      ],
    });

    expect(result).toMatchObject({
      ok: false,
    });
    if (result.ok) {
      throw new Error("Validation unexpectedly passed.");
    }
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Unknown theme\.id/i),
        expect.stringMatching(/dataContext\.live is required/i),
        expect.stringMatching(/dataContext\.mock must be omitted/i),
        expect.stringMatching(/Duplicate widget id/i),
        expect.stringMatching(/impossible layout coordinates/i),
      ]),
    );
  });
});

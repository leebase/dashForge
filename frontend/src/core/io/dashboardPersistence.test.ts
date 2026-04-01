import { describe, expect, it } from "vitest";

import { sampleDashboard } from "../../sample/sampleDashboard";
import {
  loadDashboardSpecDocument,
  loadDashboardSpecFromStorage,
  saveDashboardSpecToStorage,
  sanitizeDashboardSpecForExport,
  serializeDashboardSpec,
} from "./dashboardPersistence";

describe("dashboardPersistence", () => {
  it("round-trips a readable spec document through storage", () => {
    const storage = new Map<string, string>();
    const storageApi = {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
    };

    const saved = saveDashboardSpecToStorage(storageApi, sampleDashboard);
    expect(saved).toMatchObject({ ok: true });

    const loaded = loadDashboardSpecFromStorage(storageApi);
    expect(loaded).toMatchObject({ ok: true });
    if (!loaded.ok) {
      throw new Error("Storage load unexpectedly failed.");
    }
    expect(loaded.spec.meta.title).toBe(sampleDashboard.meta.title);
  });

  it("rejects invalid JSON and invalid specs on load", () => {
    expect(loadDashboardSpecDocument("{invalid")).toMatchObject({
      ok: false,
    });

    const invalidDocument = serializeDashboardSpec({
      ...sampleDashboard,
      theme: {
        id: "invalid-theme",
      },
    });
    const loaded = loadDashboardSpecDocument(invalidDocument);
    expect(loaded).toMatchObject({
      ok: false,
    });
  });

  it("drops live headers from serialized product artifacts", () => {
    const liveSpec = sanitizeDashboardSpecForExport({
      ...sampleDashboard,
      dataContext: {
        ...sampleDashboard.dataContext,
        mode: "hybrid",
        live: {
          bindings: {
            monthly_summary: {
              type: "rest",
              connection: {
                url: "https://example.test/monthly-summary",
                headers: {
                  Authorization: "Bearer top-secret",
                },
              },
              fieldMap: {},
            },
          },
        },
      },
    });

    expect(
      liveSpec.dataContext.live?.bindings.monthly_summary.connection.headers,
    ).toBeUndefined();
    expect(serializeDashboardSpec(liveSpec)).not.toContain("top-secret");
    expect(serializeDashboardSpec(liveSpec)).not.toContain("Authorization");
  });
});

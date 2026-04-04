import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import { syncPresenterDraft } from "../presenter/narrativeStore";
import { createFreshDraftForScenario } from "../builder/templateInstantiation";

export const DEFAULT_STANDALONE_PACK_ID = "healthcare";
export const DEFAULT_STANDALONE_SCENARIO_ID = "ed-throughput-crunch";
export const DEFAULT_STANDALONE_TEMPLATE_ID = "tpl.healthcare.ed-throughput-command";

export function createDefaultStandaloneDashboardSpec(): DashboardSpec {
  return syncPresenterDraft(
    createFreshDraftForScenario(
      DEFAULT_STANDALONE_PACK_ID,
      DEFAULT_STANDALONE_SCENARIO_ID,
    ),
  );
}

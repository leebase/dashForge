import { useState } from "react";

import type { DashboardSpec } from "./core/spec/dashboardSpec";
import { BuilderShell } from "./features/builder/BuilderShell";
import { StandaloneDashboardApp } from "./features/runtime/StandaloneDashboardApp";
import { createDefaultStandaloneDashboardSpec } from "./features/runtime/standaloneDashboard";

export default function App() {
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [standaloneDraft] = useState<DashboardSpec>(() => createDefaultStandaloneDashboardSpec());

  if (isBuilderMode) {
    return <BuilderShell initialDraft={standaloneDraft} />;
  }

  return (
    <StandaloneDashboardApp
      initialSpec={standaloneDraft}
      onOpenBuilder={() => setIsBuilderMode(true)}
    />
  );
}

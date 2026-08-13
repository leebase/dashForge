interface BuilderToolbarProps {
  canExportDashboard: boolean;
  currentPackId: string;
  currentScenarioId: string;
  currentThemeId: string;
  dataMode: "mock" | "live" | "hybrid" | "artifact";
  isSpecIoOpen: boolean;
  isTemplateGalleryOpen: boolean;
  packIds: string[];
  scenarioIds: string[];
  themeOptions: Array<{ id: string; label: string }>;
  viewMode: "build" | "preview" | "presenter";
  onCreateDraft: () => void;
  onResetDraft: () => void;
  onChangePack: (packId: string) => void;
  onChangeScenario: (scenarioId: string) => void;
  onChangeTheme: (themeId: string) => void;
  onExportDashboard: () => void;
  onExportSpec: () => void;
  isClientView: boolean;
  onToggleClientView: () => void;
  onToggleSpecIo: () => void;
  onToggleTemplates: () => void;
  onChangeViewMode: (mode: "build" | "preview" | "presenter") => void;
}

export function BuilderToolbar({
  canExportDashboard,
  currentPackId,
  currentScenarioId,
  currentThemeId,
  dataMode,
  isSpecIoOpen,
  isTemplateGalleryOpen,
  packIds,
  scenarioIds,
  themeOptions,
  viewMode,
  onCreateDraft,
  onResetDraft,
  onChangePack,
  onChangeScenario,
  onChangeTheme,
  onExportDashboard,
  onExportSpec,
  isClientView,
  onToggleClientView,
  onToggleSpecIo,
  onToggleTemplates,
  onChangeViewMode,
}: BuilderToolbarProps) {
  return (
    <section className="builder-toolbar" aria-label="Builder toolbar">
      <div className="builder-toolbar__group">
        <button className="button" onClick={onCreateDraft} type="button">
          New Draft
        </button>
        <button className="button button--ghost" onClick={onResetDraft} type="button">
          Reset
        </button>
        <button
          className={isTemplateGalleryOpen ? "button button--secondary" : "button button--ghost"}
          onClick={onToggleTemplates}
          type="button"
        >
          Templates
        </button>
        <button
          className={isSpecIoOpen ? "button button--secondary" : "button button--ghost"}
          onClick={onToggleSpecIo}
          type="button"
        >
          JSON I/O
        </button>
        <button className="button button--ghost" onClick={onExportSpec} type="button">
          Export Spec
        </button>
        <button
          className="button button--ghost"
          disabled={!canExportDashboard}
          onClick={onExportDashboard}
          type="button"
        >
          Proposal Artifact
        </button>
      </div>

      <div className="builder-toolbar__group builder-toolbar__group--fields">
        <label className="builder-toolbar__field">
          <span>Pack</span>
          <select
            disabled={dataMode === "live" || dataMode === "artifact"}
            onChange={(event) => onChangePack(event.target.value)}
            value={currentPackId}
          >
            {packIds.map((packId) => (
              <option key={packId} value={packId}>
                {packId}
              </option>
            ))}
          </select>
        </label>

        <label className="builder-toolbar__field">
          <span>Scenario</span>
          <select
            disabled={dataMode === "live" || dataMode === "artifact"}
            onChange={(event) => onChangeScenario(event.target.value)}
            value={currentScenarioId}
          >
            {scenarioIds.map((scenarioId) => (
              <option key={scenarioId} value={scenarioId}>
                {scenarioId}
              </option>
            ))}
          </select>
        </label>

        <label className="builder-toolbar__field">
          <span>Theme</span>
          <select onChange={(event) => onChangeTheme(event.target.value)} value={currentThemeId}>
            {themeOptions.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="builder-toolbar__group">
        <button
          className={viewMode === "build" ? "button button--secondary" : "button button--ghost"}
          onClick={() => onChangeViewMode("build")}
          type="button"
        >
          Build
        </button>
        <button
          className={viewMode === "preview" ? "button button--secondary" : "button button--ghost"}
          onClick={() => onChangeViewMode("preview")}
          type="button"
        >
          Preview
        </button>
        <button
          className={
            viewMode === "presenter" ? "button button--secondary" : "button button--ghost"
          }
          onClick={() => onChangeViewMode("presenter")}
          type="button"
        >
          Present
        </button>
        <button
          className={isClientView ? "button button--secondary" : "button button--ghost"}
          onClick={onToggleClientView}
          type="button"
        >
          {isClientView ? "Builder View" : "Client View"}
        </button>
      </div>
    </section>
  );
}

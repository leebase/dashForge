import {
  startTransition,
  useDeferredValue,
  useRef,
  useState,
} from "react";
import GridLayout, {
  WidthProvider,
  type Layout,
} from "react-grid-layout/legacy";

import { DashboardRenderer } from "../../components/DashboardRenderer";
import { WidgetRenderer } from "../../components/WidgetRenderer";
import { createDashboardDataAdapter } from "../../core/data/createDashboardDataAdapter";
import { validateDashboardSpec } from "../../core/spec/dashboardSchema";
import type { DashboardSpec } from "../../core/spec/dashboardSpec";
import { listDashboardThemes, resolveDashboardTheme } from "../../core/theme/themeRegistry";
import {
  getDefaultTemplateForScenario,
  getTemplateById,
  getTemplatePackIds,
  listTemplateCatalog,
} from "../../mock-data/templateCatalog";
import { listScenariosByPack } from "../../mock-data/scenarioCatalog";
import {
  addWidgetToDraft,
  removeWidgetFromDraft,
  updateDashboardDraft,
  updateDraftLayout,
} from "./builderState";
import { collectDocumentStyles, exportDashboardArtifact } from "../export/exportDashboard";
import { downloadDashboardSpec } from "../export/exportSpec";
import { PresenterMode } from "../presenter/PresenterMode";
import { StoryArcEditor } from "../presenter/StoryArcEditor";
import { syncPresenterDraft } from "../presenter/narrativeStore";
import { BuilderToolbar } from "./BuilderToolbar";
import { PropertyPanel } from "./PropertyPanel";
import { TemplateGallery } from "./TemplateGallery";
import { createFreshDraftForScenario, instantiateTemplateSpec } from "./templateInstantiation";
import { exportDashboardSpecJson, importDashboardSpecJson } from "./specIo";
import { WidgetPalette } from "./WidgetPalette";
import { AiPromptBar } from "../ai/AiPromptBar";
import { createDefaultAiGenerationClient } from "../ai/aiGenerationClient";
import { generateDashboardSpec } from "../ai/generateDashboardSpec";
import type {
  AiGenerationClient,
  GenerateDashboardSpecResult,
} from "../ai/aiTypes";

const EditableGridLayout = WidthProvider(GridLayout);

function toReactGridLayout(spec: DashboardSpec): Layout {
  return spec.widgets.map((widget) => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: widget.position.minW,
    minH: widget.position.minH,
    maxW: widget.position.maxW,
    maxH: widget.position.maxH,
  }));
}

function resolveCompactType(compaction: DashboardSpec["layout"]["compaction"]) {
  if (compaction === "none") {
    return null;
  }

  return compaction;
}

function scenarioOptions(packId: string) {
  return listScenariosByPack(packId).map((scenario) => scenario.scenarioId);
}

function buildInitialDraft() {
  return syncPresenterDraft(createFreshDraftForScenario("saas", "scaling-success"));
}

function getDraftContextSelection(spec: DashboardSpec) {
  return {
    packId: spec.dataContext.mock?.packId ?? spec.intent.industry,
    scenarioId: spec.dataContext.mock?.scenarioId ?? spec.intent.scenario ?? "",
  };
}

function resolveInitialTemplateId(spec: DashboardSpec) {
  const { packId, scenarioId } = getDraftContextSelection(spec);
  return getDefaultTemplateForScenario(packId, scenarioId)?.templateId;
}

function clampSelectedWidgetId(spec: DashboardSpec, selectedWidgetId: string | null) {
  if (!selectedWidgetId) {
    return spec.widgets[0]?.id ?? null;
  }

  return spec.widgets.some((widget) => widget.id === selectedWidgetId)
    ? selectedWidgetId
    : spec.widgets[0]?.id ?? null;
}

interface BuilderShellProps {
  aiClient?: AiGenerationClient;
  initialDraft?: DashboardSpec;
}

export function BuilderShell({ aiClient, initialDraft: initialDraftProp }: BuilderShellProps = {}) {
  const [initialDraft] = useState<DashboardSpec>(
    () => syncPresenterDraft(initialDraftProp ?? buildInitialDraft()),
  );
  const [generationClient] = useState<AiGenerationClient>(
    () => aiClient ?? createDefaultAiGenerationClient(),
  );
  const [draft, setDraft] = useState<DashboardSpec>(initialDraft);
  const [baselineDraft, setBaselineDraft] = useState<DashboardSpec>(initialDraft);
  const [stagedCandidate, setStagedCandidate] = useState<Extract<
    GenerateDashboardSpecResult,
    { ok: true }
  > | null>(null);
  const [generationState, setGenerationState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: string; details: string[] }
    | { status: "success"; message: string }
  >({ status: "idle" });
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(
    initialDraft.widgets[0]?.id ?? null,
  );
  const [isClientView, setIsClientView] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(
    () => resolveInitialTemplateId(initialDraft),
  );
  const [showTemplates, setShowTemplates] = useState(true);
  const [showSpecIo, setShowSpecIo] = useState(false);
  const [viewMode, setViewMode] = useState<"build" | "preview" | "presenter">("build");
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const exportStageRef = useRef<HTMLDivElement | null>(null);

  const deferredDraft = useDeferredValue(draft);
  const validation = validateDashboardSpec(draft);
  const { packId: currentPackId, scenarioId: currentScenarioId } = getDraftContextSelection(draft);
  const availableScenarioIds = scenarioOptions(currentPackId);
  const availableTemplates = listTemplateCatalog({ packId: currentPackId });
  const theme = resolveDashboardTheme(deferredDraft.theme);
  const themeOptions = listDashboardThemes().map((entry) => ({
    id: entry.id,
    label: entry.label,
  }));
  const defaultScenarioId = availableScenarioIds[0] || currentScenarioId || "scaling-success";
  const adapterResult = createDashboardDataAdapter(deferredDraft);

  function replaceDraft(nextDraft: DashboardSpec, nextTemplateId = selectedTemplateId) {
    const syncedDraft = syncPresenterDraft(nextDraft);

    startTransition(() => {
      setDraft(syncedDraft);
      setStagedCandidate(null);
      setGenerationState({ status: "idle" });
      setSelectedTemplateId(nextTemplateId);
      setSelectedWidgetId(clampSelectedWidgetId(syncedDraft, selectedWidgetId));
      setImportErrors([]);
    });
  }

  function resetToBaseline() {
    replaceDraft(baselineDraft);
  }

  function createFreshDraft(packId: string, scenarioId: string) {
    const nextDraft = syncPresenterDraft(createFreshDraftForScenario(packId, scenarioId));
    const defaultTemplate = getDefaultTemplateForScenario(packId, scenarioId);

    startTransition(() => {
      setDraft(nextDraft);
      setBaselineDraft(nextDraft);
      setStagedCandidate(null);
      setGenerationState({ status: "idle" });
      setSelectedTemplateId(defaultTemplate?.templateId);
      setSelectedWidgetId(nextDraft.widgets[0]?.id ?? null);
      setImportErrors([]);
    });
  }

  function applyTemplate(templateId: string) {
    const nextDraft = syncPresenterDraft(
      instantiateTemplateSpec(templateId, {
        scenarioId: currentScenarioId,
      }),
    );

    startTransition(() => {
      setDraft(nextDraft);
      setBaselineDraft(nextDraft);
      setStagedCandidate(null);
      setGenerationState({ status: "idle" });
      setSelectedTemplateId(templateId);
      setSelectedWidgetId(nextDraft.widgets[0]?.id ?? null);
      setShowTemplates(false);
      setImportErrors([]);
    });
  }

  function changeScenario(scenarioId: string) {
    const currentTemplate = selectedTemplateId
      ? getTemplateById(selectedTemplateId)
      : undefined;
    const canReuseCurrentTemplate =
      !currentTemplate ||
      (currentTemplate.packId === currentPackId &&
        currentTemplate.scenarioIds.includes(scenarioId));

    if (!canReuseCurrentTemplate) {
      createFreshDraft(currentPackId, scenarioId);
      return;
    }

    replaceDraft(
      updateDashboardDraft(draft, (current) => ({
        ...current,
        intent: {
          ...current.intent,
          scenario: scenarioId,
        },
        dataContext: {
          ...current.dataContext,
          mock: current.dataContext.mock
            ? {
                ...current.dataContext.mock,
                scenarioId,
              }
            : current.dataContext.mock,
        },
      })),
    );
  }

  function changePack(packId: string) {
    const nextScenarioId = scenarioOptions(packId)[0];
    createFreshDraft(packId, nextScenarioId);
  }

  function changeTheme(themeId: string) {
    replaceDraft(
      updateDashboardDraft(draft, (current) => ({
        ...current,
        theme: {
          ...current.theme,
          id: themeId,
        },
      })),
    );
  }

  function applyImportedSpec() {
    const result = importDashboardSpecJson(importText);

    if (!result.ok) {
      setImportErrors(result.errors);
      return;
    }

    startTransition(() => {
      const syncedDraft = syncPresenterDraft(result.spec);

      setDraft(syncedDraft);
      setBaselineDraft(syncedDraft);
      setStagedCandidate(null);
      setGenerationState({ status: "idle" });
      setSelectedWidgetId(syncedDraft.widgets[0]?.id ?? null);
      setSelectedTemplateId(undefined);
      setImportErrors([]);
      setShowSpecIo(false);
    });
  }

  function exportCurrentSpec() {
    const result = downloadDashboardSpec(draft);

    if (!result.ok) {
      setImportErrors(result.errors);
    }
  }

  function exportCurrentDashboard() {
    if (!validation.ok) {
      setImportErrors(validation.errors);
      return;
    }

    if (!exportStageRef.current) {
      setImportErrors(["Open Preview or Presenter mode before exporting a proposal artifact."]);
      return;
    }

    const result = exportDashboardArtifact({
      spec: validation.spec,
      dashboardHtml: exportStageRef.current.outerHTML,
      stylesHtml: collectDocumentStyles(document),
    });

    if (!result.ok) {
      setImportErrors(result.errors);
    }
  }

  async function runAiGeneration(input: {
    mode: "generate_new" | "improve_current";
    prompt: string;
    promptTemplateId?: string;
  }) {
    if (input.mode === "improve_current") {
      if (!validation.ok) {
        setGenerationState({
          status: "error",
          error: "Improve Current requires the active draft to validate cleanly first.",
          details: validation.errors,
        });
        setStagedCandidate(null);
        return;
      }
    }

    const currentValidatedDraft =
      input.mode === "improve_current" && validation.ok ? validation.spec : undefined;

    setGenerationState({ status: "loading" });
    setStagedCandidate(null);

    const result = await generateDashboardSpec({
      client: generationClient,
      request: {
        mode: input.mode,
        packId: currentPackId,
        scenarioId: currentScenarioId,
        themeId: draft.theme.id,
        prompt: input.prompt,
        promptTemplateId: input.promptTemplateId,
        currentDraft: currentValidatedDraft,
      },
    });

    if (!result.ok) {
      setGenerationState({
        status: "error",
        error: result.error,
        details: result.details,
      });
      return;
    }

    startTransition(() => {
      setStagedCandidate(result);
      setGenerationState({
        status: "success",
        message: result.didRepair
          ? "Candidate generated and recovered through one bounded repair pass."
          : "Candidate generated and validated on the first pass.",
      });
    });
  }

  function applyStagedCandidate() {
    if (!stagedCandidate) {
      return;
    }

    const nextDraft = syncPresenterDraft(stagedCandidate.candidate);

    startTransition(() => {
      setDraft(nextDraft);
      setBaselineDraft(nextDraft);
      setSelectedWidgetId(nextDraft.widgets[0]?.id ?? null);
      setSelectedTemplateId(undefined);
      setStagedCandidate(null);
      setGenerationState({ status: "idle" });
      setImportErrors([]);
      setShowTemplates(false);
      setShowSpecIo(false);
    });
  }

  const inClientView = isClientView && viewMode !== "build";

  function renderDashboardOnlyMode() {
    if (!adapterResult.ok) {
      return <div className="builder-empty-state">Resolve dataset bindings to render the demo.</div>;
    }

    if (viewMode === "presenter") {
      return (
        <PresenterMode
          adapter={adapterResult.adapter}
          dashboardStageRef={exportStageRef}
          spec={deferredDraft}
          showNarrativePanel={false}
        />
      );
    }

    if (viewMode === "preview") {
      return (
        <section className="client-only-stage">
          <div ref={exportStageRef}>
            <DashboardRenderer
              adapter={adapterResult.adapter}
              presentation={{ showAnnotationLayer: true }}
              spec={deferredDraft}
            />
          </div>
        </section>
      );
    }

    return null;
  }

  function handleToggleClientView() {
    setViewMode((currentMode) => (currentMode === "build" ? "preview" : currentMode));
    setIsClientView(true);
  }

  function handleExitClientView() {
    setIsClientView(false);
  }

  if (inClientView) {
    return (
      <main className="app-shell app-shell--client-only" style={theme.cssVariables}>
        <button
          className="builder-toolbar__client-back button button--ghost"
          onClick={handleExitClientView}
          type="button"
        >
          Builder View
        </button>
        <section className="builder-client-shell">{renderDashboardOnlyMode()}</section>
      </main>
    );
  }

  return (
    <main className="app-shell" style={theme.cssVariables}>
      <header className="hero hero--builder">
        <p className="eyebrow">Sprint 9 Production Binding</p>
        <h1>Prompt The Dashboard, Then Refine The Story</h1>
        <p className="lede">
          Generate or edit a bounded DashboardSpec, bind datasets to the first governed live REST
          path, then keep refining through the same build, preview, presenter, and export runtime.
        </p>
      </header>
      <section className="builder-shell">
        <BuilderToolbar
          canExportDashboard={viewMode !== "build"}
          currentPackId={currentPackId}
          currentScenarioId={currentScenarioId}
          currentThemeId={draft.theme.id}
          dataMode={draft.dataContext.mode}
          isSpecIoOpen={showSpecIo}
          isTemplateGalleryOpen={showTemplates}
          onChangePack={changePack}
          onChangeScenario={changeScenario}
          onChangeTheme={changeTheme}
          onExportDashboard={exportCurrentDashboard}
          onExportSpec={exportCurrentSpec}
          isClientView={isClientView}
          onToggleClientView={handleToggleClientView}
          onChangeViewMode={setViewMode}
          onCreateDraft={() => createFreshDraft(currentPackId, currentScenarioId)}
          onResetDraft={resetToBaseline}
          onToggleSpecIo={() => setShowSpecIo((current) => !current)}
          onToggleTemplates={() => setShowTemplates((current) => !current)}
          packIds={getTemplatePackIds()}
          scenarioIds={availableScenarioIds}
          themeOptions={themeOptions}
          viewMode={viewMode}
        />

        <AiPromptBar
          availability={generationClient.availability}
          currentDraft={draft}
          currentPackId={currentPackId}
          currentScenarioId={currentScenarioId}
          currentThemeId={draft.theme.id}
          generationState={generationState}
          onApplyCandidate={applyStagedCandidate}
          onDiscardCandidate={() => {
            setStagedCandidate(null);
            setGenerationState({ status: "idle" });
          }}
          onGenerate={runAiGeneration}
          stagedCandidate={stagedCandidate}
        />

        {showTemplates ? (
          <TemplateGallery
            currentPackId={currentPackId}
            onApplyTemplate={applyTemplate}
            selectedTemplateId={selectedTemplateId}
            templates={availableTemplates}
          />
        ) : null}

        {showSpecIo ? (
          <section className="builder-panel builder-panel--wide" aria-labelledby="spec-io-title">
            <div className="builder-panel__header">
              <p className="eyebrow">Spec I/O</p>
              <h2 className="builder-panel__title" id="spec-io-title">
                Import Or Export DashboardSpec JSON
              </h2>
            </div>

            <div className="spec-io-grid">
              <label className="form-field">
                <span>Export JSON</span>
                <textarea readOnly rows={18} value={exportDashboardSpecJson(draft)} />
              </label>

              <div className="spec-io-actions">
                <label className="form-field">
                  <span>Import JSON</span>
                  <textarea
                    onChange={(event) => setImportText(event.target.value)}
                    placeholder="Paste a DashboardSpec document here."
                    rows={18}
                    value={importText}
                  />
                </label>

                {importErrors.length > 0 ? (
                  <div className="builder-alert builder-alert--error" role="alert">
                    {importErrors.join("; ")}
                  </div>
                ) : null}

                <button className="button" onClick={applyImportedSpec} type="button">
                  Load JSON Into Builder
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {!showSpecIo && importErrors.length > 0 ? (
          <div className="builder-alert builder-alert--error" role="alert">
            {importErrors.join("; ")}
          </div>
        ) : null}

        {!validation.ok ? (
          <div className="builder-alert builder-alert--error" role="alert">
            {validation.errors.join("; ")}
          </div>
        ) : null}

        {!adapterResult.ok ? (
          <div className="builder-alert builder-alert--error" role="alert">
            {adapterResult.errors.join("; ")}
          </div>
        ) : null}

        <section className="builder-workspace">
          <aside className="builder-sidebar">
            <WidgetPalette
              onAddWidget={(chartType) => {
                const nextDraft = addWidgetToDraft(draft, chartType);

                startTransition(() => {
                  setDraft(nextDraft);
                  setStagedCandidate(null);
                  setGenerationState({ status: "idle" });
                  setSelectedWidgetId(nextDraft.widgets.at(-1)?.id ?? null);
                });
              }}
            />
          </aside>

          <section className="builder-stage">
            <div className="builder-stage__header">
              <div>
                <p className="eyebrow">Draft</p>
                <h2>{draft.meta.title}</h2>
                <p>
                  {draft.widgets.length} widgets · {currentPackId} / {currentScenarioId}
                </p>
              </div>
            </div>

            {viewMode === "preview" ? (
              adapterResult.ok ? (
                <div ref={exportStageRef}>
                  <DashboardRenderer
                    adapter={adapterResult.adapter}
                    presentation={{ showAnnotationLayer: true }}
                    spec={deferredDraft}
                  />
                </div>
              ) : null
            ) : viewMode === "presenter" ? (
              adapterResult.ok ? (
                <PresenterMode
                  adapter={adapterResult.adapter}
                  dashboardStageRef={exportStageRef}
                  spec={deferredDraft}
                />
              ) : null
            ) : draft.widgets.length === 0 ? (
              <div className="builder-empty-state">
                Use the widget palette to add your first dashboard block.
              </div>
            ) : adapterResult.ok ? (
              <div className="builder-canvas">
                <EditableGridLayout
                  className="layout"
                  cols={draft.layout.columns}
                  compactType={resolveCompactType(draft.layout.compaction)}
                  draggableCancel=".builder-widget__action"
                  draggableHandle=".dashboard-box__header"
                  layout={toReactGridLayout(draft)}
                  margin={[16, 16]}
                  onDragStop={(layout: Layout) =>
                    replaceDraft(updateDraftLayout(draft, layout))
                  }
                  onResizeStop={(layout: Layout) =>
                    replaceDraft(updateDraftLayout(draft, layout))
                  }
                  resizeHandles={["se"]}
                  rowHeight={draft.layout.rowHeight}
                >
                  {draft.widgets.map((widget) => (
                    <div
                      className={
                        widget.id === selectedWidgetId
                          ? "builder-widget builder-widget--selected"
                          : "builder-widget"
                      }
                      key={widget.id}
                      onMouseDown={() => setSelectedWidgetId(widget.id)}
                    >
                      <button
                        aria-label={`Remove ${widget.title}`}
                        className="builder-widget__action"
                        onClick={(event) => {
                          event.stopPropagation();
                          const nextDraft = removeWidgetFromDraft(draft, widget.id);

                          startTransition(() => {
                            setDraft(nextDraft);
                            setStagedCandidate(null);
                            setGenerationState({ status: "idle" });
                            setSelectedWidgetId(nextDraft.widgets[0]?.id ?? null);
                          });
                        }}
                        type="button"
                      >
                        Remove
                      </button>
                      <WidgetRenderer
                        adapter={adapterResult.adapter}
                        presentation={{ showAnnotationLayer: true }}
                        spec={deferredDraft}
                        theme={theme}
                        widget={widget}
                      />
                    </div>
                  ))}
                </EditableGridLayout>
              </div>
            ) : (
              <div className="builder-empty-state">
                Resolve the current binding issues to render this draft on the shared data path.
              </div>
            )}
          </section>

          <aside className="builder-sidebar">
            <PropertyPanel
              defaultMockContext={{
                packId: currentPackId,
                scenarioId: defaultScenarioId,
                seed: draft.dataContext.mock?.seed ?? 1001,
              }}
              draft={draft}
              datasetStatuses={adapterResult.datasets}
              onChangeDraft={replaceDraft}
              onChangePack={changePack}
              onChangeScenario={changeScenario}
              onRemoveWidget={(widgetId) => {
                const nextDraft = removeWidgetFromDraft(draft, widgetId);

                startTransition(() => {
                  setDraft(nextDraft);
                  setStagedCandidate(null);
                  setGenerationState({ status: "idle" });
                  setSelectedWidgetId(nextDraft.widgets[0]?.id ?? null);
                });
              }}
              packIds={getTemplatePackIds()}
              scenarioIds={availableScenarioIds}
              selectedWidgetId={selectedWidgetId}
              themeOptions={themeOptions}
            />
            <StoryArcEditor draft={draft} onChangeDraft={replaceDraft} />
          </aside>
        </section>
      </section>
    </main>
  );
}

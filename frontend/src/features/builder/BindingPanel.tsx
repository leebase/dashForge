import type {
  DashboardDataMode,
  DashboardMockContext,
  DashboardSpec,
  DataBinding,
} from "../../core/spec/dashboardSpec";
import type { DashboardDataBindingStatus } from "../../core/data/createDashboardDataAdapter";
import { updateDashboardDraft } from "./builderState";

interface BindingPanelProps {
  defaultMockContext: DashboardMockContext;
  draft: DashboardSpec;
  datasetStatuses: DashboardDataBindingStatus[];
  onChangeDraft: (nextDraft: DashboardSpec) => void;
}

function buildDefaultBinding(): DataBinding {
  return {
    type: "rest",
    connection: {
      url: "",
      query: "",
    },
    fieldMap: {},
    cachePolicy: "none",
  };
}

export function BindingPanel({
  defaultMockContext,
  draft,
  datasetStatuses,
  onChangeDraft,
}: BindingPanelProps) {
  function changeMode(nextMode: DashboardDataMode) {
    onChangeDraft(
      updateDashboardDraft(draft, (current) => {
        if (nextMode === "artifact") {
          return current;
        }
        if (nextMode === "mock") {
          return {
            ...current,
            dataContext: {
              ...current.dataContext,
              mode: "mock",
              mock: current.dataContext.mock ?? defaultMockContext,
              live: undefined,
            },
          };
        }

        if (nextMode === "live") {
          const currentBindings = current.dataContext.live?.bindings ?? {};
          const nextBindings = Object.fromEntries(
            datasetStatuses.map((dataset) => [
              dataset.datasetId,
              currentBindings[dataset.datasetId] ?? buildDefaultBinding(),
            ]),
          );

          return {
            ...current,
            dataContext: {
              ...current.dataContext,
              mode: "live",
              mock: undefined,
              live: {
                bindings: nextBindings,
              },
            },
          };
        }

        return {
          ...current,
          dataContext: {
            ...current.dataContext,
            mode: "hybrid",
            mock: current.dataContext.mock ?? defaultMockContext,
            live: current.dataContext.live ?? {
              bindings: {},
            },
          },
        };
      }),
    );
  }

  function updateBinding(datasetId: string, updater: (binding: DataBinding) => DataBinding) {
    onChangeDraft(
      updateDashboardDraft(draft, (current) => {
        const currentBinding = current.dataContext.live?.bindings[datasetId] ?? buildDefaultBinding();

        return {
          ...current,
          dataContext: {
            ...current.dataContext,
            live: {
              bindings: {
                ...(current.dataContext.live?.bindings ?? {}),
                [datasetId]: updater(currentBinding),
              },
            },
          },
        };
      }),
    );
  }

  function removeBinding(datasetId: string) {
    onChangeDraft(
      updateDashboardDraft(draft, (current) => {
        const nextBindings = {
          ...(current.dataContext.live?.bindings ?? {}),
        };
        delete nextBindings[datasetId];

        return {
          ...current,
          dataContext: {
            ...current.dataContext,
            live: {
              bindings: nextBindings,
            },
          },
        };
      }),
    );
  }

  return (
    <section className="property-group">
      <h3>Data Bindings</h3>

      <label className="form-field">
        <span>Data Mode</span>
        <select
          disabled={draft.dataContext.mode === "artifact"}
          aria-label="Data Mode"
          onChange={(event) => changeMode(event.target.value as DashboardDataMode)}
          value={draft.dataContext.mode}
        >
          <option value="mock">mock</option>
          <option value="live">live</option>
          <option value="hybrid">hybrid</option>
          <option value="artifact">artifact (verified read-only)</option>
        </select>
      </label>

      <p className="builder-helper-copy">
        {draft.dataContext.mode === "artifact"
          ? "Artifact bindings are digest-pinned and read-only. Stage a new validated manifest through Agent-Orch to change them."
          : "Mock keeps the current scenario path, live requires every referenced dataset to bind, and hybrid lets you bind only the datasets that should leave mock mode."}
      </p>

      {datasetStatuses.length === 0 ? (
        <p className="builder-helper-copy">
          This dashboard currently has no dataset-backed widgets to bind.
        </p>
      ) : (
        <div className="binding-editor-list">
          {datasetStatuses.map((dataset) => {
            const binding = draft.dataContext.live?.bindings[dataset.datasetId];
            const editableBinding =
              binding ?? (draft.dataContext.mode === "live" ? buildDefaultBinding() : null);

            return (
              <section className="binding-editor" key={dataset.datasetId}>
                <div className="property-group__subheader">
                  <h4>{dataset.datasetId}</h4>
                  {draft.dataContext.mode === "hybrid" ? (
                    binding ? (
                      <button
                        className="button button--ghost button--small"
                        onClick={() => removeBinding(dataset.datasetId)}
                        type="button"
                      >
                        Use Mock Instead
                      </button>
                    ) : (
                      <button
                        className="button button--ghost button--small"
                        onClick={() =>
                          updateBinding(dataset.datasetId, () => buildDefaultBinding())
                        }
                        type="button"
                      >
                        Bind Live Dataset
                      </button>
                    )
                  ) : null}
                </div>

                <p className="builder-helper-copy">
                  Widgets: {dataset.widgetIds.join(", ")}. Source: {dataset.source}.
                </p>
                <p
                  className={
                    dataset.status === "error"
                      ? "binding-status binding-status--error"
                      : dataset.status === "fallback"
                        ? "binding-status binding-status--fallback"
                        : "binding-status binding-status--ready"
                  }
                >
                  {dataset.message}
                </p>

                {editableBinding ? (
                  <>
                    <label className="form-field">
                      <span>Adapter</span>
                      <select
                        onChange={(event) =>
                          updateBinding(dataset.datasetId, (current) => ({
                            ...current,
                            type: event.target.value as DataBinding["type"],
                          }))
                        }
                        value={editableBinding.type}
                      >
                        <option value="rest">rest</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Endpoint URL</span>
                      <input
                        aria-label={`${dataset.datasetId} Endpoint URL`}
                        onChange={(event) =>
                          updateBinding(dataset.datasetId, (current) => ({
                            ...current,
                            connection: {
                              ...current.connection,
                              url: event.target.value,
                            },
                          }))
                        }
                        placeholder="https://example.test/api/dataset"
                        value={editableBinding.connection.url ?? ""}
                      />
                    </label>

                    <div className="form-grid">
                      <label className="form-field">
                        <span>Response Path</span>
                        <input
                          aria-label={`${dataset.datasetId} Response Path`}
                          onChange={(event) =>
                            updateBinding(dataset.datasetId, (current) => ({
                              ...current,
                              connection: {
                                ...current.connection,
                                query: event.target.value,
                              },
                            }))
                          }
                          placeholder="data.rows"
                          value={editableBinding.connection.query ?? ""}
                        />
                      </label>

                      <label className="form-field">
                        <span>Cache Policy</span>
                        <select
                          onChange={(event) =>
                            updateBinding(dataset.datasetId, (current) => ({
                              ...current,
                              cachePolicy: event.target.value as "none" | "ttl",
                              cacheTTL:
                                event.target.value === "ttl" ? current.cacheTTL ?? 60_000 : undefined,
                            }))
                          }
                          value={editableBinding.cachePolicy ?? "none"}
                        >
                          <option value="none">none</option>
                          <option value="ttl">ttl</option>
                        </select>
                      </label>
                    </div>

                    {editableBinding.cachePolicy === "ttl" ? (
                      <label className="form-field">
                        <span>Cache TTL (ms)</span>
                        <input
                          onChange={(event) =>
                            updateBinding(dataset.datasetId, (current) => ({
                              ...current,
                              cacheTTL: Number(event.target.value) || undefined,
                            }))
                          }
                          type="number"
                          value={editableBinding.cacheTTL ?? 60_000}
                        />
                      </label>
                    ) : null}

                    <div className="property-group__subsection">
                      <div className="property-group__subheader">
                        <h4>Field Map</h4>
                      </div>

                      {dataset.fields.length === 0 ? (
                        <p className="builder-helper-copy">
                          No dashboard fields were inferred for this dataset yet.
                        </p>
                      ) : (
                        <div className="binding-field-map">
                          {dataset.fields.map((field) => (
                            <label className="form-field" key={`${dataset.datasetId}-${field}`}>
                              <span>{field}</span>
                              <input
                                aria-label={`${dataset.datasetId} field ${field}`}
                                onChange={(event) =>
                                  updateBinding(dataset.datasetId, (current) => {
                                    const nextFieldMap = {
                                      ...current.fieldMap,
                                    };

                                    if (!event.target.value.trim() || event.target.value === field) {
                                      delete nextFieldMap[field];
                                    } else {
                                      nextFieldMap[field] = event.target.value;
                                    }

                                    return {
                                      ...current,
                                      fieldMap: nextFieldMap,
                                    };
                                  })
                                }
                                value={editableBinding.fieldMap[field] ?? field}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="builder-helper-copy">
                    {draft.dataContext.mode === "artifact"
                      ? "This dataset resolves through the verified artifact field map."
                      : "Hybrid mode is currently leaving this dataset on the mock adapter path."}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

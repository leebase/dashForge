import {
  isDonutWidget,
  isGaugeWidget,
  isKpiWidget,
  isLineWidget,
  isSparklineWidget,
  isStackedBarWidget,
  isTableWidget,
  type AnnotationSpec,
  type BarWidgetSpec,
  type DashboardAudience,
  type DashboardIntentType,
  type DashboardMockContext,
  type DashboardSpec,
  type GaugeWidgetSpec,
  type KpiWidgetSpec,
  type LineWidgetSpec,
  type DonutWidgetSpec,
  type SparklineWidgetSpec,
  type StackedBarWidgetSpec,
  type TableWidgetSpec,
  type WidgetSpec,
} from "../../core/spec/dashboardSpec";
import type { DashboardDataBindingStatus } from "../../core/data/createDashboardDataAdapter";
import { getSupportedAnnotationTypes } from "../presenter/ChartAnnotationLayer";
import { replaceWidgetInDraft, updateDashboardDraft } from "./builderState";
import { BindingPanel } from "./BindingPanel";

const DASHBOARD_INTENT_OPTIONS: DashboardIntentType[] = [
  "executive_summary",
  "operational_detail",
  "risk_alert",
  "comparative_benchmark",
  "drill_down",
  "workshop_prototype",
];

const DASHBOARD_AUDIENCE_OPTIONS: DashboardAudience[] = [
  "executive",
  "manager",
  "operator",
  "analyst",
  "client_demo",
];

const GRANULARITY_OPTIONS = ["day", "week", "month", "quarter"] as const;

type CartesianEditableWidget =
  | LineWidgetSpec
  | BarWidgetSpec
  | SparklineWidgetSpec
  | StackedBarWidgetSpec;

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildStarterAnnotation(widget: WidgetSpec): AnnotationSpec {
  const supportedTypes = getSupportedAnnotationTypes(widget);
  const type = supportedTypes[0] ?? "text_label";

  return {
    type,
    label: type === "reference_line" ? "New threshold callout" : "New presenter callout",
    value: type === "reference_line" ? 0 : undefined,
    style: type === "reference_line" ? "dashed" : undefined,
  };
}

interface PropertyPanelProps {
  defaultMockContext: DashboardMockContext;
  draft: DashboardSpec;
  datasetStatuses: DashboardDataBindingStatus[];
  packIds: string[];
  scenarioIds: string[];
  selectedWidgetId: string | null;
  themeOptions: Array<{ id: string; label: string }>;
  onChangeDraft: (nextDraft: DashboardSpec) => void;
  onChangePack: (packId: string) => void;
  onChangeScenario: (scenarioId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function PropertyPanel({
  defaultMockContext,
  draft,
  datasetStatuses,
  packIds,
  scenarioIds,
  selectedWidgetId,
  themeOptions,
  onChangeDraft,
  onChangePack,
  onChangeScenario,
  onRemoveWidget,
}: PropertyPanelProps) {
  const selectedWidget = draft.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;
  const packId = draft.dataContext.mock?.packId ?? draft.intent.industry;

  function applyWidgetChange(widgetId: string, updater: (widget: any) => unknown) {
    onChangeDraft(
      replaceWidgetInDraft(draft, widgetId, updater as (widget: WidgetSpec) => WidgetSpec),
    );
  }

  function renderCartesianWidgetFields(widget: CartesianEditableWidget) {
    return (
      <>
        <div className="form-grid">
          <label className="form-field">
            <span>X Field</span>
            <input
              onChange={(event) =>
                applyWidgetChange(widget.id, (current: CartesianEditableWidget) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    encoding: {
                      ...current.chart.encoding,
                      x: {
                        ...current.chart.encoding.x,
                        field: event.target.value,
                      },
                    },
                  },
                }))
              }
              value={widget.chart.encoding.x.field}
            />
          </label>

          <label className="form-field">
            <span>Y Field</span>
            <input
              onChange={(event) =>
                applyWidgetChange(widget.id, (current: CartesianEditableWidget) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    encoding: {
                      ...current.chart.encoding,
                      y: {
                        ...current.chart.encoding.y,
                        field: event.target.value,
                      },
                    },
                  },
                }))
              }
              value={widget.chart.encoding.y.field}
            />
          </label>
        </div>

        {"series" in widget.chart.encoding ? (
          <label className="form-field">
            <span>Series Field</span>
            <input
              onChange={(event) =>
                applyWidgetChange(widget.id, (current: CartesianEditableWidget) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    encoding: {
                      ...current.chart.encoding,
                      series: event.target.value
                        ? {
                            ...(current.chart.encoding.series ?? { field: "" }),
                            field: event.target.value,
                          }
                        : current.chart.type === "stacked_bar"
                          ? { field: "series" }
                          : undefined,
                    },
                  },
                }))
              }
              value={widget.chart.encoding.series?.field ?? ""}
            />
          </label>
        ) : null}

        <div className="form-grid">
          <label className="checkbox-field">
            <input
              checked={widget.chart.options?.showGrid ?? false}
              onChange={(event) =>
                applyWidgetChange(widget.id, (current: CartesianEditableWidget) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    options: {
                      ...current.chart.options,
                      showGrid: event.target.checked,
                    },
                  },
                }))
              }
              type="checkbox"
            />
            <span>Show Grid</span>
          </label>

          <label className="checkbox-field">
            <input
              checked={widget.chart.options?.showTooltip ?? false}
              onChange={(event) =>
                applyWidgetChange(widget.id, (current: CartesianEditableWidget) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    options: {
                      ...current.chart.options,
                      showTooltip: event.target.checked,
                    },
                  },
                }))
              }
              type="checkbox"
            />
            <span>Show Tooltip</span>
          </label>
        </div>
      </>
    );
  }

  function renderSpecificWidgetFields(widget: WidgetSpec) {
    if (isKpiWidget(widget)) {
      const kpiWidget: KpiWidgetSpec = widget;

      return (
        <>
          <label className="form-field">
            <span>Value Field</span>
            <input
              onChange={(event) =>
                applyWidgetChange(kpiWidget.id, (current: KpiWidgetSpec) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    encoding: {
                      value: {
                        ...current.chart.encoding.value,
                        field: event.target.value,
                      },
                    },
                  },
                }))
              }
              value={kpiWidget.chart.encoding.value.field}
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Delta Field</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(kpiWidget.id, (current: KpiWidgetSpec) => ({
                    ...current,
                    chart: {
                      ...current.chart,
                      kpiConfig: {
                        ...current.chart.kpiConfig,
                        deltaField: event.target.value || undefined,
                      },
                    },
                  }))
                }
                value={kpiWidget.chart.kpiConfig?.deltaField ?? ""}
              />
            </label>

            <label className="form-field">
              <span>Suffix</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(kpiWidget.id, (current: KpiWidgetSpec) => ({
                    ...current,
                    chart: {
                      ...current.chart,
                      kpiConfig: {
                        ...current.chart.kpiConfig,
                        suffix: event.target.value || undefined,
                      },
                    },
                  }))
                }
                value={kpiWidget.chart.kpiConfig?.suffix ?? ""}
              />
            </label>
          </div>
        </>
      );
    }

    if (isGaugeWidget(widget)) {
      const gaugeWidget: GaugeWidgetSpec = widget;

      return (
        <>
          <label className="form-field">
            <span>Value Field</span>
            <input
              onChange={(event) =>
                applyWidgetChange(gaugeWidget.id, (current: GaugeWidgetSpec) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    encoding: {
                      ...current.chart.encoding,
                      value: {
                        ...current.chart.encoding.value,
                        field: event.target.value,
                      },
                    },
                  },
                }))
              }
              value={gaugeWidget.chart.encoding.value.field}
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Min</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(gaugeWidget.id, (current: GaugeWidgetSpec) => ({
                    ...current,
                    chart: {
                      ...current.chart,
                      gaugeConfig: {
                        ...current.chart.gaugeConfig,
                        min: parseNumber(event.target.value),
                      },
                    },
                  }))
                }
                type="number"
                value={gaugeWidget.chart.gaugeConfig?.min ?? ""}
              />
            </label>

            <label className="form-field">
              <span>Max</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(gaugeWidget.id, (current: GaugeWidgetSpec) => ({
                    ...current,
                    chart: {
                      ...current.chart,
                      gaugeConfig: {
                        ...current.chart.gaugeConfig,
                        max: parseNumber(event.target.value),
                      },
                    },
                  }))
                }
                type="number"
                value={gaugeWidget.chart.gaugeConfig?.max ?? ""}
              />
            </label>
          </div>
        </>
      );
    }

    if (isDonutWidget(widget)) {
      const donutWidget: DonutWidgetSpec = widget;

      return (
        <>
          <div className="form-grid">
            <label className="form-field">
              <span>Category Field</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(donutWidget.id, (current: DonutWidgetSpec) => ({
                    ...current,
                    chart: {
                      ...current.chart,
                      encoding: {
                        ...current.chart.encoding,
                        category: {
                          ...current.chart.encoding.category,
                          field: event.target.value,
                        },
                      },
                    },
                  }))
                }
                value={donutWidget.chart.encoding.category.field}
              />
            </label>

            <label className="form-field">
              <span>Value Field</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(donutWidget.id, (current: DonutWidgetSpec) => ({
                    ...current,
                    chart: {
                      ...current.chart,
                      encoding: {
                        ...current.chart.encoding,
                        value: {
                          ...current.chart.encoding.value,
                          field: event.target.value,
                        },
                      },
                    },
                  }))
                }
                value={donutWidget.chart.encoding.value.field}
              />
            </label>
          </div>

          <label className="form-field">
            <span>Inner Radius</span>
            <input
              onChange={(event) =>
                applyWidgetChange(donutWidget.id, (current: DonutWidgetSpec) => ({
                  ...current,
                  chart: {
                    ...current.chart,
                    options: {
                      ...current.chart.options,
                      innerRadius: parseNumber(event.target.value),
                    },
                  },
                }))
              }
              type="number"
              value={donutWidget.chart.options?.innerRadius ?? ""}
            />
          </label>
        </>
      );
    }

    if (isTableWidget(widget)) {
      const tableWidget: TableWidgetSpec = widget;

      return (
        <label className="form-field">
          <span>Columns</span>
          <input
            onChange={(event) =>
              applyWidgetChange(tableWidget.id, (current: TableWidgetSpec) => ({
                ...current,
                chart: {
                  ...current.chart,
                  encoding: {
                    columns: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((field) => ({ field })),
                  },
                },
              }))
            }
            value={tableWidget.chart.encoding.columns.map((column) => column.field).join(", ")}
          />
        </label>
      );
    }

    if (
      isLineWidget(widget) ||
      widget.chart.type === "bar" ||
      isSparklineWidget(widget) ||
      isStackedBarWidget(widget)
    ) {
      return renderCartesianWidgetFields(widget as CartesianEditableWidget);
    }

    return null;
  }

  return (
    <section className="builder-panel" aria-labelledby="property-panel-title">
      <div className="builder-panel__header">
        <p className="eyebrow">Properties</p>
        <h2 className="builder-panel__title" id="property-panel-title">
          {selectedWidget ? selectedWidget.title : "Dashboard Settings"}
        </h2>
      </div>

      <div className="property-panel">
        <section className="property-group">
          <h3>Dashboard</h3>

          <label className="form-field">
            <span>Title</span>
            <input
              onChange={(event) =>
                onChangeDraft(
                  updateDashboardDraft(draft, (current) => ({
                    ...current,
                    meta: {
                      ...current.meta,
                      title: event.target.value,
                    },
                  })),
                )
              }
              value={draft.meta.title}
            />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                onChangeDraft(
                  updateDashboardDraft(draft, (current) => ({
                    ...current,
                    meta: {
                      ...current.meta,
                      description: event.target.value,
                    },
                  })),
                )
              }
              rows={3}
              value={draft.meta.description ?? ""}
            />
          </label>

          <label className="form-field">
            <span>Theme</span>
            <select
              onChange={(event) =>
                onChangeDraft(
                  updateDashboardDraft(draft, (current) => ({
                    ...current,
                    theme: {
                      ...current.theme,
                      id: event.target.value,
                    },
                  })),
                )
              }
              value={draft.theme.id}
            >
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Intent</span>
              <select
                onChange={(event) =>
                  onChangeDraft(
                    updateDashboardDraft(draft, (current) => ({
                      ...current,
                      intent: {
                        ...current.intent,
                        type: event.target.value as DashboardIntentType,
                      },
                    })),
                  )
                }
                value={draft.intent.type}
              >
                {DASHBOARD_INTENT_OPTIONS.map((intent) => (
                  <option key={intent} value={intent}>
                    {intent}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Audience</span>
              <select
                onChange={(event) =>
                  onChangeDraft(
                    updateDashboardDraft(draft, (current) => ({
                      ...current,
                      intent: {
                        ...current.intent,
                        audience: event.target.value as DashboardAudience,
                      },
                    })),
                  )
                }
                value={draft.intent.audience}
              >
                {DASHBOARD_AUDIENCE_OPTIONS.map((audience) => (
                  <option key={audience} value={audience}>
                    {audience}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {draft.dataContext.mock ? (
            <div className="form-grid">
              <label className="form-field">
                <span>Pack</span>
                <select onChange={(event) => onChangePack(event.target.value)} value={packId}>
                  {packIds.map((candidatePackId) => (
                    <option key={candidatePackId} value={candidatePackId}>
                      {candidatePackId}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Scenario</span>
                <select
                  onChange={(event) => onChangeScenario(event.target.value)}
                  value={draft.dataContext.mock.scenarioId}
                >
                  {scenarioIds.map((scenarioId) => (
                    <option key={scenarioId} value={scenarioId}>
                      {scenarioId}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p className="builder-helper-copy">
              {draft.dataContext.mode === "artifact"
                ? "Verified artifact mode pins pack, scenario, seed, and dataset bindings to the staged manifest."
                : "Live mode omits the mock scenario context. Switch to mock or hybrid to restore pack and scenario controls."}
            </p>
          )}

          <div className="form-grid">
            {draft.dataContext.mock ? (
              <label className="form-field">
                <span>Seed</span>
                <input
                  onChange={(event) => {
                    const seed = parseInteger(event.target.value);

                    if (seed === undefined) {
                      return;
                    }

                    onChangeDraft(
                      updateDashboardDraft(draft, (current) => ({
                        ...current,
                        dataContext: {
                          ...current.dataContext,
                          mock: current.dataContext.mock
                            ? {
                                ...current.dataContext.mock,
                                seed,
                              }
                            : current.dataContext.mock,
                        },
                      })),
                    );
                  }}
                  type="number"
                  value={draft.dataContext.mock.seed}
                />
              </label>
            ) : null}

            <label className="form-field">
              <span>Granularity</span>
              <select
                onChange={(event) =>
                  onChangeDraft(
                    updateDashboardDraft(draft, (current) => ({
                      ...current,
                      dataContext: {
                        ...current.dataContext,
                        timeRange: {
                          ...current.dataContext.timeRange,
                          granularity: event.target.value as
                            | "day"
                            | "week"
                            | "month"
                            | "quarter",
                        },
                      },
                    })),
                  )
                }
                value={draft.dataContext.timeRange.granularity}
              >
                {GRANULARITY_OPTIONS.map((granularity) => (
                  <option key={granularity} value={granularity}>
                    {granularity}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Start</span>
              <input
                onChange={(event) =>
                  onChangeDraft(
                    updateDashboardDraft(draft, (current) => ({
                      ...current,
                      dataContext: {
                        ...current.dataContext,
                        timeRange: {
                          ...current.dataContext.timeRange,
                          start: event.target.value,
                        },
                      },
                    })),
                  )
                }
                type="date"
                value={draft.dataContext.timeRange.start}
              />
            </label>

            <label className="form-field">
              <span>End</span>
              <input
                onChange={(event) =>
                  onChangeDraft(
                    updateDashboardDraft(draft, (current) => ({
                      ...current,
                      dataContext: {
                        ...current.dataContext,
                        timeRange: {
                          ...current.dataContext.timeRange,
                          end: event.target.value,
                        },
                      },
                    })),
                  )
                }
                type="date"
                value={draft.dataContext.timeRange.end}
              />
            </label>
          </div>
        </section>

        <BindingPanel
          defaultMockContext={defaultMockContext}
          draft={draft}
          datasetStatuses={datasetStatuses}
          onChangeDraft={onChangeDraft}
        />

        {selectedWidget ? (
          <section className="property-group">
            <div className="property-group__header">
              <h3>Selected Widget</h3>
              <button
                className="button button--ghost button--small"
                onClick={() => onRemoveWidget(selectedWidget.id)}
                type="button"
              >
                Remove
              </button>
            </div>

            <label className="form-field">
              <span>Title</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                value={selectedWidget.title}
              />
            </label>

            <label className="form-field">
              <span>Subtitle</span>
              <input
                onChange={(event) =>
                  applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                    ...current,
                    subtitle: event.target.value || undefined,
                  }))
                }
                value={selectedWidget.subtitle ?? ""}
              />
            </label>

            <label className="form-field">
              <span>Caption</span>
              <textarea
                onChange={(event) =>
                  applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                    ...current,
                    caption: event.target.value || undefined,
                  }))
                }
                rows={3}
                value={selectedWidget.caption ?? ""}
              />
            </label>

            <div className="form-grid">
              <label className="form-field">
                <span>X</span>
                <input
                  onChange={(event) => {
                    const x = parseInteger(event.target.value);

                    if (x === undefined) {
                      return;
                    }

                    applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                      ...current,
                      position: {
                        ...current.position,
                        x,
                      },
                    }));
                  }}
                  type="number"
                  value={selectedWidget.position.x}
                />
              </label>

              <label className="form-field">
                <span>Y</span>
                <input
                  onChange={(event) => {
                    const y = parseInteger(event.target.value);

                    if (y === undefined) {
                      return;
                    }

                    applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                      ...current,
                      position: {
                        ...current.position,
                        y,
                      },
                    }));
                  }}
                  type="number"
                  value={selectedWidget.position.y}
                />
              </label>

              <label className="form-field">
                <span>W</span>
                <input
                  onChange={(event) => {
                    const width = parseInteger(event.target.value);

                    if (width === undefined) {
                      return;
                    }

                    applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                      ...current,
                      position: {
                        ...current.position,
                        w: width,
                      },
                    }));
                  }}
                  type="number"
                  value={selectedWidget.position.w}
                />
              </label>

              <label className="form-field">
                <span>H</span>
                <input
                  onChange={(event) => {
                    const height = parseInteger(event.target.value);

                    if (height === undefined) {
                      return;
                    }

                    applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                      ...current,
                      position: {
                        ...current.position,
                        h: height,
                      },
                    }));
                  }}
                  type="number"
                  value={selectedWidget.position.h}
                />
              </label>
            </div>

            {renderSpecificWidgetFields(selectedWidget)}

            <div className="property-group__subsection">
              <div className="property-group__subheader">
                <h4>Annotations</h4>
                <button
                  className="button button--ghost button--small"
                  onClick={() =>
                    applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                      ...current,
                      annotations: [...(current.annotations ?? []), buildStarterAnnotation(current)],
                    }))
                  }
                  type="button"
                >
                  Add Annotation
                </button>
              </div>

              <p className="builder-helper-copy">
                Sprint 7 supports reference lines on line/bar/stacked-bar widgets and
                callout labels on all widget types.
              </p>

              {(selectedWidget.annotations ?? []).length === 0 ? (
                <p className="builder-helper-copy">No annotations are attached to this widget yet.</p>
              ) : (
                <div className="annotation-editor-list">
                  {(selectedWidget.annotations ?? []).map((annotation, index) => {
                    const supportedTypes = getSupportedAnnotationTypes(selectedWidget);

                    return (
                      <div className="annotation-editor" key={`${selectedWidget.id}-${index}`}>
                        <div className="form-grid">
                          <label className="form-field">
                            <span>Type</span>
                            <select
                              onChange={(event) =>
                                applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                                  ...current,
                                  annotations: (current.annotations ?? []).map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? {
                                          ...entry,
                                          type: event.target.value as AnnotationSpec["type"],
                                          value:
                                            event.target.value === "reference_line"
                                              ? entry.value ?? 0
                                              : undefined,
                                          style:
                                            event.target.value === "reference_line"
                                              ? entry.style ?? "dashed"
                                              : undefined,
                                        }
                                      : entry,
                                  ),
                                }))
                              }
                              value={annotation.type}
                            >
                              {supportedTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="form-field">
                            <span>Label</span>
                            <input
                              onChange={(event) =>
                                applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                                  ...current,
                                  annotations: (current.annotations ?? []).map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, label: event.target.value }
                                      : entry,
                                  ),
                                }))
                              }
                              value={annotation.label}
                            />
                          </label>
                        </div>

                        {annotation.type === "reference_line" ? (
                          <div className="form-grid">
                            <label className="form-field">
                              <span>Value</span>
                              <input
                                onChange={(event) =>
                                  applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                                    ...current,
                                    annotations: (current.annotations ?? []).map((entry, entryIndex) =>
                                      entryIndex === index
                                        ? {
                                            ...entry,
                                            value: parseNumber(event.target.value),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                                type="number"
                                value={annotation.value ?? ""}
                              />
                            </label>

                            <label className="form-field">
                              <span>Line Style</span>
                              <select
                                onChange={(event) =>
                                  applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                                    ...current,
                                    annotations: (current.annotations ?? []).map((entry, entryIndex) =>
                                      entryIndex === index
                                        ? {
                                            ...entry,
                                            style: event.target.value as AnnotationSpec["style"],
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                                value={annotation.style ?? "solid"}
                              >
                                <option value="solid">solid</option>
                                <option value="dashed">dashed</option>
                                <option value="dotted">dotted</option>
                              </select>
                            </label>
                          </div>
                        ) : null}

                        <div className="form-grid">
                          <label className="form-field">
                            <span>Color</span>
                            <input
                              onChange={(event) =>
                                applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                                  ...current,
                                  annotations: (current.annotations ?? []).map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? {
                                          ...entry,
                                          color: event.target.value || undefined,
                                        }
                                      : entry,
                                  ),
                                }))
                              }
                              placeholder="#a34b2a"
                              value={annotation.color ?? ""}
                            />
                          </label>

                          <div className="annotation-editor__actions">
                            <button
                              className="button button--ghost button--small"
                              onClick={() =>
                                applyWidgetChange(selectedWidget.id, (current: WidgetSpec) => ({
                                  ...current,
                                  annotations: (current.annotations ?? []).filter(
                                    (_, entryIndex) => entryIndex !== index,
                                  ),
                                }))
                              }
                              type="button"
                            >
                              Remove Annotation
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

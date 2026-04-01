import type { LayoutItem } from "react-grid-layout/legacy";

import type {
  ChartType,
  DashboardSpec,
  WidgetSpec,
} from "../../core/spec/dashboardSpec";
import { syncPresenterDraft } from "../presenter/narrativeStore";
import { createPaletteWidget, getDefaultWidgetPosition } from "./widgetFactories";

function cloneSpec(spec: DashboardSpec): DashboardSpec {
  return JSON.parse(JSON.stringify(spec)) as DashboardSpec;
}

function stampSpec(spec: DashboardSpec): DashboardSpec {
  return syncPresenterDraft({
    ...spec,
    meta: {
      ...spec.meta,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function addWidgetToDraft(
  spec: DashboardSpec,
  chartType: ChartType,
): DashboardSpec {
  const next = cloneSpec(spec);
  const nextIndex = next.widgets.length + 1;
  const widget = createPaletteWidget(
    next.dataContext.mock?.packId ?? next.intent.industry,
    chartType,
    `${chartType}-${nextIndex}`,
    getDefaultWidgetPosition(next, chartType),
  );

  return stampSpec({
    ...next,
    widgets: [...next.widgets, widget],
  });
}

export function removeWidgetFromDraft(
  spec: DashboardSpec,
  widgetId: string,
): DashboardSpec {
  return stampSpec({
    ...cloneSpec(spec),
    widgets: spec.widgets.filter((widget) => widget.id !== widgetId),
  });
}

export function replaceWidgetInDraft(
  spec: DashboardSpec,
  widgetId: string,
  updater: (widget: WidgetSpec) => WidgetSpec,
): DashboardSpec {
  return stampSpec({
    ...cloneSpec(spec),
    widgets: spec.widgets.map((widget) =>
      widget.id === widgetId
        ? updater(JSON.parse(JSON.stringify(widget)) as WidgetSpec)
        : widget,
    ),
  });
}

export function updateDraftLayout(
  spec: DashboardSpec,
  layout: readonly LayoutItem[],
): DashboardSpec {
  const layoutById = new Map(layout.map((item) => [item.i, item]));

  return stampSpec({
    ...cloneSpec(spec),
    widgets: spec.widgets.map((widget) => {
      const nextLayout = layoutById.get(widget.id);

      if (!nextLayout) {
        return widget;
      }

      return {
        ...widget,
        position: {
          ...widget.position,
          x: nextLayout.x,
          y: nextLayout.y,
          w: nextLayout.w,
          h: nextLayout.h,
          minW: nextLayout.minW ?? widget.position.minW,
          minH: nextLayout.minH ?? widget.position.minH,
          maxW: nextLayout.maxW ?? widget.position.maxW,
          maxH: nextLayout.maxH ?? widget.position.maxH,
        },
      };
    }),
  });
}

export function updateDashboardDraft(
  spec: DashboardSpec,
  updater: (current: DashboardSpec) => DashboardSpec,
): DashboardSpec {
  return stampSpec(updater(cloneSpec(spec)));
}

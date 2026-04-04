import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type {
  DashboardBreakpoints,
  DashboardLayout,
  WidgetSpec,
} from "../core/spec/dashboardSpec";

export type ResponsiveBreakpoint = "lg" | "md" | "sm";

export interface ResponsiveGridPlacement {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CompiledResponsiveGrid {
  breakpoint: ResponsiveBreakpoint;
  columns: number;
  items: ResponsiveGridPlacement[];
}

interface ResponsiveDashboardGridProps {
  layout: DashboardLayout;
  widgets: WidgetSpec[];
  renderWidget: (widget: WidgetSpec) => ReactNode;
}

function resolveBreakpoint(
  width: number,
  breakpoints: DashboardBreakpoints,
): ResponsiveBreakpoint {
  if (width >= breakpoints.lg) {
    return "lg";
  }
  if (width >= breakpoints.md) {
    return "md";
  }
  return "sm";
}

function resolveColumns(columns: number, breakpoint: ResponsiveBreakpoint): number {
  if (breakpoint === "lg") {
    return columns;
  }

  if (breakpoint === "md") {
    return Math.min(columns, Math.max(8, Math.round(columns * 0.67)));
  }

  return Math.min(columns, Math.max(4, Math.round(columns / 3)));
}

function collides(
  left: ResponsiveGridPlacement,
  right: ResponsiveGridPlacement,
): boolean {
  return !(
    left.x + left.w <= right.x ||
    right.x + right.w <= left.x ||
    left.y + left.h <= right.y ||
    right.y + right.h <= left.y
  );
}

function preferredColumns(targetColumns: number, preferredX: number) {
  const candidates = new Set<number>([preferredX]);

  for (let index = 0; index <= targetColumns; index += 1) {
    candidates.add(index);
  }

  return [...candidates];
}

export function compileResponsiveGridLayout(
  layout: DashboardLayout,
  widgets: WidgetSpec[],
  containerWidth: number,
): CompiledResponsiveGrid {
  const breakpoint = resolveBreakpoint(
    containerWidth || layout.breakpoints.lg,
    layout.breakpoints,
  );
  const columns = resolveColumns(layout.columns, breakpoint);
  const placed: ResponsiveGridPlacement[] = [];

  const orderedWidgets = [...widgets].sort((left, right) =>
    left.position.y === right.position.y
      ? left.position.x - right.position.x
      : left.position.y - right.position.y,
  );

  for (const widget of orderedWidgets) {
    const width = Math.min(
      columns,
      Math.max(1, Math.round((widget.position.w / layout.columns) * columns)),
    );
    const preferredX = Math.max(
      0,
      Math.min(columns - width, Math.round((widget.position.x / layout.columns) * columns)),
    );
    const startY = Math.max(0, widget.position.y);

    let y = startY;
    let resolved: ResponsiveGridPlacement | null = null;

    while (!resolved) {
      for (const candidateX of preferredColumns(columns - width, preferredX)) {
        const candidate: ResponsiveGridPlacement = {
          widgetId: widget.id,
          x: candidateX,
          y,
          w: width,
          h: Math.max(1, widget.position.h),
        };

        if (!placed.some((existing) => collides(existing, candidate))) {
          resolved = candidate;
          break;
        }
      }

      if (!resolved) {
        y += 1;
      }
    }

    placed.push(resolved);
  }

  return {
    breakpoint,
    columns,
    items: placed,
  };
}

function gridItemStyle(item: ResponsiveGridPlacement): CSSProperties {
  return {
    gridColumn: `${item.x + 1} / span ${item.w}`,
    gridRow: `${item.y + 1} / span ${item.h}`,
  };
}

export function ResponsiveDashboardGrid({
  layout,
  widgets,
  renderWidget,
}: ResponsiveDashboardGridProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(node.clientWidth);
    };

    updateWidth();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateWidth)
        : undefined;

    resizeObserver?.observe(node);
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const compiled = compileResponsiveGridLayout(layout, widgets, containerWidth);

  return (
    <section
      className={`dashboard-grid dashboard-grid--${compiled.breakpoint}`}
      ref={containerRef}
      style={{
        gridAutoRows: `${layout.rowHeight}px`,
        gridTemplateColumns: `repeat(${compiled.columns}, minmax(0, 1fr))`,
      }}
    >
      {compiled.items.map((item) => {
        const widget = widgets.find((entry) => entry.id === item.widgetId);

        if (!widget) {
          return null;
        }

        return (
          <div
            className="dashboard-grid__item"
            key={widget.id}
            style={gridItemStyle(item)}
          >
            {renderWidget(widget)}
          </div>
        );
      })}
    </section>
  );
}

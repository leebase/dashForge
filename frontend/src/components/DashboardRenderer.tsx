import type { CSSProperties } from "react";

import type { DataAdapter } from "../core/data/DataAdapter";
import type { DashboardSpec, WidgetSpec } from "../core/spec/dashboardSpec";
import { validateDashboardSpec } from "../core/spec/dashboardSchema";
import { WidgetRenderer } from "./WidgetRenderer";

interface DashboardRendererProps {
  adapter: DataAdapter;
  spec: DashboardSpec;
}

function gridStyle(widget: WidgetSpec): CSSProperties {
  return {
    gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
    gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
  };
}

export function DashboardRenderer({ adapter, spec }: DashboardRendererProps) {
  const validated = validateDashboardSpec(spec);

  if (!validated.ok) {
    return (
      <section className="dashboard-box" aria-label="Invalid dashboard spec">
        <div className="dashboard-box__state" role="alert">
          {validated.errors.join("; ")}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={`${spec.meta.title} dashboard`}
      className="dashboard"
      style={{
        gridTemplateColumns: `repeat(${spec.layout.columns}, minmax(0, 1fr))`,
      }}
    >
      {spec.widgets.map((widget) => (
        <div key={widget.id} style={gridStyle(widget)}>
          <WidgetRenderer adapter={adapter} widget={widget} />
        </div>
      ))}
    </section>
  );
}

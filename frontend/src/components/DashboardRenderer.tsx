import type { DataAdapter } from "../core/data/DataAdapter";
import type { DashboardSpec } from "../core/spec/dashboardSpec";
import { validateDashboardSpec } from "../core/spec/dashboardSchema";
import { resolveDashboardTheme } from "../core/theme/themeRegistry";
import { ResponsiveDashboardGrid } from "../dashboard/ResponsiveDashboardGrid";
import { WidgetRenderer } from "./WidgetRenderer";

interface DashboardPresentationState {
  activeWidgetIds?: string[];
  dimInactiveWidgets?: boolean;
  showAnnotationLayer?: boolean;
}

interface DashboardRendererProps {
  adapter: DataAdapter;
  spec: DashboardSpec;
  presentation?: DashboardPresentationState;
}

export function DashboardRenderer({
  adapter,
  spec,
  presentation,
}: DashboardRendererProps) {
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

  const theme = resolveDashboardTheme(validated.spec.theme);
  const activeWidgetIds = new Set(presentation?.activeWidgetIds ?? []);
  const dimInactiveWidgets =
    presentation?.dimInactiveWidgets === true && activeWidgetIds.size > 0;

  return (
    <section
      aria-label={`${validated.spec.meta.title} dashboard`}
      className="dashboard"
      style={{
        ...theme.cssVariables,
      }}
    >
      <ResponsiveDashboardGrid
        layout={validated.spec.layout}
        renderWidget={(widget) => (
          <WidgetRenderer
            adapter={adapter}
            presentation={{
              isDimmed: dimInactiveWidgets ? !activeWidgetIds.has(widget.id) : false,
              isHighlighted: activeWidgetIds.has(widget.id),
              showAnnotationLayer: presentation?.showAnnotationLayer ?? false,
            }}
            spec={validated.spec}
            theme={theme}
            widget={widget}
          />
        )}
        widgets={validated.spec.widgets}
      />
    </section>
  );
}

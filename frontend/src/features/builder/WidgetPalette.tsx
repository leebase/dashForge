import type { ChartType } from "../../core/spec/dashboardSpec";

const PALETTE_ITEMS: Array<{
  type: ChartType;
  title: string;
  detail: string;
}> = [
  { type: "kpi", title: "KPI Card", detail: "Single metric with delta context." },
  { type: "line", title: "Line Chart", detail: "Trend curve for monthly or daily movement." },
  { type: "bar", title: "Bar Chart", detail: "Comparison view for ranked or periodic values." },
  {
    type: "stacked_bar",
    title: "Stacked Bar",
    detail: "Composition view across categories and series.",
  },
  { type: "donut", title: "Donut", detail: "Proportion or segment mix." },
  { type: "table", title: "Table", detail: "Detailed operational rows." },
  { type: "sparkline", title: "Sparkline", detail: "Compact trend signal." },
  { type: "gauge", title: "Gauge", detail: "Target vs actual summary." },
];

interface WidgetPaletteProps {
  onAddWidget: (type: ChartType) => void;
}

export function WidgetPalette({ onAddWidget }: WidgetPaletteProps) {
  return (
    <section className="builder-panel" aria-labelledby="widget-palette-title">
      <div className="builder-panel__header">
        <p className="eyebrow">Palette</p>
        <h2 className="builder-panel__title" id="widget-palette-title">
          Add Widgets
        </h2>
      </div>

      <div className="palette-list">
        {PALETTE_ITEMS.map((item) => (
          <button
            className="palette-card"
            key={item.type}
            onClick={() => onAddWidget(item.type)}
            type="button"
          >
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

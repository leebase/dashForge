import type {
  ChartOptions,
  GaugeInlineData,
} from "../../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../../core/theme/themeRegistry";
import { compileGaugeChartOption } from "../../core/charts/chartCompiler";
import { EChartCanvas } from "./EChartCanvas";

interface GaugeChartProps {
  data: GaugeInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  title: string;
}

export function GaugeChart({ data, theme, options, title }: GaugeChartProps) {
  return (
    <div className="chart-card">
      <EChartCanvas
        option={compileGaugeChartOption({ data, theme, options })}
        title={title}
      />
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}

import type {
  ChartOptions,
  DonutInlineData,
} from "../../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../../core/theme/themeRegistry";
import { compileDonutChartOption } from "../../core/charts/chartCompiler";
import { EChartCanvas } from "./EChartCanvas";

interface DonutChartProps {
  data: DonutInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  title: string;
}

export function DonutChart({ data, theme, options, title }: DonutChartProps) {
  return (
    <div className="chart-card">
      <EChartCanvas option={compileDonutChartOption(data, theme, options)} title={title} />
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}

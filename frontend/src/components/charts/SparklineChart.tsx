import type {
  ChartOptions,
  SparklineInlineData,
} from "../../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../../core/theme/themeRegistry";
import { compileSparklineChartOption } from "../../core/charts/chartCompiler";
import { EChartCanvas } from "./EChartCanvas";

interface SparklineChartProps {
  data: SparklineInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  title: string;
}

export function SparklineChart({
  data,
  theme,
  options,
  title,
}: SparklineChartProps) {
  return (
    <div className="chart-card chart-card--sparkline">
      <EChartCanvas
        className="chart-shell chart-shell--sparkline"
        option={compileSparklineChartOption(data, theme, options)}
        title={title}
      />
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}

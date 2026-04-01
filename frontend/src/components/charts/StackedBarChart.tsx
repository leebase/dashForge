import type {
  AnnotationSpec,
  ChartOptions,
  StackedBarInlineData,
} from "../../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../../core/theme/themeRegistry";
import { compileStackedBarChartOption } from "../../core/charts/chartCompiler";
import { EChartCanvas } from "./EChartCanvas";

interface StackedBarChartProps {
  data: StackedBarInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  annotations?: AnnotationSpec[];
  title: string;
}

export function StackedBarChart({
  data,
  theme,
  options,
  annotations,
  title,
}: StackedBarChartProps) {
  return (
    <div className="chart-card">
      <EChartCanvas
        option={compileStackedBarChartOption(data, theme, options, annotations)}
        title={title}
      />
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}

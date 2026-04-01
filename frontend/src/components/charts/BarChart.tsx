import type {
  AnnotationSpec,
  BarInlineData,
  ChartOptions,
} from "../../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../../core/theme/themeRegistry";
import { compileBarChartOption } from "../../core/charts/chartCompiler";
import { EChartCanvas } from "./EChartCanvas";

interface BarChartProps {
  data: BarInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  annotations?: AnnotationSpec[];
  title: string;
}

export function BarChart({ data, theme, options, annotations, title }: BarChartProps) {
  return (
    <div className="chart-card">
      <EChartCanvas
        option={compileBarChartOption(data, theme, options, annotations)}
        title={title}
      />
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}

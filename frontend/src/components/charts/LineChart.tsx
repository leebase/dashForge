import type {
  AnnotationSpec,
  ChartOptions,
  LineInlineData,
} from "../../core/spec/dashboardSpec";
import type { ResolvedDashboardTheme } from "../../core/theme/themeRegistry";
import { compileLineChartOption } from "../../core/charts/chartCompiler";
import { EChartCanvas } from "./EChartCanvas";

interface LineChartProps {
  data: LineInlineData;
  theme: ResolvedDashboardTheme;
  options?: ChartOptions;
  annotations?: AnnotationSpec[];
  title: string;
}

export function LineChart({ data, theme, options, annotations, title }: LineChartProps) {
  return (
    <div className="chart-card">
      <EChartCanvas
        option={compileLineChartOption(data, theme, options, annotations)}
        title={title}
      />
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}

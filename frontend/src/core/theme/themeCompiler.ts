export interface ChartThemeSeed {
  palette: string[];
  surface: string;
  tooltipBackground: string;
  tooltipBorder: string;
  axis: string;
  gridLine: string;
  text: string;
  mutedText: string;
}

export interface CompiledChartTheme {
  palette: string[];
  surface: string;
  tooltipBackground: string;
  tooltipBorder: string;
  axis: string;
  gridLine: string;
  text: string;
  mutedText: string;
  accentSoft: string;
  border: string;
  good: string;
  warning: string;
  danger: string;
}

export interface CompileChartThemeInput {
  colorScheme: "light" | "dark";
  seed: ChartThemeSeed;
  tokens: Record<string, string>;
}

function resolveTooltipBackground(
  colorScheme: "light" | "dark",
  seed: ChartThemeSeed,
): string {
  return colorScheme === "dark"
    ? "rgba(237, 244, 250, 0.92)"
    : seed.tooltipBackground;
}

function resolveTooltipBorder(seed: ChartThemeSeed, tokens: Record<string, string>): string {
  return tokens["--df-accent-soft"] ?? seed.tooltipBorder;
}

export function compileChartTheme({
  colorScheme,
  seed,
  tokens,
}: CompileChartThemeInput): CompiledChartTheme {
  return {
    palette:
      typeof tokens["--df-accent"] === "string"
        ? [tokens["--df-accent"], ...seed.palette.slice(1)]
        : seed.palette,
    surface: tokens["--df-surface-strong"] ?? seed.surface,
    tooltipBackground: resolveTooltipBackground(colorScheme, seed),
    tooltipBorder: resolveTooltipBorder(seed, tokens),
    axis: tokens["--df-muted"] ?? seed.axis,
    gridLine: tokens["--df-chart-grid"] ?? seed.gridLine,
    text: tokens["--df-text"] ?? seed.text,
    mutedText: tokens["--df-muted"] ?? seed.mutedText,
    accentSoft: tokens["--df-accent-soft"] ?? "rgba(0, 0, 0, 0.08)",
    border: tokens["--df-border"] ?? "rgba(0, 0, 0, 0.08)",
    good: tokens["--df-good"] ?? "#1f7a4d",
    warning: tokens["--df-warning"] ?? "#b87517",
    danger: tokens["--df-danger"] ?? "#b4442f",
  };
}

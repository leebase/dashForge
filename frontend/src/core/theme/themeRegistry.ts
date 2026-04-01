import type { CSSProperties } from "react";

import {
  compileChartTheme,
  type ChartThemeSeed,
  type CompiledChartTheme,
} from "./themeCompiler";

export const DASHBOARD_THEME_IDS = [
  "light-professional",
  "dark-executive",
] as const;

export type DashboardThemeId = (typeof DASHBOARD_THEME_IDS)[number];
export type DashboardThemeTokens = Record<`--df-${string}`, string>;

export interface DashForgeThemeDefinition {
  id: DashboardThemeId;
  label: string;
  colorScheme: "light" | "dark";
  tokens: DashboardThemeTokens;
  chart: ChartThemeSeed;
}

export interface ResolvedDashboardTheme {
  definition: DashForgeThemeDefinition;
  tokens: Record<string, string>;
  cssVariables: CSSProperties;
  chart: CompiledChartTheme;
}

const themeRegistry: Record<DashboardThemeId, DashForgeThemeDefinition> = {
  "light-professional": {
    id: "light-professional",
    label: "Light Professional",
    colorScheme: "light",
    tokens: {
      "--df-color-scheme": "light",
      "--df-bg": "#f4efe7",
      "--df-surface": "rgba(255, 252, 246, 0.88)",
      "--df-surface-strong": "#fffdf9",
      "--df-border": "rgba(74, 54, 32, 0.12)",
      "--df-text": "#24190f",
      "--df-muted": "#6b5744",
      "--df-accent": "#a34b2a",
      "--df-accent-soft": "rgba(163, 75, 42, 0.14)",
      "--df-good": "#1f7a4d",
      "--df-warning": "#b87517",
      "--df-danger": "#b4442f",
      "--df-shadow": "0 24px 60px rgba(54, 36, 22, 0.14)",
      "--df-hero-wash": "rgba(217, 165, 110, 0.28)",
      "--df-chart-grid": "rgba(74, 54, 32, 0.08)",
      "--df-font-family":
        "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Palatino, serif",
    },
    chart: {
      palette: ["#a34b2a", "#1f7a4d", "#1d5d8f", "#b87517"],
      surface: "#fffdf9",
      tooltipBackground: "rgba(36, 25, 15, 0.92)",
      tooltipBorder: "rgba(163, 75, 42, 0.22)",
      axis: "#6b5744",
      gridLine: "rgba(74, 54, 32, 0.08)",
      text: "#24190f",
      mutedText: "#6b5744",
    },
  },
  "dark-executive": {
    id: "dark-executive",
    label: "Dark Executive",
    colorScheme: "dark",
    tokens: {
      "--df-color-scheme": "dark",
      "--df-bg": "#081520",
      "--df-surface": "rgba(9, 25, 37, 0.82)",
      "--df-surface-strong": "#102437",
      "--df-border": "rgba(151, 182, 204, 0.18)",
      "--df-text": "#edf4fa",
      "--df-muted": "#9cb1c3",
      "--df-accent": "#4fa3ff",
      "--df-accent-soft": "rgba(79, 163, 255, 0.16)",
      "--df-good": "#4fd7a6",
      "--df-warning": "#ffc661",
      "--df-danger": "#ff7e6b",
      "--df-shadow": "0 28px 72px rgba(2, 10, 18, 0.42)",
      "--df-hero-wash": "rgba(79, 163, 255, 0.24)",
      "--df-chart-grid": "rgba(156, 177, 195, 0.14)",
      "--df-font-family":
        "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Palatino, serif",
    },
    chart: {
      palette: ["#4fa3ff", "#4fd7a6", "#ffc661", "#ff7e6b"],
      surface: "#102437",
      tooltipBackground: "rgba(237, 244, 250, 0.92)",
      tooltipBorder: "rgba(79, 163, 255, 0.3)",
      axis: "#9cb1c3",
      gridLine: "rgba(156, 177, 195, 0.14)",
      text: "#edf4fa",
      mutedText: "#9cb1c3",
    },
  },
};

export function listDashboardThemes(): DashForgeThemeDefinition[] {
  return DASHBOARD_THEME_IDS.map((themeId) => themeRegistry[themeId]);
}

export function isKnownThemeId(themeId: string): themeId is DashboardThemeId {
  return DASHBOARD_THEME_IDS.includes(themeId as DashboardThemeId);
}

export function resolveDashboardTheme(theme: {
  id: string;
  overrides?: Record<string, string>;
}): ResolvedDashboardTheme {
  if (!isKnownThemeId(theme.id)) {
    throw new Error(`Unknown dashboard theme: ${theme.id}`);
  }

  const definition = themeRegistry[theme.id];
  const mergedTokens: Record<string, string> = {
    ...definition.tokens,
    ...theme.overrides,
  };

  return {
    definition,
    tokens: mergedTokens,
    cssVariables: mergedTokens,
    chart: compileChartTheme({
      colorScheme: definition.colorScheme,
      seed: definition.chart,
      tokens: mergedTokens,
    }),
  };
}

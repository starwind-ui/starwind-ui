import { assertChartId, colorVariable } from "./options";
import type { ChartConfig } from "./types";

// Starwind theme token names. A config key with one of these names writes only its chart color
// variable, so theme colors inside the chart stay unchanged.
const RESERVED_COLOR_KEY =
  /^(white|black|transparent|current|inherit|chart|background|foreground|card|popover|primary|secondary|muted|accent|info|success|warning|error|border|input|outline|sidebar)(-|$)/;

// Characters that could end the declaration, the rule or the style element, or start a comment
// that hides the rest of the rule.
const UNSAFE_COLOR = /[{};<>\\]|\/\*/;

function cssColor(key: string, color: string): string {
  if (typeof color !== "string" || UNSAFE_COLOR.test(color))
    throw new Error(`Invalid chart CSS color for "${key}".`);
  return color;
}

/**
 * CSS for a chart's config colors. Every key gets `--sw-chart-color-<key>`, and keys that do not
 * collide with Starwind theme tokens also get `--color-<key>`. Light rules apply under
 * `[data-chart="<id>"]` and dark rules under `.dark [data-chart="<id>"]`.
 */
export function chartStyle(id: string, config: ChartConfig): string {
  assertChartId(id);
  const rules = (mode: "light" | "dark") =>
    Object.entries(config)
      .map(([key, entry]) => {
        const variable = colorVariable(key);
        const raw = entry.theme?.[mode] ?? entry.color;
        if (raw === undefined || raw === "") return "";
        const color = cssColor(key, raw);
        return RESERVED_COLOR_KEY.test(key)
          ? `${variable}:${color}`
          : `${variable}:${color};--color-${key}:${color}`;
      })
      .filter(Boolean)
      .join(";");
  return `[data-chart="${id}"]{${rules("light")}}.dark [data-chart="${id}"]{${rules("dark")}}`;
}

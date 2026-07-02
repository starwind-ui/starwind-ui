import { tv } from "tailwind-variants";

// ChartConfig defined here (not in .astro frontmatter) to avoid esbuild parser issues with export type
export type ChartConfig = Record<string, { label?: string; icon?: string; color?: string }>;

export const chart = tv({
  base: "starwind-chart relative flex aspect-video flex-col justify-center text-xs",
});

export const chartTooltip = tv({
  base: "border-border bg-background pointer-events-none absolute z-50 hidden rounded-md border px-2.5 py-1.5 text-xs shadow-md",
});

export const chartLegend = tv({
  base: "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3",
});

---
"starwind": minor
---

`starwind add chart` now installs the Chart component at version 1.0.0. To copy the Chart Primitive source into your project, run `starwind primitives add chart`. Chart gives you shadcn-style `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend` and `ChartLegendContent` parts in Astro, React, Vue and Svelte, with a `ChartConfig` for series labels and colors. The command also installs `@tanstack/charts` and adds any missing chart color tokens to your CSS file. If it cannot edit that file, it prints the token block for you to paste.

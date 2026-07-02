---
"@starwind-ui/core": minor
---

feat(components): add chart component

A faithful, dependency-free Astro/SVG port of shadcn's chart system. Adds a
themeable `Chart` container (per-instance `--color-*` injection via `ChartConfig`),
a shared hover `ChartTooltip` and `ChartLegend`, `--chart-1..5` design tokens
(light + dark), and seven gallery families: `BarChart` (single/grouped/stacked/
horizontal/labelled), `LineChart` (linear/monotone/step, dots, labels),
`AreaChart` (gradient/linear/stacked), `PieChart` (pie/donut/center-text/labels/
pad-angle), `RadarChart` (polygon/circle grid, multiple series), `RadialChart`
(gauge/bars/stacked), and Tooltip examples. Bar, Line, and Area share pure-TS
`curves`, `scale`, and `uid` helpers. Pure vanilla JS for interactivity (WeakMap +
`astro:after-swap`/`starwind:init`), `role="img"`/`aria-label` on every chart, no
runtime dependencies.

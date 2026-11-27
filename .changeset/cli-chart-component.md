---
"starwind": minor
---

`starwind add chart` now installs the Chart component at version 1.0.0. To copy the Chart Primitive source into your project, run `starwind primitives add chart`. Chart gives you shadcn-style parts in Astro, React, Vue and Svelte. Put `ChartBar`, `ChartLine`, `ChartArea`, `ChartPie`, `ChartRadar` or `ChartRadialBar` inside `ChartContainer` with your data and a `ChartConfig` for series labels and colors. A radar chart also needs `ChartPolarAngleAxis` for its categories. Without `ChartXAxis`, a bar, line or area chart takes its categories from the first text or date field in your data and shows no x-axis labels. Other parts are optional: add `ChartXAxis`, `ChartYAxis`, `ChartGrid`, `ChartTooltip` and `ChartLegend` as you need them. The parts also take the props of common shadcn/ui examples, such as `label` for values on the bars, `ChartLinearGradient` for gradient fills, four corner radii for stacked bars, `stackOffset="expand"` and `cursor={false}`:

```astro
<ChartContainer config={chartConfig} data={chartData}>
  <ChartGrid vertical={false} />
  <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
  <ChartBar dataKey="desktop" radius={4} />
  <ChartLegend />
</ChartContainer>
```

For a chart that the parts cannot draw, pass a TanStack Charts chart module to the `chart` prop of `ChartContainer`. The command also installs `@tanstack/charts` and adds any missing chart color tokens to your CSS file. If it cannot edit that file, it prints the token block for you to paste.

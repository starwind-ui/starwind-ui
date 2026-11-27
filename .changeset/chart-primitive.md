---
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
---

Add the Chart Primitive at `@starwind-ui/<framework>/chart`. Put chart parts inside `Chart.Root` with your `data` and `config`: `Chart.Bar`, `Chart.Line`, `Chart.Area`, `Chart.Pie`, `Chart.Radar` and `Chart.RadialBar` draw the values, and `Chart.XAxis`, `Chart.YAxis`, `Chart.Grid`, `Chart.PolarGrid`, `Chart.PolarAngleAxis` and `Chart.Label` add axes, grid lines and center text. `Chart.LinearGradient` adds gradient fills. Compose the surface, tooltip and legend parts in the same root. The parts and props are the same in Astro, React, Vue and Svelte.

The parts take the props of common shadcn/ui examples, such as `label` on the mark parts in place of a nested `LabelList`, four corner radii on `Chart.Bar`, `stackOffset="expand"` on `Chart.Root` and `cursor={false}` on `Chart.Tooltip`. The legend lists only the series that the chart draws.

`tickFormatter`, `formatter` and `labelFormatter` take a `ChartFormat` object in every framework. React, Vue and Svelte also take functions. `{ configLabel: true }` shows the config label of a value. In Astro, functions cannot reach the browser, so use a format object or put the function in a chart module.

For a chart that the parts cannot draw, pass a chart module to the `chart` prop. Install `@tanstack/charts` in your app to write chart modules.

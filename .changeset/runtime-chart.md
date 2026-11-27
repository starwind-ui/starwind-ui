---
"@starwind-ui/runtime": minor
---

Add charts on the new `@starwind-ui/runtime/chart` subpath, built on TanStack Charts. Describe a bar, line, area, pie, radar or radial chart as plain data parts, such as a bar for each series, an x axis and a grid. The Runtime draws it and adds the Starwind tooltip, legend toggles, config colors from your theme tokens and server prerender. You do not need TanStack Charts code.

The parts take the common shadcn/ui chart props. Bar, line, area and pie parts take a `label` for values on the marks. A `linearGradient` part gives bars and areas a gradient fill. Bars take four corner radii, a chart can have more than one center `label`, and the polar grid takes fill, stroke and ring radii. `ChartSpec` also takes `stackOffset: "expand"` to stack to 100% and `cursor: false` to remove the hover band. The legend lists only the series that the chart draws.

Format axis ticks and tooltip values with a `ChartFormat` object, such as `{ maxLength: 3 }` or `{ number: { style: "currency", currency: "USD" } }`. A format object is plain data, so it also works in Astro. Dates format in UTC by default, so the server and the browser show the same text. `{ configLabel: true }` shows the config label of a value, as `chartConfig[value]?.label` does.

For a chart that the parts cannot draw, write a chart module with `defineChartModule` and native TanStack marks and scales.

Call `createChart(root, options?)` for a server-rendered or hand-written chart root. To draw from parts, pass them as a `ChartSpec` in `input.spec`, for example `{ parts: [{ kind: "xAxis", dataKey: "month" }, { kind: "bar", dataKey: "desktop" }] }`. The `xAxis` part is optional, as in Recharts. Without it, a bar, line or area chart takes its categories from the first text or `Date` field of the data and draws no x-axis labels. Chart code stays on its own subpath. `initStarwind` does not start charts, so pages without charts load no chart code.

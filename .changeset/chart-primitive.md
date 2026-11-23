---
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
---

Add the Chart Primitive at `@starwind-ui/<framework>/chart`. `Chart.Root` takes a chart module, `data` and a `config`. Compose the surface, tooltip and legend parts inside it. The parts are the same in Astro, React, Vue and Svelte. In Astro, tooltip formatters come from the chart module's `domPresentation`; the other frameworks also take them as props. Install `@tanstack/charts` in your app to write chart modules.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
---

Each package now includes Markdown docs that match its installed version. Open `node_modules/<package>/docs/README.md`, or point a coding agent at `docs/llms.txt` in the same folder.

Runtime docs cover `initStarwind`, raw HTML setup, theme helpers, and a page for every controller. The Astro, React, Vue, and Svelte docs have a page for every Primitive. Each page uses that framework's imports and syntax. Vue pages list `v-model` bindings and events, and Svelte pages list `bind:` props and callbacks. Callback rows show the full signature, for example `(value, details) => void`. The Field page lists the `Field.Control` props, and the Preview Card page lists the Trigger delay props. Component behavior and the public API are unchanged.

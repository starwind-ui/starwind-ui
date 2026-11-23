---
"@starwind-ui/runtime": minor
---

Add charts on the new `@starwind-ui/runtime/chart` subpath, built on TanStack Charts. A chart module draws with native TanStack marks and scales. The Runtime adds the Starwind tooltip, legend toggles, config colors from your theme tokens and server prerender.

Call `createChart(root, options?)` for a server-rendered or hand-written chart root. Chart code stays on its own subpath. `initStarwind` does not start charts, so pages without charts load no TanStack code.

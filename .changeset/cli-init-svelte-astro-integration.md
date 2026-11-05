---
"starwind": minor
---

`starwind init --framework svelte` in an Astro project now installs and configures `@astrojs/svelte` for you. Before, it stopped and asked you to set up the integration first. The CLI picks the `@astrojs/svelte` version that matches Astro 5, 6, or 7, and adds `svelte` if the project does not have it.

On Astro 5, `@astrojs/svelte` needs TypeScript in the `^5` range. If your project uses another TypeScript version, `init` stops and tells you to change TypeScript, upgrade Astro, or configure the integration yourself.

`init` no longer requires `src/layouts/Layout.astro` or `src/layouts/BaseLayout.astro` for Svelte in Astro. Without a named layout, it connects the stylesheet through a page, or tells you which import to add by hand.

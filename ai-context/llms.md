# Starwind UI

> Starwind UI provides Astro-first, framework-portable, accessible UI components with Starwind/shadcn-style ergonomics.

## Public release

Use the stable `latest` channel for Astro, React, Vue 3.5, and Svelte 5.

```bash
npx starwind@latest init --framework astro
npx starwind@latest init --framework react
npx starwind@latest init --framework vue
npx starwind@latest init --framework svelte
npx starwind@latest add button
```

Vue supports Vite Vue, Astro Vue, Nuxt 3/4, Laravel with Inertia Vue, and Quasar Vite SPA/SSR
hosts. Vue components use idiomatic models and matching `update:*` events. Svelte supports Vite with
Svelte, SvelteKit, and Astro with Svelte. Starwind Pro setup works with every framework.

## Choose a usage surface

- Styled components: Use the `starwind` CLI. It copies Tailwind-styled framework source into the application.
- Primitive adapters: Install `@starwind-ui/astro`, `@starwind-ui/react`, `@starwind-ui/vue`, or
  `@starwind-ui/svelte`, or vendor Primitive source with
  `starwind primitives add`.
- Runtime: Install `@starwind-ui/runtime` for framework-neutral DOM controllers or raw HTML integration.

Runtime owns shared behavior, state, events, focus, forms, overlays, and cleanup. Framework adapters render normal framework markup and connect it to Runtime. Styled components remain application-owned source.

## CLI essentials

- `starwind init`: Configure an Astro, React, supported Vue, or supported Svelte project.
- `starwind add <name>`: Add styled components.
- `starwind update <name>`: Update installed components.
- `starwind remove <name>`: Remove installed components.
- `starwind migrate`: Move a legacy Astro project to Runtime-backed components.
- `starwind docs <name>` and `starwind search <query>`: Find component guidance.
- `starwind primitives add|update|list`: Manage vendored Primitive adapter source.

Combobox is its own styled and Primitive install target. Use `starwind add combobox` or `starwind primitives add combobox`.

## Package surfaces

- `@starwind-ui/runtime`: Framework-neutral DOM controllers.
- `@starwind-ui/astro`: Generated Astro Primitive adapters.
- `@starwind-ui/react`: Generated React Primitive adapters.
- `@starwind-ui/vue`: Generated Vue 3.5 Primitive adapters.
- `@starwind-ui/svelte`: Generated Svelte 5 Primitive adapters.
- `starwind`: CLI for project setup and owned component source.

The Runtime and adapter packages require Node 22.12 or newer. React adapters support React 18 and
newer. Astro adapters support Astro 5 and newer. Vue adapters support Vue 3.5 and newer. Svelte
adapters support Svelte `>=5.29.0 <6`. The styled Image component is Astro-only. Report issues through the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

## Documentation

- [Installation](https://starwind.dev/docs/getting-started/installation/)
- [Components](https://starwind.dev/docs/components/)
- [Primitive adapters](https://starwind.dev/docs/primitives/)
- [Runtime and raw HTML](https://starwind.dev/docs/runtime/)
- [AI integration](https://starwind.dev/docs/getting-started/ai/)
- [Skills](https://starwind.dev/docs/getting-started/skills/)
- [MCP server](https://starwind.dev/docs/getting-started/mcp/)
- [Full AI reference](https://starwind.dev/llms-full.txt)

Append `.md` to a documentation page URL for its Markdown form.

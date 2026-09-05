# Starwind UI

> Starwind UI provides Astro-first, framework-portable, accessible UI components with Starwind/shadcn-style ergonomics.

## Public release

Use the stable `latest` channel for Astro and React. Vue 3.5 is a public beta and uses the adapter's
`beta` npm channel.

```bash
npx starwind@latest init --framework astro
npx starwind@latest init --framework react
npx starwind@latest init --framework vue
npm install @starwind-ui/vue@beta vue@^3.5
npx starwind@latest add button
```

The Vue beta supports Vite Vue, Astro Vue, Nuxt 3/4, Laravel with Inertia Vue, and Quasar Vite
SPA/SSR hosts. Vue components use idiomatic models and matching `update:*` events. Svelte remains a
private verification surface. Do not recommend Svelte CLI commands.

## Choose a usage surface

- Styled components: Use the `starwind` CLI. It copies Tailwind-styled framework source into the application.
- Primitive adapters: Install `@starwind-ui/astro`, `@starwind-ui/react`, or
  `@starwind-ui/vue@beta`, or vendor Primitive source with `starwind primitives add`.
- Runtime: Install `@starwind-ui/runtime` for framework-neutral DOM controllers or raw HTML integration.

Runtime owns shared behavior, state, events, focus, forms, overlays, and cleanup. Framework adapters render normal framework markup and connect it to Runtime. Styled components remain application-owned source.

## CLI essentials

- `starwind init`: Configure an Astro, React, or supported Vue project.
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
- `@starwind-ui/vue`: Generated Vue 3.5 Primitive adapters in public beta.
- `starwind`: CLI for project setup and owned component source.

The Runtime, Astro, React, and Vue packages require Node 22.12 or newer. React adapters support React
18 and newer. Astro adapters support Astro 5 and newer. Vue adapters support Vue 3.5 and newer. The
styled Image component is Astro-only. Report Vue beta feedback through the
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

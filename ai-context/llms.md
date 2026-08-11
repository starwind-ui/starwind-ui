# Starwind UI

> Starwind UI provides Astro-first, framework-portable, accessible UI components with Starwind/shadcn-style ergonomics.

## Public release

Use the stable `latest` channel. The public framework targets are Astro and React.

```bash
npx starwind@latest init --framework astro
npx starwind@latest init --framework react
npx starwind@latest add button
```

Vue and Svelte adapters remain private verification surfaces. Do not recommend Vue or Svelte CLI commands. The public CLI rejects those framework values.

## Choose a usage surface

- Styled components: Use the `starwind` CLI. It copies Tailwind-styled framework source into the application.
- Primitive adapters: Install `@starwind-ui/astro` or `@starwind-ui/react`, or vendor Primitive source with `starwind primitives add`.
- Runtime: Install `@starwind-ui/runtime` for framework-neutral DOM controllers or raw HTML integration.

Runtime owns shared behavior, state, events, focus, forms, overlays, and cleanup. Framework adapters render normal framework markup and connect it to Runtime. Styled components remain application-owned source.

## CLI essentials

- `starwind init`: Configure an Astro or React project.
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
- `starwind`: CLI for project setup and owned component source.

The Runtime, Astro, and React packages require Node 22.12 or newer. React adapters support React 18 and newer. Astro adapters support Astro 5 and newer. The styled Image component is Astro-only.

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

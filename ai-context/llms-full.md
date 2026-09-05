# Starwind UI Full AI Reference

> Starwind UI is an Astro-first, framework-portable component system. It combines application-owned styled source, generated Primitive adapters, and a framework-neutral DOM Runtime.

## Current public support

The stable release supports Astro and React. Use `starwind@latest` in CLI commands. Vue 3.5 is a
public beta, and its adapter uses the `beta` npm channel.

The Vue beta supports Vite Vue, Astro Vue, Nuxt 3/4, Laravel with Inertia Vue, and Quasar Vite
SPA/SSR hosts. Svelte remains a private adapter verification surface. Do not generate instructions
that use `--framework svelte`.

Astro remains the product center. React uses the same Runtime behavior foundation. The styled Image component is Astro-only because it wraps `astro:assets`.

## Architecture

Starwind has three public layers:

1. Runtime controllers own cross-framework behavior, state, browser events, focus, forms, overlays, timers, and cleanup.
2. Primitive adapters expose unstyled framework parts that connect framework props, refs, events, and markup to Runtime.
3. Styled components add public component composition, Tailwind classes, variants, icons, defaults, and slots. The CLI copies this source into the application.

Use `data-sw-*` attributes for Runtime behavior and discovery. Use `data-slot` for public part identity. Runtime-backed components do not require legacy `starwind-*` class hooks.

## Install with the CLI

Astro:

```bash
npx starwind@latest init --framework astro
npx starwind@latest add button dialog form
```

React:

```bash
npx starwind@latest init --framework react
npx starwind@latest add button dialog form
```

Vue 3.5 beta:

```bash
npm install @starwind-ui/vue@beta vue@^3.5
npx starwind@latest init --framework vue
npx starwind@latest add button dialog form
```

Omit `--framework` to choose an available framework interactively.

The main commands are:

- `starwind init`: Create Starwind configuration and install compatible package dependencies.
- `starwind add [components...]`: Copy styled components into the project.
- `starwind update [components...]`: Update installed component source. Use `--dry-run`, `--diff`, or `--view` to inspect changes.
- `starwind remove [components...]`: Remove installed component source.
- `starwind migrate`: Migrate a legacy Astro project to the Runtime-backed layout.
- `starwind docs [components...]`: Open or return component documentation.
- `starwind search [query]`: Search styled components and Starwind Pro blocks. Add `--primitives` for Primitive source.
- `starwind setup`: Configure Starwind Pro in an initialized project.
- `starwind primitives add|update|list`: Manage vendored Primitive adapter source.

Combobox is a current first-class install target:

```bash
npx starwind@latest add combobox
npx starwind@latest primitives add combobox
```

## Install package surfaces directly

Applications normally install an adapter, which brings the compatible Runtime version:

```bash
npm install @starwind-ui/astro@latest
npm install @starwind-ui/react@latest
npm install @starwind-ui/vue@beta vue@^3.5
```

Framework authors and raw HTML integrations can install Runtime directly:

```bash
npm install @starwind-ui/runtime@latest
```

Runtime controllers use component subpaths:

```ts
import { createSelect } from "@starwind-ui/runtime/select";

const instance = createSelect(root);
instance.destroy();
```

Raw HTML discovery can initialize at a document or application root:

```ts
import { initStarwind } from "@starwind-ui/runtime/init-starwind";

const runtime = initStarwind(document);
runtime.destroy();
```

Astro Primitive adapters use package subpaths:

```astro
---
import Button from "@starwind-ui/astro/button";
---

<Button.Root type="button">Save</Button.Root>
```

React Primitive adapters use the same family subpaths:

```tsx
import Button from "@starwind-ui/react/button";

export function SaveButton() {
  return <Button.Root type="button">Save</Button.Root>;
}
```

Vue Primitive adapters use the same family subpaths and idiomatic models and events:

```vue
<script setup lang="ts">
import { ref } from "vue";
import Collapsible from "@starwind-ui/vue/collapsible";

const open = ref(false);
</script>

<template>
  <Collapsible.Root v-model:open="open">
    <Collapsible.Trigger>Details</Collapsible.Trigger>
    <Collapsible.Panel>Portable Runtime content</Collapsible.Panel>
  </Collapsible.Root>
</template>
```

Named models emit matching `update:*` events. Detailed changes use normal Vue event listeners.

## Behavior guidance

Keep native HTML form participation. Runtime-backed controls use normal `FormData` and share accessible label, description, error, validity, and disabled-state behavior.

Preserve Runtime-managed focus, keyboard, dismissal, portal, and cleanup behavior when you customize copied styled components. Keep `data-sw-*` discovery hooks and public `data-slot` identities.

Dynamic collections support items added, removed, disabled, or reordered after initialization.
Overlay components share consistent focus, dismissal, nesting, and lifecycle behavior across Astro,
React, and the Vue beta.

## Ownership and customization

Styled component files live in the application after the CLI adds them. Users can edit Tailwind classes, variants, wrapper markup, and composition. Package dependencies retain shared behavior and framework lifecycle code.

Primitive packages are appropriate when a project needs unstyled parts. Vendored Primitive source is available when direct adapter ownership is required. Runtime is appropriate for adapter authors and raw DOM integrations.

## Compatibility

- Node: 22.12 or newer.
- Tailwind CSS: version 4 for current styled components.
- Astro adapters: Astro 5 or newer.
- React adapters: React and React DOM 18 or newer.
- Vue adapters: Vue 3.5 or newer, in public beta.
- Public framework choices: stable Astro and React, plus the Vue 3.5 beta.

The Styled Image component remains Astro-only because it wraps `astro:assets`. Report Vue beta
feedback through the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

## Documentation and AI surfaces

- [Getting started](https://starwind.dev/docs/getting-started/)
- [Installation](https://starwind.dev/docs/getting-started/installation/)
- [Astro](https://starwind.dev/docs/frameworks/astro/)
- [Vite React](https://starwind.dev/docs/frameworks/vite-react/)
- [Next.js](https://starwind.dev/docs/frameworks/nextjs/)
- [TanStack Start](https://starwind.dev/docs/frameworks/tanstack-start/)
- [React Router](https://starwind.dev/docs/frameworks/react-router/)
- [Components](https://starwind.dev/docs/components/)
- [Primitive adapters](https://starwind.dev/docs/primitives/)
- [Runtime and raw HTML](https://starwind.dev/docs/runtime/)
- [Theming](https://starwind.dev/docs/getting-started/theming/)
- [AI integration](https://starwind.dev/docs/getting-started/ai/)
- [Skills](https://starwind.dev/docs/getting-started/skills/)
- [MCP server](https://starwind.dev/docs/getting-started/mcp/)
- [Structured AI manifest](https://starwind.dev/ai-manifest.json)

Append `.md` to a documentation page URL for its Markdown form. Use the live `llms.txt`, `llms-full.txt`, Markdown pages, or AI manifest when exact component APIs matter.

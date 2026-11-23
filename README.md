<p align="center">
  <img alt="Starwind UI" src="https://shieldcn.dev/header/gradient.svg?title=Starwind+UI&amp;mode=dark&amp;theme=blue" />
</p>

<p align="center">
  <a href="https://github.com/starwind-ui/starwind-ui"><img alt="npm + stars" src="https://shieldcn.dev/group/npm/starwind+github/stars/starwind-ui/starwind-ui.svg" /></a>
  <!-- <a href="https://www.npmjs.com/package/starwind"><img alt="badge" src="https://shieldcn.dev/npm/starwind.svg" /></a>
  <a href="https://github.com/starwind-ui/starwind-ui"><img alt="badge" src="https://shieldcn.dev/github/starwind-ui/starwind-ui/stars.svg" /></a> -->
  <a href="https://www.npmjs.com/package/starwind"><img alt="downloads" src="https://shieldcn.dev/npm/dm/starwind.svg" /></a>
  <a href="https://x.com/boston343builds"><img alt="follow" src="https://shieldcn.dev/x/follow/boston343builds.svg?split=true" /></a>
</p>

**Astro-first, framework-portable UI components you can own.**

Starwind UI gives you accessible, Tailwind CSS components with Starwind/shadcn-style ergonomics,
backed by a portable Runtime that powers Astro, React, Vue 3.5, and Svelte 5 adapters today.

**[Explore Components](https://starwind.dev/docs/components/)**

## Why Starwind?

- **🎯 Own Your Code** — Styled components live in your project, where you can understand and customize them.
- **✨ Animated by Default** — Smooth, polished animations out of the box with Tailwind CSS v4.
- **♿ Accessible** — Keyboard navigable and screen reader friendly. Built with a11y in mind.
- **🚀 Portable Runtime** — Shared DOM behavior with generated Astro, React, Vue 3.5, and Svelte 5 adapters.
- **🛠️ CLI-Powered** — Add only what you need with a simple `npx starwind add` command.

> Looking for the main package? See [starwind-ui/cli](/packages/cli/README.md).

## Get Started

Initialize an Astro or React project:

```bash
npx starwind@latest init
```

Then add the components you need:

```bash
npx starwind@latest add
```

### Vue 3.5

Use Starwind in Vite Vue, Astro Vue, Nuxt 3 or 4, Laravel with Inertia Vue, or Quasar Vite SPA/SSR
projects:

```bash
npx starwind@latest init --framework vue
```

Vue adapters use idiomatic `v-model` arguments, matching `update:*` events, and normal detailed
event listeners. The Styled Image component remains Astro-only. Report issues in the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

### Svelte 5

Use Starwind in Vite with Svelte, SvelteKit, or Astro with Svelte:

```bash
npx starwind@latest init --framework svelte
```

Vue and Svelte provide the same 37 Primitive families and 55 portable Styled components as the
other first-party adapters. The Styled Image component remains Astro-only. Starwind Pro setup works
with Svelte.

## Runtime Architecture

Starwind components use a framework adapter backed by the shared, framework-neutral Runtime.

```mermaid
flowchart TD
  App["Your application"]
  Components["Starwind components you own<br/>Tailwind CSS + framework markup"]
  Adapter["Framework adapter<br/>Astro, React, Vue 3.5, or Svelte 5"]
  Runtime["Starwind Runtime<br/>shared accessible behavior"]
  Browser["Browser APIs and the DOM"]

  App --> Components
  Components --> Adapter
  Adapter --> Runtime
  Runtime --> Browser
```

See [Portable Runtime](docs/portable-runtime/README.md) for the current implementation details.

## AI integration

Resources for AI:

- [Starwind Skills](https://starwind.dev/docs/getting-started/skills/)
- [MCP server](https://starwind.dev/docs/getting-started/mcp/)
- [llms.txt](https://starwind.dev/llms.txt)
- [llms-full.txt](https://starwind.dev/llms-full.txt)

## Contributing

Please read the [contributing guide](/CONTRIBUTING.md).

## License

Licensed under the [MIT license](/LICENSE).

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
backed by a portable Runtime that powers Astro and React adapters today.

**[Explore Components](https://starwind.dev/docs/components/)**

## Why Starwind?

- **🎯 Own Your Code** — Styled components live in your project, where you can understand and customize them.
- **✨ Animated by Default** — Smooth, polished animations out of the box with Tailwind CSS v4.
- **♿ Accessible** — Keyboard navigable and screen reader friendly. Built with a11y in mind.
- **🚀 Portable Runtime** — Shared DOM behavior with generated Astro and React adapters.
- **🛠️ CLI-Powered** — Add only what you need with a simple `npx starwind add` command.

> Looking for the main package? See [starwind-ui/cli](/packages/cli/README.md).

## Runtime Beta — Astro and React

The portable Runtime is currently available through the `beta` channel for Astro and React:

```bash
npx starwind@beta init
```

## Stable — Astro

Initialize an Astro project with the current stable release:

```bash
npx starwind@latest init
```

Then select components to add:

```bash
npx starwind@latest add
```

## Runtime Architecture

Starwind components use a framework adapter backed by the shared, framework-neutral Runtime.

```mermaid
flowchart TD
  App["Your application"]
  Components["Starwind components you own<br/>Tailwind CSS + framework markup"]
  Adapter["Framework adapter<br/>Astro or React"]
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

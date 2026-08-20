<p align="center">
  <img alt="Starwind UI" src="https://shieldcn.dev/header/gradient.svg?title=Starwind+UI&amp;mode=dark&amp;theme=blue" />
</p>

<p align="center">
  <a href="https://github.com/starwind-ui/starwind-ui"><img alt="npm + stars" src="https://shieldcn.dev/group/npm/starwind+github/stars/starwind-ui/starwind-ui.svg" /></a>
  <a href="https://www.npmjs.com/package/starwind"><img alt="downloads" src="https://shieldcn.dev/npm/dm/starwind.svg" /></a>
  <a href="https://x.com/boston343builds"><img alt="follow" src="https://shieldcn.dev/x/follow/boston343builds.svg?split=true" /></a>
</p>

**Astro-first, framework-portable UI components you can own.**

Starwind UI gives you accessible, Tailwind CSS components with Starwind/shadcn-style ergonomics,
backed by a portable Runtime that powers Astro and React adapters today.

The Starwind CLI is the main way to get started. Initialize a project, add only the components you
need, and keep the resulting source in your own codebase.

**[Get Started →](https://starwind.dev/docs/getting-started/installation/)** &nbsp;|&nbsp;
**[Explore Components](https://starwind.dev/docs/components/)**

## Why Starwind?

- **🎯 Own Your Code** — Components are added to your project so you can customize and extend them.
- **🌌 Astro First** — A first-class Astro experience with React support from the same behavior foundation.
- **♿ Accessible** — Keyboard, focus, form, and screen reader behavior are built into the Runtime-backed components.
- **🚀 Portable Runtime** — Shared DOM behavior powers generated Astro and React adapters.
- **🛠️ CLI-Powered** — Initialize projects and add only what you need with a simple command-line workflow.

## Quick Start

Initialize an Astro project and add a component:

```bash
npx starwind@latest init --framework astro
npx starwind@latest add button
```

For React projects, use `--framework react`:

```bash
npx starwind@latest init --framework react
npx starwind@latest add button
```

You can omit the framework flag to select it interactively.

## What the CLI can do

### Add components

```bash
npx starwind@latest add button dialog
```

Run `add` without component names to browse the available components. The CLI installs required
dependencies and records the installed components in your Starwind configuration.

### Update and remove components

```bash
npx starwind@latest update --all --dry-run
npx starwind@latest remove button
```

Use `--dry-run`, `--diff`, and `--view` to inspect updates before changing files.

An update can have source delivery or behavior delivery. Source delivery writes the latest canonical
component files. Behavior delivery installs required packages and records the latest component
version without writing component files, so local component changes remain in place. The CLI stores
only the delivered `version` in `starwind.config.json`; it does not need a `sourceVersion` field.

Old or third-party registry entries that omit `sourceVersion` use their `version` as the source
version. They retain the established source-update behavior. A behavior update that needs packages
completes after package installation. If required package installation is declined, the CLI keeps the
recorded component version unchanged.

### Find components and documentation

```bash
npx starwind@latest search button
npx starwind@latest docs button
```

Search can also discover primitive source with `--primitives` and emit JSON with `--json`.

### Migrate legacy projects

```bash
npx starwind@latest migrate
```

This moves legacy Starwind projects to the current Runtime setup.

### Work with primitive source

Primitive source is available through the advanced `primitives add`, `primitives update`, and
`primitives list` commands when you need direct control over framework adapter source.

### Starwind Pro

Use `npx starwind@latest setup` to configure Starwind Pro before adding Pro components or blocks.

## AI integration

Resources for AI:

- [Starwind Skills](https://starwind.dev/docs/getting-started/skills/)
- [MCP server](https://starwind.dev/docs/getting-started/mcp/)
- [llms.txt](https://starwind.dev/llms.txt)
- [llms-full.txt](https://starwind.dev/llms-full.txt)

## Documentation

Read the [Starwind documentation](https://starwind.dev/docs/).

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

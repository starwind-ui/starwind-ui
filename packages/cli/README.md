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

**[Get Started →](https://beta.starwind.dev/docs/getting-started/installation/)** &nbsp;|&nbsp;
**[Explore Components](https://beta.starwind.dev/docs/components/)**

## Why Starwind?

- **🎯 Own Your Code** — Components are added to your project so you can customize and extend them.
- **🌌 Astro First** — A first-class Astro experience with React support from the same behavior foundation.
- **♿ Accessible** — Keyboard, focus, form, and screen reader behavior are built into the Runtime-backed components.
- **🚀 Portable Runtime** — Shared DOM behavior powers generated Astro and React adapters.
- **🛠️ CLI-Powered** — Initialize projects and add only what you need with a simple command-line workflow.

## Quick Start

Initialize an Astro project and add a component:

```bash
npx starwind@beta init --framework astro
npx starwind@beta add button
```

For React projects, use `--framework react`:

```bash
npx starwind@beta init --framework react
npx starwind@beta add button
```

You can omit the framework flag to select it interactively.

## What the CLI can do

### Add components

```bash
npx starwind@beta add button dialog
```

Run `add` without component names to browse the available components. The CLI installs required
dependencies and records the installed components in your Starwind configuration.

### Update and remove components

```bash
npx starwind@beta update --all --dry-run
npx starwind@beta remove button
```

Use `--dry-run`, `--diff`, and `--view` to inspect updates before changing files.

### Find components and documentation

```bash
npx starwind@beta search button
npx starwind@beta docs button
```

Search can also discover primitive source with `--primitives` and emit JSON with `--json`.

### Migrate legacy projects

```bash
npx starwind@beta migrate
```

This moves legacy Starwind projects to the current Runtime setup.

### Work with primitive source

Primitive source is available through the advanced `primitives add`, `primitives update`, and
`primitives list` commands when you need direct control over framework adapter source.

### Starwind Pro

Use `npx starwind@beta setup` to configure Starwind Pro before adding Pro components or blocks.

## AI integration

Resources for AI:

- [Starwind Skills](https://beta.starwind.dev/docs/getting-started/skills/)
- [MCP server](https://beta.starwind.dev/docs/getting-started/mcp/)
- [llms.txt](https://beta.starwind.dev/llms.txt)
- [llms-full.txt](https://beta.starwind.dev/llms-full.txt)

## Documentation

Read the [Starwind documentation](https://beta.starwind.dev/docs/).

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

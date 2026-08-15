# `@starwind-ui/runtime`

Framework-neutral DOM controllers for Starwind UI behavior. Runtime owns state, events, focus,
forms, overlays, timers, and cleanup while framework adapters render normal HTML and connect it to
that behavior.

Starwind UI v3 ships 55 source-owned styled components for Astro and React. Its lower-level Astro
and React Primitive adapters share this Runtime. The Runtime can also power raw HTML integrations
when the developer supplies the markup.

## For application projects

Most Astro and React application developers should start with the CLI to install styled components
as editable source:

```bash
npx starwind@latest init --framework astro
# or
npx starwind@latest init --framework react
```

Install a first-party Primitive adapter when you need the lower-level component layer. Each adapter
brings in the compatible Runtime version:

```bash
npm install @starwind-ui/astro@latest
# or
npm install @starwind-ui/react@latest
```

Then use the adapter package to render your framework components.

## For framework and component authors

Install Runtime directly when you are building an adapter, a custom component, or a raw HTML
integration:

```bash
npm install @starwind-ui/runtime@latest
```

Runtime exposes per-component controller factories from subpaths:

```ts
import { createSelect } from "@starwind-ui/runtime/select";

const instance = createSelect(root);
// Later, when the root leaves the document:
instance.destroy();
```

For normal HTML that uses Starwind discovery attributes, initialize the Runtime once at the
document or application root:

```ts
import { initStarwind } from "@starwind-ui/runtime/init-starwind";

const cleanup = initStarwind(document);
cleanup.destroy();
```

## What Runtime provides

- Framework-neutral DOM behavior and state.
- Accessible focus, event, form, overlay, and lifecycle behavior.
- Component subpath exports such as `select`, `dialog`, `form`, and `theme`.
- A foundation shared by the generated Astro and React adapters.

Use `@starwind-ui/astro` or `@starwind-ui/react` when you need framework Primitive components.

## Compatibility

The package requires Node 22.12 or newer.

## Starwind UI ecosystem

- [Website](https://starwind.dev/)
- [Installation](https://starwind.dev/docs/getting-started/installation/)
- [Styled components](https://starwind.dev/docs/components/)
- [Migration guide](https://starwind.dev/docs/getting-started/migration/)
- [GitHub repository](https://github.com/starwind-ui/starwind-ui)
- [Issue tracker](https://github.com/starwind-ui/starwind-ui/issues)

Coding agents can use [Starwind Skills](https://starwind.dev/docs/getting-started/skills/) and the
optional [MCP server](https://starwind.dev/docs/getting-started/mcp/) for framework-aware
installation, documentation, and migration guidance.

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

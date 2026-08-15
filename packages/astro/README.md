# `@starwind-ui/astro`

This package contains generated Astro Primitive adapters for Starwind UI. It provides the
lower-level accessible behavior and framework-native markup layer through the shared
framework-neutral Runtime.

Starwind UI v3 ships 55 source-owned styled components for Astro and React. Developers install
these styled components as editable application source with the Starwind CLI. The Astro and React
Primitive adapters share the Runtime, which can also power raw HTML integrations with
developer-supplied markup.

The package is source-published and supports Astro 5 or newer.

## Start with the CLI

For ready-to-use styled components, initialize the project and add components with the Starwind
CLI:

```bash
npx starwind@latest init --framework astro
npx starwind@latest add button
```

The CLI installs styled components as source in your application.

## Install the Primitive adapters

Install this package directly when you need to build with the lower-level Primitive parts:

```bash
npm install @starwind-ui/astro@latest
```

## Use an adapter

```astro
---
import Button from "@starwind-ui/astro/button";
---

<Button.Root type="button">Save</Button.Root>
```

Adapters render normal Astro markup and initialize their Runtime controllers with Astro lifecycle
events, including client navigation cleanup.

## Theme initialization

Add `ThemeInitScript` from `@starwind-ui/astro/theme` to the document head to apply the stored theme
before the first paint:

```astro
---
import { ThemeInitScript } from "@starwind-ui/astro/theme";
---

<head>
  <ThemeInitScript />
</head>
```

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

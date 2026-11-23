# `@starwind-ui/svelte`

This package contains the generated Svelte 5 Primitive adapters for Starwind UI. It provides the
lower-level accessible behavior and framework-native component layer through the shared
framework-neutral Runtime.

Starwind UI ships 55 source-owned styled components for Svelte. Developers install these styled
components as editable application source with the Starwind CLI. The Svelte Primitive adapters use
the same Runtime as the Astro, React, and Vue adapters.

The package supports Svelte 5.29 and newer versions before Svelte 6. It is stable and follows SemVer.
It shares one version with `@starwind-ui/runtime` and the other first-party adapters.

## Start with the CLI

For ready-to-use styled components, initialize the project and add components with the Starwind
CLI:

```bash
npx starwind@latest init --framework svelte
npx starwind@latest add button
```

The CLI installs styled components as source in your application. It supports Vite with Svelte,
SvelteKit, and Astro with Svelte.

## Install the Primitive adapters

Install this package directly when you need to build with the lower-level Primitive parts:

```bash
npm install @starwind-ui/svelte "svelte@>=5.29.0 <6"
```

## Use an adapter

```svelte
<script lang="ts">
  import Button from "@starwind-ui/svelte/button";
</script>

<Button.Root type="button">Save</Button.Root>
```

Adapters connect Svelte component lifecycles to the shared Runtime and clean up their controllers
when they unmount. Component state works with Svelte `bind:` props such as `bind:open` and
`bind:value`.

The package ships Svelte components with type declarations. Svelte remains a peer dependency, and
each release pins its tested `@starwind-ui/runtime` version.

## Theme initialization

Use `getThemeInitScript` from `@starwind-ui/svelte/theme` to apply the stored theme before the first
paint. The [dark mode guide](https://starwind.dev/docs/getting-started/dark-mode/) shows the setup
for Vite, SvelteKit, and Astro projects.

## Feedback

Report Svelte issues through the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

## Installed documentation

The package includes Markdown docs for its exact version. After you install it, open
`node_modules/@starwind-ui/svelte/docs/README.md`. Coding agents can start from
`node_modules/@starwind-ui/svelte/docs/llms.txt`. Each Primitive has a reference page with its
parts, props, bindings, callbacks, and data attributes.

## Starwind UI ecosystem

- [Website](https://starwind.dev/)
- [Installation](https://starwind.dev/docs/getting-started/installation/)
- [Styled components](https://starwind.dev/docs/components/)
- [Primitives](https://starwind.dev/docs/primitives/)
- [GitHub repository](https://github.com/starwind-ui/starwind-ui)
- [Issue tracker](https://github.com/starwind-ui/starwind-ui/issues)

Coding agents can use [Starwind Skills](https://starwind.dev/docs/getting-started/skills/) and the
optional [MCP server](https://starwind.dev/docs/getting-started/mcp/) for framework-aware
installation, documentation, and migration guidance.

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

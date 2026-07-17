# `@starwind-ui/runtime`

Framework-neutral DOM controllers for Starwind UI behavior. Runtime owns state, events, focus,
forms, overlays, timers, and cleanup while framework adapters render normal HTML and connect it to
that behavior.

## For application projects

Install a first-party adapter for Astro or React. The adapter brings in the compatible Runtime
version:

```bash
npm install @starwind-ui/astro@beta
# or
npm install @starwind-ui/react@beta
```

Then use the adapter package to render your framework components.

## For framework and component authors

Install Runtime directly when you are building an adapter, a custom component, or a raw HTML
integration:

```bash
npm install @starwind-ui/runtime@beta
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

Runtime does not provide framework markup, Tailwind styles, or custom elements. Use
`@starwind-ui/astro` or `@starwind-ui/react` when you need framework components.

## Compatibility

The package requires Node 22.12 or newer.

## Documentation

Read the [installation guide](https://beta.starwind.dev/docs/getting-started/installation/) and
[component documentation](https://beta.starwind.dev/docs/components/).

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

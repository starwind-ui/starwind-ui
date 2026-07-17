# `@starwind-ui/astro`

Generated Astro primitive adapters for Starwind UI Runtime. They give Astro projects accessible
behavior and framework-native markup while leaving the component styling and composition in your
hands.

The package is source-published and supports Astro 5 or newer.

## Install

```bash
npm install @starwind-ui/astro@beta
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

## Start with the CLI

For ready-to-use styled Starwind components, initialize the project and add components with the
Starwind CLI:

```bash
npx starwind@beta init --framework astro
npx starwind@beta add button
```

The adapter package brings in the compatible Runtime version for normal application use.

## Documentation

Read the [Astro installation guide](https://beta.starwind.dev/docs/getting-started/installation/)
and [component documentation](https://beta.starwind.dev/docs/components/).

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

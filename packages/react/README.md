# `@starwind-ui/react`

Generated React primitive adapters for Starwind UI Runtime. They give React projects accessible
behavior and framework-native components while leaving styling and composition in your hands.

The package supports React and React DOM 18 or newer.

## Install

```bash
npm install @starwind-ui/react@latest
```

## Use an adapter

```tsx
import Button from "@starwind-ui/react/button";

export function SaveButton() {
  return <Button.Root type="button">Save</Button.Root>;
}
```

Adapters connect React component lifecycles to the shared Runtime and clean up their controllers
when they unmount or their behavior options change.

## Theme initialization

Use `ThemeInitScript` in a server-rendered document head, or use `getThemeInitScript` in a Vite
integration, to apply the stored theme before the first paint. The Starwind CLI configures this for
supported Vite React, Next.js, TanStack Start, and React Router projects.

## Start with the CLI

For ready-to-use styled Starwind components, initialize the project and add components with the
Starwind CLI:

```bash
npx starwind@latest init --framework react
npx starwind@latest add button
```

The adapter package brings in the compatible Runtime version for normal application use.

## Documentation

Read the [React installation guide](https://starwind.dev/docs/getting-started/installation/)
and [component documentation](https://starwind.dev/docs/components/).

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

# `@starwind-ui/react`

Generated React primitive adapters for Starwind UI Runtime. They give React projects accessible
behavior and framework-native components while leaving styling and composition in your hands.

The package supports React and React DOM 18 or newer.

## Install

```bash
npm install @starwind-ui/react@beta
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

Use `getThemeInitScript` from `@starwind-ui/react/theme` in your document-head or Vite integration
to apply the stored theme before the first paint. The Starwind CLI configures this for supported
Vite React projects.

## Start with the CLI

For ready-to-use styled Starwind components, initialize the project and add components with the
Starwind CLI:

```bash
npx starwind@beta init --framework react
npx starwind@beta add button
```

The adapter package brings in the compatible Runtime version for normal application use.

## Documentation

Read the [React installation guide](https://beta.starwind.dev/docs/getting-started/installation/)
and [component documentation](https://beta.starwind.dev/docs/components/).

## Contributing

Please read the [contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).

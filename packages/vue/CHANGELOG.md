# @starwind-ui/vue

## 0.1.2

### Patch Changes

- Preserve connected Combobox state when native form reset is canceled or superseded by later input or value work. Reconcile React and Vue controlled values after reset, restore React text after Escape, and restore Vue input text when a native input proposal is canceled.
- Share document observation across mounted Vue portals to reduce duplicate mutation tracking. Preserve live target changes and disabled placement, and disconnect the observer when its final portal unsubscribes. Vendored Vue primitives receive the same helper update.
- Preserve the accepted Tooltip and Preview Card trigger when Vue recreates their controllers, so open Tooltip and Hover Card content stays anchored during supported updates. Restore the current open state silently and honor newer parent commands during reconnection.
- Updated dependencies
  - @starwind-ui/runtime@1.3.0

## 0.1.1

### Patch Changes

- Deliver Runtime-backed group naming and Tabs indicator geometry corrections through the first-party adapters and bundled registry. The Vue package remains on its beta release channel.
- Remove obsolete private-release warnings from generated Vue adapters and normalize the resulting blank line in vendored Primitive indexes.
- Updated dependencies
  - @starwind-ui/runtime@1.2.1

## 0.1.0

### Minor Changes

- Publish the initial Vue 3.5 adapter beta.

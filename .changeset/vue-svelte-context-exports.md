---
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
"starwind": patch
---

Vue and Svelte no longer export internal context keys and members that only the Primitive parts use. The public API now matches React.

Vue:

- `DialogContext`, `AlertDialogContext` and `DrawerContext` are removed.
- `SelectContextValue` no longer has `element`, `mounted`, `requestRefresh()` or `registerPortal()`.
- `ComboboxContextValue` no longer has `element`, `mounted` or `registerPortal()`.
- `TabsContextValue` no longer has `refresh()`.

Svelte:

- `CheckboxGroupContext` and `CheckboxGroupContextValue` are removed from `@starwind-ui/svelte/checkbox` and from `@starwind-ui/svelte`. Use the checkbox group components to group checkboxes.
- `SelectContextValue` no longer has `mounted`, `registerTrigger()` or `registerPortal()`.

The state fields stay, for example `open`, `value` and `disabled`. If your code imports a removed key or calls a removed member, delete that code. The parts get these values from their Root.

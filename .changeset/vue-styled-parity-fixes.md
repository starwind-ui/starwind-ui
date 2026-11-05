---
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed several Vue components so that they match React:

- A Boolean prop that you leave out of a Styled component no longer becomes `false`. The default of the underlying component applies instead.
- `v-model` now works on Textarea, Native Select, and Input Group Textarea. It waits until IME composition ends, as native `v-model` does.
- Textarea and Input Group Textarea keep a `v-model` value after a form reset, and they accept `default-value`. With both `v-model` and `default-value`, a reset puts the default into the field and the model, as in Svelte.
- `Close` parts and `Select.Trigger` with `asChild` now accept a component as the child.
- Styled `ComboboxTrigger` and `ComboboxClear` with `asChild` accept a child.
- Styled `TooltipTrigger` with text now renders a working trigger.
- Tooltip now opens on a native link or span. Collapsible link triggers no longer get `disabled="false"`.
- Color Picker with `formats` and no `format` now starts on the first listed format. Before, the format selector was blank.
- Navigation Menu now moves keyboard focus into its content when you use `v-model`.
- Styled `SelectTrigger` renders `data-size`, and `FieldSeparator` renders `data-content`.
- `SidebarMenuButton` with `tooltip` keeps `data-slot="sidebar-menu-button"`.
- `CarouselNext`, `CarouselPrevious`, and `SidebarRail` keep your `aria-label`.
- `Combobox.Icon` now has `aria-hidden`.

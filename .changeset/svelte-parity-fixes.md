---
"@starwind-ui/svelte": patch
"starwind": patch
---

Fixed several Svelte components so that they match React and Vue:

- Tooltip now opens on a native link or span.
- `Combobox.Root` now renders option attributes such as `data-modal` and `data-filter-mode`, and its first render shows the open state.
- The Primitive `Combobox.Clear` no longer adds an English `aria-label`. Set your own label.
- Textarea and Input Group Textarea now keep your value after a form reset. Before, the field went blank and `bind:value` received `""`. A Textarea with `defaultValue` still resets to that default.
- Color Picker with `formats` and no `format` now starts on the first listed format. Before, it added a HEX option to the list.
- The Scroll Area viewport no longer adds `!important` to its `overflow` style, so your own `style="overflow: hidden !important"` on the viewport now applies.
- `Menu.Item` and `Menu.LinkItem` render `data-close-on-click` only when you change the default. If your CSS or tests read `data-close-on-click="true"` on a default `Menu.Item`, update them.

---
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Primitive parts now print the same attributes in Astro, React, Vue and Svelte. If your CSS or tests select these attributes, check the changes below.

- A `data-default-*` attribute now shows only the `default*` prop that the part got when it mounted. It no longer follows the current value. For example, a Toggle with both `pressed` and `defaultPressed` now prints `data-default-pressed` in Astro, React and Vue, and Menu checkbox and radio items keep their first marker after the user changes them.
- In Svelte, Popover, Menu, Context Menu, Select and Combobox take these attributes from their `default*` props, and they leave out `data-open-on-hover` and `data-close-on-click` when the value is `false`.
- In Vue and Svelte, Menu prints `data-open-on-hover="true"` in place of an empty value. A presence selector such as `[data-open-on-hover]` still matches.
- In Svelte, the server HTML of Navigation Menu, Select and Combobox now matches the other frameworks. Navigation Menu Root prints `data-default-value`. An enabled Select Trigger leaves out `aria-disabled` until it mounts. A disabled Combobox Trigger and Clear print `aria-disabled="true"`, and the Combobox Trigger prints `data-state`.
- In Svelte, Field parts no longer print a default `data-slot`. If your selectors use it, pass `data-slot` to the part. `Form.Root` prints its validation timing attributes only when you set the matching props.
- In Svelte, Avatar `onLoadingStatusChange` now runs before listeners on ancestor elements, as in the other frameworks.

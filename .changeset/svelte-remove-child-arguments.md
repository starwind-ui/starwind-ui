---
"@starwind-ui/svelte": minor
"starwind": patch
---

Removed the snippet arguments that only Svelte passed to child content. These snippets now receive no arguments:

- `children` on the Navigation Menu, Slider, Tabs, and Accordion roots.
- `children` on `Tabs.Tab` and `Tabs.Panel`, which received `active`.
- `children` on `Select.Value`, which received `label` and `value`.
- `children` on the Styled `NavigationMenu` and `SelectValue`.

If you read the root value from a snippet argument, use `bind:value` on the root instead.

If you read `active` in a Tab or Panel snippet, style with the `data-state="active"` attribute, or compare the Tabs `bind:value` with the item value.

If you read `label` or `value` in a `Select.Value` snippet, use `bind:value` on the Select root and find the label from that value. Leave `Select.Value` empty to show the selected label.

Update copied Styled `NavigationMenu.svelte` and `SelectValue.svelte` files with `starwind update navigation-menu select`. The old files pass the removed arguments.

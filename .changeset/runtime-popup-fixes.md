---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Combobox, Select, Menu (Styled Dropdown) and Context Menu now close when you press Tab right after the click that opened them. Before, a fast Tab after the click moved focus out of the popup, but the popup stayed open.

In React and Vue, a Navigation Menu with a `defaultValue` no longer opens again after the user closes it and a prop on its Root changes.

In a Menu or Context Menu radio group with no `value` or `defaultValue`, an explicit `aria-checked` on a radio item now decides its first state. Before, an item with `aria-checked="false"` and `defaultChecked` could take the group value from a later checked item.

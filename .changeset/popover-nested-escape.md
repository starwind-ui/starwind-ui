---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Escape in a Select or Combobox inside a Popover now closes only that inner list. Before, when focus was on the inner trigger or input, the same Escape also closed the Popover. In React, Vue, and Svelte, this closed the whole Color Picker popup when you pressed Escape on its open format list. Press Escape again to close the Popover.

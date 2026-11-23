---
"@starwind-ui/vue": patch
"starwind": patch
---

Vue Combobox now shows the item label in the input when the parent sets a value after the first render, with `v-model` or a one-way `value` prop. Before, the input stayed empty.

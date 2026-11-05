---
"@starwind-ui/vue": minor
"starwind": patch
---

Removed the undocumented `open`, `close`, `updatePosition`, `getValue`, and `setValue` methods from the template refs of the Vue Menu, Context Menu, Select, Combobox, and Navigation Menu roots. These refs now expose only `element`.

If you call one of these methods through a template ref, use `v-model` on the root instead. For example, put `v-model:open="open"` on the root and change `menu.value.open()` to `open.value = true`.

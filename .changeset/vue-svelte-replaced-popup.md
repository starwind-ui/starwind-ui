---
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Fixed Tooltip and Hover Card in Vue and Svelte staying hidden when their popup is replaced while open, for example when the `key` on the content changes.

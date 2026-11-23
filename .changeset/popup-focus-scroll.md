---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
---

Popover, Navigation Menu, and Combobox now return focus to the trigger or input without scrolling the page. Before, in Safari, closing one of them after you scrolled could make the page jump back to the trigger. Combobox does this when it closes with Escape or an item press.

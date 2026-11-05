---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Popover, Navigation Menu, and non-modal Dialog no longer take focus back when you have moved on. Before, if you moved to another control while the popup was closing, focus jumped back to the old trigger when the closing animation ended. This also closed a Combobox that you had just opened. Focus now goes back to the trigger only when it is still inside the popup or no control has focus.

Popover also keeps focus on a field that you press outside the popup. Before, focus went to the Popover trigger when the closing animation ended.

Pressing the trigger of an open Select in Safari now closes the list. Before, the list closed and opened again.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Escape on a submenu trigger now closes only the open submenu in Menu, Dropdown, and Context Menu. Before, when you opened a submenu with the pointer and pressed Escape, the whole menu closed. Focus now stays on the submenu trigger. Press Escape again to close the menu.

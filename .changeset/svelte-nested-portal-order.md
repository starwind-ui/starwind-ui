---
"@starwind-ui/svelte": patch
"starwind": patch
---

Fixed nested overlays in Svelte dialogs appearing behind their parent or failing to receive clicks. Child overlays now stay above the overlay that opened them.

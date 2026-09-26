---
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Correct Vue and Svelte nested overlay placement by removing implicit floating-host markers from ordinary portal wrappers. Default destinations now follow the shared portal policy used by Astro and React. Color Picker roots and native Dialog floating hosts remain supported.

Nested portals outside Dialog can now share the document body instead of nesting inside a parent portal wrapper. Applications that require that containment for custom CSS or DOM queries can pass `data-floating-root` explicitly to the intended host or select a portal container.

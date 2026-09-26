---
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Fixed nested overlays in Vue and Svelte, including Select menus appearing behind a Color Picker.

Nested overlays can now render directly under the document body. If your custom CSS selectors or DOM queries depend on an overlay staying inside its parent, set a portal container or add `data-floating-root` to the element that should contain it. Overlays inside Dialog still use its floating container.

---
"@starwind-ui/vue": patch
"starwind": patch
---

Reduced background work on Vue pages with multiple menus, tooltips, or other components that use portals. These components now share the work of watching for changes to the page.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Reduced background work on React pages with multiple menus, tooltips, or other components that use portals. These components now share the work of watching for changes to the page.

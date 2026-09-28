---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Reduced repeated DOM observation in React pages with multiple portaled components, such as menus and tooltips. Portals now share one observer, which reduces the work needed to track changes to the page.

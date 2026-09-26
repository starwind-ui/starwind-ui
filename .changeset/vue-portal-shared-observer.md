---
"@starwind-ui/vue": patch
"starwind": patch
---

Reduced repeated DOM observation in Vue pages with multiple portaled components, such as menus and tooltips. Portals now share one observer, which reduces the work needed to track changes to the page.

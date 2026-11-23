---
"@starwind-ui/svelte": minor
"starwind": patch
---

The Svelte `SidebarContextValue` type no longer has `isMobile` or `setMobileOpen()`. It now has the same members as the React type.

If you called `setMobileOpen()`, use `bind:mobileOpen` on `SidebarProvider` to open or close the mobile sidebar.

If you read `isMobile`, use your own media query to know if the viewport is mobile, such as `matchMedia()` with the query you pass to `mobileQuery`.

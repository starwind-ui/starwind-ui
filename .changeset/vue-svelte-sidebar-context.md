---
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
"starwind": patch
---

In Vue and Svelte, `useSidebarContext()` now returns `null` outside a `SidebarProvider`, as in React. Before, it threw an error. `Sidebar`, `SidebarTrigger`, `SidebarRail`, and `SidebarMenuButton` now render outside a Provider in the expanded state, with `aria-expanded="false"` on the trigger and rail.

If you call `useSidebarContext()`, check for `null` before you read its fields.

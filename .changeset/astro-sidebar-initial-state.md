---
"@starwind-ui/astro": patch
"starwind": patch
---

Fixed the Astro Sidebar opening for a moment when its `SidebarProvider` starts collapsed. With `defaultOpen={false}`, the page first showed the full sidebar and then animated it closed, so the page content moved. The Sidebar now renders collapsed in the server HTML. The first paint is correct and the content stays in place. This also applies to `collapsible="offcanvas"`.

The Astro Sidebar and SidebarProvider no longer render the same attribute twice, such as two `data-state` attributes on the Sidebar.

If one page has several `SidebarProvider` components with different `defaultOpen` values, a Sidebar can still show expanded until the page script starts. Render the Sidebar inside its `SidebarProvider` slot. A Sidebar that you render before its provider, for example with `Astro.slots.render`, can show the wrong state until the page script starts.

A state saved with `persistOpen` is still applied when the page script starts. To show the saved state on first paint, read the cookie in an on-demand rendered page and pass it to `defaultOpen`:

```astro
---
const savedOpen = Astro.cookies.get("starwind-sidebar-open")?.value;
---

<SidebarProvider defaultOpen={savedOpen !== "false"} persistOpen persistenceStorage="cookie">
  <!-- Sidebar and page content -->
</SidebarProvider>
```

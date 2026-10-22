---
"@starwind-ui/astro": patch
"starwind": patch
---

In Astro, a Sidebar that starts collapsed no longer opens for a moment when the page loads. Before, a `SidebarProvider` with `defaultOpen={false}` showed the full sidebar first and then animated it closed, so the page content moved. Now the Sidebar is collapsed from the first paint, and the content stays in place. This also works with `collapsible="offcanvas"`.

The Astro Sidebar and SidebarProvider no longer put the same attribute on an element two times. For example, the Sidebar had two `data-state` attributes.

Render the Sidebar inside its `SidebarProvider` slot. If you render it before the provider, for example with `Astro.slots.render`, it can show the wrong state until the page script runs.

If one page has more than one `SidebarProvider` with different `defaultOpen` values, a Sidebar can still show open until the page script runs.

A state that `persistOpen` saved still loads when the page script runs. To show the saved state on first paint, read the cookie on the server in a page that renders on demand, and pass it to `defaultOpen`:

```astro
---
const savedOpen = Astro.cookies.get("starwind-sidebar-open")?.value;
---

<SidebarProvider defaultOpen={savedOpen !== "false"} persistOpen persistenceStorage="cookie">
  <!-- Sidebar and page content -->
</SidebarProvider>
```

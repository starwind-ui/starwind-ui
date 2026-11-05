---
"@starwind-ui/svelte": minor
"starwind": patch
---

Removed Svelte APIs that no other framework has:

- Select no longer exports `show`, `close`, or `updatePosition`.
- The `children` snippet on Alert Dialog, Collapsible, Context Menu, Dialog, Drawer, Menu, Popover, Hover Card, and Tooltip roots no longer receives `open`.
- Primitive `Sidebar.MenuButton` no longer takes `href`.
- Navigation Menu `Popup` no longer takes `side` or `align`.

If you use one of these, update your code. Use `bind:open` or `bind:value` in place of the Select methods and the snippet `open` argument. Use the `child` snippet to render a link from `Sidebar.MenuButton`. Styled `SidebarMenuButton` keeps `href`. Move `side` and `align` to Navigation Menu `Positioner`.

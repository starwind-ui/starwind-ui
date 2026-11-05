---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

React `Select` and `Combobox` now show the selected label when your own component renders the items. Before, a `Select` pick went back to the placeholder, and a `Combobox` value from a parent or from `defaultValue` showed no text.

To find a label, a closed list renders its items once, hidden, and removes them before the browser paints. Effects in your item component run during that render. This happens once for each value, and only when the root's own `children` do not show the item. If your items load later, a value has no label until someone opens the list and picks an item.

React `Combobox` also keeps `data-value` on the root when a parent changes the value while the list is closed. Before, the attribute went away after the first use of the Combobox.

---
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed Vue controls so that they match React:

- `CollapsibleTrigger` with a bare `disabled` attribute is now disabled.
- A disabled `PreviewCardTrigger` no longer runs your click listener.
- With `asChild`, the Trigger and Close parts of Dialog, Alert Dialog, and Drawer, and `Select.Trigger`, now accept a child wrapped in one fragment or next to an empty `v-if`. Other `asChild` parts already accepted this.

Tooltip, Menu, Navigation Menu, Popover, Combobox, Collapsible, Preview Card, and Sidebar now use the same `asChild` child handling. Their public API is unchanged. An invalid `asChild` child in these parts now gives one shorter error message.

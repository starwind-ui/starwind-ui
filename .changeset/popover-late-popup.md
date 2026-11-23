---
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed Popover in React and Vue when the Popup mounts after the Root. Before, the trigger did not open it. A Popup that you hide and show again, or replace with a new `key`, also opens again.

An open Popup that unmounts now leaves the Root closed and removes the scroll lock. When it mounts again, it opens without a change event.

In React, a standalone `defaultOpen` Popover with no Portal no longer throws when it mounts.

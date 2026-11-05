---
"@starwind-ui/svelte": minor
"starwind": patch
---

Svelte Tooltip, Popover, and Navigation Menu triggers now accept a link in `child`. These triggers already worked on a link, but they warned in development, type checks rejected the link, and `ref` did not run. Now the warning is gone and `ref` receives the link. Use the new `TriggerChildPayload` type for your snippet. Snippets typed with `ButtonChildPayload` keep working.

Svelte `Menu.Trigger`, `Select.Trigger`, `Combobox.Trigger`, and `Combobox.Clear` still need a button in `child`. With another element, these controls do nothing. They now log a console error in production as well as in development, so you can find the cause.

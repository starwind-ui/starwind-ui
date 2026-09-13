---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"starwind": patch
---

Add an optional trigger to the Tooltip and Preview Card Runtime `setOpen` methods so callers can restore an open overlay at a connected trigger owned by its root. React preserves the accepted trigger when its controller is recreated, which keeps Tooltip and Hover Card content anchored during supported updates. Canceled changes preserve the accepted anchor, and silent restoration preserves event behavior. Tooltip also clears pending opens when disabled and restores trigger interaction when enabled again.

---
"@starwind-ui/vue": patch
---

Preserve the accepted Tooltip and Preview Card trigger when Vue recreates their controllers, so open Tooltip and Hover Card content stays anchored during supported updates. Restore the current open state silently and honor newer parent commands during reconnection.

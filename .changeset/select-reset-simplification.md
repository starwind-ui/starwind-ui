---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

React Select keeps its current selection when a form reset is canceled. A pending reset also preserves any newer value set by the user or app.

Keep Select in the same form until a pending reset finishes. Moving it to another form during that reset is outside the supported behavior.

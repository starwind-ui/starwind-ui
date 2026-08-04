---
"starwind": patch
---

Correct styled Hover Card, Popover, and Tooltip Trigger composition so composed children no longer
receive the Trigger's native recipe or display classes. Native Trigger rendering remains unchanged.

Migration: if a composed child relied on those native Trigger classes for its appearance, style the
child directly instead.

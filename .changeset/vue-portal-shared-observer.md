---
"@starwind-ui/vue": patch
"starwind": patch
---

Share document observation across mounted Vue portals to reduce duplicate mutation tracking. Preserve live target changes and disabled placement, and disconnect the observer when its final portal unsubscribes. Vendored Vue primitives receive the same helper update.

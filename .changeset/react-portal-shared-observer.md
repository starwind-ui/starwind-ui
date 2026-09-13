---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Share React portal document observation across mounted portal instances. This reduces mutation-record work when mounting many floating components while preserving target changes, hydration, and cleanup. Vendored React primitives receive the same helper update.

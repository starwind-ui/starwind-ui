---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Simplify React Select reset settlement and timer cleanup. Remove special handling for changing form ownership during a pending reset while preserving ordinary form binding, canceled resets, newer value changes, and unmount cleanup. Deliver the updated React Select source through the CLI registry.

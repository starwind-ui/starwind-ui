---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
---

Restore the previous active Toast manager when a newer manager is destroyed so global toast calls
continue to route through a mounted provider.

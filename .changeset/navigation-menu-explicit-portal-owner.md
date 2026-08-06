---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
---

Keep Navigation Menu positioners inside a connected explicit floating root that already owns the
portal, while preserving trigger-derived dialog ownership, nested dialog roots, and body fallback.

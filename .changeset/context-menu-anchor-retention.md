---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Keep an open Context Menu at its invocation point when its Runtime controller is recreated for the same root element. Preserve the last document-coordinate rectangle while removing the retired anchor and interaction work. This also retains the point for an imperative opening after same-element reuse; the next activation replaces it, and a fresh root starts at zero.

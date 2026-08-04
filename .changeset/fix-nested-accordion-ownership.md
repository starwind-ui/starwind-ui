---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Keep nested Accordion roots independent by limiting Runtime item discovery, part rendering, and
delegated trigger interactions to the controller that owns their nearest Accordion root.

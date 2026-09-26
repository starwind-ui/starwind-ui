---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
"starwind": patch
---

Support Tabs panel entrance and exit motion through `data-starting-style` and `data-ending-style`. Outgoing panels become inert immediately and stay visible until their finite CSS motion completes. Preserve Runtime visibility through framework renders and keep existing panel state retention.

Update the enabled keyboard entry tab after external selection while preserving keyboard position when focus is inside the tablist.

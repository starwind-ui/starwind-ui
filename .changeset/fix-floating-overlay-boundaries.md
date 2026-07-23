---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Dismiss floating overlays when pointer interactions occur in unrelated composition-root space while
preserving interactions with nested portaled overlays. This corrects Color Picker Popover dismissal
in both Astro and React and applies the same explicit boundary behavior to other floating controls.

---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"starwind": patch
---

Fixed component state getting out of sync with app updates, form resets, and initial input values. This includes opening and closing overlays from code and keeping Tabs selection in sync.

Avatar now handles changes to its image and fallback elements. Dialog recognizes controls added after it opens, and Vue toasts use the correct spacing.

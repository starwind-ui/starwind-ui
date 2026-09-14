---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Prevent immediate Toast updates and resolved promises from skipping entry motion or using an incorrect stack height. Track queued entry frames for the current toast element and cancel them when the toast closes or its manager is destroyed.

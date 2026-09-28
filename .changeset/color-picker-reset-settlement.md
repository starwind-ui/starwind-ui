---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed Color Picker form resets in React and Vue. Canceling a reset now keeps the selected color and format, and a pending reset no longer overwrites a newer selection or slider change.

For custom Runtime integrations, the new `stateSync` subscription lets you update your UI after a form reset finishes without firing a user-change event.

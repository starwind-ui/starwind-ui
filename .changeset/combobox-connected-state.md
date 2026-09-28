---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed Combobox values and input text after form resets. Canceling a reset keeps the current value, and a pending reset no longer overwrites newer input.

In React, pressing Escape restores the expected input text. In Vue, canceling an input change restores the previous text.

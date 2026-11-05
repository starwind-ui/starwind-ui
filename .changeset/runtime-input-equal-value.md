---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed Input writing an unchanged value back into the field. In some browsers this moved the caret or ended an IME composition.

Vue Input now keeps the caret during a normal edit, puts the old text back when the parent refuses a change, and follows a `v-model` that starts as `undefined`.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Simplified React Select form-reset handling and timer cleanup. Canceled resets keep the current selection, and pending resets cannot overwrite a newer value.

Moving a Select to another form while a reset is pending no longer has special handling. Keep it attached to the same form until that reset finishes.

---
"@starwind-ui/svelte": patch
"starwind": patch
---

Svelte Input no longer clears the text that the user typed when the parent changes another prop, such as `class` or `disabled`. This happened when the Input had no `value` prop or used `bind:value`. `Field.Control` gets the same fix.

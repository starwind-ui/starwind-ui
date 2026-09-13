---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"starwind": patch
---

Preserve connected Combobox state when native form reset is canceled or superseded by later input or value work. Reconcile React and Vue controlled values after reset, restore React text after Escape, and restore Vue input text when a native input proposal is canceled.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"starwind": patch
---

Fixed a blank Select trigger in Astro and Vue when `Select.Value` has its own content and no `placeholder`. For example, `<Select.Value>Astro</Select.Value>` now shows "Astro" until a value is chosen, and shows it again when the value clears. React already did this. This also works when the Select starts with a value and clears later.

Fixed React Select showing the placeholder after a parent refused a pick. The trigger now keeps the label of the parent value, as it does in Vue and Svelte.

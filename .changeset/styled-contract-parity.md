---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Scroll Area supports `autoViewport` in every framework, with the existing automatic viewport as the default. Color Picker channel sliders share a `step` prop, and submenu triggers share an optional icon slot.

Fixed Svelte Color Picker popup styling and interaction inside native dialogs. Color Picker controls stay inside their root so changes reach the picker. Custom portal targets for those controls must remain inside that root. Popover wrappers now preserve the `data-slot` supplied by a component that uses them.

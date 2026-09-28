---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Scroll Area now supports `autoViewport` in every framework. It defaults to `true`; set it to `false` to supply your own viewport and content parts. Color Picker channel sliders support `step` to set the amount each keyboard action changes the value. Menu and Context Menu submenu triggers accept an optional icon slot.

Fixed Svelte Color Picker popup styling and clicks inside native dialogs.

Keep custom portal targets for Color Picker controls inside the picker root so input changes reach the picker.

Popover now preserves the `data-slot` set by components such as Color Picker, so their styles continue to apply.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Color Picker in a popup now stays open when you press Escape to cancel an edit. Before, if you typed in the value input or a channel input and then pressed Escape, the input went back to the current color and the popup also closed. Now the first Escape only restores the input, and focus stays in it. Press Escape again to close the popup.

An inline Color Picker inside a Dialog no longer blocks Escape. Before, pressing Escape in its value input or a channel input kept the Dialog open even with nothing to cancel. Now Escape closes the Dialog when the input holds no edit.

---
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Slider, Input OTP, and Color Picker now show a value that the parent sets after the first render. This applies when `value` starts as `undefined` and gets a value later. Before, React and Vue ignored that value. An in-range value does not fire a change callback, a change event, or a model update. If the Runtime corrects the value, for example a Slider value above `max`, Vue `v-model` and Svelte `bind:value` receive the corrected value, so your state matches what the user sees.

After that late value, a one-way parent that renders again with the same old value no longer undoes the user's last change. This also fixes Svelte Slider, where a later render undid a key press.

Svelte Color Picker now compares colors by value. A new color object with the same color, for example from `parseColor()` on each render, no longer resets the picker.

Vue Slider no longer sends an old value to `v-model` after the parent sets a new one.

React Input OTP with a parent-held `value` now goes back to the parent value when the parent refuses a change. Before, the refused text stayed in the input and in form data.

---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Keep the styled Color Picker area usable in constrained viewports by preserving a minimum height,
choosing the best fitting Popover side before sizing, and scrolling content when neither side fits.
Expose the compatible Popover collision strategy through generated Astro and React Primitive
adapters, and continue the styled Color Picker registry version from its legacy release history.

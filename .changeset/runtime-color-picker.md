---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
---

Add the Runtime-backed Color Picker controller and generated Astro and React Primitive adapters,
including popup positioning, format controls, channel inputs, swatches, keyboard interaction, and
form integration. Preserve interaction-derived HSB saturation at zero brightness so captured area
dragging stays aligned at black and restores color when brightness rises, and keep Clear hidden and
disabled until the root explicitly allows empty values.

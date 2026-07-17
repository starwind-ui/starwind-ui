---
"@starwind-ui/runtime": patch
"starwind": minor
---

Add installable styled Color Picker components to the Astro and React CLI registries, including
stable bottom/start Popover placement, fade-only exit motion, shared Input styling, thin channel
tracks, swatch-only trigger composition, and all required component dependencies.
Popover collision handling also keeps floating content from shifting across and covering its trigger.
When vertical space is constrained, the Color Picker uses Popover's measured available height and
scrolls its own content instead of overlapping the trigger or escaping the viewport.
Polish the generator-canonical Astro and React composition with endpoint-safe framed areas and
sliders, compact size-aware controls, an icon-only EyeDropper action, composite value swatches, and
footer separators and Clear actions that reflect actual Runtime eligibility.

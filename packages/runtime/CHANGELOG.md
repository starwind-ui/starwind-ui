# @starwind-ui/runtime

## 0.1.0-beta.3

### Patch Changes

- Prevent Styled Progress indicators from animating across incompatible determinate and indeterminate
  geometries while preserving normal determinate value transitions and reduced-motion behavior.
- Keep Color Picker editing controls usable after clearing an optional value by retaining the last color as their editing baseline.

## 0.1.0-beta.2

### Minor Changes

- Narrow Button Runtime to opted-in focusable-disabled native buttons, synchronize mutable disabled
  state through generated Astro and React adapters, and refresh vendored Primitive artifacts and
  documentation for the native-only boundary.
- Add the Runtime-backed Color Picker controller and generated Astro and React Primitive adapters,
  including popup positioning, format controls, channel inputs, swatches, keyboard interaction, and
  form integration. Preserve interaction-derived HSB saturation at zero brightness so captured area
  dragging stays aligned at black and restores color when brightness rises, and keep Clear hidden and
  disabled until the root explicitly allows empty values.

### Patch Changes

- Default Accordions to collapsible while preserving `collapsible={false}` as the required-open override.
- Add installable styled Color Picker components to the Astro and React CLI registries, including
  stable bottom/start Popover placement, fade-only exit motion, shared Input styling, thin channel
  tracks, swatch-only trigger composition, and all required component dependencies.
  Popover collision handling also keeps floating content from shifting across and covering its trigger.
  When vertical space is constrained, the Color Picker uses Popover's measured available height and
  scrolls its own content instead of overlapping the trigger or escaping the viewport.
  Polish the generator-canonical Astro and React composition with endpoint-safe framed areas and
  sliders, compact size-aware controls, an icon-only EyeDropper action, composite value swatches, and
  footer separators and Clear actions that reflect actual Runtime eligibility.
  Migrate legacy Color Picker installations to the Runtime-backed styled component and migrate their
  Select dependency normally instead of retaining the obsolete compatibility bridge.
- Present Dialog-family popups with coherent open visual state so Dialog and Sheet entry animations play completely for quick and held trigger releases.

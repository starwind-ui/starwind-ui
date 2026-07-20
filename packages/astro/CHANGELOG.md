# @starwind-ui/astro

## 0.1.0-beta.3

### Patch Changes

- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.3

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
- Present Dialog-family popups with coherent open visual state so Dialog and Sheet entry animations play completely for quick and held trigger releases.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.2

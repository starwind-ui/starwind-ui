# @starwind-ui/runtime

## 0.1.0-beta.4

### Minor Changes

- Replace additive Form validation timing with before- and after-submit policies, add the imperative
  validation, visibility, reset, and external-error APIs, and refresh generated adapters and vendored
  Primitive artifacts.

  For the beta migration, both the previous `input` timing and the previous committed-only meaning of
  `change` map to semantic `change`, which runs for every accepted value revision. Committed-only
  validation timing is no longer available. Defaults remain validation on `submit`, revalidation on
  `change`, and error visibility on `submit`; after the first submission attempt,
  `revalidationTiming` replaces `validationTiming` instead of being additive.

### Patch Changes

- Keep Avatar images eligible for native lazy loading while the Runtime conceals their loading and
  error states, including Astro images rendered from imported assets.
- Keep dialog-owned floating layers visible and interactive above native modal dialogs across Runtime, Astro, React, and CLI-installed consumers.
- Keep the styled Color Picker area usable in constrained viewports by preserving a minimum height,
  choosing the best fitting Popover side before sizing, and scrolling content when neither side fits.
  Expose the compatible Popover collision strategy through generated Astro and React Primitive
  adapters, and continue the styled Color Picker registry version from its legacy release history.
- Stage Dialog, Alert Dialog, and Sheet entry styles through native top-layer presentation so their opening animations remain complete under main-thread load.
- Dismiss floating overlays when pointer interactions occur in unrelated composition-root space while
  preserving interactions with nested portaled overlays. This corrects Color Picker Popover dismissal
  in both Astro and React and applies the same explicit boundary behavior to other floating controls.
- Keep ancestor submenus open while the pointer moves into a nested submenu portal.

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

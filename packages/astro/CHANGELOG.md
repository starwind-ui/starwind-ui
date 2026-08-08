# @starwind-ui/astro

## 0.1.0-beta.8

### Patch Changes

- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.8

## 0.1.0-beta.7

### Patch Changes

- Fix generated React Color Picker source and the Astro Spinner SVG prop contract. Detect Astro and
  React projects during default CLI initialization, and add a non-interactive remove option. Add
  packed Astro and React release-candidate tests across supported framework versions and package
  managers.
- Refresh Navigation Menu item and list ownership when its DOM collection changes.
- Keep Navigation Menu positioners inside a connected explicit floating root that already owns the
  portal, while preserving trigger-derived dialog ownership, nested dialog roots, and body fallback.
- Preserve the pending starting-style release when an open element receives a repeated presence
  refresh before the next animation frame.
- Preserve uncontrolled Input OTP authored defaults when Field reconnects during native form reset.
- Keep Combobox and Navigation Menu explicit portal targets compatible with their active dialog owner.
- Restore the previous active Toast manager when a newer manager is destroyed so global toast calls
  continue to route through a mounted provider.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- Correct the vendored React Checkbox indicator presence behavior for active, kept, and explicitly
  hidden indicators.
- Keep nested Accordion roots independent by limiting Runtime item discovery, part rendering, and
  delegated trigger interactions to the controller that owns their nearest Accordion root.
- Preserve intentionally empty Select item labels and their lazy hidden form values in the vendored
  React adapter.
- Restore uncontrolled Slider values after native form reset while preserving accepted controlled
  values and keeping Runtime state, rendered parts, and submitted form data synchronized.
- Publish payloadless Slider state synchronization after silent Runtime settlement so generated
  adapters can read back normalized uncontrolled values without duplicating form-reset behavior.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.6

## 0.1.0-beta.5

### Patch Changes

- Make Accordion root value-change proposals synchronously cancelable before uncontrolled state commits.
- Synchronize Checkbox Group state with native form resets across controlled, uncontrolled, external,
  and dynamically reassociated form ownership while cleaning up reset listeners and observers.
- Distinguish accepted Radio ownership transitions from immediate commits, and keep controlled Radio
  Group keyboard focus aligned when framework prop reconciliation completes or supersedes a proposal.
- Make Radio and Radio Group changes cancelable before state commitment, synchronize accepted state
  with adapters, and preserve controlled and uncontrolled values through native form resets.
- Expose the generated React Toggle Group context and provide normalized group state to descendants.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.5

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
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.4

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

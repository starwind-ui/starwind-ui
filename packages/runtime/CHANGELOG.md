# @starwind-ui/runtime

## 1.3.0

### Minor Changes

- Fixed Color Picker form resets in React and Vue. Canceling a reset now keeps the selected color and format, and a pending reset no longer overwrites a newer selection or slider change.

  For custom Runtime integrations, the new `stateSync` subscription lets you update your UI after a form reset finishes without firing a user-change event.

- React, Vue, and Svelte Form components now support validation settings, server errors, and options for when errors appear. You can use synchronous or asynchronous validators and configure submission and reset behavior through component props.
- Fixed component updates and form resets across frameworks:
  - Vue bindings now reflect changes accepted by the component. Checkboxes and switches keep their original reset values, and Checkbox Group manages the correct child controls.
  - React Navigation Menu handles content being removed from its shared viewport. Sidebar stays in sync with saved state and handles nested mobile sheets correctly.
  - Color Picker keeps values supplied by your app when the form resets.
  - Input and Dropzone keep working when their input elements or associated forms change. Custom Runtime integrations can use their new `refresh` methods to reconnect those elements.

  Components installed through the CLI include these fixes. Installing the Field Primitive also includes its required Input files.

- Fixed component state getting out of sync with app updates, form resets, and initial input values. This includes opening and closing overlays from code and keeping Tabs selection in sync.

  Avatar now handles changes to its image and fallback elements. Dialog recognizes controls added after it opens, and Vue toasts use the correct spacing.

- Tabs now supports CSS entrance and exit animations. Panels stay visible until their exit animation finishes, while inactive content stops accepting keyboard focus and clicks. Use `data-starting-style` and `data-ending-style` to style the animations.

  When your code changes the selected tab, pressing Tab to enter the tab list now focuses that tab. Focus stays in place while someone is already navigating the list.

- Fixed open React tooltips and hover cards losing their position when the component updates. Tooltip also cancels a scheduled opening when disabled and responds to its trigger again when re-enabled.

  For custom Runtime integrations, Tooltip and Preview Card `setOpen` methods now accept an optional trigger element. Use it to restore an open overlay at its trigger.

- React Tooltip now reports a clear error if its Primitive markup is missing `Tooltip.Portal`.

  If you used the previous Primitive example, wrap `Tooltip.Positioner` and `Tooltip.Popup` in `Tooltip.Portal`. For inline rendering, keep the wrapper and set its `disabled` prop. Styled Tooltip already includes this wrapper and needs no change.

### Patch Changes

- Fixed Combobox values and input text after form resets. Canceling a reset keeps the current value, and a pending reset no longer overwrites newer input.

  In React, pressing Escape restores the expected input text. In Vue, canceling an input change restores the previous text.

- Fixed an open Context Menu jumping away from where it was opened when the component updates. It now keeps its position until the next time you open it at another location.
- Input OTP now shows a visible, blinking caret when focused in Astro, React, Vue, and Svelte. Its caret styles are included with the component.

  Popovers now shift to stay within the viewport near an edge, while keeping space between the popup and its trigger.

- Fixed Navigation Menu links after content moves into the shared viewport. Links still follow your close-on-select settings, canceled actions stay canceled, and links in nested menus affect the correct menu.
- Reduced repeated DOM observation in React pages with multiple portaled components, such as menus and tooltips. Portals now share one observer, which reduces the work needed to track changes to the page.
- Simplified React Select form-reset handling and timer cleanup. Canceled resets keep the current selection, and pending resets cannot overwrite a newer value.

  Moving a Select to another form while a reset is pending no longer has special handling. Keep it attached to the same form until that reset finishes.

- Fixed toasts skipping their entrance animation or leaving incorrect spacing when updated immediately, including when a promise resolves. Closing a toast also cancels any remaining entrance animation work.

## 1.2.1

### Patch Changes

- Deliver Runtime-backed group naming and Tabs indicator geometry corrections through the first-party adapters and bundled registry. The Vue package remains on its beta release channel.
- Remove unused internal portal methods and retired CLI helpers. Keep public behavior and component source unchanged.

## 1.2.0

### Minor Changes

- Use deterministic Portal bindings across framework adapters. Keep React wrappers under
  framework-owned placement, retain Runtime movement for Astro, and use one Dialog-owned top-layer
  host for nested floating content.
- Add optional portable portal container, disabled, and placement props to Astro overlay adapters. Add the shared Runtime placement handshake so framework adapters can report when their public portal wrapper reaches its resolved target.

### Patch Changes

- Centralize internal owned-list discovery, mutation reconciliation, navigation, highlight, and typeahead behavior for Select, Combobox, and Menu maintenance. Public Runtime interfaces and component behavior stay unchanged.
- Keep touch-opened Context Menu parents active while focus moves to a submenu trigger, so portaled submenus remain positioned against their trigger on mobile browsers.
- Keep touch Select triggers and popup items inside the active focus boundary so trigger taps close an open popup and item taps commit their values on mobile browsers.

## 1.1.0

### Minor Changes

- Add Menu-backed focus handoff for Menu, Dropdown, and Context Menu, including `focus-out` close details.
- Fix Select Tab handoff and add public `focus-out` close details.

### Patch Changes

- Improve npm metadata and clarify package roles in the public READMEs.
- Keep nested Collapsible triggers and panels scoped to their nearest Runtime root.

## 1.0.0

### Major Changes

- Release the first stable Runtime adapter line for Astro and React.

### Minor Changes

- Narrow Button Runtime to opted-in focusable-disabled native buttons, synchronize mutable disabled
  state through generated Astro and React adapters, and refresh vendored Primitive artifacts and
  documentation for the native-only boundary.
- Replace additive Form validation timing with before- and after-submit policies, add the imperative
  validation, visibility, reset, and external-error APIs, and refresh generated adapters and vendored
  Primitive artifacts.

  For the beta migration, both the previous `input` timing and the previous committed-only meaning of
  `change` map to semantic `change`, which runs for every accepted value revision. Committed-only
  validation timing is no longer available. Defaults remain validation on `submit`, revalidation on
  `change`, and error visibility on `submit`; after the first submission attempt,
  `revalidationTiming` replaces `validationTiming` instead of being additive.

- Introduce the public Starwind Runtime architecture and its lockstep Astro and React Primitive adapter packages.

  This release moves interactive behavior into framework-agnostic Runtime controllers, adds generated first-party Primitive adapters for Astro and React, and hardens controller teardown, client-navigation cleanup, callback refs, Theme prepaint serialization, and large-collection highlighting.

- Add the Runtime-backed Color Picker controller and generated Astro and React Primitive adapters,
  including popup positioning, format controls, channel inputs, swatches, keyboard interaction, and
  form integration. Preserve interaction-derived HSB saturation at zero brightness so captured area
  dragging stays aligned at black and restores color when brightness rises, and keep Clear hidden and
  disabled until the root explicitly allows empty values.

### Patch Changes

- Make Accordion root value-change proposals synchronously cancelable before uncontrolled state commits.
- Default Accordions to collapsible while preserving `collapsible={false}` as the required-open override.
- Keep Avatar images eligible for native lazy loading while the Runtime conceals their loading and
  error states, including Astro images rendered from imported assets.
- Synchronize Checkbox Group state with native form resets across controlled, uncontrolled, external,
  and dynamically reassociated form ownership while cleaning up reset listeners and observers.
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
- Distinguish accepted Radio ownership transitions from immediate commits, and keep controlled Radio
  Group keyboard focus aligned when framework prop reconciliation completes or supersedes a proposal.
- Prevent Styled Progress indicators from animating across incompatible determinate and indeterminate
  geometries while preserving normal determinate value transitions and reduced-motion behavior.
- Keep dialog-owned floating layers visible and interactive above native modal dialogs across Runtime, Astro, React, and CLI-installed consumers.
- Present Dialog-family popups with coherent open visual state so Dialog and Sheet entry animations play completely for quick and held trigger releases.
- Correct the vendored React Checkbox indicator presence behavior for active, kept, and explicitly
  hidden indicators.
- Keep the styled Color Picker area usable in constrained viewports by preserving a minimum height,
  choosing the best fitting Popover side before sizing, and scrolling content when neither side fits.
  Expose the compatible Popover collision strategy through generated Astro and React Primitive
  adapters, and continue the styled Color Picker registry version from its legacy release history.
- Stage Dialog, Alert Dialog, and Sheet entry styles through native top-layer presentation so their opening animations remain complete under main-thread load.
- Dismiss floating overlays when pointer interactions occur in unrelated composition-root space while
  preserving interactions with nested portaled overlays. This corrects Color Picker Popover dismissal
  in both Astro and React and applies the same explicit boundary behavior to other floating controls.
- Keep nested Accordion roots independent by limiting Runtime item discovery, part rendering, and
  delegated trigger interactions to the controller that owns their nearest Accordion root.
- Keep ancestor submenus open while the pointer moves into a nested submenu portal.
- Preserve intentionally empty Select item labels and their lazy hidden form values in the vendored
  React adapter.
- Restore uncontrolled Slider values after native form reset while preserving accepted controlled
  values and keeping Runtime state, rendered parts, and submitted form data synchronized.
- Refresh Navigation Menu item and list ownership when its DOM collection changes.
- Keep Navigation Menu positioners inside a connected explicit floating root that already owns the
  portal, while preserving trigger-derived dialog ownership, nested dialog roots, and body fallback.
- Preserve the pending starting-style release when an open element receives a repeated presence
  refresh before the next animation frame.
- Make Radio and Radio Group changes cancelable before state commitment, synchronize accepted state
  with adapters, and preserve controlled and uncontrolled values through native form resets.
- Keep Color Picker editing controls usable after clearing an optional value by retaining the last color as their editing baseline.
- Restore a connected return-focus target when a Dialog-family Runtime controller is destroyed.
- Normalize cancelable Runtime state proposals so callbacks and DOM events share one details object before accepted state commits. Update React Primitive adapters to preserve pre-commit cancellation, accepted-only synchronization, Combobox command cancellation, and Switch native form association. Synchronize the affected vendored React Primitive sources in the CLI.
- Prevent unchanged Input OTP character renders from repeatedly reconnecting a Field-owned control.
- Preserve uncontrolled Input OTP authored defaults when Field reconnects during native form reset.
- Keep nested Popover ownership correct when framework lifecycle hooks create a child controller
  before its parent, including hover coordination and parent controller recreation.
- Keep Combobox and Navigation Menu explicit portal targets compatible with their active dialog owner.
- Publish payloadless Slider state synchronization after silent Runtime settlement so generated
  adapters can read back normalized uncontrolled values without duplicating form-reset behavior.
- Restore the previous active Toast manager when a newer manager is destroyed so global toast calls
  continue to route through a mounted provider.
- Expose the generated React Toggle Group context and provide normalized group state to descendants.

## 0.1.0-beta.8

### Patch Changes

- Normalize cancelable Runtime state proposals so callbacks and DOM events share one details object before accepted state commits. Update React Primitive adapters to preserve pre-commit cancellation, accepted-only synchronization, Combobox command cancellation, and Switch native form association. Synchronize the affected vendored React Primitive sources in the CLI.

## 0.1.0-beta.7

### Patch Changes

- Refresh Navigation Menu item and list ownership when its DOM collection changes.
- Keep Navigation Menu positioners inside a connected explicit floating root that already owns the
  portal, while preserving trigger-derived dialog ownership, nested dialog roots, and body fallback.
- Preserve the pending starting-style release when an open element receives a repeated presence
  refresh before the next animation frame.
- Preserve uncontrolled Input OTP authored defaults when Field reconnects during native form reset.
- Keep Combobox and Navigation Menu explicit portal targets compatible with their active dialog owner.
- Restore the previous active Toast manager when a newer manager is destroyed so global toast calls
  continue to route through a mounted provider.

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

## 0.1.0-beta.5

### Patch Changes

- Make Accordion root value-change proposals synchronously cancelable before uncontrolled state commits.
- Synchronize Checkbox Group state with native form resets across controlled, uncontrolled, external,
  and dynamically reassociated form ownership while cleaning up reset listeners and observers.
- Distinguish accepted Radio ownership transitions from immediate commits, and keep controlled Radio
  Group keyboard focus aligned when framework prop reconciliation completes or supersedes a proposal.
- Make Radio and Radio Group changes cancelable before state commitment, synchronize accepted state
  with adapters, and preserve controlled and uncontrolled values through native form resets.
- Restore a connected return-focus target when a Dialog-family Runtime controller is destroyed.
- Prevent unchanged Input OTP character renders from repeatedly reconnecting a Field-owned control.
- Keep nested Popover ownership correct when framework lifecycle hooks create a child controller
  before its parent, including hover coordination and parent controller recreation.
- Expose the generated React Toggle Group context and provide normalized group state to descendants.

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

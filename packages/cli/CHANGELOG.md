# starwind

## 3.0.1

### Patch Changes

- Promote every Runtime-backed Primitive vendoring version to the stable `1.0.0` baseline and enable normal post-1.0 SemVer intents.

## 3.0.0

### Major Changes

- Release the Runtime-aware Starwind CLI and the v2 bundled styled-component registry.

  The CLI now installs styled components for Astro and React, provides explicit Primitive source add, update, list, search, and preview workflows, tracks mixed framework and registry sources, supports native Starwind Pro registry installs, and safely migrates existing projects to Runtime-backed components.

  This release also makes component removal framework-aware, detects styled dependency cycles and local file conflicts, validates registry package specifications and configuration before mutation, confines managed paths to the project root, and restricts authenticated registry credentials to trusted origins.

### Minor Changes

- Add a styled `DropdownLinkItem` for native anchor navigation while keeping `DropdownItem` focused
  on menu actions.
- Coordinate Card section gaps and insets through an overridable `--card-spacing` variable, with
  default and small size presets that keep Astro and React styled output in sync.
- Centralize styled component sizing around one explicit owner per visual scope. Existing `sm`, `md`,
  and `lg` size families continue to default to `md`.

  Migrate compound components by moving child sizes to their root:

  ```diff
  -<PaginationLink size="sm" />
  +<Pagination size="sm"><PaginationLink /></Pagination>

  -<RadioGroupItem size="lg" value="one" />
  +<RadioGroup size="lg"><RadioGroupItem value="one" /></RadioGroup>

  -<InputOtpSlot size="sm" index={0} />
  +<InputOtp size="sm"><InputOtpSlot index={0} /></InputOtp>

  -<ToggleGroupItem size="lg" value="bold" />
  +<ToggleGroup size="lg"><ToggleGroupItem value="bold" /></ToggleGroup>
  ```

  Select and Combobox controls remain independently sizeable from their portaled content. Set both
  props when they should match, or set them differently on purpose:

  ```astro
  <SelectTrigger size="sm" />
  <SelectContent size="lg">...</SelectContent>

  <ComboboxInput size="sm" />
  <ComboboxContent size="lg">...</ComboboxContent>
  ```

  Color Picker now owns trigger-side and inline sizing on `ColorPicker`, while
  `ColorPickerContent` independently owns the portaled editor. Remove `size` from inner Color Picker
  parts. For a custom `ColorPickerInput`, use `formatContentSize` only when its nested Select popup
  needs an explicit size:

  ```diff
  -<ColorPicker size="sm"><ColorPickerTrigger size="sm" /></ColorPicker>
  +<ColorPicker size="sm"><ColorPickerTrigger /></ColorPicker>

  -<ColorPickerInput size="sm" />
  +<ColorPickerInput formatContentSize="sm" />
  ```

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
- Add `sm` and `md` sizing to the styled Navigation Menu. `size` controls native triggers,
  List spacing, indicators, and Links using `navigationMenuTriggerStyle()`. `contentSize` controls the
  shared portaled popup and defaults to the resolved `size`, so matching sizes require one prop while
  intentional root/content mismatches remain possible.

  Correct the styled `NavigationMenuTrigger asChild` visual-ownership contract. A native Trigger still
  receives Navigation Menu's complete trigger recipe and generated chevron. A composed control now
  keeps its own markup and complete appearance while preserving the existing Primitive composition
  behavior, child-owned attribute precedence, and consumer-provided Trigger class.

  Migration: styled composed controls no longer receive Navigation Menu's default trigger recipe,
  root sizing, or generated chevron. Style the child directly and place any desired icon inside it.

- Normalize the standard Card, Item, and Sidebar menu button size name from `default` to `md`.
  Omitting `size` continues to select the same medium styling; pass `size="md"` when an explicit
  medium size is useful.
- Simplify the styled Color Picker around a complete zero-child default and a smaller advanced
  composition API. `ColorPicker` now renders either the popup shell or, with `inline`, the inline
  editor; alpha remains enabled by default. Common customization moves to `formatControl`, `formats`,
  `showEyeDropper`, `showValueText`, `clearable`, `swatches`, and `label` props.

  Migrate `ColorPickerRoot` to `<ColorPicker inline>`. Use `label` or an authored label instead of
  `ColorPickerLabel`, and an authored container instead of `ColorPickerControl`. `ColorPickerArea`
  now includes its thumb, `ColorPickerInput` includes the value input and accepts
  `formatControl="select" | "native" | "none"`, and `ColorPicker` always renders its hidden form
  input. Replace `allowEmpty` plus `showClear` with `clearable`, and pass swatch data through the
  `swatches` array for the default editor.

  The styled API no longer supports requesting a visible Clear action while empty values are
  forbidden, or replacing only the internal area thumb, format-selector anatomy, or hidden input.
  Use the Color Picker Primitive when those raw anatomy customizations are required. Popup, inline,
  input-only, swatch-only, native-select, forms, and custom channel layouts remain supported.

### Patch Changes

- Default Accordions to collapsible while preserving `collapsible={false}` as the required-open override.
- Apply divider borders only to non-last Accordion items in generated Astro and React components.
- Correct styled Hover Card, Popover, and Tooltip Trigger composition so composed children no longer
  receive the Trigger's native recipe or display classes. Native Trigger rendering remains unchanged.

  Migration: if a composed child relied on those native Trigger classes for its appearance, style the
  child directly instead.

- Keep Avatar images eligible for native lazy loading while the Runtime conceals their loading and
  error states, including Astro images rendered from imported assets.
- Fix generated React Color Picker source and the Astro Spinner SVG prop contract. Detect Astro and
  React projects during default CLI initialization, and add a non-interactive remove option. Add
  packed Astro and React release-candidate tests across supported framework versions and package
  managers.
- Complete CLI command lifecycles, alphabetize component lists, and detect supported host targets
  during initialization. Configure React as an Astro secondary target and supply Vite React
  JavaScript projects with TypeScript settings for generated TSX. Name generated Styled aggregate
  default exports for clean framework tooling output.
- Narrow Button Runtime to opted-in focusable-disabled native buttons, synchronize mutable disabled
  state through generated Astro and React adapters, and refresh vendored Primitive artifacts and
  documentation for the native-only boundary.
- Remove directional sliding from the styled Combobox closing animation while preserving its fade and
  scale motion.
- Render canonical and CLI-installed Avatar roots as inline flex containers so the existing small,
  medium, and large size variants produce exact circular geometry while preserving image and fallback
  visibility.
- Prevent Styled Progress indicators from animating across incompatible determinate and indeterminate
  geometries while preserving normal determinate value transitions and reduced-motion behavior.
- Normalize installed Astro and React Progress components consistently with Runtime for reversed,
  equal, invalid, and non-finite ranges and values.
- Use the `default` style when Radio Group items and Progress indicators omit their color variant.
- Keep dialog-owned floating layers visible and interactive above native modal dialogs across Runtime, Astro, React, and CLI-installed consumers.
- Correct the vendored React Checkbox indicator presence behavior for active, kept, and explicitly
  hidden indicators.
- Keep dependency installation under one progress renderer during project initialization.
- Detect the project package manager for dependency installs when no override is provided, and show
  progress while package updates are running.
- Keep the styled Color Picker area usable in constrained viewports by preserving a minimum height,
  choosing the best fitting Popover side before sizing, and scrolling content when neither side fits.
  Expose the compatible Popover collision strategy through generated Astro and React Primitive
  adapters, and continue the styled Color Picker registry version from its legacy release history.
- Keep Color Picker area dragging two-dimensional on touch devices by routing pointer hit-testing through the area while preserving keyboard controls.
- Ensure Color Picker value and format controls follow the selected small, medium, or large size instead of retaining the shared input's medium dimensions.
- Fix generated Astro and React styled Color Picker swatch normalization so public JavaScript and TypeScript consumers can use raw color values and labeled swatch descriptors without compile errors.
- Stage Dialog, Alert Dialog, and Sheet entry styles through native top-layer presentation so their opening animations remain complete under main-thread load.
- Dismiss floating overlays when pointer interactions occur in unrelated composition-root space while
  preserving interactions with nested portaled overlays. This corrects Color Picker Popover dismissal
  in both Astro and React and applies the same explicit boundary behavior to other floating controls.
- Keep ancestor submenus open while the pointer moves into a nested submenu portal.
- Initialize React Select state from silent programmatic value commands so Color Picker format controls show their configured format with selected-value styling before interaction. Synchronize the corrected Select Primitive source in the CLI registry.
- Preserve intentionally empty Select item labels and their lazy hidden form values in the vendored
  React adapter.
- Replace additive Form validation timing with before- and after-submit policies, add the imperative
  validation, visibility, reset, and external-error APIs, and refresh generated adapters and vendored
  Primitive artifacts.

  For the beta migration, both the previous `input` timing and the previous committed-only meaning of
  `change` map to semantic `change`, which runs for every accepted value revision. Committed-only
  validation timing is no longer available. Defaults remain validation on `submit`, revalidation on
  `change`, and error visibility on `submit`; after the first submission attempt,
  `revalidationTiming` replaces `validationTiming` instead of being additive.

- Add framework-aware initialization for Vite React, Next.js App Router, and TanStack Start. Preserve React client boundaries and add server-rendered theme bootstrap support.
- Support React Router framework mode and Next.js Pages Router initialization. Route Pages component styles through its global stylesheet so installed interactive components compile under Next.js.
- Install framework-specific setup dependencies from bundled registry metadata during initialization.
- Normalize cancelable Runtime state proposals so callbacks and DOM events share one details object before accepted state commits. Update React Primitive adapters to preserve pre-commit cancellation, accepted-only synchronization, Combobox command cancellation, and Switch native form association. Synchronize the affected vendored React Primitive sources in the CLI.
- Improve the secondary Button hover state with a theme-relative color mix.
- Use Tailwind CSS v4 custom-property shorthand throughout the installed Color Picker classes. This
  keeps the generated CSS and visual behavior unchanged while removing redundant `var(...)`
  arbitrary-value wrappers.
- Synchronize the vendored React Radio and Radio Group primitives with accepted Runtime transitions
  and external state synchronization.
- Synchronize vendored React Toggle Group primitives with the generated context provider output.

## 3.0.0-beta.8

### Patch Changes

- Complete CLI command lifecycles, alphabetize component lists, and detect supported host targets
  during initialization. Configure React as an Astro secondary target and supply Vite React
  JavaScript projects with TypeScript settings for generated TSX. Name generated Styled aggregate
  default exports for clean framework tooling output.
- Keep dependency installation under one progress renderer during project initialization.
- Fix generated Astro and React styled Color Picker swatch normalization so public JavaScript and TypeScript consumers can use raw color values and labeled swatch descriptors without compile errors.
- Initialize React Select state from silent programmatic value commands so Color Picker format controls show their configured format with selected-value styling before interaction. Synchronize the corrected Select Primitive source in the CLI registry.
- Add framework-aware initialization for Vite React, Next.js App Router, and TanStack Start. Preserve React client boundaries and add server-rendered theme bootstrap support.
- Support React Router framework mode and Next.js Pages Router initialization. Route Pages component styles through its global stylesheet so installed interactive components compile under Next.js.
- Normalize cancelable Runtime state proposals so callbacks and DOM events share one details object before accepted state commits. Update React Primitive adapters to preserve pre-commit cancellation, accepted-only synchronization, Combobox command cancellation, and Switch native form association. Synchronize the affected vendored React Primitive sources in the CLI.

## 3.0.0-beta.7

### Patch Changes

- Fix generated React Color Picker source and the Astro Spinner SVG prop contract. Detect Astro and
  React projects during default CLI initialization, and add a non-interactive remove option. Add
  packed Astro and React release-candidate tests across supported framework versions and package
  managers.

## 3.0.0-beta.6

### Minor Changes

- Centralize styled component sizing around one explicit owner per visual scope. Existing `sm`, `md`,
  and `lg` size families continue to default to `md`.

  Migrate compound components by moving child sizes to their root:

  ```diff
  -<PaginationLink size="sm" />
  +<Pagination size="sm"><PaginationLink /></Pagination>

  -<RadioGroupItem size="lg" value="one" />
  +<RadioGroup size="lg"><RadioGroupItem value="one" /></RadioGroup>

  -<InputOtpSlot size="sm" index={0} />
  +<InputOtp size="sm"><InputOtpSlot index={0} /></InputOtp>

  -<ToggleGroupItem size="lg" value="bold" />
  +<ToggleGroup size="lg"><ToggleGroupItem value="bold" /></ToggleGroup>
  ```

  Select and Combobox controls remain independently sizeable from their portaled content. Set both
  props when they should match, or set them differently on purpose:

  ```astro
  <SelectTrigger size="sm" />
  <SelectContent size="lg">...</SelectContent>

  <ComboboxInputGroup size="sm">...</ComboboxInputGroup>
  <ComboboxContent size="lg">...</ComboboxContent>
  ```

  Color Picker now owns trigger-side and inline sizing on `ColorPicker`, while
  `ColorPickerContent` independently owns the portaled editor. Remove `size` from inner Color Picker
  parts. For a custom `ColorPickerInput`, use `formatContentSize` only when its nested Select popup
  needs an explicit size:

  ```diff
  -<ColorPicker size="sm"><ColorPickerTrigger size="sm" /></ColorPicker>
  +<ColorPicker size="sm"><ColorPickerTrigger /></ColorPicker>

  -<ColorPickerInput size="sm" />
  +<ColorPickerInput formatContentSize="sm" />
  ```

- Add `sm` and `md` sizing to the styled Navigation Menu. `size` controls native triggers,
  List spacing, indicators, and Links using `navigationMenuTriggerStyle()`. `contentSize` controls the
  shared portaled popup and defaults to the resolved `size`, so matching sizes require one prop while
  intentional root/content mismatches remain possible.

  Correct the styled `NavigationMenuTrigger asChild` visual-ownership contract. A native Trigger still
  receives Navigation Menu's complete trigger recipe and generated chevron. A composed control now
  keeps its own markup and complete appearance while preserving the existing Primitive composition
  behavior, child-owned attribute precedence, and consumer-provided Trigger class.

  Migration: styled composed controls no longer receive Navigation Menu's default trigger recipe,
  root sizing, or generated chevron. Style the child directly and place any desired icon inside it.

- Normalize the standard Card, Item, and Sidebar menu button size name from `default` to `md`.
  Omitting `size` continues to select the same medium styling; pass `size="md"` when an explicit
  medium size is useful.
- Simplify the styled Color Picker around a complete zero-child default and a smaller advanced
  composition API. `ColorPicker` now renders either the popup shell or, with `inline`, the inline
  editor; alpha remains enabled by default. Common customization moves to `formatControl`, `formats`,
  `showEyeDropper`, `showValueText`, `clearable`, `swatches`, and `label` props.

  Migrate `ColorPickerRoot` to `<ColorPicker inline>`. Use `label` or an authored label instead of
  `ColorPickerLabel`, and an authored container instead of `ColorPickerControl`. `ColorPickerArea`
  now includes its thumb, `ColorPickerInput` includes the value input and accepts
  `formatControl="select" | "native" | "none"`, and `ColorPicker` always renders its hidden form
  input. Replace `allowEmpty` plus `showClear` with `clearable`, and pass swatch data through the
  `swatches` array for the default editor.

  The styled API no longer supports requesting a visible Clear action while empty values are
  forbidden, or replacing only the internal area thumb, format-selector anatomy, or hidden input.
  Use the Color Picker Primitive when those raw anatomy customizations are required. Popup, inline,
  input-only, swatch-only, native-select, forms, and custom channel layouts remain supported.

### Patch Changes

- Correct styled Hover Card, Popover, and Tooltip Trigger composition so composed children no longer
  receive the Trigger's native recipe or display classes. Native Trigger rendering remains unchanged.

  Migration: if a composed child relied on those native Trigger classes for its appearance, style the
  child directly instead.

- Correct the vendored React Checkbox indicator presence behavior for active, kept, and explicitly
  hidden indicators.
- Ensure Color Picker value and format controls follow the selected small, medium, or large size instead of retaining the shared input's medium dimensions.
- Preserve intentionally empty Select item labels and their lazy hidden form values in the vendored
  React adapter.
- Use Tailwind CSS v4 custom-property shorthand throughout the installed Color Picker classes. This
  keeps the generated CSS and visual behavior unchanged while removing redundant `var(...)`
  arbitrary-value wrappers.

## 3.0.0-beta.5

### Patch Changes

- Keep Color Picker area dragging two-dimensional on touch devices by routing pointer hit-testing through the area while preserving keyboard controls.
- Synchronize the vendored React Radio and Radio Group primitives with accepted Runtime transitions
  and external state synchronization.
- Synchronize vendored React Toggle Group primitives with the generated context provider output.

## 3.0.0-beta.4

### Patch Changes

- Keep Avatar images eligible for native lazy loading while the Runtime conceals their loading and
  error states, including Astro images rendered from imported assets.
- Keep dialog-owned floating layers visible and interactive above native modal dialogs across Runtime, Astro, React, and CLI-installed consumers.
- Detect the project package manager for dependency installs when no override is provided, and show
  progress while package updates are running.
- Keep the styled Color Picker area usable in constrained viewports by preserving a minimum height,
  choosing the best fitting Popover side before sizing, and scrolling content when neither side fits.
  Expose the compatible Popover collision strategy through generated Astro and React Primitive
  adapters, and continue the styled Color Picker registry version from its legacy release history.
- Stage Dialog, Alert Dialog, and Sheet entry styles through native top-layer presentation so their opening animations remain complete under main-thread load.
- Dismiss floating overlays when pointer interactions occur in unrelated composition-root space while
  preserving interactions with nested portaled overlays. This corrects Color Picker Popover dismissal
  in both Astro and React and applies the same explicit boundary behavior to other floating controls.
- Keep ancestor submenus open while the pointer moves into a nested submenu portal.
- Replace additive Form validation timing with before- and after-submit policies, add the imperative
  validation, visibility, reset, and external-error APIs, and refresh generated adapters and vendored
  Primitive artifacts.

  For the beta migration, both the previous `input` timing and the previous committed-only meaning of
  `change` map to semantic `change`, which runs for every accepted value revision. Committed-only
  validation timing is no longer available. Defaults remain validation on `submit`, revalidation on
  `change`, and error visibility on `submit`; after the first submission attempt,
  `revalidationTiming` replaces `validationTiming` instead of being additive.

- Install framework-specific setup dependencies from bundled registry metadata during initialization.

## 3.0.0-beta.3

### Minor Changes

- Add a styled `DropdownLinkItem` for native anchor navigation while keeping `DropdownItem` focused
  on menu actions.
- Coordinate Card section gaps and insets through an overridable `--card-spacing` variable, with
  default and small size presets that keep Astro and React styled output in sync.

### Patch Changes

- Apply divider borders only to non-last Accordion items in generated Astro and React components.
- Render canonical and CLI-installed Avatar roots as inline flex containers so the existing small,
  medium, and large size variants produce exact circular geometry while preserving image and fallback
  visibility.
- Prevent Styled Progress indicators from animating across incompatible determinate and indeterminate
  geometries while preserving normal determinate value transitions and reduced-motion behavior.
- Normalize installed Astro and React Progress components consistently with Runtime for reversed,
  equal, invalid, and non-finite ranges and values.

## 3.0.0-beta.2

### Minor Changes

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

### Patch Changes

- Default Accordions to collapsible while preserving `collapsible={false}` as the required-open override.
- Narrow Button Runtime to opted-in focusable-disabled native buttons, synchronize mutable disabled
  state through generated Astro and React adapters, and refresh vendored Primitive artifacts and
  documentation for the native-only boundary.
- Improve the secondary Button hover state with a theme-relative color mix.

## 2.0.1

### Patch Changes

- Updated dependencies [0c0c4a7]
- Updated dependencies [e793f8d]
- Updated dependencies [6b8d786]
  - @starwind-ui/core@2.0.1

## 2.0.0

### Major Changes

- a170442: chore: update required node version to minimum v22.12.0 to reflect Astro v6 requirements

### Minor Changes

- 87f35ec: feat(cli): add search command
- 72b3b89: feat(cli): add docs command

### Patch Changes

- Updated dependencies [d2f67d1]
- Updated dependencies [283f35e]
- Updated dependencies [3f73476]
- Updated dependencies [11291f4]
- Updated dependencies [24feea4]
- Updated dependencies [1f2f57c]
- Updated dependencies [a2b3687]
- Updated dependencies [8c2806f]
- Updated dependencies [7a2da11]
- Updated dependencies [9af78d5]
  - @starwind-ui/core@2.0.0

## 1.16.2

### Patch Changes

- 8c5d9e7: fix: remove confusion around pro component installation via shadcn
  - @starwind-ui/core@1.16.2

## 1.16.1

### Patch Changes

- Updated dependencies [43a7435]
- Updated dependencies [ece15f2]
  - @starwind-ui/core@1.16.1

## 1.16.0

### Minor Changes

- a662227: feat: add cli support for utility files
- 4118e32: feat: add theme toggle code snippet for vscode during init process

### Patch Changes

- d7e6e8e: style: update default secondary styles
- Updated dependencies [4ea7955]
- Updated dependencies [6a3b754]
- Updated dependencies [7bc43d2]
- Updated dependencies [a2153f5]
- Updated dependencies [d865158]
- Updated dependencies [0bf0403]
- Updated dependencies [f8953e5]
  - @starwind-ui/core@1.16.0

## 1.15.5

### Patch Changes

- e179b78: feat(cli): add setup command for adding starwind pro to existing starwind ui projects
  - @starwind-ui/core@1.15.5

## 1.15.4

### Patch Changes

- Updated dependencies [af156c5]
  - @starwind-ui/core@1.15.4

## 1.15.3

### Patch Changes

- 734f2e9: feat(cli): add --yes and --package-manager commands to add and update commands
  - @starwind-ui/core@1.15.3

## 1.15.2

### Patch Changes

- Updated dependencies [c997e6f]
- Updated dependencies [17d0877]
  - @starwind-ui/core@1.15.2

## 1.15.0

### Patch Changes

- a6c2f2c: feat: add sidebar variables to starwind css file
- Updated dependencies [2a7b70e]
- Updated dependencies [c667fb9]
- Updated dependencies [225ceb1]
- Updated dependencies [efa8569]
- Updated dependencies [eece2cc]
- Updated dependencies [b4bd93d]
  - @starwind-ui/core@1.15.0

## 1.14.0

### Minor Changes

- be76e48: feat(cli): automatically create ".env.local" with demo "STARWIND_LICENSE_KEY" variable, and add file to .gitignore during "starwind init --pro" command
- b8e37af: feat(cli): automatically add import of starwind css file and set up tsconfig path aliases during "starwind init" command

### Patch Changes

- Updated dependencies [05ad2c7]
  - @starwind-ui/core@1.14.0

## 1.13.0

### Patch Changes

- 8ae0c3e: Add additional detail to add command message to provide more detail to users
- 676a68a: feat(cli): improve cli add component flow
- Updated dependencies [708806e]
- Updated dependencies [c3e979a]
- Updated dependencies [0662058]
- Updated dependencies [3a1a86a]
- Updated dependencies [e574ea6]
- Updated dependencies [5cfefe4]
- Updated dependencies [03d5d9a]
- Updated dependencies [db9b710]
- Updated dependencies [4105668]
  - @starwind-ui/core@1.13.0

## 1.12.4

### Patch Changes

- 13b7c60: Unlock package versions for potential dependency bug fixes
- Updated dependencies [13b7c60]
  - @starwind-ui/core@1.12.4

## 1.12.2

### Patch Changes

- 9a1108f: fix windows package installation and usage
  - @starwind-ui/core@1.12.2

## 1.12.1

### Patch Changes

- Updated dependencies [f7ad6e1]
- Updated dependencies [88e2d11]
  - @starwind-ui/core@1.12.1

## 1.12.0

### Patch Changes

- faf85f1: fix: correctly handle adding extra commas as necessary when starwind init command adjusts the astro config file
- Updated dependencies [2320eaf]
- Updated dependencies [7b43fcb]
- Updated dependencies [fb5651f]
- Updated dependencies [7773330]
- Updated dependencies [ce55d46]
- Updated dependencies [64c1c3a]
- Updated dependencies [5121926]
  - @starwind-ui/core@1.12.0

## 1.11.2

### Patch Changes

- Updated dependencies [33dd20a]
  - @starwind-ui/core@1.11.2

## 1.11.1

### Patch Changes

- 873a1b6: add --primary-accent and --secondary-accent color variables, and adjust default css file to align closer to shadcn
- Updated dependencies [e2e411c]
- Updated dependencies [b255995]
  - @starwind-ui/core@1.11.1

## 1.11.0

### Patch Changes

- Updated dependencies [c0a2da8]
- Updated dependencies [6793ef1]
  - @starwind-ui/core@1.11.0

## 1.10.1

### Patch Changes

- Updated dependencies [eaaec1b]
  - @starwind-ui/core@1.10.1

## 1.10.0

### Minor Changes

- cffaf7e: Update initial starwind css file to match new component styles
- 21ca5de: update tailwind-variants package install to v3

### Patch Changes

- Updated dependencies [1f83bc0]
- Updated dependencies [bdcbfe3]
- Updated dependencies [96de92c]
- Updated dependencies [9261789]
- Updated dependencies [680f584]
  - @starwind-ui/core@1.10.0

## 1.9.0

### Minor Changes

- 3e30f0b: add private registry installation capability and automated setup to `init` and `add` commands
- 26821d2: feat: enable registry dependency installation and upgrading

### Patch Changes

- c4aea05: improve npm dependency installation handling for starwind components
- 9da60b2: update default css radius variable to 0.625 rem to match shadcn
- Updated dependencies [ef55ef6]
- Updated dependencies [432168d]
- Updated dependencies [b83b5d5]
- Updated dependencies [5f3769c]
- Updated dependencies [e8e9a39]
- Updated dependencies [f9c3fa3]
- Updated dependencies [9a5187d]
  - @starwind-ui/core@1.9.0

## 1.8.0

### Minor Changes

- 8044e1f: update init command installed packages to better control versions and add install of tailwind-merge. Closes #42

### Patch Changes

- - Initial changeset setup.
- Updated dependencies
  - @starwind-ui/core@1.8.0

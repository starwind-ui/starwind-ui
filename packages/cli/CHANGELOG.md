# starwind

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

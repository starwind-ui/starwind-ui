# @starwind-ui/svelte

## 0.1.0

### Minor Changes

- React, Vue, and Svelte Form components now support validation settings, server errors, and options for when errors appear. You can use synchronous or asynchronous validators and configure submission and reset behavior through component props.
- Added Svelte 5 support as a public beta. Install the `@starwind-ui/svelte` package or use the Starwind CLI to add Svelte components. Supports Svelte 5.29 and newer versions before Svelte 6, with setup for Vite, SvelteKit, and Astro projects.
- Tabs now supports CSS entrance and exit animations. Panels stay visible until their exit animation finishes, while inactive content stops accepting keyboard focus and clicks. Use `data-starting-style` and `data-ending-style` to style the animations.

  When your code changes the selected tab, pressing Tab to enter the tab list now focuses that tab. Focus stays in place while someone is already navigating the list.

### Patch Changes

- Made component setup and cleanup consistent across React, Vue, and Svelte. This covers form-reset defaults, state updates, and opening nested overlays.

  Fixed the CLI overlooking dependencies in some generated imports. Installed components now include all required files and packages.

- Fixed nested overlays in Svelte dialogs appearing behind their parent or failing to receive clicks. Child overlays now stay above the overlay that opened them.
- Fixed nested overlays in Vue and Svelte, including Select menus appearing behind a Color Picker.

  Nested overlays can now render directly under the document body. If your custom CSS selectors or DOM queries depend on an overlay staying inside its parent, set a portal container or add `data-floating-root` to the element that should contain it. Overlays inside Dialog still use its floating container.

- Updated dependencies
  - @starwind-ui/runtime@1.3.0

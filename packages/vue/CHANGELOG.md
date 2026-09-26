# @starwind-ui/vue

## 0.2.0

### Minor Changes

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

### Patch Changes

- Fixed Color Picker form resets in React and Vue. Canceling a reset now keeps the selected color and format, and a pending reset no longer overwrites a newer selection or slider change.

  For custom Runtime integrations, the new `stateSync` subscription lets you update your UI after a form reset finishes without firing a user-change event.

- Fixed Combobox values and input text after form resets. Canceling a reset keeps the current value, and a pending reset no longer overwrites newer input.

  In React, pressing Escape restores the expected input text. In Vue, canceling an input change restores the previous text.

- Made component setup and cleanup consistent across React, Vue, and Svelte. This covers form-reset defaults, state updates, and opening nested overlays.

  Fixed the CLI overlooking dependencies in some generated imports. Installed components now include all required files and packages.

- Reduced repeated DOM observation in Vue pages with multiple portaled components, such as menus and tooltips. Portals now share one observer, which reduces the work needed to track changes to the page.
- Fixed nested overlays in Vue and Svelte, including Select menus appearing behind a Color Picker.

  Nested overlays can now render directly under the document body. If your custom CSS selectors or DOM queries depend on an overlay staying inside its parent, set a portal container or add `data-floating-root` to the element that should contain it. Overlays inside Dialog still use its floating container.

- Fixed open Vue tooltips and hover cards losing their position when the component updates. They stay attached to their trigger and respect newer open or close requests from your app.
- Updated dependencies
  - @starwind-ui/runtime@1.3.0

## 0.1.1

### Patch Changes

- Deliver Runtime-backed group naming and Tabs indicator geometry corrections through the first-party adapters and bundled registry. The Vue package remains on its beta release channel.
- Remove obsolete private-release warnings from generated Vue adapters and normalize the resulting blank line in vendored Primitive indexes.
- Updated dependencies
  - @starwind-ui/runtime@1.2.1

## 0.1.0

### Minor Changes

- Publish the initial Vue 3.5 adapter beta.

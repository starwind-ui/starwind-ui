# @starwind-ui/vue

## 0.2.0

### Minor Changes

- React, Vue, and Svelte Form components now support validation settings, server errors, and options for when errors appear. You can use synchronous or asynchronous validators and configure submission and reset behavior through component props.
- Fixed several component updates and form resets:
  - In Vue, canceling a checkbox, switch, menu, or popup change now keeps its previous value or open state.
  - React and Vue checkboxes and switches keep their original form-reset values after options such as `readOnly` change. Checkbox Group selection now follows the group value, including when a child has its own checked value.
  - React Navigation Menu no longer crashes when the open content is removed. React Sidebar controls now match saved state, and each nested Sidebar opens and closes its own mobile sheet.
  - Vue and Svelte Color Picker keep app-controlled colors and formats under app control, including after form resets. Initialize a controlled value or format when the picker mounts; remount it to change between controlled and uncontrolled use.
  - Input and Dropzone keep working after their input elements or associated forms change. Custom Runtime integrations can call their new `refresh()` methods after these changes.

  Installing the Field Primitive through the CLI now includes its required Input files.

- Fixed component behavior in the following cases:
  - Vue Accordion, Collapsible, Tabs, and menu options keep their previous state when a change is canceled. Alert Dialog, Drawer, and Popover respond to open and close requests from app code.
  - React Checkbox and Switch, and Vue Switch, use the app-provided checked state for their initial native input value. React toggles inside Toggle Group start with the group's selected and disabled state.
  - React and Vue Input OTP restore the original default value after a form reset, including after `readOnly` changes.
  - Avatar connects replacement images and fallbacks. Fieldset keeps its accessible label linked to its current legend.
  - Dialog, Alert Dialog, and Drawer recognize trigger and close buttons added after the component mounts. Custom Runtime integrations can call the new `refresh()` method after adding or replacing these buttons.
  - Vue Toaster now uses the spacing set through its `gap` and `peek` props.

  Tabs keeps its initial `syncKey` for its mounted lifetime. Remount Tabs to change that key.

- Tabs now supports CSS entrance and exit animations. Panels stay visible until their exit animation finishes, while inactive content stops accepting keyboard focus and clicks. Use `data-starting-style` and `data-ending-style` to style the animations.

  When your code changes the selected tab, pressing Tab to enter the tab list now focuses that tab. Focus stays in place while someone is already navigating the list.

### Patch Changes

- Fixed Color Picker form resets in React and Vue. Canceling a reset now keeps the selected color and format, and a pending reset no longer overwrites a newer selection or slider change.

  For custom Runtime integrations, the new `stateSync` subscription lets you update your UI after a form reset finishes without firing a user-change event.

- Fixed Combobox values and input text after form resets. Canceling a reset keeps the current value, and a pending reset no longer overwrites newer input.

  In React, pressing Escape restores the expected input text. In Vue, canceling an input change restores the previous text.

- Fixed Select labels in Vue and Svelte when the selected option's text changes or its option loads after the value is set. The displayed label now updates while the popup is open or closed.
- Fixed CLI installs that omitted files or packages required by a component. Existing component APIs remain unchanged.
- Reduced background work on Vue pages with multiple menus, tooltips, or other components that use portals. These components now share the work of watching for changes to the page.
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

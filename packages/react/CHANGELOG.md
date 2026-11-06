# @starwind-ui/react

## 1.5.0

### Patch Changes

- Combobox now closes when focus leaves it. Before, the list stayed open after you typed and pressed Tab or Shift+Tab. The list stays open while focus moves between the input, the trigger, and the clear button, and it closes when focus moves past them. Pressing the trigger, the clear button, or another part of the input group keeps focus in the input in every browser, including Safari.

  This close uses the new `focus-out` reason. Call `cancel()` in `onOpenChange` to keep the list open. Focus then goes back to the input. Text you typed but did not pick goes back to the previous text, as it does after Escape or a press outside the list.

  When your code controls the Combobox `value` and keeps it without calling `cancel()`, the input text now shows the label of the value you kept. Before, the input kept the label of the item that was pressed. The text change that restores the input uses the `imperative-action` reason.

- Fixed a Combobox that has more than one `ComboboxClear`. Before, only the first one worked. Pressing another one did not clear the selection or the text, and inside the input group it opened the list. Now every `ComboboxClear` clears the selection and the text, and each one shows the disabled state.
- Fixed a Combobox that has a `ComboboxTrigger` you added yourself. Styled `ComboboxInput` already renders its own trigger, and only that first trigger worked. Pressing your trigger a second time did not close the list, and outside the input group your trigger did nothing. Now every trigger opens and closes the list, and each one shows the open and disabled state.
- React `Select` and `Combobox` inside a `Field` with a `name` now send their value when the form submits. Before, the form often left the value out, because React removed the name from the hidden input each time it rendered. React `Input OTP` gets the same fix.

  React `Select` and `Combobox` inside a `Field` now call `onValueChange`, `onOpenChange`, and `onInputValueChange`, and they follow a parent that holds `value`. Before, these callbacks did not run. The parent kept the old value while the control showed the new one, and the form sent the old one.

  Astro `Checkbox` and `Switch` inside a `Field` now clear when the form resets. Before, they stayed checked.

  A `name` on the control now wins over the `name` on its `Field`, in all frameworks. For example, `<Field name="fruit"><Select name="own">` submits `own`. Before, the `Field` name usually won. If you set different names on a `Field` and its control, and your server reads the `Field` name, remove the `name` from the control.

- Fixed a Navigation Menu panel that flashed and closed when you moved the mouse to a trigger and clicked it. Hover opened the panel first, and the click then closed it. Now a click that starts within 500 ms after hover opened the panel keeps it open. A second click, a later click, the keyboard, and touch still close it.
- React `Select` and `Combobox` now show the selected label when your own component renders the items. Before, a `Select` pick went back to the placeholder, and a `Combobox` value from a parent or from `defaultValue` showed no text.

  To find a label, a closed list renders its items once, hidden, and removes them before the browser paints. Effects in your item component run during that render. This happens once for each value, and only when the root's own `children` do not show the item. If your items load later, a value has no label until someone opens the list and picks an item.

  React `Combobox` also keeps `data-value` on the root when a parent changes the value while the list is closed. Before, the attribute went away after the first use of the Combobox.

- Combobox now sends its events in the same order in Astro, React, Vue, and Svelte. Pressing an item gives the value change, then the input text change with the `item-press` reason, then the open change. Clearing gives the value change, then the input text change to `""` with the `clear` reason. You can cancel the input text change in every framework.

  When you cancel a typed change, the input text goes back to the previous text. This now also works in Astro.

  When your code controls `inputValue`, typing in the middle of the text now keeps the caret where it is. Before, the caret moved to the end after each key. Text that your code does not accept still goes back to your value.

  React `Combobox` now opens on the first focus of its input, as it does in Astro, Vue, and Svelte.

  Styled `ComboboxClear` with `asChild` now uses your child as the button. Before, the default icon made a button inside a button in Vue and React, and a hydration mismatch in Nuxt. Add your own icon to the child if you want one.

  A form reset now keeps a value that your code controls, and the input text follows that value.

  If you use Runtime directly and your items render only when the list opens, pass the new `resolveValueText` option to `createCombobox`. It returns the label for a selected value whose item is not rendered.

- Fixed triggers on links and spans that stayed disabled when a framework wrote `disabled="false"`. This affected Tooltip, Hover Card, Popover, Menu, Context Menu, Toggle, Toggle Group, and Theme Toggle. On a native form control, any `disabled` attribute still disables it.
- Popover, Navigation Menu, and non-modal Dialog no longer take focus back when you have moved on. Before, if you moved to another control while the popup was closing, focus jumped back to the old trigger when the closing animation ended. This also closed a Combobox that you had just opened. Focus now goes back to the trigger only when it is still inside the popup or no control has focus.

  Popover also keeps focus on a field that you press outside the popup. Before, focus went to the Popover trigger when the closing animation ended.

  Pressing the trigger of an open Select in Safari now closes the list. Before, the list closed and opened again.

- Fixed Input writing an unchanged value back into the field. In some browsers this moved the caret or ended an IME composition.

  Vue Input now keeps the caret during a normal edit, puts the old text back when the parent refuses a change, and follows a `v-model` that starts as `undefined`.

- Reduced the JavaScript that Runtime and React send to the browser. The public API is unchanged.
  - Importing one part by name from a React component path no longer includes the other parts. For example, importing only `DialogTitle` from `@starwind-ui/react/dialog` went from about 11 KB of gzip to about 0.2 KB with esbuild. A namespace import, such as `import { Dialog } from "@starwind-ui/react/dialog"`, still includes every part.
  - Production React builds no longer include component display names. They stay in development, so React DevTools still shows them.
  - Field no longer loads Color Picker code unless the Field holds a Color Picker.
  - A page that imports Field with several controls now loads fewer separate files.
  - Runtime uses shorter internal names in its build.

  Runtime now publishes source maps. They map the shortened names back to the original TypeScript, so stack traces and debugger views show the real names.

  Field loads more code in one case. If your page calls `createField` and imports no Runtime code for a control inside that Field, Field now loads the code for all ten controls it can hold together, about 47 KB of gzip. Before, it loaded only the control it needed. To skip that extra load, import the control's own entry, such as `@starwind-ui/runtime/select`. The Astro, React, Vue, and Svelte control components already import it.

- Fixed a blank Select trigger in Astro and Vue when `Select.Value` has its own content and no `placeholder`. For example, `<Select.Value>Astro</Select.Value>` now shows "Astro" until a value is chosen, and shows it again when the value clears. React already did this. This also works when the Select starts with a value and clears later.

  Fixed React Select showing the placeholder after a parent refused a pick. The trigger now keeps the label of the parent value, as it does in Vue and Svelte.

- Updated dependencies
  - @starwind-ui/runtime@1.5.0

## 1.4.0

### Minor Changes

- Dropzone now tells you when it does not keep a dropped file. Before, if you dropped a PDF on a Dropzone with `accept="image/*"`, nothing happened and no event fired. Now Dropzone rejects dropped files that do not match `accept`. A Dropzone without `multiple` keeps one file and rejects the other dropped files.
  - To get the rejected files, listen for the `starwind:files-reject` event on the Dropzone. In React and Svelte, use `onFilesReject`. In Vue, use `@files-reject`. The event gives you the rejected `files` and the drop `event`.
  - When Dropzone keeps none of the dropped files, the styled Dropzone shows an error border and the root gets a `data-rejected` attribute. The error clears on the next accepted drop, file picker choice, `setFiles` call, or form reset. When a drop keeps some of the files, the event fires but the error border does not show.

  Screen readers do not announce a rejected drop. To tell screen reader users, show a message in a live region when the reject event fires.

### Patch Changes

- A Combobox with `required` now stops a plain HTML form from submitting when no option is selected. Before, the empty form submitted and no message showed. Now the browser shows its message and puts focus in the Combobox input. The list stays closed so it does not cover the message.

  A Combobox without `required` still lets the Enter key submit the form as before.

- Form now lets a submit button with `formnovalidate` skip validation. For example, a "Save draft" button with `formnovalidate` submits the form while required fields are still empty. Your `onSubmit` handler runs, and `submitter` is that button. If you do not use `onSubmit`, the browser submits the form. When a draft submit starts while a normal submit waits for an async check, only the draft submit runs, so `onSubmit` runs one time. Other submit buttons in the form still validate. A `novalidate` attribute on the form does not turn off Form validation.

  Errors that you show with `validate()` now go away when the user fixes the field. This works for `validate({ names, reveal: true })` and for errors that you show with `errorVisibility="manual"`. These fields now check again on the `revalidationTiming` schedule, the same as after a submit. This helps a multi-step form that checks one step when the user clicks "Next". `resetValidation()` and a form reset put the fields back on the `validationTiming` schedule.

  An async field check, such as a username lookup, no longer gets lost when the user edits another field before the check finishes.

- A Select with `required` now stops a plain HTML form from submitting when no option is selected. Before, the empty form submitted. Now the browser shows its message next to the Select and puts focus on the Select button. A Select without `required` still lets the Enter key submit the form as before.

  In a Starwind Form, a required Select or Radio Group can be the first field with an error. On submit, or when you call `form.validate({ focus: true })`, focus now goes to the Select button or to a radio, and the page scrolls to it. Before, focus did not go to any control that the user could see. A Radio Group puts focus on its checked radio when one is checked.

  In Astro, a required Checkbox or Radio in a plain HTML form now shows the browser message and gets focus. Before, the form did not submit, and no message showed. In all frameworks, when the browser flags a Checkbox, Radio, or Switch as invalid, focus now goes to the control that the user sees.

  Checkbox and Radio now get their name from a `<label for="...">` that points at their `id`. Before, screen readers read these controls with no name.

- In `astro dev`, components no longer start two times when your own scripts import from `@starwind-ui/runtime`. For example, a script could import `createForm` from `@starwind-ui/runtime/form`. Vite could then load Starwind two times, and each copy started the same components. A page with Form, Field, and RadioGroup could freeze. A Slider or Select could send `starwind:value-change` two times for one change, and Form validators could run two times. The page could also stay unable to scroll after you picked a Select option or closed a Dialog. These problems no longer happen. You do not need to change your Vite config. Production builds were not affected.

  To control a component from your script, call its create function with the component's root element. For example, `createDialog(root).open()` opens a Dialog. When Starwind already started that component, the function gives you the running component and ignores the options that you pass. Set options with component props or data attributes instead. `createForm` is different: it applies the options that you pass, such as `onSubmit` and validators, to the form on the page.

- Updated dependencies
  - @starwind-ui/runtime@1.4.0

## 1.3.0

### Minor Changes

- Fixed Color Picker form resets in React and Vue. Canceling a reset now keeps the selected color and format, and a pending reset no longer overwrites a newer selection or slider change.

  For custom Runtime integrations, the new `stateSync` subscription lets you update your UI after a form reset finishes without firing a user-change event.

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
- Reduced background work on React pages with multiple menus, tooltips, or other components that use portals. These components now share the work of watching for changes to the page.
- Reduced the JavaScript loaded by form controls used without Field, including Checkbox and Select. Controls still connect to Field when it is used.

  In React 18, removing a Portal now releases references to its removed popup elements while the parent component stays mounted.

  React Color Picker now avoids rebuilding its controls when only the selected color changes. It still connects controls that your app adds or replaces.

- React Select keeps its current selection when a form reset is canceled. A pending reset also preserves any newer value set by the user or app.

  Keep Select in the same form until a pending reset finishes. Moving it to another form during that reset is outside the supported behavior.

- Fixed CLI installs that omitted files or packages required by a component. Existing component APIs remain unchanged.
- Scroll Area now supports `autoViewport` in every framework. It defaults to `true`; set it to `false` to supply your own viewport and content parts. Color Picker channel sliders support `step` to set the amount each keyboard action changes the value. Menu and Context Menu submenu triggers accept an optional icon slot.

  Fixed Svelte Color Picker popup styling and clicks inside native dialogs.

  Keep custom portal targets for Color Picker controls inside the picker root so input changes reach the picker.

  Popover now preserves the `data-slot` set by components such as Color Picker, so their styles continue to apply.

- Fixed toasts skipping their entrance animation or leaving incorrect spacing when updated immediately, including when a promise resolves. Closing a toast also cancels any remaining entrance animation work.
- Updated dependencies
  - @starwind-ui/runtime@1.3.0

## 1.2.1

### Patch Changes

- Select, Combobox, and Menu groups now get their name from their visible heading, so screen readers announce the group. The Tabs indicator now lines up with the selected tab when a parent element is scaled. Astro, React, and Vue get these fixes, and the CLI delivers them to installed components. The Vue package stays on its beta release channel.
- Internal maintenance. Removed unused internal portal methods and old CLI helpers. Components work the same way, and the component files that the CLI installs do not change.
- Updated dependencies
  - @starwind-ui/runtime@1.2.1

## 1.2.0

### Minor Changes

- Portals now place popups in the same way every time, in every framework. React places its portal popups itself. In Astro, Starwind still moves popups into place on the page. Each Dialog now has one top layer for all of the popups inside it, such as menus and tooltips.
- Astro overlay portals, such as `PopoverPortal`, now accept optional `container` and `disabled` props, and they show their placement in data attributes. `container` sets the element that holds the popup. `disabled` keeps the popup in place. Runtime also has a new shared step that each framework uses to tell when a portal has reached its target element.

### Patch Changes

- Updated dependencies
  - @starwind-ui/runtime@1.2.0

## 1.1.0

### Patch Changes

- Improved the package details on npm. The READMEs now tell more clearly what each package does.
- Updated dependencies
  - @starwind-ui/runtime@1.1.0

## 1.0.0

### Major Changes

- First stable release of the Starwind Runtime packages for Astro and React.

### Minor Changes

- Button now adds its script only to a native `<button>` that sets `focusableWhenDisabled`. A plain button, enabled or disabled, uses only HTML. In Astro and React, a `focusableWhenDisabled` button can now change between enabled and disabled and keep focus. Button Runtime now supports native buttons only. The docs and the Primitive files that the CLI copies are updated to match.
- Changed the Form validation timing options. `validationTiming` sets when fields check before the first submit, and `revalidationTiming` sets when they check after it. Form also has new methods to validate fields, show errors, reset validation, and set errors from outside the form, such as server errors. The Astro and React packages and the Primitive files that the CLI copies include these changes.

  To update from the beta: the old `input` timing and the old `change` timing both become `change`. The old `change` timing ran only after the user finished a change. The new `change` runs on every accepted change to the value. A timing that runs only after the user finishes a change is no longer available. The defaults stay the same: validation on `submit`, revalidation on `change`, and errors shown on `submit`. After the first submit, `revalidationTiming` replaces `validationTiming`. The two no longer add together.

- First public release of Starwind Runtime, with Astro and React Primitive packages that always release together with the same version.

  Component behavior now lives in Runtime, which works with any framework. The Astro and React Primitive packages connect that behavior to each framework. This release also makes these areas more reliable: cleanup when a component is removed, cleanup after client-side navigation, callback refs, the Theme setting that applies before the first paint, and highlighting in large option lists.

- Added Color Picker to Runtime and to the Astro and React Primitive packages. It includes popup positioning, format controls, inputs for each color channel, swatches, keyboard support, and form support. When you drag the color area down to black, the picker keeps the saturation that you picked. The thumb stays under the pointer, and the color comes back when the brightness goes up. The Clear button stays hidden and disabled until you allow empty values on the root.

### Patch Changes

- You can now cancel an Accordion value change from its change event. When Accordion manages its own value, a canceled change does not open or close any item.
- Accordions now let you close the open item by default. To keep one item open at all times, set `collapsible={false}`.
- Avatar images now work with the browser's lazy loading. Starwind still hides an image while it loads and when it fails to load. This includes Astro images from imported assets.
- Fixed the React Color Picker source code and the props that Astro Spinner passes to its SVG. With default options, `starwind init` now detects Astro and React projects. `starwind remove` has a new option to run without questions. Before each release, new tests now install the packed Astro and React packages with each supported framework version and package manager.
- Checkbox Group now goes back to its starting selection when its form resets. This works when your app controls the value and when the group manages it. It also works when the form is outside the group, and when the group moves to another form. Starwind removes its reset listeners when the group is removed.
- Fixed keyboard focus in a Radio Group that your app controls. When the user presses an arrow key, focus now follows the value that your app sets. If your app keeps the old value or sets another one, focus does not stay on the radio that the user tried to select.
- Popups inside a native modal Dialog, such as menus and tooltips, now show above the Dialog and respond to clicks. This applies to Runtime, Astro, React, and components that you install with the CLI.
- Dialog and Sheet now play their full opening animation, both after a quick click and when you hold the trigger down.
- Fixed the React Checkbox indicator in the Primitive files that the CLI copies into your project. The indicator now renders when the checkbox is checked or when you keep it mounted. It does not render when it is inactive or hidden.
- The styled Color Picker area now stays usable on small screens. It keeps a minimum height. Its Popover opens on the side with the most space, and the content scrolls when neither side has enough space. The Astro and React Popover Primitives now let you use this collision setting. In the CLI, the styled Color Picker version continues from the versions of the older Color Picker.
- Dialog, Alert Dialog, and Sheet now play their full opening animation, even when the page is busy.
- A popup now closes when you click inside its component's root element but outside its trigger and popup. A click in a nested popup still keeps the parent open. This fixes Color Picker Popover closing in Astro and React. Other popups, such as Select, Menu, and Tooltip, now follow the same rule.
- Fixed nested Accordions. Each Accordion now finds, renders, and opens only its own items. The items of an Accordion inside it are no longer affected.
- Submenus now stay open while you move the pointer into a nested submenu.
- React Select now picks up a value that code sets without a change event. Because of this, the Color Picker format control shows its set format, with the selected style, before anyone uses it. The CLI includes the fixed React Select Primitive files.
- Fixed React Select items with an empty label in the Primitive files that the CLI copies into your project. An item with an empty label now keeps that empty label. Its value is still sent with the form while the list is closed.
- Slider now goes back to its starting value when its form resets, if the Slider manages its own value. A value that your app controls stays as your app set it. The thumb, the other parts on the page, and the value sent with the form all match the Slider value.
- Navigation Menu now updates its items and lists when you add, remove, or move them on the page.
- Fixed Navigation Menu popups when you set your own portal target. The popup now stays in the target element that you set while that element is on the page. Navigation Menus inside a Dialog, nested Dialogs, and the default placement in the page body still work as before.
- Fixed an open element that could stay in its starting animation style. If the element was shown again before the next animation frame, its starting style was not removed. Now it is removed on the next frame.
- You can now cancel a Radio or Radio Group change before it applies. The Astro and React packages get only the changes that apply. Values that your app controls and values that Radio manages now stay correct after a form reset.
- `starwind init` now sets up Vite React, Next.js App Router, and TanStack Start projects to match each framework. It keeps React client boundaries in place, and it adds a theme setup that works with server rendering.
- A change that you can cancel now gives the same `details` object to the callback and to the DOM event. The callback runs first, then the DOM event. The component changes only if neither one canceled the change. In React, you can still cancel a change before it applies, and React gets only the changes that apply. You can cancel React Combobox commands, and React Switch keeps its connection to its native form. The CLI copies the fixed React Primitive files into your project.
- Input OTP inside a Field now keeps the default value that you set after a form reset, if Input OTP manages its own value.
- Combobox and Navigation Menu inside a Dialog now work with a portal target that you set. If that target is outside the open Dialog, the popup stays inside the Dialog.
- Slider now sends a notice when Runtime changes its value without a user action, such as when it corrects a value or resets with its form. The framework packages then read the new value from Runtime. They no longer need their own copy of the form reset code.
- Toast calls such as `toast()` now keep working when you remove a newer Toaster. The calls go back to the Toaster that is still on the page.
- React Toggle Group now exports `ToggleGroupContext` and `useToggleGroupContext`. Components inside a Toggle Group can read the group's current state from this context.
- Updated dependencies
  - @starwind-ui/runtime@1.0.0

## 0.1.0-beta.8

### Patch Changes

- React Select now picks up a value that code sets without a change event. Because of this, the Color Picker format control shows its set format, with the selected style, before anyone uses it. The CLI includes the fixed React Select Primitive files.
- `starwind init` now sets up Vite React, Next.js App Router, and TanStack Start projects to match each framework. It keeps React client boundaries in place, and it adds a theme setup that works with server rendering.
- A change that you can cancel now gives the same `details` object to the callback and to the DOM event. The callback runs first, then the DOM event. The component changes only if neither one canceled the change. In React, you can still cancel a change before it applies, and React gets only the changes that apply. You can cancel React Combobox commands, and React Switch keeps its connection to its native form. The CLI copies the fixed React Primitive files into your project.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.8

## 0.1.0-beta.7

### Patch Changes

- Fixed the React Color Picker source code and the props that Astro Spinner passes to its SVG. With default options, `starwind init` now detects Astro and React projects. `starwind remove` has a new option to run without questions. Before each release, new tests now install the packed Astro and React packages with each supported framework version and package manager.
- Navigation Menu now updates its items and lists when you add, remove, or move them on the page.
- Fixed Navigation Menu popups when you set your own portal target. The popup now stays in the target element that you set while that element is on the page. Navigation Menus inside a Dialog, nested Dialogs, and the default placement in the page body still work as before.
- Fixed an open element that could stay in its starting animation style. If the element was shown again before the next animation frame, its starting style was not removed. Now it is removed on the next frame.
- Input OTP inside a Field now keeps the default value that you set after a form reset, if Input OTP manages its own value.
- Combobox and Navigation Menu inside a Dialog now work with a portal target that you set. If that target is outside the open Dialog, the popup stays inside the Dialog.
- Toast calls such as `toast()` now keep working when you remove a newer Toaster. The calls go back to the Toaster that is still on the page.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- Fixed the React Checkbox indicator in the Primitive files that the CLI copies into your project. The indicator now renders when the checkbox is checked or when you keep it mounted. It does not render when it is inactive or hidden.
- Fixed nested Accordions. Each Accordion now finds, renders, and opens only its own items. The items of an Accordion inside it are no longer affected.
- Fixed React Select items with an empty label in the Primitive files that the CLI copies into your project. An item with an empty label now keeps that empty label. Its value is still sent with the form while the list is closed.
- Slider now goes back to its starting value when its form resets, if the Slider manages its own value. A value that your app controls stays as your app set it. The thumb, the other parts on the page, and the value sent with the form all match the Slider value.
- Slider now sends a notice when Runtime changes its value without a user action, such as when it corrects a value or resets with its form. The framework packages then read the new value from Runtime. They no longer need their own copy of the form reset code.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.6

## 0.1.0-beta.5

### Patch Changes

- You can now cancel an Accordion value change from its change event. When Accordion manages its own value, a canceled change does not open or close any item.
- Checkbox Group now goes back to its starting selection when its form resets. This works when your app controls the value and when the group manages it. It also works when the form is outside the group, and when the group moves to another form. Starwind removes its reset listeners when the group is removed.
- Fixed keyboard focus in a Radio Group that your app controls. When the user presses an arrow key, focus now follows the value that your app sets. If your app keeps the old value or sets another one, focus does not stay on the radio that the user tried to select.
- You can now cancel a Radio or Radio Group change before it applies. The Astro and React packages get only the changes that apply. Values that your app controls and values that Radio manages now stay correct after a form reset.
- React Toggle Group now exports `ToggleGroupContext` and `useToggleGroupContext`. Components inside a Toggle Group can read the group's current state from this context.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.5

## 0.1.0-beta.4

### Minor Changes

- Changed the Form validation timing options. `validationTiming` sets when fields check before the first submit, and `revalidationTiming` sets when they check after it. Form also has new methods to validate fields, show errors, reset validation, and set errors from outside the form, such as server errors. The Astro and React packages and the Primitive files that the CLI copies include these changes.

  To update from the beta: the old `input` timing and the old `change` timing both become `change`. The old `change` timing ran only after the user finished a change. The new `change` runs on every accepted change to the value. A timing that runs only after the user finishes a change is no longer available. The defaults stay the same: validation on `submit`, revalidation on `change`, and errors shown on `submit`. After the first submit, `revalidationTiming` replaces `validationTiming`. The two no longer add together.

### Patch Changes

- Avatar images now work with the browser's lazy loading. Starwind still hides an image while it loads and when it fails to load. This includes Astro images from imported assets.
- Popups inside a native modal Dialog, such as menus and tooltips, now show above the Dialog and respond to clicks. This applies to Runtime, Astro, React, and components that you install with the CLI.
- The styled Color Picker area now stays usable on small screens. It keeps a minimum height. Its Popover opens on the side with the most space, and the content scrolls when neither side has enough space. The Astro and React Popover Primitives now let you use this collision setting. In the CLI, the styled Color Picker version continues from the versions of the older Color Picker.
- Dialog, Alert Dialog, and Sheet now play their full opening animation, even when the page is busy.
- A popup now closes when you click inside its component's root element but outside its trigger and popup. A click in a nested popup still keeps the parent open. This fixes Color Picker Popover closing in Astro and React. Other popups, such as Select, Menu, and Tooltip, now follow the same rule.
- Submenus now stay open while you move the pointer into a nested submenu.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.4

## 0.1.0-beta.3

### Patch Changes

- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.3

## 0.1.0-beta.2

### Minor Changes

- Button now adds its script only to a native `<button>` that sets `focusableWhenDisabled`. A plain button, enabled or disabled, uses only HTML. In Astro and React, a `focusableWhenDisabled` button can now change between enabled and disabled and keep focus. Button Runtime now supports native buttons only. The docs and the Primitive files that the CLI copies are updated to match.
- Added Color Picker to Runtime and to the Astro and React Primitive packages. It includes popup positioning, format controls, inputs for each color channel, swatches, keyboard support, and form support. When you drag the color area down to black, the picker keeps the saturation that you picked. The thumb stays under the pointer, and the color comes back when the brightness goes up. The Clear button stays hidden and disabled until you allow empty values on the root.

### Patch Changes

- Accordions now let you close the open item by default. To keep one item open at all times, set `collapsible={false}`.
- Dialog and Sheet now play their full opening animation, both after a quick click and when you hold the trigger down.
- Updated dependencies
  - @starwind-ui/runtime@0.1.0-beta.2

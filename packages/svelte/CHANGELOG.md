# @starwind-ui/svelte

## 0.3.0

### Minor Changes

- Svelte components now follow a parent value the same way React and Vue do. If you pass a defined value when the component mounts, your state owns that value while the component stays mounted. This applies to `open`, `value`, `checked`, and the other model props on Accordion, Alert Dialog, Checkbox, Checkbox Group, Collapsible, Color Picker, Combobox, Context Menu, Dialog, Drawer, Field, Input, Input OTP, Menu, Navigation Menu, Popover, Hover Card, Radio, Radio Group, Select, Sidebar, Slider, Switch, Tabs, Toggle, Toggle Group, and Tooltip. A form reset keeps your value. If you pass `undefined` at mount, the component keeps its own state, and a form reset returns it to its default.

  If you pass a one-way prop such as `open={open}` and expect the component to change on its own, use `bind:open={open}` or update your state in the change callback. `bind:` keeps working with no change.

  Checkbox Group, Toggle Group, Accordion, and Input now follow `push()` and `splice()` on a `$state` array, through `bind:value` or `value`.

  If a prop starts as `undefined` and gets a value later, the component keeps its own state and applies the new value when it arrives. Edits made after that stay until your state sets another value. Before, each Input edit went back to the supplied value, and a Combobox or Sidebar went back to that value when another model on the same component changed, such as `bind:open`.

  A Combobox that gets its props through a spread, such as `{...props}`, now shows the new label when your state changes `value`. Before, the text field kept the old label while the form sent the new value.

  Fixed a bound Slider that reset to 0. The first render of Navigation Menu now follows the initial value.

- Removed Svelte APIs that no other framework has:
  - Select no longer exports `show`, `close`, or `updatePosition`.
  - The `children` snippet on Alert Dialog, Collapsible, Context Menu, Dialog, Drawer, Menu, Popover, Hover Card, and Tooltip roots no longer receives `open`.
  - Primitive `Sidebar.MenuButton` no longer takes `href`.
  - Navigation Menu `Popup` no longer takes `side` or `align`.

  If you use one of these, update your code. Use `bind:open` or `bind:value` in place of the Select methods and the snippet `open` argument. Use the `child` snippet to render a link from `Sidebar.MenuButton`. Styled `SidebarMenuButton` keeps `href`. Move `side` and `align` to Navigation Menu `Positioner`.

- Svelte Tooltip, Popover, and Navigation Menu triggers now accept a link in `child`. These triggers already worked on a link, but they warned in development, type checks rejected the link, and `ref` did not run. Now the warning is gone and `ref` receives the link. Use the new `TriggerChildPayload` type for your snippet. Snippets typed with `ButtonChildPayload` keep working.

  Svelte `Menu.Trigger`, `Select.Trigger`, `Combobox.Trigger`, and `Combobox.Clear` still need a button in `child`. With another element, these controls do nothing. They now log a console error in production as well as in development, so you can find the cause.

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

- Fixed several Svelte components so that they match React and Vue:
  - Tooltip now opens on a native link or span.
  - `Combobox.Root` now renders option attributes such as `data-modal` and `data-filter-mode`, and its first render shows the open state.
  - The Primitive `Combobox.Clear` no longer adds an English `aria-label`. Set your own label.
  - Textarea and Input Group Textarea now keep your value after a form reset. Before, the field went blank and `bind:value` received `""`. A Textarea with `defaultValue` still resets to that default.
  - Color Picker with `formats` and no `format` now starts on the first listed format. Before, it added a HEX option to the list.
  - The Scroll Area viewport no longer adds `!important` to its `overflow` style, so your own `style="overflow: hidden !important"` on the viewport now applies.
  - `Menu.Item` and `Menu.LinkItem` render `data-close-on-click` only when you change the default. If your CSS or tests read `data-close-on-click="true"` on a default `Menu.Item`, update them.

- Fixed Tooltip and Hover Card in Vue and Svelte staying hidden when their popup is replaced while open, for example when the `key` on the content changes.
- Updated dependencies
  - @starwind-ui/runtime@1.5.0

## 0.2.0

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

- Fixed form reset in Svelte apps that render on the server. Before, a reset after the page hydrated cleared Checkbox, Switch, and Input. Now a reset puts Checkbox and Switch back to their default checked state. Input goes back to its default value, and so do Field controls that use Input.
- Updated dependencies
  - @starwind-ui/runtime@1.4.0

## 0.1.0

### Minor Changes

- React, Vue, and Svelte Form components now support validation settings, server errors, and options for when errors appear. You can use synchronous or asynchronous validators and configure submission and reset behavior through component props.
- Added Svelte 5 support as a public beta. Install the `@starwind-ui/svelte` package or use the Starwind CLI to add Svelte components. Supports Svelte 5.29 and newer versions before Svelte 6, with setup for Vite, SvelteKit, and Astro projects.
- Tabs now supports CSS entrance and exit animations. Panels stay visible until their exit animation finishes, while inactive content stops accepting keyboard focus and clicks. Use `data-starting-style` and `data-ending-style` to style the animations.

  When your code changes the selected tab, pressing Tab to enter the tab list now focuses that tab. Focus stays in place while someone is already navigating the list.

### Patch Changes

- Fixed Select labels in Vue and Svelte when the selected option's text changes or its option loads after the value is set. The displayed label now updates while the popup is open or closed.
- Fixed CLI installs that omitted files or packages required by a component. Existing component APIs remain unchanged.
- Reduced JavaScript in Svelte Checkbox, Switch, Select, Combobox, Context Menu, and Navigation Menu. Element props, event handlers, and refs keep the same behavior.
- Fixed nested overlays in Svelte dialogs appearing behind their parent or failing to receive clicks. Child overlays now stay above the overlay that opened them.
- Fixed nested overlays in Vue and Svelte, including Select menus appearing behind a Color Picker.

  Nested overlays can now render directly under the document body. If your custom CSS selectors or DOM queries depend on an overlay staying inside its parent, set a portal container or add `data-floating-root` to the element that should contain it. Overlays inside Dialog still use its floating container.

- Updated dependencies
  - @starwind-ui/runtime@1.3.0

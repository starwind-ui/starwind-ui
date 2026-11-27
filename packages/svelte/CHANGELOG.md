# @starwind-ui/svelte

## 1.6.0

### Minor Changes

- Add the Chart Primitive at `@starwind-ui/<framework>/chart`. Put chart parts inside `Chart.Root` with your `data` and `config`: `Chart.Bar`, `Chart.Line`, `Chart.Area`, `Chart.Pie`, `Chart.Radar` and `Chart.RadialBar` draw the values, and `Chart.XAxis`, `Chart.YAxis`, `Chart.Grid`, `Chart.PolarGrid`, `Chart.PolarAngleAxis` and `Chart.Label` add axes, grid lines and center text. `Chart.LinearGradient` adds gradient fills. Compose the surface, tooltip and legend parts in the same root. The parts and props are the same in Astro, React, Vue and Svelte.

  The parts take the props of common shadcn/ui examples, such as `label` on the mark parts in place of a nested `LabelList`, four corner radii on `Chart.Bar`, `stackOffset="expand"` on `Chart.Root` and `cursor={false}` on `Chart.Tooltip`. The legend lists only the series that the chart draws.

  `tickFormatter`, `formatter` and `labelFormatter` take a `ChartFormat` object in every framework. React, Vue and Svelte also take functions. `{ configLabel: true }` shows the config label of a value. In Astro, functions cannot reach the browser, so use a format object or put the function in a chart module.

  For a chart that the parts cannot draw, pass a chart module to the `chart` prop. Install `@tanstack/charts` in your app to write chart modules.

- Components now follow HTML direction in Astro, React, Vue 3.5 and Svelte 5.29+. In RTL, horizontal arrow keys, Slider, Carousel and popups follow the direction of the element that contains the component. A popup that renders in a portal copies that direction while it is open. `side="left"` and `side="right"` still mean the physical side. Form values do not change with direction.

  Primitive Menu submenus still default to `side="bottom"`. Styled Dropdown and Context Menu submenus now open toward the reading end.

  Slider now sets `inset-inline-start` on the thumb and indicator in place of `left`. If your CSS animates or overrides `left` on these parts, or a script reads `style.left`, use `inset-inline-start`.

  Set `dir` on the page or on the element that contains the component. The Styled stylesheet steps are in the `starwind` release notes and the [RTL guide](https://starwind.dev/docs/getting-started/rtl/).

  In RTL apps, change padding meant for the reading edge to logical utilities, such as `pl-6` to `ps-6`. Remove your own RTL workarounds that the components now handle.

  Components read the direction when the user interacts with them. If your app changes `dir` after the page loads, run `document.dispatchEvent(new Event("starwind:direction-change"))` after the change. The components on the page then update, open popups included. Without the event, each component uses the new direction at its next interaction.

  Thanks @SalahAdDin for reporting [#283](https://github.com/starwind-ui/starwind-ui/issues/283) and starting this work in [#290](https://github.com/starwind-ui/starwind-ui/pull/290).

- The Svelte Alert Dialog package export `getAlertDialogControlRefresh` is removed. It is replaced by `__useAlertDialogControl()`, the same helper name that React and Vue use. In Svelte, it returns an attachment that you spread on the control element.

  Copied Styled `AlertDialogAction.svelte` and `AlertDialogCancel.svelte` files from an older release import the removed export. When you update `@starwind-ui/svelte`, run `starwind update alert-dialog` in the same step. If you keep your own copies, change the import to `__useAlertDialogControl` and delete the old `createAttachmentKey` block. Call the helper once in the component script, then spread the result on the button. Keep the `data-sw-alert-dialog-close` attribute, because the dialog uses it to find the button that closes it:

  ```svelte
  <script lang="ts">
    const controlAttachment = __useAlertDialogControl();
  </script>

  <Button data-sw-alert-dialog-close {...controlAttachment}>Continue</Button>
  ```

- Removed the snippet arguments that only Svelte passed to child content. These snippets now receive no arguments:
  - `children` on the Navigation Menu, Slider, Tabs, and Accordion roots.
  - `children` on `Tabs.Tab` and `Tabs.Panel`, which received `active`.
  - `children` on `Select.Value`, which received `label` and `value`.
  - `children` on the Styled `NavigationMenu` and `SelectValue`.

  If you read the root value from a snippet argument, use `bind:value` on the root instead.

  If you read `active` in a Tab or Panel snippet, style with the `data-state="active"` attribute, or compare the Tabs `bind:value` with the item value.

  If you read `label` or `value` in a `Select.Value` snippet, use `bind:value` on the Select root and find the label from that value. Leave `Select.Value` empty to show the selected label.

  Update copied Styled `NavigationMenu.svelte` and `SelectValue.svelte` files with `starwind update navigation-menu select`. The old files pass the removed arguments.

- The Svelte `SidebarContextValue` type no longer has `isMobile` or `setMobileOpen()`. It now has the same members as the React type.

  If you called `setMobileOpen()`, use `bind:mobileOpen` on `SidebarProvider` to open or close the mobile sidebar.

  If you read `isMobile`, use your own media query to know if the viewport is mobile, such as `matchMedia()` with the query you pass to `mobileQuery`.

- Vue and Svelte no longer export internal context keys and members that only the Primitive parts use. The public API now matches React.

  Vue:
  - `DialogContext`, `AlertDialogContext` and `DrawerContext` are removed.
  - `SelectContextValue` no longer has `element`, `mounted`, `requestRefresh()` or `registerPortal()`.
  - `ComboboxContextValue` no longer has `element`, `mounted` or `registerPortal()`.
  - `TabsContextValue` no longer has `refresh()`.

  Svelte:
  - `CheckboxGroupContext` and `CheckboxGroupContextValue` are removed from `@starwind-ui/svelte/checkbox` and from `@starwind-ui/svelte`. Use the checkbox group components to group checkboxes.
  - `SelectContextValue` no longer has `mounted`, `registerTrigger()` or `registerPortal()`.

  The state fields stay, for example `open`, `value` and `disabled`. If your code imports a removed key or calls a removed member, delete that code. The parts get these values from their Root.

- In Vue and Svelte, `useSidebarContext()` now returns `null` outside a `SidebarProvider`, as in React. Before, it threw an error. `Sidebar`, `SidebarTrigger`, `SidebarRail`, and `SidebarMenuButton` now render outside a Provider in the expanded state, with `aria-expanded="false"` on the trigger and rail.

  If you call `useSidebarContext()`, check for `null` before you read its fields.

- `@starwind-ui/vue` and `@starwind-ui/svelte` are now stable. They leave the public beta and release together with `@starwind-ui/runtime`, `@starwind-ui/astro` and `@starwind-ui/react`, starting at 1.6.0. From now on they publish on the `latest` npm tag, and each version depends on the exact `@starwind-ui/runtime` version of the same release. The `beta` tag points to the stable version, so an install command with `@beta` from an older guide gets the stable package.

  If you used the beta:
  - Replace `@starwind-ui/vue@beta` and `@starwind-ui/svelte@beta` in your install commands and scripts with the plain package name.
  - In Vue, upgrade `vue` to 3.5.21 or newer in the same step.
  - Run `starwind update` to update your copied Styled components.
  - Run `starwind primitives update --all` to update your vendored Primitive files.
  - Check the removed exports and context members in these release notes, and the [earlier beta API changes](https://starwind.dev/blog/starwind-ui-3-6/#removed-beta-only-apis), before you update.

### Patch Changes

- A click during a popup's close animation now goes to the page below the popup. Before, the closing popup caught the click until it was hidden, so a quick click on a trigger or button under it did nothing. Buttons and links inside the closing popup also let the click through, even when they set their own `pointer-events`. This applies to Popover, Color Picker, Tooltip, Preview Card (Styled Hover Card), Menu (Styled Dropdown), Context Menu, Select, Combobox, Navigation Menu, and Styled Sidebar tooltips. When you close a Popover, Menu, Context Menu or Select with focus inside it, or a Navigation Menu with Escape, focus goes back to the trigger as the close starts. The closing popup takes no keyboard input until it hides. A popup that opens again during its close animation takes clicks again at once. An `inert` attribute that your app sets on the popup or its positioner stays as you set it. An optional Popover or Preview Card backdrop still covers the page until it is hidden.

  If an end-to-end test types into a popup right after it closes the popup, change the test to open the popup again before it types.

- Color Picker in a popup now stays open when you press Escape to cancel an edit. Before, if you typed in the value input or a channel input and then pressed Escape, the input went back to the current color and the popup also closed. Now the first Escape only restores the input, and focus stays in it. Press Escape again to close the popup.

  An inline Color Picker inside a Dialog no longer blocks Escape. Before, pressing Escape in its value input or a channel input kept the Dialog open even with nothing to cancel. Now Escape closes the Dialog when the input holds no edit.

- Primitive parts now print the same attributes in Astro, React, Vue and Svelte. If your CSS or tests select these attributes, check the changes below.
  - A `data-default-*` attribute now shows only the `default*` prop that the part got when it mounted. It no longer follows the current value. For example, a Toggle with both `pressed` and `defaultPressed` now prints `data-default-pressed` in Astro, React and Vue, and Menu checkbox and radio items keep their first marker after the user changes them.
  - In Svelte, Popover, Menu, Context Menu, Select and Combobox take these attributes from their `default*` props, and they leave out `data-open-on-hover` and `data-close-on-click` when the value is `false`.
  - In Vue and Svelte, Menu prints `data-open-on-hover="true"` in place of an empty value. A presence selector such as `[data-open-on-hover]` still matches.
  - In Svelte, the server HTML of Navigation Menu, Select and Combobox now matches the other frameworks. Navigation Menu Root prints `data-default-value`. An enabled Select Trigger leaves out `aria-disabled` until it mounts. A disabled Combobox Trigger and Clear print `aria-disabled="true"`, and the Combobox Trigger prints `data-state`.
  - In Svelte, Field parts no longer print a default `data-slot`. If your selectors use it, pass `data-slot` to the part. `Form.Root` prints its validation timing attributes only when you set the matching props.
  - In Svelte, Avatar `onLoadingStatusChange` now runs before listeners on ancestor elements, as in the other frameworks.

- Each package now includes Markdown docs that match its installed version. Open `node_modules/<package>/docs/README.md`, or point a coding agent at `docs/llms.txt` in the same folder.

  Runtime docs cover `initStarwind`, raw HTML setup, theme helpers, and a page for every controller. The Astro, React, Vue, and Svelte docs have a page for every Primitive. Each page uses that framework's imports and syntax. Vue pages list `v-model` bindings and events, and Svelte pages list `bind:` props and callbacks. Callback rows show the full signature, for example `(value, details) => void`. The Field page lists the `Field.Control` props, and the Preview Card page lists the Trigger delay props. Component behavior and the public API are unchanged.

- Slider, Input OTP, and Color Picker now show a value that the parent sets after the first render. This applies when `value` starts as `undefined` and gets a value later. Before, React and Vue ignored that value. An in-range value does not fire a change callback, a change event, or a model update. If the Runtime corrects the value, for example a Slider value above `max`, Vue `v-model` and Svelte `bind:value` receive the corrected value, so your state matches what the user sees.

  After that late value, a one-way parent that renders again with the same old value no longer undoes the user's last change. This also fixes Svelte Slider, where a later render undid a key press.

  Svelte Color Picker now compares colors by value. A new color object with the same color, for example from `parseColor()` on each render, no longer resets the picker.

  Vue Slider no longer sends an old value to `v-model` after the parent sets a new one.

  React Input OTP with a parent-held `value` now goes back to the parent value when the parent refuses a change. Before, the refused text stayed in the input and in form data.

- Escape on a submenu trigger now closes only the open submenu in Menu, Dropdown, and Context Menu. Before, when you opened a submenu with the pointer and pressed Escape, the whole menu closed. Focus now stays on the submenu trigger. Press Escape again to close the menu.
- Tooltip and Navigation Menu now stay on screen when their trigger is at the edge of the screen, for example on a phone. Before, the popup kept its alignment, so part of it went off screen. Now the popup moves along its trigger until it is inside the viewport padding. It stays next to the trigger and keeps its side. This also applies to Styled Sidebar tooltips.

  The Styled Tooltip arrow now points at the center of the trigger for every `align` value. It stays inside the popup and away from its rounded corners. When the trigger is too narrow or partly off screen, the arrow points at the nearest part of the trigger that it can reach.

  The Primitive Tooltip arrow and the Primitive Navigation Menu arrow get the same placement when the arrow has a width and a height. The positioner sets `--sw-floating-arrow-x` for a top or bottom side and `--sw-floating-arrow-y` for a left or right side. Each value is the distance from the left or top edge of the popup to the same edge of the arrow, in RTL too. To use it, position a custom arrow absolutely inside the popup, set `left: var(--sw-floating-arrow-x)` or `top: var(--sw-floating-arrow-y)`, and remove any centering transform on that axis.

  Styled Navigation Menu content with no set width now takes the width of its links. Before, it filled the full width of the screen. This content is never wider than the screen minus 2rem. To set a width, add a width class to `NavigationMenuContent`.

- Escape in a Select or Combobox inside a Popover now closes only that inner list. Before, when focus was on the inner trigger or input, the same Escape also closed the Popover. In React, Vue, and Svelte, this closed the whole Color Picker popup when you pressed Escape on its open format list. Press Escape again to close the Popover.
- Popover, Navigation Menu, and Combobox now return focus to the trigger or input without scrolling the page. Before, in Safari, closing one of them after you scrolled could make the page jump back to the trigger. Combobox does this when it closes with Escape or an item press.
- Combobox, Select, Menu (Styled Dropdown) and Context Menu now close when you press Tab right after the click that opened them. Before, a fast Tab after the click moved focus out of the popup, but the popup stayed open.

  In React and Vue, a Navigation Menu with a `defaultValue` no longer opens again after the user closes it and a prop on its Root changes.

  In a Menu or Context Menu radio group with no `value` or `defaultValue`, an explicit `aria-checked` on a radio item now decides its first state. Before, an item with `aria-checked="false"` and `defaultChecked` could take the group value from a later checked item.

- Svelte Input no longer clears the text that the user typed when the parent changes another prop, such as `class` or `disabled`. This happened when the Input had no `value` prop or used `bind:value`. `Field.Control` gets the same fix.
- Updated dependencies
  - @starwind-ui/runtime@1.6.0

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

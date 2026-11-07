# starwind

## 3.6.0

### Minor Changes

- `starwind init --framework svelte` in an Astro project now installs and configures `@astrojs/svelte` for you. Before, it stopped and asked you to set up the integration first. The CLI picks the `@astrojs/svelte` version that matches Astro 5, 6, or 7, and adds `svelte` if the project does not have it.

  On Astro 5, `@astrojs/svelte` needs TypeScript in the `^5` range. If your project uses another TypeScript version, `init` stops and tells you to change TypeScript, upgrade Astro, or configure the integration yourself.

  `init` no longer requires `src/layouts/Layout.astro` or `src/layouts/BaseLayout.astro` for Svelte in Astro. Without a named layout, it connects the stylesheet through a page, or tells you which import to add by hand.

- `starwind init` now works on a new SvelteKit 3 project, and on a recent SvelteKit 2 project with no `svelte.config` file. It reads `files.routes` from the `sveltekit()` plugin options. Older SvelteKit 2 projects with a config file keep working.

  `starwind init` now adds the theme script to Vite Vue and Vite Svelte projects, as it does for Vite React. A saved dark theme applies before the first paint.

  `starwind init` now adds the `@` alias to the Vite config and `tsconfig` of a Vite Svelte project.

- The CLI now works without a network connection through the new `@starwind-ui/offline` kit, in
  beta. Install the kit once while you are online with
  `npm install --global @starwind-ui/offline@beta`. Then run
  `starwind-offline init` or `starwind-offline add <component>` with the same options as `starwind`.
  The kit installs packages through your project's own package manager: npm, pnpm, or Yarn 2 or
  later.
  Your lockfile keeps the public npm registry URLs, so later online installs work as usual.

  Install your project's own dependencies, such as Astro, before you work offline. Starwind Pro and
  remote registries still need a network connection.

### Patch Changes

- Fixed Astro components ignoring an attribute that you set when the component already sets the same attribute. For example, your `role` or `aria-label` lost to the component's default, because the browser keeps the first copy of a repeated attribute. Your value now wins, as it does in React.

  Styled Combobox Input Group in Astro now renders `data-slot="combobox-input-group"`, as it does in React.

- Astro Primitive Dialog, Alert Dialog, and Drawer `Trigger` and `Close` parts now accept `asChild`, so you can use your own button inside them. Before, a button child inside one of these parts made a control that did nothing.

  Astro `TooltipTrigger` with plain text and `asChild` now renders a button, so keyboard users can focus it. The Styled `TooltipTrigger` uses `asChild` by default, so this also fixes plain text in the Styled component.

- Astro `Textarea` and `InputGroupTextarea` now show `defaultValue` and `value` as the text in the field. Before, the field was empty. A form reset puts this text back.
- Fixed `starwind init` for Vue on Astro 5 and Astro 6. The CLI installed the newest `@astrojs/vue`, which needs Astro 7, and npm stopped with an `ERESOLVE` error. The CLI now picks the `@astrojs/vue` version that matches your Astro major.

  Fixed `starwind init` on Astro 5 projects with a low declared range such as `"astro": "^5.0.0"` and a current Astro installed. The CLI wrote `experimental.svg`, and `astro build` then failed. The CLI now reads the installed Astro version. This also applies to Svelte on Astro.

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

- Fixed a blank Select trigger in Astro and Vue when `Select.Value` has its own content and no `placeholder`. For example, `<Select.Value>Astro</Select.Value>` now shows "Astro" until a value is chosen, and shows it again when the value clears. React already did this. This also works when the Select starts with a value and clears later.

  Fixed React Select showing the placeholder after a parent refused a pick. The trigger now keeps the label of the parent value, as it does in Vue and Svelte.

- Svelte components now follow a parent value the same way React and Vue do. If you pass a defined value when the component mounts, your state owns that value while the component stays mounted. This applies to `open`, `value`, `checked`, and the other model props on Accordion, Alert Dialog, Checkbox, Checkbox Group, Collapsible, Color Picker, Combobox, Context Menu, Dialog, Drawer, Field, Input, Input OTP, Menu, Navigation Menu, Popover, Hover Card, Radio, Radio Group, Select, Sidebar, Slider, Switch, Tabs, Toggle, Toggle Group, and Tooltip. A form reset keeps your value. If you pass `undefined` at mount, the component keeps its own state, and a form reset returns it to its default.

  If you pass a one-way prop such as `open={open}` and expect the component to change on its own, use `bind:open={open}` or update your state in the change callback. `bind:` keeps working with no change.

  Checkbox Group, Toggle Group, Accordion, and Input now follow `push()` and `splice()` on a `$state` array, through `bind:value` or `value`.

  If a prop starts as `undefined` and gets a value later, the component keeps its own state and applies the new value when it arrives. Edits made after that stay until your state sets another value. Before, each Input edit went back to the supplied value, and a Combobox or Sidebar went back to that value when another model on the same component changed, such as `bind:open`.

  A Combobox that gets its props through a spread, such as `{...props}`, now shows the new label when your state changes `value`. Before, the text field kept the old label while the form sent the new value.

  Fixed a bound Slider that reset to 0. The first render of Navigation Menu now follows the initial value.

- Fixed several Svelte components so that they match React and Vue:
  - Tooltip now opens on a native link or span.
  - `Combobox.Root` now renders option attributes such as `data-modal` and `data-filter-mode`, and its first render shows the open state.
  - The Primitive `Combobox.Clear` no longer adds an English `aria-label`. Set your own label.
  - Textarea and Input Group Textarea now keep your value after a form reset. Before, the field went blank and `bind:value` received `""`. A Textarea with `defaultValue` still resets to that default.
  - Color Picker with `formats` and no `format` now starts on the first listed format. Before, it added a HEX option to the list.
  - The Scroll Area viewport no longer adds `!important` to its `overflow` style, so your own `style="overflow: hidden !important"` on the viewport now applies.
  - `Menu.Item` and `Menu.LinkItem` render `data-close-on-click` only when you change the default. If your CSS or tests read `data-close-on-click="true"` on a default `Menu.Item`, update them.

- Removed Svelte APIs that no other framework has:
  - Select no longer exports `show`, `close`, or `updatePosition`.
  - The `children` snippet on Alert Dialog, Collapsible, Context Menu, Dialog, Drawer, Menu, Popover, Hover Card, and Tooltip roots no longer receives `open`.
  - Primitive `Sidebar.MenuButton` no longer takes `href`.
  - Navigation Menu `Popup` no longer takes `side` or `align`.

  If you use one of these, update your code. Use `bind:open` or `bind:value` in place of the Select methods and the snippet `open` argument. Use the `child` snippet to render a link from `Sidebar.MenuButton`. Styled `SidebarMenuButton` keeps `href`. Move `side` and `align` to Navigation Menu `Positioner`.

- Svelte Tooltip, Popover, and Navigation Menu triggers now accept a link in `child`. These triggers already worked on a link, but they warned in development, type checks rejected the link, and `ref` did not run. Now the warning is gone and `ref` receives the link. Use the new `TriggerChildPayload` type for your snippet. Snippets typed with `ButtonChildPayload` keep working.

  Svelte `Menu.Trigger`, `Select.Trigger`, `Combobox.Trigger`, and `Combobox.Clear` still need a button in `child`. With another element, these controls do nothing. They now log a console error in production as well as in development, so you can find the cause.

- Removed the undocumented `open`, `close`, `updatePosition`, `getValue`, and `setValue` methods from the template refs of the Vue Menu, Context Menu, Select, Combobox, and Navigation Menu roots. These refs now expose only `element`.

  If you call one of these methods through a template ref, use `v-model` on the root instead. For example, put `v-model:open="open"` on the root and change `menu.value.open()` to `open.value = true`.

- Vue `Slider.Thumb` now accepts `inputRef`, as it does in React and Svelte. Pass a function to receive the hidden range input.
- Fixed several Vue components so that they match React:
  - A Boolean prop that you leave out of a Styled component no longer becomes `false`. The default of the underlying component applies instead.
  - `v-model` now works on Textarea, Native Select, and Input Group Textarea. It waits until IME composition ends, as native `v-model` does.
  - Textarea and Input Group Textarea keep a `v-model` value after a form reset, and they accept `default-value`. With both `v-model` and `default-value`, a reset puts the default into the field and the model, as in Svelte.
  - `Close` parts and `Select.Trigger` with `asChild` now accept a component as the child.
  - Styled `ComboboxTrigger` and `ComboboxClear` with `asChild` accept a child.
  - Styled `TooltipTrigger` with text now renders a working trigger.
  - Tooltip now opens on a native link or span. Collapsible link triggers no longer get `disabled="false"`.
  - Color Picker with `formats` and no `format` now starts on the first listed format. Before, the format selector was blank.
  - Navigation Menu now moves keyboard focus into its content when you use `v-model`.
  - Styled `SelectTrigger` renders `data-size`, and `FieldSeparator` renders `data-content`.
  - `SidebarMenuButton` with `tooltip` keeps `data-slot="sidebar-menu-button"`.
  - `CarouselNext`, `CarouselPrevious`, and `SidebarRail` keep your `aria-label`.
  - `Combobox.Icon` now has `aria-hidden`.

- Fixed Tooltip and Hover Card in Vue and Svelte staying hidden when their popup is replaced while open, for example when the `key` on the content changes.

## 3.5.0

### Minor Changes

- You can now choose Bun with `--package-manager bun` or `-m bun` on `add`, `update`, `migrate`, `primitives add`, `primitives update`, and `setup`. These commands could already detect Bun from a project's lockfile, but they rejected it as an option.
- `starwind update` and `starwind primitives update` now offer to update `@starwind-ui/runtime` if it's in your `package.json` and out of date. Before, it could stay on an older version than your other Starwind packages. Any other Starwind package that is out of date gets updated with it. Use `--yes` to skip the question, or `--dry-run` to see what would change. If you accept and the install fails, the command exits with an error.

  You won't see this offer if `@starwind-ui/runtime` isn't in your `package.json`, or if your project uses a custom component registry. The CLI also leaves it alone if you set its version with `workspace:`, `catalog:`, a tag such as `latest`, or `*`.

### Patch Changes

- Updated the CLI to zod 4.6.7 to fix a high-severity security advisory. Before, validating a very large array could make zod run out of memory. You don't need to change anything.
- Fixed the CLI installing packages with npm in Bun projects. It did not recognize `bun.lock`, the lockfile Bun creates by default since version 1.2. The CLI now uses Bun when it finds `bun.lock` or the older `bun.lockb`. In a project with no lockfile, it also now uses Bun when you run the CLI through Bun.
- Fixed Vue and Svelte projects saving loose Starwind package versions. With npm, the CLI saved `@starwind-ui/vue@0.3.0` as `^0.3.0`. It now saves the exact version with every supported package manager. Ranges for other packages stay as ranges.

  Vue and Svelte components and Primitives that need `@starwind-ui/runtime` now install the same exact Runtime version as their `@starwind-ui/vue` or `@starwind-ui/svelte` package. Before, a later Runtime release could install a second copy of Runtime beside the copy that this package uses.

  If your `package.json` lists one of these packages with a range such as `^1.4.0`, or with a version newer than the one the CLI expects, the next `add` or `update` command that needs the package replaces it with the exact version.

## 3.4.1

### Patch Changes

- In Astro, a Sidebar that starts collapsed no longer opens for a moment when the page loads. Before, a `SidebarProvider` with `defaultOpen={false}` showed the full sidebar first and then animated it closed, so the page content moved. Now the Sidebar is collapsed from the first paint, and the content stays in place. This also works with `collapsible="offcanvas"`.

  The Astro Sidebar and SidebarProvider no longer put the same attribute on an element two times. For example, the Sidebar had two `data-state` attributes.

  Render the Sidebar inside its `SidebarProvider` slot. If you render it before the provider, for example with `Astro.slots.render`, it can show the wrong state until the page script runs.

  If one page has more than one `SidebarProvider` with different `defaultOpen` values, a Sidebar can still show open until the page script runs.

  A state that `persistOpen` saved still loads when the page script runs. To show the saved state on first paint, read the cookie on the server in a page that renders on demand, and pass it to `defaultOpen`:

  ```astro
  ---
  const savedOpen = Astro.cookies.get("starwind-sidebar-open")?.value;
  ---

  <SidebarProvider defaultOpen={savedOpen !== "false"} persistOpen persistenceStorage="cookie">
    <!-- Sidebar and page content -->
  </SidebarProvider>
  ```

- Checkbox now shows a clear mixed state. When you set `indeterminate`, the box fills with the variant color and shows a minus icon. Before, the default variant looked unchecked in light mode, and the other variants showed only a faint check.

  A Switch now gets its name from a `<label for>` that points at its `id`. Before, a Switch without a `label` or `aria-label` prop was always read as "switch", and screen readers ignored the label next to it. The Switch no longer uses "switch" as a fallback name.

  If a Switch has no visible label, give it a `label` prop, an `aria-label`, or a `<label for>` that points at its `id`. Without one of these, screen readers do not announce a name for it.

- A Combobox with `required` now stops a plain HTML form from submitting when no option is selected. Before, the empty form submitted and no message showed. Now the browser shows its message and puts focus in the Combobox input. The list stays closed so it does not cover the message.

  A Combobox without `required` still lets the Enter key submit the form as before.

- Dropzone now tells you when it does not keep a dropped file. Before, if you dropped a PDF on a Dropzone with `accept="image/*"`, nothing happened and no event fired. Now Dropzone rejects dropped files that do not match `accept`. A Dropzone without `multiple` keeps one file and rejects the other dropped files.
  - To get the rejected files, listen for the `starwind:files-reject` event on the Dropzone. In React and Svelte, use `onFilesReject`. In Vue, use `@files-reject`. The event gives you the rejected `files` and the drop `event`.
  - When Dropzone keeps none of the dropped files, the styled Dropzone shows an error border and the root gets a `data-rejected` attribute. The error clears on the next accepted drop, file picker choice, `setFiles` call, or form reset. When a drop keeps some of the files, the event fires but the error border does not show.

  Screen readers do not announce a rejected drop. To tell screen reader users, show a message in a live region when the reject event fires.

- Form now lets a submit button with `formnovalidate` skip validation. For example, a "Save draft" button with `formnovalidate` submits the form while required fields are still empty. Your `onSubmit` handler runs, and `submitter` is that button. If you do not use `onSubmit`, the browser submits the form. When a draft submit starts while a normal submit waits for an async check, only the draft submit runs, so `onSubmit` runs one time. Other submit buttons in the form still validate. A `novalidate` attribute on the form does not turn off Form validation.

  Errors that you show with `validate()` now go away when the user fixes the field. This works for `validate({ names, reveal: true })` and for errors that you show with `errorVisibility="manual"`. These fields now check again on the `revalidationTiming` schedule, the same as after a submit. This helps a multi-step form that checks one step when the user clicks "Next". `resetValidation()` and a form reset put the fields back on the `validationTiming` schedule.

  An async field check, such as a username lookup, no longer gets lost when the user edits another field before the check finishes.

- A Select with `required` now stops a plain HTML form from submitting when no option is selected. Before, the empty form submitted. Now the browser shows its message next to the Select and puts focus on the Select button. A Select without `required` still lets the Enter key submit the form as before.

  In a Starwind Form, a required Select or Radio Group can be the first field with an error. On submit, or when you call `form.validate({ focus: true })`, focus now goes to the Select button or to a radio, and the page scrolls to it. Before, focus did not go to any control that the user could see. A Radio Group puts focus on its checked radio when one is checked.

  In Astro, a required Checkbox or Radio in a plain HTML form now shows the browser message and gets focus. Before, the form did not submit, and no message showed. In all frameworks, when the browser flags a Checkbox, Radio, or Switch as invalid, focus now goes to the control that the user sees.

  Checkbox and Radio now get their name from a `<label for="...">` that points at their `id`. Before, screen readers read these controls with no name.

- Updated the CLI's dependencies and build tools to get upstream fixes. The CLI works the same way.
- Fixed form reset in Svelte apps that render on the server. Before, a reset after the page hydrated cleared Checkbox, Switch, and Input. Now a reset puts Checkbox and Switch back to their default checked state. Input goes back to its default value, and so do Field controls that use Input.

## 3.4.0

### Minor Changes

- Added Svelte 5 support as a public beta. Install the `@starwind-ui/svelte` package or use the Starwind CLI to add Svelte components. Supports Svelte 5.29 and newer versions before Svelte 6, with setup for Vite, SvelteKit, and Astro projects.

### Patch Changes

- Reduced repeated JavaScript when an Astro page uses multiple Starwind components. Existing component APIs and page-transition behavior stay the same.
- Added AvatarGroup and AvatarGroupCount to display overlapping avatars with a count. The overlap scales with the avatar size and supports right-to-left layouts.
- Fixed missing styles when setting up Starwind in an Astro project without a shared layout. The CLI now imports the stylesheet in the home page and tells you which file it updated. If it cannot add the import, it shows you what to add yourself.

  When a component fails to install, the CLI now shows an error and exits with a failure code so scripts and CI can detect the problem. It also lists the components that installed successfully.

- Fixed Color Picker form resets in React and Vue. Canceling a reset now keeps the selected color and format, and a pending reset no longer overwrites a newer selection or slider change.

  For custom Runtime integrations, the new `stateSync` subscription lets you update your UI after a form reset finishes without firing a user-change event.

- Fixed Combobox values and input text after form resets. Canceling a reset keeps the current value, and a pending reset no longer overwrites newer input.

  In React, pressing Escape restores the expected input text. In Vue, canceling an input change restores the previous text.

- Fixed an open Context Menu jumping away from where it was opened when the component updates. It now keeps its position until the next time you open it at another location.
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

- Input OTP now shows a visible, blinking caret when focused in Astro, React, Vue, and Svelte. Its caret styles are included with the component.

  Popovers now shift to stay within the viewport near an edge, while keeping space between the popup and its trigger.

- Fixed Navigation Menu links after content moves into the shared viewport. Links still follow your close-on-select settings, canceled actions stay canceled, and links in nested menus affect the correct menu.
- Reduced background work on React pages with multiple menus, tooltips, or other components that use portals. These components now share the work of watching for changes to the page.
- Reduced the JavaScript loaded by form controls used without Field, including Checkbox and Select. Controls still connect to Field when it is used.

  In React 18, removing a Portal now releases references to its removed popup elements while the parent component stays mounted.

  React Color Picker now avoids rebuilding its controls when only the selected color changes. It still connects controls that your app adds or replaces.

- Fixed Select labels in Vue and Svelte when the selected option's text changes or its option loads after the value is set. The displayed label now updates while the popup is open or closed.
- React Select keeps its current selection when a form reset is canceled. A pending reset also preserves any newer value set by the user or app.

  Keep Select in the same form until a pending reset finishes. Moving it to another form during that reset is outside the supported behavior.

- Fixed CLI installs that omitted files or packages required by a component. Existing component APIs remain unchanged.
- Scroll Area now supports `autoViewport` in every framework. It defaults to `true`; set it to `false` to supply your own viewport and content parts. Color Picker channel sliders support `step` to set the amount each keyboard action changes the value. Menu and Context Menu submenu triggers accept an optional icon slot.

  Fixed Svelte Color Picker popup styling and clicks inside native dialogs.

  Keep custom portal targets for Color Picker controls inside the picker root so input changes reach the picker.

  Popover now preserves the `data-slot` set by components such as Color Picker, so their styles continue to apply.

- Reduced JavaScript in Svelte Checkbox, Switch, Select, Combobox, Context Menu, and Navigation Menu. Element props, event handlers, and refs keep the same behavior.
- Fixed nested overlays in Svelte dialogs appearing behind their parent or failing to receive clicks. Child overlays now stay above the overlay that opened them.
- Fixed Svelte Sidebar headings appearing disabled when they also open a collapsible section. Their tooltips remain available when the sidebar is collapsed and stay hidden in expanded or mobile views.
- Tabs now supports CSS entrance and exit animations. Panels stay visible until their exit animation finishes, while inactive content stops accepting keyboard focus and clicks. Use `data-starting-style` and `data-ending-style` to style the animations.

  When your code changes the selected tab, pressing Tab to enter the tab list now focuses that tab. Focus stays in place while someone is already navigating the list.

- Fixed open React tooltips and hover cards losing their position when the component updates. Tooltip also cancels a scheduled opening when disabled and responds to its trigger again when re-enabled.

  For custom Runtime integrations, Tooltip and Preview Card `setOpen` methods now accept an optional trigger element. Use it to restore an open overlay at its trigger.

- Fixed toasts skipping their entrance animation or leaving incorrect spacing when updated immediately, including when a promise resolves. Closing a toast also cancels any remaining entrance animation work.
- React Tooltip now reports a clear error if its Primitive markup is missing `Tooltip.Portal`.

  If you used the previous Primitive example, wrap `Tooltip.Positioner` and `Tooltip.Popup` in `Tooltip.Portal`. For inline rendering, keep the wrapper and set its `disabled` prop. Styled Tooltip already includes this wrapper and needs no change.

- Reduced JavaScript in Vue Checkbox, Checkbox Group, Switch, Radio, Radio Group, Toggle, and Toggle Group. Component props and defaults stay the same.
- Updated the loading icons in Vue Spinner, Dropzone, and Toast to match Astro and React.
- Reduced background work on Vue pages with multiple menus, tooltips, or other components that use portals. These components now share the work of watching for changes to the page.
- Fixed nested overlays in Vue and Svelte, including Select menus appearing behind a Color Picker.

  Nested overlays can now render directly under the document body. If your custom CSS selectors or DOM queries depend on an overlay staying inside its parent, set a portal container or add `data-floating-root` to the element that should contain it. Overlays inside Dialog still use its floating container.

## 3.3.2

### Patch Changes

- Select, Combobox, and Menu groups now get their name from their visible heading, so screen readers announce the group. The Tabs indicator now lines up with the selected tab when a parent element is scaled. Astro, React, and Vue get these fixes, and the CLI delivers them to installed components. The Vue package stays on its beta release channel.
- Removed old comments from the Vue component files that said the code was internal and not for release. The CLI also removes the blank line that these comments left in the Vue Primitive `index.ts` files that it copies into your project.
- Internal maintenance. Removed unused internal portal methods and old CLI helpers. Components work the same way, and the component files that the CLI installs do not change.
- Internal maintenance of how `starwind add` checks component names. It still adds components in the order that you give, and it still warns about unknown names.

## 3.3.1

### Patch Changes

- The CLI no longer adds the deprecated `baseUrl` option when it sets up TypeScript path aliases in a Vue project. New Vue projects can now build with TypeScript 6. The CLI keeps your existing settings.

## 3.3.0

### Minor Changes

- The CLI now supports Vue 3.5 as a public beta. You can use it to set up a Vue project and add Vue components.

## 3.2.0

### Minor Changes

- A component can now get a behavior fix without new component files. The CLI now tracks the version of a component's files apart from the version of its behavior. When an update changes only the behavior of a Styled component or Primitive, `starwind update` keeps your customized files.

### Patch Changes

- Move Pagination sizing from the root to each link. Page links now default to the Starwind icon button size, previous and next controls default to the normal medium button size, and every control accepts direct Button size overrides. Keep the direction chevrons static on hover.
- Styled popup components, such as Popover, Select, Combobox, Tooltip, and Dropdown, now accept `portalContainer` to set where the popup renders and `disablePortal` to render it in place.
- On mobile browsers, a tap on the Select button now closes an open Select list, and a tap on an option now selects it.
- You can now import the `toast` function and its types from the Toast component in your project, from the same file as the Toast parts.

## 3.1.0

### Minor Changes

- Tooltip and Hover Card now let you add classes to their Positioner. Their default stacking level (`z-index`) is now on the Positioner.
- Added the `--starwind-ui-version` option for older Astro projects. It selects the Starwind Pro V2 registry, which no longer changes, and checks that the version is valid.

### Patch Changes

- Use Starwind semantic color tokens directly in Prose styles.

## 3.0.1

### Patch Changes

- Every Primitive that the CLI copies into your project now starts at version `1.0.0`. Later Primitive updates use normal patch, minor, and major versions.

## 3.0.0

### Major Changes

- New major version of the Starwind CLI. It works with Starwind Runtime and includes version 2 of the styled component registry.

  The CLI now installs styled components for Astro and React. It has commands to add, update, list, search, and preview Primitive source files. It keeps track of projects that mix frameworks and registries. It installs Starwind Pro components directly, and it moves existing projects to components that use Runtime in a safe way.

  `starwind remove` now knows which framework each component uses. The CLI finds styled components that depend on each other in a loop, and it finds conflicts with your local files. It checks registry package versions and your configuration before it changes any files. It keeps the files that it manages inside your project folder, and it sends registry credentials only to trusted sites.

### Minor Changes

- Added a styled `DropdownLinkItem` for links that go to another page. Use `DropdownItem` for menu actions.
- Card section gaps and padding now come from one `--card-spacing` CSS variable that you can override. The default and small sizes set this variable in the same way in Astro and React.
- Each styled component now has one clear place where you set its size. The `sm`, `md`, and `lg` sizes still default to `md`.

  To update components with child parts, move the child size to the root:

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

  You still set the size of Select and Combobox controls apart from their popup content. Set both props when they should match, or set different sizes on purpose:

  ```astro
  <SelectTrigger size="sm" />
  <SelectContent size="lg">...</SelectContent>

  <ComboboxInput size="sm" />
  <ComboboxContent size="lg">...</ComboboxContent>
  ```

  For Color Picker, set the size of the trigger and of the inline editor on `ColorPicker`. Set the size of the popup editor on `ColorPickerContent`. Remove `size` from the inner Color Picker parts. For a custom `ColorPickerInput`, use `formatContentSize` only when its format Select popup needs its own size:

  ```diff
  -<ColorPicker size="sm"><ColorPickerTrigger size="sm" /></ColorPicker>
  +<ColorPicker size="sm"><ColorPickerTrigger /></ColorPicker>

  -<ColorPickerInput size="sm" />
  +<ColorPickerInput formatContentSize="sm" />
  ```

- You can now install the styled Color Picker for Astro and React with the CLI, together with all of the components that it needs. Its Popover opens below the trigger, aligned to the start, and it only fades when it closes. Its inputs use the same style as Input. It has thin channel tracks and a trigger that shows only a swatch.

  When a Popover shifts to stay on screen, it no longer moves over its trigger. When there is little vertical space, the Color Picker uses the height that Popover measures and scrolls its own content. It does not cover the trigger or go off screen.

  The Astro and React Color Picker also look better. The color area and sliders have frames, and their thumbs stay fully visible at the ends. The controls are compact and follow the size. The EyeDropper button shows only an icon. Value swatches draw the color and the checkerboard as one background. The footer has dividers, and the Clear button shows only when Clear is allowed.

  The CLI moves older Color Picker installs to the new styled Color Picker, which uses Runtime. It updates their Select dependency in the normal way, and it no longer keeps the old compatibility layer.

- Added `sm` and `md` sizes to the styled Navigation Menu. `size` sets the size of native triggers, List spacing, indicators, and Links that use `navigationMenuTriggerStyle()`. `contentSize` sets the size of the shared popup. It defaults to `size`, so one prop is enough when the sizes match. You can still set a different `contentSize` on purpose.

  Fixed how the styled `NavigationMenuTrigger` looks with `asChild`. A native Trigger still gets all of the Navigation Menu trigger styles and its chevron icon. A child control that you pass with `asChild` now keeps its own markup and look. It still works in the same way as before. Its own attributes still win, and the class that you set on the Trigger still applies.

  Migration: a child control that you pass with `asChild` no longer gets the default Navigation Menu trigger styles, the root size, or the chevron icon. Style the child directly, and put any icon that you want inside it.

- Renamed the standard size of Card, Item, and Sidebar menu button from `default` to `md`. If you leave out `size`, you get the same medium style as before. Pass `size="md"` when you want to set the medium size in your code.
- Made the styled Color Picker simpler. `<ColorPicker />` with no children now renders a complete picker, and fewer parts are needed for advanced layouts. `ColorPicker` renders the popup picker, or the inline editor when you set `inline`. Alpha is still on by default. Use these props for common changes: `formatControl`, `formats`, `showEyeDropper`, `showValueText`, `clearable`, `swatches`, and `label`.

  Replace `ColorPickerRoot` with `<ColorPicker inline>`. Replace `ColorPickerLabel` with the `label` prop or your own label element. Replace `ColorPickerControl` with your own container element. `ColorPickerArea` now includes its thumb. `ColorPickerInput` includes the value input and accepts `formatControl="select" | "native" | "none"`. `ColorPicker` always renders its hidden form input. Replace `allowEmpty` plus `showClear` with `clearable`. For the default editor, pass swatch data in the `swatches` array.

  The styled Color Picker no longer lets you show a Clear button when empty values are not allowed. You also can no longer replace only the area thumb, the parts of the format selector, or the hidden input. Use the Color Picker Primitive when you need to change those parts. The styled Color Picker still supports popup, inline, input-only, swatch-only, native select, form, and custom channel layouts.

### Patch Changes

- Accordions now let you close the open item by default. To keep one item open at all times, set `collapsible={false}`.
- In Astro and React, Accordion now shows a divider border on every item except the last one.
- Fixed styled Hover Card, Popover, and Tooltip triggers with `asChild`. A child control that you pass no longer gets the styles or display classes of the native Trigger. A native Trigger looks the same as before.

  Migration: if your child control used those Trigger classes for its look, style the child directly.

- Avatar images now work with the browser's lazy loading. Starwind still hides an image while it loads and when it fails to load. This includes Astro images from imported assets.
- Fixed the React Color Picker source code and the props that Astro Spinner passes to its SVG. With default options, `starwind init` now detects Astro and React projects. `starwind remove` has a new option to run without questions. Before each release, new tests now install the packed Astro and React packages with each supported framework version and package manager.
- CLI commands now finish all of their steps, including the final summary, before the CLI exits. Component lists are in alphabetical order. `starwind init` now detects the supported frameworks in your project. In an Astro project, it can set up React as a second framework. In a Vite React project that uses JavaScript, it adds the TypeScript settings that the installed TSX components need. The default export in each styled component's `index.ts` now has a name, such as `AccordionParts`, so framework tools show a clear name.
- Button now adds its script only to a native `<button>` that sets `focusableWhenDisabled`. A plain button, enabled or disabled, uses only HTML. In Astro and React, a `focusableWhenDisabled` button can now change between enabled and disabled and keep focus. Button Runtime now supports native buttons only. The docs and the Primitive files that the CLI copies are updated to match.
- Remove directional sliding from the styled Combobox closing animation while preserving its fade and
  scale motion.
- Avatar now uses an inline flex layout, so it is a true circle at the small, medium, and large sizes. This also applies to Avatars that you install with the CLI. Images and fallbacks still show as before.
- Styled Progress no longer animates when it changes between a set value and the indeterminate (loading) state. Normal value changes still animate, and reduced-motion settings still apply.
- The Astro and React Progress components that the CLI installs now handle unusual inputs in the same way as Runtime. This covers a `min` that is larger than `max`, a `min` that is equal to `max`, and values that are not valid or not finite numbers.
- Use the `default` style when Radio Group items and Progress indicators omit their color variant.
- Popups inside a native modal Dialog, such as menus and tooltips, now show above the Dialog and respond to clicks. This applies to Runtime, Astro, React, and components that you install with the CLI.
- Fixed the React Checkbox indicator in the Primitive files that the CLI copies into your project. The indicator now renders when the checkbox is checked or when you keep it mounted. It does not render when it is inactive or hidden.
- `starwind init` now shows one progress spinner while it installs dependencies, and not one spinner inside another.
- When you do not choose a package manager, the CLI now uses the one that your project uses to install dependencies. It also shows progress while it updates packages.
- The styled Color Picker area now stays usable on small screens. It keeps a minimum height. Its Popover opens on the side with the most space, and the content scrolls when neither side has enough space. The Astro and React Popover Primitives now let you use this collision setting. In the CLI, the styled Color Picker version continues from the versions of the older Color Picker.
- On touch devices, you can now drag in the Color Picker area in all directions. The keyboard controls work as before.
- Ensure Color Picker value and format controls follow the selected small, medium, or large size instead of retaining the shared input's medium dimensions.
- Fixed build errors in the Astro and React styled Color Picker when you pass swatches as plain color values or as objects with a label, in JavaScript and TypeScript.
- Dialog, Alert Dialog, and Sheet now play their full opening animation, even when the page is busy.
- A popup now closes when you click inside its component's root element but outside its trigger and popup. A click in a nested popup still keeps the parent open. This fixes Color Picker Popover closing in Astro and React. Other popups, such as Select, Menu, and Tooltip, now follow the same rule.
- Submenus now stay open while you move the pointer into a nested submenu.
- React Select now picks up a value that code sets without a change event. Because of this, the Color Picker format control shows its set format, with the selected style, before anyone uses it. The CLI includes the fixed React Select Primitive files.
- Fixed React Select items with an empty label in the Primitive files that the CLI copies into your project. An item with an empty label now keeps that empty label. Its value is still sent with the form while the list is closed.
- Changed the Form validation timing options. `validationTiming` sets when fields check before the first submit, and `revalidationTiming` sets when they check after it. Form also has new methods to validate fields, show errors, reset validation, and set errors from outside the form, such as server errors. The Astro and React packages and the Primitive files that the CLI copies include these changes.

  To update from the beta: the old `input` timing and the old `change` timing both become `change`. The old `change` timing ran only after the user finished a change. The new `change` runs on every accepted change to the value. A timing that runs only after the user finishes a change is no longer available. The defaults stay the same: validation on `submit`, revalidation on `change`, and errors shown on `submit`. After the first submit, `revalidationTiming` replaces `validationTiming`. The two no longer add together.

- `starwind init` now sets up Vite React, Next.js App Router, and TanStack Start projects to match each framework. It keeps React client boundaries in place, and it adds a theme setup that works with server rendering.
- `starwind init` now supports React Router in framework mode and the Next.js Pages Router. In a Pages Router project, component styles go through the global stylesheet, so the installed interactive components build with Next.js.
- `starwind init` now installs the setup packages that your framework needs. The CLI includes the list of these packages.
- A change that you can cancel now gives the same `details` object to the callback and to the DOM event. The callback runs first, then the DOM event. The component changes only if neither one canceled the change. In React, you can still cancel a change before it applies, and React gets only the changes that apply. You can cancel React Combobox commands, and React Switch keeps its connection to its native form. The CLI copies the fixed React Primitive files into your project.
- Improved the hover color of the secondary Button. It now mixes colors from your theme.
- The installed Color Picker classes now use the short Tailwind CSS v4 syntax for CSS variables, without extra `var(...)` wrappers. The CSS output and the look stay the same.
- Updated the React Radio and Radio Group Primitive files that the CLI copies into your project. They now change only after Runtime accepts a change, and they follow value changes that come from outside the component.
- Updated the React Toggle Group Primitive files that the CLI copies into your project. They now include the Toggle Group context provider.

## 3.0.0-beta.8

### Patch Changes

- CLI commands now finish all of their steps, including the final summary, before the CLI exits. Component lists are in alphabetical order. `starwind init` now detects the supported frameworks in your project. In an Astro project, it can set up React as a second framework. In a Vite React project that uses JavaScript, it adds the TypeScript settings that the installed TSX components need. The default export in each styled component's `index.ts` now has a name, such as `AccordionParts`, so framework tools show a clear name.
- `starwind init` now shows one progress spinner while it installs dependencies, and not one spinner inside another.
- Fixed build errors in the Astro and React styled Color Picker when you pass swatches as plain color values or as objects with a label, in JavaScript and TypeScript.
- React Select now picks up a value that code sets without a change event. Because of this, the Color Picker format control shows its set format, with the selected style, before anyone uses it. The CLI includes the fixed React Select Primitive files.
- `starwind init` now sets up Vite React, Next.js App Router, and TanStack Start projects to match each framework. It keeps React client boundaries in place, and it adds a theme setup that works with server rendering.
- `starwind init` now supports React Router in framework mode and the Next.js Pages Router. In a Pages Router project, component styles go through the global stylesheet, so the installed interactive components build with Next.js.
- A change that you can cancel now gives the same `details` object to the callback and to the DOM event. The callback runs first, then the DOM event. The component changes only if neither one canceled the change. In React, you can still cancel a change before it applies, and React gets only the changes that apply. You can cancel React Combobox commands, and React Switch keeps its connection to its native form. The CLI copies the fixed React Primitive files into your project.

## 3.0.0-beta.7

### Patch Changes

- Fixed the React Color Picker source code and the props that Astro Spinner passes to its SVG. With default options, `starwind init` now detects Astro and React projects. `starwind remove` has a new option to run without questions. Before each release, new tests now install the packed Astro and React packages with each supported framework version and package manager.

## 3.0.0-beta.6

### Minor Changes

- Each styled component now has one clear place where you set its size. The `sm`, `md`, and `lg` sizes still default to `md`.

  To update components with child parts, move the child size to the root:

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

  You still set the size of Select and Combobox controls apart from their popup content. Set both props when they should match, or set different sizes on purpose:

  ```astro
  <SelectTrigger size="sm" />
  <SelectContent size="lg">...</SelectContent>

  <ComboboxInputGroup size="sm">...</ComboboxInputGroup>
  <ComboboxContent size="lg">...</ComboboxContent>
  ```

  For Color Picker, set the size of the trigger and of the inline editor on `ColorPicker`. Set the size of the popup editor on `ColorPickerContent`. Remove `size` from the inner Color Picker parts. For a custom `ColorPickerInput`, use `formatContentSize` only when its format Select popup needs its own size:

  ```diff
  -<ColorPicker size="sm"><ColorPickerTrigger size="sm" /></ColorPicker>
  +<ColorPicker size="sm"><ColorPickerTrigger /></ColorPicker>

  -<ColorPickerInput size="sm" />
  +<ColorPickerInput formatContentSize="sm" />
  ```

- Added `sm` and `md` sizes to the styled Navigation Menu. `size` sets the size of native triggers, List spacing, indicators, and Links that use `navigationMenuTriggerStyle()`. `contentSize` sets the size of the shared popup. It defaults to `size`, so one prop is enough when the sizes match. You can still set a different `contentSize` on purpose.

  Fixed how the styled `NavigationMenuTrigger` looks with `asChild`. A native Trigger still gets all of the Navigation Menu trigger styles and its chevron icon. A child control that you pass with `asChild` now keeps its own markup and look. It still works in the same way as before. Its own attributes still win, and the class that you set on the Trigger still applies.

  Migration: a child control that you pass with `asChild` no longer gets the default Navigation Menu trigger styles, the root size, or the chevron icon. Style the child directly, and put any icon that you want inside it.

- Renamed the standard size of Card, Item, and Sidebar menu button from `default` to `md`. If you leave out `size`, you get the same medium style as before. Pass `size="md"` when you want to set the medium size in your code.
- Made the styled Color Picker simpler. `<ColorPicker />` with no children now renders a complete picker, and fewer parts are needed for advanced layouts. `ColorPicker` renders the popup picker, or the inline editor when you set `inline`. Alpha is still on by default. Use these props for common changes: `formatControl`, `formats`, `showEyeDropper`, `showValueText`, `clearable`, `swatches`, and `label`.

  Replace `ColorPickerRoot` with `<ColorPicker inline>`. Replace `ColorPickerLabel` with the `label` prop or your own label element. Replace `ColorPickerControl` with your own container element. `ColorPickerArea` now includes its thumb. `ColorPickerInput` includes the value input and accepts `formatControl="select" | "native" | "none"`. `ColorPicker` always renders its hidden form input. Replace `allowEmpty` plus `showClear` with `clearable`. For the default editor, pass swatch data in the `swatches` array.

  The styled Color Picker no longer lets you show a Clear button when empty values are not allowed. You also can no longer replace only the area thumb, the parts of the format selector, or the hidden input. Use the Color Picker Primitive when you need to change those parts. The styled Color Picker still supports popup, inline, input-only, swatch-only, native select, form, and custom channel layouts.

### Patch Changes

- Fixed styled Hover Card, Popover, and Tooltip triggers with `asChild`. A child control that you pass no longer gets the styles or display classes of the native Trigger. A native Trigger looks the same as before.

  Migration: if your child control used those Trigger classes for its look, style the child directly.

- Fixed the React Checkbox indicator in the Primitive files that the CLI copies into your project. The indicator now renders when the checkbox is checked or when you keep it mounted. It does not render when it is inactive or hidden.
- Ensure Color Picker value and format controls follow the selected small, medium, or large size instead of retaining the shared input's medium dimensions.
- Fixed React Select items with an empty label in the Primitive files that the CLI copies into your project. An item with an empty label now keeps that empty label. Its value is still sent with the form while the list is closed.
- The installed Color Picker classes now use the short Tailwind CSS v4 syntax for CSS variables, without extra `var(...)` wrappers. The CSS output and the look stay the same.

## 3.0.0-beta.5

### Patch Changes

- On touch devices, you can now drag in the Color Picker area in all directions. The keyboard controls work as before.
- Updated the React Radio and Radio Group Primitive files that the CLI copies into your project. They now change only after Runtime accepts a change, and they follow value changes that come from outside the component.
- Updated the React Toggle Group Primitive files that the CLI copies into your project. They now include the Toggle Group context provider.

## 3.0.0-beta.4

### Patch Changes

- Avatar images now work with the browser's lazy loading. Starwind still hides an image while it loads and when it fails to load. This includes Astro images from imported assets.
- Popups inside a native modal Dialog, such as menus and tooltips, now show above the Dialog and respond to clicks. This applies to Runtime, Astro, React, and components that you install with the CLI.
- When you do not choose a package manager, the CLI now uses the one that your project uses to install dependencies. It also shows progress while it updates packages.
- The styled Color Picker area now stays usable on small screens. It keeps a minimum height. Its Popover opens on the side with the most space, and the content scrolls when neither side has enough space. The Astro and React Popover Primitives now let you use this collision setting. In the CLI, the styled Color Picker version continues from the versions of the older Color Picker.
- Dialog, Alert Dialog, and Sheet now play their full opening animation, even when the page is busy.
- A popup now closes when you click inside its component's root element but outside its trigger and popup. A click in a nested popup still keeps the parent open. This fixes Color Picker Popover closing in Astro and React. Other popups, such as Select, Menu, and Tooltip, now follow the same rule.
- Submenus now stay open while you move the pointer into a nested submenu.
- Changed the Form validation timing options. `validationTiming` sets when fields check before the first submit, and `revalidationTiming` sets when they check after it. Form also has new methods to validate fields, show errors, reset validation, and set errors from outside the form, such as server errors. The Astro and React packages and the Primitive files that the CLI copies include these changes.

  To update from the beta: the old `input` timing and the old `change` timing both become `change`. The old `change` timing ran only after the user finished a change. The new `change` runs on every accepted change to the value. A timing that runs only after the user finishes a change is no longer available. The defaults stay the same: validation on `submit`, revalidation on `change`, and errors shown on `submit`. After the first submit, `revalidationTiming` replaces `validationTiming`. The two no longer add together.

- `starwind init` now installs the setup packages that your framework needs. The CLI includes the list of these packages.

## 3.0.0-beta.3

### Minor Changes

- Added a styled `DropdownLinkItem` for links that go to another page. Use `DropdownItem` for menu actions.
- Card section gaps and padding now come from one `--card-spacing` CSS variable that you can override. The default and small sizes set this variable in the same way in Astro and React.

### Patch Changes

- In Astro and React, Accordion now shows a divider border on every item except the last one.
- Avatar now uses an inline flex layout, so it is a true circle at the small, medium, and large sizes. This also applies to Avatars that you install with the CLI. Images and fallbacks still show as before.
- Styled Progress no longer animates when it changes between a set value and the indeterminate (loading) state. Normal value changes still animate, and reduced-motion settings still apply.
- The Astro and React Progress components that the CLI installs now handle unusual inputs in the same way as Runtime. This covers a `min` that is larger than `max`, a `min` that is equal to `max`, and values that are not valid or not finite numbers.

## 3.0.0-beta.2

### Minor Changes

- You can now install the styled Color Picker for Astro and React with the CLI, together with all of the components that it needs. Its Popover opens below the trigger, aligned to the start, and it only fades when it closes. Its inputs use the same style as Input. It has thin channel tracks and a trigger that shows only a swatch.

  When a Popover shifts to stay on screen, it no longer moves over its trigger. When there is little vertical space, the Color Picker uses the height that Popover measures and scrolls its own content. It does not cover the trigger or go off screen.

  The Astro and React Color Picker also look better. The color area and sliders have frames, and their thumbs stay fully visible at the ends. The controls are compact and follow the size. The EyeDropper button shows only an icon. Value swatches draw the color and the checkerboard as one background. The footer has dividers, and the Clear button shows only when Clear is allowed.

  The CLI moves older Color Picker installs to the new styled Color Picker, which uses Runtime. It updates their Select dependency in the normal way, and it no longer keeps the old compatibility layer.

### Patch Changes

- Accordions now let you close the open item by default. To keep one item open at all times, set `collapsible={false}`.
- Button now adds its script only to a native `<button>` that sets `focusableWhenDisabled`. A plain button, enabled or disabled, uses only HTML. In Astro and React, a `focusableWhenDisabled` button can now change between enabled and disabled and keep focus. Button Runtime now supports native buttons only. The docs and the Primitive files that the CLI copies are updated to match.
- Improved the hover color of the secondary Button. It now mixes colors from your theme.

## 2.0.1

### Patch Changes

- Updated dependencies [0c0c4a7]
- Updated dependencies [e793f8d]
- Updated dependencies [6b8d786]
  - @starwind-ui/core@2.0.1

## 2.0.0

### Major Changes

- a170442: The CLI now needs Node.js 22.12.0 or newer, the same as Astro 6.

### Minor Changes

- 87f35ec: Added the `search` command.
- 72b3b89: Added the `docs` command.

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

- 8c5d9e7: Made it clearer how to install Starwind Pro components with shadcn.
  - @starwind-ui/core@1.16.2

## 1.16.1

### Patch Changes

- Updated dependencies [43a7435]
- Updated dependencies [ece15f2]
  - @starwind-ui/core@1.16.1

## 1.16.0

### Minor Changes

- a662227: The CLI can now install utility files.
- 4118e32: `starwind init` now adds a VS Code code snippet for the theme toggle.

### Patch Changes

- d7e6e8e: Updated the default secondary styles.
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

- e179b78: Added the `setup` command. It adds Starwind Pro to an existing Starwind UI project.
  - @starwind-ui/core@1.15.5

## 1.15.4

### Patch Changes

- Updated dependencies [af156c5]
  - @starwind-ui/core@1.15.4

## 1.15.3

### Patch Changes

- 734f2e9: Added the `--yes` and `--package-manager` options to the `add` and `update` commands.
  - @starwind-ui/core@1.15.3

## 1.15.2

### Patch Changes

- Updated dependencies [c997e6f]
- Updated dependencies [17d0877]
  - @starwind-ui/core@1.15.2

## 1.15.0

### Patch Changes

- a6c2f2c: Added sidebar CSS variables to the Starwind CSS file.
- Updated dependencies [2a7b70e]
- Updated dependencies [c667fb9]
- Updated dependencies [225ceb1]
- Updated dependencies [efa8569]
- Updated dependencies [eece2cc]
- Updated dependencies [b4bd93d]
  - @starwind-ui/core@1.15.0

## 1.14.0

### Minor Changes

- be76e48: `starwind init --pro` now creates `.env.local` with a demo `STARWIND_LICENSE_KEY` variable, and it adds the file to `.gitignore`.
- b8e37af: `starwind init` now imports the Starwind CSS file and sets up tsconfig path aliases for you.

### Patch Changes

- Updated dependencies [05ad2c7]
  - @starwind-ui/core@1.14.0

## 1.13.0

### Patch Changes

- 8ae0c3e: The `add` command message now gives more detail.
- 676a68a: Improved the steps of the `add` command.
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

- 13b7c60: The CLI now allows newer dependency versions, so you can get their bug fixes.
- Updated dependencies [13b7c60]
  - @starwind-ui/core@1.12.4

## 1.12.2

### Patch Changes

- 9a1108f: Fixed package installs and CLI use on Windows.
  - @starwind-ui/core@1.12.2

## 1.12.1

### Patch Changes

- Updated dependencies [f7ad6e1]
- Updated dependencies [88e2d11]
  - @starwind-ui/core@1.12.1

## 1.12.0

### Patch Changes

- faf85f1: `starwind init` now adds commas correctly when it changes your Astro config file.
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

- 873a1b6: Added the `--primary-accent` and `--secondary-accent` color variables. The default CSS file is now closer to shadcn.
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

- cffaf7e: The starting Starwind CSS file now matches the new component styles.
- 21ca5de: The CLI now installs version 3 of tailwind-variants.

### Patch Changes

- Updated dependencies [1f83bc0]
- Updated dependencies [bdcbfe3]
- Updated dependencies [96de92c]
- Updated dependencies [9261789]
- Updated dependencies [680f584]
  - @starwind-ui/core@1.10.0

## 1.9.0

### Minor Changes

- 3e30f0b: `init` and `add` can now install from a private registry and set it up for you.
- 26821d2: The CLI can now install and upgrade the registry dependencies of a component.

### Patch Changes

- c4aea05: Improved how the CLI installs npm dependencies for Starwind components.
- 9da60b2: Changed the default CSS radius variable to 0.625rem to match shadcn.
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

- 8044e1f: `starwind init` now has better control of the versions of the packages that it installs, and it also installs tailwind-merge. Closes #42

### Patch Changes

- - Initial changeset setup.
- Updated dependencies
  - @starwind-ui/core@1.8.0

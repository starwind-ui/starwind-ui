---
"@starwind-ui/svelte": minor
"starwind": patch
---

Svelte components now follow a parent value the same way React and Vue do. If you pass a defined value when the component mounts, your state owns that value while the component stays mounted. This applies to `open`, `value`, `checked`, and the other model props on Accordion, Alert Dialog, Checkbox, Checkbox Group, Collapsible, Color Picker, Combobox, Context Menu, Dialog, Drawer, Field, Input, Input OTP, Menu, Navigation Menu, Popover, Hover Card, Radio, Radio Group, Select, Sidebar, Slider, Switch, Tabs, Toggle, Toggle Group, and Tooltip. A form reset keeps your value. If you pass `undefined` at mount, the component keeps its own state, and a form reset returns it to its default.

If you pass a one-way prop such as `open={open}` and expect the component to change on its own, use `bind:open={open}` or update your state in the change callback. `bind:` keeps working with no change.

Checkbox Group, Toggle Group, Accordion, and Input now follow `push()` and `splice()` on a `$state` array, through `bind:value` or `value`.

If a prop starts as `undefined` and gets a value later, the component keeps its own state and applies the new value when it arrives. Edits made after that stay until your state sets another value. Before, each Input edit went back to the supplied value, and a Combobox or Sidebar went back to that value when another model on the same component changed, such as `bind:open`.

A Combobox that gets its props through a spread, such as `{...props}`, now shows the new label when your state changes `value`. Before, the text field kept the old label while the form sent the new value.

Fixed a bound Slider that reset to 0. The first render of Navigation Menu now follows the initial value.

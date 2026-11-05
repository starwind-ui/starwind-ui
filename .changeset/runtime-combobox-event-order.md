---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Combobox now sends its events in the same order in Astro, React, Vue, and Svelte. Pressing an item gives the value change, then the input text change with the `item-press` reason, then the open change. Clearing gives the value change, then the input text change to `""` with the `clear` reason. You can cancel the input text change in every framework.

When you cancel a typed change, the input text goes back to the previous text. This now also works in Astro.

When your code controls `inputValue`, typing in the middle of the text now keeps the caret where it is. Before, the caret moved to the end after each key. Text that your code does not accept still goes back to your value.

React `Combobox` now opens on the first focus of its input, as it does in Astro, Vue, and Svelte.

Styled `ComboboxClear` with `asChild` now uses your child as the button. Before, the default icon made a button inside a button in Vue and React, and a hydration mismatch in Nuxt. Add your own icon to the child if you want one.

A form reset now keeps a value that your code controls, and the input text follows that value.

If you use Runtime directly and your items render only when the list opens, pass the new `resolveValueText` option to `createCombobox`. It returns the label for a selected value whose item is not rendered.

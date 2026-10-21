---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Select with `required` now stops a plain HTML form from submitting while no option is selected. Before this fix, the empty form submitted. The browser now shows its message next to the Select and moves focus to the Select button. A Select without `required` does not change how the Enter key submits a form.

When a required Select or Radio Group is the first invalid field in a Starwind Form, submit and `form.validate({ focus: true })` now move focus to the Select button or to the radio. The page scrolls to that control. Before this fix, focus did not reach a visible control. A Radio Group moves focus to its checked radio when it has one.

In Astro, a required Checkbox or Radio in a plain HTML form now shows the browser message and gets focus. Before this fix, the form did not submit and showed no message. In all frameworks, when the browser focuses the hidden native input of a Checkbox, Radio, or Switch, focus now moves to the visible control.

Checkbox and Radio now take their accessible name from a `<label for="...">` that points at their `id`. Before this fix, screen readers announced these controls without a name.

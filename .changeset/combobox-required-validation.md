---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Combobox with `required` now stops a plain HTML form from submitting while no option is selected. Before this fix, the empty form submitted with no message. The browser now shows its message and moves focus to the Combobox input. The popup stays closed so it does not cover the message. A Combobox without `required` does not change how the Enter key submits a form.

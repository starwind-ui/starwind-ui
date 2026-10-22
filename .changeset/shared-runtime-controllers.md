---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
---

In `astro dev`, components no longer start two times when your own scripts import from `@starwind-ui/runtime`. For example, a script could import `createForm` from `@starwind-ui/runtime/form`. Vite could then load Starwind two times, and each copy started the same components. A page with Form, Field, and RadioGroup could freeze. A Slider or Select could send `starwind:value-change` two times for one change, and Form validators could run two times. The page could also stay unable to scroll after you picked a Select option or closed a Dialog. These problems no longer happen. You do not need to change your Vite config. Production builds were not affected.

To control a component from your script, call its create function with the component's root element. For example, `createDialog(root).open()` opens a Dialog. When Starwind already started that component, the function gives you the running component and ignores the options that you pass. Set options with component props or data attributes instead. `createForm` is different: it applies the options that you pass, such as `onSubmit` and validators, to the form on the page.

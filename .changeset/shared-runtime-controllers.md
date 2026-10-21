---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
---

Fixed components that ran twice in `astro dev` after page code imported from `@starwind-ui/runtime`, for example `createForm` from `@starwind-ui/runtime/form`. Vite could then load a second copy of the Runtime, and each copy set up the same component. A page with Form, Field, and RadioGroup could freeze. A Slider or Select change could send `starwind:value-change` two times, and Form validators could run two times for one change. Page scroll could stay locked after you picked a Select option or closed a Dialog. Now every copy of the Runtime on a page uses the same controller for an element. You do not need to change your Vite configuration. Production builds with one Runtime version did not have this problem.

To control a component from page code, call its factory with the root element, for example `createDialog(root).open()`. If the component already has a controller, the factory returns it and ignores the options you pass. Set options through data attributes or component props. `createForm` is different: it applies the options you pass, such as `onSubmit` and validators, to the live form.

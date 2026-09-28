---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"starwind": patch
---

Fixed component behavior in the following cases:

- Vue Accordion, Collapsible, Tabs, and menu options keep their previous state when a change is canceled. Alert Dialog, Drawer, and Popover respond to open and close requests from app code.
- React Checkbox and Switch, and Vue Switch, use the app-provided checked state for their initial native input value. React toggles inside Toggle Group start with the group's selected and disabled state.
- React and Vue Input OTP restore the original default value after a form reset, including after `readOnly` changes.
- Avatar connects replacement images and fallbacks. Fieldset keeps its accessible label linked to its current legend.
- Dialog, Alert Dialog, and Drawer recognize trigger and close buttons added after the component mounts. Custom Runtime integrations can call the new `refresh()` method after adding or replacing these buttons.
- Vue Toaster now uses the spacing set through its `gap` and `peek` props.

Tabs keeps its initial `syncKey` for its mounted lifetime. Remount Tabs to change that key.

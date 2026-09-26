---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"starwind": patch
---

Fixed component updates and form resets across frameworks:

- Vue bindings now reflect changes accepted by the component. Checkboxes and switches keep their original reset values, and Checkbox Group manages the correct child controls.
- React Navigation Menu handles content being removed from its shared viewport. Sidebar stays in sync with saved state and handles nested mobile sheets correctly.
- Color Picker keeps values supplied by your app when the form resets.
- Input and Dropzone keep working when their input elements or associated forms change. Custom Runtime integrations can use their new `refresh` methods to reconnect those elements.

Components installed through the CLI include these fixes. Installing the Field Primitive also includes its required Input files.

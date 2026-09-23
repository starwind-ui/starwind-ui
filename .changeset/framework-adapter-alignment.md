---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"starwind": patch
---

Add Input and Dropzone refresh methods to reconnect replaced parts and form owners while preserving controller state. Wire reactive adapters and scoped Astro initialization to these methods.

Fix accepted Vue model publication, boolean reset defaults and Checkbox Group ownership, React Navigation Menu content removal, and Sidebar persistence and nested mobile Sheet ownership. Keep Color Picker value and format ownership fixed for each mounted adapter, with current controlled values preserved on form reset.

Deliver the updated Primitive source through the CLI, including Field's copied Input dependency. Schedule component patches for the affected Primitive and Styled components.

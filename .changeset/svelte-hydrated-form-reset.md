---
"@starwind-ui/svelte": patch
"starwind": patch
---

Fixed form reset in Svelte apps that render on the server. Before, a reset after the page hydrated cleared Checkbox, Switch, and Input. Now a reset puts Checkbox and Switch back to their default checked state. Input goes back to its default value, and so do Field controls that use Input.

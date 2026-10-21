---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
"starwind": patch
---

Dropzone now reports dropped files that it does not keep. A PDF dropped on a Dropzone with `accept="image/*"` used to do nothing visible and fire no event. Dropped files that do not match `accept` are now rejected. Extra dropped files that a Dropzone without `multiple` does not keep are rejected too.

- Read the rejected files with the `starwind:files-reject` event on the root. In React and Svelte, use `onFilesReject`. In Vue, use `@files-reject`. The event detail has the rejected `files` and the original drop `event`.
- When a drop keeps no files, the root gets a `data-rejected` attribute and the styled Dropzone shows an error border. The next accepted drop, file picker change, `setFiles` call, or form reset removes it. A drop that keeps some files fires the event but does not set the attribute.

Screen readers do not announce a rejection by themselves. To announce one, show a message in a live region when the reject event fires.

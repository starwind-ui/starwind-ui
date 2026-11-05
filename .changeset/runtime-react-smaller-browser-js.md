---
"@starwind-ui/runtime": patch
"@starwind-ui/react": patch
---

Reduced the JavaScript that Runtime and React send to the browser. The public API is unchanged.

- Importing one part by name from a React component path no longer includes the other parts. For example, importing only `DialogTitle` from `@starwind-ui/react/dialog` went from about 11 KB of gzip to about 0.2 KB with esbuild. A namespace import, such as `import { Dialog } from "@starwind-ui/react/dialog"`, still includes every part.
- Production React builds no longer include component display names. They stay in development, so React DevTools still shows them.
- Field no longer loads Color Picker code unless the Field holds a Color Picker.
- A page that imports Field with several controls now loads fewer separate files.
- Runtime uses shorter internal names in its build.

Runtime now publishes source maps. They map the shortened names back to the original TypeScript, so stack traces and debugger views show the real names.

Field loads more code in one case. If your page calls `createField` and imports no Runtime code for a control inside that Field, Field now loads the code for all ten controls it can hold together, about 47 KB of gzip. Before, it loaded only the control it needed. To skip that extra load, import the control's own entry, such as `@starwind-ui/runtime/select`. The Astro, React, Vue, and Svelte control components already import it.

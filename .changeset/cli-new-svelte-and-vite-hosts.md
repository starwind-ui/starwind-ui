---
"starwind": minor
---

`starwind init` now works on a new SvelteKit 3 project, and on a recent SvelteKit 2 project with no `svelte.config` file. It reads `files.routes` from the `sveltekit()` plugin options. Older SvelteKit 2 projects with a config file keep working.

`starwind init` now adds the theme script to Vite Vue and Vite Svelte projects, as it does for Vite React. A saved dark theme applies before the first paint.

`starwind init` now adds the `@` alias to the Vite config and `tsconfig` of a Vite Svelte project.

---
"starwind": patch
---

Internal cleanup in the installable component files. Unused imports, variables and helpers are gone. Type-only imports use `import type`, and imports follow one sort order in Astro, React and Vue files and in Svelte `index.ts` files. Svelte components use shorthand prop bindings. This cleanup does not change behavior or the public API.

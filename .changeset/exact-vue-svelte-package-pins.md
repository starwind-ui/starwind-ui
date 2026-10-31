---
"starwind": patch
---

Fixed Vue and Svelte projects saving loose Starwind package versions. With npm, the CLI saved `@starwind-ui/vue@0.3.0` as `^0.3.0`. It now saves the exact version with every supported package manager, and ranges for other packages stay as ranges.

Vue and Svelte components and Primitives that list `@starwind-ui/runtime` directly now use the exact Runtime version of their adapter. Before, a later Runtime release could install a second Runtime copy beside the adapter's copy.

If your `package.json` lists one of these packages with a range such as `^1.4.0`, the next `starwind add` or `starwind update` that needs the package replaces the range with the exact version.

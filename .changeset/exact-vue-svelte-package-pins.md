---
"starwind": patch
---

Fixed Vue and Svelte projects saving loose Starwind package versions. With npm, the CLI saved `@starwind-ui/vue@0.3.0` as `^0.3.0`. It now saves the exact version with every supported package manager. Ranges for other packages stay as ranges.

Vue and Svelte components and Primitives that need `@starwind-ui/runtime` now install the same exact Runtime version as their adapter. Before, a later Runtime release could install a second copy of Runtime beside the adapter's copy.

If your `package.json` lists one of these packages with a range such as `^1.4.0`, or with a version newer than the one the CLI expects, the next `add` or `update` command that needs the package replaces it with the exact version.

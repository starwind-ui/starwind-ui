---
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Made component setup and cleanup consistent across React, Vue, and Svelte. This covers form-reset defaults, state updates, and opening nested overlays.

Fixed the CLI overlooking dependencies in some generated imports. Installed components now include all required files and packages.

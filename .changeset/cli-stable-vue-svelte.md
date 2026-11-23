---
"starwind": patch
---

The CLI now treats Vue and Svelte as stable. The help text no longer calls them beta, and Vue and Svelte components ask for a caret range of the adapter package, for example `^1.6.0`, in place of an exact beta version.

`starwind init` in a Vue project now checks the Vue version. Below 3.5.21, it asks to upgrade Vue and installs the upgrade together with the Vue adapter.

`starwind init` in a SvelteKit project now installs `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css` and `@tailwindcss/forms` as dev dependencies. With pnpm and npm, it moves these packages out of `dependencies` when they are there. With Yarn and Bun, it prints a warning that tells you to move them. SvelteKit 3 with adapter-node 6 fails to build when these packages are in `dependencies`.

If an older CLI set up your SvelteKit 3 project, move `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css` and `@tailwindcss/forms` from `dependencies` to `devDependencies` by hand. `starwind init` does not change a project that is already set up.

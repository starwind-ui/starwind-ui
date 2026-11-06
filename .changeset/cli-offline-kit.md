---
"starwind": minor
---

The CLI now works without a network connection through the new `@starwind-ui/offline` kit, in
beta. Install the kit once while you are online with
`npm install --global @starwind-ui/offline@beta`. Then run
`starwind-offline init` or `starwind-offline add <component>` with the same options as `starwind`.
The kit installs packages through your project's own package manager: npm, pnpm, or Yarn 2 or
later.
Your lockfile keeps the public npm registry URLs, so later online installs work as usual.

Install your project's own dependencies, such as Astro, before you work offline. Starwind Pro and
remote registries still need a network connection.

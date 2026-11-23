---
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
---

`@starwind-ui/vue` and `@starwind-ui/svelte` are now stable. They leave the public beta and release together with `@starwind-ui/runtime`, `@starwind-ui/astro` and `@starwind-ui/react`, starting at 1.6.0. From now on they publish on the `latest` npm tag, and each version depends on the exact `@starwind-ui/runtime` version of the same release. The `beta` tag points to the stable version, so an install command with `@beta` from an older guide gets the stable package.

If you used the beta:

- Replace `@starwind-ui/vue@beta` and `@starwind-ui/svelte@beta` in your install commands and scripts with the plain package name.
- In Vue, upgrade `vue` to 3.5.21 or newer in the same step.
- Run `starwind update` to update your copied Styled components.
- Run `starwind primitives update --all` to update your vendored Primitive files.
- Check the removed exports and context members in these release notes, and the [earlier beta API changes](https://starwind.dev/docs/getting-started/installation/#beta-api-changes), before you update.

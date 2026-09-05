# Starwind Runtime Architecture

Starwind Runtime separates interactive behavior from framework rendering and styled component
composition.

- `@starwind-ui/runtime` owns framework-neutral DOM controllers, state, events, accessibility
  behavior, lifecycle cleanup, and raw HTML initialization.
- `@starwind-ui/astro`, `@starwind-ui/react`, and the `@starwind-ui/vue` public beta expose
  generated Primitive adapters that project framework props, refs, events, and markup onto Runtime
  controllers.
- Styled components remain copied into applications through the `starwind` CLI so application code
  owns its presentation while shared interaction behavior comes from versioned packages.
- Adapter contracts and generators live in `scripts/portable-runtime`; generated package and demo
  output is committed and checked for drift in CI.
- `packages/vue` and `apps/vue-demo` are the Vue 3.5 public-beta package and demo surfaces. Vue uses
  idiomatic models and matching `update:*` events. The target stays outside the stable Runtime,
  Astro, and React fixed package group.
- Svelte adapter verification stays private and is excluded from this public repository, npm
  publication, demos, and CLI support claims.

## Primitive Creation Flow

Primitive generation starts with the shared inventory in
`scripts/portable-runtime/renderers/primitive-inventory.ts`. The generator registry turns those
facts into Generic Adapter Plans or Specialized Adapter Specs, and `primitive-index.ts` consumes
Primitive Inventory facts for package exports. Each registered framework target then projects and
writes its own syntax through
`scripts/portable-runtime/renderers/framework-adapters/target-registry.ts`.

## Styled Component Creation Flow

Styled adapter contracts are projected into framework-neutral Styled Output Models. Each target's
registered styled capability owns framework-specific projection and file output, keeping Astro and
React syntax out of shared component contracts.

## Future Framework Authoring Path

A future framework should add one target home plus one target registration. The target home owns
framework syntax, lifecycle, refs, events, slots or children, context, portals, and final file
policy; shared generators model framework-neutral facts.

## Current Exceptions And Follow-Ups

Astro, React, and the Vue 3.5 beta currently expose the same 36 Runtime-backed Primitive families,
including Color Picker. Vue also has a public integration demo. Svelte remains private, and Solid
remains an architecture fixture. Image is the sole Astro-only Styled contract.

## Stable Packages

The Runtime, Astro adapter, and React adapter packages are versioned in lockstep. The CLI is released
alongside them so generated styled components and vendored Primitive sources request compatible
package versions.

The legacy Core workspace is retained only as canonical source. It is private, ignored by
Changesets, and permanently excluded from package publication.

The stable release supports Astro and React across the current 36-family Primitive surface. Vue 3.5
provides public-beta support across that surface for Vite Vue, Astro Vue, Nuxt 3/4, Laravel with
Inertia Vue, and Quasar Vite SPA/SSR hosts. Future-framework fixtures in generator tests are
non-shipping architecture checks and are not public framework support.

Report Vue beta feedback through the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

## Development

```bash
pnpm runtime:generate:all
pnpm runtime:registry:generate
pnpm runtime:generate:test
pnpm runtime:generate:typecheck
pnpm runtime:test
pnpm demo:smoke
pnpm react-demo:smoke
pnpm vue-demo:smoke
pnpm runtime:size:check
```

See `beta-release.md` for the release lifecycle, `adapter-vocabulary.md` for generator terminology, and
the package source and tests for the current public behavior contracts.

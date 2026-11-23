# Starwind Runtime Architecture

Starwind Runtime separates interactive behavior from framework rendering and styled component
composition.

- `@starwind-ui/runtime` owns framework-neutral DOM controllers, state, events, accessibility
  behavior, lifecycle cleanup, and raw HTML initialization.
- `@starwind-ui/astro`, `@starwind-ui/react`, `@starwind-ui/vue`, and `@starwind-ui/svelte` expose
  generated Primitive adapters that project framework props, refs, events, and markup onto Runtime
  controllers.
- Styled components remain copied into applications through the `starwind` CLI so application code
  owns its presentation while shared interaction behavior comes from versioned packages.
- Adapter contracts and generators live in `scripts/portable-runtime`; generated package and demo
  output is committed and checked for drift in CI.
- `packages/vue` and `apps/vue-demo` are the Vue 3.5 package and demo surfaces. Vue uses idiomatic
  models and matching `update:*` events.
- `packages/svelte` and `apps/svelte-demo` are the Svelte 5 package and demo surfaces.
  The supported hosts are Vite with Svelte, SvelteKit, and Astro with Svelte.

## Shared component recipes

Shared component recipes in `scripts/portable-runtime/renderers/shared-recipes` own the ordered
adapter steps for React, Vue, and Svelte. Runtime Adapter Contracts still own public parts, props,
events, setters, and state facts. A recipe consumes those facts and selects when to connect,
subscribe, accept a value, apply a silent prop command, and clean up.

Framework operations remain in `renderers/framework-adapters/<target>`. They supply framework
syntax, refs, scheduling, context, binding publication, and physical portal placement. Component
operations are allowed where these APIs need different syntax. Keep decisions about accepted
state and operation order in the recipe. Recipes execute during generation; packages contain direct
component code. Styled component copies remain independently editable.

Generic Adapter Plans and Specialized Adapter Specs still select parts and carry contract facts.
Recipes replace the former target-local lifecycle templates for the adopted families. Test changes
to the consumed contract or recipe, rather than a superseded intermediate field. Generator syntax
checks, package correspondence, consumer types, and ordinary browser scenarios cover different
boundaries. A new target must pass each applicable check.

Astro retains its DOM-oriented initialization path. Toast and passive Styled components retain
their existing shared facts where another recipe would add no useful behavior ownership.

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

Astro, React, Vue 3.5, and Svelte 5 expose the same 37 Runtime-backed Primitive
families, including Color Picker. Vue and Svelte have public integration demos. Solid remains an
architecture fixture. Image is the sole Astro-only Styled contract.

## Stable Packages

The Runtime, Astro, React, Vue, and Svelte adapter packages are versioned in lockstep. The CLI is released
alongside them so generated styled components and vendored Primitive sources request compatible
package versions.

The legacy Core workspace is retained only as canonical source. It is private, ignored by
Changesets, and permanently excluded from package publication.

The stable release supports Astro, React, Vue 3.5, and Svelte 5 across the current 37-family
Primitive surface. Vue supports Vite Vue, Astro Vue, Nuxt 3/4, Laravel with Inertia Vue, and Quasar
Vite SPA/SSR hosts. Svelte supports Vite with Svelte, SvelteKit, and Astro with Svelte. Future-framework fixtures in generator tests are
non-shipping architecture checks and are not public framework support.

Report Vue and Svelte issues through the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

## Installed Package Docs

The Runtime, Astro, React, Vue, and Svelte packages ship Markdown docs in `docs/`. Each package's
`prepack` script runs `scripts/portable-runtime/generate-package-docs.ts`, so `pnpm pack` and a
directory publish both include docs for the version in `package.json`. The generator reads layered
docs metadata, the framework surface manifest, and generated package source. It needs no network or
docs website checkout. Git ignores the output.

Run `pnpm packages:docs` to write the docs for review, or `pnpm packages:docs:check` to compare them
with a fresh render. Add `--clean` to remove them. Several packs of one revision can run at once.
Each writer renames finished files into `docs/` and deletes only stale paths.

The release pack step reads each archive. It checks that the docs exist, match the package version,
and link only to package files or absolute URLs. The generator turns website links from authored
metadata into `https://starwind.dev` links. The docs in each package must stay within 48 KiB gzip
and 384 KiB unpacked. The step prints the real archive size, the docs file count, and the docs size.
The docs gzip figure is an estimate of their share of the archive.

Package size checks pack a copy of the package file set without `docs/`. Their results stay the same
when local docs are present, and the size budgets keep their original scope.

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

See `release-guide.md` for the release lifecycle, `adapter-vocabulary.md` for generator terminology, and
the package source and tests for the current public behavior contracts.

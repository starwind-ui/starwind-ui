# Starwind Runtime Architecture

Starwind Runtime separates interactive behavior from framework rendering and styled component
composition.

- `@starwind-ui/runtime` owns framework-neutral DOM controllers, state, events, accessibility
  behavior, lifecycle cleanup, and raw HTML initialization.
- `@starwind-ui/astro` and `@starwind-ui/react` expose generated Primitive adapters that project
  framework props, refs, events, and markup onto Runtime controllers.
- Styled components remain copied into applications through the `starwind` CLI so application code
  owns its presentation while shared interaction behavior comes from versioned packages.
- Adapter contracts and generators live in `scripts/portable-runtime`; generated package and demo
  output is committed and checked for drift in CI.

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

Astro and React currently expose the same 36 Runtime-backed Primitive families, including Color
Picker. Vue and Solid targets are non-shipping architecture fixtures, and Svelte remains deferred.

## Beta Packages

The Runtime, Astro adapter, and React adapter packages are versioned in lockstep. The CLI is released
alongside them so generated styled components and vendored Primitive sources request compatible
package versions.

The beta supports Astro and React across the current 36-family Primitive surface. Future-framework
fixtures in generator tests are non-shipping architecture checks and are not public framework
support.

## Development

```bash
pnpm runtime:generate:all
pnpm runtime:registry:generate
pnpm runtime:generate:test
pnpm runtime:generate:typecheck
pnpm runtime:test
pnpm demo:smoke
pnpm react-demo:smoke
pnpm runtime:size:check
```

See `beta-release.md` for the release gate, `adapter-vocabulary.md` for generator terminology, and
the package source and tests for the current public behavior contracts.

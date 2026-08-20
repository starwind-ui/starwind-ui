# CLI Registry Manifests

This directory contains the human-edited version manifests used to build the Starwind CLI's bundled
registry artifacts.

- `styled-component-versions.json`: Registry snapshot version and per-component styled
  implementation versions.
- `primitive-versions.json`: Per-primitive source vendoring versions.

Do not edit generated registry output under `packages/cli/src/registry` by hand. After changing a
manifest, package metadata, or a Runtime adapter contract, regenerate the bundled registry:

```bash
pnpm runtime:registry:generate
pnpm exec vitest run scripts/portable-runtime/tests/generate-cli-registry.test.ts
```

Use semver for all registry and component versions. Follow `docs/release/versioning.md` for the
independent CLI package and component release rules.

## Deferred registry component versions

Styled and primitive component versions advance once per package release rather than once per
implementation PR.

### Styled components

For every existing component whose installable generated source changes:

- Add a strict intent file at `.changeset/styled-components/<slug>.json` with a `patch`, `minor`, or
  `major` bump and add a `starwind` patch Changeset for component delivery.
- Do not edit the existing entry in `styled-component-versions.json` in the implementation PR.
- Regenerate the bundled registry so its source remains current. The component version stays at the
  last release value until the generated Version Packages PR is built.
- `pnpm release:version` groups all pending intents by component, applies the highest requested bump
  exactly once, consumes the intents, and regenerates the bundled registry inside the existing
  Changesets Version Packages PR.
- A guarded forward correction to a component's published legacy baseline fulfills that
  implementation batch's version intent. Release maintenance may remove the redundant bump only
  when the manifest remains at the exact recorded legacy baseline; subsequent source changes resume
  normal deferred bumps.
- The release workflow temporarily stages the intent directory outside `.changeset` before the
  Changesets action runs because Changesets interprets nested directories as legacy v1 changesets.
  The staging directory is ignored and must never be committed.

Every new stable styled component receives an explicit initial manifest entry and a `starwind`
minor Changeset because it expands the installable catalog. It has no previous component release
version to bump. `defaultComponentVersion` remains only a scaffolding hint.

### Primitive components

For every existing primitive whose installable Astro or React vendoring artifact changes:

- Add a strict intent file at `.changeset/primitive-components/<slug>.json` containing a
  `primitives` object and add a `starwind` patch Changeset for component delivery.
- Use `patch` for compatible fixes, `minor` for backward-compatible capabilities, and `major` for
  breaking API or behavior changes.
- Do not edit the existing entry in `primitive-versions.json`. Regenerate registry artifacts so the
  new source is current while its version remains at the last released value.
- `pnpm release:version` groups pending intents, applies the highest requested bump once, consumes
  the intents, and regenerates the primitive artifacts in the Version Packages PR.

The stable baseline promotion uses one full-inventory `major` intent while every Primitive remains
below `1.0.0`. `pnpm release:version` promotes every existing Primitive and
`defaultPrimitiveVersion` to `1.0.0` together. Partial or repeated metadata-only promotion intents
are rejected.

New primitives receive an explicit initial manifest entry and no deferred intent. Stable new
primitives start at `1.0.0` and schedule a `starwind` minor because they expand the installable
catalog.

Continue to bump `registryVersion` only when the registry schema or artifact distribution changes.
Package Changesets and changelog history do not substitute for styled or primitive version intent.

The component bump never sets the CLI package bump. An existing component major still schedules a
`starwind` patch unless the same work contains an independent CLI contract change. An agent must
never create or modify a `starwind` major Changeset without express user consent for that CLI major
in the current task.

When replacing a component that was already published through the legacy core registry, continue
from that component's published version history. A Runtime-backed rewrite is a breaking change and
advances to the next major version. A compatible generated styled port advances the legacy version
by minor or patch according to its public API and visual changes. Reserve `1.0.0` baselines for
styled components that did not exist in the legacy registry; do not restart existing components at
`0.x`.

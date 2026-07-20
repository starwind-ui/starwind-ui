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

Use semver for all registry and component versions.

## Deferred styled component versions

Styled component versions advance once per package release rather than once per implementation PR.
For every existing component whose installable generated source changes:

- Add a strict intent file at `.changeset/styled-components/<slug>.json` with a `patch`, `minor`, or
  `major` bump and add the normal `starwind` package Changeset.
- Do not edit the existing entry in `styled-component-versions.json` in the implementation PR.
- Regenerate the bundled registry so its source remains current. The component version stays at the
  last release value until the generated Version Packages PR is built.
- `pnpm release:version` groups all pending intents by component, applies the highest requested bump
  exactly once, consumes the intents, and regenerates the bundled registry inside the existing
  Changesets Version Packages PR.
- The release workflow temporarily stages the intent directory outside `.changeset` before the
  Changesets action runs because Changesets interprets nested directories as legacy v1 changesets.
  The staging directory is ignored and must never be committed.

Every new styled component still receives an explicit initial manifest entry in its implementation
PR; it has no previous release version to bump. `defaultComponentVersion` remains only a scaffolding
hint.

Primitive versions continue to follow their separate vendoring policy and may receive patch or
minor bumps within `0.x` during beta. Do not advance a primitive to `1.0.0` until Starwind v3 and the
Runtime leave beta.

Continue to bump `registryVersion` only when the registry schema or artifact distribution changes.
Package Changesets and changelog history do not substitute for styled or primitive version intent.

When replacing a component that was already published through the legacy core registry, continue
from that component's published version history. A Runtime-backed rewrite is a breaking change and
advances to the next major version. A compatible generated styled port advances the legacy version
by minor or patch according to its public API and visual changes. Reserve `1.0.0` baselines for
styled components that did not exist in the legacy registry; do not restart existing components at
`0.x`.

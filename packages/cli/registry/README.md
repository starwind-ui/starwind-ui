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

## Starwind v3 beta policy

While Starwind v3 and the Runtime are in beta:

- Keep existing styled component entries in `styled-component-versions.json` frozen. Changes to a
  styled contract, generated styled output, or bundled registry content do not trigger a styled
  component version bump during the beta.
- Give every new styled component an explicit initial manifest entry. The freeze applies to bumps
  of existing entries, not to registering a new component.
- Primitive versions may receive patch or minor bumps within `0.x`. Do not advance a primitive to
  `1.0.0` until Starwind v3 and the Runtime leave beta.
- Continue to bump `registryVersion` when the registry schema or artifact distribution changes;
  the styled component freeze does not apply to the registry snapshot version.
- Changesets and documentation changelog entries may still record changes that apply specifically
  to the beta. Package release intent and changelog history do not imply a styled or primitive
  registry version bump.

When styled component version bumps resume after the beta, bump only the component whose shipped
source changed.

When replacing a component that was already published through the legacy core registry, continue
from that component's published version history. A Runtime-backed rewrite is a breaking change and
advances to the next major version. A compatible generated styled port advances the legacy version
by minor or patch according to its public API and visual changes. Reserve `1.0.0` baselines for
styled components that did not exist in the legacy registry; do not restart existing components at
`0.x`.

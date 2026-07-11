# Runtime Beta Release

This beta release path covers the public package set:

- `@starwind-ui/runtime`
- `@starwind-ui/astro`
- `@starwind-ui/react`
- `starwind`

## Versioning

Use numbered SemVer prereleases for beta packages and publish them with the npm `beta` dist-tag.
The first public Runtime/adapters beta is `0.1.0-beta.1` across the lockstep package group, and the
CLI beta is `3.0.0-beta.1`.

Keep `latest` reserved for stable releases. A stable release from the same line drops the prerelease
suffix, for example `0.1.0-beta.N` becomes `0.1.0`.

The beta branch is in Changesets prerelease mode with the `beta` tag. Increment betas with
`pnpm changeset version`; do not hand-edit prerelease versions. Exit prerelease mode only when the
stable release has passed the complete beta gate.

For `beta.1`, `cli-runtime-release` and `runtime-adapter-platform` are already applied in
`.changeset/pre.json`. `pnpm changeset status --verbose` must report no pending releases before the
public branch is merged. New work for `beta.2` and later requires a new Changeset before running
`pnpm changeset version`.

The empty `runtime-beta-release-preparation` Changeset records release-only hardening that is already
included in beta.1. Keep it unconsumed until the Runtime import lands on `main`; it prevents
Changesets from treating the public feature-branch diff as undocumented package work without
scheduling beta.2.

## Commands

Run the package dry-run first:

```bash
pnpm publish:beta:dry-run
```

Publish the beta package set from a clean checkout of public `main` after fetching `origin/main`:

```bash
pnpm publish:beta
```

Both commands regenerate package and registry artifacts, then run the complete beta gate: repository
verification, Astro and React browser smoke tests, dependency audit, and package-size budgets. After
the gate, they rebuild the publishable JavaScript packages directly so a Turbo cache restore cannot
leave obsolete files in `dist` before packing.

Package-size release blocking uses Starwind's absolute minified-plus-gzip ceilings. Matched-support
measurements against Zag and Base UI remain visible as comparison advisories, but competitor ordering
does not block a release because the mapped support sets are not exact behavior-equivalence tests.

The publish helper uses `pnpm publish --tag beta --access public` for each package. A real publish
refuses to run unless the checkout belongs to `starwind-ui/starwind-ui`, the working tree is clean,
the current branch is `main`, and `HEAD` exactly matches the locally fetched `origin/main`. Dry-runs
remain available from the private source repository and the public `runtime` branch.

## First beta publication

Before publishing, confirm that all four exact target versions are unused on npm and inspect the
existing dist-tags. Publish in dependency order: Runtime, Astro, React, then the `starwind` CLI. The
helper enforces this order. Keep every prerelease on the `beta` tag and leave `latest` unchanged.

After publishing, verify the exact versions, dist-tags, repository metadata, packed file lists, and
the Astro/React dependencies on Runtime. Then install `starwind@beta` in disposable Astro and React
projects, add `button`, `dialog`, and `context-menu`, build both projects, and exercise Dialog and
Context Menu behavior in a browser.

Run the persistent published-package acceptance harness with the exact CLI version:

```bash
pnpm test:published-beta -- --version 3.0.0-beta.1
```

The harness creates disposable Astro and React projects, installs the exact published CLI, verifies
the installed adapter and Runtime beta versions, builds both projects, and checks Dialog and Context
Menu behavior in Chromium. It removes temporary projects after the run. The public repository also
exposes the same check as the manually dispatched **Published Beta Acceptance** workflow, with logs,
screenshots on browser failure, and a package-version summary uploaded as workflow diagnostics.

## Partial publish recovery

If publishing fails, stop and query all four exact versions on npm. Continue only when the packages
already present form a valid prefix of the intended publish order. Re-run the prepare and release
gates, then resume from the first missing package:

```bash
node scripts/release-beta-packages.mjs --publish --resume-from @starwind-ui/astro
```

Replace the package name with the first missing package. Do not republish an existing version,
unpublish a package, increment versions, or move dist-tags during recovery. If registry state is not
a valid prefix, investigate before making further registry changes.

## Known limitation

Color Picker does not have a Runtime implementation in this beta and is not available in fresh
Runtime or React installs. Migration keeps the recognized legacy Astro implementation and adds a
compatibility listener for Runtime Select. Customized Color Pickers retain legacy Select and receive
an explicit manual verification warning while unrelated components continue migrating.

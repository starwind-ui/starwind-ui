# Runtime Prerelease Guide

This release path covers the public package set:

- `@starwind-ui/runtime`
- `@starwind-ui/astro`
- `@starwind-ui/react`
- `starwind`

## Versioning And Channels

Use numbered SemVer prereleases and publish them with the matching npm dist-tag. Changesets
prerelease state is the source for the active channel: `beta`, `rc`, or another prerelease tag.
Stable package versions publish with `latest` only after prerelease state has been fully consumed.

Runtime, Astro, and React are versioned in lockstep. Release the CLI alongside them so generated
styled components and vendored Primitive sources request compatible package versions. Use
`pnpm changeset version` to advance versions; do not hand-edit prerelease versions. Before a release,
`pnpm changeset status --verbose` must describe the intended package set with no unexplained pending
work.

Keep `latest` reserved for stable releases. A stable release from the same line drops the
prerelease suffix only after the complete release gate passes.

## Prepare And Dry Run

Start from a clean checkout of public `main`, fetch `origin/main`, and confirm that local `HEAD`
matches the fetched branch. Record the four intended package versions, verify that each version is
unused on npm, and inspect the existing dist-tags before publication.

Run the package dry-run first:

```bash
pnpm publish:release:dry-run
```

The dry-run prepares and packs the package set without publishing. Inspect the packed file lists,
package metadata, dependency ranges, derived channel, and release summary before continuing.

## Release Gate And Publication

The release helpers regenerate package and registry artifacts, then run repository verification,
Astro and React browser smoke tests, dependency audit, and package-size budgets. After the gate,
they rebuild publishable JavaScript packages directly so a Turbo cache restore cannot leave obsolete
files in `dist` before packing.

Package-size release blocking uses Starwind's absolute minified-plus-gzip ceilings. Matched-support
measurements against Zag and Base UI are comparison advisories, not release gates, because the
mapped support sets are not exact behavior-equivalence tests.

For a prerelease on the beta channel, run:

```bash
pnpm publish:beta
```

`pnpm publish:beta` is a compatibility alias for the channel-aware publisher. For a stable release,
run:

```bash
pnpm publish:release
```

The publisher derives the npm tag from Changesets state and uses `latest` only for stable versions.
It publishes with public access in dependency order: Runtime, Astro, React, then the `starwind` CLI.
A real publish refuses to run unless the checkout belongs to `starwind-ui/starwind-ui`, the working
tree is clean, the current branch is `main`, and `HEAD` exactly matches the locally fetched
`origin/main`.

## Published Acceptance

After publishing, query npm for all four exact versions and verify:

- the expected dist-tag points to the intended versions
- `latest` was unchanged for a prerelease
- repository metadata and packed file lists are correct
- Astro and React declare the intended Runtime version
- the CLI declares compatible adapter and Runtime requirements

Install the released CLI in disposable Astro and React projects, add `button`, `dialog`, and
`context-menu`, build both projects, and exercise Dialog and Context Menu behavior in a browser.

Run the persistent published-package acceptance harness with the exact CLI version:

```bash
pnpm test:published-release -- --version <cli-version>
```

The harness creates disposable Astro and React projects, installs the exact published CLI, verifies
the installed adapter and Runtime versions, builds both projects, and checks Dialog and Context Menu
behavior in Chromium. It removes temporary projects after the run. The public repository also
provides the manually dispatched **Published Beta Acceptance** workflow, with logs, screenshots on
browser failure, and a package-version summary uploaded as workflow diagnostics.

Acceptance is complete only when registry queries, package metadata, both disposable consumer
builds, and browser behavior checks all pass.

## Partial Publish Recovery

If publishing fails, stop and query all four exact versions on npm. Continue only when the packages
already present form a valid prefix of the intended publish order. Re-run the prepare and release
gates, then resume from the first missing package:

```bash
node scripts/release-packages.mjs --publish --resume-from <first-missing-package>
```

Do not republish an existing version, unpublish a package, increment versions, or move dist-tags
during recovery. If registry state is not a valid prefix, investigate and reconcile the registry
state before making further changes.

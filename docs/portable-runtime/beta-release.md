# Runtime Prerelease Guide

This release path covers the public package set:

- `@starwind-ui/runtime`
- `@starwind-ui/astro`
- `@starwind-ui/react`
- `starwind`

## Versioning And Channels

Follow `docs/release/versioning.md` when classifying package and component changes. Component
versions remain independent from the `starwind` package version. An agent needs express user
consent in the current task before it can create or modify a `starwind` major Changeset.

Use numbered SemVer prereleases and publish them with the matching npm dist-tag. Changesets
prerelease state is the source for the active channel: `beta`, `rc`, or another prerelease tag.
Stable package versions publish with `latest` only after prerelease state has been fully consumed.

Runtime, Astro, and React are versioned in lockstep. Release the CLI alongside them so generated
styled components and vendored Primitive sources request compatible package versions. Use
`pnpm release:version` to consolidate deferred styled component intent, regenerate registry
artifacts, and advance package versions; do not hand-edit prerelease versions. Before a release,
`pnpm release:status` must describe the intended package set with no unexplained pending work. This
wrapper temporarily stages the deferred Styled and Primitive version-intent directories before it
runs Changesets status.

Keep `latest` reserved for stable releases. The first stable Runtime adapter line is `1.0.0`, while
the first stable CLI line is `3.0.0`. Do not publish Runtime, Astro, or React as `0.1.0` stable.

When stable publication is authorized, add one release-only major Changeset for
`@starwind-ui/runtime`, `@starwind-ui/astro`, and `@starwind-ui/react`. Then run
`pnpm changeset pre exit` and commit its prerelease-exit intent before the Version Packages PR runs
`pnpm release:version`. Inspect that PR and require these exact first-stable versions:

- `@starwind-ui/runtime@1.0.0`
- `@starwind-ui/astro@1.0.0`
- `@starwind-ui/react@1.0.0`
- `starwind@3.0.0`

Release metadata validation rejects a stable Runtime adapter version below `1.0.0`.

## Prepare, Gate, And Dry Run

Start from a clean checkout of public `main`, fetch `origin/main`, and confirm that local `HEAD`
matches the fetched branch. Record the four intended package versions, verify that each version is
unused on npm, and inspect the existing dist-tags before publication.

Prepare the package set:

```bash
pnpm release:prepare
```

Run the complete release gate once against those prepared files:

```bash
pnpm release:gate
```

This command runs repository verification, the production dependency audit, both demo smoke tests,
the prepared package-size check, and the ten-project candidate matrix. If the prepared files change,
prepare them again and restart the gate.

After the gate passes, run the package dry-run:

```bash
pnpm publish:release:dry-run
```

The dry-run validates the release artifacts and runs the publisher in dry-run mode. It does not
prepare the packages or repeat the release gate. Inspect the packed file lists, package metadata,
dependency ranges, derived channel, and release summary before continuing.

## Release Gate And Publication

The ten-project packed-candidate matrix covers Astro 5, Astro 7, Vite React 18,
Vite React 19 with TypeScript, Vite React 19 with JavaScript, Vite React 19 with npm, Next.js App
Router, Next.js Pages Router, TanStack Start, and React Router. It checks framework auto-detection,
all-component installation, update/remove/add lifecycle behavior, framework checks, production
builds, React SSR, and browser behavior.

Run this matrix once for each prepared package set. Public Runtime synchronization and
published-package acceptance consume the prepared or published packages. They do not repeat the
candidate matrix.

Node 24 remains the repository test and build environment. First pack the prepared public artifacts
under Node 24:

```bash
pnpm release:pack:public-artifacts
```

Then switch to exact Node `22.12.0`, confirm `node --version` reports `v22.12.0`, and run the
public-consumer smoke:

```bash
npm run release:consumer:node22
```

Both commands use `.release-packs` as their package directory. CI uses these same commands in its
Node 24 pack and exact Node `22.12.0` consume steps. The consumer phase uses the npm bundled with
Node 22.12.0 and has no pnpm runtime dependency. The smoke uses packed public packages in
disposable Astro 7 and Vite React 19 JavaScript projects. It runs the installed CLI, installs
representative components, verifies exact package versions, and completes production builds. It
does not run repository tests or the full candidate matrix.

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

After all four exact versions and their npm dist-tags are visible, the publisher finalizes the
release. It creates and pushes one annotated product tag from the CLI version, such as
`v3.0.0-beta.8`. It pushes only that explicit tag ref. It then creates a GitHub Release with
generated notes. Any SemVer prerelease becomes a GitHub prerelease and does not become the latest
release. A stable version becomes the latest GitHub release.

Finalization checks local and remote tag targets plus existing GitHub Release metadata before it
writes anything. A retry succeeds when the tag target and release classification already match.
It stops when an existing tag points to another commit or when the GitHub Release classification
differs.

## Published Acceptance

After publishing, query npm for all four exact versions and verify:

- the expected dist-tag points to the intended versions
- `latest` was unchanged for a prerelease
- repository metadata and packed file lists are correct
- Astro and React declare the intended Runtime version
- the CLI declares compatible adapter and Runtime requirements

Install the released CLI in disposable Astro and React projects, add `button`, `dialog`,
`context-menu`, and `color-picker`, build both projects, and exercise Dialog, Context Menu, and
Color Picker behavior in a browser.

Run the persistent published-package acceptance harness with the exact CLI version:

```bash
pnpm test:published-release -- --version <cli-version>
```

The harness creates disposable Astro and React projects, installs the exact published CLI, verifies
the installed adapter and Runtime versions, builds both projects, and checks Dialog, Context Menu,
and Color Picker behavior in Chromium. It removes temporary projects after the run. The public repository also
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

The publisher creates no tag after a partial package publish. When all four versions are present
but tag or GitHub Release creation failed, use the idempotent recovery command:

```bash
pnpm release:finalize
```

This command revalidates public `main`, all four exact npm versions, the derived dist-tag, local and
remote tag targets, and GitHub Release metadata. It completes the missing finalization steps without
publishing an npm package again. Never force or move a release tag during recovery.

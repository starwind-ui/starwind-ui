# Size checks

`pnpm runtime:size:check` builds Runtime, React and Vue once, then compares their sizes with
`scripts/portable-runtime/evidence/package-size-accepted.json`. The snapshot contains the last
reviewed sizes. The check prints the changed rows with their previous size, current size, added gzip
bytes and percentage. Its saved diagnostic report contains all rows.

The current baseline was accepted on September 28, 2026. It includes the shared recipe migration,
recent component fixes and the Field registration split. Earlier captures remain historical evidence.
The current Runtime, React and Vue package sizes are accepted.

## Check a change

Run the normal command after editing package source:

```sh
pnpm runtime:size:check
```

If the affected packages have already been built, reuse those outputs:

```sh
pnpm runtime:size:check:prepared --snapshot /tmp/starwind-size-after.json
```

The check saves a candidate snapshot even when a size increase fails. It prints the snapshot path and
the path to the complete measurements. Check mode reuses saved competitor results and runs no browser
timing tests. Each bundle receives one deterministic size capture.

## Compare a specific base

Capture the accepted base before editing, using its built packages:

```sh
pnpm runtime:size:check:prepared --snapshot /tmp/starwind-size-before.json
```

After making the change, build and compare against that file:

```sh
pnpm runtime:size:check --compare-to /tmp/starwind-size-before.json --snapshot /tmp/starwind-size-after.json
```

Use matching dependencies and compiler versions to isolate a source change. Each snapshot records the
commit, whether the worktree had changes, the lockfile digest and the esbuild version. A changed
lockfile or compiler produces a note because the result includes that change too. Framework engines
are external, while Runtime is included in component imports. Deferred chunks stay outside initial
browser gzip totals. The Vue archive row measures the installed package separately.

## Review and accept

Review the added bytes and the affected component imports. After a change is accepted, replace the
committed snapshot with its saved candidate and commit it with that change:

```sh
cp /tmp/starwind-size-after.json scripts/portable-runtime/evidence/package-size-accepted.json
```

This keeps the next comparison tied to accepted work. The measurement command always writes a separate
candidate file. It cannot overwrite the active baseline. A failed check requires review before its
candidate becomes the baseline. Include the reason for accepted growth in the change description.

| Measurement                                 | Review warning                          | Failure                                           |
| ------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Catalog or matched component set            | Each increase is shown                  | Growth above 10% or 15 KiB, whichever comes first |
| Individual component or Vue package archive | Growth above the greater of 5% or 1 KiB | Growth above the greater of 10% or 2 KiB          |

Field's React import retains its 22 KiB absolute ceiling. The standalone Runtime Color Picker ceiling
remains 24 KiB. These are additional checks. New imports appear as new rows for review; missing or
invalid measurements fail. Existing rows must remain in the snapshot, including when their new size is
zero. An intentional component removal requires an explicit baseline review.

The command measures complete Runtime, React and Vue catalogs, every public React and Vue component
entry, and the saved overlap sets. Astro's route checks and Svelte's production size report use their
existing separate commands. Product comparisons remain in
[the browser-size report](./product-package-size-comparison.md).

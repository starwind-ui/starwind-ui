# Direction verification

`pnpm direction:inventory --self-test` checks the public matrix against the canonical checkout. The browser runner generates components into a temporary candidate, then builds real Astro, React, Vue and Svelte consumer pages.

Run `pnpm direction:test` (or its alias `pnpm direction:browser`) for the full suite in Chromium. It builds every fixture once, runs the results in parallel workers and prints one summary per shard. Each worker owns its own browser. Use these options as needed:

- `--case <case-or-cohort>` runs one case or cohort and builds only its pages.
- `--shard <0-7>` runs one of the eight partitions.
- `--engines all` adds Firefox and WebKit for the cases whose engine plan names them. You can also give a list such as `--engines chromium,webkit`.
- `--workers <count>` sets the number of parallel browser pages. The default is half the CPU cores, at most 8, for Chromium alone, and two thirds of the cores, at most 12, for several engines. `--max-workers <count>` caps that default.
- `--artifact-dir <directory>` sets the parent folder for the build and `browser.json`. The default is `node_modules/.cache/starwind-direction`. The folder must share the top-level folder of the checkout, because Astro resolves other absolute paths against its own root.
- `--keep-artifacts` keeps the run folder after a passing run.
- `--verbose` prints every result.

A passing `browser` run in the default parent removes its run folder. A failed run keeps it, and each failed result keeps one screenshot under `failures/`. `stage` and `build` runs, and runs with `--artifact-dir`, also keep their folder. Each run owns its Vite and Astro caches, so several runs can build at the same time in one checkout. Run durations go to `node_modules/.cache/starwind-direction/durations.json`, and the next run starts the longest results first.

The release gate runs `pnpm direction:test --engines all --max-workers 10` beside its other lanes, and the installed-host check. CI does not run the browser suite.

Build the six public packages and run `pnpm release:pack:public-artifacts`. Then use `pnpm direction:installed <temporary-parent>` to install those shipping archives into four fresh and four retained consumer hosts and check their compiled styles in a browser. Pass `--packs <directory>` to read archives from another pack folder, as the release gate does. Keep the parent folder outside the checkout, because a host inside it reads the checkout's configuration files. Its separate receipt includes the archive hashes.

`pnpm direction:stage --case <case-or-cohort>` remains available for targeted diagnosis.

# Candidate consumer proof

This cohort checks the scoped direction variants in temporary generated consumers. The installed-host proof lives in `packages/cli/tests/integration/direction`.

Run the installed proof from the repository root with two new absolute temporary directories:

```sh
pnpm exec tsx packages/cli/tests/integration/direction/run-candidate-packs.ts /private/tmp/candidate-packs
pnpm exec tsx packages/cli/tests/integration/direction/run-installed-hosts.ts /private/tmp/candidate-hosts /private/tmp/candidate-packs/candidate-packs.json
pnpm exec tsx packages/cli/tests/integration/direction/run-installed-browsers.ts /private/tmp/candidate-hosts
```

The first command builds six candidate archives from authored sources and records each SHA256. The second command installs the packed CLI in eight Astro, React, Vue, and Svelte hosts. Each retained host starts with historical copied Switch files and config versions. Normal Styled and Primitive updates must replace those files with the candidate payload while preserving the stylesheet bytes. The third command checks compiled style, Switch forms, Slider geometry, Tabs keys, and the exact two-definition repair of the retained nested LTR island.

The `candidate-packs.json`, `installed-hosts.json`, and `installed-browser.json` reports record the candidate source revision, archive hashes, host paths, versions, and observed geometry. The Slider values are logical. Browser rectangles and the public left/right margin utilities remain physical.

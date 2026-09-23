# Svelte 5 beta demo

This workspace runs the Svelte 5 public-beta Styled review at `/review/`.
The demo workspace stays private at `0.0.0`.

From this app directory, run `pnpm dev`. Startup builds the Runtime and Svelte workspace packages
before Vite starts, so a fresh checkout has the package exports needed by the demo.
From the repository root, use `pnpm svelte:demo:dev`.

The production build and verification commands expect built workspace dependencies:

```sh
pnpm runtime:build
pnpm svelte:build
pnpm svelte:demo:build
```

Run `pnpm svelte:verify` from the repository root to check changed Svelte inputs. The
[verification policy](../../docs/agents/svelte-verification.md) describes component selection,
compiler compatibility, and packed host checks.

The default demo test checks the catalog shell, source display, and theme control. Select a changed
example with `pnpm svelte:demo:test --component=combobox`. Use `--layout` when changing layout lifecycle.
Tests require a production build and installed Google Chrome.

For a visual change, use `pnpm svelte:demo:test --component=combobox --visual`. Each invocation uses
one viewport and theme. Add `--width=390` or `--theme=dark` when that dimension is affected. Captures
are written to ignored `test-results/`; failures also save a diagnostic image. There is no required
catalog capture count.

Open [the review page](http://127.0.0.1:4173/review/) with
`pnpm svelte:demo:preview --host 127.0.0.1 --port 4173 --strictPort` for manual review. Follow the current
task's manual review and landing boundaries. Prior rollout reports remain historical evidence.

`src/routes/review/+page.server.ts` reads the Svelte target inventory during prerendering.
Handwritten examples live under `src/lib/review`. The generator owns `src/lib/starwind-runtime`;
app formatting excludes that directory. The shared Astro demo stylesheet supplies theme tokens.
Each Styled section starts with the standard docs preview from `src/lib/review/docs`, followed by
its additional examples. The preview includes its Svelte source and a link to the matching docs.
See [the docs example notes](src/lib/review/docs/README.md) for the source reference and adaptations.
The root layout emits the Theme initialization script before page content and owns the shared
document controller. Each Theme Toggle resynchronizes controls when it mounts. Removing an
individual control preserves the controller; layout teardown destroys it. The layout uses the
`colorTheme` storage key with a `system` default and the `dark` class in both initialization paths.

SvelteKit uses `adapter-static` with root prerendering, SSR enabled, and trailing slashes.
See the official [static adapter documentation](https://svelte.dev/docs/kit/adapter-static) and
[project structure](https://svelte.dev/docs/kit/project-structure).

With Kit 2.70.3 and Svelte 5.29.0, Rollup reports missing namespace exports for `fork` and `settled`
in both client and SSR builds. Kit guards `fork` with `__SVELTEKIT_FORK_PRELOADS__ && svelte.fork`
and calls `svelte.settled?.()` in `src/runtime/client/client.js`. These optional API probes preserve
the floor behavior. Keep these warnings visible. The production browser gate must pass with zero
console warnings, errors, or hydration diagnostics.

## Stock component review

The catalog uses generated Styled components and their contract-owned variants. Keep review-page
headings, captions, source panels and controls scoped to explicit review classes or page-owned
containers. Global element rules for paragraphs, headings, links, outputs or code blocks can
change component spacing and typography, so the review stylesheet must not apply them to examples.

The first preview keeps the content, variants, and composition shown in the Styled docs. Label it
as the docs example, including any dimensions used by the docs. The other examples use stock
component styles by default. When an example needs custom dimensions, content styling or a layout
override, identify that override beside the example. Keep its source visible. Select the affected
examples for visual checks and include each viewport or theme that the change affects.

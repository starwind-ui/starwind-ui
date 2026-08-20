# Svelte Framework Adapter

This folder contains the private, non-shipping Svelte 5.29+ target. It uses runes-era
components, typed `$props`, callback event properties, snippets, Svelte context, and attachments.
Attachments own DOM connection and exact cleanup; reactive setter effects update an existing
Runtime controller without reconnecting it.

Select is the one portal-placement proof in this private cohort. Its Svelte 5.29+ attachment moves
one stable public Portal wrapper after hydration. Runtime resolves the accepted target and receives
pending and ready placement reports before it starts floating work. The attachment restores the
same wrapper during target changes and cleanup. This proof does not add Svelte support beyond the
private verification target.
See the current [Svelte attachment reference](https://svelte.dev/docs/svelte/%40attach) for the
5.29+ mount, rerun, and cleanup lifecycle used by this proof.

Generated output lives in the private `@starwind-ui/svelte` workspace package under
`packages/svelte/src`. Do not add CLI registry entries, demo dependencies, install docs, public
support claims, Changesets, or publication wiring from this folder. The target supports exactly
Button, Carousel, Checkbox, Select, Accordion, Dialog, Slider, and Toast. Carousel and Toast are the
approved order-10 cross-framework proofs. Sidebar, Color Picker, Styled output, and a Svelte demo
remain outside this target.

Run `pnpm svelte:verify` for deterministic generation, the committed-output check, strict Svelte
types, package build, SSR, hydration, browser lifecycle, cleanup, declarations, and dist-only
consumer checks. Run `pnpm runtime:generate:svelte:test` for the target-local proof suite.

Before extending the setup model, read `docs/portable-runtime/framework-renderer-authoring.md` for
the target-local renderer fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Svelte syntax, props, events, snippets, context, refs, attachments, helper files, output
  writing, exports, and lifecycle projection inside this folder.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro,
  React, and private Vue.
- Keep the single Svelte registration in the central target registry explicitly non-shipping.
- Keep Runtime behavior in `packages/runtime`; this folder only projects Svelte syntax onto Runtime
  controllers.

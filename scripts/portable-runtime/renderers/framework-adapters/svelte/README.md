# Svelte Framework Adapter

This folder contains the private, non-shipping Svelte 5.29+ target. It uses runes-era
components, typed `$props`, callback event properties, snippets, Svelte context, and attachments.
Attachments own DOM connection and exact cleanup; reactive setter effects update an existing
Runtime controller without reconnecting it.

Generated output lives in the private `@starwind-ui/svelte` workspace package under
`packages/svelte/src`. Do not add CLI registry entries, demo dependencies, install docs, public
support claims, Changesets, or publication wiring from this folder. The target supports exactly
Button, Checkbox, and Select.

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

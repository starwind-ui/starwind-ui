# Svelte Framework Adapter

Svelte support is deferred. There is no shipping Svelte Framework Adapter until the setup model is
chosen for actions, component wrappers, cleanup, context, refs, events, snippets/slots, and
teleport-style portal behavior.

Do not add Svelte package exports, CLI registry entries, demo dependencies, install docs, or public
support claims from this folder. Future work should first decide the setup model, then add a
non-shipping conformance adapter and tracer fixtures through the same Adapter Output Model seam.

Before choosing or implementing that setup model, read
`docs/portable-runtime/framework-renderer-authoring.md` for the target-local renderer
fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Svelte syntax, props, events, snippets/slots, context, refs, action/component setup, helper
  files, output writing, exports, and lifecycle projection inside this folder.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro and
  React after the setup model is accepted.
- Register Svelte once through the central target registry only after the non-shipping conformance
  adapter exists.
- Keep Runtime behavior in `packages/runtime`; this folder should only project Svelte syntax onto
  Runtime controllers.

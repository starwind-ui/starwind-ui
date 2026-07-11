# Solid Framework Adapter

This is the non-shipping Solid Framework Adapter home for future-framework tracer work. It exists so
a Solid adapter author can start in one folder, inspect the required Framework Adapter surface, and
see the target-specific choices for Solid TSX, signals/effects, refs, callback props, children,
context, cleanup, and Portal.

The adapter in this folder is conformance-only. It is allowed to print deterministic
`__future-fixtures/solid` review fixtures, but it must not create package exports, CLI registry
entries, demo dependencies, install docs, or public Solid support claims.

Before expanding this tracer, read `docs/portable-runtime/framework-renderer-authoring.md` for the
target-local renderer fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Solid syntax, props, refs, callbacks, children, context, Portal, helper files, output
  writing, exports, and lifecycle projection inside this folder.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro and
  React.
- Register Solid once through the central target registry only when a future issue explicitly adds
  Solid to a target-registry conformance or package-generation path.
- Keep Runtime behavior in `packages/runtime`; this folder only projects Solid syntax onto Runtime
  controllers.

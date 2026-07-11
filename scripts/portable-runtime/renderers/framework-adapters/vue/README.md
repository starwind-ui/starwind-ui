# Vue Framework Adapter

This is the non-shipping Vue Framework Adapter home for future-framework tracer work. It exists so a
Vue adapter author can start in one folder, inspect the required Framework Adapter surface, and see
the target-specific choices for Vue syntax, lifecycle, refs, emits, slots, provide/inject, and
Teleport.

The adapter in this folder is conformance-only. It is allowed to print deterministic
`__future-fixtures/vue` review fixtures, but it must not create package exports, CLI registry
entries, demo dependencies, install docs, or public Vue support claims.

The active Tier 0 slice is Button, Checkbox, and Select. Run
`pnpm runtime:generate:vue:check` to generate those SFCs into a temporary directory, typecheck them
with `vue-tsc`, and remove the fixtures. Existing Vue Menu, Navigation Menu, and Combobox tracers
remain source-level evidence; existing Solid tracers are frozen comparisons rather than an active
target.

Before expanding this tracer, read `docs/portable-runtime/framework-renderer-authoring.md` for the
target-local renderer fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Vue syntax, props, refs, emits, slots, provide/inject, Teleport, helper files, output
  writing, exports, and lifecycle projection inside this folder.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro and
  React.
- Register Vue once through the central target registry only when a future issue explicitly adds Vue
  to a target-registry conformance or package-generation path.
- Keep Runtime behavior in `packages/runtime`; this folder only projects Vue syntax onto Runtime
  controllers.

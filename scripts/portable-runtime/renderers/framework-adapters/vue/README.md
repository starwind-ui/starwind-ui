# Vue Framework Adapter

This is the internally registered, non-shipping Vue Framework Adapter home. The current target
generates the private Theme facade plus Button, Checkbox, Select, Avatar, Progress, and Scroll Area
package surface while keeping every public-support flag disabled. Those real generated components
are the sole normative evidence for their families and are never duplicated as future tracers.
Unsupported Toggle, Collapsible, Menu, Navigation Menu, and Combobox tracers remain explicitly
non-normative evidence for Vue syntax, lifecycle, refs, emits, slots, provide/inject, and Teleport.

The target may create deterministic internal `@starwind-ui/vue` package output for the approved
private subset and may print `__future-fixtures/vue` review fixtures for unsupported components. It
must not create CLI registry entries, public demo dependencies, install docs, release configuration,
or public Vue support claims.

`public-contract.ts` is the typed, target-local source of truth for Vue 3.5 public naming,
composition, lifecycle, SSR, hydration, and Teleport projection. It records how framework-neutral
Runtime Adapter Contract and output-model facts become Vue semantics without adding those semantics
to shared contracts. The repository's accepted Vue adapter decision keeps that policy durable while
this target remains quarantined.

The active Tier 0 subset is Theme, Button, Checkbox, Select, Avatar, Progress, and Scroll Area. Run
`pnpm runtime:generate:vue:test` for deterministic generation and compiler coverage, then
`pnpm vue:typecheck` and `pnpm vue:build` for the internal package. Remaining Vue tracers derive
model and event names from `public-contract.ts`, inspect cancellation synchronously, and use typed
`InjectionKey` Symbol helpers with descriptive required-context errors. Existing Solid tracers are
frozen comparisons rather than an active target.

Before expanding this tracer, read `docs/portable-runtime/framework-renderer-authoring.md` for the
target-local renderer fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Vue syntax, props, refs, emits, slots, provide/inject, Teleport, helper files, output
  writing, exports, and lifecycle projection inside this folder.
- Project models and detailed events through `public-contract.ts`; do not invent component-local
  aliases or React callback props.
- Keep Runtime construction in mounted lifecycle, preserve browser-free deterministic server
  rendering, and keep Teleport disabled until the owning root mounts.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro and
  React.
- Keep Vue registered through the central target registry with its supported subset and public
  support flags explicit. Expanding that subset requires its own approved component-cohort work.
- Keep Runtime behavior in `packages/runtime`; this folder only projects Vue syntax onto Runtime
  controllers.

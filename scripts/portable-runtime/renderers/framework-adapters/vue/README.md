# Vue Framework Adapter

This is the internally registered, non-shipping Vue Framework Adapter home. The current target
generates a private Primitive package surface for Accordion, Alert Dialog, Avatar, Button, Checkbox,
Checkbox Group, Collapsible, Dialog, Drawer, Dropzone, Field, Fieldset, Form, Input, Input OTP,
Popover, Progress, Radio, Radio Group, Scroll Area, Select, Slider, Switch, Tabs, Toggle, Toggle
Group, and the manual Theme facade. Its generated Styled surface is Accordion, Alert Dialog, Avatar,
Button, Checkbox, Checkbox Group, Collapsible, Dialog, Dropzone, Field, Sheet, Form, Input, Input
OTP, Popover, Progress, Radio Group, Scroll Area, Select, Slider, Switch, Tabs, Theme Toggle, Toggle,
and Toggle Group. Every public-support flag remains disabled.

Those generated Primitive adapters and Styled components are the sole normative evidence for their
families. Menu, Navigation Menu, and Combobox remain genuinely unsupported and have active,
explicitly non-normative future tracers for Vue syntax, lifecycle, refs, emits, slots,
provide/inject, and Teleport. The older Toggle printer fixture remains only as contract-conformance
evidence; it does not replace or qualify the real generated Toggle package projection. The legacy
Collapsible printer fixture is isolated to direct printer-unit coverage and is absent from active
future-tracer classifications, checker output, and the contract gate.

The target may create deterministic internal `@starwind-ui/vue` package output for the approved
private subset and may print `__future-fixtures/vue` review fixtures for unsupported components. It
must not create CLI registry entries, public demo dependencies, install docs, release configuration,
or public Vue support claims.

`public-contract.ts` is the typed, target-local source of truth for Vue 3.5 public naming,
composition, lifecycle, SSR, hydration, and Teleport projection. It records how framework-neutral
Runtime Adapter Contract and output-model facts become Vue semantics without adding those semantics
to shared contracts. The repository's accepted Vue adapter decision keeps that policy durable while
this target remains quarantined.

The active private Primitive and Styled subsets are the complete lists above. Run
`pnpm runtime:generate:vue:test` for deterministic generation and compiler coverage, or
`pnpm vue:verify` for the package compiler, source/browser suites, built hydration, every-export SSR,
and release-like distribution checks. The specialized Accordion, Tabs, Field, Slider, Input OTP,
and Dropzone cohort is pinned by exact export inventories, every-export SSR, six-family built
hydration with owned-resource disposal accounting, and release-consumer imports. Run
`pnpm vue-demo:smoke` for the production native-form, keyboard, pointer-geometry, deterministic-file,
remount, cleanup, and light/dark visual review matrix. Remaining Vue tracers derive model and event
names from `public-contract.ts`, inspect cancellation synchronously, and use typed `InjectionKey`
Symbol helpers with descriptive required-context errors. Existing Solid tracers are frozen
comparisons rather than an active target.

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

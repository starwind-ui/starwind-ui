# Framework Renderer Authoring

Status: current
Date: 2026-07-07

This guide is for future Primitive Framework Adapter targets such as Vue, Solid, Svelte, or another
framework. It records the authoring pattern proven by the React and Astro renderer refactors:
target adapters should print from Runtime Adapter Contracts, Generic Adapter Plans, Adapter Family
Plans, Specialized Adapter Specs, and Adapter Output Models without copying large unstructured
string templates.

Vue, Solid, and Svelte implementation is out of scope for the Primitive Renderer Authoring Refactor
PRD. Vue and Solid currently remain non-shipping tracer homes. Svelte remains deferred until its
setup model is chosen. This guide describes how future target work should be shaped when a separate
issue accepts that work.

## Target Home Ownership

Start in one target home:

```text
scripts/portable-runtime/renderers/framework-adapters/<target>/
```

The target home owns framework syntax and file output. Shared generator layers may describe facts,
but they should not learn target syntax. Keep these concerns in the target home:

- the `FrameworkAdapter` object and target registration,
- primitive output writing and package writing,
- specialized output-model projection,
- target-local family printers and fragments,
- styled projection/writing when the target supports styled wrappers,
- helper facades and manual primitives for that target,
- package export and type-facade printing,
- CLI registry artifact metadata,
- public support metadata.

Register a target once through
`scripts/portable-runtime/renderers/framework-adapters/target-registry.ts`. Do not add
`renderers/primitives/<component>/<target>.ts` route files, shared target-specific registry
candidate lists, or public package surfaces from scattered component folders.

## Model Boundary

Contracts and plans own framework-neutral facts:

- component ids, parts, default elements, public props, and Runtime factories,
- discovery attributes and protected/defaulted/composed attribute ownership,
- Runtime events, detail types, setters, controlled state, and context facts,
- portal facts, helper files, namespace exports, and type facades,
- Generic Adapter Plan and Specialized Adapter Spec file membership.

Framework Adapters own syntax:

- imports and type imports,
- prop declarations, defaults, destructuring, and attribute normalization,
- render-tree placement into JSX, templates, slots, snippets, or static markup,
- refs, callback refs, or action refs,
- lifecycle setup, cleanup, effects, watches, actions, or scripts,
- event bridge syntax and callback naming,
- context/provider projection,
- portals/teleports,
- helper-file syntax and package index syntax.

When a target needs a new fact, add it to the contract or plan only when it is genuinely stable
across targets. If the difference is target syntax or lifecycle shape, keep it target-local.

## Fragment Pattern

Use named target-local fragments or helper printers whenever a renderer concern appears more than
once or mixes multiple responsibilities. Good fragments have a typed input bundle, a narrow name,
and a single framework-shaped output concern.

Prefer fragments for:

- imports and type imports,
- prop type/interface blocks and destructuring/defaults,
- ref declarations and ref composition,
- Runtime setup and cleanup lifecycle,
- controlled/uncontrolled state sync,
- callback/event bridge projection,
- protected behavior attributes and consumer prop spread order,
- hidden input and form synchronization,
- `asChild` or framework-equivalent composition,
- floating/presence attributes such as `data-state`, side/align offsets, hidden, role, and
  `tabindex`,
- simple slotted/rest-prop parts,
- namespace/index exports and runtime type re-exports.

Avoid one giant template that combines imports, props, runtime setup, render branches, and exports.
Large templates hide behavior changes and make cross-family leakage hard to review.

## Proven Examples

React examples:

- `react/boolean-form-control-fragments.ts` isolates mutation sync, controlled/group setter sync,
  disabled setters, indeterminate-only logic, and behavior guards.
- `react/as-child-trigger-fragments.ts` isolates React-only clone-and-compose imports, composed
  refs, protected props, event order, and clone branches.
- `react/overlay-presence-fragments.ts` isolates floating placement props, popup/positioner
  attributes, hidden projection, role/tabIndex, refs, and prop spreading.

Astro examples:

- `astro/shared-fragments.ts` isolates simple slotted rest-prop parts and no-cleanup scoped Runtime
  setup scripts.
- `astro/lifecycle-projection.ts` owns Astro script initialization with `astro:after-swap` and
  `starwind:init` scoping.
- Astro Set-tracked families such as Menu and Navigation Menu intentionally keep
  `astro:before-swap` cleanup in their target-specific printers instead of reusing a no-cleanup
  helper.

Use these as patterns for concern boundaries, not as syntax to copy. React clone/ref/effect
semantics do not belong in Astro. Astro wrapper-slot/static-markup semantics do not prove a
React-like target is ready for controlled state, callbacks, refs, portals, and cleanup.

## Framework-Specific Behavior

Preserve framework behavior inside the target home without changing shared contracts unnecessarily:

- React-like targets such as React, Vue, and Solid need lifecycle setup/cleanup, controlled prop
  synchronization, callback/event mapping, refs, context, children/slots, and portal ownership.
- Astro is static-markup-first. It needs frontmatter, `Astro.props`, static attributes, `<slot />`,
  scoped initialization scripts, `astro:after-swap`, `starwind:init`, and explicit cleanup only for
  families that own tracked Runtime instances.
- Svelte needs an accepted action/component setup model before package or preview work can start.
  Keep Svelte examples out of package exports until that model is documented.

Do not move Runtime behavior into generated adapters. Adapters should wire framework props, refs,
events, and markup to Runtime controllers.

## Testing Pattern

Test new target work at the generator/output seam first:

1. Add or update Framework Adapter conformance coverage for the target home.
2. Generate output into a temporary fixture or non-shipping tracer path.
3. Assert deterministic output for representative static, stateful, form, overlay, context, and
   portal families.
4. Check that unsupported targets do not create package exports, CLI registry entries, demo
   dependencies, install docs, or public support claims.
5. Compare Astro and React generated output when shared facts or registry code changes.
6. Run target typechecks and smoke checks only when the target tier supports generated packages or
   demos.

For pure renderer refactors, generated Astro, React, CLI vendoring, and demo output should remain
unchanged after formatting unless the issue explicitly accepts a formatting-only cleanup.

## Public Support Guardrails

Future-framework tracer output is not public support.

- Vue and Solid tracer homes may print deterministic `__future-fixtures` for tests.
- They must not add `@starwind-ui/vue`, `@starwind-ui/solid`, package exports, CLI registry
  artifacts, demo dependencies, install instructions, or public docs claims.
- Svelte must stay deferred until its setup model is accepted.
- Any public API difference from Astro or React must be documented as framework semantics, not a
  generator gap.

When a target crosses from tracer to preview or shipping, use
[Future Framework Readiness Gate](./framework-readiness-gate.md) and open a separate PRD or issue
for that target.

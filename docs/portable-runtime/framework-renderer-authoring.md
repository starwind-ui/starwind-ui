# Framework Renderer Authoring

Status: current
Date: 2026-08-02

This guide is for future Primitive Framework Adapter targets such as Vue, Solid, Svelte, or another
framework. It records the authoring pattern proven by the React and Astro renderer refactors:
target adapters should print from Runtime Adapter Contracts, Generic Adapter Plans, Adapter Family
Plans, Specialized Adapter Specs, and Adapter Output Models without copying large unstructured
string templates.

Astro and React are shipping targets. Vue and Svelte have private, non-shipping workspace packages;
Solid remains a tracer-only target. A private package proves realistic generation, build, types,
SSR/hydration, and consumer resolution, but does not imply CLI support, public documentation, or
publication.

Vue target work follows the repository's accepted idiomatic Vue adapter semantics. The typed Vue
public contract lives in the Vue target home and owns model/event naming, composition, lifecycle,
SSR/hydration, and delayed Teleport projection while Vue remains non-shipping.

Svelte target work follows the accepted Svelte 5.29+ component-and-attachment model. Typed
`$props`, snippets, context, attachments, reactive Runtime setters, and teardown remain owned by the
Svelte target home. The current private package deliberately covers Button, Carousel, Checkbox,
Select, Accordion, Dialog, Slider, and Toast.

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
- Svelte uses components with attachment-owned Runtime connections. Reactive setter effects update
  live controller options without reconnecting. Keep that framework lifecycle policy target-local.

Do not move Runtime behavior into generated adapters. Adapters should wire framework props, refs,
events, and markup to Runtime controllers.

## Testing Pattern

Test new target work at the generator/output seam first:

1. Add or update Framework Adapter conformance coverage for the target home.
2. Generate output into the target's committed package, private package, or tracer path according
   to its registered support tier.
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

- Vue and Svelte may keep private packages only while they remain `private: true`, version `0.0.0`,
  ignored by Changesets, absent from the release package set, absent from public CLI registry
  artifacts, and described as non-shipping.
- Solid tracer output must not add a package, CLI registry artifacts, demo dependencies, install
  instructions, or public docs claims.
- Any public API difference from Astro or React must be documented as framework semantics, not a
  generator gap.

When a target crosses from tracer to preview or shipping, use
[Future Framework Readiness Gate](./framework-readiness-gate.md) and open a separate PRD or issue
for that target.

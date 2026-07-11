# Future Framework Readiness Gate

Status: current
Date: 2026-07-10

This gate decides when Starwind may start new Primitive adapter work for Vue, Solid, Svelte, or any
other framework target. It replaces the removed historical rollout gate that used stale readiness
counts.

The current goal is not "make every framework possible by hand." The goal is to prove that a new
target can consume the same deterministic generator boundaries without moving Runtime behavior into
generated adapter code:

- `RuntimeAdapterContract -> GenericAdapterPlan -> AdapterOutputModel -> FrameworkAdapter`
- `RuntimeAdapterContract -> SpecializedAdapterSpec -> AdapterOutputModel -> FrameworkAdapter`

Vocabulary note: the accepted explanatory terms are documented in
[Adapter Vocabulary](./adapter-vocabulary.md). Use Runtime Adapter Contract, Generic Adapter Plan,
Adapter Family Plan, Specialized Adapter Spec, Adapter Output Model, and Framework Adapter in
current readiness work.

New target authoring starts in one folder:

- `scripts/portable-runtime/renderers/framework-adapters/<target>/`

Use [Framework Renderer Authoring](./framework-renderer-authoring.md) for the target-local
fragment/helper pattern before adding a new target or expanding a tracer target.

That folder must expose the target Framework Adapter, its readiness metadata, and target notes. The
target is then registered centrally through the route-free primitive target list and Framework
Adapter lookup. Adapter authors should not add target syntax by editing every component renderer or
by creating `scripts/portable-runtime/renderers/primitives/<component>/<target>.ts` files.
Component specs and family plans describe component facts; the Framework Adapter owns target syntax,
lifecycle, attribute normalization, event projection, refs, slots/children, context, portals,
helper files, type facades, primitive output writers, package exports, styled output, and
target-local family printers. Conformance starts in
`scripts/portable-runtime/tests/framework-adapters.test.ts`.

The expected author workflow is:

1. Implement or update one target home.
2. Export the standard target adapter object and target registration from that home.
3. Register the target once in `renderers/framework-adapters/target-registry.ts`.
4. Run conformance, generation, output-repeatability, typecheck, and target-specific smoke checks
   appropriate to the target tier.
5. Keep unsupported capabilities represented as readiness metadata, focused diagnostics, or a
   documented follow-up issue.

## Target Home Checklist

A future target should keep framework-specific implementation inside
`scripts/portable-runtime/renderers/framework-adapters/<target>/` and register only once in
`scripts/portable-runtime/renderers/framework-adapters/target-registry.ts`.

The target home should provide the same high-level capability shape as Astro and React:

- `adapter`: the `FrameworkAdapter` object that knows file extension, attribute names, props, refs,
  lifecycle projection, event projection, context, portals, render trees, helper files, exports, and
  type facades.
- `primitive.generatePackage`: package-level primitive generation for the target.
- `primitive.manualPrimitives`: central manual helper facade support when the target supports a
  helper such as Theme.
- `primitive.outputModel.projectSpecialized`: target-local projection for Specialized Adapter Spec
  output models.
- `primitive.outputModel.write`: final primitive Adapter Output Model writing. This is the call
  made by route-free primitive generation after resolving the target registration.
- `styled.project`: target-scoped Styled Output Model projection when styled wrappers are supported.
- `styled.write`: final styled wrapper writing through target-local styled writer modules.
- `cliRegistry`: generated import candidate extensions, primitive artifact roots, styled artifact
  roots, and target-local package-source collection.
- `publicSupport`: whether package exports, CLI registry output, demos, and public docs are shipping,
  tracer-only, or deferred.

Shared generator code may call these capabilities through the target registration, but it should not
learn framework-specific syntax. When a new target needs framework-specific imports, setup blocks,
JSX, templates, snippets, actions, portals, local helper files, or package metadata, put that code in
the target home.

## Current Primitive Surface

The current Primitive adapter inventory is 35 component families.

Adapter Family Plan components:

- `alert-dialog`
- `avatar`
- `button`
- `checkbox`
- `checkbox-group`
- `collapsible`
- `dialog`
- `drawer`
- `fieldset`
- `form`
- `input`
- `popover`
- `progress`
- `radio`
- `radio-group`
- `scroll-area`
- `switch`
- `toggle`
- `toggle-group`

Specialized Adapter Spec generated primitives:

- `carousel`
- `toast`
- `field`
- `slider`
- `tabs`
- `accordion`
- `input-otp`
- `tooltip`
- `preview-card`
- `dropzone`
- `menu`
- `context-menu`
- `navigation-menu`
- `select`
- `sidebar`
- `combobox`

Current manual islands:

- None.

Current manual helper facades:

- `theme`

Theme is a package helper facade for Runtime theme utilities and Astro's `ThemeInitScript`, not a
Runtime-backed component adapter or manual island. Its manual generator entry is declared centrally
and does not use component target route files.

Non-shipping future-framework tracers exist only for:

- `button/vue`
- `button/solid`
- `toggle/vue`
- `toggle/solid`
- `collapsible/vue`
- `collapsible/solid`
- `checkbox/vue`
- `menu/vue`
- `menu/solid`
- `navigation-menu/vue`
- `navigation-menu/solid`
- `select/vue`
- `select/solid`
- `combobox/vue`
- `combobox/solid`

These tracers do not imply package exports, CLI registry entries, demo dependencies, or a shipping
target.

Vue is the only active Tier 0 future-framework vertical slice. Button, Checkbox, and Select form
its compile/typecheck tracer: Button proves the baseline lifecycle, Checkbox proves boolean form
participation, and Select proves controlled overlay plus form participation. Existing Solid
tracers are frozen comparison artifacts, and Svelte remains deferred. None of these targets is a
preview or shipping adapter.

## Gate Tiers

### Tier 0: Non-Shipping Tracers

Use this tier for experiments that pressure-test one family shape without creating a public adapter.

Requirements:

- The source family already passes Astro and React output checks.
- Specialized Adapter Spec tracers already preserve Astro and React output parity for the component.
- The tracer is generated into test fixtures only.
- No package exports, CLI registry entries, docs install instructions, or demo dependencies are
  added.
- The tracer states which Runtime behavior remains owned by Runtime and which adapter facts come
  from contracts.
- Any target home created for tracer work passes Framework Adapter conformance checks and marks
  package exports, CLI registry entries, demo integration, and public support claims as false.

### Tier 1: Target Preview

Use this tier only after multiple adapter family plans have target-specific printers or fixtures.

Requirements:

- The target supports the current static and typed adapter-family-plan surface, or explicitly
  excludes unsupported families from package exports.
- The target consumes any supported Specialized Adapter Spec through Adapter Output Models and the
  target Framework Adapter, not through a one-off hard-coded component template.
- The target is registered centrally and does not introduce per-component target route files.
- Every excluded primitive has a documented manual-island decision or roadmap blocker.
- Generated output is repeatable from contracts into a temp directory.
- Public docs call the target experimental and name unsupported primitives.

### Tier 2: Shipping Target

Use this tier only when the target can be maintained as a first-party adapter.

Requirements:

- All 35 Primitive contracts are either generated for the target or have an accepted, documented
  non-shipping decision.
- Every manual island escape hatch supported by the target has a component renderer or typed adapter
  family plan with explicit contract-owned facts and escape hatches.
- The target has package exports, registry behavior, generated-output checks, typechecks, and smoke
  checks equivalent to the existing Astro and React target gates.
- Public API differences from Astro and React are documented as framework semantics, not generator
  gaps.

## Required Helper Coverage

Do not begin a target preview until the new target has a helper plan for the existing Adapter Family
Plan surface:

- static semantic parts
- button-root static behavior
- progress static behavior
- media status behavior
- native disabled semantic behavior
- native input value controls
- single boolean controls
- grouped value controls
- disclosure/presence controls
- field-control coordinator roots
- viewport measurement anatomy
- generated index/namespace exports
- Specialized Adapter Spec file membership, context projection, controlled-state projection, portal
  projection, part props, and unsupported-feature diagnostics

React-like targets such as Vue and Solid also need helper coverage for:

- controlled/uncontrolled prop synchronization
- runtime setter calls after prop changes
- callback/event detail mapping
- ref forwarding or ref callback composition
- context/provider values for child parts
- part-level render functions or component wrappers
- asChild/clone/wrapper equivalents where the contract allows composition
- portal/container ownership for overlay families
- presence visibility and mount policy
- form hidden-input synchronization
- effect cleanup and duplicate initialization protection

Vue must consume Specialized Adapter Specs through its Framework Adapter before any package
preview. The active Button/Checkbox/Select compile slice validates props, refs, watches, events,
context, slots, Teleport, presence, and hidden inputs while keeping primitive behavior in Runtime.
The older Menu, Navigation Menu, and Combobox Vue fixtures remain source-level tracer evidence.
Solid's equivalent fixtures are frozen comparisons rather than an active expansion target.

Svelte is not ready for preview until its component/action setup model is chosen. Svelte examples
must stay out of package exports until the setup model is documented.

## Required Validation Coverage

Before any target leaves Tier 0:

- Runtime adapter contracts must pass `validateRuntimeAdapterContracts`.
- Styled contracts must pass `validateStyledAdapterContracts` if the target will generate styled
  wrappers.
- Generic Adapter Plan validation must pass for every family the target Framework Adapter consumes.
- Framework Adapter conformance tests must pass for the target home.
- Coverage classification must be current for all 35 Primitive contracts.
- Every escape hatch used by a supported component must name affected frameworks, boundary, reason,
  contract-owned facts, demotion criteria, and tests.
- Any target-specific omission must be represented as a documented framework note, unsupported
  target, or roadmap blocker.

## Manual Island Policy

Manual island readiness is qualitative, not a simple count threshold.

A new target may proceed only when every remaining manual island escape hatch has one of these
states:

- a typed family migration issue accepted for implementation
- a current manual-island blocker in the coverage report
- an entry in the manual-island reduction roadmap
- a target-specific non-shipping decision for preview work

A manual island escape hatch is acceptable when it names the Runtime-owned behavior that would be
unsafe to move into a printer. It is not acceptable when it only says the component is complex, has
many parts, or does not match another library's API.

High-complexity islands remain human-gated:

- None.

`select`, `menu`, `context-menu`, `navigation-menu`, `combobox`, `tooltip`, `preview-card`,
`tabs`, `accordion`, `sidebar`, `slider`, `input-otp`, `dropzone`, `field`, `carousel`, and `toast`
are no longer manual islands. They are Specialized Adapter Spec generated for Astro and React, with
Vue and Solid represented only by non-shipping tracer fixtures where fixture support exists. The
specialized form controls still need future target helper coverage for form hidden inputs,
callback/ref mapping, and controlled setter synchronization before any target preview can ship them.
Field also needs future target helper coverage for cross-primitive FieldControl/Input composition,
field context, and setter-driven state synchronization. Carousel needs future target helper coverage
for engine refs, refresh watchers/effects, API callback refs, and lifecycle cleanup before any
target preview can ship it. Toast needs future target helper coverage for viewport-owned manager
refs, template slot/children rendering, imperative API export routing, and lifecycle cleanup before
any target preview can ship it.

Do not use future framework work to force these into a generic renderer. Open or complete the
relevant roadmap issue first.

## Output Repeatability Checks

Every target tier needs deterministic output checks appropriate to its scope.

Required for Tier 0:

- Generate tracer fixtures from contracts.
- Pin the fixture output in a focused test.
- Confirm the tracer does not touch package exports, CLI registry output, or demo dependencies.

Required for Tier 1:

- Generate target output into a temp directory.
- Run target typechecks for generated adapters.
- Compare repeat generation output byte-for-byte.
- Verify registry/package metadata excludes unsupported primitives.

Required for Tier 2:

- Run full target generation.
- Run generated package typechecks.
- Run framework-specific smoke checks for representative static, boolean, grouped value, form,
  presence, floating, and manual-island components.
- Verify package exports, CLI registry metadata, and docs examples match the supported target scope.

Existing Astro and React output remains the regression oracle. A new target must not require
changing Astro or React output unless a separate issue documents and accepts that change.

## Astro Versus React-Like Targets

Astro is static-markup-first:

- Astro adapters render initial DOM and initialize Runtime controllers from scripts.
- Controlled props are unsupported unless the contract explicitly uses custom events or an
  imperative Runtime API.
- Astro-specific behavior includes static attributes, `astro:after-swap`, `starwind:init`, and
  duplicate-init protection.

React-like targets are component-lifecycle-first:

- React, Vue, and Solid adapters must synchronize controlled props through Runtime setters after
  mount.
- They must preserve callback timing, cancellation semantics, and controlled/uncontrolled
  boundaries.
- They need explicit cleanup on unmount and dependency changes.
- They must expose framework-native refs, context, children/render slots, and portals without
  changing contract-owned facts.

Do not judge a future target ready because it can print Astro-like static markup. It must also
handle the React-like lifecycle surface for any controlled or stateful primitive it ships.

## Stop Conditions

Do not start or continue a new framework target when:

- a required family helper would need to duplicate Runtime behavior
- a manual island escape hatch lacks a current blocker, coverage entry, or accepted target-specific
  decision
- generated Astro or React output changes unexpectedly
- the target needs public API differences that are not documented as framework semantics
- Svelte output depends on an undecided action/component setup model
- validation or output-repeatability checks are missing for the target tier

When a stop condition appears, update the relevant PRD issue or manual-island roadmap before adding
more target code.

## Source Of Truth

Use these files together when evaluating readiness:

- `docs/portable-runtime/evaluations/generic-adapter-plan-coverage.md`
- `docs/portable-runtime/evaluations/menu-specialized-adapter-spec-evaluation.md`
- `scripts/portable-runtime/contracts/primitive/types.ts`
- `scripts/portable-runtime/contracts/primitive/validation.ts`
- `scripts/portable-runtime/contracts/styled/types.ts`
- `scripts/portable-runtime/contracts/styled/validation.ts`
- `scripts/portable-runtime/renderers/specialized-adapter-spec/`
- `scripts/portable-runtime/renderers/generic-adapter-plan/adapter-family-plans.ts` for family
  selection and target family printer registry types
- `scripts/portable-runtime/renderers/generic-adapter-plan/families/` for deepened Adapter Family
  Plan modules such as Media Status
- `scripts/portable-runtime/renderers/generic-adapter-plan/generic-adapter-output-model.ts` for the
  current Adapter Family Plan output-model registry and remaining inline family builders
- `scripts/portable-runtime/tests/specialized-adapter-spec.test.ts`
- `scripts/portable-runtime/tests/generic-adapter-plan.test.ts`

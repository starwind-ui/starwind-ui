# Generator Notes

Status: current as of 2026-06-30.

The portable runtime generator has shipping Astro and React adapters. Each framework has a
Primitive adapter layer and a contract-driven styled layer.

The accepted architecture vocabulary is documented in
[Adapter Vocabulary](./adapter-vocabulary.md). Source names still use the older contract, render
plan, and component-spec names until the staged vocabulary migration completes.

## Current slice

- Generates Primitive adapters for the 35 Runtime-backed component families listed in
  `scripts/portable-runtime/renderers/primitive-inventory.ts`. The package index helper module
  `scripts/portable-runtime/renderers/primitive-index.ts` consumes that inventory rather than owning
  it.
- Generates styled wrappers for the component-scoped `starwindStyledContracts` collection.
- Reads Runtime adapter contracts from the stable
  `scripts/portable-runtime/contracts/primitive/representatives.ts` aggregator, with component
  contracts in `scripts/portable-runtime/contracts/primitive/components/` and shared contract
  invariants in `scripts/portable-runtime/contracts/primitive/validation.ts`.
- Reads Starwind styled adapter contracts from the stable
  `scripts/portable-runtime/contracts/styled/starwind.ts` aggregator, with component contracts in
  `scripts/portable-runtime/contracts/styled/components/`.
- Writes unstyled Astro primitive wrappers into `packages/astro/src`.
- Writes styled Starwind Astro wrappers into `apps/demo/src/components/starwind-runtime`.
- Writes unstyled React primitive wrappers into `packages/react/src`.
- Writes styled Starwind React wrappers into `apps/react-demo/src/components/starwind-runtime`.
- Primitive generation is registry-driven through
  `scripts/portable-runtime/renderers/primitive-generator-registry.ts` and
  `scripts/portable-runtime/renderers/framework-adapters/target-registry.ts`.
- Primitive generation is route-free for component targets. The registry records each primitive's
  source strategy and component facts; `primitive-route-free-generator.ts` selects the target
  Framework Adapter and writes Adapter Output Models without importing
  `renderers/primitives/<component>/<target>.ts` files.
- Each Framework Adapter home owns its own adapter object, target registration export, primitive
  output writer, primitive package writer, manual primitive helper generation, exports/type facade
  helpers, styled output writer, target-local family printers, lifecycle projection helpers, and
  specialized family modules.
- Target-local helper modules should use equivalent high-level capability names or object shapes
  across homes. Astro and React can differ in implementation details, but future framework authors
  should be able to find the same kind of responsibility in one target folder.
- Shared generator modules may select plans, build Adapter Output Models, validate framework-neutral
  facts, and dispatch through target registrations. They should not print framework syntax or move
  Runtime behavior out of `packages/runtime`.
- `scripts/portable-runtime/renderers/primitives/` contains shared primitive writer helpers only,
  not component-named Astro/React/Vue/Solid/Svelte route folders.
- Manual helper facades are declared centrally in
  `scripts/portable-runtime/renderers/manual-primitive-generators.ts`. Theme is the current manual
  helper facade because it exposes Runtime theme utilities and an Astro init-script helper rather
  than a Runtime-backed component adapter.
- Primitive wrappers expose Base UI-style compound namespace defaults such as `Accordion.Root` and
  `Dialog.Popup`.
- Styled wrappers import primitive wrappers from framework package subpaths such as
  `@starwind-ui/astro/select` and `@starwind-ui/react/select` for runtime-backed components, while
  rendering native elements directly for styling-only components.
- Runtime-backed Primitive adapter components currently include Accordion, Alert Dialog, Avatar,
  Button, Carousel, Checkbox, Checkbox Group, Collapsible, Combobox, Context Menu, Dialog, Drawer,
  Dropzone, Field, Input, Input OTP, Menu, Popover, Preview Card, Progress, Radio, Radio Group,
  Scroll Area, Select, Slider, Switch, Tabs, Toast, Toggle, Toggle Group, and Tooltip. The Drawer
  primitive is surfaced through the styled Sheet adapter, and the Menu primitive is surfaced through
  styled Dropdown and Context Menu adapters.
- Styling-only and styled-composite components render native elements or compose existing
  primitives where they do not need their own runtime-backed primitive family. They preserve
  `data-sw-*` hooks and only get primitive folders when the runtime has a matching primitive
  adapter contract.
- Styled wrappers are rendered from framework-neutral contract data: props, imports, variants,
  primitive composition, slots, icons, text, and simple value expressions.
- Styled contracts can declare component-local CSS via `styles.content`; the generators write a
  `styles.css` file beside that component and import it only from the exports listed in
  `styles.importFrom`.
- React styled rendering translates default slots to `children` and named slots to props such as
  `icon` and `backdrop`.
- The styled contract `conditional` render node is only a branch primitive. It is acceptable for
  Breadcrumb's current `asChild` behavior because canonical Starwind renders raw child content
  there, but future components that need prop, ARIA, handler, class, or ref merging need a real
  Slot/asChild abstraction.
- Overwrites generated files every run. Primitive generation cleans the framework package `src`
  root first so removed primitive folders do not linger in package source.
- Keeps repo paths as constants near the top of each generator file.
- Tests cover the primitive layer, the styled layer, contract-driven output, and full-generation
  repeatability.
- `apps/react-demo` is a Vite app that smoke-tests generated React output with Playwright.

## Primitive Creation Flow

The primitive generator path is currently:

1. `primitive-inventory.ts` owns primitive identity, Runtime Adapter Contract association,
   generation strategy, package export status, Runtime facade re-exports, manual helper facades,
   and CLI vendoring order.
2. `primitive-generator-registry.ts` converts inventory facts into route-free generator entries.
3. Generic entries build `GenericAdapterPlan` data and then `AdapterOutputModel` data. Static
   Adapter Plan output and Adapter Family Plan output both end at the same target writer seam.
4. Specialized entries build a `SpecializedAdapterSpec`, convert it to an `AdapterOutputModel`, and
   let the target home run `projectSpecialized` before writing.
5. `primitive-route-free-generator.ts` resolves the target with
   `getPrimitiveFrameworkAdapterTarget(target)` and calls
   `targetRegistration.primitive.outputModel.write(...)`.
6. The target home writes the files and package metadata. For Astro and React this means the
   modules under `framework-adapters/astro/` and `framework-adapters/react/`.

Adapter Family Plan locality is now represented by an output-family registry. Media Status is the
first fully extracted family module and owns matching, validation, facts, and output-model building
in `generic-adapter-plan/families/media-status.ts`. The other output-family builders use the same
registry shape and can be extracted when doing so improves locality.

## Styled Component Creation Flow

The styled generator path is currently:

1. Styled Adapter Contracts are aggregated from `contracts/styled/starwind.ts`.
2. The target registration exposes `targetRegistration.styled.project(...)`, which filters contracts
   for the target and creates a `StyledOutputModel`.
3. `styled-output-model/analysis.ts` computes shared facts for primitive references, composed
   styled references, variant usage, named slots, dependencies, and target-scoped artifact metadata.
4. The target registration exposes `targetRegistration.styled.write(...)`, which delegates to
   target-local styled writer modules under `framework-adapters/<target>/styled/`.
5. CLI artifact planning uses target registration metadata and Styled Output Model analysis instead
   of shared Astro/React lists.

Styled output and primitive output intentionally use different models. Styled generation should not
reconstruct old styled contracts in the normal write path, and primitive Adapter Output Models
should not absorb styled-only concerns.

## Current Exceptions And Follow-Ups

- Raw prebuilt generated-file wrappers have been removed from the primitive Adapter Output Model.
  New family work must use structured component, helper, index, and type-facade files.
- Adapter Family Plan output builders live under `generic-adapter-plan/families/`; those modules
  should own matching, validation, facts, and Adapter Output Model construction for their reusable
  shape.
- Vue and Solid remain non-shipping tracer homes. Svelte remains deferred until its setup model is
  chosen.
- Final closure and any remaining exception audit were accepted before the current target-authoring
  flow was promoted into these durable docs.

## Not yet

- No public schema export.
- No registry validation.
- No public Svelte, Vue, or Solid package generation.
- No template/file escape hatch implementation.
- Vue and Solid have non-shipping Framework Adapter tracer homes only. They are not package,
  registry, demo, or docs-install targets.
- No component-named primitive target routes remain. Adding a future target should mean adding or
  updating one Framework Adapter home, registering that target centrally, and then extending
  conformance/output checks.

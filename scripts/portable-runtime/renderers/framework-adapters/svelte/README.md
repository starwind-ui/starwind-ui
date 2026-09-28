# Svelte Framework Adapter

This folder contains the Svelte 5.29+ public-beta target. It uses runes-era
components, typed `$props`, callback event properties, snippets, Svelte context, and attachments.
Attachments own DOM connection and cleanup. Public setters update an existing Runtime controller.
Constructor-only changes can recreate it while preserving accepted state.

Select, Alert Dialog, Drawer, Popover, Preview Card, Tooltip, Menu, Context Menu, Navigation Menu, and Combobox have portal-placement coverage. Its Svelte 5.29+ attachment moves
one stable public Portal wrapper after hydration. Runtime resolves the accepted target and receives
pending and ready placement reports before it starts floating work. The attachment restores the
same wrapper during target changes and cleanup. This behavior ships through the public-beta target.
See the current [Svelte attachment reference](https://svelte.dev/docs/svelte/%40attach) for the
5.29+ mount, rerun, and cleanup lifecycle used by this proof.

Generated output lives in the public-beta `@starwind-ui/svelte` workspace package under
`packages/svelte/src`. Production CLI registry entries, the public demo, install docs, and public
support claims move together. Changesets and publication wiring remain with the release ticket. The target supports exactly
36 Primitive families: Accordion, Alert Dialog, Avatar, Button, Carousel, Checkbox, Checkbox Group, Collapsible, Color Picker, Combobox, Context Menu, Dialog, Drawer, Dropzone, Field, Fieldset, Form, Input, Input OTP, Menu, Navigation Menu, Popover, Preview Card, Progress, Radio, Radio Group,
Scroll Area, Select, Sidebar, Slider, Switch, Tabs, Toast, Toggle, Toggle Group, and Tooltip. Theme is a separate manual
facade that exports `ThemeInitScriptOptions`, `getThemeInitScript`, and `initThemeController` from
the Runtime theme subpath. The package root also exports these names.

The public beta supports Styled generation, the Svelte demo, and packed
host verification. [inventory.ts](./inventory.ts) owns the implemented Primitive and manual facade
identities and their test owners. The Svelte Styled writer generates exactly 54 Styled roots
through a typed projection of the shared Styled Output Model. Each implemented root in the inventory has test, demo, host, and review
owners. All production public-support flags are enabled.

Repository callers can generate target-scoped CLI data with `createCliRegistryBuildPolicy` and the
single Svelte registration. The builders return 54 usable Styled implementations and 36 Primitive
artifacts, including their local helpers. Image has no Svelte implementation; Theme stays in the
package. Versions and source versions come from the shared component manifests. The adapter
requirement uses the source package's exact `0.0.0` version until normal release versioning.

`createPrivateSvelteFrameworkTargetPolicy` remains available for repository tests that inject a
canonical Primitive artifact fingerprint. Production CLI inputs, schemas, bundled registry data,
and generated docs metadata use the public target policy. Vendoring marks copied files as editable.
Canonical package files keep their generated public-beta headers.

Avatar connects Root, Image, and Fallback to the Runtime media-status facade. The adapter registers
part nodes and recreates the controller when a node or fallback delay changes. Image forwards the
current non-idle status after subscription, while later callbacks receive Runtime details after
commit. Native style updates preserve Runtime image visibility. The Avatar proof covers SSR,
hydration, source changes, delayed fallback, keyed parts, and cleanup in Primitive and Styled consumers.

Scroll Area connects its six parts through the viewport-measurement family. Scalar and per-edge
threshold changes update the Runtime through `refresh()`. Registered part replacement recreates
the controller to release old listeners and observers. The Styled root supplies a viewport,
content, vertical scrollbar and corner. `autoViewport={false}` accepts caller anatomy, while the
`scrollbar` snippet replaces the default scrollbar. The contract stylesheet hides native bars.

Collapsible uses accepted `open` transactions, a semantic button child snippet, and Runtime panel
presence. Its component default stays frozen after initial state and SSR. Replacement controllers
receive current accepted state as their initial seed, which prevents an old open default from
replaying a close animation. Trigger input restoration keeps root-disabled writes separate from
caller-owned disabled inputs during recreation.

Before connection, Collapsible triggers use closed ARIA/state and panels use hidden SSR markup with the
`data-hidden-until-found` opt-in marker. Svelte 5.29 serializes `hidden` as a boolean through native
attribute spreads. Runtime applies `hidden="until-found"` on connection and owns accepted or
canceled `beforematch` behavior. Pre-connection content remains hidden; the proof does not promise
find-in-page reveal before hydration. Native compiler reproduction and both pinned consumer cases
record this boundary.

Tabs captures `syncKey` at mount, including an absent key. DOM attributes, storage, and shared
selection use that key until the Root remounts. Orientation and collection refresh retain it.

Progress connects its initial Value and Indicator parts and updates their values, formatting,
and styles through Runtime. Replacing those parts does not reconstruct the controller. Label
registration remains active so owned label associations can follow label changes.

The document owner calls `initThemeController(document, options)` after mount and destroys the
shared controller during its own teardown. Calling the initializer again resynchronizes controls
and returns that same controller. Individual mounted controls must leave controller teardown to
the document owner. Use `getThemeInitScript` before first paint with matching storage settings.
The separate Sidebar and Color Picker adapters use their existing public Runtime facades.

Run `pnpm svelte:verify` for deterministic generation, the committed-output check, strict Svelte
types, package build, SSR, hydration, browser lifecycle, cleanup, declarations, and dist-only
consumer checks. Run `pnpm runtime:generate:svelte:test` for the target-local proof suite.
The separate `pnpm svelte:compatibility` command installs exact tools into independent Svelte 5.29.0
and 5.57.0 consumers. It checks built output, expected negative diagnostics, SSR exports, and browser
hydration for the Primitive package and all implemented generated Styled groups. Styled checks cover
accepted models, nested Select placement in Dialog, semantic child forwarding, attachment cleanup,
and the shared Theme facade. Registry access is required for that explicit command. Ordinary proof and package tests
use installed local tools.

Before extending the setup model, read `docs/portable-runtime/framework-renderer-authoring.md` for
the target-local renderer fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Svelte syntax, props, events, snippets, context, refs, attachments, helper files, output
  writing, exports, and lifecycle projection inside this folder.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro,
  React, and Vue.
- Keep the single Svelte registration in the central target registry at public-beta status.
- Keep Runtime behavior in `packages/runtime`; this folder only projects Svelte syntax onto Runtime
  controllers.

## Settled contract

[public-contract.ts](./public-contract.ts) records the approved target policy. The
[structure tests](../../../tests/generate-svelte-proof/target.test.ts) check this record.
Family consumer tests and isolated distribution checks establish its implemented behavior.
The accepted Svelte model uses semantic child snippets and target-owned attachment lifecycle.

| Root      | Model           | Defined shape                |
| --------- | --------------- | ---------------------------- |
| Checkbox  | `checked`       | `boolean`                    |
| Select    | `open`, `value` | `boolean`, `string \| null`  |
| Accordion | `value`         | `string \| string[] \| null` |
| Dialog    | `open`          | `boolean`                    |
| Slider    | `value`         | `number \| number[]`         |

Declare these models with `$bindable()`. Start an omitted or undefined model from its explicit
default, then its component default. A defined model supplies an initial command. Later observable
prop changes supply commands while accepted interactions update local state. Bindings also receive
accepted changes. Later `undefined` retains state. Copy arrays across both boundaries and compare
contents. Runtime normalizes values through public setters and getters.

Detailed callbacks and cancelable DOM events observe proposals before an accepted subscription
publishes a model. Defined parent values use direct public Runtime setters. Callback-time command
arbitration and transformed function-binding readback are outside the target contract. For
form-backed standalone models, freeze the reset seed at construction from the
explicit default, initial defined model, or component default in that order. Checkbox, Select,
and Slider use that rule. Reset applies current Runtime options and respects cancellation,
newer inputs, and unmount.

Accordion uses its current rendered accepted value as the construction seed on each recreation.
On the first connection, a defined initial model is applied through the public setter. Its facade
has no native form-reset path.

Checkbox selects group ownership when context and an item key (`value ?? name`) are available at
initialization. Child `checked` and `defaultChecked` props do not change that choice. Context supplies
checked membership and reset state. Both defined and undefined child bindings stay unchanged during
group updates, interaction and reset. The mode stays fixed; a Checkbox outside group ownership keeps
its standalone model. Group disabled inheritance and indeterminate state remain supported.

Dialog retains its initial model/default for markup. Native Runtime construction starts closed,
then `setOpen(currentAccepted, { emit: false })` restores accepted state. This avoids focus, scroll,
and completion effects from replaying a saved open default. Its facade has no form-reset contract.
Accepted `open` publication and native close completion have separate lifecycles.

This initially undefined binding is covered by the built-package consumer fixtures:

```svelte
<script lang="ts">
  import { CheckboxRoot } from "@starwind-ui/svelte/checkbox";
  let checked = $state<boolean | undefined>(undefined);
</script>

<CheckboxRoot nativeButton bind:checked defaultChecked={false} aria-label="Accept terms" />
```

`SelectTrigger`, `DialogTrigger`, and `DialogClose` accept
`child?: Snippet<[ButtonChildPayload]>`. The payload contains `props: ButtonChildProps` and optional
`children?: Snippet`. Export both types from each affected component subpath. Consumers spread the
whole props object, including attachments, onto one native button or a component that forwards to
one button. Content stays separate. Development diagnostics cover a wrong element, multiple owners,
and a missing owner after mount settles. Nested ButtonRoot composition preserves the outer part's
identity and ARIA while retaining distinct required Runtime hooks.

`ButtonRoot` always renders one native button and does not accept `child`. The payload types remain
exported from the Button subpath because trigger components use them for their own child snippets.
The real `.svelte` distribution fixture covers trigger-owned composition through a native ButtonRoot:

```svelte
<script lang="ts">
  import { ButtonRoot } from "@starwind-ui/svelte/button";
  import { DialogTrigger, type ButtonChildPayload } from "@starwind-ui/svelte/dialog";
</script>

{#snippet child({ props, children }: ButtonChildPayload)}
  <ButtonRoot {...props}>{#if children}{@render children()}{/if}</ButtonRoot>
{/snippet}

<DialogTrigger {child}>Open</DialogTrigger>
```

Spread all payload props onto ButtonRoot. It forwards those ordinary props to its native button.

AccordionTrigger renders one native button with ordinary attributes, attachments, children, and a
callback ref. It has no custom child payload or owner map. Attachments own connection and cleanup.
Primitive callback refs receive the element and final `null` with balanced cleanup. Public option
setters keep stable controllers where the Runtime facade supports them. Required reconstruction
retains accepted state and any applicable form-reset seed. Select retains its attachment portal
lifecycle. Dialog keeps its existing native overlay and top-layer parts.

### Historical proof evidence

The following evidence records the earlier eight-family cohort. Its attachment inventory covered
53 element-bearing parts and checked callback replacement,
dynamic attachment symbols, keyed replacement, and unmount. `ToastTemplate` forwards its ref and
attachments to an `HTMLTemplateElement`; Slider's `inputRef` receives an `HTMLInputElement`.

SSR uses deterministic type-valid initial props/defaults without DOM work, callbacks, or binding
publication. Runtime normalization and geometry start after mount. All eight subpaths have named
parts, a named namespace, and a matching default namespace; the package root has named exports.
Both isolated Svelte versions passed with svelte-check 4.4.8, TypeScript 5.9.3, and esbuild 0.28.1.
Each consumer checked 23 invalid `.svelte` fixtures and all eight SSR export namespaces. Button,
Checkbox, Select, and Slider also passed browser hydration and interaction checks. The runner
records compiler, checker, bundler, and module paths and rejects resolution outside each consumer.

The source package remains at `0.0.0` until the release workflow applies its first beta version.

## Styled output

Run `pnpm svelte:styled:generate` to generate implemented groups under
`apps/svelte-demo/src/lib/starwind-runtime`. The writer validates scope, dependencies, and supported
structured nodes before replacing generated groups. `pnpm svelte:styled:check` checks the complete
output tree. `pnpm svelte:styled:test` runs the generator and built consumer tests.

Button supports native button props and callback refs. `as="a"` or a defined `href` selects native
anchor props and an `HTMLAnchorElement` callback ref. Disabled anchors remove `href`, set disabled
attributes, and leave the tab order. The button branch accepts the existing semantic child snippet;
its full props payload and attachments pass through to the Primitive owner. The generated group
exports Button and ButtonVariants, with a default Root namespace.

The internal `/review/` route contains 53 inline Styled roots and links to Sidebar at
`/review/sidebar/`. The catalog also links to source-visible overlay compositions at `/review/portals/`.
The dedicated Sidebar route owns its single marked review section. Packed Vite, SvelteKit, and Astro
hosts retain the representative Button, Checkbox, Select, Dialog, and Theme Toggle workload.
Their reports identify the complete current package payload. Astro keeps compound parts inside
one Svelte island. Production size and lifecycle measurements remain advisory.

### Nested Styled overlays

Select Content keeps its recipe and caller class/style props on the Popup. Its fixed Positioner
creates the outer stacking context, so the Svelte Styled owner mirrors the Popup's computed z-index
to that element. A local observer follows class, style, and open-state changes on that Popup.
The resize listener updates responsive styles. Teardown releases both and restores the original
Positioner style. This fixes Select painting behind a parent Color Picker while retaining custom CSS
and inline stacking values.

The `/review/portals/` page shows Color Picker with Select, Dialog with Select, Dialog with Color
Picker and Select, Sheet with Popover and Select, nested Popovers, and a menu with a submenu inside
Popover. The page contains source for each composition and a control to mount or remove them.
The browser check uses CLI stock CSS and tests pointer hit order at overlapping layers, selection,
Escape order, focus return, and resource release when the layers close or unmount.

```sh
pnpm svelte:demo:build
pnpm --filter=svelte-demo exec node tests/portal-compositions.mjs
pnpm --filter=svelte-demo exec node tests/portal-compositions.mjs --width=390 --theme=dark
```

### Native Styled attachments

Native Styled parts pass attachment symbols through the native element spread. Svelte owns their
effects at the installed compiler version. Their `ref` prop is bindable and uses native `bind:this`.
Attachment callbacks reach the same element after effects settle.

Direct native spreading follows the installed Svelte compiler's attachment lifecycle. The native
browser fixture checks ordinary attributes, attachment cleanup, initial bindable ref delivery,
dynamic native tag changes, and ref clearing on unmount.

## Scoped verification

Run `pnpm svelte:verify` from the repository root. Use `--component=<name>` for an explicit component,
`--base=<ref>` for branch work, or `--dry-run` to inspect selection. `--all` runs the reduced local
suite. Builds run once. Current inventory owners and printer imports determine the behavior scope.

See [Svelte verification](../../../../../docs/agents/svelte-verification.md) for the maintained policy.
Compiler compatibility and packed hosts run as explicit checks for their relevant changes. Visual
checks select affected scenes and one viewport/theme per invocation. Historical rollout reports do
not define future verification requirements. Preserve task-specific manual approval boundaries.

### Native form wrappers

Native Select and Textarea use Svelte `bind:value` through target-local `$bindable()` props.
Textarea accepts a text value and forwards native `defaultValue` for form reset. Ref callbacks and
attachment symbols reach the textarea, inner select, option, or optgroup element.

At the Svelte 5.29.0 floor, a bound multiple select requires an array. This native reproduction
throws in Svelte's `select_options` when it reads `value.indexOf`:

```svelte
<script lang="ts">
  let value: string[] | undefined = $state(undefined);
</script>

<select multiple bind:value><option value="one" selected>One</option></select>
```

An unbound native select with an attribute spread also reaches that floor code path:

```svelte
<script lang="ts">
  const props = { name: "choices" };
</script>

<select multiple {...props}><option value="one" selected>One</option></select>
```

Native Select emits `svelte:element` with a fixed `select` tag for its unbound branch so native
attribute forwarding does not introduce select-value synchronization.

Native Select uses an unbound select when `multiple` is true and `value` is undefined. The browser
owns selected options, events, FormData, and reset in that branch. It does not publish a value model.
Supplying a defined array switches to the bound branch and replaces the inner select. Ref and
attachment cleanup runs before the new setup; the outer wrapper and icon retain their owners.
Initialize bound multiple values with arrays. The selected-option reset proof runs at both pinned
versions; the select `defaultValue` API added after the floor is outside this contract.

At the floor, Svelte component binding can proxy a plain mutable object in a multiple-value array.
The browser proof retains that object case beside this minimal native wrapper and compares object
identity, selected options, reset, and FormData:

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";
  let { value = $bindable(), children }: { value: unknown[]; children?: Snippet } = $props();
</script>

<select multiple bind:value>{@render children?.()}</select>
```

The proof also checks reactive object options against direct native controls. Reuse the same
`$state` objects in the option values and selected array when the option data is reactive.

The native undefined-multiple probe emits `select_multiple_invalid_value` on Svelte 5.57. Its
warning is recorded during that isolated probe. Generated wrapper checks still require an empty
warning and error log.

## Maintained behavior checks

The local suite keeps tests for model publication, cancellation, parent updates, SSR/hydration,
node replacement, and resource cleanup. Specialized Menu, Context Menu, Navigation Menu, and
Combobox tests retain their distinct integration cases. A shared type batch covers generated API
shapes and representative invalid consumers. Each browser behavior runs on one workspace compiler.

The explicit compatibility command uses small compositions on Svelte 5.29.0 and 5.57.0, including
native attachment restoration and native multiple-select regressions. Packed hosts keep their
navigation and cleanup checks for relevant host or distribution changes.

Input accepts string, number, and string-array commands through the public Runtime setter. Equivalent defined inputs keep their input shape so in-place arrays remain observable. Native notifications publish the normalized string, including canceled details. A canceled Input detail suppresses Form revalidation. The attachment freezes the reset seed, guards deferred reset work, and calls Runtime refresh when the native associated form changes identity. File inputs receive only empty native writes.

Form and Fieldset have no models. Form forwards native form events and exposes the exact Primitive Inventory Runtime facades. Advanced options use `createForm(ref).setOptions()` after attachment. Explicit data timing attributes precede timing aliases. ErrorSummary preserves native hidden and live-region defaults with caller attribute forwarding. Fieldset uses the Runtime disabled setter and preserves nested caller-owned disabled state. Its attachment refreshes same-node legend ID changes through the public facade.

Input Group composes its six contract parts through the existing Styled Button, Input, and Textarea owners. Input and Textarea expose `bind:value` without a fallback. The Input wrapper observes incoming array commands after local publication. Textarea retains the existing native binding and reset semantics. Addon stays passive. Button preserves its contract defaults and native ref union.

Switch uses an accepted checked model with a frozen reset seed. Its span owner nests the native checkbox input; its button owner uses a sibling input. Attachment-owned connections rebind external forms through public setFormOptions, recreate for readOnly/ID/Thumb changes, and preserve accepted checked state. Styled Switch forwards native refs and attachment symbols to the button and projects the contract CSS variables and label target.

Radio uses group membership whenever Radio Group context exists. Group-owned child bindings receive no writes. Standalone Radio accepts a bindable checked value. Radio Group accepts a string value; later undefined inputs retain selection, while accepted collection removal and native reset can publish undefined. Reset uses each child input’s actual associated form. Silent imperative setters do not publish a model value.

Field connects after nested control attachments. The private Form context supplies stable controller
ownership. Form destroys its registered Fields; standalone Fields destroy their own controller.
Callback ref replacement preserves connection identity. State overrides release through the public
setters when a prop becomes undefined. Field.Control delegates the full Input model. Styled Field
projects all thirteen contract exports, including Fieldset and Separator composition.

Input OTP owns the hidden native input and four public parts. Its string model uses accepted publication and a frozen reset seed. Pattern, length, and readOnly changes recreate the controller with accepted state. Visual slot elements stay mounted with fixed indices. Form options use the public setter. Runtime resets its uncontrolled DOM state silently, so native reset does not write the bound application value. Primitive Slot accepts a typed caret snippet. Styled output keeps the stock slots, size classes, constants, and Separator icon.

Dropzone projects five Primitive parts and four Styled exports. Files-change callbacks use the public
subscription so an earlier Field connection keeps callback delivery. The callback receives copied
array containers with the original File identities. Uploading remains a setter input. Replacing a
captured input, indicator, files list, or actual associated form calls Runtime refresh and preserves
files, uploading, and disabled state in the existing controller. Runtime owns filename text and its
existing deferred silent reset. Styled fallback and custom content both retain one native file input.

Accordion adds the four stock Styled exports with the canonical icon and Content wrapper. The
Styled consumer checks single and multiple accepted values, cancellation, parent commands, nested
roots, item replacement, native Trigger buttons, callback refs, and reactive attachments. The
Primitive Item has no Trigger owner map. Direct Trigger disabled release can retain Runtime-authored
disabled state until remount, matching the accepted React and Vue limitation.

Slider projects the contracted thumb repeat into a Svelte each block keyed by index. The target
rejects repeat collections, bindings, and child anatomy outside that shape. Numeric updates retain
thumb identity and focus while count changes update the native inputs. The Styled wrapper observes
array contents, preserves the accepted shape after undefined input, and forwards an omitted default
so the Primitive can freeze the reset seed. Its state initializes before derived expressions for
SSR. Built consumers cover change/commit ordering, pointer and keyboard input, form values and
reset, refs, and attachment cleanup. The stock review shows horizontal, range, disabled, and
vertical compositions.

## Native portal ownership

Alert Dialog uses the native-overlay Adapter Family Plan. It exposes nine Primitive parts and nine
Styled exports. Each Root owns its portal bindings and captured controls. Runtime starts closed,
then receives the accepted open state through its silent setter. Popup, Backdrop, and control
replacement reconnect through the public facade. A pending close keeps its Runtime completion
until the original popup is removed or Runtime finishes the close.

The Portal attachment retains authored placement, reports pending before moves, and reports ready
after placement. It restores and releases its moved wrapper during cleanup. Discovery can briefly
restore live nodes to their authored position. Nested roots keep their own controls. Styled Action
and Cancel keep the Button prop union, including its native button and anchor branches.

Drawer uses the native overlay connection with nine parts and an accepted `open` model. Its
Primitive Portal keeps the same wrapper through target changes. Sheet projects eight stock exports
with right, left, top, and bottom content variants. Content keeps the stock backdrop and SVG close
button. Both exact Svelte consumers check captured part replacement, native focus and scroll lock,
close completion, refs, attachments, and teardown. The review catalog includes each open side.

## Floating Popover ownership

Popover projects the presence-floating-overlay family into eleven Primitive parts and six Styled
exports. Root keeps accepted `open` state and the last accepted reason through
reconnection. Each new controller starts with Runtime's initial trigger. A hover-opened modal Popover keeps Runtime's lock policy. Placement attachments retain
the authored side, alignment, offset, and collision options for controller recreation. Runtime owns
geometry.
Within a controller lifetime, an accepted owned Trigger sets the active anchor. Close controls preserve it. When that
trigger is removed, Runtime selects the remaining trigger and Svelte reads its active ARIA state.

The Root reads Runtime state after owner closure because a native Dialog can force its child closed
after a canceled proposal. This readback publishes the accepted model without another proposal.
Both exact Svelte consumers cover parent-first and child-first nested construction, portal targets,
open placement changes, close delay, cancellation, presence completion, and captured part cleanup.
The review catalog shows the stock anchored Popover. A developer fixture shows it inside Sheet.

## Timed Tooltip ownership

Tooltip projects the timed-floating-overlay Specialized Adapter Spec into six Primitive parts and
three Styled exports. Root preserves accepted open state through constructor changes. Disabled
updates use the public setter and read back its normalized state. A silent close cancels a queued
hover opening when the Tooltip is already closed. Re-enabling keeps that closed state.

Runtime owns the 200 ms delays, pointer and focus intent, hoverable content, description linkage,
and non-interactive popup policy. Popup omits tabindex props. The private consumers check timing,
model transactions, refs, captured part replacement, portal targets, and pending-timer teardown.
The stock review example includes the generated arrow and button icon.

The accepted open subscription retains the active Trigger for the current Root. After option or
captured-part recreation, the adapter restores it through the public setter's `trigger` option
with `emit: false`. Runtime validates ownership and chooses a connected fallback for a removed or
foreign Trigger. Callback/ref changes preserve a pending delay.

## Breadcrumb custom links

BreadcrumbLink renders a styled native anchor by default, with native attributes, callbacks,
attachments, and an anchor ref. Set `asChild` to render its ordinary `children` snippet directly.
The consumer puts href or router props, classes, handlers, and refs on that custom link. The
passthrough branch has no anchor wrapper and transfers no BreadcrumbLink props. Custom links can
use `BreadcrumbVariants.breadcrumbLink()` to apply the exported recipe.

## Preview Card anchor ownership

Preview Card extends the timed projection with eight Primitive parts. Hover Card projects its
three Styled exports. Runtime supplies the 600 ms opening and 300 ms closing defaults. Trigger
props can override either delay and remove the override later. Primitive placement starts at
bottom/center with zero offset, while Hover Card Content uses its contracted 4 px offset.

The target-local anchor child printer owns Preview Card Trigger composition. The Preview Card subpath
exports `AnchorChildProps` and `AnchorChildPayload`. A child snippet must attach its whole props
object to one native anchor. Direct anchors and transparent Svelte components retain attributes,
attachment symbols, and release-before-reassign refs. Each forwarded attachment tracks its own
reactive dependencies. Missing, wrong, and multiple anchor owners produce development diagnostics.

Disabled belongs to Trigger. The adapter removes href, sets tabindex to -1, and prevents activation
before the consumer callback. A changed disabled value retires queued work through guarded
reconnection while retaining the accepted Root state. Callback and ref changes keep pending work.
Both exact-pin consumers verify navigation, public delay props, interactive content, all captured
parts, portal targets, cancellation, and teardown. The stock review includes a native profile link
and a real SVG icon; the developer fixture verifies timed overlays inside Sheet.

Preview Card retains its accepted active Trigger across option and captured-part recreation.
The shared browser consumers measure separated Trigger geometry through Primitive and Styled
surfaces at both exact Svelte pins. Canceled proposals preserve the previous accepted Trigger;
Runtime resolves removed and foreign candidates through its public setter.

## Menu and Dropdown ownership

Menu projects all 18 Primitive parts through the target-local composite-menu-overlay printer.
Dropdown uses the 17 stock Styled exports. Root accepts `open`; CheckboxItem accepts `checked`;
RadioGroup accepts `value` and can retain undefined when no selection exists. Item models read the
accepted DOM projection after their own cancelable event. Closest-group ownership keeps nested
RadioGroups separate, and a defined group value precedes checked RadioItem inputs.

Root and each SubmenuRoot register their own portals. Required trigger/popup anatomy defers Runtime
connection. The controller starts closed before accepted state is restored. Constructor changes
and captured-part replacement use that guarded path. A Menu portal move restores the same focused
node before Runtime can observe a focus departure. Root close completion keeps its live popup until
Runtime finishes presence work.

Menu Trigger and Dropdown Trigger forward `ButtonChildPayload` to one native button. Each attachment
symbol keeps its own effect. Both lifecycle owners require all 17 Menu fields in each exact-pin
record. The docs account menu, bound item example, submenu, and nested Sheet have owned captures.

## Context Menu anchors

Context Menu adds a local Root and native div Trigger. Its other 16 Primitive exports are the Menu
components themselves, including LinkItem. The Styled contract supplies 16 exports. Root uses
`createContextMenu`, defaults modal to true, and shares the accepted open transaction and item model
owners with Menu. The native Trigger forwards its div ref and gives each attachment symbol an
independent effect. Ordinary attributes and reads inside refs retain the connection.

Runtime owns right-click coordinates, pointer relocation, ContextMenu and Shift+F10 activation,
long-press timing, and its private anchor node. The adapter defers creation until the required Menu
anatomy exists. Captured-part replacement destroys the former controller before recreating it, which
releases its anchor and pending touch work. The established Menu portal binding keeps submenu and
native overlay ownership intact.

Each exact-pin consumer executes all 18 Context Menu lifecycle fields. `contextActivation` covers
pointer, both keyboard openings, disabled controls, touch cancellation, and the 500 ms deadline.
`anchorLifecycle` checks relocation on the same anchor, separate roots, replacement, and teardown.
The gate requires the catalog primary and submenu captures and the accepted docs preview's open
capture in both widths and themes. The first preview uses ContextMenuExampleHero.

Navigation Menu uses a stationary private carrier for each live Content element. Runtime can move
that element into its shared Viewport while Svelte continues to update the child snippet. Part
replacement and constructor-option changes restore authored content ownership before reconnection.
The nullable value, typed Trigger child, and shared viewport rules are recorded in ADR 0018.

Combobox adds 19 Primitive exports and 15 Styled exports. Root owns accepted `value`, `inputValue`,
and `open` models. Input text can differ from the Runtime filter query. Runtime owns collection
filtering, keyboard selection, Field integration, and the original form-reset defaults.

Each exact-pin consumer executes 18 lifecycle fields for the Primitive and Styled owners. Native
input cancellation repairs the visible input after the canceled transaction. Constructor changes
and captured-part replacement read current public models before destruction. The new controller
starts closed, receives portal placement and subscriptions, then applies those models with public
setters. Its query and editing history start a fresh cycle. Explicit defaults remain constructor
inputs. Ordinary item and group changes keep the connected controller.

The submitted input's actual form owns connected reset. Later value or text work takes priority;
canceled reset preserves accepted state. Both pins exercise this behavior with external forms and
Field/Form consumers. Reset replay across controller destruction or missing required parts is
outside this contract.
The review gate requires closed, open, empty, and nested Sheet captures in both widths and themes,
plus the first docs preview in closed and open states.

### Styled Carousel

Carousel supplies five Styled parts and CarouselVariants. Content composes the Primitive Viewport
and Container. Its `class` styles the Container; native props, refs, and attachments reach the
Viewport. Previous and Next keep native button semantics and use the typed Button recipe alias.
The Root forwards `orientation`, `opts`, `plugins`, and `setApi` to the existing Primitive service.
The beta review scene shows stock horizontal and vertical layouts with source-visible examples.

### Styled Toast

Toaster imports the contract stylesheet and forwards position, duration, limit, gap, and peek to
the Primitive Viewport. Its six default templates cover every service variant. Custom children
replace those defaults. The Styled index re-exports toast and its API, options, and promise types
from the public-beta Primitive subpath.

Runtime clones template markup and fills its title, description, and action from service options.
Svelte handlers and state in a template remain on the source nodes. Use `action.onClick` for
cloned actions. Each mounted Viewport owns its manager and releases it on teardown. The beta
review example keeps one Toaster mounted while switching between default and custom templates.

### Color Picker Primitive

The public-beta Color Picker subpath exports all 23 parts and the contract's Runtime facade names.
Value and format select ownership independently from their initial inputs. Defined inputs keep
parent control until unmount; later undefined retains the last controlled state. Initially undefined
bindings observe accepted Runtime state. ADR 0018 records the model and function-binding policy. The public initial projectors supply deterministic
markup through Root, Area, and Channel Slider context. Native refs and attachments retain their
part element types.

Root freezes the reset value and initial format separately. Runtime receives value at construction
only for a parent-controlled value. Silent setters retain current controlled models through reset. The actual submitted input's
form supplies reset events, including external form associations. Capture before Runtime's synchronous
reset and guarded settlement after dispatch preserve canceled resets and newer commands. Connected
part changes use refresh with preserveState, while Runtime retains input drafts and interaction
algorithms. The single Color Picker lifecycle consumer owns these adapter regressions.

## Sidebar accepted state and native controls

Sidebar exposes Provider, Sidebar, Trigger, Rail, and MenuButton through its public-beta subpath and
namespace. Provider has independent optional `open` and `mobileOpen` models. Defined inputs command
Runtime silently; accepted interactions update local state and bindings. Later undefined retains
state. Its callbacks notify accepted changes and have no cancellation method.

Runtime construction receives frozen defaults without controlled options. A stored desktop value
is adopted on first mount only when the initial open input is undefined. Reconstruction restores
both current models before publication. Runtime retains storage access, persistence writes,
shortcuts, and resize behavior. The adapter owns one media subscription for reactive context and
releases it when the query or Provider changes. SSR uses deterministic defaults without storage.

Trigger accepts the existing ButtonChildPayload. MenuButton renders a button when href is absent
and an anchor whenever href is defined, including an empty string. Its child snippet receives a
SidebarMenuButtonChildPayload tagged with kind button or anchor. Spread the complete props onto
one element of that type or a forwarding component. The Sidebar subpath exports its local
AnchorChildProps; the root names that type SidebarAnchorChildProps to preserve its existing anchor
type export. Refs follow the selected element, and attachments keep independent cleanup.

The mobile Sheet connection uses defined Sheet model inputs from the nearest Provider context.
Accepted Sheet binding output calls the context's silent setMobileOpen method. A Sheet attachment
contains Runtime dialog commands and stops its proposal event before that event reaches a Provider.
Runtime resolves the mobile Sheet by nearest Provider ownership. The retained bridge coordinates
Svelte binding commands and accepted Sheet output. Preserve the
`data-sidebar="mobile"` discovery hook when Styled Sheet supplies its public slot. Canceled Sheet
requests retain both models; close completion only notifies. The Sidebar lifecycle fixture proves
this connection through the existing Styled Sheet, including a newer open during pending close.

## Styled Color Picker composition

The twelve Styled Color Picker exports consume the reviewed Primitive value and format bindings.
Root adds an accepted open binding through Popover. The Color Picker Root, hidden form proxy, and
Popover Root stay mounted when inline changes. Only the visible editor children switch, so the
reviewed Primitive owners retain accepted models and reset seeds after later undefined inputs.
Inline retains supplied open state while the absent popup releases the Popover service, scroll lock,
focus ownership, and dismissal handlers. Custom children replace the visible defaults.
Native, Styled Select, and omitted format controls use the existing Runtime format connection.
Contract recipes, five typed dependency aliases, and the six declared CSS imports supply styling.

Trigger and Content use the existing Popover Primitive owners and recipes so their public Color
Picker slots remain intact. Content captures the authored nearest data-floating-root through the
Portal ref before enabling placement. An explicit container must have the same nearest Color Picker
Root as the authored editor. A sibling, external, nested-owner, missing, or invalid target falls back
to the captured local target. A target inside the Portal itself also retains local placement.
Inside a native Starwind Dialog, Content keeps Portal disabled and retains authored placement under
the Color Picker Root. The Popup uses a native manual popover to escape the Dialog's clipping while
its DOM-owned color parts stay together. A Select whose authored Root is inside that open native
layer promotes its own Popup above the editor. The target observes Runtime's state and hidden
attributes to show these presentation layers and retain them until exit motion completes. Teardown
releases the observer and native layer. Runtime keeps positioning, dismissal, focus, and callbacks.
An explicit disablePortal also retains authored DOM placement.

The Styled composition proof covers default, inline and custom anatomy, model/callback forwarding,
format modes, native submitted values, owned and rejected external containers, separate nested
owners, and nested Dialog editing. Layout transitions retain exact accepted state, canonicalized
function-binding readback, and native form state without change callbacks. The beta review catalog
includes source-visible popup and inline editors using the CLI stock CSS.

## Styled Sidebar composition

The 23 Styled exports use the reviewed Sidebar Provider and semantic controls. Provider forwards
both accepted models and the complete persistence options, including supplied Storage. Desktop
markup retains the gap and fixed container, side and variant classes, and icon/offcanvas collapse.
The none branch renders one static native container. Skeletons use a deterministic width.

Mobile presentation uses Styled Sheet with the owned command/proposal bridge described above.
Defined Provider state drives Sheet; accepted Sheet output updates the nearest Provider silently.
Close completion never writes Provider state. Native container refs apply to the desktop or none
branch, while each forwarded attachment releases its own element on removal.

MenuButton retains its href-selected native button or anchor and tagged child snippet. With a
tooltip it supplies the public Tooltip trigger marker on that same native element. Existing Tooltip
Root and Content own discovery, dismissal, portal cleanup, and accessibility. The contract stylesheet
limits these tooltips to collapsed desktop navigation. SidebarMenuButton imports that stylesheet.

The dedicated review page shows a workspace with native navigation, source panels, and optional
desktop persistence under `review-sidebar-workspace`. Its focused browser command crosses the
breakpoint in one session and checks the mobile Sheet before returning to desktop. The single
Styled composition owner covers nested Providers, canceled Sheet requests, stale close completion,
semantic child forwarding, refs, and document resource cleanup.

## Order 08 review and checkpoint boundary

All six family tickets have independent review and focused passing evidence. The current inventory
is 36 Primitive families plus Theme and 54 Styled roots. The general route contains 53 groups;
Sidebar has one review owner at `/review/sidebar/`. Both routes use the CLI stock stylesheet.

The target inventory and focused tests link each criterion to its implementation owner. The final
feature checkpoint and visual review remain separate from package generation.

Follow [Svelte verification](../../../../../docs/agents/svelte-verification.md) for current checks.
After ticket review, the orchestrator runs the reduced `svelte:verify --all` suite, compatibility
once at the existing 5.29.0/5.57.0 pins, and packed Vite once. The two selected visual commands use
the checkpoint's demo build. Historical economics, full-catalog capture, and rollout gate records
remain historical evidence. This queue has no release artifacts or publication actions.

The Vite consumer adds a separate Services.svelte for Color Picker and Sidebar subpath interactions.
Its main.js mounts and removes that owner inside each existing cycle. App.svelte remains unchanged
because SvelteKit and Astro copy it. The accepted archive, installation, and provenance pipeline
is unchanged, so this fixture extension requires only the approved Vite checkpoint.

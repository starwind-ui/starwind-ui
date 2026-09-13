# Menu fixture audit

Reviewed 2026-09-12 for ticket 01. These fixtures compare the named React integrations. The
existing 23-scenario stress harness and its earlier results remain separate evidence.

| Provider     | Exact package                                           | Menu API and action callback                                             | Presence and portal                                                                                                                                  | Position                                                                                                                      |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Starwind     | Local Runtime/React 1.2.1 source, fingerprinted per run | `Menu.Root/Trigger/Positioner/Popup/Item`; `onClick`                     | Ordinary `Menu.Portal`, body target; connected closed content remains mounted and hidden                                                             | `sideOffset={8}`, `align="start"`; collision avoidance defaults to true. Popup also receives offset 8 through its public API. |
| Base UI      | `@base-ui/react` 1.8.0                                  | `Menu.Root/Trigger/Positioner/Popup/Item`; `onClick`                     | Ordinary `Menu.Portal`; `keepMounted` defaults to false, body target                                                                                 | `sideOffset={8}`, `align="start"`; default collision handling                                                                 |
| Ark UI React | `@ark-ui/react` 5.39.1                                  | `Menu.Root/Trigger/Positioner/Content/Item`; item `value` and `onSelect` | `Portal` from Ark; body target. Root presence defaults: `lazyMount=false`, `unmountOnExit=false`, `hideMode="display-none"`. No conditional wrapper. | Stable `positioning` object with `placement="bottom-start"`, `gutter=8`; default collision handling                           |

Every entry imports its own provider's component subpath. A production build audit follows static
chunk imports and rejects another provider's component code in the initial graph. The isolated
manifest and pnpm lockfile pin React and React DOM 19.3.0. Vite resolves every React import through
that pair. The pnpm installation must contain exactly that pair. Ark's transitive Zag packages
resolve to 1.43.3 and are saved as metadata. Fixture source imports Ark components directly.
Root tooling resolves Vite 7.3.5 and Playwright 1.62.0 from the repository lockfile.

The fixture uses 20 stable action records. Action 3 is disabled through each public item API.
The host guards disabled application actions and records callback receipts in a ref. Enabled
actions use a functional React state update. Ark uses `onSelect`; Starwind and Base UI use
`onClick`. Open state stays owned
by each library. Reset restores the host output and scroll, focuses the trigger, and moves the
pointer to (60, 60), with the same component instance. A post-flow check clicks the disabled item
outside comparative sampling. Smoke and trace sessions each retain one validation flow before
that check. Capture uses one excluded warmup context and five measured fresh contexts per cell.
Each context retains one flow and a distinct pass identity. Its flow phase is `warmup` or `first`.
The warmup mount and actions remain in raw evidence and are excluded from reported samples.

Shared CSS uses Arial, neutral colors, 32-pixel item rows, and a popup width of 320 pixels. Its
256-pixel content height exposes eight rows; the one-pixel border makes the outer height 258.
Controls sit in a 1280 by 900 viewport with device scale factor 1. Popup coordinates come from
library positioning. Animations and transitions are disabled in CSS. Root menu opening introduces
no fixture delay. Starwind retains its ordinary 200 ms close-delay setting for hover behavior;
this click-open root path adds no delay override. Other menu delays retain provider defaults.

Before opening, while open, and after closing, each flow saves connected popup shells, item
counts, form nodes, and body/portal element counts. The ordinary presence policies produce
different closed DOM. These observations cannot support an equal-DOM cost claim.

The driver sends 60 mouse movement commands with one-second runner deadlines, then dwells for
200 ms on action 8. Late delivery shifts later sends to prevent catch-up bursts. Actual duration,
lag, trusted browser timestamps, received counts and final coordinates remain in the record.
Geometry is read before movement and at the declared dwell. Mutation observation stays passive.
Only element focus or a valid active descendant satisfies the active-item check. Each fixture records its supported open-focus policy. Starwind mouse-open keeps trigger
focus, which its endpoint permits. Base UI and Ark require focus inside the popup. Ark can
defer that focus until a later frame, so the driver waits for it before Escape.

Event Timing is installed before module execution. Command ownership starts before dispatch.
The capture log includes keypress because Chromium reports it in Enter and character interaction
groups. Ark cancels trigger pointerdown, which suppresses compatibility mousedown/mouseup.
The validator accepts that sequence only when the recorded pointerdown is default-prevented;
pointerdown, pointerup and click must still arrive in order as trusted events. Event objects are
checked after dispatch during the observation drain. Matching uses names, timestamps within
1 ms, and target identity when supplied. Original entries remain in the artifact.

The empty click, typing/Enter delivery and deliberately slow click controls use a separate
context. They do not consume a provider document's first input. Missing Event Timing entries
remain unavailable because this collector has no reconciled explicit zero-loss proof from the
pinned Chromium implementation. Calibration adds no subtraction or synthetic duration. DOM
completion includes observer/validation overhead and has no presented-pixel guarantee.

Trace mode starts a separate run with frame and screenshot categories and saves Chrome trace
JSON with the trace
filmstrip. The driver makes no explicit still capture during a flow, because separate screenshot
commands disturbed hover on the headed validation host. Earlier affected runs remain disclosed. Its observations are excluded from primary data. Trace inspection
supplies qualitative evidence; this suite computes no smoothness ranking.

Sources reviewed:

- [Base UI Menu examples and API](https://base-ui.com/react/components/menu), including item
  callbacks, portal `keepMounted`, positioning and close-on-click defaults.
- [Base UI 1.8.0 portal source](https://github.com/mui/base-ui/blob/v1.8.0/packages/react/src/menu/portal/MenuPortal.tsx).
- [Ark Menu examples and API](https://ark-ui.com/docs/components/menu), with
  [presence](https://ark-ui.com/docs/utilities/presence). The installed 5.39.1 distribution's
  `menu-root.js`, `menu-item.js`, `use-presence.js`, and package manifest confirm the public
  composition, item callback, and presence defaults for the pinned version.
- Local `packages/react/src/menu` and `packages/react/src/internal/portal.tsx`, including the
  preserved shared portal observer prerequisite. Local source is authoritative for Starwind.
- [Event Timing specification](https://www.w3.org/TR/event-timing/) and
  [Playwright mouse API](https://playwright.dev/docs/api/class-mouse#mouse-move).
- Local methodology research dated 2026-09-11 and the current performance inventory: the
  original full comparison predates the portal change; five portal rows and four corrected
  highlight stress rows were rerun afterward. No historical sample enters this companion.

Host commands use `corepack pnpm` because the standalone executable hangs on this Mac. The build
helper uses direct filtered package builds so nested package-manager lookup cannot select the
host's incompatible global pnpm. macOS temporary paths are canonicalized before the Vite build.
Browser runs require local sandbox escalation for Chromium and loopback access. Each run saves
source fingerprints, exact dependency inputs, production assets, environment and partial errors.

## Disabled Menu action policy

The post-flow disabled check found that Starwind `Menu.Item disabled` leaves its React `onClick`
callback active. The fixture records that receipt without invoking application action 3. Local
`MenuItem.tsx` forwards the callback as a standard HTML attribute; the Runtime popup click
listener returns for a disabled item without suppressing the user's callback. There is no item
`onSelect` prop in the generated public contract. The callback receipt stays in untimed raw
diagnostics; disabled application action and dismissal remain the task result. Frozen earlier
captures keep their original failed-cell records.

## Select and Combobox fixtures

Reviewed 2026-09-12 for ticket 02. Both tasks use stable module-level records. Select values are
`option-1` through `option-100`. Option 3 is disabled. Combobox values are `item-001` through
`item-500`, with matching `Item 001` labels. The host owns scalar selected values and Combobox
input text. Provider callbacks normalize their public shapes before they update that host state.

| Provider     | Select value and form                                                                                                                        | Combobox value and form                                                                                                                                     | Filtering allocation                                                                                     | Presence and position                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starwind     | Scalar `value`; scalar `onValueChange`; Root `name="choice"` supplies its hidden input                                                       | Scalar `value` and `inputValue`; scalar callbacks; Root `name="choice"` supplies its hidden input                                                           | Runtime `filterMode="contains"` filters the stable authored children                                     | Ordinary portals retain closed popup shells. Positioners use `sideOffset={8}` and start alignment. Select sets `alignItemWithTrigger={false}`.                                     |
| Base UI      | Stable option object as `value`; callback maps the object to its stable scalar; object `{ value, label }` supplies native form serialization | Stable item object as `value`; callbacks map object and input shapes; `itemToStringValue` supplies the native value                                         | Root owns filtering through a stable case-insensitive substring `filter`; the fixture does not prefilter | Ordinary portals use default unmounted presence. Positioners use `sideOffset={8}` and start alignment. Select sets `alignItemWithTrigger={false}`.                                 |
| Ark UI React | Stable collection; array `value`; details callback maps its first value; `Select.HiddenSelect` owns `choice`                                 | Memoized collection contains the query matches; array/details callbacks map to host scalars; a host hidden input named `choice` carries the selected scalar | The fixture memoizes Ark's required filtered collection with case-insensitive substring matching         | Ordinary Ark portals retain closed content with `lazyMount=false`, `unmountOnExit=false`, and display-none hiding. The stable positioning object uses `bottom-start` and gutter 8. |

Each submitted form is read with `new FormData(form).get("choice")`. Select records initial active
state, every ArrowDown active state, and actual key count on a bounded path to enabled option 4.
Disabled option 3 may receive focus; it cannot become the chosen value. It checks the changed
value, disabled state, popup dismissal, and focus. Combobox checks the exact ten values from
`item-040` through `item-049`, records the initial accessible active option, and saves the actual
ArrowDown count used to reach `item-042`. Every character has an immutable action ID. Each flow
saves actual connected popup, item, form, fixture, portal, and body counts. These observed counts
describe presence policy without assuming equal closed DOM.

Reset first sends browser Escape when the control is open. It then restores host values, popup
scroll, pointer position, and focus outside timing. Select restores trigger focus. Combobox restores
the neutral submit-button focus because Starwind opens its input on focus; each Combobox flow then
focuses the input before it sends the first timed character. A UUID stored in the unchanged Host
instance must match the fixture UUID after reset. The Select scroll-to-last preflight runs in a
separate validation context. It cannot consume the measured context's first input, first open, or
presence history.

The pinned APIs were checked against the local Starwind React source, Base UI 1.8.0 package source,
the [Base UI Select documentation](https://base-ui.com/react/components/select), the
[Base UI Combobox documentation](https://base-ui.com/react/components/combobox), the
[Ark Select documentation](https://ark-ui.com/docs/components/select), the
[Ark Combobox documentation](https://ark-ui.com/docs/components/combobox), and the
[Ark List Collection documentation](https://ark-ui.com/docs/collections/list-collection).

The smoke retains supported task failures as complete, ineligible cells. Base UI 1.8.0 exposes
option 3 with `aria-disabled="true"` and its disabled data state. Its supported composite-item
policy [hardcodes `focusableWhenDisabled: true`](https://github.com/mui/base-ui/blob/v1.8.0/packages/react/src/select/item/SelectItem.tsx#L115-L120),
while its public `Select.Item` props expose `disabled` and no focusability override. ArrowDown
navigation therefore moves from option 2 to option 3. The bounded task continues to enabled
option 4 with 100 ms gaps and at most ten keys. The raw active path preserves this policy.
Navigation endpoints resolve the focused option or direct `aria-activedescendant` target by ID.
They require each key to change the active value. A two-frame observer
drain follows the final typed character and form submission before the driver enumerates visible
options or reads `FormData`. The same barrier precedes post-open inventory checks. This keeps full
DOM assertions outside the preceding input's Event Timing window. After a form choice, the barrier
closes that observation before an untimed bounded readiness check waits for hit testing to identify
the submit control. Each flow records the wait, popup state, and trusted click target. A retained
popup can therefore finish its exit without intercepting the separately measured submit input.

## Submenu and closed Select pages

Reviewed 2026-09-12 for ticket 03. Submenu parent row 4 uses the public submenu trigger; the
other seven parent rows invoke their own stable actions. The child has eight actions and selects
`child-4`. Starwind and Base use `SubmenuRoot/SubmenuTrigger` with the ordinary nested portal.
Ark nests a `Menu.Root` and `Menu.TriggerItem`, as in its official nested example. Each positioner
carries an ownership attribute for inventory; this adds no wrapper or behavior.

| Provider                           | Default submenu open / close delay | API positioning                                                   |
| ---------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Starwind                           | Immediate pointer-enter / 200 ms   | Positioner and Popup use right/start and sideOffset 8             |
| Base UI 1.8.0                      | 100 ms / 0 ms; hover enabled       | Positioner uses right/start and sideOffset 8                      |
| Ark 5.39.1, transitive menu 1.43.3 | 200 ms / 100 ms                    | Root uses right-start and `offset: { mainAxis: 8, crossAxis: 0 }` |

The pinned Ark menu overrides submenu `gutter` to zero. Its public positioning offset has
precedence over that gutter in the pinned popper implementation. This supported option provides
the required eight-pixel gap without changing machine behavior. The production asset and pinned
package source confirm these delays and offset semantics. No hover delay prop is overridden.

The common pointer origin is eight pixels inside the submenu trigger's right edge at its vertical
center. After accessible child opening, eighteen commands cross to the center of child 4 over
300 ms, followed by a 200 ms dwell. Coordinates are computed before movement. The API gap is
measured from the trigger edge to the child popup edge; the parent's one-pixel border makes the
visible outer-popup gap seven pixels. Every provider has this same geometry. Starting near the
trigger edge avoids a diagonal path through another parent action. The separate hover record
retains actual send, browser delivery, DOM completion and runner wait. Uncommanded or out-of-order
pointer movement invalidates the driver evidence, with every event retained. The trace uses the
same path and keeps all observations excluded. Full DOM checks follow an observation drain.

Each page composes the ticket 02 Select adapter with twenty stable options. All selected values
have change callbacks; the target uses the Host scalar and each other control keeps local state.
The same Host and child keys survive reset. Each Select keeps its ordinary native form and submit
button. The four-column grid uses 208-pixel columns and 24-pixel horizontal gaps. Control 10 sits
in row 3, column 2. Only its value changes. Each flow saves open, Escape-close, and reopen with
separate action IDs. The bounded path records Base's disabled-focus policy and continues until
option 4 is active.

Mount starts immediately before ordinary `root.render` and is recorded once outside flowPhase.
A passive mutation check waits for all expected connected closed triggers, accessible popup/role
state, all `Option 1` labels, and the expected forms. Starwind additionally requires every
framework portal wrapper to be a body child with `data-placement="ready"`. Ark requires all
ordinary positioners outside the fixture root. Base initially has no connected positioner. The
Host effect supplies fixture metadata and asks for the same check; later mutations complete it.
The result includes check count and checking overhead. A later observation drain and complete
inventory validate the recorded condition outside its interval. This is ready DOM, with observer
and checking overhead; it does not certify paint or eagerly initialize a lazy controller.

Starwind Select's public Root initializes its controller from trigger focus, click, key or pointer
capture. Closed mount includes its rendered accessible state and asynchronously resolved label;
controller IDs and aria-controls appear on activation. Its closed Popup shell stays connected
while ordinary presence omits its children. Base Select mounts hidden content on trigger focus,
including a presentation-role Popup around the accessible List. Thus the mount inventory has no
Base popup, while before-open and Escape-close inventories can contain the focused target's
20 options. A closed Base popup can remain hidden after submit when focus has moved away. The
validator accepts zero or one such target shell, with twenty items when present. It still rejects
visible, orphan, duplicate, or wrong-control popups. The raw inventory records the observed
presence without inferring it from focus. Ark keeps every closed shell and item connected. The page inventories distinguish
outer shell identity from the accessible listbox ID. They reject duplicate control endpoints,
unplaced portals, and unexpected visible or rendered content. Full form and element counts are
scoped to the fixture root and body children containing authored portal positioners; total body
count is also recorded as context.

Additional reviewed sources:

- [Base nested Menu and default hover API](https://base-ui.com/react/components/menu#nested-menu)
  and [pinned SubmenuTrigger source](https://github.com/mui/base-ui/blob/v1.8.0/packages/react/src/menu/submenu-trigger/MenuSubmenuTrigger.tsx).
- [Ark nested example](https://ark-ui.com/examples/nested-menu), [Menu API](https://ark-ui.com/docs/components/menu),
  and [ordinary presence](https://ark-ui.com/docs/utilities/presence). The frozen 5.39.1
  `menu-root.js` and `menu-trigger-item.js` confirm parent registration and trigger composition.
  Its resolved 1.43.3 menu/popover positioning implementation and captured production bundle
  confirm the timer defaults, gutter override, and public offset precedence.
- Local `MenuSubmenuRoot.tsx`, `MenuSubmenuTrigger.tsx`, Runtime `components/menu/menu.ts`,
  `SelectRoot.tsx`, `SelectPopup.tsx`, and `internal/portal.tsx` confirm Starwind's defaults,
  lazy activation, presence and observable placement. The earlier portal validation dated
  2026-09-11 used 1,000 controls with forced flushing/layout. Those samples are excluded here.

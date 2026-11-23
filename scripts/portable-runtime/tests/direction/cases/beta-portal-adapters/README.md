# Vue and Svelte portal ownership map

`direction:build` writes the current candidate packages under
`<candidate>/packages/{vue,svelte}/src`. The nine Primitive Portal families below
all use `useVuePortalPlacement` from
`scripts/portable-runtime/renderers/framework-adapters/vue/portal.ts` or
`createPortalPlacement` from
`scripts/portable-runtime/renderers/framework-adapters/svelte/portal-placement.ts`.
The candidate audit checked the named `.vue` and `.svelte` Portal files in both
targets. Every file calls its target helper and reports placement through Runtime.
Runtime's `packages/runtime/src/internal/floating-portal.ts` prepares the direction
session when the helper resolves a framework target. That step precedes Vue
Teleport or Svelte's attachment move. Runtime
`packages/runtime/src/internal/portal-direction.ts` owns and releases the projected
`dir` attribute.

| Public surface  | Owner and candidate output path                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog          | Native `<dialog>` stays in its DOM owner. `scripts/portable-runtime/contracts/primitive/components/dialog.ts` has no Portal part. Candidate: `packages/{vue,svelte}/src/dialog/DialogPopup.{vue,svelte}`. |
| Alert Dialog    | Styled content renders a native dialog. Its optional Primitive Portal uses the shared beta helper. Candidate: `packages/{vue,svelte}/src/alert-dialog/AlertDialogPortal.{vue,svelte}`.                    |
| Sheet / Drawer  | Styled Sheet uses Drawer Popup as a native dialog. Its optional Drawer Portal uses the shared helper. Candidate: `packages/{vue,svelte}/src/drawer/DrawerPortal.{vue,svelte}`.                            |
| Sidebar mobile  | Styled Sidebar composes Sheet. Sidebar tooltips compose Tooltip Portal. Source: `scripts/portable-runtime/contracts/styled/components/sidebar.ts`.                                                        |
| Dropdown        | Styled content composes Menu Portal. Candidate: `packages/{vue,svelte}/src/menu/MenuPortal.{vue,svelte}`.                                                                                                 |
| Context Menu    | Context Menu delegates its Portal to Menu. Source: `scripts/portable-runtime/contracts/primitive/components/context-menu.ts`; candidate Menu Portal path above.                                           |
| Navigation Menu | Its Portal carries the shared viewport navigation context. Candidate: `packages/{vue,svelte}/src/navigation-menu/NavigationMenuPortal.{vue,svelte}`.                                                      |
| Select          | Its Portal carries the option collection context. Candidate: `packages/{vue,svelte}/src/select/SelectPortal.{vue,svelte}`.                                                                                |
| Combobox        | Its Portal carries the editable collection context. Candidate: `packages/{vue,svelte}/src/combobox/ComboboxPortal.{vue,svelte}`.                                                                          |
| Color Picker    | Styled content composes Popover; the format picker composes Select. Source: `scripts/portable-runtime/contracts/styled/components/color-picker.ts`.                                                       |
| Popover         | Its Portal uses the presence floating overlay path. Candidate: `packages/{vue,svelte}/src/popover/PopoverPortal.{vue,svelte}`.                                                                            |
| Hover Card      | Styled content composes Preview Card Portal. Candidate: `packages/{vue,svelte}/src/preview-card/PreviewCardPortal.{vue,svelte}`.                                                                          |
| Tooltip         | Its Portal uses the timed floating overlay path. Candidate: `packages/{vue,svelte}/src/tooltip/TooltipPortal.{vue,svelte}`.                                                                               |

The built fixtures in `index.ts` exercise three distinct public paths: Popover
Portal, Dropdown through Menu Portal, and Sheet through a native dialog. Each
installs a MutationObserver before interaction. Its first open and visible state
records computed direction before the next paint. The Popover case also checks
Vue `v-model:open`, Svelte `bind:open`, local `dir`, custom target changes,
disabled placement, child replacement, and teardown of a held wrapper node.
It also keys a new owner and checks the old wrapper's released direction before
the next first-visible portal state. A close and reopen check measures the
retained wrapper direction. Runtime's cross-browser portal tests cover nested
open portals and authored `dir=auto` surfaces.
The remaining family rows participate in the full direction inventory and
staging atlas. The Svelte target declares a minimum of 5.29.0; package SSR and
the isolated minimum-version host are checked separately from this browser case.

`side=left` and `side=right` retain physical placement meaning. Authored surface
`dir` controls local text and floating alignment. Native dialogs keep inherited
direction through the browser top layer.

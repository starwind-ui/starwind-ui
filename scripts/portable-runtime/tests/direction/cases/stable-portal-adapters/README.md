# Astro and React portal ownership map

This map records the current candidate output paths. `direction:build` writes them under
`<candidate>/packages/{astro,react}/src` and `<candidate>/styled/{astro,react}`. The
source printers are `scripts/portable-runtime/renderers/framework-adapters/astro/portal.ts` and
`scripts/portable-runtime/renderers/framework-adapters/react/portal.ts`. The Astro printer emits Runtime
placement. The React printer emits `ReactPortal`, and each listed React root uses
`useReactPortalScope` before its controller connects. Runtime
`packages/runtime/src/internal/floating-portal.ts` calls
`prepareFrameworkPortalDirection` during placement resolution. That call runs before
React moves the wrapper. Runtime also creates a direction session before it moves an
Astro wrapper. `packages/runtime/src/internal/portal-direction.ts` owns the projected
`dir` attribute and releases it on teardown.

| Public surface  | Current owner path                                                                                                                                                                    | Candidate output checked                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Dialog          | Native `<dialog>` stays under its authored root. `scripts/portable-runtime/contracts/primitive/components/dialog.ts` has no Portal part.                                              | `packages/{astro,react}/src/dialog/DialogPopup.*`                                                                    |
| Alert Dialog    | Styled content renders a native dialog through `scripts/portable-runtime/contracts/styled/components/alert-dialog.ts`. The optional Primitive Portal uses the native overlay printer. | `packages/{astro,react}/src/alert-dialog/AlertDialogPortal.*` and `styled/react/alert-dialog/AlertDialogContent.tsx` |
| Sheet / Drawer  | Styled Sheet renders Drawer Popup as a native dialog in `scripts/portable-runtime/contracts/styled/components/sheet.ts`. The optional Drawer Portal uses the native overlay printer.  | `packages/{astro,react}/src/drawer/DrawerPortal.*` and `styled/react/sheet/SheetContent.tsx`                         |
| Sidebar mobile  | Styled Sidebar wraps Sheet and uses its native dialog path. Its tooltip uses Tooltip Portal.                                                                                          | `styled/react/sidebar/Sidebar.tsx`                                                                                   |
| Dropdown        | Styled content renders Menu Portal.                                                                                                                                                   | `styled/react/dropdown/DropdownContent.tsx`; `packages/{astro,react}/src/menu/MenuPortal.*`                          |
| Context Menu    | Context Menu delegates to Menu parts, including Menu Portal.                                                                                                                          | `styled/react/context-menu/ContextMenuContent.tsx`; `packages/{astro,react}/src/menu/MenuPortal.*`                   |
| Navigation Menu | Its own Portal uses the shared viewport navigation printer.                                                                                                                           | `packages/{astro,react}/src/navigation-menu/NavigationMenuPortal.*`                                                  |
| Select          | Its Portal uses the option collection printer.                                                                                                                                        | `packages/{astro,react}/src/select/SelectPortal.*`                                                                   |
| Combobox        | Its Portal uses the editable collection printer.                                                                                                                                      | `packages/{astro,react}/src/combobox/ComboboxPortal.*`                                                               |
| Color Picker    | Styled content composes Popover; the format picker composes Select.                                                                                                                   | `styled/react/color-picker/ColorPickerContent.tsx`; Popover and Select Portal outputs                                |
| Popover         | Its Portal uses the presence floating overlay printer.                                                                                                                                | `packages/{astro,react}/src/popover/PopoverPortal.*`                                                                 |
| Hover Card      | Styled content composes Preview Card Portal.                                                                                                                                          | `styled/react/hover-card/HoverCardContent.tsx`; `packages/{astro,react}/src/preview-card/PreviewCardPortal.*`        |
| Tooltip         | Its Portal uses the timed floating overlay printer.                                                                                                                                   | `packages/{astro,react}/src/tooltip/TooltipPortal.*`                                                                 |

The `index.ts` fixtures use built Styled consumers for three distinct paths: Popover
Portal, Dropdown through Menu Portal, and Sheet through a native dialog. Each source
installs a MutationObserver before interaction. It records the first transition into
an open, visible state before the browser's next paint. The Popover case also checks
custom and disabled targets, local `dir`, React Strict Mode and controlled updates,
target replacement, React unmount, Astro init events, and Astro swap teardown.
`staging/stable-portal-adapters.json` selects these cases. The other family rows also
appear in the full direction inventory and staging atlas.

`side=left` and `side=right` remain physical placement choices. The direction
projected onto a portal wrapper is owned by its Runtime session. An authored surface
`dir` takes precedence for text and floating alignment. Native dialogs retain the
direction of their DOM owner through the browser top layer.

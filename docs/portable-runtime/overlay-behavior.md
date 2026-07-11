# Overlay Behavior Contract

Status: current as of 2026-07-01 after the runtime overlay shell and cancelable details work.

This document records Starwind Runtime's overlay scroll-lock and anchor-stability policy. It is a
behavior contract for Runtime controllers, generated Primitive adapters, styled Starwind wrappers,
and docs/specs. It is not an accessibility claim that every overlay must lock page scroll.

## Scroll Lock Policy

Body scroll locking is a modal behavior choice. It is separate from focus calls such as
`element.focus({ preventScroll: true })`: the former locks the document body while an overlay is
open, while the latter only asks the browser not to scroll during that one focus move.

ARIA patterns do not require Menu, Select, Combobox, Popover, Tooltip, Navigation Menu, Toast, or
Scroll Area to lock body scroll by default. Starwind uses scroll locking where the component's
modal policy calls for it, and keeps lightweight disclosures non-modal unless an approved public
option says otherwise.

| Component                 | Body scroll lock contract                   | Notes                                                                                                                                    |
| ------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alert Dialog              | Locked by default.                          | Uses the shared reference-counted document lock through Dialog.                                                                          |
| Dialog                    | Locked by default while modal.              | Uses the shared reference-counted document lock; focus behavior remains a separate tested concern.                                       |
| Drawer / Sheet            | Locked by default.                          | Dialog-backed modal drawer behavior.                                                                                                     |
| Menu / Dropdown           | No lock by default; `modal` opt-in.         | Hover-opened root menus and submenus do not create independent body locks. Submenus follow the root menu policy.                         |
| Context Menu              | Locked by default; `modal={false}` opt-out. | Implemented as a Context Menu controller over the shared Menu runtime.                                                                   |
| Select                    | Locked by default; `modal={false}` opt-out. | Non-item-aligned opens constrain list height to the available viewport space. Selected-item alignment remains a separate placement mode. |
| Combobox                  | No lock by default; `modal` opt-in.         | Normal autocomplete flows remain lightweight.                                                                                            |
| Popover                   | No lock by default; `modal` opt-in.         | Hover-opened popovers never lock body scroll, even when modal support is enabled for other open paths.                                   |
| Tooltip                   | No lock.                                    | Descriptive, non-interactive popup.                                                                                                      |
| Preview Card / Hover Card | No lock.                                    | Lightweight preview disclosure.                                                                                                          |
| Navigation Menu           | No lock.                                    | Navigation disclosure, not a modal command surface.                                                                                      |
| Toast                     | No lock.                                    | Notification stack, not an overlay that owns the current task.                                                                           |
| Scroll Area               | No lock.                                    | Scrollable region behavior, not modal overlay behavior.                                                                                  |

## Anchor Stability

Some floating overlays should prioritize staying attached to their trigger or invocation point over
being shifted into the visible viewport.

Anchor-preserving overlays:

- Menu / Dropdown roots and submenus.
- Context Menu when `modal={false}`; the hidden invocation anchor is document-positioned so pointer,
  keyboard, and touch openings remain attached while the page scrolls.
- Navigation Menu content.
- Tooltip content, including default-open tooltips.

These overlays may flip or reposition while attached. If no valid attached placement exists, the
runtime keeps the overlay at the best anchored position instead of shifting it into a detached
viewport-visible position.

## Adapter Contract Surface

The approved public modal option is `modal` / `data-modal`; Starwind does not expose a separate
public `preventScroll` option in this pass.

Dialog-family primitive roots also expose modal behavior through their own specs and contracts. This
pass added or confirmed the floating/value-control `modal` surface for:

- Menu
- Context Menu
- Select
- Combobox
- Popover

Styled Starwind wrappers expose the same floating/value-control option where the public styled
component owns the root:

- Dropdown
- Context Menu
- Select
- Combobox
- Popover

`modal="trap-focus"` remains out of scope. Body scroll lock alone does not create a full modal
accessibility model with focus trapping, outside-tree hiding, or pointer blocking.

## Open-Change Shell

Migrated overlay families use `runOverlayOpenChangeShell` from
`packages/runtime/src/internal/overlay-open-change.ts` for open-change sequencing. The shell owns the
shared order of operations:

- component intent checks,
- details creation,
- `onOpenChange`,
- cancelable `starwind:open-change`,
- cancellation check,
- controlled or uncontrolled state application,
- subscriber notification.

Component controllers still own their domain-specific lifecycle around that shell: native dialog
operations, focus capture/restoration, scroll locks, dismissal registration, portals, floating
positioning, hover timers, submenus, value/input selection, and close-complete timing.

Open-change details for the migrated overlay families use
`createCancelableDetails` from `packages/runtime/src/internal/cancelable-details.ts`. Component
public detail names and fields remain component-owned aliases; the shared helper only centralizes
`cancel()` and `isCanceled` behavior.

The source guard in `packages/runtime/tests/internal/overlay-open-change-source.test.ts` keeps the
migrated overlay controllers from reintroducing per-component `starwind:open-change` dispatch
pipelines. `Collapsible`, `Sidebar`, and other non-overlay open-change helpers are intentionally
outside this overlay shell contract.

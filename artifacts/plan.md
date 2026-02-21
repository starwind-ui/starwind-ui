# Dropdown Sub-Menu Portal Fix

## Problem

`DropdownContent` has `overflow-x-hidden overflow-y-auto` and `will-change-transform`, which clips
any absolutely-positioned sub-content that tries to render outside its bounds. CSS-only solutions
(`overflow: clip`, `position: fixed`) don't work because `will-change-transform` establishes a new
containing block that traps fixed-position descendants.

## Solution: Lightweight JS Portal

Move sub-content to `document.body` when opening, position with `position: fixed` using
`getBoundingClientRect()`, and return it to its original DOM position on close.

This mirrors the approach used by Base UI (MUI) which uses `FloatingPortal` to teleport menu content
out of clipping ancestors.

## Files Changed

### 1. `DropdownSubContent.astro`

- Remove `absolute`, `left-full`, `top-0` positioning from the `dropdownContent()` call (these are
  meaningless once the element is portaled to `<body>`)
- The element will receive `position: fixed` + coordinates from JS at runtime

### 2. `Dropdown.astro` (script — `DropdownHandler` class)

#### New properties

- `contentPlaceholder: Comment | null` — marks original DOM position for return
- `cleanupAutoUpdate: (() => void) | null` — teardown for scroll/resize listeners

#### New methods

- **`portalContent()`** — on submenu open:
  1. Insert a `<!-- dropdown-sub-placeholder -->` comment where content lives
  2. Append `this.content` to `document.body`
  3. Apply `position: fixed; z-index: 50` inline
  4. Call `positionSubContent()` for initial placement
  5. Set up scroll + resize listeners that call `positionSubContent()`

- **`unportalContent()`** — on submenu close (after animation timeout):
  1. Move `this.content` back before the placeholder comment
  2. Remove the placeholder
  3. Strip inline fixed-positioning styles
  4. Tear down scroll/resize listeners

- **`positionSubContent()`** — compute fixed position:
  1. Get `this.trigger.getBoundingClientRect()`
  2. Set `top` = trigger rect top, `left` = trigger rect right (for side=right)
  3. Clamp to viewport bounds if needed

#### Modified methods

- **`openDropdown()`** — if `this.isSubmenu`, call `portalContent()` after showing content
- **`closeDropdown()`** — if `this.isSubmenu`, call `unportalContent()` inside the existing
  `setTimeout` callback (after animation completes)

### 3. Hover edge case

When content is portaled to `<body>`, moving the mouse from the parent dropdown to the sub-content
fires `pointerleave` on the parent (since the sub-content is no longer a DOM child). We need to:

- Add a `pointerenter` listener on the portaled sub-content that dispatches a custom event
  (`starwind-dropdown:cancel-close`) on the parent dropdown
- The parent listens for this event and calls `clearCloseTimer()`

## What's preserved

- Keyboard navigation (events bound directly on elements, travel with them)
- Hover open/close behavior
- `starwind-dropdown:close-all` bubbling
- Open/close CSS animations
- Accessibility attributes (aria-controls, aria-labelledby)
- Item selection via click

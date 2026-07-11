# Menu Specialized Adapter Spec Evaluation

Status: current
Date: 2026-06-26
Origin: completed during the composite menu overlay Specialized Adapter Spec work.

## Decision

Menu has been migrated from `custom-island` to `specialized-adapter-spec`.

The composite-menu-overlay Specialized Adapter Spec now describes Menu's adapter-facing facts once:
root lifecycle, trigger/portal/positioner/popup anatomy, item and link item branches, checkbox and
radio item event forwarding, radio group context projection, checkbox and radio indicators, submenu
ownership and refs, and namespace exports. Astro and React generation use that spec while keeping
behavior in Runtime.

## What Works Well

- Astro and React printers preserve generated Menu output parity while consuming shared spec recipes.
- Vue and Solid now have deterministic non-shipping Menu tracer fixtures generated from the same
  spec.
- The fixtures demonstrate framework-shaped handling for refs, slots or children, Teleport/Portal
  anatomy, radio context, item state projection, indicator projection, submenu root/trigger
  topology, and namespace exports.
- Shipping boundaries are guarded: the fixtures stay under `__future-fixtures/`, do not create Vue
  or Solid package directories, do not add CLI registry entries, and do not imply demo dependencies
  or public docs support.
- Navigation Menu is generated through its separate shared-viewport navigation spec rather than
  reusing Menu's composite item model.

## Runtime-Owned Behavior

These behaviors remain in `packages/runtime/src/components/menu/menu.ts` and are intentionally not
described as generator-owned behavior:

- roving focus and highlighted item state
- typeahead buffering and matching
- disabled item focusability versus activation blocking
- submenu controllers and hover close timers
- pointer and keyboard open reasons
- cancellable root open, checkbox checked, and radio value changes
- item activation and close-on-click rules
- checkbox and radio state mutation
- portal movement and Floating UI auto-update
- outside press and Escape dismissal
- animation-delayed hiding and cleanup

## Remaining Gaps

- Vue and Solid fixtures are tracer-only. They are useful pressure tests, not shipped framework
  packages.
- Context Menu was later migrated through the composite-menu-overlay variant spec. It now reuses the
  Menu-backed branch, context, indicator, submenu, floating, and namespace recipes while adding
  context-trigger anchoring facts.

## Completion

The Context Menu composite-overlay variant is complete. It reuses Menu branch, indicator, radio
context, submenu, and namespace recipes while adding only context-trigger anchoring facts. Use the
current [Generic Adapter Plan coverage](./generic-adapter-plan-coverage.md) as the source of truth
for generated components. Future framework work must remain behind the non-shipping
framework-readiness gate until its adapter vertical slice is explicitly approved for release.

# Zag Runtime Feature Comparison

Generated from local comparison data on 2026-07-05.

## Scope

This report compares Zag implementation features against Starwind Runtime features for components where the current Starwind Runtime has a direct or close Zag equivalent. It is feature evidence, not an architecture proposal; Zag remains a reference rather than the Starwind Runtime foundation.

## Source Versions

- Starwind evidence date: 2026-07-05
- Starwind evidence roots: `packages/runtime/src/components`, `scripts/portable-runtime/renderers/primitive-index.ts`, `packages/runtime/src/init-starwind.ts`, `README.md`, `docs/portable-runtime/README.md`
- Zag evidence date: 2026-07-05
- Zag package version: `1.42.0`
- Zag package source: `@zag-js/* packages from the current runtime:size install`

## Executive Summary

| Metric | Value |
| --- | --- |
| Confirmed overlap components | 29 |
| Package-size seed components | 28 |
| Validated extra overlap | `navigation-menu` |
| Feature comparison rows | 132 |
| Open follow-up rows | 22 |

### Size Context

These size numbers come from the current package-size report. They are context for public answers, not proof of feature support.

| Comparison set | Components | Starwind min+gzip | Zag React min+gzip | Base UI min+gzip | Source |
| --- | ---: | ---: | ---: | ---: | --- |
| All-three overlap | 26 | 96.2 KiB | 97.5 KiB | 139.8 KiB | `docs/portable-runtime/package-size-comparison.md` |
| Starwind/Zag overlap | 28 | 107.8 KiB | 109.7 KiB | N/A | `docs/portable-runtime/package-size-comparison.md` |

## Public Framing Guardrails

- Say Starwind Runtime is heavier than the old one-off component scripts because it now owns real cross-component behavior.
- Say the current matched-support size report still has Starwind lighter than Zag React and Base UI for the measured overlap rows.
- Say the extra Runtime bytes buy documented behavior: forms, dynamic collections, overlays, cancellation, lifecycle cleanup, and copied-component initialization.
- Keep public wording aligned with the root and Runtime READMEs: Astro-first, framework-portable, accessible UI components with Starwind/shadcn-style ergonomics.
- Do not claim zero runtime dependencies, full Zag parity, every-framework support, or "Base UI for Astro."

## Starwind Strengths

| Strength | Evidence | Product relevance |
| --- | --- | --- |
| Raw HTML initialization and copied-component lifecycle | `packages/runtime/src/init-starwind.ts`, `packages/runtime/src/components/*/*.browser.test.ts` | Copied Astro/React components can initialize and clean up behavior from normal DOM rather than requiring users to wire every controller manually. |
| Dynamic DOM and mutable option refresh where proven | `packages/runtime/src/components/accordion/accordion.browser.test.ts`, `packages/runtime/src/components/checkbox-group/checkbox-group.browser.test.ts`, `packages/runtime/src/components/combobox/combobox.browser.test.ts`, `packages/runtime/src/components/select/select.browser.test.ts`, `packages/runtime/src/components/scroll-area/scroll-area.browser.test.ts` | Dynamic item add/remove, disabled-state changes, reordered collections, and mutable DOM options are a Starwind Runtime selling point for copied components. |
| Base UI-style event details and cancellation behavior | `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`, `packages/runtime/src/components/collapsible/collapsible.browser.test.ts`, `packages/runtime/src/components/menu/menu.browser.test.ts`, `packages/runtime/src/components/tabs/tabs.browser.test.ts` | Cancelable DOM events let application code veto uncontrolled commits before the Runtime mutates state. |
| Native forms, field integration, and reset lifecycle coverage | `packages/runtime/src/components/field/`, `packages/runtime/src/components/form/`, `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/radio-group/radio-group.browser.test.ts` | Native form participation, reset synchronization, labels, descriptions, errors, and Field-owned state are core Starwind product differentiators. |
| Starwind/shadcn-style copied-component ergonomics | `packages/runtime/src/components/toast/toast.browser.test.ts`, `README.md` | Styled components remain understandable and editable while shared behavior lives in the Runtime. |

## Zag Strengths

| Strength | Evidence | Product relevance |
| --- | --- | --- |
| Machine/connect architecture with generated part props | `@zag-js/core@1.42.0/dist/types.d.ts`, `@zag-js/*@1.42.0/dist/*.types.d.ts` | Zag's machine/connect model gives framework adapters a consistent way to derive part props and state APIs. |
| Framework adapter breadth | `docs/portable-runtime/package-size-comparison.md`, `@zag-js/react@1.42.0`, `@zag-js/vue@1.42.0`, `@zag-js/solid@1.42.0`, `@zag-js/svelte@1.42.0` | Zag currently ships adapters for more frameworks than Starwind's first-party Astro and React primitive adapters. |
| Collection APIs for complex selection components | `@zag-js/collection@1.42.0/dist/types.d.ts`, `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts`, `@zag-js/select@1.42.0/dist/select.types.d.ts` | ListCollection and item-state APIs are a strong reference for complex select, combobox, and collection-heavy components. |
| Custom root-node and environment hooks | `@zag-js/types@1.42.0/dist/index.d.ts`, `@zag-js/core@1.42.0/dist/scope.d.ts`, `@zag-js/dom-query@1.42.0/dist/scope.d.ts` | The installed Zag type surface includes getRootNode/custom-environment hooks for shadow-root, iframe, and nonstandard document contexts. |
| Advanced high-level component APIs | `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts`, `@zag-js/drawer@1.42.0/dist/drawer.types.d.ts`, `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts`, `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Zag exposes richer APIs in several components, including carousel autoplay/progress, drawer snap/swipe, file-upload validation, and toast store controls. |

## Component Summary

| Component | Starwind support | Zag support | Follow-ups | Overall note |
| --- | --- | --- | --- | --- |
| `accordion` | 3 `supported`<br>1 `partial`<br>1 `not-supported` | 3 `supported`<br>2 `not-applicable` | 1 `low` | 1 shared supported row. Starwind-specific or stronger: dynamic dom (Refresh items inserted, removed, disabled, or reordered after initialization); lifecycle (Duplicate initialization and explicit cleanup). Zag stronger: events (Change notifications and cancellation before uncontrolled state commits); keyboard (Arrow-key roving focus between triggers). |
| `checkbox` | 5 `supported` | 2 `supported`<br>2 `partial`<br>1 `not-supported` | None | 2 shared supported rows. Starwind-specific or stronger: forms (Native form participation, hidden inputs, form reset, and form ownership); events (Cancelable checked-change before uncontrolled state commits). |
| `checkbox-group` | 4 `supported` | 3 `partial`<br>1 `not-applicable` | None | Starwind-specific or stronger: state (Group value, controlled/programmatic updates, and child checkbox coordination); forms (Group-level names, selected child values, disabled group omission, and dynamic form behavior). Starwind exposes a group wrapper. Zag exposes individual checkbox machines; app code can coordinate them, but no dedicated checkbox-group machine is represented here. |
| `collapsible` | 5 `supported` | 3 `supported`<br>1 `partial`<br>1 `not-supported` | None | 3 shared supported rows. Starwind-specific or stronger: events (Cancelable open-change before uncontrolled state mutates); discovery (hidden-until-found and beforematch fragment reveal support). |
| `progress` | 3 `supported`<br>1 `partial` | 3 `supported`<br>1 `not-applicable` | 1 `medium` | 2 shared supported rows. Starwind-specific or stronger: dynamic dom (Update value, range, and explicit value text from DOM attributes after initialization). Zag stronger: anatomy (Linear and circular progress anatomy). |
| `switch` | 5 `supported` | 2 `supported`<br>2 `partial`<br>1 `not-supported` | None | 2 shared supported rows. Starwind-specific or stronger: forms (Native form participation, reset synchronization, and form-owner rebinding); events (Cancelable checked-change before uncontrolled state commits). |
| `toggle` | 4 `supported` | 2 `supported`<br>1 `partial`<br>1 `not-supported` | None | 2 shared supported rows. Starwind-specific or stronger: events (Cancelable pressed-change before state commits); coordination (Cross-instance sync groups and legacy change events). |
| `toggle-group` | 3 `supported`<br>1 `partial` | 2 `supported`<br>1 `partial`<br>1 `not-applicable` | 1 `low` | 1 shared supported row. Starwind-specific or stronger: events (Cancelable group and child toggle changes); dynamic dom (Refresh inserted, disabled, removed, and reordered toggles after initialization). Zag stronger: keyboard (Orientation-aware roving focus, Home/End, loop focus, and toolbar-aware behavior). |
| `combobox` | 5 `supported`<br>1 `not-supported` | 4 `supported`<br>2 `partial` | 1 `medium` | 3 shared supported rows. Starwind-specific or stronger: forms (Native form value, form accessibility props, reset, and form-owner changes); events (Reasoned open, value, and input-change details with cancellation). Zag stronger: selection (Multiple selection and custom selection behavior modes). |
| `input-otp` | 3 `supported`<br>1 `partial` | 3 `supported`<br>1 `partial` | 1 `medium` | 2 shared supported rows. Starwind-specific or stronger: events (Cancelable value changes for keyboard, paste, deletion, and direct input commits). Zag stronger: forms (Form metadata forwarding, hidden input, form reset, auto-submit, mask, and OTP autocomplete). Equivalent naming differs: Zag pin-input. |
| `radio` | 2 `supported` | 1 `supported`<br>1 `partial` | None | 1 shared supported row. Starwind-specific or stronger: state (Standalone checked/default/controlled radio state). Zag radio support is represented through radio-group. |
| `radio-group` | 3 `supported`<br>1 `partial` | 3 `supported`<br>1 `not-applicable` | 1 `low` | 2 shared supported rows. Starwind-specific or stronger: dynamic dom (Refresh inserted, removed, disabled, reordered, and native-button radios after initialization). Zag stronger: keyboard (Orientation-aware arrow-key navigation through enabled items). |
| `select` | 5 `supported`<br>1 `partial` | 3 `supported`<br>3 `partial` | 1 `medium` | 2 shared supported rows. Starwind-specific or stronger: forms (Hidden form value, required/invalid/read-only state, reset, and form-owner changes); events (Reasoned open/value details with cancellation before DOM mutation). Zag stronger: selection (Multiple selection, clearable values, item groups, and selected item objects). |
| `slider` | 4 `supported`<br>1 `partial` | 3 `supported`<br>2 `partial` | 1 `medium` | 2 shared supported rows. Starwind-specific or stronger: dynamic dom (Mutable range options and rendered thumb-count changes after initialization); events (Cancelable value change and separate value commit semantics). Zag stronger: range behavior (Min steps between thumbs and advanced thumb collision behavior). |
| `alert-dialog` | 3 `supported` | 2 `supported`<br>1 `partial` | None | 2 shared supported rows. Starwind-specific or stronger: dismissal (Nested topmost behavior, controlled state, close-complete events, and raw HTML init). Zag reuses dialog behavior for alert-dialog semantics. |
| `dialog` | 3 `supported`<br>1 `partial` | 2 `supported`<br>2 `partial` | 1 `low` | 1 shared supported row. Starwind-specific or stronger: dismissal (Escape, outside press, overlay click, nested topmost handling, and cancelable close intents); lifecycle (Close completion, exit animation cleanup, native dialog form submissions, and raw HTML init). Zag stronger: accessibility (ARIA wiring, modal behavior, focus trap, scroll lock, initial/final focus, and focus restoration). |
| `drawer` | 2 `supported`<br>1 `partial`<br>1 `not-supported` | 3 `supported`<br>1 `partial` | 1 `medium`<br>1 `low` | 1 shared supported row. Starwind-specific or stronger: events (Reasoned open changes, close completion, nested topmost behavior, and raw HTML init). Zag stronger: accessibility (Modal behavior, focus trap, scroll lock, role, initial/final focus, and restoration); motion (Swipe gestures, snap points, drawer stack metrics, and grabber/swipe area anatomy). |
| `popover` | 3 `supported`<br>1 `partial` | 3 `supported`<br>1 `partial` | 1 `low` | 2 shared supported rows. Starwind-specific or stronger: dismissal (Close buttons, outside interactions, Escape, nested popovers, and cancelable close intents). Zag stronger: focus (Focus restoration, initial/final focus, modal focus trap, and portalled tab behavior). |
| `preview-card` | 4 `supported` | 2 `supported`<br>2 `partial` | None | 2 shared supported rows. Starwind-specific or stronger: interactivity (Interactive hoverable content, disabled anchor trigger prevention, and focus-leave closing); events (Cancelable Escape and outside close intents). Equivalent naming differs: Zag hover-card. |
| `tooltip` | 4 `supported`<br>1 `partial` | 5 `supported` | 1 `low` | 4 shared supported rows. Zag stronger: dismissal (Escape, outside pointer interactions, pointer-down/click/scroll close options, and cancelable intents). |
| `context-menu` | 4 `supported` | 3 `supported`<br>1 `unknown` | 1 `low` | 3 shared supported rows. Unknown evidence remains for touch (Touch long-press opening with movement threshold and disabled-state cancellation). Zag models context-menu through the menu package. |
| `menu` | 5 `supported` | 4 `supported`<br>1 `partial` | None | 4 shared supported rows. Starwind-specific or stronger: events (Cancelable open changes, checkbox changes, radio value changes, and outside/Escape close requests). |
| `navigation-menu` | 6 `supported` | 4 `supported`<br>1 `partial`<br>1 `not-applicable` | None | 4 shared supported rows. Starwind-specific or stronger: keyboard (Orientation-aware trigger navigation, Enter/Space opening, content focus movement, Tab/Shift+Tab routing, and Escape restore); lifecycle (Nested navigation menu inertness and raw HTML auto-initialization). Added beyond the package-size seed because current Starwind Runtime and Zag both expose navigation-menu implementations. |
| `scroll-area` | 3 `supported`<br>1 `partial` | 3 `supported`<br>1 `not-applicable` | 1 `low` | 2 shared supported rows. Starwind-specific or stronger: dynamic dom (Discover scrollbars, thumbs, and corners added after initialization). Zag stronger: api (Programmatic scrollTo/scrollToEdge with easing and at-edge state APIs). |
| `tabs` | 4 `supported` | 2 `supported`<br>2 `partial` | None | 2 shared supported rows. Starwind-specific or stronger: events (Cancelable value changes plus non-cancelable fallback reasons); lifecycle (Nested tabs refresh, syncKey storage/broadcasting, orientation refresh, indicator CSS variables, and raw HTML init). |
| `avatar` | 4 `supported` | 2 `supported`<br>1 `partial`<br>1 `not-applicable` | None | 2 shared supported rows. Starwind-specific or stronger: fallback (Fallback delay, missing source handling, srcset-only images, and responsive source changes); lifecycle (Duplicate initialization, listener cleanup, and raw DOM mutation handling). |
| `carousel` | 3 `supported`<br>3 `partial` | 5 `supported`<br>1 `not-applicable` | 1 `medium`<br>2 `low` | 2 shared supported rows. Starwind-specific or stronger: dependency (Embla dependency, raw HTML auto-init opt out, and plugin escape hatches). Zag stronger: rich apis (Indicators, progress text, autoplay, drag status, slides per page, and slides per move); dynamic dom (Refresh after slide count, sizing, or option changes). |
| `dropzone` | 3 `supported`<br>2 `partial`<br>1 `not-supported` | 5 `supported`<br>1 `not-applicable` | 2 `medium`<br>1 `low` | 2 shared supported rows. Starwind-specific or stronger: lifecycle (Unmarked root discovery, data-attribute syncing, raw HTML auto-init, and destroy cleanup). Zag stronger: validation (Accept filtering, rejected files, max files, size limits, and custom validation); advanced sources (Directory uploads, camera capture, async transforms, clipboard files, and file URL creation). Equivalent naming differs: Zag file-upload. |
| `toast` | 6 `supported` | 4 `supported`<br>1 `not-applicable`<br>1 `unknown` | 1 `low` | 4 shared supported rows. Starwind-specific or stronger: templates (DOM template cloning, missing-template safety, variant rerenders, and duplicate module manager discovery). Unknown evidence remains for dismissal (Swipe dismissal, position-derived swipe direction, touch expansion, and swipe ignore targets). |

## Gap Backlog

Rows in this backlog are analysis follow-ups, not accepted implementation work. `high` means a user-facing correctness or accessibility gap should be triaged soon; `medium` means meaningful product capability; `low` means useful parity or polish.

### High Priority

_No current rows._

### Medium Priority

| Component | Product relevance | Feature | Starwind | Zag | Notes |
| --- | --- | --- | --- | --- | --- |
| `carousel` | Primitive API breadth | Indicators, progress text, autoplay, drag status, slides per page, and slides per move | `partial` | `supported` | Zag has first-party indicator props, progress helpers, autoplay APIs, drag status callbacks, slidesPerPage, and slidesPerMove. Starwind can pass Embla options and plugins, but the Runtime wrapper does not expose these as first-party data parts or callbacks. |
| `combobox` | Product capability or parity | Multiple selection and custom selection behavior modes | `not-supported` | `supported` | Current Starwind combobox evidence is single-value. Zag exposes multiple selection plus clear/replace/preserve selectionBehavior and allowCustomValue. |
| `drawer` | Product capability or parity | Swipe gestures, snap points, drawer stack metrics, and grabber/swipe area anatomy | `not-supported` | `supported` | This is a clear Zag advantage. Starwind's current drawer behaves like a drawer/sheet overlay without snap-point or swipe-stack machinery. |
| `dropzone` | User-facing accessibility or form correctness | Accept filtering, rejected files, max files, size limits, and custom validation | `partial` | `supported` | Starwind filters by native accept and multiple constraints. Zag also exposes rejectedFiles, min/max file size, maxFiles, custom validate, and onFileReject/onFileAccept callbacks. |
| `dropzone` | User-facing accessibility or form correctness | Labels, trigger/dropzone props, file item name/preview/size/delete props, and upload state text | `partial` | `supported` | Starwind sets button semantics, aria-disabled, upload/loading indicators, and visible file list state. Zag exposes label, trigger, dropzone, item, itemName, itemPreview, itemSizeText, itemDeleteTrigger, and translations APIs for a fuller file-upload anatomy surface. |
| `input-otp` | User-facing accessibility or form correctness | Form metadata forwarding, hidden input, form reset, auto-submit, mask, and OTP autocomplete | `partial` | `supported` | Starwind tests form-control ARIA metadata, hidden input, and reset. Zag also exposes otp autocomplete, autoSubmit, mask, blurOnComplete, and selectOnFocus options. |
| `progress` | Primitive API breadth | Linear and circular progress anatomy | `partial` | `supported` | Zag exposes circle, circle track, and circle range part props. Starwind's current Runtime evidence covers the linear/styled indicator path. |
| `select` | Product capability or parity | Multiple selection, clearable values, item groups, and selected item objects | `partial` | `supported` | Starwind supports a polished single-select path with clear/value text behavior. Zag exposes multiple selection, clearValue/selectAll, selectedItems, item groups, and hidden select props. |
| `slider` | Product capability or parity | Min steps between thumbs and advanced thumb collision behavior | `partial` | `supported` | Starwind enforces minStepsBetweenValues and no-crossing clamps. Zag also exposes thumbCollisionBehavior with none, push, and swap. |

### Low Priority

| Component | Product relevance | Feature | Starwind | Zag | Notes |
| --- | --- | --- | --- | --- | --- |
| `accordion` | Product capability or parity | Change notifications and cancellation before uncontrolled state commits | `partial` | `supported` | Both notify value changes. Starwind has root DOM events but accordion does not currently advertise the same cancel-before-commit coverage seen in checkbox, toggle, and collapsible tests. |
| `carousel` | Copied-component runtime robustness | Refresh after slide count, sizing, or option changes | `partial` | `supported` | Starwind exposes reInit and listens for Embla reInit events, but it does not auto-observe raw DOM slide insertions. Zag exposes refresh to recompute page snap points and clamp the page. |
| `carousel` | User-facing accessibility or form correctness | Carousel semantics, labels/translations, and dependency model | `partial` | `supported` | Starwind sets region and carousel roledescription while preserving caller-provided semantics, and intentionally delegates core scrolling to Embla. Zag exposes translations for carousel labels, indicators, autoplay, and progress text in its standalone machine API. |
| `context-menu` | Overlay or interaction polish | Touch long-press opening with movement threshold and disabled-state cancellation | `supported` | `unknown` | Starwind has direct long-press tests. The installed Zag type surface does not make touch long-press behavior obvious, so this remains unknown instead of a parity claim. |
| `dialog` | User-facing accessibility or form correctness | ARIA wiring, modal behavior, focus trap, scroll lock, initial/final focus, and focus restoration | `partial` | `supported` | Starwind tests ARIA wiring, focus trap, and scroll unlock cleanup. Zag exposes modal, trapFocus, preventScroll, initialFocusEl, finalFocusEl, restoreFocus, and hide-below behavior as public props. |
| `drawer` | User-facing accessibility or form correctness | Modal behavior, focus trap, scroll lock, role, initial/final focus, and restoration | `partial` | `supported` | Starwind tests dialog-like behavior and nested topmost inheritance. Zag exposes the full dialog-style focus/scroll options as drawer props. |
| `dropzone` | Product capability or parity | Directory uploads, camera capture, async transforms, clipboard files, and file URL creation | `not-supported` | `supported` | Zag exposes directory, capture, transformFiles, setClipboardFiles, and createFileUrl. Starwind's current runtime keeps to native input/drop selection plus rendered file names. |
| `popover` | Overlay or interaction polish | Focus restoration, initial/final focus, modal focus trap, and portalled tab behavior | `partial` | `supported` | Starwind tests focus restoration to active triggers and portaled movement. Zag exposes modal, portalled, autoFocus, initialFocusEl, finalFocusEl, and restoreFocus props. |
| `radio-group` | User-facing accessibility or form correctness | Orientation-aware arrow-key navigation through enabled items | `partial` | `supported` | Starwind tests arrow navigation, read-only skipping, RTL horizontal arrows, and intentionally ignores Home/End. Zag exposes orientation plus item focus/active/hover state. |
| `scroll-area` | Primitive API breadth | Programmatic scrollTo/scrollToEdge with easing and at-edge state APIs | `partial` | `supported` | Zag exposes explicit scrollTo, scrollToEdge, progress, and at-edge APIs. Starwind exposes DOM behavior and state attributes rather than the same high-level scroll API. |
| `toast` | Product capability or parity | Auto-dismiss durations, loading persistence, hover or focus pause, resume, and timer reset rules | `supported` | `supported` | Both support timed dismissal and pause/resume concepts. Starwind tests hover/focus expansion pausing, loading-to-settled timer behavior, duration updates, and untimed loading toasts. Zag additionally exposes explicit pause/resume store APIs and pauseOnPageIdle. |
| `toggle-group` | User-facing accessibility or form correctness | Orientation-aware roving focus, Home/End, loop focus, and toolbar-aware behavior | `partial` | `supported` | Both cover orientation and loop focus. Zag additionally exposes rovingFocus and toolbar-aware context in its type surface. |
| `tooltip` | User-facing accessibility or form correctness | Escape, outside pointer interactions, pointer-down/click/scroll close options, and cancelable intents | `partial` | `supported` | Starwind tests Escape, outside pointer interactions, per-instance dismissal, and cancellation. Zag additionally exposes closeOnPointerDown, closeOnClick, and closeOnScroll options. |


## Support Status

| Status | Meaning |
| --- | --- |
| `supported` | The feature is implemented for the compared component. |
| `partial` | Some meaningful support exists, but important behavior or API coverage is missing. |
| `not-supported` | The feature appears absent from the compared component. |
| `not-applicable` | The feature does not apply to that component or API shape. |
| `unknown` | Evidence is not strong enough yet. |

## Overlap Inventory

| Component | Zag package | Package-size seed | Issue slice | Notes |
| --- | --- | --- | --- | --- |
| `accordion` | `@zag-js/accordion` | Yes | Issue 02 |  |
| `checkbox` | `@zag-js/checkbox` | Yes | Issue 02 |  |
| `checkbox-group` | `@zag-js/checkbox` | Yes | Issue 02 | Starwind exposes a group wrapper. Zag exposes individual checkbox machines; app code can coordinate them, but no dedicated checkbox-group machine is represented here. |
| `collapsible` | `@zag-js/collapsible` | Yes | Issue 02 |  |
| `progress` | `@zag-js/progress` | Yes | Issue 02 |  |
| `switch` | `@zag-js/switch` | Yes | Issue 02 |  |
| `toggle` | `@zag-js/toggle` | Yes | Issue 02 |  |
| `toggle-group` | `@zag-js/toggle-group` | Yes | Issue 02 |  |
| `combobox` | `@zag-js/combobox` | Yes | Issue 03 |  |
| `input-otp` | `@zag-js/pin-input` | Yes | Issue 03 | Equivalent naming differs: Zag pin-input. |
| `radio` | `@zag-js/radio-group` | Yes | Issue 03 | Zag radio support is represented through radio-group. |
| `radio-group` | `@zag-js/radio-group` | Yes | Issue 03 |  |
| `select` | `@zag-js/select` | Yes | Issue 03 |  |
| `slider` | `@zag-js/slider` | Yes | Issue 03 |  |
| `alert-dialog` | `@zag-js/dialog` | Yes | Issue 04 | Zag reuses dialog behavior for alert-dialog semantics. |
| `dialog` | `@zag-js/dialog` | Yes | Issue 04 |  |
| `drawer` | `@zag-js/drawer` | Yes | Issue 04 |  |
| `popover` | `@zag-js/popover` | Yes | Issue 04 |  |
| `preview-card` | `@zag-js/hover-card` | Yes | Issue 04 | Equivalent naming differs: Zag hover-card. |
| `tooltip` | `@zag-js/tooltip` | Yes | Issue 04 |  |
| `context-menu` | `@zag-js/menu` | Yes | Issue 05 | Zag models context-menu through the menu package. |
| `menu` | `@zag-js/menu` | Yes | Issue 05 |  |
| `navigation-menu` | `@zag-js/navigation-menu` | No | Issue 05 | Added beyond the package-size seed because current Starwind Runtime and Zag both expose navigation-menu implementations. |
| `scroll-area` | `@zag-js/scroll-area` | Yes | Issue 05 |  |
| `tabs` | `@zag-js/tabs` | Yes | Issue 05 |  |
| `avatar` | `@zag-js/avatar` | Yes | Issue 06 |  |
| `carousel` | `@zag-js/carousel` | Yes | Issue 06 |  |
| `dropzone` | `@zag-js/file-upload` | Yes | Issue 06 | Equivalent naming differs: Zag file-upload. |
| `toast` | `@zag-js/toast` | Yes | Issue 06 |  |

## Runtime-Only Appendix

| Starwind component | Reason | Evidence |
| --- | --- | --- |
| `button` | Zag has no direct button machine. | `packages/runtime/src/components/button/` |
| `field` | Zag has no direct field machine. | `packages/runtime/src/components/field/` |
| `fieldset` | Zag has no direct fieldset machine. | `packages/runtime/src/components/fieldset/` |
| `form` | Zag has no direct form machine. | `packages/runtime/src/components/form/` |
| `input` | Zag has no direct input machine. | `packages/runtime/src/components/input/` |
| `sidebar` | Zag has no direct sidebar machine. | `packages/runtime/src/components/sidebar/` |

## Component Matrix

### Controls And Disclosure

#### accordion

Zag package: `@zag-js/accordion`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Single, multiple, collapsible, default, and controlled expanded values | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/accordion/accordion-state.test.ts`, `packages/runtime/src/components/accordion/accordion.browser.test.ts`<br>Zag: `@zag-js/accordion@1.42.0/dist/accordion.types.d.ts` | Both expose single/multiple and controlled/uncontrolled value models. Starwind owns DOM synchronization; Zag exposes machine context and setValue through connect. |
| Events | Change notifications and cancellation before uncontrolled state commits | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/accordion/accordion.browser.test.ts`<br>Zag: `@zag-js/accordion@1.42.0/dist/accordion.types.d.ts` | Both notify value changes. Starwind has root DOM events but accordion does not currently advertise the same cancel-before-commit coverage seen in checkbox, toggle, and collapsible tests. |
| Keyboard | Arrow-key roving focus between triggers | `not-supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/accordion/accordion.browser.test.ts`<br>Zag: `@zag-js/accordion@1.42.0/dist/accordion.types.d.ts` | Starwind intentionally leaves accordion arrow-key focus behavior to the browser. Zag tracks focused item value and orientation. |
| Dynamic DOM | Refresh items inserted, removed, disabled, or reordered after initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/accordion/accordion.browser.test.ts`<br>Zag: `@zag-js/accordion@1.42.0/dist/accordion.types.d.ts` | This is a Starwind DOM-controller concern. Zag receives item props during framework render rather than observing raw DOM after initialization. |
| Lifecycle | Duplicate initialization and explicit cleanup | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/accordion/accordion.browser.test.ts`<br>Zag: `@zag-js/core@1.42.0`, `@zag-js/accordion@1.42.0/dist/accordion.types.d.ts` | Starwind exposes raw HTML init/destroy semantics. Zag lifecycle is owned by framework adapter services. |

#### checkbox

Zag package: `@zag-js/checkbox`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Checked, unchecked, indeterminate, controlled, and uncontrolled state | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Both support boolean and indeterminate state plus imperative setters. |
| Forms | Native form participation, hidden inputs, form reset, and form ownership | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Zag exposes name, form, value, and hidden input props. Starwind also tests reset synchronization and form-owner changes after initialization. |
| Events | Cancelable checked-change before uncontrolled state commits | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Zag has onCheckedChange details. Starwind explicitly supports DOM-event cancellation before committing uncontrolled state. |
| Accessibility | Disabled, read-only, required, invalid, labels, and keyboard activation | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Both cover core checkbox accessibility props. Starwind additionally tests Enter submit behavior and Space toggle behavior. |
| Forms | Unchecked submitted fallback value | `supported` | `not-supported` | `none` | Starwind: `packages/runtime/src/components/checkbox/checkbox.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Starwind can submit an unchecked hidden value while unchecked. Zag exposes the checkbox input value but not a separate unchecked fallback in the public type surface. |

#### checkbox-group

Zag package: `@zag-js/checkbox`

Starwind exposes a group wrapper. Zag exposes individual checkbox machines; app code can coordinate them, but no dedicated checkbox-group machine is represented here.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Group value, controlled/programmatic updates, and child checkbox coordination | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/checkbox-group/checkbox-group.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Starwind has a first-party group controller. Zag exposes a checkbox machine, so app code can coordinate groups but there is no dedicated checkbox-group machine in the measured package set. |
| Forms | Group-level names, selected child values, disabled group omission, and dynamic form behavior | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/checkbox-group/checkbox-group.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Zag checkbox supports individual input name/form/value. Starwind adds explicit group-level submission behavior. |
| Events | Cancelable child and group value changes | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/checkbox-group/checkbox-group.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Starwind tests cancellation at child event, group event, and programmatic value paths. Zag provides individual checkbox callbacks. |
| Dynamic DOM | Refresh child checkboxes and prune removed values after initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/checkbox-group/checkbox-group.browser.test.ts`<br>Zag: `@zag-js/checkbox@1.42.0/dist/checkbox.types.d.ts` | Starwind observes copied DOM. Zag checkbox instances are rendered and coordinated by the application/framework. |

#### collapsible

Zag package: `@zag-js/collapsible`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Open/defaultOpen/controlled state, disabled state, and exit-complete lifecycle | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/collapsible/collapsible.browser.test.ts`<br>Zag: `@zag-js/collapsible@1.42.0/dist/collapsible.types.d.ts` | Both support controlled and uncontrolled open state, disabled triggers, and closing/exit lifecycle concepts. |
| Events | Cancelable open-change before uncontrolled state mutates | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/collapsible/collapsible.browser.test.ts`<br>Zag: `@zag-js/collapsible@1.42.0/dist/collapsible.types.d.ts` | Zag exposes onOpenChange details. Starwind tests preventDefault/cancel behavior before DOM mutation. |
| Accessibility | ARIA trigger/content wiring and asChild trigger resolution | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/collapsible/collapsible.browser.test.ts`<br>Zag: `@zag-js/collapsible@1.42.0/dist/collapsible.types.d.ts` | Both expose trigger/content part props or DOM wiring. Starwind specifically tests resolving nested asChild wrappers to the final control. |
| Discovery | hidden-until-found and beforematch fragment reveal support | `supported` | `not-supported` | `none` | Starwind: `packages/runtime/src/components/collapsible/collapsible.browser.test.ts`<br>Zag: `@zag-js/collapsible@1.42.0/dist/collapsible.types.d.ts` | Starwind has explicit beforematch coverage. Zag's public collapsible type surface does not expose hidden-until-found behavior. |
| Animation | Measured size variables and collapsed dimensions for animation | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/collapsible/collapsible.browser.test.ts`, `packages/runtime/src/components/collapsible/collapsible-panel.ts`<br>Zag: `@zag-js/collapsible@1.42.0/dist/collapsible.types.d.ts` | Starwind sets CSS variables for styled animations. Zag exposes collapsedHeight/collapsedWidth and measureSize. |

#### progress

Zag package: `@zag-js/progress`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Determinate, indeterminate, min, max, value, and imperative updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/progress/progress.browser.test.ts`<br>Zag: `@zag-js/progress@1.42.0/dist/progress.types.d.ts` | Both cover determinate and indeterminate progress plus imperative value updates. |
| Formatting | Localized value text and custom format options | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/progress/progress.browser.test.ts`<br>Zag: `@zag-js/progress@1.42.0/dist/progress.types.d.ts` | Both support custom/locale-aware value text. Starwind also preserves explicit authored value text. |
| Dynamic DOM | Update value, range, and explicit value text from DOM attributes after initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/progress/progress.browser.test.ts`, `packages/runtime/src/components/progress/progress.ts`<br>Zag: `@zag-js/progress@1.42.0/dist/progress.types.d.ts` | Starwind observes mutable progress DOM attributes such as value/range state and explicit value text. Zag's framework-facing API expects prop/context updates. |
| Anatomy | Linear and circular progress anatomy | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/progress/progress.browser.test.ts`<br>Zag: `@zag-js/progress@1.42.0/dist/progress.types.d.ts` | Zag exposes circle, circle track, and circle range part props. Starwind's current Runtime evidence covers the linear/styled indicator path. |

#### switch

Zag package: `@zag-js/switch`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Checked/defaultChecked/controlled state, disabled, read-only, required, and invalid | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/switch/switch.browser.test.ts`<br>Zag: `@zag-js/switch@1.42.0/dist/switch.types.d.ts` | Both expose the expected switch state and accessibility props. |
| Forms | Native form participation, reset synchronization, and form-owner rebinding | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/switch/switch.browser.test.ts`<br>Zag: `@zag-js/switch@1.42.0/dist/switch.types.d.ts` | Zag exposes name, form, value, and hidden input props. Starwind also tests reset synchronization and rebinding when form ownership changes. |
| Events | Cancelable checked-change before uncontrolled state commits | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/switch/switch.browser.test.ts`<br>Zag: `@zag-js/switch@1.42.0/dist/switch.types.d.ts` | Zag exposes onCheckedChange details. Starwind tests canceling uncontrolled checked changes. |
| Forms | Unchecked submitted fallback values for custom form semantics | `supported` | `not-supported` | `none` | Starwind: `packages/runtime/src/components/switch/switch.browser.test.ts`<br>Zag: `@zag-js/switch@1.42.0/dist/switch.types.d.ts` | Starwind tests unchecked hidden values and stale custom value cleanup. Zag's public type surface exposes the checked input value but not an unchecked fallback. |
| Accessibility | Visible-root labels and hidden-input id/name handling | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/switch/switch.browser.test.ts`<br>Zag: `@zag-js/switch@1.42.0/dist/switch.types.d.ts` | Both expose root, label, control/thumb, and hidden input anatomy. Starwind tests public id movement for non-native switches. |

#### toggle

Zag package: `@zag-js/toggle`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Pressed/defaultPressed/controlled state and disabled state | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/toggle/toggle.browser.test.ts`<br>Zag: `@zag-js/toggle@1.42.0/dist/toggle.types.d.ts` | Both support core toggle state and imperative setPressed. |
| Keyboard | Native and non-native button keyboard activation | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/toggle/toggle.browser.test.ts`<br>Zag: `@zag-js/toggle@1.42.0/dist/toggle.types.d.ts` | Starwind tests non-native button keyboard behavior. Zag root props are intended to provide button semantics through adapter normalization. |
| Events | Cancelable pressed-change before state commits | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/toggle/toggle.browser.test.ts`<br>Zag: `@zag-js/toggle@1.42.0/dist/toggle.types.d.ts` | Zag exposes onPressedChange. Starwind tests canceling pressed-change details before state mutation. |
| Coordination | Cross-instance sync groups and legacy change events | `supported` | `not-supported` | `none` | Starwind: `packages/runtime/src/components/toggle/toggle.browser.test.ts`<br>Zag: `@zag-js/toggle@1.42.0/dist/toggle.types.d.ts` | Starwind supports syncGroup behavior for copied DOM and legacy event compatibility. Zag's standalone toggle machine does not expose cross-instance sync. |

#### toggle-group

Zag package: `@zag-js/toggle-group`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Single, multiple, controlled, default, deselectable, and disabled values | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/toggle-group/toggle-group.browser.test.ts`<br>Zag: `@zag-js/toggle-group@1.42.0/dist/toggle-group.types.d.ts` | Both support single/multiple selection, controlled value, default value, disabled state, and deselectable single groups. |
| Keyboard | Orientation-aware roving focus, Home/End, loop focus, and toolbar-aware behavior | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/toggle-group/toggle-group.browser.test.ts`<br>Zag: `@zag-js/toggle-group@1.42.0/dist/toggle-group.types.d.ts` | Both cover orientation and loop focus. Zag additionally exposes rovingFocus and toolbar-aware context in its type surface. |
| Events | Cancelable group and child toggle changes | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/toggle-group/toggle-group.browser.test.ts`<br>Zag: `@zag-js/toggle-group@1.42.0/dist/toggle-group.types.d.ts` | Zag exposes onValueChange. Starwind tests canceling group value changes, child toggle cancellation, and DOM event preventDefault paths. |
| Dynamic DOM | Refresh inserted, disabled, removed, and reordered toggles after initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/toggle-group/toggle-group.browser.test.ts`<br>Zag: `@zag-js/toggle-group@1.42.0/dist/toggle-group.types.d.ts` | Starwind observes raw DOM changes. Zag derives item props during framework render. |

### Media File And Feedback

#### avatar

Zag package: `@zag-js/avatar`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Image loading, loaded, error, cached image, and missing-source states | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/avatar/avatar.browser.test.ts`, `packages/runtime/src/components/avatar/avatar.ts`<br>Zag: `@zag-js/avatar@1.42.0/dist/avatar.types.d.ts` | Both track image state and expose image/fallback parts. Starwind writes data-image-loading-status to the root, image, and fallback. Zag exposes loaded/error state and image/fallback part props. |
| Fallback | Fallback delay, missing source handling, srcset-only images, and responsive source changes | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/avatar/avatar.browser.test.ts`, `packages/runtime/src/components/avatar/avatar.ts`<br>Zag: `@zag-js/avatar@1.42.0/dist/avatar.types.d.ts` | Starwind tests delayed fallback timing, srcset-only loading, and delay restarts when src, srcset, or sizes-related image attributes change. Zag tracks source changes and exposes setSrc, but the installed public type surface does not expose fallback delay behavior. |
| Events | Initial and subsequent status notifications plus imperative status APIs | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/avatar/avatar.browser.test.ts`, `packages/runtime/src/components/avatar/avatar.ts`<br>Zag: `@zag-js/avatar@1.42.0/dist/avatar.types.d.ts` | Starwind exposes callback, DOM event, subscriber, refresh, and setImageLoadingStatus APIs. Zag exposes onStatusChange plus setSrc, setLoaded, and setError. |
| Lifecycle | Duplicate initialization, listener cleanup, and raw DOM mutation handling | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/avatar/avatar.browser.test.ts`, `packages/runtime/src/components/avatar/avatar.ts`<br>Zag: `@zag-js/avatar@1.42.0/dist/avatar.types.d.ts` | Starwind owns raw DOM initialization, mutation observation, timer cleanup, and destroy behavior. Zag lifecycle is mediated by the consuming framework adapter. |

#### carousel

Zag package: `@zag-js/carousel`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Slide selection, previous/next controls, disabled control state, and imperative scrolling | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/carousel/carousel.browser.test.ts`, `packages/runtime/src/components/carousel/carousel.ts`<br>Zag: `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts` | Starwind exposes selectedSnap, scrollNext, scrollPrev, scrollTo, canScrollNext, canScrollPrev, and setApi over Embla. Zag exposes page, scrollTo, scrollNext, scrollPrev, canScrollNext, canScrollPrev, and page-change callbacks. |
| Navigation | Horizontal and vertical orientation, keyboard navigation, and looping | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/carousel/carousel.browser.test.ts`, `packages/runtime/src/components/carousel/carousel.ts`<br>Zag: `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts` | Starwind maps orientation to Embla axis, handles orientation-specific arrow keys, and reads loop from data options. Zag exposes orientation, loop, and keyboardable page APIs. |
| Rich APIs | Indicators, progress text, autoplay, drag status, slides per page, and slides per move | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/carousel/carousel.browser.test.ts`, `packages/runtime/src/components/carousel/carousel.ts`<br>Zag: `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts` | Zag has first-party indicator props, progress helpers, autoplay APIs, drag status callbacks, slidesPerPage, and slidesPerMove. Starwind can pass Embla options and plugins, but the Runtime wrapper does not expose these as first-party data parts or callbacks. |
| Dynamic DOM | Refresh after slide count, sizing, or option changes | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/carousel/carousel.browser.test.ts`, `packages/runtime/src/components/carousel/carousel.ts`<br>Zag: `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts` | Starwind exposes reInit and listens for Embla reInit events, but it does not auto-observe raw DOM slide insertions. Zag exposes refresh to recompute page snap points and clamp the page. |
| Accessibility | Carousel semantics, labels/translations, and dependency model | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/carousel/carousel.browser.test.ts`, `packages/runtime/src/components/carousel/carousel.ts`<br>Zag: `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts` | Starwind sets region and carousel roledescription while preserving caller-provided semantics, and intentionally delegates core scrolling to Embla. Zag exposes translations for carousel labels, indicators, autoplay, and progress text in its standalone machine API. |
| Dependency | Embla dependency, raw HTML auto-init opt out, and plugin escape hatches | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/carousel/carousel.browser.test.ts`, `packages/runtime/src/components/carousel/carousel.ts`<br>Zag: `@zag-js/carousel@1.42.0/dist/carousel.types.d.ts` | Starwind's carousel is an Embla-backed adapter and tests plugin setup, cleanup, initStarwind auto-init, and opt-out for imperative plugin ownership. Zag's comparison surface is its own carousel state machine rather than an Embla adapter. |

#### dropzone

Zag package: `@zag-js/file-upload`

Equivalent naming differs: Zag file-upload.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Interaction | Drag active state, drop handling, keyboard activation, disabled state, and hidden input setup | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.ts`<br>Zag: `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts` | Both expose dropzone and hidden input behavior. Starwind tests dragenter, dragover, dragleave containment, drop, Enter and Space activation, disabled prevention, and label-owned input setup. |
| Files | Accepted files, multiple files, rendered file list, native input sync, and form reset clearing | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.ts`<br>Zag: `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts` | Starwind syncs dropped and selected files into the native input, renders file names, supports clearFiles/setFiles, and clears rendered/internal state after form reset. Zag exposes acceptedFiles, openFilePicker, deleteFile, setFiles, clearFiles, and item props. |
| Validation | Accept filtering, rejected files, max files, size limits, and custom validation | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.ts`<br>Zag: `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts` | Starwind filters by native accept and multiple constraints. Zag also exposes rejectedFiles, min/max file size, maxFiles, custom validate, and onFileReject/onFileAccept callbacks. |
| Advanced Sources | Directory uploads, camera capture, async transforms, clipboard files, and file URL creation | `not-supported` | `supported` | `low` | Starwind: `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.ts`<br>Zag: `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts` | Zag exposes directory, capture, transformFiles, setClipboardFiles, and createFileUrl. Starwind's current runtime keeps to native input/drop selection plus rendered file names. |
| Accessibility | Labels, trigger/dropzone props, file item name/preview/size/delete props, and upload state text | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.ts`<br>Zag: `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts` | Starwind sets button semantics, aria-disabled, upload/loading indicators, and visible file list state. Zag exposes label, trigger, dropzone, item, itemName, itemPreview, itemSizeText, itemDeleteTrigger, and translations APIs for a fuller file-upload anatomy surface. |
| Lifecycle | Unmarked root discovery, data-attribute syncing, raw HTML auto-init, and destroy cleanup | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/dropzone/dropzone.browser.test.ts`, `packages/runtime/src/components/dropzone/dropzone.ts`<br>Zag: `@zag-js/file-upload@1.42.0/dist/file-upload.types.d.ts` | Starwind tests discovery from an unmarked root, live disabled/uploading data attributes, initStarwind raw HTML initialization, and cleanup. Zag lifecycle is handled through framework render and machine service ownership. |

#### toast

Zag package: `@zag-js/toast`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| API | Create, update, dismiss, close all, variant shortcuts, promise toasts, and id-based updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/toast/toast.browser.test.ts`, `packages/runtime/src/components/toast/toast.ts`<br>Zag: `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Both expose programmatic toast stores with create/update/dismiss-style APIs, typed variants, loading and promise helpers, and id-based updates. Starwind additionally tests duplicate create calls with the same id as upserts and settled promise updates on the same visible toast. |
| Queue | Limit/max behavior, placement, stacking or overlap, inert hidden records, and live viewport option changes | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/toast/toast.browser.test.ts`, `packages/runtime/src/components/toast/toast.ts`<br>Zag: `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Starwind tests data-limit, data-position, inert over-limit toasts, height/offset updates, and live viewport mutations. Zag exposes placement, max, overlap, gap, offsets, expand, and collapse APIs. |
| Timers | Auto-dismiss durations, loading persistence, hover or focus pause, resume, and timer reset rules | `supported` | `supported` | `low` | Starwind: `packages/runtime/src/components/toast/toast.browser.test.ts`, `packages/runtime/src/components/toast/toast.ts`<br>Zag: `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Both support timed dismissal and pause/resume concepts. Starwind tests hover/focus expansion pausing, loading-to-settled timer behavior, duration updates, and untimed loading toasts. Zag additionally exposes explicit pause/resume store APIs and pauseOnPageIdle. |
| Accessibility | Live region, root labels/descriptions, title and description parts, action buttons, and close buttons | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/toast/toast.browser.test.ts`, `packages/runtime/src/components/toast/toast.ts`<br>Zag: `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Starwind tests viewport live-region defaults, generated aria-labelledby and aria-describedby, preservation of explicit ARIA, action callbacks, and close buttons. Zag exposes group/root/title/description/action/close props through its toast connect surface. |
| Dismissal | Swipe dismissal, position-derived swipe direction, touch expansion, and swipe ignore targets | `supported` | `unknown` | `none` | Starwind: `packages/runtime/src/components/toast/toast.browser.test.ts`, `packages/runtime/src/components/toast/toast.ts`<br>Zag: `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Starwind has direct pointer swipe behavior and tests live position changes affecting swipe direction. The installed Zag toast type surface does not make comparable swipe behavior obvious, so this remains unknown rather than a parity claim. |
| Templates | DOM template cloning, missing-template safety, variant rerenders, and duplicate module manager discovery | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/toast/toast.browser.test.ts`, `packages/runtime/src/components/toast/toast.ts`<br>Zag: `@zag-js/toast@1.42.0/dist/toast.types.d.ts` | Starwind copies styled DOM templates into the user's page and has specific tests for missing templates, variant rerenders, and duplicate module instances discovering the installed runtime manager. Zag exposes a store and machine API rather than Starwind's template cloning lifecycle. |

### Menus Navigation And Collections

#### context-menu

Zag package: `@zag-js/menu`

Zag models context-menu through the menu package.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Context Trigger | Right-click contextmenu opening at pointer position and native context-menu suppression | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/context-menu/context-menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Zag's menu package exposes contextTrigger props and anchorPoint. Starwind tests pointer-position opening and native menu suppression rules. |
| Context Trigger | Keyboard invocation through ContextMenu and Shift+F10 | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/context-menu/context-menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Both support context-trigger style access. Starwind tests ContextMenu and Shift+F10 keys. |
| Touch | Touch long-press opening with movement threshold and disabled-state cancellation | `supported` | `unknown` | `low` | Starwind: `packages/runtime/src/components/context-menu/context-menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Starwind has direct long-press tests. The installed Zag type surface does not make touch long-press behavior obvious, so this remains unknown instead of a parity claim. |
| Composition | Shared menu behavior for items, submenus, dismissal, and positioning | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/context-menu/context-menu.browser.test.ts`, `packages/runtime/src/components/menu/menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Both map context-menu behavior onto the general menu model. |

#### menu

Zag package: `@zag-js/menu`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Open/default/controlled state, trigger identity, close reasons, and close-complete lifecycle | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/menu/menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Both support open state, trigger identity, item selection, and positioning. Starwind tests controlled close reasons and close-complete preservation. |
| Keyboard | Keyboard navigation, typeahead, highlighted item tracking, disabled items, and focus restoration | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/menu/menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Both support highlighted item state, typeahead, loop focus options, disabled items, and trigger focus restoration. |
| Items | Regular, link, checkbox, radio, grouped, disabled, and close-on-select item behavior | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/menu/menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Both expose rich menu item semantics. Starwind tests checkbox/radio cancellation and disabled focusable items. |
| Submenus | Nested submenu registration, trigger items, keyboard open/close, and submenu positioning | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/menu/menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Both support parent/child menu relationships. Starwind tests keyboard submenu behavior and explicit bottom placement on submenus. |
| Events | Cancelable open changes, checkbox changes, radio value changes, and outside/Escape close requests | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/menu/menu.browser.test.ts`<br>Zag: `@zag-js/menu@1.42.0/dist/menu.types.d.ts` | Zag exposes callback details. Starwind tests cancelable DOM events for open, checkbox, and radio value paths. |

#### navigation-menu

Zag package: `@zag-js/navigation-menu`

Added beyond the package-size seed because current Starwind Runtime and Zag both expose navigation-menu implementations.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Comparability | Direct navigation-menu overlap | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/navigation-menu/navigation-menu.browser.test.ts`, `packages/runtime/src/init-starwind.ts`<br>Zag: `@zag-js/navigation-menu@1.42.0/dist/navigation-menu.types.d.ts` | This confirms navigation-menu as a true overlap beyond the package-size seed: both packages expose navigation menu state, items, triggers, content, viewport, orientation, and value APIs. |
| State | Controlled/default value, closed controlled state, link items, close-on-click, and cancelable value changes | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/navigation-menu/navigation-menu.browser.test.ts`<br>Zag: `@zag-js/navigation-menu@1.42.0/dist/navigation-menu.types.d.ts` | Both support value/defaultValue and item/link APIs. Starwind tests controlled null state, link-only items, close-on-click, and cancelable value changes. |
| Keyboard | Orientation-aware trigger navigation, Enter/Space opening, content focus movement, Tab/Shift+Tab routing, and Escape restore | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/navigation-menu/navigation-menu.browser.test.ts`<br>Zag: `@zag-js/navigation-menu@1.42.0/dist/navigation-menu.types.d.ts` | Zag exposes orientation and trigger/content APIs. Starwind has extensive browser coverage for trigger/content focus routing and Escape restoration. |
| Pointer | Hover delays, hover/click trigger controls, and pointer-leave close behavior | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/navigation-menu/navigation-menu.browser.test.ts`<br>Zag: `@zag-js/navigation-menu@1.42.0/dist/navigation-menu.types.d.ts` | Both expose open/close delay and hover/click trigger controls. Starwind additionally tests touch-hover suppression and trigger-level timing overrides. |
| Viewport | Viewport rendering, viewport node access, alignment, and repositioning | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/navigation-menu/navigation-menu.browser.test.ts`<br>Zag: `@zag-js/navigation-menu@1.42.0/dist/navigation-menu.types.d.ts` | Both expose viewport concepts and repositioning hooks. Starwind has especially deep tests for sizing, placement flips, visual viewport scroll, overflow measurement, and animated rectangle transitions. |
| Lifecycle | Nested navigation menu inertness and raw HTML auto-initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/navigation-menu/navigation-menu.browser.test.ts`<br>Zag: `@zag-js/navigation-menu@1.42.0/dist/navigation-menu.types.d.ts` | This is specific to Starwind's raw DOM initializer. Zag's framework adapter model does not auto-scan copied DOM roots. |

#### scroll-area

Zag package: `@zag-js/scroll-area`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Measurement | Vertical and horizontal overflow measurement, scrollbars, thumbs, corner, and CSS state | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/scroll-area/scroll-area.browser.test.ts`<br>Zag: `@zag-js/scroll-area@1.42.0/dist/scroll-area.types.d.ts` | Both support custom scrollbar anatomy and overflow state. Starwind tests mirrored state attributes and CSS variables. |
| Interaction | Thumb dragging, track pointer scrolling, hover state, wheel/scroll batching, and destroy cleanup | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/scroll-area/scroll-area.browser.test.ts`<br>Zag: `@zag-js/scroll-area@1.42.0/dist/scroll-area.types.d.ts` | Both support dragging and scroll state. Starwind tests track pointer scrolling and cancellation of pending work on destroy. |
| Dynamic DOM | Discover scrollbars, thumbs, and corners added after initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/scroll-area/scroll-area.browser.test.ts`<br>Zag: `@zag-js/scroll-area@1.42.0/dist/scroll-area.types.d.ts` | Starwind observes copied DOM parts after initialization. Zag's props are generated by framework render. |
| API | Programmatic scrollTo/scrollToEdge with easing and at-edge state APIs | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/scroll-area/scroll-area.browser.test.ts`, `packages/runtime/src/components/scroll-area/scroll-area.ts`<br>Zag: `@zag-js/scroll-area@1.42.0/dist/scroll-area.types.d.ts` | Zag exposes explicit scrollTo, scrollToEdge, progress, and at-edge APIs. Starwind exposes DOM behavior and state attributes rather than the same high-level scroll API. |

#### tabs

Zag package: `@zag-js/tabs`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Controlled/default selected value, fallback selection, disabled tabs, and imperative updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/tabs/tabs.browser.test.ts`<br>Zag: `@zag-js/tabs@1.42.0/dist/tabs.types.d.ts` | Both support controlled/default value, disabled triggers, and imperative value updates. Starwind tests fallback selection reasons. |
| Keyboard | Orientation-aware arrow navigation, manual and automatic activation, loop focus, and activation with Enter | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/tabs/tabs.browser.test.ts`<br>Zag: `@zag-js/tabs@1.42.0/dist/tabs.types.d.ts` | Both support orientation and activation mode. Zag exposes loopFocus; Starwind tests manual and automatic activation. |
| Events | Cancelable value changes plus non-cancelable fallback reasons | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/tabs/tabs.browser.test.ts`<br>Zag: `@zag-js/tabs@1.42.0/dist/tabs.types.d.ts` | Zag exposes onValueChange/onFocusChange callbacks. Starwind tests cancelable value changes and explicit non-cancelable fallback reasons. |
| Lifecycle | Nested tabs refresh, syncKey storage/broadcasting, orientation refresh, indicator CSS variables, and raw HTML init | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/tabs/tabs.browser.test.ts`<br>Zag: `@zag-js/tabs@1.42.0/dist/tabs.types.d.ts` | Zag exposes indicator and composite/navigate APIs. Starwind adds local syncKey persistence/broadcasting and DOM refresh behaviors. |

### Overlays And Floating UI

#### alert-dialog

Zag package: `@zag-js/dialog`

Zag reuses dialog behavior for alert-dialog semantics.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Alert Semantics | Alertdialog role, explicit close actions, and outside-close policy | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/alert-dialog/alert-dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Starwind alert-dialog requires explicit close by default and can opt into outside interaction closing. Zag dialog supports role='alertdialog' and closeOnInteractOutside configuration. |
| Triggers | External/asChild triggers and asChild close actions | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/alert-dialog/alert-dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Starwind tests external asChild triggers and close actions. Zag exposes trigger values and trigger/close-trigger prop getters. |
| Dismissal | Nested topmost behavior, controlled state, close-complete events, and raw HTML init | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/alert-dialog/alert-dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Starwind tests nested behavior inside dialogs, controlled mode, close completion, and initStarwind. Zag supplies the underlying dialog machine but not Starwind's DOM lifecycle event surface. |

#### dialog

Zag package: `@zag-js/dialog`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Controlled/default open state, triggers, close triggers, and imperative open/close | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/dialog/dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Both support controlled/default open state, trigger and close parts, and imperative open/close APIs. |
| Accessibility | ARIA wiring, modal behavior, focus trap, scroll lock, initial/final focus, and focus restoration | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/dialog/dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Starwind tests ARIA wiring, focus trap, and scroll unlock cleanup. Zag exposes modal, trapFocus, preventScroll, initialFocusEl, finalFocusEl, restoreFocus, and hide-below behavior as public props. |
| Dismissal | Escape, outside press, overlay click, nested topmost handling, and cancelable close intents | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/dialog/dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Zag exposes closeOnEscape, closeOnInteractOutside, and dismissable handlers. Starwind tests cancelable Escape/outside/overlay close intents and nested topmost routing. |
| Lifecycle | Close completion, exit animation cleanup, native dialog form submissions, and raw HTML init | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/dialog/dialog.browser.test.ts`<br>Zag: `@zag-js/dialog@1.42.0/dist/dialog.types.d.ts` | Starwind tests native dialog method=form close paths, close-complete details, and initStarwind raw HTML. Zag exposes visibility effects but not Starwind's native dialog form path. |

#### drawer

Zag package: `@zag-js/drawer`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Open/default/controlled state, trigger and close parts, outside and Escape closing | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/drawer/drawer.browser.test.ts`<br>Zag: `@zag-js/drawer@1.42.0/dist/drawer.types-CXoLNHl9.d.ts` | Both support dialog-like drawer state, triggers, close triggers, outside interaction, and Escape closing. |
| Accessibility | Modal behavior, focus trap, scroll lock, role, initial/final focus, and restoration | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/drawer/drawer.browser.test.ts`<br>Zag: `@zag-js/drawer@1.42.0/dist/drawer.types-CXoLNHl9.d.ts` | Starwind tests dialog-like behavior and nested topmost inheritance. Zag exposes the full dialog-style focus/scroll options as drawer props. |
| Motion | Swipe gestures, snap points, drawer stack metrics, and grabber/swipe area anatomy | `not-supported` | `supported` | `medium` | Starwind: `packages/runtime/src/components/drawer/drawer.ts`<br>Zag: `@zag-js/drawer@1.42.0/dist/drawer.types-CXoLNHl9.d.ts` | This is a clear Zag advantage. Starwind's current drawer behaves like a drawer/sheet overlay without snap-point or swipe-stack machinery. |
| Events | Reasoned open changes, close completion, nested topmost behavior, and raw HTML init | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/drawer/drawer.browser.test.ts`<br>Zag: `@zag-js/drawer@1.42.0/dist/drawer.types-CXoLNHl9.d.ts` | Starwind tests close button, Escape, programmatic reasons, close completion, nested topmost inheritance, and initStarwind. Zag exposes callbacks and stack APIs without Starwind's DOM event/cancel surface. |

#### popover

Zag package: `@zag-js/popover`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Controlled/default open state, active trigger identity, sibling trigger switching, and close triggers | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/popover/popover.browser.test.ts`<br>Zag: `@zag-js/popover@1.42.0/dist/popover.types.d.ts` | Both support controlled/default open state, trigger value, and close triggers. Starwind tests active-trigger switching while open. |
| Focus | Focus restoration, initial/final focus, modal focus trap, and portalled tab behavior | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/popover/popover.browser.test.ts`<br>Zag: `@zag-js/popover@1.42.0/dist/popover.types.d.ts` | Starwind tests focus restoration to active triggers and portaled movement. Zag exposes modal, portalled, autoFocus, initialFocusEl, finalFocusEl, and restoreFocus props. |
| Dismissal | Close buttons, outside interactions, Escape, nested popovers, and cancelable close intents | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/popover/popover.browser.test.ts`<br>Zag: `@zag-js/popover@1.42.0/dist/popover.types.d.ts` | Zag exposes closeOnEscape/interactOutside handlers. Starwind tests cancelable open/close intents, nested content containment, and closing child popovers with the parent. |
| Floating | Positioning, arrows, placement attributes, portals, and exit-animation mounting | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/popover/popover.browser.test.ts`<br>Zag: `@zag-js/popover@1.42.0/dist/popover.types.d.ts` | Both support positioning and arrows. Starwind tests primitive positioner placement precedence, portal movement, and keeping popups mounted through exit animation. |

#### preview-card

Zag package: `@zag-js/hover-card`

Equivalent naming differs: Zag hover-card.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Hover/focus open state, controlled/default open, delays, disabled triggers, and active trigger switching | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/preview-card/preview-card.browser.test.ts`<br>Zag: `@zag-js/hover-card@1.42.0/dist/hover-card.types.d.ts` | Both support delayed hover-card style opening and controlled open state. Starwind tests focus opening and active-trigger switching. |
| Interactivity | Interactive hoverable content, disabled anchor trigger prevention, and focus-leave closing | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/preview-card/preview-card.browser.test.ts`<br>Zag: `@zag-js/hover-card@1.42.0/dist/hover-card.types.d.ts` | Starwind tests interactive popup content, disabled anchor trigger activation prevention, and focus-leave closing. Zag exposes hover-card interactions and outside handlers but no explicit interactive-content prop in the type surface. |
| Floating | Positioning, arrows, placement fallback, primitive positioner precedence, and raw asChild triggers | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/preview-card/preview-card.browser.test.ts`<br>Zag: `@zag-js/hover-card@1.42.0/dist/hover-card.types.d.ts` | Both support positioning and arrows. Starwind tests placement fallback/precedence and raw asChild trigger attribute transfer. |
| Events | Cancelable Escape and outside close intents | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/preview-card/preview-card.browser.test.ts`<br>Zag: `@zag-js/hover-card@1.42.0/dist/hover-card.types.d.ts` | Zag exposes open-change callbacks. Starwind tests cancelable focus, Escape, and outside close intents. |

#### tooltip

Zag package: `@zag-js/tooltip`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Hover/focus open state, controlled/default open, delays, disabled state, and trigger identity | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/tooltip/tooltip.browser.test.ts`<br>Zag: `@zag-js/tooltip@1.42.0/dist/tooltip.types.d.ts` | Both support tooltip open state, delays, disabled state, positioning, and trigger value. |
| Hoverability | Hoverable/interactive content behavior across trigger, popup, arrows, and missing relatedTarget | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/tooltip/tooltip.browser.test.ts`<br>Zag: `@zag-js/tooltip@1.42.0/dist/tooltip.types.d.ts` | Zag exposes interactive tooltip mode. Starwind has detailed browser coverage for hoverable content and edge cases around arrows and relatedTarget. |
| Dismissal | Escape, outside pointer interactions, pointer-down/click/scroll close options, and cancelable intents | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/tooltip/tooltip.browser.test.ts`<br>Zag: `@zag-js/tooltip@1.42.0/dist/tooltip.types.d.ts` | Starwind tests Escape, outside pointer interactions, per-instance dismissal, and cancellation. Zag additionally exposes closeOnPointerDown, closeOnClick, and closeOnScroll options. |
| Accessibility | ARIA description wiring, keyboard-origin focus, asChild trigger resolution, and non-interactive tooltip content | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/tooltip/tooltip.browser.test.ts`<br>Zag: `@zag-js/tooltip@1.42.0/dist/tooltip.types.d.ts` | Starwind tests ARIA wiring, pointer-induced focus suppression, keyboard focus, asChild trigger resolution, and warnings for interactive descendants in tooltip content. |
| Floating | Positioning, arrows, primitive positioner placement attributes, and raw HTML init | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/tooltip/tooltip.browser.test.ts`<br>Zag: `@zag-js/tooltip@1.42.0/dist/tooltip.types.d.ts` | Both support positioning and arrows. Starwind tests primitive placement attributes, nested Astro asChild controls, and initStarwind raw HTML. |

### Selection And Form Inputs

#### combobox

Zag package: `@zag-js/combobox`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Open, selected value, input value, highlighted item, and controlled state | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/combobox/combobox.browser.test.ts`<br>Zag: `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts` | Both support open/value/highlight/input state. Starwind exposes cancelable DOM details; Zag exposes machine context, callbacks, and API setters. |
| Collections | Filtering, disabled items, active item identity, and dynamic option updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/combobox/combobox.browser.test.ts`<br>Zag: `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts` | Starwind tests filtered collection refresh, same-task additions, and active item identity. Zag exposes a ListCollection, highlighted item state, item state getters, and syncSelectedItems for async value sources. |
| Selection | Multiple selection and custom selection behavior modes | `not-supported` | `supported` | `medium` | Starwind: `packages/runtime/src/components/combobox/combobox.ts`<br>Zag: `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts` | Current Starwind combobox evidence is single-value. Zag exposes multiple selection plus clear/replace/preserve selectionBehavior and allowCustomValue. |
| Forms | Native form value, form accessibility props, reset, and form-owner changes | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/combobox/combobox.browser.test.ts`<br>Zag: `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts` | Zag exposes name/form and input props. Starwind additionally tests form reset restoration and moving reset listeners when form ownership changes. |
| Events | Reasoned open, value, and input-change details with cancellation | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/combobox/combobox.ts`, `packages/runtime/src/components/combobox/combobox.browser.test.ts`<br>Zag: `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts` | Zag exposes reasoned open/input details. Starwind also lets listeners cancel open, value, and input changes before side effects commit. |
| Floating | Positioning, outside dismissal, Escape handling, and topmost-layer behavior | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/combobox/combobox.browser.test.ts`<br>Zag: `@zag-js/combobox@1.42.0/dist/combobox.types.d.ts` | Both support positioning and outside interaction handlers. Starwind tests topmost Escape ownership and global listener cleanup. |

#### input-otp

Zag package: `@zag-js/pin-input`

Equivalent naming differs: Zag pin-input.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Slot values, controlled/default value, completion state, and imperative updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/input-otp/input-otp.browser.test.ts`<br>Zag: `@zag-js/pin-input@1.42.0/dist/pin-input.types.d.ts` | Both support value arrays/strings, hidden input form value, and imperative value updates. |
| Input Behavior | Keyboard entry, deletion, arrow navigation, paste filtering, pattern/type validation | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/input-otp/input-otp.browser.test.ts`, `packages/runtime/src/components/input-otp/input-otp.ts`<br>Zag: `@zag-js/pin-input@1.42.0/dist/pin-input.types.d.ts` | Starwind tests filtered keyboard input, paste, deletion, and direct input changes. Zag exposes type, pattern, sanitizeValue, and invalid-value callbacks. |
| Events | Cancelable value changes for keyboard, paste, deletion, and direct input commits | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/input-otp/input-otp.browser.test.ts`<br>Zag: `@zag-js/pin-input@1.42.0/dist/pin-input.types.d.ts` | Zag exposes value change, complete, and invalid callbacks. Starwind explicitly tests cancellation for multiple commit reasons. |
| Forms | Form metadata forwarding, hidden input, form reset, auto-submit, mask, and OTP autocomplete | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/input-otp/input-otp.browser.test.ts`<br>Zag: `@zag-js/pin-input@1.42.0/dist/pin-input.types.d.ts` | Starwind tests form-control ARIA metadata, hidden input, and reset. Zag also exposes otp autocomplete, autoSubmit, mask, blurOnComplete, and selectOnFocus options. |

#### radio

Zag package: `@zag-js/radio-group`

Zag radio support is represented through radio-group.

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Standalone checked/default/controlled radio state | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/radio/radio.browser.test.ts`<br>Zag: `@zag-js/radio-group@1.42.0/dist/radio-group.types.d.ts` | Starwind exposes a standalone radio controller. Zag's measured overlap models radio items through the radio-group machine. |
| Forms | Hidden radio input semantics, labels, required/read-only/disabled state, and cleanup | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/radio/radio.browser.test.ts`<br>Zag: `@zag-js/radio-group@1.42.0/dist/radio-group.types.d.ts` | Both support hidden item inputs through their respective anatomy. Starwind tests standalone runtime-owned native button inputs and cleanup. |

#### radio-group

Zag package: `@zag-js/radio-group`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Group value, default/controlled state, disabled/required/invalid/read-only state | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/radio-group/radio-group.browser.test.ts`<br>Zag: `@zag-js/radio-group@1.42.0/dist/radio-group.types.d.ts` | Both expose the expected group value and item state model. |
| Keyboard | Orientation-aware arrow-key navigation through enabled items | `partial` | `supported` | `low` | Starwind: `packages/runtime/src/components/radio-group/radio-group.browser.test.ts`<br>Zag: `@zag-js/radio-group@1.42.0/dist/radio-group.types.d.ts` | Starwind tests arrow navigation, read-only skipping, RTL horizontal arrows, and intentionally ignores Home/End. Zag exposes orientation plus item focus/active/hover state. |
| Forms | Selected form value, child input naming, form option propagation, and live option updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/radio-group/radio-group.browser.test.ts`<br>Zag: `@zag-js/radio-group@1.42.0/dist/radio-group.types.d.ts` | Both support hidden inputs and group name/form props. Starwind additionally tests live updates to form/orientation/required/read-only options. |
| Dynamic DOM | Refresh inserted, removed, disabled, reordered, and native-button radios after initialization | `supported` | `not-applicable` | `none` | Starwind: `packages/runtime/src/components/radio-group/radio-group.browser.test.ts`<br>Zag: `@zag-js/radio-group@1.42.0/dist/radio-group.types.d.ts` | Starwind observes copied DOM after initialization. Zag derives item props from application render state. |

#### select

Zag package: `@zag-js/select`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Open, selected value, highlighted item, controlled state, and imperative setters | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/select/select.browser.test.ts`<br>Zag: `@zag-js/select@1.42.0/dist/select.types.d.ts` | Both support open/value/highlight state and imperative updates. |
| Collections | Typeahead, disabled items, active item identity, and dynamic option updates | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/select/select.browser.test.ts`<br>Zag: `@zag-js/select@1.42.0/dist/select.types.d.ts` | Starwind tests item collection refresh, active item identity, same-task additions, disabled-item navigation, and typeahead. Zag exposes ListCollection, item state, typeahead state, and highlighted item APIs. |
| Selection | Multiple selection, clearable values, item groups, and selected item objects | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/select/select.ts`<br>Zag: `@zag-js/select@1.42.0/dist/select.types.d.ts` | Starwind supports a polished single-select path with clear/value text behavior. Zag exposes multiple selection, clearValue/selectAll, selectedItems, item groups, and hidden select props. |
| Forms | Hidden form value, required/invalid/read-only state, reset, and form-owner changes | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/select/select.browser.test.ts`<br>Zag: `@zag-js/select@1.42.0/dist/select.types.d.ts` | Zag exposes hidden select props with name/form/autocomplete. Starwind also tests reset listener movement and read-only prevention in copied DOM. |
| Events | Reasoned open/value details with cancellation before DOM mutation | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/select/select.ts`, `packages/runtime/src/components/select/select.browser.test.ts`<br>Zag: `@zag-js/select@1.42.0/dist/select.types.d.ts` | Zag exposes open/value/highlight callbacks. Starwind's open/value details include cancel/isCanceled and are dispatched as cancelable DOM events. |
| Floating | Positioning, selected-item alignment, scroll arrows, outside dismissal, and topmost Escape | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/select/select.browser.test.ts`<br>Zag: `@zag-js/select@1.42.0/dist/select.types.d.ts` | Zag exposes positioning and scrollToIndex hooks. Starwind tests selected item alignment, scroll arrows, dismissal, and topmost Escape restoration. |

#### slider

Zag package: `@zag-js/slider`

| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| State | Single and range values, controlled updates, min/max/step, orientation, and form inputs | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/slider/slider.browser.test.ts`<br>Zag: `@zag-js/slider@1.42.0/dist/slider.types.d.ts` | Both expose single/range values, hidden inputs, labels, min/max/step, orientation, and imperative setters. |
| Keyboard And Pointer | Keyboard increments, pointer dragging, pointer cancel, and value commit events | `supported` | `supported` | `none` | Starwind: `packages/runtime/src/components/slider/slider.browser.test.ts`<br>Zag: `@zag-js/slider@1.42.0/dist/slider.types.d.ts` | Both support keyboard and pointer value changes. Starwind tests pointercancel behavior and cancelable value-change details. |
| Range Behavior | Min steps between thumbs and advanced thumb collision behavior | `partial` | `supported` | `medium` | Starwind: `packages/runtime/src/components/slider/slider.browser.test.ts`<br>Zag: `@zag-js/slider@1.42.0/dist/slider.types.d.ts` | Starwind enforces minStepsBetweenValues and no-crossing clamps. Zag also exposes thumbCollisionBehavior with none, push, and swap. |
| Dynamic DOM | Mutable range options and rendered thumb-count changes after initialization | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/slider/slider.browser.test.ts`<br>Zag: `@zag-js/slider@1.42.0/dist/slider.types.d.ts` | Starwind tests mutable range options and thumb count refresh in copied DOM. Zag supports prop/context updates through framework render, not raw DOM observation. |
| Events | Cancelable value change and separate value commit semantics | `supported` | `partial` | `none` | Starwind: `packages/runtime/src/components/slider/slider.browser.test.ts`<br>Zag: `@zag-js/slider@1.42.0/dist/slider.types.d.ts` | Zag exposes onValueChange and onValueChangeEnd. Starwind tests cancelable value-change details and commit behavior. |

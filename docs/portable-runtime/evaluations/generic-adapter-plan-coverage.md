# Generic Adapter Plan Coverage

This report is generated from `scripts/portable-runtime/renderers/generic-adapter-plan/classification.ts` plus non-shipping tracer entries from `scripts/portable-runtime/renderers/generic-adapter-plan/future-framework-tracer-printers.ts`, and pinned by `scripts/portable-runtime/tests/generic-adapter-plan.test.ts`.

It tracks which Runtime adapter contracts are already generated through the Generic Adapter Plan path, which ones use a typed Adapter Family Plan, which ones use a component-specific Specialized Adapter Spec, which ones still require a manual island escape hatch, and which future-framework fixtures are non-shipping tracers.

## Summary

| Classification                                           | Count |
| -------------------------------------------------------- | ----: |
| Adapter Family Plan (`adapter-family-plan`)              |    19 |
| Specialized Adapter Spec (`specialized-adapter-spec`)    |    16 |
| Manual Island Escape Hatch (`custom-island`)             |     0 |
| Future Framework Tracer-Only (`future-framework-tracer`) |    15 |
| Total primitive contracts                                |    35 |

## Notes

- `toggle`, `switch`, `checkbox`, `radio`, `toggle-group`, `checkbox-group`, `radio-group`, `collapsible`, and `form` moved from later Adapter Family Plan candidates in the evaluation recommendation to implemented Adapter Family Plan entries.
- `carousel` moved to Specialized Adapter Spec after the Carousel Specialized Adapter Spec migration preserved Astro and React output parity.
- `toast` moved to Specialized Adapter Spec after the Toast Specialized Adapter Spec migration preserved Astro and React output parity, including the public `toast` API/type exports.
- All manual island escape hatches from the former manual-island completion queue have migrated to Specialized Adapter Specs for Astro and React. Current overlay boundaries are enforced by contract-summary and generated-output tests.
- Future framework tracer fixtures are intentionally non-shipping and must not imply package exports, CLI registry entries, or demo dependencies.
- Svelte tracer fixtures remain deferred until its action/component setup model is decided.

## Adapter Family Plan Components

- `button` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `toggle` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `fieldset` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `form` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `input` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `switch` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `checkbox` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `radio` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `collapsible` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `toggle-group` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `radio-group` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `checkbox-group` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `avatar` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `progress` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `scroll-area` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `popover` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `dialog` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `alert-dialog` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.
- `drawer` - Generated through a typed Adapter Family Plan while preserving existing Astro and React output.

## Specialized Adapter Spec Components

- `carousel` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `field` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `slider` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `tabs` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `accordion` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `input-otp` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `tooltip` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `preview-card` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `dropzone` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `menu` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `navigation-menu` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `context-menu` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `select` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `sidebar` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `combobox` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.
- `toast` - Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.

## Manual Island Escape Hatches

- None.

## Future Framework Tracer-Only Fixtures

- `button/vue` - Non-shipping Vue SFC tracer fixture for the Button generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.
- `toggle/vue` - Non-shipping Vue SFC tracer fixture for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.
- `collapsible/vue` - Non-shipping Vue SFC tracer fixture for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.
- `checkbox/vue` - Non-shipping Vue SFC tracer fixture for the Checkbox boolean form-control Adapter Family Plan; not included in package exports, CLI registry output, or demo dependencies.
- `select/vue` - Non-shipping Vue SFC tracer fixture for the Select Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `menu/vue` - Non-shipping Vue SFC tracer fixture for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `navigation-menu/vue` - Non-shipping Vue SFC tracer fixture for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `combobox/vue` - Non-shipping Vue SFC tracer fixture for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `button/solid` - Non-shipping Solid TSX tracer fixture for the Button generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.
- `toggle/solid` - Non-shipping Solid TSX tracer fixture for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.
- `collapsible/solid` - Non-shipping Solid TSX tracer fixture for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.
- `select/solid` - Non-shipping Solid TSX tracer fixture for the Select Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `menu/solid` - Non-shipping Solid TSX tracer fixture for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `navigation-menu/solid` - Non-shipping Solid TSX tracer fixture for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.
- `combobox/solid` - Non-shipping Solid TSX tracer fixture for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.

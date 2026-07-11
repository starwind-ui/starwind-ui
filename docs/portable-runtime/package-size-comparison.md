# Package Size Comparison

Generated: 2026-07-11

## Method

- Bundle rows are built with esbuild, minified, and gzipped with Node zlib level 9.
- Bundle rows use the generated entry chunk and static import graph; dynamic import chunks are excluded from current min+gzip rows because they remain lazy-loaded.
- Package dependencies are bundled; framework peers such as React, Vue, Solid, Svelte, Astro, date-fns, and type packages are externalized.
- Starwind local rows use the current workspace build output in `packages/*/dist`.
- Zag and Base UI rows use current npm packages installed into a temporary measurement project under the operating system's temporary directory.
- The Zag all-components aggregate follows the current component list in the Zag docs sidebar; duplicate examples such as nested/context menu, circular progress, segmented control, and range slider share their underlying package.
- Source-contribution rows use esbuild metafile `bytesInOutput` from selected Starwind measurement rows. They are minified byte-attribution diagnostics before gzip, not public package-size comparison rows.
- `@starwind-ui/astro` is source-published Astro/TS, so it appears in the source-payload table instead of the JS bundle-entry table.

Regenerate with:

```bash
pnpm runtime:size
```

## Budget Checks

`pnpm runtime:size` fails when any row in this section fails. Rows outside this section are context-only measurements.

### Headline Package Budgets

| Row | Current min+gzip | Budget | Status |
| --- | ---: | ---: | --- |
| `@starwind-ui/runtime` | 110.4 KiB | 112.0 KiB | Pass |
| `@starwind-ui/react (adapter only)` | 30.4 KiB | 31.0 KiB | Pass |
| `@starwind-ui/react + runtime` | 142.8 KiB | 145.0 KiB | Pass |

### Field Cold-Import Budget

| Row | Current min+gzip | Budget | Status |
| --- | ---: | ---: | --- |
| Field cold import | 8.4 KiB | 22.0 KiB | Pass |

### Matched-Support Budgets

| Check | Starwind min+gzip | Comparator | Comparator min+gzip | Budget | Gate | Comparison |
| --- | ---: | --- | ---: | ---: | --- | --- |
| All-three overlap vs Zag React | 101.9 KiB | Zag React | 97.5 KiB | 105.0 KiB | Pass | Above comparator |
| All-three overlap vs Base UI | 101.9 KiB | Base UI | 139.8 KiB | 105.0 KiB | Pass | Below comparator |
| Starwind/Zag overlap vs Zag React | 113.8 KiB | Zag React | 109.7 KiB | 115.0 KiB | Pass | Above comparator |
| Starwind/Base UI overlap vs Base UI | 109.7 KiB | Base UI | 143.4 KiB | 115.0 KiB | Pass | Below comparator |

## At A Glance

Use this table for the headline ordering. `Minified + gzip` is the closest column to the advertised browser download size.

| Rank | Scenario | Minified + gzip | Minified | Meaning |
| ---: | --- | ---: | ---: | --- |
| 1 | `Zag React adapter + all documented component machines` | 238.5 KiB | 839.1 KiB | React adapter plus every package from Zag's documented component list, bundled once. |
| 2 | `@base-ui/react` | 160.1 KiB | 488.7 KiB | All Base UI React public root exports. |
| 3 | `@starwind-ui/react + runtime` | 142.8 KiB | 580.0 KiB | All Starwind React public root exports with the runtime bundled. |
| 4 | `@starwind-ui/runtime` | 110.4 KiB | 461.0 KiB | Runtime package alone, without the React adapter. |
| 5 | `@starwind-ui/react (adapter only)` | 30.4 KiB | 125.4 KiB | React adapter overhead with runtime externalized. |
| 6 | `@zag-js/react` | 4.0 KiB | 9.9 KiB | Zag React framework adapter only, without any machines. |

## Starwind-Matched Support

These rows compare only the Starwind React components that have a comparable primitive in the other package. This is the better table for apples-to-apples sizing.

| Comparison set | Starwind components | Starwind min+gzip | Zag React min+gzip | Base UI min+gzip | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| All-three overlap | 26 | 101.9 KiB | 97.5 KiB | 139.8 KiB | Only Starwind components with both a Zag and Base UI equivalent. |
| Starwind/Zag overlap | 28 | 113.8 KiB | 109.7 KiB | N/A | Only Starwind components with a Zag equivalent. |
| Starwind/Base UI overlap | 29 | 109.7 KiB | N/A | 143.4 KiB | Only Starwind components with a Base UI equivalent. |

## Raw Gzip Diagnostics

These exact gzip byte counts are the decision source for the reopened Combobox/Menu overlap optimization. Use the rounded KiB tables for public-facing comparison copy, but use this section for before/after migration gates.

| Gate row | Scope | Raw gzip bytes | Rounded min+gzip | Notes |
| --- | --- | ---: | ---: | --- |
| All-three overlap - Starwind combined | combined support set | 104392 B | 101.9 KiB | Primary continuation gate. |
| Isolated Starwind Select | isolated component | 22907 B | 22.4 KiB | Existing tracer cold-import guard. |
| Isolated Starwind Combobox | isolated component | 22928 B | 22.4 KiB | Combobox migration cold-import guard. |
| Isolated Starwind Menu | isolated component | 19715 B | 19.3 KiB | Menu migration cold-import guard. |
| Isolated Starwind Context Menu | isolated component | 20288 B | 19.8 KiB | Menu-family regression guard. |

Tradeoff gate:

- Future Combobox/Menu migrations should compare raw gzip bytes against this section, not only the rounded one-decimal KiB report values.
- A slight isolated Combobox or Menu increase is acceptable only when `All-three overlap - Starwind combined` raw gzip bytes decrease and the isolated component remains clearly below the comparable Zag React and Base UI rows.
- Any isolated Combobox or Menu increase of 1.0 KiB min+gzip or more is a `ready-for-human` decision unless the all-three overlap reduction is larger and explicitly justified.
- Source-owner byte relocation alone does not count as a product size win.

## Isolated vs Combined Support Costs

This table explains why isolated component rows can look very different from matched-support aggregate rows. `Isolated per-component sum` adds each one-component measurement together, so shared runtime, adapter, and infrastructure code is counted repeatedly. `One combined bundle` imports the same support set once and lets esbuild dedupe shared code, which is closer to a real app using many primitives.

| Comparison set | Library | Components | Isolated per-component sum | One combined bundle | Shared-code savings | Combined avg/component |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| All-three overlap | Starwind | 26 | 224.6 KiB | 101.9 KiB | 122.7 KiB (54.6%) | 3.9 KiB |
| All-three overlap | Zag React | 26 | 371.8 KiB | 97.5 KiB | 274.3 KiB (73.8%) | 3.8 KiB |
| All-three overlap | Base UI | 26 | 517.6 KiB | 139.8 KiB | 377.8 KiB (73.0%) | 5.4 KiB |
| Starwind/Zag overlap | Starwind | 28 | 238.7 KiB | 113.8 KiB | 124.9 KiB (52.3%) | 4.1 KiB |
| Starwind/Zag overlap | Zag React | 28 | 396.0 KiB | 109.7 KiB | 286.3 KiB (72.3%) | 3.9 KiB |
| Starwind/Base UI overlap | Starwind | 29 | 236.6 KiB | 109.7 KiB | 126.9 KiB (53.6%) | 3.8 KiB |
| Starwind/Base UI overlap | Base UI | 29 | 539.0 KiB | 143.4 KiB | 395.6 KiB (73.4%) | 4.9 KiB |

## Starwind Source Contribution Analysis

This architecture-only section identifies which Starwind source categories contribute most to selected measured bundles. Use it to guide Runtime module-deepening work; use the matched-support tables above for public package comparisons.

### All-three overlap - Starwind

This section is architecture analysis, not an apples-to-apples public marketing table. It uses esbuild metafile `bytesInOutput`, which are minified byte contributions before gzip.

| Components | Combined min+gzip | Isolated per-component sum | Shared-code savings | Interpretation |
| ---: | ---: | ---: | ---: | --- |
| 26 | 101.9 KiB | 224.6 KiB | 122.7 KiB (54.6%) | Use both columns: lower combined size is good, but higher savings can also come from higher isolated imports. |

| Category | Minified bytes in output | Share |
| --- | ---: | ---: |
| Runtime | 299.8 KiB | 71.7% |
| React adapter | 102.8 KiB | 24.6% |
| Third-party | 15.4 KiB | 3.7% |
| Other | 91 B | 0.0% |

| Rank | Category | Source owner | Minified bytes in output |
| ---: | --- | --- | ---: |
| 1 | Runtime | `src/components/select/select.ts` | 30.4 KiB |
| 2 | Runtime | `src/components/combobox/combobox.ts` | 28.4 KiB |
| 3 | Runtime | `src/components/menu/menu.ts` | 28.0 KiB |
| 4 | Runtime | `src/components/slider/slider.ts` | 19.3 KiB |
| 5 | Runtime | `src/components/toast/toast.ts` | 15.0 KiB |
| 6 | React adapter | `src/combobox/ComboboxClear.tsx` | 13.7 KiB |
| 7 | Runtime | `src/components/popover/popover.ts` | 13.1 KiB |
| 8 | Runtime | `src/components/scroll-area/scroll-area.ts` | 12.8 KiB |
| 9 | Runtime | `src/components/input-otp/input-otp.ts` | 11.9 KiB |
| 10 | Runtime | `src/components/tabs/tabs.ts` | 11.5 KiB |
| 11 | Runtime | `src/components/tooltip/tooltip.ts` | 11.4 KiB |
| 12 | Runtime | `src/components/dialog/dialog.ts` | 10.9 KiB |

### Field cold import - Starwind

This section is architecture analysis, not an apples-to-apples public marketing table. It uses esbuild metafile `bytesInOutput`, which are minified byte contributions before gzip.

| Components | Combined min+gzip | Isolated per-component sum | Shared-code savings | Interpretation |
| ---: | ---: | ---: | ---: | --- |
| 1 | 8.4 KiB | 8.4 KiB | 0 B (0.0%) | Cold import baseline for Field; lowering this can be a win even if aggregate savings percentage falls. |

| Category | Minified bytes in output | Share |
| --- | ---: | ---: |
| Runtime | 25.7 KiB | 85.4% |
| React adapter | 4.4 KiB | 14.6% |
| Other | 16 B | 0.1% |

| Rank | Category | Source owner | Minified bytes in output |
| ---: | --- | --- | ---: |
| 1 | Runtime | `src/components/field/field.ts` | 16.2 KiB |
| 2 | Runtime | `src/components/field/field-control-bridge.ts` | 4.5 KiB |
| 3 | Runtime | `src/components/input/input.ts` | 3.5 KiB |
| 4 | React adapter | `src/field/FieldControl.tsx` | 2.6 KiB |
| 5 | Runtime | `src/internal/dom.ts` | 1.5 KiB |
| 6 | React adapter | `src/input/InputRoot.tsx` | 1.4 KiB |
| 7 | React adapter | `src/internal/compose-refs.ts` | 243 B |
| 8 | React adapter | `packages/react/dist/field/index.js` | 182 B |

## Starwind Component Matches

| Starwind component | Zag equivalent | Base UI equivalent | Starwind min+gzip | Zag min+gzip | Base UI min+gzip | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `accordion` | `@zag-js/accordion` | `@base-ui/react/accordion` | 3.8 KiB | 6.5 KiB | 8.9 KiB |  |
| `alert-dialog` | `@zag-js/dialog` | `@base-ui/react/alert-dialog` | 6.3 KiB | 16.1 KiB | 22.4 KiB | Zag reuses its dialog machine for alert-dialog behavior. |
| `avatar` | `@zag-js/avatar` | `@base-ui/react/avatar` | 2.2 KiB | 5.6 KiB | 4.0 KiB |  |
| `button` | N/A | `@base-ui/react/button` | 1.5 KiB | N/A | 3.0 KiB | Base UI has a button primitive; Zag has no button machine. |
| `carousel` | `@zag-js/carousel` | N/A | 9.4 KiB | 12.6 KiB | N/A | No Base UI carousel export. |
| `checkbox` | `@zag-js/checkbox` | `@base-ui/react/checkbox` | 5.9 KiB | 8.2 KiB | 7.9 KiB |  |
| `checkbox-group` | `@zag-js/checkbox` | `@base-ui/react/checkbox-group` | 6.8 KiB | 8.2 KiB | 4.0 KiB | Starwind and Base UI expose a group wrapper; Zag uses the checkbox machine. |
| `collapsible` | `@zag-js/collapsible` | `@base-ui/react/collapsible` | 4.2 KiB | 7.5 KiB | 7.1 KiB |  |
| `combobox` | `@zag-js/combobox` | `@base-ui/react/combobox` | 22.4 KiB | 29.3 KiB | 49.0 KiB |  |
| `context-menu` | `@zag-js/menu` | `@base-ui/react/context-menu` | 19.8 KiB | 28.3 KiB | 50.8 KiB | Zag models context-menu through the menu package. |
| `dialog` | `@zag-js/dialog` | `@base-ui/react/dialog` | 5.8 KiB | 16.1 KiB | 22.5 KiB |  |
| `drawer` | `@zag-js/drawer` | `@base-ui/react/drawer` | 6.3 KiB | 25.5 KiB | 37.2 KiB |  |
| `dropzone` | `@zag-js/file-upload` | N/A | 4.7 KiB | 11.5 KiB | N/A | Maps to Zag file-upload; no Base UI file upload/dropzone export. |
| `field` | N/A | `@base-ui/react/field` | 8.4 KiB | N/A | 9.2 KiB | Base UI has field primitives; Zag has no field machine. |
| `input` | N/A | `@base-ui/react/input` | 2.0 KiB | N/A | 9.2 KiB | Base UI has input primitives; Zag has no input machine. |
| `input-otp` | `@zag-js/pin-input` | `@base-ui/react/otp-field` | 5.8 KiB | 9.0 KiB | 8.5 KiB | Equivalent naming differs: Zag pin-input, Base UI otp-field. |
| `menu` | `@zag-js/menu` | `@base-ui/react/menu` | 19.3 KiB | 28.3 KiB | 50.0 KiB |  |
| `popover` | `@zag-js/popover` | `@base-ui/react/popover` | 15.1 KiB | 26.4 KiB | 39.8 KiB |  |
| `preview-card` | `@zag-js/hover-card` | `@base-ui/react/preview-card` | 13.8 KiB | 20.2 KiB | 32.3 KiB | Equivalent naming differs: Zag hover-card. |
| `progress` | `@zag-js/progress` | `@base-ui/react/progress` | 2.7 KiB | 6.4 KiB | 3.3 KiB |  |
| `radio` | `@zag-js/radio-group` | `@base-ui/react/radio` | 5.2 KiB | 8.9 KiB | 7.8 KiB | Zag's radio support is represented through radio-group. |
| `radio-group` | `@zag-js/radio-group` | `@base-ui/react/radio-group` | 7.5 KiB | 8.9 KiB | 7.0 KiB |  |
| `scroll-area` | `@zag-js/scroll-area` | `@base-ui/react/scroll-area` | 4.6 KiB | 10.4 KiB | 8.0 KiB |  |
| `select` | `@zag-js/select` | `@base-ui/react/select` | 22.4 KiB | 28.6 KiB | 43.9 KiB |  |
| `slider` | `@zag-js/slider` | `@base-ui/react/slider` | 7.8 KiB | 12.7 KiB | 14.6 KiB |  |
| `switch` | `@zag-js/switch` | `@base-ui/react/switch` | 5.1 KiB | 8.2 KiB | 6.1 KiB |  |
| `tabs` | `@zag-js/tabs` | `@base-ui/react/tabs` | 4.8 KiB | 9.4 KiB | 12.8 KiB |  |
| `toast` | `@zag-js/toast` | `@base-ui/react/toast` | 5.6 KiB | 12.2 KiB | 26.1 KiB |  |
| `toggle` | `@zag-js/toggle` | `@base-ui/react/toggle` | 2.9 KiB | 4.9 KiB | 4.8 KiB |  |
| `toggle-group` | `@zag-js/toggle-group` | `@base-ui/react/toggle-group` | 4.7 KiB | 7.4 KiB | 5.7 KiB |  |
| `tooltip` | `@zag-js/tooltip` | `@base-ui/react/tooltip` | 14.1 KiB | 18.5 KiB | 33.4 KiB |  |

## Bundle Entry Sizes

| Group | Package / scenario | Version | Minified | Minified + gzip | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Starwind | `@starwind-ui/runtime` | local | 461.0 KiB | 110.4 KiB |  |
| Starwind | `@starwind-ui/react (adapter only)` | local | 125.4 KiB | 30.4 KiB | Runtime externalized to isolate React adapter overhead. |
| Starwind | `@starwind-ui/react + runtime` | local | 580.0 KiB | 142.8 KiB | Consumer-style bundle with runtime dependency included and React peers excluded. |
| Base UI | `@base-ui/react` | 1.6.0 | 488.7 KiB | 160.1 KiB | Root public exports, used as the all-Base-UI comparison row. |
| Aggregate | `Zag React adapter + all documented component machines` | 1.42.0 | 839.1 KiB | 238.5 KiB | React adapter plus every package from Zag's documented component list, bundled together to avoid double-counting shared code. |
| Aggregate | `@zag-js/vue adapter + all documented component machines` | 1.42.0 | 838.9 KiB | 238.4 KiB | Framework adapter plus every package from Zag's documented component list, bundled together to avoid double-counting shared code. |
| Aggregate | `@zag-js/solid adapter + all documented component machines` | 1.42.0 | 841.0 KiB | 239.2 KiB | Framework adapter plus every package from Zag's documented component list, bundled together to avoid double-counting shared code. |
| Aggregate | `@zag-js/svelte adapter + all documented component machines` | 1.42.0 | 839.7 KiB | 238.7 KiB | Framework adapter plus every package from Zag's documented component list, bundled together to avoid double-counting shared code. |
| Base UI component sample | `@base-ui/react/accordion` | 1.6.0 | 23.5 KiB | 8.9 KiB |  |
| Base UI component sample | `@base-ui/react/dialog` | 1.6.0 | 66.1 KiB | 22.5 KiB |  |
| Base UI component sample | `@base-ui/react/menu` | 1.6.0 | 145.5 KiB | 50.0 KiB |  |
| Base UI component sample | `@base-ui/react/select` | 1.6.0 | 123.2 KiB | 43.9 KiB |  |
| Base UI component sample | `@base-ui/react/combobox` | 1.6.0 | 139.9 KiB | 49.0 KiB |  |
| Zag framework adapter | `@zag-js/react` | 1.42.0 | 9.9 KiB | 4.0 KiB |  |
| Zag framework adapter | `@zag-js/vue` | 1.42.0 | 10.3 KiB | 4.2 KiB |  |
| Zag framework adapter | `@zag-js/solid` | 1.42.0 | 12.5 KiB | 5.0 KiB |  |
| Zag framework adapter | `@zag-js/svelte` | 1.42.0 | 11.1 KiB | 4.5 KiB |  |
| Zag infrastructure | `@zag-js/core` | 1.42.0 | 5.4 KiB | 2.3 KiB |  |
| Zag machine | `@zag-js/accordion` | 1.42.0 | 8.1 KiB | 3.1 KiB |  |
| Zag machine | `@zag-js/angle-slider` | 1.42.0 | 12.4 KiB | 5.0 KiB |  |
| Zag machine | `@zag-js/avatar` | 1.42.0 | 5.2 KiB | 2.2 KiB |  |
| Zag machine | `@zag-js/carousel` | 1.42.0 | 27.4 KiB | 9.4 KiB |  |
| Zag machine | `@zag-js/cascade-select` | 1.42.0 | 87.7 KiB | 27.7 KiB |  |
| Zag machine | `@zag-js/checkbox` | 1.42.0 | 13.0 KiB | 5.0 KiB |  |
| Zag machine | `@zag-js/clipboard` | 1.42.0 | 7.2 KiB | 3.0 KiB |  |
| Zag machine | `@zag-js/collapsible` | 1.42.0 | 10.9 KiB | 4.2 KiB |  |
| Zag machine | `@zag-js/color-picker` | 1.42.0 | 90.0 KiB | 28.8 KiB |  |
| Zag machine | `@zag-js/combobox` | 1.42.0 | 82.6 KiB | 26.3 KiB |  |
| Zag machine | `@zag-js/date-input` | 1.42.0 | 52.1 KiB | 17.0 KiB |  |
| Zag machine | `@zag-js/date-picker` | 1.42.0 | 113.2 KiB | 35.8 KiB |  |
| Zag machine | `@zag-js/dialog` | 1.42.0 | 40.4 KiB | 13.3 KiB |  |
| Zag machine | `@zag-js/drawer` | 1.42.0 | 72.3 KiB | 22.6 KiB |  |
| Zag machine | `@zag-js/editable` | 1.42.0 | 16.8 KiB | 6.2 KiB |  |
| Zag machine | `@zag-js/file-upload` | 1.42.0 | 21.6 KiB | 8.3 KiB |  |
| Zag machine | `@zag-js/floating-panel` | 1.42.0 | 31.2 KiB | 11.0 KiB |  |
| Zag machine | `@zag-js/hover-card` | 1.42.0 | 48.3 KiB | 17.2 KiB |  |
| Zag machine | `@zag-js/image-cropper` | 1.42.0 | 33.0 KiB | 11.2 KiB |  |
| Zag machine | `@zag-js/listbox` | 1.42.0 | 36.2 KiB | 11.2 KiB |  |
| Zag machine | `@zag-js/marquee` | 1.42.0 | 8.2 KiB | 3.3 KiB |  |
| Zag machine | `@zag-js/menu` | 1.42.0 | 78.0 KiB | 25.7 KiB |  |
| Zag machine | `@zag-js/navigation-menu` | 1.42.0 | 32.9 KiB | 11.1 KiB |  |
| Zag machine | `@zag-js/number-input` | 1.42.0 | 32.8 KiB | 10.8 KiB |  |
| Zag machine | `@zag-js/pagination` | 1.42.0 | 9.0 KiB | 3.3 KiB |  |
| Zag machine | `@zag-js/password-input` | 1.42.0 | 5.1 KiB | 2.2 KiB |  |
| Zag machine | `@zag-js/pin-input` | 1.42.0 | 15.8 KiB | 5.8 KiB |  |
| Zag machine | `@zag-js/popover` | 1.42.0 | 68.8 KiB | 23.5 KiB |  |
| Zag machine | `@zag-js/presence` | 1.42.0 | 5.7 KiB | 2.2 KiB |  |
| Zag machine | `@zag-js/progress` | 1.42.0 | 7.3 KiB | 3.0 KiB |  |
| Zag machine | `@zag-js/qr-code` | 1.42.0 | 16.0 KiB | 6.6 KiB |  |
| Zag machine | `@zag-js/radio-group` | 1.42.0 | 15.6 KiB | 5.7 KiB |  |
| Zag machine | `@zag-js/rating-group` | 1.42.0 | 11.4 KiB | 4.5 KiB |  |
| Zag machine | `@zag-js/scroll-area` | 1.42.0 | 21.2 KiB | 7.4 KiB |  |
| Zag machine | `@zag-js/select` | 1.42.0 | 78.9 KiB | 25.6 KiB |  |
| Zag machine | `@zag-js/signature-pad` | 1.42.0 | 15.5 KiB | 6.5 KiB |  |
| Zag machine | `@zag-js/slider` | 1.42.0 | 26.7 KiB | 9.5 KiB |  |
| Zag machine | `@zag-js/splitter` | 1.42.0 | 36.4 KiB | 12.6 KiB |  |
| Zag machine | `@zag-js/steps` | 1.42.0 | 8.0 KiB | 3.1 KiB |  |
| Zag machine | `@zag-js/switch` | 1.42.0 | 12.9 KiB | 5.0 KiB |  |
| Zag machine | `@zag-js/tabs` | 1.42.0 | 16.4 KiB | 6.2 KiB |  |
| Zag machine | `@zag-js/tags-input` | 1.42.0 | 33.2 KiB | 11.0 KiB |  |
| Zag machine | `@zag-js/timer` | 1.42.0 | 10.2 KiB | 4.0 KiB |  |
| Zag machine | `@zag-js/toast` | 1.42.0 | 26.2 KiB | 9.2 KiB |  |
| Zag machine | `@zag-js/toggle` | 1.42.0 | 3.0 KiB | 1.4 KiB |  |
| Zag machine | `@zag-js/toggle-group` | 1.42.0 | 10.3 KiB | 4.1 KiB |  |
| Zag machine | `@zag-js/tooltip` | 1.42.0 | 43.9 KiB | 15.5 KiB |  |
| Zag machine | `@zag-js/tour` | 1.42.0 | 72.5 KiB | 24.3 KiB |  |
| Zag machine | `@zag-js/tree-view` | 1.42.0 | 40.3 KiB | 11.7 KiB |  |
| Zag adapter + machine sample | `@zag-js/react + accordion` | 1.42.0 | 17.1 KiB | 6.5 KiB |  |
| Zag adapter + machine sample | `@zag-js/vue + accordion` | 1.42.0 | 17.5 KiB | 6.7 KiB |  |
| Zag adapter + machine sample | `@zag-js/solid + accordion` | 1.42.0 | 19.7 KiB | 7.5 KiB |  |
| Zag adapter + machine sample | `@zag-js/svelte + accordion` | 1.42.0 | 18.3 KiB | 7.0 KiB |  |
| Zag adapter + machine sample | `@zag-js/react + dialog` | 1.42.0 | 48.3 KiB | 16.1 KiB |  |
| Zag adapter + machine sample | `@zag-js/vue + dialog` | 1.42.0 | 48.7 KiB | 16.4 KiB |  |
| Zag adapter + machine sample | `@zag-js/solid + dialog` | 1.42.0 | 50.9 KiB | 17.1 KiB |  |
| Zag adapter + machine sample | `@zag-js/svelte + dialog` | 1.42.0 | 49.5 KiB | 16.6 KiB |  |
| Zag adapter + machine sample | `@zag-js/react + menu` | 1.42.0 | 85.2 KiB | 28.3 KiB |  |
| Zag adapter + machine sample | `@zag-js/vue + menu` | 1.42.0 | 85.0 KiB | 28.3 KiB |  |
| Zag adapter + machine sample | `@zag-js/solid + menu` | 1.42.0 | 87.1 KiB | 29.1 KiB |  |
| Zag adapter + machine sample | `@zag-js/svelte + menu` | 1.42.0 | 85.8 KiB | 28.6 KiB |  |
| Zag adapter + machine sample | `@zag-js/react + select` | 1.42.0 | 86.8 KiB | 28.6 KiB |  |
| Zag adapter + machine sample | `@zag-js/vue + select` | 1.42.0 | 86.6 KiB | 28.6 KiB |  |
| Zag adapter + machine sample | `@zag-js/solid + select` | 1.42.0 | 88.7 KiB | 29.4 KiB |  |
| Zag adapter + machine sample | `@zag-js/svelte + select` | 1.42.0 | 87.4 KiB | 28.9 KiB |  |
| Zag adapter + machine sample | `@zag-js/react + combobox` | 1.42.0 | 90.5 KiB | 29.3 KiB |  |
| Zag adapter + machine sample | `@zag-js/vue + combobox` | 1.42.0 | 90.3 KiB | 29.3 KiB |  |
| Zag adapter + machine sample | `@zag-js/solid + combobox` | 1.42.0 | 92.4 KiB | 30.1 KiB |  |
| Zag adapter + machine sample | `@zag-js/svelte + combobox` | 1.42.0 | 91.1 KiB | 29.6 KiB |  |

## Starwind Published Source Payloads

These rows measure the published package's own runtime-bearing source files after minification. They are useful for `@starwind-ui/astro`, whose package ships `.astro` source files rather than a JS bundle entry.

| Package | Version | Minified source payload | Minified + gzip | npm tarball gzip | npm unpacked | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `@starwind-ui/astro` | 0.1.0-beta.1 | 167.3 KiB | 17.8 KiB | 26.7 KiB | 197.9 KiB | Source-published Astro package; measured published .astro/.ts source payload, not compiled Astro output. |
| `@starwind-ui/runtime` | 0.1.0-beta.1 | 456.6 KiB | 102.6 KiB | 155.9 KiB | 861.0 KiB |  |
| `@starwind-ui/react` | 0.1.0-beta.1 | 161.9 KiB | 37.7 KiB | 62.2 KiB | 481.1 KiB |  |

## Reading The Numbers

- Use `@starwind-ui/react (adapter only)` when you want to isolate framework-wrapper overhead.
- Use `@starwind-ui/react + runtime` when you want the likely consumer cost of importing the React adapter package root.
- Use `Starwind-Matched Support` when you want a fair support-surface comparison rather than a whole-catalog comparison.
- Use `Isolated vs Combined Support Costs` when you need to explain why one-component import rows should not be added together as an app-size estimate.
- Use `Starwind Source Contribution Analysis` when you need internal architecture diagnostics for Starwind Runtime and adapter work. Do not use it as a competitor source-attribution claim.
- Zag's framework adapters are separate from component machines, so adapter-only rows are not complete component costs.
- The Zag adapter + machine samples show the shape of a real single-component import for each framework adapter.
- Base UI is React-only and ships one large tree-shakeable package; component sample rows are better comparisons to Zag's per-machine rows than the Base UI root row.

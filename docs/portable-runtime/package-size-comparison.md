# Package Size Comparison

Generated: 2026-07-23

## Method

- Bundle rows are built with esbuild, minified, and gzipped with Node zlib level 9.
- Bundle rows use the generated entry chunk and static import graph; dynamic import chunks are excluded from current min+gzip rows because they remain lazy-loaded.
- Package dependencies are bundled; framework peers such as React, Vue, Solid, Svelte, Astro, date-fns, and type packages are externalized.
- Starwind local rows use the current workspace build output in `packages/*/dist`.
- Zag and Base UI rows use current npm packages installed into a temporary measurement project under the operating system's temporary directory.
- The Zag all-components aggregate follows the current component list in the Zag docs sidebar; duplicate examples such as nested/context menu, circular progress, segmented control, and range slider share their underlying package.
- `@starwind-ui/astro` is source-published Astro/TS, so it appears in the source-payload table instead of the JS bundle-entry table.

Regenerate with:

```bash
pnpm runtime:size
```


## At A Glance

Use this table for the headline ordering. `Minified + gzip` is the closest column to the advertised browser download size.

| Rank | Scenario | Minified + gzip | Minified | Meaning |
| ---: | --- | ---: | ---: | --- |
| 1 | `Zag React adapter + all documented component machines` | 238.5 KiB | 839.0 KiB | React adapter plus every package from Zag's documented component list, bundled once. |
| 2 | `@starwind-ui/react + runtime` | 166.8 KiB | 673.0 KiB | All Starwind React public root exports with the runtime bundled. |
| 3 | `@base-ui/react` | 160.1 KiB | 488.6 KiB | All Base UI React public root exports. |
| 4 | `@starwind-ui/runtime` | 129.4 KiB | 538.7 KiB | Runtime package alone, without the React adapter. |
| 5 | `@starwind-ui/react (adapter only)` | 34.7 KiB | 141.4 KiB | React adapter overhead with runtime externalized. |
| 6 | `@zag-js/react` | 4.0 KiB | 9.9 KiB | Zag React framework adapter only, without any machines. |


## Starwind-Matched Support

These rows compare only the Starwind React components that have a comparable primitive in the other package. This is the better table for apples-to-apples sizing.

| Comparison set | Starwind components | Starwind min+gzip | Zag React min+gzip | Base UI min+gzip | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| All-three overlap | 26 | 107.0 KiB | 97.5 KiB | 139.8 KiB | Only Starwind components with both a Zag and Base UI equivalent. |
| Starwind/Zag overlap | 28 | 118.8 KiB | 109.7 KiB | N/A | Only Starwind components with a Zag equivalent. |
| Starwind/Base UI overlap | 29 | 114.7 KiB | N/A | 143.4 KiB | Only Starwind components with a Base UI equivalent. |


## Isolated vs Combined Support Costs

This table explains why isolated component rows can look very different from matched-support aggregate rows. `Isolated per-component sum` adds each one-component measurement together, so shared runtime, adapter, and infrastructure code is counted repeatedly. `One combined bundle` imports the same support set once and lets esbuild dedupe shared code, which is closer to a real app using many primitives.

| Comparison set | Library | Components | Isolated per-component sum | One combined bundle | Shared-code savings | Combined avg/component |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| All-three overlap | Starwind | 26 | 251.8 KiB | 107.0 KiB | 144.8 KiB (57.5%) | 4.1 KiB |
| All-three overlap | Zag React | 26 | 371.8 KiB | 97.5 KiB | 274.3 KiB (73.8%) | 3.8 KiB |
| All-three overlap | Base UI | 26 | 517.5 KiB | 139.8 KiB | 377.7 KiB (73.0%) | 5.4 KiB |
| Starwind/Zag overlap | Starwind | 28 | 266.8 KiB | 118.8 KiB | 148.0 KiB (55.5%) | 4.2 KiB |
| Starwind/Zag overlap | Zag React | 28 | 395.9 KiB | 109.7 KiB | 286.3 KiB (72.3%) | 3.9 KiB |
| Starwind/Base UI overlap | Starwind | 29 | 264.8 KiB | 114.7 KiB | 150.1 KiB (56.7%) | 4.0 KiB |
| Starwind/Base UI overlap | Base UI | 29 | 538.8 KiB | 143.4 KiB | 395.4 KiB (73.4%) | 4.9 KiB |


## Starwind Component Matches

| Starwind component | Zag equivalent | Base UI equivalent | Starwind min+gzip | Zag min+gzip | Base UI min+gzip | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `accordion` | `@zag-js/accordion` | `@base-ui/react/accordion` | 3.9 KiB | 6.5 KiB | 8.9 KiB |  |
| `alert-dialog` | `@zag-js/dialog` | `@base-ui/react/alert-dialog` | 7.7 KiB | 16.1 KiB | 22.4 KiB | Zag reuses its dialog machine for alert-dialog behavior. |
| `avatar` | `@zag-js/avatar` | `@base-ui/react/avatar` | 2.2 KiB | 5.6 KiB | 4.0 KiB |  |
| `button` | N/A | `@base-ui/react/button` | 1.3 KiB | N/A | 3.0 KiB | Base UI has a button primitive; Zag has no button machine. |
| `carousel` | `@zag-js/carousel` | N/A | 9.4 KiB | 12.6 KiB | N/A | No Base UI carousel export. |
| `checkbox` | `@zag-js/checkbox` | `@base-ui/react/checkbox` | 7.1 KiB | 8.2 KiB | 7.9 KiB |  |
| `checkbox-group` | `@zag-js/checkbox` | `@base-ui/react/checkbox-group` | 7.9 KiB | 8.2 KiB | 4.0 KiB | Starwind and Base UI expose a group wrapper; Zag uses the checkbox machine. |
| `collapsible` | `@zag-js/collapsible` | `@base-ui/react/collapsible` | 4.2 KiB | 7.5 KiB | 7.1 KiB |  |
| `combobox` | `@zag-js/combobox` | `@base-ui/react/combobox` | 25.3 KiB | 29.3 KiB | 49.0 KiB |  |
| `context-menu` | `@zag-js/menu` | `@base-ui/react/context-menu` | 21.6 KiB | 28.3 KiB | 50.7 KiB | Zag models context-menu through the menu package. |
| `dialog` | `@zag-js/dialog` | `@base-ui/react/dialog` | 7.2 KiB | 16.1 KiB | 22.5 KiB |  |
| `drawer` | `@zag-js/drawer` | `@base-ui/react/drawer` | 7.7 KiB | 25.5 KiB | 37.2 KiB |  |
| `dropzone` | `@zag-js/file-upload` | N/A | 5.7 KiB | 11.5 KiB | N/A | Maps to Zag file-upload; no Base UI file upload/dropzone export. |
| `field` | N/A | `@base-ui/react/field` | 9.6 KiB | N/A | 9.2 KiB | Base UI has field primitives; Zag has no field machine. |
| `input` | N/A | `@base-ui/react/input` | 2.1 KiB | N/A | 9.2 KiB | Base UI has input primitives; Zag has no input machine. |
| `input-otp` | `@zag-js/pin-input` | `@base-ui/react/otp-field` | 6.9 KiB | 9.0 KiB | 8.5 KiB | Equivalent naming differs: Zag pin-input, Base UI otp-field. |
| `menu` | `@zag-js/menu` | `@base-ui/react/menu` | 21.1 KiB | 28.3 KiB | 50.0 KiB |  |
| `popover` | `@zag-js/popover` | `@base-ui/react/popover` | 16.9 KiB | 26.4 KiB | 39.8 KiB |  |
| `preview-card` | `@zag-js/hover-card` | `@base-ui/react/preview-card` | 15.4 KiB | 20.2 KiB | 32.3 KiB | Equivalent naming differs: Zag hover-card. |
| `progress` | `@zag-js/progress` | `@base-ui/react/progress` | 2.8 KiB | 6.4 KiB | 3.3 KiB |  |
| `radio` | `@zag-js/radio-group` | `@base-ui/react/radio` | 6.3 KiB | 8.9 KiB | 7.8 KiB | Zag's radio support is represented through radio-group. |
| `radio-group` | `@zag-js/radio-group` | `@base-ui/react/radio-group` | 8.6 KiB | 8.9 KiB | 7.0 KiB |  |
| `scroll-area` | `@zag-js/scroll-area` | `@base-ui/react/scroll-area` | 4.6 KiB | 10.4 KiB | 8.0 KiB |  |
| `select` | `@zag-js/select` | `@base-ui/react/select` | 25.4 KiB | 28.6 KiB | 43.9 KiB |  |
| `slider` | `@zag-js/slider` | `@base-ui/react/slider` | 8.9 KiB | 12.7 KiB | 14.6 KiB |  |
| `switch` | `@zag-js/switch` | `@base-ui/react/switch` | 6.2 KiB | 8.2 KiB | 6.1 KiB |  |
| `tabs` | `@zag-js/tabs` | `@base-ui/react/tabs` | 4.8 KiB | 9.4 KiB | 12.8 KiB |  |
| `toast` | `@zag-js/toast` | `@base-ui/react/toast` | 5.6 KiB | 12.2 KiB | 26.1 KiB |  |
| `toggle` | `@zag-js/toggle` | `@base-ui/react/toggle` | 2.9 KiB | 4.9 KiB | 4.8 KiB |  |
| `toggle-group` | `@zag-js/toggle-group` | `@base-ui/react/toggle-group` | 4.7 KiB | 7.4 KiB | 5.7 KiB |  |
| `tooltip` | `@zag-js/tooltip` | `@base-ui/react/tooltip` | 15.8 KiB | 18.5 KiB | 33.4 KiB |  |


## Starwind Published Source Payloads

These rows measure the published package's own runtime-bearing source files after minification. They are useful for `@starwind-ui/astro`, whose package ships `.astro` source files rather than a JS bundle entry.

| Package | Version | Minified source payload | Minified + gzip | npm tarball gzip | npm unpacked | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `@starwind-ui/astro` | 0.1.0-beta.3 | 195.7 KiB | 20.7 KiB | 31.7 KiB | 235.2 KiB | Source-published Astro package; measured published .astro/.ts source payload, not compiled Astro output. |
| `@starwind-ui/runtime` | 0.1.0-beta.3 | 535.9 KiB | 124.3 KiB | 185.8 KiB | 1022.0 KiB |  |
| `@starwind-ui/react` | 0.1.0-beta.3 | 181.7 KiB | 42.8 KiB | 70.7 KiB | 542.7 KiB |  |


## Reading The Numbers

- Use `@starwind-ui/react (adapter only)` when you want to isolate framework-wrapper overhead.
- Use `@starwind-ui/react + runtime` when you want the likely consumer cost of importing the React adapter package root.
- Use `Starwind-Matched Support` when you want a fair support-surface comparison rather than a whole-catalog comparison.
- Use `Isolated vs Combined Support Costs` when you need to explain why one-component import rows should not be added together as an app-size estimate.
- Zag's framework adapters are separate from component machines, so adapter-only rows are not complete component costs.
- The Zag adapter + machine samples show the shape of a real single-component import for each framework adapter.
- Base UI is React-only and ships one large tree-shakeable package; component sample rows are better comparisons to Zag's per-machine rows than the Base UI root row.

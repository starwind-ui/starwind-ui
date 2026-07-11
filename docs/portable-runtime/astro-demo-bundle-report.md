# Astro Demo Bundle Report

Generated: 2026-07-07

## Method

- Route artifacts come from `apps/demo/dist` after `pnpm demo:build`.
- Initial/static external JavaScript follows route HTML JS assets and their static `import`/`export ... from` edges.
- Inline scripts are counted separately so JavaScript embedded in HTML is not hidden from comparisons.
- Dynamic imports are reported separately and are not counted as initial JavaScript.
- Gzip uses Node zlib default gzip settings on each asset or inline script.

## Route Summary

| Route | Initial chunks | External raw | External gzip | Inline scripts | Inline raw | Inline gzip | Initial JS gzip | Dynamic-only chunks | Dynamic-only gzip | HTML raw | HTML gzip |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `pages/sidebar-nested/index.html` | 3 | 14.5 KiB | 4.2 KiB | 9 | 10.8 KiB | 4.4 KiB | 8.6 KiB | 0 | 0 B | 149.0 KiB | 13.1 KiB |
| `pages/runtime-nested-sidebar/index.html` | 18 | 84.3 KiB | 29.3 KiB | 1 | 595 B | 318 B | 29.6 KiB | 13 | 41.3 KiB | 127.3 KiB | 10.3 KiB |

## Budgets

| Route | Max initial chunks | Max external raw | Max external gzip | Max initial JS gzip |
| --- | ---: | ---: | ---: | ---: |
| `pages/sidebar-nested/index.html` | 8 | 17.6 KiB | 5.9 KiB | 9.8 KiB |
| `pages/runtime-nested-sidebar/index.html` | 18 | 97.7 KiB | 33.2 KiB | 35.2 KiB |

## Classic nested sidebar

Route: `pages/sidebar-nested/index.html`

### Largest Initial/Static Contributors

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| `/_astro/Tooltip.astro_astro_type_script_index_0_lang.BzGfSspu.js` | 7.1 KiB | 1.8 KiB |
| `/_astro/Dialog.astro_astro_type_script_index_0_lang.Fgy0HqY9.js` | 5.2 KiB | 1.5 KiB |
| `/_astro/positioning.DMKuAMiA.js` | 2.3 KiB | 916 B |

### Inline Scripts

| Script | Attributes | Raw | Gzip |
| ---: | --- | ---: | ---: |
| 1 | `data-starwind-theme-init` | 595 B | 318 B |
| 2 | `type=module` | 1.6 KiB | 586 B |
| 3 | `type=module` | 501 B | 302 B |
| 4 | `type=module` | 1.4 KiB | 534 B |
| 5 | `type=module` | 513 B | 305 B |
| 6 | `type=module` | 1.5 KiB | 623 B |
| 7 | `type=module` | 1.4 KiB | 617 B |
| 8 | `type=module` | 341 B | 243 B |
| 9 | `type=module` | 2.9 KiB | 959 B |

### Dynamic-Only Imports

No dynamic-only JavaScript imports found from the initial/static graph.

## Runtime nested sidebar

Route: `pages/runtime-nested-sidebar/index.html`

### Largest Initial/Static Contributors

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| `/_astro/overlay-dismissal.CTQ7IAj4.js` | 20.3 KiB | 7.7 KiB |
| `/_astro/TooltipRoot.astro_astro_type_script_index_0_lang.CnbCIZH3.js` | 11.9 KiB | 3.8 KiB |
| `/_astro/SidebarProvider.astro_astro_type_script_index_0_lang.DumKQ3Qk.js` | 11.5 KiB | 3.2 KiB |
| `/_astro/dialog.0c2O-coC.js` | 10.9 KiB | 3.1 KiB |
| `/_astro/ThemeToggle.astro_astro_type_script_index_0_lang.BI-ZrtIc.js` | 8.9 KiB | 2.7 KiB |
| `/_astro/CollapsibleRoot.astro_astro_type_script_index_0_lang.Du4N05va.js` | 5.3 KiB | 1.8 KiB |
| `/_astro/ButtonRoot.astro_astro_type_script_index_0_lang.D6w_DzAs.js` | 3.5 KiB | 1.1 KiB |
| `/_astro/floating-disclosure.BefLV8jP.js` | 1.8 KiB | 893 B |
| `/_astro/DrawerRoot.astro_astro_type_script_index_0_lang.DaugKEjO.js` | 2.1 KiB | 846 B |
| `/_astro/dom.DNJKgexK.js` | 1.6 KiB | 728 B |
| `/_astro/preload-helper.CVfkMyKi.js` | 1.2 KiB | 704 B |
| `/_astro/presence.Q9GqKd5J.js` | 1.4 KiB | 660 B |

### Inline Scripts

| Script | Attributes | Raw | Gzip |
| ---: | --- | ---: | ---: |
| 1 | `data-starwind-theme-init` | 595 B | 318 B |

### Dynamic-Only Imports

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| `/_astro/collection.B2JG2Tok.js` | 365 B | 249 B |
| `/_astro/field-control-bridge.CH2bAHc8.js` | 5.6 KiB | 1.9 KiB |
| `/_astro/floating-list-lifecycle.C50NFARp.js` | 1.9 KiB | 970 B |
| `/_astro/index.B62JlNkl.js` | 25.9 KiB | 6.7 KiB |
| `/_astro/index.BBhutXJS.js` | 9.0 KiB | 2.8 KiB |
| `/_astro/index.BYUnrXyr.js` | 19.1 KiB | 5.3 KiB |
| `/_astro/index.CXuUvL-P.js` | 7.1 KiB | 2.3 KiB |
| `/_astro/index.CfkFjHq8.js` | 7.9 KiB | 2.7 KiB |
| `/_astro/index.DHV2SE-2.js` | 11.7 KiB | 3.5 KiB |
| `/_astro/index.DVkESX2j.js` | 10.0 KiB | 3.0 KiB |
| `/_astro/index.DoEYeZF4.js` | 27.2 KiB | 7.4 KiB |
| `/_astro/index.p6cRGJzw.js` | 8.4 KiB | 2.8 KiB |
| `/_astro/index.pqtwuKP5.js` | 5.0 KiB | 1.9 KiB |

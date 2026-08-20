# Vue Package Size Baseline Evidence

Commit: `ef58435373775514c1237ce94bfc3e7628c1ebe4`

Environment: Linux #28~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Jul  1 15:50:57 UTC 2; linux x64; Node 24.19.0; npm 11.17.0; pnpm 11.8.0; esbuild 0.28.1; zlib 1.3.2.1-motley-3246f1b.

Command: `"node" "scripts/portable-runtime/measure-package-sizes.mjs" "--baseline-vue"`

Comparator: Zag Vue 1.42.0 with 28 exact packages.

## Stability

| Row id | Run 1 | Run 2 | Run 3 | Minimum | Maximum | Range | Tolerance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `vue.adapter-only` | 51807 | 51807 | 51807 | 51807 | 51807 | 0 | 1024 |
| `vue.cold.accordion` | 4669 | 4669 | 4669 | 4669 | 4669 | 0 | 1024 |
| `vue.cold.alert-dialog` | 12461 | 12461 | 12461 | 12461 | 12461 | 0 | 1024 |
| `vue.cold.avatar` | 2447 | 2447 | 2447 | 2447 | 2447 | 0 | 1024 |
| `vue.cold.button` | 1336 | 1336 | 1336 | 1336 | 1336 | 0 | 1024 |
| `vue.cold.carousel` | 9802 | 9802 | 9802 | 9802 | 9802 | 0 | 1024 |
| `vue.cold.checkbox` | 7881 | 7881 | 7881 | 7881 | 7881 | 0 | 1024 |
| `vue.cold.checkbox-group` | 8923 | 8923 | 8923 | 8923 | 8923 | 0 | 1024 |
| `vue.cold.collapsible` | 5285 | 5285 | 5285 | 5285 | 5285 | 0 | 1024 |
| `vue.cold.color-picker` | 18228 | 18228 | 18228 | 18228 | 18228 | 0 | 1024 |
| `vue.cold.combobox` | 29258 | 29258 | 29258 | 29258 | 29258 | 0 | 1024 |
| `vue.cold.context-menu` | 27203 | 27203 | 27203 | 27203 | 27203 | 0 | 1024 |
| `vue.cold.dialog` | 10633 | 10633 | 10633 | 10633 | 10633 | 0 | 1024 |
| `vue.cold.drawer` | 12477 | 12477 | 12477 | 12477 | 12477 | 0 | 1024 |
| `vue.cold.dropzone` | 6064 | 6064 | 6064 | 6064 | 6064 | 0 | 1024 |
| `vue.cold.field` | 10480 | 10480 | 10480 | 10480 | 10480 | 0 | 1024 |
| `vue.cold.fieldset` | 2548 | 2548 | 2548 | 2548 | 2548 | 0 | 1024 |
| `vue.cold.form` | 17632 | 17632 | 17632 | 17632 | 17632 | 0 | 1024 |
| `vue.cold.input` | 2291 | 2291 | 2291 | 2291 | 2291 | 0 | 1024 |
| `vue.cold.input-otp` | 7927 | 7927 | 7927 | 7927 | 7927 | 0 | 1024 |
| `vue.cold.menu` | 27184 | 27184 | 27184 | 27184 | 27184 | 0 | 1024 |
| `vue.cold.navigation-menu` | 24878 | 24878 | 24878 | 24878 | 24878 | 0 | 1024 |
| `vue.cold.popover` | 21165 | 21165 | 21165 | 21165 | 21165 | 0 | 1024 |
| `vue.cold.preview-card` | 19345 | 19345 | 19345 | 19345 | 19345 | 0 | 1024 |
| `vue.cold.progress` | 3112 | 3112 | 3112 | 3112 | 3112 | 0 | 1024 |
| `vue.cold.radio` | 7789 | 7789 | 7789 | 7789 | 7789 | 0 | 1024 |
| `vue.cold.radio-group` | 10897 | 10897 | 10897 | 10897 | 10897 | 0 | 1024 |
| `vue.cold.scroll-area` | 5161 | 5161 | 5161 | 5161 | 5161 | 0 | 1024 |
| `vue.cold.select` | 30107 | 30107 | 30107 | 30107 | 30107 | 0 | 1024 |
| `vue.cold.sidebar` | 6586 | 6586 | 6586 | 6586 | 6586 | 0 | 1024 |
| `vue.cold.slider` | 10008 | 10008 | 10008 | 10008 | 10008 | 0 | 1024 |
| `vue.cold.switch` | 6885 | 6885 | 6885 | 6885 | 6885 | 0 | 1024 |
| `vue.cold.tabs` | 5569 | 5569 | 5569 | 5569 | 5569 | 0 | 1024 |
| `vue.cold.toast` | 6382 | 6382 | 6382 | 6382 | 6382 | 0 | 1024 |
| `vue.cold.toggle` | 3497 | 3497 | 3497 | 3497 | 3497 | 0 | 1024 |
| `vue.cold.toggle-group` | 5463 | 5463 | 5463 | 5463 | 5463 | 0 | 1024 |
| `vue.cold.tooltip` | 19739 | 19739 | 19739 | 19739 | 19739 | 0 | 1024 |
| `vue.combined` | 201210 | 201210 | 201210 | 201210 | 201210 | 0 | 2012 |
| `vue.matched.starwind` | 176194 | 176194 | 176194 | 176194 | 176194 | 0 | 1761 |
| `vue.matched.zag` | 128292 | 128292 | 128292 | 128292 | 128292 | 0 | 1282 |
| `vue.packed-tarball` | 135512 | 135512 | 135512 | 135512 | 135512 | 0 | 1355 |
| `vue.theme` | 3649 | 3649 | 3649 | 3649 | 3649 | 0 | 1024 |

## Cold-import sentinels

| Rank | Component | Row id | Stable maximum |
| ---: | --- | --- | ---: |
| 1 | select | `vue.cold.select` | 30107 |
| 2 | combobox | `vue.cold.combobox` | 29258 |
| 3 | context-menu | `vue.cold.context-menu` | 27203 |
| 4 | menu | `vue.cold.menu` | 27184 |
| 5 | navigation-menu | `vue.cold.navigation-menu` | 24878 |

Theme is measured as `vue.theme` and is excluded from sentinel selection.

## Ceiling candidates

| Row id | Raw values | Stable maximum | Headroom | Candidate ceiling |
| --- | --- | ---: | ---: | ---: |
| `vue.adapter-only` | 51807, 51807, 51807 | 51807 | 2591 | 54398 |
| `vue.cold.combobox` | 29258, 29258, 29258 | 29258 | 1463 | 30721 |
| `vue.cold.context-menu` | 27203, 27203, 27203 | 27203 | 1361 | 28564 |
| `vue.cold.menu` | 27184, 27184, 27184 | 27184 | 1360 | 28544 |
| `vue.cold.navigation-menu` | 24878, 24878, 24878 | 24878 | 1244 | 26122 |
| `vue.cold.select` | 30107, 30107, 30107 | 30107 | 1506 | 31613 |
| `vue.combined` | 201210, 201210, 201210 | 201210 | 10061 | 211271 |
| `vue.packed-tarball` | 135512, 135512, 135512 | 135512 | 6776 | 142288 |

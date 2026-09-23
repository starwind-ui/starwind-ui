# Framework adapter size comparison

This capture compares the accepted post-Svelte, pre-alignment baseline with
the aligned React and Vue adapter sources. Svelte and Runtime retain the
baseline source identity.

The full Primitive catalog grows from 39.94 to 40.47 KiB gzip for React and
from 53.56 to 54.49 KiB for Vue. Svelte remains 79.09 KiB gzip. The catalog
imports every Primitive export, so it measures package surface and source
ownership. It does not represent a typical one-component application payload.

## Primitive catalog

The adapter-only column includes generated framework adapter code. The
adapter-plus-Runtime column also includes Runtime. Framework peers stay
external. Values are raw minified bytes, gzip level 9, and Brotli quality 11.

| Framework |              Adapter only |  Delta from baseline |        Adapter plus Runtime |    Delta from baseline |
| --------- | ------------------------: | -------------------: | --------------------------: | ---------------------: |
| React     | 164,917 / 41,442 / 32,778 | +2,197 / +546 / +414 | 767,315 / 193,327 / 145,924 |   +2,197 / +490 / +293 |
| Vue       | 245,697 / 55,794 / 40,790 | +4,727 / +947 / +856 | 846,024 / 209,434 / 154,370 | +4,694 / +1,331 / +776 |
| Svelte    | 334,250 / 80,987 / 56,648 |            0 / 0 / 0 | 932,684 / 234,358 / 170,337 |              0 / 0 / 0 |

## Representative Primitive imports

These are adapter-only imports. Each value gives final gzip KiB followed by
the final-minus-baseline gzip delta in bytes. They show where composition
became part of a direct consumer graph.

| Import          |       React |         Vue |    Svelte |
| --------------- | ----------: | ----------: | --------: |
| Button          |   0.61 (+0) |   0.67 (+0) | 1.17 (+0) |
| Dialog          | 1.74 (+347) | 2.33 (+581) | 2.88 (+0) |
| Select          |   6.52 (+0) | 6.20 (+830) | 6.53 (+0) |
| Combobox        |   6.99 (+0) |   6.86 (+0) | 7.58 (+0) |
| Color Picker    |   4.48 (+0) |   5.20 (+0) | 6.76 (+0) |
| Form            |   0.77 (+0) |   0.90 (+0) | 1.09 (+0) |
| Field           |   1.87 (+0) |   2.47 (+0) | 2.89 (+0) |
| Popover         |   3.59 (+0) |   4.70 (+0) | 5.44 (+0) |
| Progress        |   1.03 (+0) |   1.22 (+0) | 1.78 (+0) |
| Checkbox        |   1.90 (+0) |   2.09 (+0) | 3.15 (+0) |
| Tabs            |   1.41 (+0) |   1.85 (+0) | 2.46 (+0) |
| Toast           |   1.24 (+0) |   1.71 (+0) | 2.13 (+0) |
| Navigation Menu |   3.89 (+0) |   5.18 (+0) | 6.02 (+0) |

## Equivalent Styled fixtures

Each fixture uses complete Styled Dialog or Select parts. Dialog includes
root, trigger, and content. Select includes root, trigger, content, and item.
Every framework has a native-child fixture and a custom-child fixture. Styled
JavaScript dependencies and Runtime are included. CSS and framework peers are
external.

| Framework |           Dialog gzip KiB, baseline to final |           Select gzip KiB, baseline to final |
| --------- | -------------------------------------------: | -------------------------------------------: |
| React     | native 24.04 to 24.13, custom 24.07 to 24.15 | native 45.14 to 45.13, custom 45.16 to 45.16 |
| Vue       | native 24.92 to 25.29, custom 24.93 to 25.30 | native 44.35 to 45.02, custom 44.36 to 45.03 |
| Svelte    | native 26.34 to 26.34, custom 26.39 to 26.39 | native 45.13 to 45.13, custom 45.18 to 45.18 |

Vue Dialog gains about 0.37 KiB gzip and Vue Select gains about 0.66 KiB.
These cold fixture increases are lower than the superseded aligned capture,
while the full Vue catalog increases by 0.09 KiB gzip from that capture.
React Dialog gains about 0.08 KiB gzip. The measured Svelte gzip values remain
unchanged in these corrected custom-child fixtures.

| Fixture                     | Final raw / gzip / Brotli | Delta from baseline raw / gzip / Brotli |
| --------------------------- | ------------------------: | --------------------------------------: |
| React Dialog, native child  |  80,551 / 24,705 / 21,869 |                        +290 / +84 / +24 |
| React Dialog, custom child  |  80,600 / 24,728 / 21,871 |                        +290 / +80 / -22 |
| Vue Dialog, native child    |  84,909 / 25,892 / 22,826 |                    +1,087 / +377 / +325 |
| Vue Dialog, custom child    |  84,948 / 25,910 / 22,921 |                    +1,087 / +380 / +360 |
| Svelte Dialog, native child |  86,468 / 26,973 / 23,276 |                               0 / 0 / 0 |
| Svelte Dialog, custom child |  86,575 / 27,020 / 23,359 |                               0 / 0 / 0 |
| React Select, native child  | 147,275 / 46,218 / 40,261 |                            0 / -1 / +63 |
| React Select, custom child  | 147,324 / 46,245 / 40,235 |                            0 / +1 / -55 |
| Vue Select, native child    | 150,576 / 46,097 / 40,198 |                    +2,046 / +679 / +509 |
| Vue Select, custom child    | 150,615 / 46,110 / 40,255 |                    +2,046 / +681 / +582 |
| Svelte Select, native child | 151,158 / 46,218 / 40,608 |                             0 / 0 / +24 |
| Svelte Select, custom child | 151,265 / 46,269 / 40,595 |                             0 / 0 / +22 |

Every fixture record includes its complete initial and deferred output graph.
The corrected Svelte custom-child fixture forwards the Primitive payload's
`props` object to its custom button. A focused SSR render confirms the Dialog
and Select Runtime data hooks reach that button.

Svelte source trees match across the two captures. The custom Select row has
equal raw and gzip bytes, with a 22-byte Brotli difference. The capture does
not attribute that compressed-byte variation to alignment.

## Interpretation and limits

The React and Vue changes relocate composition into Primitive ownership. The
catalog and affected direct imports therefore increase where that composition
is now reachable. These figures do not establish application-wide sharing
savings. A consuming application's route graph and chunk policy decide that
result.

The fixture graph verifies the required parts and Runtime reachability. It is
a size capture, so it does not prove cross-framework behavioral parity. The
accepted framework checkpoints remain the behavior evidence. Vue maintains its
strict native VNode path. React keeps its wrapper-based path. Alert Dialog
keeps its direct Styled button roots.

The capture uses Node 24.20.0, esbuild 0.28.1, Svelte compiler 5.29.0, Vue
compiler 3.5.39, and tailwind-variants 3.2.2. The same pinned Styled
dependency inputs were used for all frameworks. The historical Primitive rows
come from the accepted clean baseline. The historical Styled rows were built
once from an immutable archive of that baseline. The Vue helper refresh
recaptured the catalog, Dialog, Select, and their four Styled fixtures. It
retains React, Svelte, and unaffected Vue rows after a source-graph check.

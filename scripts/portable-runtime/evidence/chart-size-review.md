# Chart size review

The accepted snapshot was captured from commit `f9d127b2598c1b36812c685f4c718396e70224d0`
with esbuild 0.28.2. The prior snapshot used esbuild 0.28.1 and a different lockfile.
Gzip bytes from the size check are listed below. New rows have no earlier value.

| Row | Previous | Current | Delta |
| --- | ---: | ---: | ---: |
| React adapter | 46,475 | 48,902 | +2,427 |
| React catalog | 197,865 | 223,485 | +25,620 |
| React chart | — | 44,465 | new |
| React combobox | 29,746 | 29,924 | +178 |
| Vue adapter | 58,629 | 63,839 | +5,210 |
| Vue catalog | 211,881 | 240,761 | +28,880 |
| Vue chart | — | 45,125 | new |
| Vue complete catalog | 214,706 | 243,906 | +29,200 |
| Vue package archive | 146,699 | 165,637 | +18,938 |

Chart adds the TanStack Charts engine to the complete catalogs and package payloads. The Combobox
increase remains below its review warning. Runtime root source outside the chart directory is
unchanged from the parent of the chart Runtime commit (`ac4cc86b3`); the root and `initStarwind`
therefore use the same source. Both the old and current Runtime root rows import the full Runtime
namespace and measure its initial static bundle. The old accepted row was 148,501 bytes; the new row
is 133,734 bytes. Runtime build changes after the old snapshot shorten private member and internal
property names (`e3f1cc539` and `d6f37c536`). To isolate that effect, the current Runtime source was
built once with those two passes disabled and once with them enabled. Using the same esbuild 0.28.2
measurement, the initial root gzip sizes were 145,913 and 133,734 bytes, a reduction of 12,179 bytes.
The remaining difference from the old accepted snapshot also includes later Runtime source changes,
the lockfile change and esbuild 0.28.1 to 0.28.2. The old capture recorded a dirty tree, so its exact
remaining contribution cannot be isolated from its commit alone.

The accepted gzip measurements are 133,734 bytes for the root, 132,386 bytes for `initStarwind`,
and 41,547 bytes for the chart subpath. The size check fails on any root or `initStarwind` growth and
inspects their bundle inputs for chart and TanStack Charts code.

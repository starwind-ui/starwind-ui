# Runtime performance comparison

Each provider and workload has one excluded warmup context and five measured fresh contexts. Each context mounts once and performs one complete task flow.

Values are average milliseconds; lower is faster.

## Mounting

Time from React render to ready DOM.

| Workload | Starwind React | Base UI React | Ark UI React |
| --- | ---: | ---: | ---: |
| Menu | 15.1 | 22.1 | 18.8 |
| Select | 15.1 | 15.6 | 31.9 |
| Combobox | 11.6 | 31.4 | 33.4 |
| Submenu | 12.2 | 17.8 | 23.4 |
| Select page (1 control) | 19.7 | 7.8 | 21.3 |
| Select page (20 controls) | 34.6 | 33.9 | 40.7 |

## Interactions

Input to resulting DOM update.

| Workload | Action | Starwind React | Base UI React | Ark UI React |
| --- | --- | ---: | ---: | ---: |
| Menu | Open | 1.7 | 14.7 | 6.1 |
| Menu | Choose item | 3.9 | 8.7 | 5.1 |
| Menu | Reopen | 1.3 | 14.6 | 4.3 |
| Menu | Close with Escape | 0.6 | 7.5 | 1.1 |
| Select | Open | 7.9 | 9.4 | 5.5 |
| Select | Move highlight (per key) | 0.5 | 1.2 | 1.4 |
| Select | Choose item | 2.8 | 9.2 | 2.1 |
| Select | Submit form | 1.0 | 2.5 | 2.7 |
| Combobox | Filter results (per character) | 5.7 | 6.4 | 6.7 |
| Combobox | Move highlight (per key) | 0.3 | 1.3 | 1.2 |
| Combobox | Choose item | 9.8 | 4.1 | 2.3 |
| Combobox | Submit form | 1.2 | 1.2 | 1.5 |
| Submenu | Open parent menu | 1.9 | 14.1 | 6.3 |
| Submenu | Choose item | 3.9 | 9.7 | 5.6 |
| Select page (1 control) | Open | 5.5 | 9.5 | 4.0 |
| Select page (1 control) | Close with Escape | 0.9 | 6.6 | 3.4 |
| Select page (1 control) | Reopen | 5.6 | 10.9 | 4.5 |
| Select page (1 control) | Move highlight (per key) | 0.4 | 1.2 | 0.8 |
| Select page (1 control) | Choose item | 1.7 | 5.5 | 1.3 |
| Select page (1 control) | Submit form | 1.0 | 1.8 | 1.8 |
| Select page (20 controls) | Open | 5.5 | 13.1 | 4.6 |
| Select page (20 controls) | Close with Escape | 1.0 | 5.9 | 3.0 |
| Select page (20 controls) | Reopen | 2.7 | 10.6 | 1.8 |
| Select page (20 controls) | Move highlight (per key) | 0.4 | 1.2 | 0.8 |
| Select page (20 controls) | Choose item | 2.7 | 7.4 | 7.0 |
| Select page (20 controls) | Submit form | 1.7 | 3.1 | 5.9 |

## Large workloads

| Workload | Measure | Starwind React | Base UI React | Ark UI React |
| --- | --- | ---: | ---: | ---: |
| Dialog | Open | 4.7 | 9.6 | 11.8 |
| Navigation Menu | Switch panel (pointer) | 2.7 | 7.1 | 8.1 |
| Tabs | Mount | 44.6 | 71.7 | 40.0 |
| Tabs | Select last | 2.1 | 28.6 | 37.0 |
| Accordion | Mount | 42.9 | 72.2 | 48.8 |
| Accordion | Expand last | 2.5 | 18.5 | 21.4 |
| Radio Group | Mount | 62.4 | 55.9 | 41.5 |
| Radio Group | Select last | 1.1 | 34.3 | 31.7 |

## Notes

- Each value uses five measured passes. Filter and move-highlight values first average the seven characters or actual navigation keys within each pass, then give each pass equal weight. Navigation key counts can differ by provider.
- Workloads: Menu has 20 actions; Select has 100 options; Combobox has 500 items; Submenu has eight parents with eight children each; each Select page control has 20 options.
- Input-to-DOM includes observer checks and ends at a DOM condition. It does not measure painted pixels. Mount starts after module loading and excludes network and forced layout. Closed popup presence differs by provider.
- Captured 2026-09-13 with Chromium 151.0.7922.34 on Apple M5 Pro. React 19.3.0, Base UI 1.8.0, Ark UI React 5.39.1, and local Starwind source. Power source: unknown; display refresh rate: unknown.
- Captured source revision: `1cd7f81c4c4ac9fe20ace6867e9d366213a6fd09`; source inventory SHA-256: `7410f1ea08c33039ab294502aa7ceee0228c4515c90a7647e25d026637ba3070`. Current source differs from the capture. Saved run: `2026-09-13T14-04-39.100Z-capture-15216c25`.
- Large workloads use one excluded warmup and five fresh measured contexts per provider. Dialog opens beside 10,000 outside nodes; Navigation Menu switches between two 500-link panels; Tabs, Accordion, and Radio Group each contain 1,000 items, with all Tabs and Accordion panels retained. Navigation Menu uses trusted pointer entry; the other actions use trusted clicks. Each action ends at a checked DOM state. Mount rows run from React render to checked ready DOM. These values use native CPU and do not measure paint.
- Large workload capture dates: Dialog 2026-09-13; Navigation Menu 2026-09-13; Tabs 2026-09-13; Accordion 2026-09-13; Radio Group 2026-09-13.
- [Measurements and capture details](./performance-evidence/2026-09-13T14-04-39.100Z-capture-15216c25/README.md) contain the samples behind every comparison and the calculation method.

# Runtime performance comparison

Each provider and workload has one excluded warmup context and five measured fresh contexts. Each context mounts once and performs one complete task flow.

Values are average milliseconds; lower is faster.

## Mounting

Time from React render to ready DOM.

| Workload | Starwind React | Base UI React | Ark UI React |
| --- | ---: | ---: | ---: |
| Menu | 13.2 | 21.7 | 29.5 |
| Select | 20.8 | 24.3 | 35.2 |
| Combobox | 12.0 | 34.1 | 37.2 |
| Submenu | 23.5 | 29.6 | 30.5 |
| Select page (1 control) | 26.1 | 20.3 | 28.0 |
| Select page (20 controls) | 37.4 | 36.6 | 40.1 |

## Interactions

Input to resulting DOM update.

| Workload | Action | Starwind React | Base UI React | Ark UI React |
| --- | --- | ---: | ---: | ---: |
| Menu | Open | 1.7 | 14.3 | 6.8 |
| Menu | Choose item | 4.0 | 7.1 | 4.7 |
| Menu | Reopen | 1.4 | 14.2 | 4.6 |
| Menu | Close with Escape | 0.8 | 8.1 | 1.0 |
| Select | Open | 8.1 | 8.7 | 5.8 |
| Select | Move highlight (per key) | 0.4 | 0.9 | 1.3 |
| Select | Choose item | 2.3 | 6.3 | 1.9 |
| Select | Submit form | 1.0 | 2.2 | 2.6 |
| Combobox | Filter results (per character) | 5.1 | 5.6 | 5.3 |
| Combobox | Move highlight (per key) | 0.3 | 1.5 | 1.2 |
| Combobox | Choose item | 8.4 | 3.5 | 2.2 |
| Combobox | Submit form | 1.2 | 1.1 | 1.6 |
| Submenu | Open parent menu | 1.8 | 13.9 | 7.4 |
| Submenu | Choose item | 2.9 | 7.0 | 5.3 |
| Select page (1 control) | Open | 5.6 | 10.9 | 3.9 |
| Select page (1 control) | Close with Escape | 1.0 | 5.9 | 4.3 |
| Select page (1 control) | Reopen | 2.7 | 10.9 | 1.9 |
| Select page (1 control) | Move highlight (per key) | 0.4 | 0.7 | 0.7 |
| Select page (1 control) | Choose item | 1.7 | 2.7 | 1.1 |
| Select page (1 control) | Submit form | 1.1 | 1.3 | 1.6 |
| Select page (20 controls) | Open | 5.7 | 9.7 | 3.4 |
| Select page (20 controls) | Close with Escape | 1.2 | 5.8 | 2.8 |
| Select page (20 controls) | Reopen | 2.9 | 10.6 | 3.1 |
| Select page (20 controls) | Move highlight (per key) | 0.4 | 1.0 | 0.8 |
| Select page (20 controls) | Choose item | 2.3 | 4.6 | 6.3 |
| Select page (20 controls) | Submit form | 1.7 | 2.6 | 5.6 |

## Large workloads

| Workload | Measure | Starwind React | Base UI React | Ark UI React |
| --- | --- | ---: | ---: | ---: |
| Dialog | Open | 5.1 | 10.1 | 12.9 |
| Navigation Menu | Switch panel (pointer) | 2.8 | 7.8 | 17.0 |
| Tabs | Mount | 43.8 | 78.5 | 47.7 |
| Tabs | Select last | 2.4 | 28.6 | 39.3 |
| Accordion | Mount | 44.2 | 80.6 | 51.4 |
| Accordion | Expand last | 2.7 | 19.3 | 22.0 |
| Radio Group | Mount | 69.8 | 62.8 | 49.0 |
| Radio Group | Select last | 1.2 | 35.3 | 32.8 |

## Notes

- Each value uses five measured passes. Filter and move-highlight values first average the seven characters or actual navigation keys within each pass, then give each pass equal weight. Navigation key counts can differ by provider.
- Workloads: Menu has 20 actions; Select has 100 options; Combobox has 500 items; Submenu has eight parents with eight children each; each Select page control has 20 options.
- Input-to-DOM includes observer checks and ends at a DOM condition. It does not measure painted pixels. Mount starts after module loading and excludes network and forced layout. Closed popup presence differs by provider.
- Captured 2026-09-28 with Chromium 151.0.7922.34 on Apple M5 Pro. React 19.3.0, Base UI 1.8.0, Ark UI React 5.39.1, and local Starwind source. Power source: unknown; display refresh rate: unknown.
- Captured source revision: `e7542c129b87b16799f3ba3fb20d096dd3df5eac`; source inventory SHA-256: `a9cc2fc10bbb5ef36b087ae64d5df434b6753836bae9fd71a71a5a6703fbc1ce`. Current source matches the capture. Saved run: `2026-09-28T14-32-24.127Z-capture-2ead2e5f`.
- Large workloads use one excluded warmup and five fresh measured contexts per provider. Dialog opens beside 10,000 outside nodes; Navigation Menu switches between two 500-link panels; Tabs, Accordion, and Radio Group each contain 1,000 items, with all Tabs and Accordion panels retained. Navigation Menu uses trusted pointer entry; the other actions use trusted clicks. Each action ends at a checked DOM state. Mount rows run from React render to checked ready DOM. These values use native CPU and do not measure paint.
- Large workload capture dates: Dialog 2026-09-28; Navigation Menu 2026-09-28; Tabs 2026-09-28; Accordion 2026-09-28; Radio Group 2026-09-28.
- [Measurements and capture details](./performance-evidence/2026-09-28T14-32-24.127Z-capture-2ead2e5f/README.md) contain the samples behind every comparison and the calculation method.

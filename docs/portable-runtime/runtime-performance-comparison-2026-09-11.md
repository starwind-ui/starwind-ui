# Runtime Performance Comparison

Generated: 2026-09-11

Investigation note: the original highlight rows below exercise unequal behavior across libraries, and several mount rows use different closed-content policies. Read the [September 11 investigation](./diagnostics/runtime-performance-investigation-2026-09-11.md) for those limits. The later [portal validation](./diagnostics/runtime-performance-portal-validation-2026-09-11.md) records the implemented observer fix and corrected highlighting results.

## Method

- A temporary React/Vite app is generated, built in production mode, served as static files, and driven with Playwright Chromium.
- Starwind rows use local `packages/runtime/dist` and `packages/react/dist`, matching the package-size comparison's local-dist approach.
- Base UI and Zag rows use npm packages from a temporary measurement project under the operating system's temporary directory.
- CPU throttling is applied with Chrome DevTools Protocol `Emulation.setCPUThrottlingRate`.
- Open rows collect 5 samples. The browser focuses the configured trigger, marks the start immediately before pressing the configured key, waits for benchmark content to become visible, advances animation frames, forces layout, and reports event-to-visible duration. Most rows use Enter; Combobox uses ArrowDown from the input.
- Mount rows run 5 groups of 20 scripted React renders. Each iteration unmounts, `flushSync` renders the fixture, and forces layout by reading geometry.
- Highlight rows open the popup first, then measure a scripted pointermove sweep across 1000 mounted items. Raw samples separate pointer-event dispatch from the forced-layout read while preserving the existing total sweep metric. This is an interaction-handler comparison, not a literal hand-moved cursor trace.
- Filter rows open the combobox first, then measure a scripted input value change plus layout.
- Submenu open rows open the parent menu as setup, then measure submenu trigger activation-to-visible timing for a 1000-item submenu.
- Navigation switch rows open the first content panel as setup, then measure the second trigger's click-to-visible timing for large content.
- Collection click rows measure a scripted click activation/toggle plus visible panel layout for high-count non-floating controls.
- Radio sweep rows measure a scripted click sweep across 1000 radio items, forcing layout after each change.
- All fixtures use primitive APIs, minimal CSS, no React StrictMode, and no styled Starwind wrapper code.
- These React fixtures use framework-owned portals. Starwind first renders its portal subtree inline, then places it through a React portal and publishes a binding for Runtime discovery.

Regenerate with:

```bash
pnpm runtime:perf
```

## Package Versions

| Library   | Version | Source                                 |
| --------- | ------: | -------------------------------------- |
| Starwind  |   local | `packages/*/dist`                      |
| Base UI   |   1.8.0 | `@base-ui/react`                       |
| Zag React |  1.43.3 | `@zag-js/react` and component packages |
| React     |  19.3.0 | `react`                                |

## Results

| Category                          | Scenario                       | Details                                                            | CPU | Metric                 | Starwind |    Base UI | Zag React |
| --------------------------------- | ------------------------------ | ------------------------------------------------------------------ | --: | ---------------------- | -------: | ---------: | --------: |
| baseline-open                     | Dialog open                    | 10k outside nodes, Enter-to-visible                                | 20x | event-to-visible       | 181.6 ms |   186.1 ms |  207.7 ms |
| baseline-open                     | Select open                    | 1000 items, Enter-to-visible                                       |  6x | event-to-visible       | 137.6 ms |   290.9 ms |  128.9 ms |
| baseline-hover                    | Select item highlight          | Open select, scripted pointermove sweep across 1000 items          |  1x | pointermove-sweep      |  33.4 ms |     9.4 ms |   12.4 ms |
| baseline-open                     | Menu open                      | 1000 items, Enter-to-visible                                       |  6x | event-to-visible       |  45.4 ms |   255.4 ms |   86.3 ms |
| baseline-mount                    | Tooltip trigger mount          | 1000 tooltip triggers, render + layout                             |  1x | render-layout          | 139.6 ms |    21.7 ms |   18.2 ms |
| closed-overlay-candidate          | Dialog trigger mount           | 1000 closed dialog triggers with content, render + layout          |  1x | render-layout          |  29.1 ms |   119.7 ms |   20.0 ms |
| closed-overlay-candidate          | Popover trigger mount          | 1000 closed popover triggers with content, render + layout         |  1x | render-layout          | 131.9 ms |   212.5 ms |   20.5 ms |
| closed-overlay-candidate          | Preview card trigger mount     | 1000 closed preview card triggers with content, render + layout    |  1x | render-layout          | 133.4 ms |   119.8 ms |   16.9 ms |
| baseline-mount                    | Select trigger mount           | 1000 select triggers, 10 items each, render + layout               |  1x | render-layout          | 139.4 ms |   126.6 ms |   88.6 ms |
| baseline-hover                    | Menu item highlight            | Open menu, scripted pointermove sweep across 1000 items            |  1x | pointermove-sweep      |  31.7 ms |     7.9 ms |   13.2 ms |
| combobox-candidate                | Combobox open                  | 1000 items, ArrowDown-to-visible                                   |  6x | event-to-visible       | 108.3 ms |   157.2 ms |  118.2 ms |
| combobox-candidate                | Combobox trigger mount         | 1000 combobox triggers, 10 items each, render + layout             |  1x | render-layout          | 167.2 ms |   229.4 ms |   30.8 ms |
| combobox-candidate                | Combobox item highlight        | Open combobox, scripted pointermove sweep across 1000 items        |  1x | pointermove-sweep      |  15.0 ms |    11.0 ms |   15.8 ms |
| combobox-candidate                | Combobox filter input          | Open combobox, type filter query, input-to-layout                  |  1x | input-to-layout        |  15.8 ms |    15.9 ms |   13.5 ms |
| nested-menu-candidate             | Menu submenu open              | Parent menu plus 1000-item submenu, activation-to-visible          |  6x | activation-to-visible  |  26.7 ms |   237.3 ms |   69.6 ms |
| nested-menu-candidate             | Menu submenu item highlight    | Open submenu, scripted pointermove sweep across 1000 submenu items |  1x | pointermove-sweep      |  34.3 ms |     8.6 ms |    8.2 ms |
| navigation-menu-candidate         | Navigation menu content switch | Large navigation content switch, click-to-visible                  |  1x | content-switch-visible |  18.9 ms |    16.7 ms |   25.0 ms |
| non-floating-collection-candidate | Tabs high-count mount          | 1000 tabs and 1000 keep-mounted panels, render + layout            |  1x | render-layout          |  11.8 ms |    39.5 ms |    8.5 ms |
| non-floating-collection-candidate | Tabs activation click          | 1000 tabs and panels, last tab click-to-panel                      |  1x | tab-click-to-panel     |  16.3 ms |    55.4 ms |   21.3 ms |
| non-floating-collection-candidate | Accordion high-count mount     | 1000 closed accordion items with mounted panels, render + layout   |  1x | render-layout          |  15.2 ms |    37.5 ms |    9.4 ms |
| non-floating-collection-candidate | Accordion toggle click         | 1000 closed accordion items, last trigger click-to-panel           |  1x | toggle-click-to-panel  |  16.6 ms |    40.5 ms |   24.0 ms |
| non-floating-collection-candidate | Radio Group high-count mount   | 1000 radio items in one group, render + layout                     |  1x | render-layout          |  26.6 ms |   272.7 ms |   16.8 ms |
| non-floating-collection-candidate | Radio Group change sweep       | Scripted click sweep across 1000 radio items                       |  1x | radio-click-sweep      |  79.6 ms | 28243.4 ms |  492.1 ms |

## Reading The Numbers

- Treat this as a local comparator and regression tracker, not a universal benchmark claim.
- Prefer relative comparisons within the same run; CPU, browser, power mode, and background work can move absolute timings.
- The open-row metric is an automated event-to-visible marker measurement. For a stricter public benchmark, the next iteration should parse DevTools trace events and identify the exact visible paint after the input event.
- The mount rows intentionally include render and forced layout, but not network or initial bundle parse.
- The highlight row intentionally dispatches pointer events over mounted items. A separate manual UX trace could measure real cursor movement and scroll behavior.

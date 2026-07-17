# Runtime Performance Comparison

Generated: 2026-07-11

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
- Starwind's `Portal` parts are runtime-owned DOM markers; Base UI and Zag use React portals. That difference is part of the implementation being measured.

## Package Versions

| Library   | Version | Source                                 |
| --------- | ------: | -------------------------------------- |
| Starwind  |   local | `packages/*/dist`                      |
| Base UI   |   1.6.0 | `@base-ui/react`                       |
| Zag React |  1.42.0 | `@zag-js/react` and component packages |
| React     |  19.2.7 | `react`                                |

## Results

| Category                          | Scenario                       | Details                                                            | CPU | Metric                 | Starwind |    Base UI | Zag React |
| --------------------------------- | ------------------------------ | ------------------------------------------------------------------ | --: | ---------------------- | -------: | ---------: | --------: |
| baseline-open                     | Dialog open                    | 10k outside nodes, Enter-to-visible                                | 20x | event-to-visible       | 821.4 ms |   655.4 ms |  840.7 ms |
| baseline-open                     | Select open                    | 1000 items, Enter-to-visible                                       |  6x | event-to-visible       | 299.4 ms |   756.9 ms |  362.7 ms |
| baseline-hover                    | Select item highlight          | Open select, scripted pointermove sweep across 1000 items          |  1x | pointermove-sweep      |  43.5 ms |    15.5 ms |   20.1 ms |
| baseline-open                     | Menu open                      | 1000 items, Enter-to-visible                                       |  6x | event-to-visible       |  95.5 ms |   685.1 ms |  228.0 ms |
| baseline-mount                    | Tooltip trigger mount          | 1000 tooltip triggers, render + layout                             |  1x | render-layout          |  65.7 ms |    45.5 ms |   39.5 ms |
| closed-overlay-candidate          | Dialog trigger mount           | 1000 closed dialog triggers with content, render + layout          |  1x | render-layout          |  53.7 ms |   279.1 ms |   42.5 ms |
| closed-overlay-candidate          | Popover trigger mount          | 1000 closed popover triggers with content, render + layout         |  1x | render-layout          |  51.3 ms |   503.3 ms |   44.3 ms |
| closed-overlay-candidate          | Preview card trigger mount     | 1000 closed preview card triggers with content, render + layout    |  1x | render-layout          |  46.5 ms |   253.0 ms |   34.7 ms |
| baseline-mount                    | Select trigger mount           | 1000 select triggers, 10 items each, render + layout               |  1x | render-layout          |  47.5 ms |   264.2 ms |  194.9 ms |
| baseline-hover                    | Menu item highlight            | Open menu, scripted pointermove sweep across 1000 items            |  1x | pointermove-sweep      |  48.1 ms |    14.3 ms |   20.6 ms |
| combobox-candidate                | Combobox open                  | 1000 items, ArrowDown-to-visible                                   |  6x | event-to-visible       | 188.3 ms |   378.0 ms |  303.3 ms |
| combobox-candidate                | Combobox trigger mount         | 1000 combobox triggers, 10 items each, render + layout             |  1x | render-layout          |  53.9 ms |   437.0 ms |   65.7 ms |
| combobox-candidate                | Combobox item highlight        | Open combobox, scripted pointermove sweep across 1000 items        |  1x | pointermove-sweep      |  17.3 ms |    20.9 ms |   28.5 ms |
| combobox-candidate                | Combobox filter input          | Open combobox, type filter query, input-to-layout                  |  1x | input-to-layout        |  32.3 ms |    32.1 ms |   30.3 ms |
| nested-menu-candidate             | Menu submenu open              | Parent menu plus 1000-item submenu, activation-to-visible          |  6x | activation-to-visible  |  66.6 ms |   607.8 ms |  179.6 ms |
| nested-menu-candidate             | Menu submenu item highlight    | Open submenu, scripted pointermove sweep across 1000 submenu items |  1x | pointermove-sweep      |  43.4 ms |    17.0 ms |   19.2 ms |
| navigation-menu-candidate         | Navigation menu content switch | Large navigation content switch, click-to-visible                  |  1x | content-switch-visible |  31.8 ms |    31.5 ms |   49.8 ms |
| non-floating-collection-candidate | Tabs high-count mount          | 1000 tabs and 1000 keep-mounted panels, render + layout            |  1x | render-layout          |  24.2 ms |   101.2 ms |   18.4 ms |
| non-floating-collection-candidate | Tabs activation click          | 1000 tabs and panels, last tab click-to-panel                      |  1x | tab-click-to-panel     |  32.7 ms |    94.9 ms |   42.5 ms |
| non-floating-collection-candidate | Accordion high-count mount     | 1000 closed accordion items with mounted panels, render + layout   |  1x | render-layout          |  33.7 ms |    80.1 ms |   20.9 ms |
| non-floating-collection-candidate | Accordion toggle click         | 1000 closed accordion items, last trigger click-to-panel           |  1x | toggle-click-to-panel  |  33.3 ms |    66.2 ms |   45.3 ms |
| non-floating-collection-candidate | Radio Group high-count mount   | 1000 radio items in one group, render + layout                     |  1x | render-layout          |  59.3 ms |   299.4 ms |   38.9 ms |
| non-floating-collection-candidate | Radio Group change sweep       | Scripted click sweep across 1000 radio items                       |  1x | radio-click-sweep      | 151.8 ms | 44996.1 ms | 1044.1 ms |

## Reading The Numbers

- Treat this as a local comparator and regression tracker, not a universal benchmark claim.
- Prefer relative comparisons within the same run; CPU, browser, power mode, and background work can move absolute timings.
- The open-row metric is an automated event-to-visible marker measurement. For a stricter public benchmark, the next iteration should parse DevTools trace events and identify the exact visible paint after the input event.
- The mount rows intentionally include render and forced layout, but not network or initial bundle parse.
- The highlight row intentionally dispatches pointer events over mounted items. A separate manual UX trace could measure real cursor movement and scroll behavior.

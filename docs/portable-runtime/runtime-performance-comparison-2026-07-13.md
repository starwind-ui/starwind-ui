# Runtime Performance Comparison

Generated: 2026-07-13

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
| baseline-open                     | Dialog open                    | 10k outside nodes, Enter-to-visible                                | 20x | event-to-visible       | 821.6 ms |   634.6 ms |  780.3 ms |
| baseline-open                     | Select open                    | 1000 items, Enter-to-visible                                       |  6x | event-to-visible       | 312.7 ms |   724.3 ms |  359.5 ms |
| baseline-hover                    | Select item highlight          | Open select, scripted pointermove sweep across 1000 items          |  1x | pointermove-sweep      |  42.6 ms |    16.1 ms |   20.5 ms |
| baseline-open                     | Menu open                      | 1000 items, Enter-to-visible                                       |  6x | event-to-visible       | 101.8 ms |   688.0 ms |  222.9 ms |
| baseline-mount                    | Tooltip trigger mount          | 1000 tooltip triggers, render + layout                             |  1x | render-layout          |  68.5 ms |    51.1 ms |   39.9 ms |
| closed-overlay-candidate          | Dialog trigger mount           | 1000 closed dialog triggers with content, render + layout          |  1x | render-layout          |  53.7 ms |   284.1 ms |   44.4 ms |
| closed-overlay-candidate          | Popover trigger mount          | 1000 closed popover triggers with content, render + layout         |  1x | render-layout          |  55.7 ms |   512.5 ms |   46.2 ms |
| closed-overlay-candidate          | Preview card trigger mount     | 1000 closed preview card triggers with content, render + layout    |  1x | render-layout          |  48.2 ms |   261.9 ms |   36.2 ms |
| baseline-mount                    | Select trigger mount           | 1000 select triggers, 10 items each, render + layout               |  1x | render-layout          |  48.4 ms |   273.4 ms |  212.5 ms |
| baseline-hover                    | Menu item highlight            | Open menu, scripted pointermove sweep across 1000 items            |  1x | pointermove-sweep      |  44.2 ms |    14.9 ms |   21.6 ms |
| combobox-candidate                | Combobox open                  | 1000 items, ArrowDown-to-visible                                   |  6x | event-to-visible       | 199.3 ms |   442.4 ms |  355.2 ms |
| combobox-candidate                | Combobox trigger mount         | 1000 combobox triggers, 10 items each, render + layout             |  1x | render-layout          |  56.7 ms |   437.8 ms |   66.6 ms |
| combobox-candidate                | Combobox item highlight        | Open combobox, scripted pointermove sweep across 1000 items        |  1x | pointermove-sweep      |  18.5 ms |    19.2 ms |   29.8 ms |
| combobox-candidate                | Combobox filter input          | Open combobox, type filter query, input-to-layout                  |  1x | input-to-layout        |  32.5 ms |    32.5 ms |   29.9 ms |
| nested-menu-candidate             | Menu submenu open              | Parent menu plus 1000-item submenu, activation-to-visible          |  6x | activation-to-visible  |  67.4 ms |   613.0 ms |  186.0 ms |
| nested-menu-candidate             | Menu submenu item highlight    | Open submenu, scripted pointermove sweep across 1000 submenu items |  1x | pointermove-sweep      |  42.8 ms |    17.0 ms |   19.7 ms |
| navigation-menu-candidate         | Navigation menu content switch | Large navigation content switch, click-to-visible                  |  1x | content-switch-visible |  32.3 ms |    32.9 ms |   50.1 ms |
| non-floating-collection-candidate | Tabs high-count mount          | 1000 tabs and 1000 keep-mounted panels, render + layout            |  1x | render-layout          |  24.9 ms |   102.9 ms |   22.0 ms |
| non-floating-collection-candidate | Tabs activation click          | 1000 tabs and panels, last tab click-to-panel                      |  1x | tab-click-to-panel     |  33.0 ms |   100.1 ms |   40.5 ms |
| non-floating-collection-candidate | Accordion high-count mount     | 1000 closed accordion items with mounted panels, render + layout   |  1x | render-layout          |  35.9 ms |    97.3 ms |   22.5 ms |
| non-floating-collection-candidate | Accordion toggle click         | 1000 closed accordion items, last trigger click-to-panel           |  1x | toggle-click-to-panel  |  33.1 ms |    66.9 ms |   45.7 ms |
| non-floating-collection-candidate | Radio Group high-count mount   | 1000 radio items in one group, render + layout                     |  1x | render-layout          |  60.5 ms |   575.4 ms |   54.9 ms |
| non-floating-collection-candidate | Radio Group change sweep       | Scripted click sweep across 1000 radio items                       |  1x | radio-click-sweep      | 186.2 ms | 49772.7 ms | 1062.0 ms |

## Reading The Numbers

- Treat this as a local comparator and regression tracker, not a universal benchmark claim.
- Prefer relative comparisons within the same run; CPU, browser, power mode, and background work can move absolute timings.
- The open-row metric is an automated event-to-visible marker measurement. For a stricter public benchmark, the next iteration should parse DevTools trace events and identify the exact visible paint after the input event.
- The mount rows intentionally include render and forced layout, but not network or initial bundle parse.
- The highlight row intentionally dispatches pointer events over mounted items. A separate manual UX trace could measure real cursor movement and scroll behavior.

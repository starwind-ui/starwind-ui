# Svelte Primitive interaction timings

Captured: 2026-09-15T13:58:09.628Z

Starwind is a Svelte development build. Comparators: Ark UI 5.24.2 and Bits UI 2.19.2.

## Quick comparison

**Opening controls:** Starwind's first-open median is 41% shorter than Ark UI and 59% shorter than Bits UI on the twenty-Select page. Native Dialog opening is 76% shorter than Ark UI and 72% shorter than Bits UI.

**Collection setup and filtering:** Starwind's 500-item Combobox mount is 176% longer than Ark UI and 224% longer than Bits UI; its filter interval is 56% longer than Ark UI and 150% longer than Bits UI. Use the absolute times below to judge the size of these differences.

All values below are **median milliseconds from five runs**. Lower means less elapsed time to the checked DOM state. Page setup and interaction have separate clocks.

### Page setup

This includes mounting the controls and their initial DOM after JavaScript modules have loaded.

| Page                                | Starwind | Ark UI | Bits UI |
| ----------------------------------- | -------: | -----: | ------: |
| One Select                          |      8.5 |    8.2 |     6.4 |
| Twenty Selects                      |     23.8 |   20.5 |    12.0 |
| Combobox with 500 items             |     20.4 |    7.4 |     6.3 |
| Dialog plus 10,000 background spans |     22.9 |   23.3 |    22.8 |

### Selected interactions

| Action                                   | Starwind | Ark UI | Bits UI |
| ---------------------------------------- | -------: | -----: | ------: |
| Open a Select on the twenty-control page |      2.6 |    4.4 |     6.4 |
| Accept the selected option               |      1.3 |    7.7 |     7.5 |
| Open the 500-item Combobox               |      6.6 |   37.4 |    21.3 |
| Filter 500 items to ten matches          |      2.5 |    1.6 |     1.0 |
| Open the modal Dialog                    |      7.4 |   31.0 |    26.2 |
| Close Dialog with Escape                 |     16.8 |   22.9 |     6.9 |
| Close Dialog with its button             |     15.8 |   20.7 |    15.4 |

The opening result is one part of each task. Compare setup, filtering and closing as well. Starwind and Ark retain authored collection nodes while closed; Bits creates those nodes when opened. The fixtures therefore distribute work across different phases. DOM counts and all remaining endpoints appear below.

Every captured flow passed its outcome and cleanup checks. Starwind Dialog used native modal presentation; the Dialog checks included focus containment and blocked background interaction. Five runs on one desktop provide a targeted engineering check. Small differences can depend on scheduling and observation overhead, and these medians do not establish a general library ranking.

<details>
<summary>All five-run results, DOM counts and measurement method</summary>

Each provider and workload has one excluded warmup followed by five measured fresh browser contexts. The complete capture contains 12 warmups and 60 measured contexts. A seeded initial provider order rotates one position per round with recorded seed 20260915. Each provider appears twice at every position across its six contexts.

Values are milliseconds, displayed to three decimal places. Each row shows the five independent context values, median and range. Navigation gives one mean per context from its actual ArrowDown keys. Those keys are not independent runs.

## select-page-1

| Provider | Endpoint   | Five context values (ms)          | Median | Range       |
| -------- | ---------- | --------------------------------- | ------ | ----------- |
| Starwind | mount      | 8.500, 8.400, 8.500, 8.600, 8.500 | 8.500  | 8.400–8.600 |
| Starwind | open       | 2.300, 2.300, 2.400, 2.400, 2.400 | 2.400  | 2.300–2.400 |
| Starwind | escape     | 0.900, 0.800, 0.800, 1.000, 0.900 | 0.900  | 0.800–1.000 |
| Starwind | reopen     | 1.000, 0.900, 1.000, 0.800, 1.000 | 1.000  | 0.800–1.000 |
| Starwind | navigation | 0.200, 0.150, 0.200, 0.150, 0.250 | 0.200  | 0.150–0.250 |
| Starwind | choose     | 1.000, 1.100, 1.100, 1.000, 1.100 | 1.100  | 1.000–1.100 |
| Ark UI   | mount      | 8.200, 8.100, 8.100, 8.400, 8.200 | 8.200  | 8.100–8.400 |
| Ark UI   | open       | 4.700, 4.600, 4.700, 4.500, 4.700 | 4.700  | 4.500–4.700 |
| Ark UI   | escape     | 8.800, 4.800, 7.100, 9.000, 7.200 | 7.200  | 4.800–9.000 |
| Ark UI   | reopen     | 3.000, 2.900, 2.800, 2.900, 3.000 | 2.900  | 2.800–3.000 |
| Ark UI   | navigation | 1.850, 1.900, 1.900, 2.000, 1.850 | 1.900  | 1.850–2.000 |
| Ark UI   | choose     | 7.300, 8.100, 8.500, 7.400, 7.500 | 7.500  | 7.300–8.500 |
| Bits UI  | mount      | 6.300, 6.200, 6.400, 6.400, 6.500 | 6.400  | 6.200–6.500 |
| Bits UI  | open       | 6.500, 6.300, 6.200, 6.300, 6.400 | 6.300  | 6.200–6.500 |
| Bits UI  | escape     | 6.900, 7.400, 7.200, 6.700, 7.100 | 7.100  | 6.700–7.400 |
| Bits UI  | reopen     | 2.000, 2.200, 2.200, 2.000, 2.300 | 2.200  | 2.000–2.300 |
| Bits UI  | navigation | 0.400, 0.400, 0.400, 0.500, 0.500 | 0.400  | 0.400–0.500 |
| Bits UI  | choose     | 7.300, 7.400, 8.500, 8.200, 7.400 | 7.400  | 7.300–8.500 |

## select-page-20

| Provider | Endpoint   | Five context values (ms)               | Median | Range         |
| -------- | ---------- | -------------------------------------- | ------ | ------------- |
| Starwind | mount      | 24.400, 23.800, 23.900, 23.800, 23.800 | 23.800 | 23.800–24.400 |
| Starwind | open       | 2.600, 2.600, 2.600, 2.600, 2.600      | 2.600  | 2.600–2.600   |
| Starwind | escape     | 1.200, 1.100, 1.200, 1.200, 1.200      | 1.200  | 1.100–1.200   |
| Starwind | reopen     | 1.200, 1.100, 1.200, 1.000, 1.100      | 1.100  | 1.000–1.200   |
| Starwind | navigation | 0.200, 0.300, 0.200, 0.200, 0.200      | 0.200  | 0.200–0.300   |
| Starwind | choose     | 1.300, 1.300, 1.300, 1.200, 1.400      | 1.300  | 1.200–1.400   |
| Ark UI   | mount      | 20.200, 20.600, 20.500, 20.300, 20.500 | 20.500 | 20.200–20.600 |
| Ark UI   | open       | 4.500, 4.400, 4.600, 4.200, 4.300      | 4.400  | 4.200–4.600   |
| Ark UI   | escape     | 6.900, 9.000, 8.700, 7.900, 7.100      | 7.900  | 6.900–9.000   |
| Ark UI   | reopen     | 2.700, 2.600, 2.700, 2.600, 2.600      | 2.600  | 2.600–2.700   |
| Ark UI   | navigation | 1.800, 1.800, 2.000, 1.750, 1.900      | 1.800  | 1.750–2.000   |
| Ark UI   | choose     | 7.700, 8.400, 7.600, 9.500, 7.500      | 7.700  | 7.500–9.500   |
| Bits UI  | mount      | 12.100, 11.700, 12.000, 11.600, 12.000 | 12.000 | 11.600–12.100 |
| Bits UI  | open       | 6.400, 6.700, 6.300, 6.300, 6.400      | 6.400  | 6.300–6.700   |
| Bits UI  | escape     | 7.200, 7.200, 6.800, 7.100, 7.200      | 7.200  | 6.800–7.200   |
| Bits UI  | reopen     | 2.000, 2.000, 2.100, 2.000, 2.000      | 2.000  | 2.000–2.100   |
| Bits UI  | navigation | 0.400, 0.450, 0.450, 0.450, 0.400      | 0.450  | 0.400–0.450   |
| Bits UI  | choose     | 7.400, 7.400, 7.500, 9.000, 7.500      | 7.500  | 7.400–9.000   |

## combobox-500

| Provider | Endpoint   | Five context values (ms)               | Median | Range         |
| -------- | ---------- | -------------------------------------- | ------ | ------------- |
| Starwind | mount      | 20.400, 20.300, 20.500, 20.400, 20.200 | 20.400 | 20.200–20.500 |
| Starwind | open       | 6.500, 6.600, 6.700, 6.600, 6.700      | 6.600  | 6.500–6.700   |
| Starwind | filter     | 2.600, 2.400, 2.600, 2.500, 2.500      | 2.500  | 2.400–2.600   |
| Starwind | navigation | 0.167, 0.133, 0.233, 0.200, 0.133      | 0.167  | 0.133–0.233   |
| Starwind | choose     | 4.000, 4.000, 3.900, 3.900, 3.500      | 3.900  | 3.500–4.000   |
| Ark UI   | mount      | 7.400, 7.500, 7.200, 7.300, 7.700      | 7.400  | 7.200–7.700   |
| Ark UI   | open       | 37.500, 37.400, 36.700, 37.300, 39.200 | 37.400 | 36.700–39.200 |
| Ark UI   | filter     | 1.600, 1.600, 1.600, 1.600, 1.600      | 1.600  | 1.600–1.600   |
| Ark UI   | navigation | 1.133, 1.167, 1.133, 1.133, 1.200      | 1.133  | 1.133–1.200   |
| Ark UI   | choose     | 7.200, 7.300, 7.300, 7.100, 7.600      | 7.300  | 7.100–7.600   |
| Bits UI  | mount      | 6.300, 6.300, 6.200, 6.300, 6.100      | 6.300  | 6.100–6.300   |
| Bits UI  | open       | 21.500, 21.400, 21.300, 21.300, 20.900 | 21.300 | 20.900–21.500 |
| Bits UI  | filter     | 0.900, 1.100, 1.000, 1.000, 1.100      | 1.000  | 0.900–1.100   |
| Bits UI  | navigation | 0.250, 0.300, 0.350, 0.300, 0.300      | 0.300  | 0.250–0.350   |
| Bits UI  | choose     | 7.600, 7.600, 7.600, 7.600, 8.600      | 7.600  | 7.600–8.600   |

## dialog-dense-10000

| Provider | Endpoint     | Five context values (ms)               | Median | Range         |
| -------- | ------------ | -------------------------------------- | ------ | ------------- |
| Starwind | mount        | 22.900, 22.800, 23.400, 22.900, 23.400 | 22.900 | 22.800–23.400 |
| Starwind | open         | 7.600, 7.500, 7.400, 7.400, 7.400      | 7.400  | 7.400–7.600   |
| Starwind | escape       | 18.700, 16.800, 16.700, 13.400, 17.100 | 16.800 | 13.400–18.700 |
| Starwind | reopen       | 6.600, 6.700, 6.600, 6.600, 6.500      | 6.600  | 6.500–6.700   |
| Starwind | button-close | 13.700, 18.100, 15.300, 15.800, 15.800 | 15.800 | 13.700–18.100 |
| Ark UI   | mount        | 23.000, 23.600, 23.200, 25.400, 23.300 | 23.300 | 23.000–25.400 |
| Ark UI   | open         | 31.100, 31.000, 31.100, 31.000, 30.600 | 31.000 | 30.600–31.100 |
| Ark UI   | escape       | 21.400, 23.200, 22.900, 23.000, 22.800 | 22.900 | 21.400–23.200 |
| Ark UI   | reopen       | 14.400, 14.300, 14.200, 14.200, 14.300 | 14.300 | 14.200–14.400 |
| Ark UI   | button-close | 20.700, 19.500, 20.900, 20.700, 20.800 | 20.700 | 19.500–20.900 |
| Bits UI  | mount        | 22.800, 22.700, 22.800, 23.100, 23.100 | 22.800 | 22.700–23.100 |
| Bits UI  | open         | 25.700, 26.200, 26.500, 26.400, 26.200 | 26.200 | 25.700–26.500 |
| Bits UI  | escape       | 7.000, 5.100, 6.900, 6.800, 7.200      | 6.900  | 5.100–7.200   |
| Bits UI  | reopen       | 12.800, 12.700, 12.500, 13.300, 12.700 | 12.700 | 12.500–13.300 |
| Bits UI  | button-close | 15.400, 15.100, 15.400, 15.200, 15.400 | 15.400 | 15.100–15.400 |

## Observed DOM

These counts cover body descendants across the five measured contexts. The item columns count authored collection nodes. Provider presence policies affect when these nodes mount.

| Provider | Workload           | Closed elements | Open elements | Closed items | Open items |
| -------- | ------------------ | --------------- | ------------- | ------------ | ---------- |
| Starwind | select-page-1      | 54              | 54            | 20           | 20         |
| Starwind | select-page-20     | 1023            | 1023          | 400          | 400        |
| Starwind | combobox-500       | 1015            | 1015          | 500          | 500        |
| Starwind | dialog-dense-10000 | 10016           | 10016         | 0            | 0          |
| Ark UI   | select-page-1      | 73              | 73            | 20           | 20         |
| Ark UI   | select-page-20     | 1403            | 1403          | 400          | 400        |
| Ark UI   | combobox-500       | 1013            | 1013          | 500          | 500        |
| Ark UI   | dialog-dense-10000 | 10015           | 10015         | 0            | 0          |
| Bits UI  | select-page-1      | 8               | 31            | 0            | 20         |
| Bits UI  | select-page-20     | 103             | 126           | 0            | 20         |
| Bits UI  | combobox-500       | 9               | 512           | 0            | 500        |
| Bits UI  | dialog-dense-10000 | 10008           | 10014         | 0            | 0          |

## Workloads and supported behavior

Select pages contain either one or twenty controls with twenty options each. Each begins at option-1, marks option-3 disabled and selects option-4. The twenty-control flow operates control 10 and checks that other form values remain unchanged. Actual navigation paths and key counts are in the evidence.

Combobox renders 500 items labeled Item 001 through Item 500. Preparation types Item 0 outside the filtering interval. The final 4 starts the filter interval, which ends only when the actual visible result set is item-040 through item-049. Keyboard navigation then accepts item-042. Input echo alone cannot complete filtering.

Dialog sits beside one sibling container holding 10,000 text spans. Mount includes rendering all those spans. The flow opens, closes with Escape, reopens and closes with its button while retaining the same root instance. Open requires accepted state, visible content and focus inside. Close requires closed state, hidden or removed content and trigger focus. Starwind uses its generated native dialog Popup and Runtime showModal path. Each context verifies native modal state where applicable, Tab and Shift+Tab containment, blocked background activation, trusted wheel scroll blocking and restoration, then cleanup while unmounting an open modal.

## Provider differences

Starwind uses accepted scalar values and Runtime contains filtering over authored Combobox items. Ark uses array values, its required derived collection for host substring filtering, and a host hidden input for the selected Combobox value. Bits uses scalar values, native form serialization and host substring filtering of authored items. All required filtering and collection work remains inside the measured interaction. Select form values use each library's supported native serialization.

Default focus, portal and presence policies remain active. Closed DOM and disabled-item focus paths can differ. Bits exposes its disabled marker as data-disabled; its Select fixture also verifies that a trusted click cannot select that item. The evidence records DOM counts and actual paths per context. Common CSS sets geometry and disables decorative transitions. These are Primitive compositions. Styled components and copied theme CSS are excluded.

## Inputs

| Package                      | Version |
| ---------------------------- | ------- |
| @starwind-ui/svelte          | 0.0.0   |
| @starwind-ui/runtime         | 1.2.1   |
| @ark-ui/svelte               | 5.24.2  |
| bits-ui                      | 2.19.2  |
| svelte                       | 5.57.0  |
| vite                         | 7.3.5   |
| @sveltejs/vite-plugin-svelte | 6.2.1   |
| @internationalized/date      | 3.12.4  |
| @floating-ui/dom             | 1.7.6   |
| embla-carousel               | 8.6.0   |

Browser: Chromium 151.0.7922.34, Playwright 1.62.0, headed at 1280 by 900 with device scale factor 1 and native CPU speed. Host: darwin arm64, Apple M5 Pro, 18 logical CPUs, Node v24.20.0.

## Method and limits

One production build per provider uses the same frozen Svelte compiler and official Vite plugin. Each fresh context loads its module before mount timing starts. Browser input is trusted mouse or keyboard delivery. Endpoints use public DOM and accepted host state, with mutation observation and frame checks. Their duration includes observer and validation overhead. Between intervals, untimed input-readiness checks let deferred pointer blocking and presence cleanup settle before the next action. Close timing ends at closed state, hidden or removed content and restored trigger focus. Untimed modal checks also wait for document styles to restore.

The measurements describe checked DOM completion. They do not certify painted pixels, INP or isolated JavaScript CPU time. Event Timing is retained as thresholded diagnostics; a missing entry remains unavailable. Five contexts do not establish a stable tail percentile or a release budget. Browser cache and system scheduling can affect results. Provider surfaces and behavior differ, so these tasks do not isolate framework glue by subtraction.

[Five-value evidence, actual key paths and input digests](performance-evidence/svelte/2026-09-15-timing-af00c7178e56/timings.json) reproduce the tables. Component API sources are the [Ark UI documentation](https://ark-ui.com/docs/components/combobox) and [Bits UI documentation](https://www.bits-ui.com/docs/components/combobox). The [Svelte mount API](https://svelte.dev/docs/svelte/svelte#mount) defines the framework entry point.

</details>

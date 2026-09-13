# Performance evidence

[Measurements](./measurements.json) contain the original timing values used by the [comparison report](../../runtime-performance-comparison.md), plus capture dates, environment details, provider versions, and source identities. These are extracted from validated saved captures; this export performs no browser measurements.

Each provider and workload has one excluded warmup context and five measured fresh contexts. Every sample in this file belongs to a measured context. Average the values in each sample's `valuesMs` array, then average the five sample means equally to reproduce `meanMs`. The report rounds only the displayed result to one decimal place.

Menu has 20 actions; Select has 100 options; Combobox has 500 items; Submenu has eight parents with eight children; each Select page control has 20 options. Dialog opens beside 10,000 outside nodes. Navigation Menu switches between two 500-link panels. Tabs, Accordion, and Radio Group each contain 1,000 items; Tabs and Accordion retain all panels.

Mount timing starts at React render after modules load. Interaction timing ends at a checked DOM state. Paint is outside both measurements. The captures use native CPU speed and one active page. Unknown host settings remain recorded as unknown. The source identities describe the captured implementation; later source changes do not alter these historical measurements.

The benchmark implementation lives under `scripts/portable-runtime/runtime-performance`. Run `pnpm runtime:perf` for a fresh native comparison with one warmup and five measurements, or `pnpm runtime:perf:stress` to refresh large workloads.

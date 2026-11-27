<!-- Svelte form of the chart spec part cases. -->
<script lang="ts">
  import {
    ChartArea,
    ChartBar,
    ChartContainer,
    ChartGrid,
    ChartLabel,
    ChartLegend,
    ChartLine,
    ChartLinearGradient,
    ChartPie,
    ChartPolarAngleAxis,
    ChartPolarGrid,
    ChartRadar,
    ChartRadialBar,
    ChartTooltip,
    ChartTooltipContent,
    ChartXAxis,
    ChartYAxis,
  } from "../../../../../apps/svelte-demo/src/lib/starwind-runtime/chart";
  import {
    areaChart,
    barChart,
    browserConfig,
    browserData,
    donutChart,
    lineChart,
    monthConfig,
    radarChart,
    radialChart,
    visitorConfig,
    visitorData,
  } from "../../../../../packages/runtime/tests/components/chart/reference-charts";
  import type { SpecCase } from "./cases";
  import {
    legendFirstConfig,
    nestedLabel,
    nestedStops,
    shadcnGradient,
    shadcnPie,
    shadcnTopLabel,
    tooltipKeysConfig,
  } from "./spec-charts";
  import WrappedBar from "./WrappedBar.svelte";
  import type { ParityControls } from "./controls";

  let { mode, controls = {} }: { mode: SpecCase; controls?: ParityControls } = $props();

  let radius = $state(4);
  let showMobile = $state(true);
  let renders = $state(0);
  let currency = $state<"usd" | "eur">("usd");
  let cursor = $state(false);
  let cursors = $state<[boolean | undefined, boolean | undefined]>([undefined, false]);
  let showFirst = $state(true);
  const label = $state(nestedLabel());
  const stops = $state(nestedStops());
  // svelte-ignore state_referenced_locally
  Object.assign(controls, {
    editNested: () => {
      label.formatter.prefix = "€";
      stops[0]!.stopColor = "blue";
    },
    setCursors: (first: boolean | undefined, second: boolean | undefined) =>
      (cursors = [first, second]),
    removeFirst: () => (showFirst = false),
    toggleCursor: () => (cursor = !cursor),
    setRadius: (next: number) => (radius = next),
    toggleMobile: () => (showMobile = !showMobile),
    toggleCurrency: () => (currency = currency === "usd" ? "eur" : "usd"),
    rerender: () => renders++,
  });

  const charts = {
    bar: { module: barChart, data: visitorData, config: visitorConfig },
    area: { module: areaChart, data: visitorData, config: visitorConfig },
    line: { module: lineChart, data: visitorData, config: visitorConfig },
    donut: { module: donutChart, data: visitorData, config: monthConfig },
    radar: { module: radarChart, data: visitorData, config: visitorConfig },
    radial: { module: radialChart, data: browserData, config: browserConfig },
  };
  const kind = $derived(mode.replace(/^spec-(module-)?/, "") as keyof typeof charts);
  const chart = $derived(charts[kind]);
  const id = $derived(`spec-${kind}`);
  const slice = (value: string) => value.slice(0, 3);
  const dollars = (value: number) => `$${value}`;
  const euros = (value: number) => `€${value}`;
  const money = $derived(currency === "usd" ? dollars : euros);
  const barLabel = $derived({ ...shadcnTopLabel, formatter: money });
</script>

{#snippet keys()}<ChartTooltipContent nameKey="views" labelKey="activities" />{/snippet}
{#snippet hideLabel()}<ChartTooltipContent hideLabel />{/snippet}
{#snippet visits()}<ChartTooltipContent formatter={{ suffix: " visits" }} />{/snippet}

{#if mode === "spec-live"}
  <ChartContainer id="spec-live" data={visitorData} config={visitorConfig} data-renders={renders}>
    <ChartGrid vertical={false} />
    <ChartXAxis dataKey="month" tickFormatter={slice} />
    <ChartYAxis tickFormatter={money} />
    <ChartBar dataKey="desktop" {radius} />
    {#if showMobile}<ChartBar dataKey="mobile" {radius} />{/if}
    <ChartLegend />
    <ChartTooltip content={visits} />
  </ChartContainer>
{:else if mode === "spec-options"}
  <ChartContainer id="spec-options" data={visitorData} config={visitorConfig} stackOffset="expand">
    <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
    <ChartYAxis />
    <ChartBar dataKey="desktop" stackId="a" />
    <ChartBar dataKey="mobile" stackId="a" />
    <ChartTooltip {cursor} />
  </ChartContainer>
{:else if mode === "spec-cursor-order"}
  <ChartContainer id="spec-cursor-order" data={visitorData} config={visitorConfig}>
    <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
    <ChartBar dataKey="desktop" />
    {#if showFirst}<ChartTooltip cursor={cursors[0]} />{/if}
    <ChartTooltip cursor={cursors[1]} />
  </ChartContainer>
{:else if mode === "spec-labels"}
  <div>
    <ChartContainer id="spec-labels-bar" data={visitorData} config={visitorConfig} data-renders={renders}>
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickMargin={10} tickFormatter={{ maxLength: 3 }} />
      <ChartBar dataKey="desktop" radius={8} label={barLabel} />
    </ChartContainer>
    <ChartContainer id="spec-labels-line" data={shadcnPie.data} config={shadcnPie.config}>
      <ChartGrid vertical={false} />
      <ChartLine
        dataKey="visitors"
        label={{ ...shadcnTopLabel, dataKey: "browser", formatter: { configLabel: true } }}
      />
    </ChartContainer>
    <ChartContainer id="spec-labels-pie" data={shadcnPie.data} config={shadcnPie.config}>
      <ChartPie dataKey="visitors" nameKey="browser" label />
    </ChartContainer>
  </div>
{:else if mode === "spec-nested"}
  <ChartContainer id="spec-nested" data={visitorData} config={visitorConfig}>
    <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
    <ChartLinearGradient id="fill-nested" {stops} />
    <ChartBar dataKey="desktop" fill="url(#fill-nested)" {label} />
  </ChartContainer>
{:else if mode === "spec-legend-first"}
  <ChartContainer id="spec-legend-first" data={visitorData} config={legendFirstConfig}>
    <ChartLegend />
    <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
    <ChartBar dataKey="desktop" />
    {#if showMobile}<ChartBar dataKey="mobile" />{/if}
    <ChartLegend />
  </ChartContainer>
{:else if mode === "spec-legend-wrapped"}
  <ChartContainer id="spec-legend-wrapped" data={visitorData} config={visitorConfig}>
    <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
    <ChartBar dataKey="desktop" />
    <WrappedBar dataKey="mobile" />
    <ChartLegend />
  </ChartContainer>
{:else if mode === "spec-gradient"}
  <div>
    {#each ["desktop", "mobile"] as key (key)}
      <ChartContainer id={`spec-gradient-${key}`} data={visitorData} config={visitorConfig}>
        <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
        <ChartLinearGradient {...shadcnGradient(`var(--color-${key})`)} />
        <ChartArea dataKey={key} fill="url(#fillArea)" />
      </ChartContainer>
    {/each}
  </div>
{:else if mode === "spec-pie-text"}
  <ChartContainer id="spec-pie-text" data={shadcnPie.data} config={shadcnPie.config}>
    <ChartLegend />
    <ChartPie dataKey="visitors" nameKey="browser" innerRadius={60} stroke="none" />
    <ChartLabel position="center" fontWeight={700} />
    <ChartLabel
      position="center"
      value="Visitors"
      dy={24}
      fontSize={12}
      fill="var(--muted-foreground)"
    />
  </ChartContainer>
{:else if mode === "spec-tooltip-keys"}
  <ChartContainer id="spec-tooltip-keys" data={visitorData} config={tooltipKeysConfig}>
    <ChartXAxis dataKey="month" />
    <ChartBar dataKey="desktop" />
    <ChartBar dataKey="mobile" />
    <ChartTooltip content={keys} />
  </ChartContainer>
{:else if mode === "spec-radar-grid"}
  <ChartContainer id="spec-radar-grid" data={visitorData} config={visitorConfig}>
    <ChartPolarGrid
      radialLines={false}
      polarRadius={[90]}
      strokeWidth={2}
      fill="var(--color-desktop)"
      fillOpacity={0.2}
    />
    <ChartPolarAngleAxis dataKey="month" />
    <ChartRadar dataKey="desktop" dot activeDot={{ r: 6 }} />
  </ChartContainer>
{:else if mode === "spec-combined"}
  <ChartContainer id="spec-combined" chart={barChart} data={visitorData} config={visitorConfig}>
    <ChartBar dataKey="desktop" />
  </ChartContainer>
{:else if mode === "spec-no-axis"}
  <ChartContainer id="spec-no-axis" data={visitorData} config={visitorConfig}>
    <ChartGrid vertical={false} />
    <ChartBar dataKey="desktop" radius={4} />
    <ChartBar dataKey="mobile" radius={4} />
  </ChartContainer>
{:else if mode === "spec-empty"}
  <ChartContainer id="spec-empty-svelte" data={visitorData} config={visitorConfig} />
{:else if mode.startsWith("spec-module-")}
  <ChartContainer {id} chart={chart.module} data={chart.data} config={chart.config}>
    {#if kind === "bar"}<ChartLegend />{/if}
  </ChartContainer>
{:else}
  <ChartContainer {id} data={chart.data} config={chart.config} aria-label={chart.module.ariaLabel}>
    {#if kind === "bar"}
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartYAxis />
      <ChartBar dataKey="desktop" radius={4} />
      <ChartBar dataKey="mobile" radius={4} />
      <ChartLegend />
    {:else if kind === "area"}
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartYAxis />
      <ChartArea dataKey="desktop" type="monotone" stackId="a" />
      <ChartArea dataKey="mobile" type="monotone" stackId="a" />
    {:else if kind === "line"}
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartLine dataKey="desktop" type="natural" />
      <ChartTooltip content={hideLabel} />
    {:else if kind === "donut"}
      <ChartPie dataKey="desktop" nameKey="month" innerRadius="58.5%" />
      <ChartLabel position="center" />
    {:else if kind === "radar"}
      <ChartPolarGrid />
      <ChartPolarAngleAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartRadar dataKey="desktop" />
      <ChartRadar dataKey="mobile" />
    {:else}
      <ChartRadialBar dataKey="visitors" nameKey="browser" background />
    {/if}
  </ChartContainer>
{/if}

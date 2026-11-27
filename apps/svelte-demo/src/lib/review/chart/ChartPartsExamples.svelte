<!-- The six docs charts built from chart parts. They need no chart module. The bar chart formats
its ticks with a function, which Svelte parts accept. -->
<script lang="ts">
  import {
    ChartArea,
    ChartBar,
    ChartContainer,
    ChartGrid,
    ChartLabel,
    ChartLegend,
    ChartLine,
    ChartPie,
    ChartPolarAngleAxis,
    ChartPolarGrid,
    ChartRadar,
    ChartRadialBar,
    ChartTooltip,
    ChartTooltipContent,
    ChartXAxis,
    ChartYAxis,
  } from "$lib/starwind-runtime/chart";
  import { monthConfig, visitorConfig, visitorData } from "./chart-recipes";

  const browserData = ["chrome", "safari", "firefox", "edge", "other"].map((browser, i) => ({
    browser,
    visitors: [275, 200, 187, 173, 90][i]!,
  }));
  const browserConfig = {
    visitors: { label: "Visitors" },
    chrome: { label: "Chrome", color: "var(--chart-1)" },
    safari: { label: "Safari", color: "var(--chart-2)" },
    firefox: { label: "Firefox", color: "var(--chart-3)" },
    edge: { label: "Edge", color: "var(--chart-4)" },
    other: { label: "Other", color: "var(--chart-5)" },
  };
  const shortMonth = (value: string) => value.slice(0, 3);
</script>

<div class="grid gap-6 md:grid-cols-2" data-testid="chart-parts-examples">
  <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="bar">
    <h4 class="text-lg font-semibold">Bar chart</h4>
    <ChartContainer config={visitorConfig} data={visitorData}>
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={shortMonth} />
      <ChartYAxis />
      <ChartBar dataKey="desktop" radius={4} />
      <ChartBar dataKey="mobile" radius={4} />
      <ChartLegend />
    </ChartContainer>
  </article>

  <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="area">
    <h4 class="text-lg font-semibold">Area chart</h4>
    <ChartContainer config={visitorConfig} data={visitorData}>
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartYAxis />
      <ChartArea dataKey="desktop" type="monotone" stackId="a" />
      <ChartArea dataKey="mobile" type="monotone" stackId="a" />
      <ChartTooltip>
        {#snippet content()}<ChartTooltipContent indicator="line" />{/snippet}
      </ChartTooltip>
      <ChartLegend />
    </ChartContainer>
  </article>

  <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="line">
    <h4 class="text-lg font-semibold">Line chart</h4>
    <ChartContainer config={visitorConfig} data={visitorData}>
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartLine dataKey="desktop" />
      <ChartTooltip>
        {#snippet content()}<ChartTooltipContent hideLabel />{/snippet}
      </ChartTooltip>
    </ChartContainer>
  </article>

  <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="donut">
    <h4 class="text-lg font-semibold">Donut chart</h4>
    <ChartContainer config={monthConfig} data={visitorData}>
      <ChartPie dataKey="desktop" nameKey="month" innerRadius="58.5%" />
      <ChartLabel position="center" />
      <ChartTooltip>
        {#snippet content()}<ChartTooltipContent hideLabel />{/snippet}
      </ChartTooltip>
      <ChartLegend />
    </ChartContainer>
  </article>

  <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="radar">
    <h4 class="text-lg font-semibold">Radar chart</h4>
    <ChartContainer config={visitorConfig} data={visitorData}>
      <ChartPolarGrid />
      <ChartPolarAngleAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartRadar dataKey="desktop" />
      <ChartRadar dataKey="mobile" />
      <ChartLegend />
    </ChartContainer>
  </article>

  <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="radial">
    <h4 class="text-lg font-semibold">Radial chart</h4>
    <ChartContainer config={browserConfig} data={browserData} class="mx-auto max-w-sm">
      <ChartRadialBar dataKey="visitors" nameKey="browser" background />
    </ChartContainer>
  </article>
</div>

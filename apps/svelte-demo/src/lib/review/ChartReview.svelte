<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import {
    ChartContainer,
    ChartLegend,
    ChartTooltip,
    ChartTooltipContent,
  } from "$lib/starwind-runtime/chart";
  import {
    areaChart,
    barChart,
    donutChart,
    monthConfig,
    radarChart,
    visitorConfig,
    visitorData,
  } from "./chart/chart-recipes";
</script>

<section
  data-styled-review="chart"
  id="chart-review"
  class="review-card"
  aria-labelledby="chart-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Data visualization</p>
      <h2 id="chart-heading">Chart</h2>
    </div>
    <span class="component-label hidden sm:inline-block">chart</span>
  </div>
  <p>
    Review the bar, area, donut and radar examples in light and dark mode. Move the pointer over a
    chart or focus it and use the arrow keys to see the tooltip. Click a legend item to hide or show
    its series.
  </p>
  <DocsExample component="chart" />
  <div data-additional-examples>
    <h3 class="review-subheading">Chart examples</h3>
    <div class="grid gap-6 md:grid-cols-2" data-testid="chart-examples">
      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="bar">
        <div class="space-y-1">
          <h4 class="text-lg font-semibold">Bar chart</h4>
          <p class="text-muted-foreground text-sm">
            Desktop and mobile visitors from January to June, with the default dot tooltip.
          </p>
        </div>
        <ChartContainer
          id="chart-visitors-bar"
          chart={barChart}
          config={visitorConfig}
          data={visitorData}
        >
          <ChartLegend />
        </ChartContainer>
      </article>

      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="area">
        <div class="space-y-1">
          <h4 class="text-lg font-semibold">Area chart</h4>
          <p class="text-muted-foreground text-sm">
            Stacked visitors with a line indicator from a ChartTooltip.
          </p>
        </div>
        <ChartContainer
          id="chart-visitors-area"
          chart={areaChart}
          config={visitorConfig}
          data={visitorData}
        >
          <ChartTooltip>
            {#snippet content()}<ChartTooltipContent indicator="line" />{/snippet}
          </ChartTooltip>
          <ChartLegend />
        </ChartContainer>
      </article>

      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="donut">
        <div class="space-y-1">
          <h4 class="text-lg font-semibold">Donut chart</h4>
          <p class="text-muted-foreground text-sm">
            Desktop visitors by month. This chart has no id, so the component makes one.
          </p>
        </div>
        <ChartContainer chart={donutChart} config={monthConfig} data={visitorData}>
          <ChartTooltip>
            {#snippet content()}<ChartTooltipContent hideLabel />{/snippet}
          </ChartTooltip>
          <ChartLegend />
        </ChartContainer>
      </article>

      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="radar">
        <div class="space-y-1">
          <h4 class="text-lg font-semibold">Radar chart</h4>
          <p class="text-muted-foreground text-sm">
            Desktop and mobile visitors on one polar grid. Use the legend to hide a series.
          </p>
        </div>
        <ChartContainer
          id="chart-visitors-radar"
          chart={radarChart}
          config={visitorConfig}
          data={visitorData}
        >
          <ChartLegend />
        </ChartContainer>
      </article>
    </div>
  </div>
</section>

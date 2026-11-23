<script setup lang="ts">
import {
  areaChart,
  barChart,
  donutChart,
  monthConfig,
  radarChart,
  visitorConfig,
  visitorData,
} from "./chart/chart-recipes";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "./starwind-runtime/chart";
</script>

<template>
  <section id="chart-review" class="review-card" data-testid="styled-chart-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Data visualization</p>
        <h2>Chart</h2>
      </div>
    </div>
    <p class="text-muted-foreground mb-6 max-w-3xl text-sm">
      Review the bar, area, donut and radar examples in light and dark mode. Move the pointer over a
      chart or focus it and use the arrow keys to see the tooltip. Click a legend item to hide or
      show its series.
    </p>

    <div class="grid gap-6 md:grid-cols-2" data-testid="chart-examples">
      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="bar">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">Bar chart</h3>
          <p class="text-muted-foreground text-sm">
            Desktop and mobile visitors from January to June, with the default dot tooltip.
          </p>
        </div>
        <ChartContainer
          id="chart-visitors-bar"
          :chart="barChart"
          :config="visitorConfig"
          :data="visitorData"
        >
          <ChartLegend />
        </ChartContainer>
      </article>

      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="area">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">Area chart</h3>
          <p class="text-muted-foreground text-sm">
            Stacked visitors with a line indicator from a ChartTooltip.
          </p>
        </div>
        <ChartContainer
          id="chart-visitors-area"
          :chart="areaChart"
          :config="visitorConfig"
          :data="visitorData"
        >
          <ChartTooltip>
            <template #content>
              <ChartTooltipContent indicator="line" />
            </template>
          </ChartTooltip>
          <ChartLegend />
        </ChartContainer>
      </article>

      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="donut">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">Donut chart</h3>
          <p class="text-muted-foreground text-sm">
            Desktop visitors by month. This chart has no id, so the component makes one.
          </p>
        </div>
        <ChartContainer :chart="donutChart" :config="monthConfig" :data="visitorData">
          <ChartTooltip>
            <template #content>
              <ChartTooltipContent hide-label />
            </template>
          </ChartTooltip>
          <ChartLegend />
        </ChartContainer>
      </article>

      <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="radar">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">Radar chart</h3>
          <p class="text-muted-foreground text-sm">
            Desktop and mobile visitors on one polar grid. Use the legend to hide a series.
          </p>
        </div>
        <ChartContainer
          id="chart-visitors-radar"
          :chart="radarChart"
          :config="visitorConfig"
          :data="visitorData"
        >
          <ChartLegend />
        </ChartContainer>
      </article>
    </div>
  </section>
</template>

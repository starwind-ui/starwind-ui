<script setup lang="ts">
// The six docs charts built from chart parts. They need no chart module. The bar chart formats its
// ticks with a function, which Vue parts accept.
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
} from "../starwind-runtime/chart";
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

<template>
  <div class="grid gap-6 md:grid-cols-2" data-testid="chart-parts-examples">
    <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="bar">
      <h3 class="text-lg font-semibold">Bar chart</h3>
      <ChartContainer :config="visitorConfig" :data="visitorData">
        <ChartGrid :vertical="false" />
        <ChartXAxis data-key="month" :tick-formatter="shortMonth" />
        <ChartYAxis />
        <ChartBar data-key="desktop" :radius="4" />
        <ChartBar data-key="mobile" :radius="4" />
        <ChartLegend />
      </ChartContainer>
    </article>

    <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="area">
      <h3 class="text-lg font-semibold">Area chart</h3>
      <ChartContainer :config="visitorConfig" :data="visitorData">
        <ChartGrid :vertical="false" />
        <ChartXAxis data-key="month" :tick-formatter="{ maxLength: 3 }" />
        <ChartYAxis />
        <ChartArea data-key="desktop" type="monotone" stack-id="a" />
        <ChartArea data-key="mobile" type="monotone" stack-id="a" />
        <ChartTooltip>
          <template #content>
            <ChartTooltipContent indicator="line" />
          </template>
        </ChartTooltip>
        <ChartLegend />
      </ChartContainer>
    </article>

    <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="line">
      <h3 class="text-lg font-semibold">Line chart</h3>
      <ChartContainer :config="visitorConfig" :data="visitorData">
        <ChartGrid :vertical="false" />
        <ChartXAxis data-key="month" :tick-formatter="{ maxLength: 3 }" />
        <ChartLine data-key="desktop" />
        <ChartTooltip>
          <template #content>
            <ChartTooltipContent hide-label />
          </template>
        </ChartTooltip>
      </ChartContainer>
    </article>

    <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="donut">
      <h3 class="text-lg font-semibold">Donut chart</h3>
      <ChartContainer :config="monthConfig" :data="visitorData">
        <ChartPie data-key="desktop" name-key="month" inner-radius="58.5%" />
        <ChartLabel position="center" />
        <ChartTooltip>
          <template #content>
            <ChartTooltipContent hide-label />
          </template>
        </ChartTooltip>
        <ChartLegend />
      </ChartContainer>
    </article>

    <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="radar">
      <h3 class="text-lg font-semibold">Radar chart</h3>
      <ChartContainer :config="visitorConfig" :data="visitorData">
        <ChartPolarGrid />
        <ChartPolarAngleAxis data-key="month" :tick-formatter="{ maxLength: 3 }" />
        <ChartRadar data-key="desktop" />
        <ChartRadar data-key="mobile" />
        <ChartLegend />
      </ChartContainer>
    </article>

    <article class="scenario flex min-w-0 flex-col gap-4" data-chart-example="radial">
      <h3 class="text-lg font-semibold">Radial chart</h3>
      <ChartContainer :config="browserConfig" :data="browserData" class="mx-auto max-w-sm">
        <ChartRadialBar data-key="visitors" name-key="browser" background />
      </ChartContainer>
    </article>
  </div>
</template>

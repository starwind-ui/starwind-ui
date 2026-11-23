<script setup lang="ts">
import { type ChartGalleryType, isChartGalleryType } from "../chart/chart-catalog";
import ChartGallery from "./ChartGallery.vue";

const props = defineProps<{ type: string }>();

const view: ChartGalleryType = isChartGalleryType(props.type) ? props.type : "area";
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-6 py-12" data-testid="vue-chart-gallery-route">
    <header class="mb-8 space-y-3">
      <p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Runtime chart gallery
      </p>
      <h1 class="text-4xl font-semibold tracking-tight">Charts</h1>
      <p class="text-muted-foreground max-w-3xl">
        Compare each chart with the same chart on the shadcn charts page. Check light and dark mode,
        and move the pointer over each chart to see its tooltip.
      </p>
      <a class="text-sm font-medium underline underline-offset-4" href="/review#chart-review">
        Back to the chart examples
      </a>
    </header>
    <ChartGallery :type="view" />
  </main>
</template>

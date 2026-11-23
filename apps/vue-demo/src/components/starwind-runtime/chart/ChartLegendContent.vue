<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import type { ClassValue } from "tailwind-variants";
import { chartLegend, chartLegendIcon, chartLegendItem, chartLegendSwatch } from "./variants";

defineOptions({ inheritAttrs: false });

export type ChartLegendContentProps = import("@starwind-ui/vue/chart").ChartLegendProps & {
  class?: ClassValue;
};
type ChartLegendContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ChartLegendContentProps;
const { class: className } = defineProps<ChartLegendContentDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <ChartPrimitive.ChartLegend
    v-bind="$attrs"
    :class="chartLegend({ class: className })"
    data-slot="chart-legend"
  >
    <ChartPrimitive.ChartLegendItems>
      <ChartPrimitive.ChartLegendItem :class="chartLegendItem()">
        <ChartPrimitive.ChartLegendIcon :class="chartLegendIcon()" />
        <ChartPrimitive.ChartLegendSwatch :class="chartLegendSwatch()" />
        <ChartPrimitive.ChartLegendLabel />
      </ChartPrimitive.ChartLegendItem>
    </ChartPrimitive.ChartLegendItems>
  </ChartPrimitive.ChartLegend>
</template>

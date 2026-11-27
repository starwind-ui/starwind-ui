<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "yAxis" });

export type ChartYAxisProps = import("@starwind-ui/vue/chart").ChartYAxisProps;
type ChartYAxisDeclaredProps = {} & /* @vue-ignore */ ChartYAxisProps;
defineProps<ChartYAxisDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartYAxis
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartYAxisProps"
  />
</template>

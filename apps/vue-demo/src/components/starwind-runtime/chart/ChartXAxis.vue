<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "xAxis" });

export type ChartXAxisProps = import("@starwind-ui/vue/chart").ChartXAxisProps;
type ChartXAxisDeclaredProps = {} & /* @vue-ignore */ ChartXAxisProps;
defineProps<ChartXAxisDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartXAxis
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartXAxisProps"
  />
</template>

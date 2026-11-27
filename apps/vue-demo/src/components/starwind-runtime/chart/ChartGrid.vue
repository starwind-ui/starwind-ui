<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "grid" });

export type ChartGridProps = import("@starwind-ui/vue/chart").ChartGridProps;
type ChartGridDeclaredProps = {} & /* @vue-ignore */ ChartGridProps;
defineProps<ChartGridDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartGrid
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartGridProps"
  />
</template>

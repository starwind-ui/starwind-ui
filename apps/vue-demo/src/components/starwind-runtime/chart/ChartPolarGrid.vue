<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "polarGrid" });

export type ChartPolarGridProps = import("@starwind-ui/vue/chart").ChartPolarGridProps;
type ChartPolarGridDeclaredProps = {} & /* @vue-ignore */ ChartPolarGridProps;
defineProps<ChartPolarGridDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartPolarGrid
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartPolarGridProps"
  />
</template>

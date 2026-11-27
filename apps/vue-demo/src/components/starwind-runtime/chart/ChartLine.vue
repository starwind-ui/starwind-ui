<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "line" });

export type ChartLineProps = import("@starwind-ui/vue/chart").ChartLineProps;
type ChartLineDeclaredProps = {} & /* @vue-ignore */ ChartLineProps;
defineProps<ChartLineDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartLine
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartLineProps"
  />
</template>

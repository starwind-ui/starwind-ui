<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "radialBar" });

export type ChartRadialBarProps = import("@starwind-ui/vue/chart").ChartRadialBarProps;
type ChartRadialBarDeclaredProps = {} & /* @vue-ignore */ ChartRadialBarProps;
defineProps<ChartRadialBarDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartRadialBar
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartRadialBarProps"
  />
</template>

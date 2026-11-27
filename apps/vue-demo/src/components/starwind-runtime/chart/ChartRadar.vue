<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "radar" });

export type ChartRadarProps = import("@starwind-ui/vue/chart").ChartRadarProps;
type ChartRadarDeclaredProps = {} & /* @vue-ignore */ ChartRadarProps;
defineProps<ChartRadarDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartRadar
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartRadarProps"
  />
</template>

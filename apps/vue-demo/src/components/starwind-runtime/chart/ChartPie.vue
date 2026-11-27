<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "pie" });

export type ChartPieProps = import("@starwind-ui/vue/chart").ChartPieProps;
type ChartPieDeclaredProps = {} & /* @vue-ignore */ ChartPieProps;
defineProps<ChartPieDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartPie
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartPieProps"
  />
</template>

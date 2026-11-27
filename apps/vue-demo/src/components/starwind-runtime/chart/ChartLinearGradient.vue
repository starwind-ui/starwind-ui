<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "linearGradient" });

export type ChartLinearGradientProps = import("@starwind-ui/vue/chart").ChartLinearGradientProps;
type ChartLinearGradientDeclaredProps = {} & /* @vue-ignore */ ChartLinearGradientProps;
defineProps<ChartLinearGradientDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartLinearGradient
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartLinearGradientProps"
  />
</template>

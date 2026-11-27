<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "polarAngleAxis" });

export type ChartPolarAngleAxisProps = import("@starwind-ui/vue/chart").ChartPolarAngleAxisProps;
type ChartPolarAngleAxisDeclaredProps = {} & /* @vue-ignore */ ChartPolarAngleAxisProps;
defineProps<ChartPolarAngleAxisDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartPolarAngleAxis
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartPolarAngleAxisProps"
  />
</template>

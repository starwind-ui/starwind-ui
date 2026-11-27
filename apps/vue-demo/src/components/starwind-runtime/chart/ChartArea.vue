<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "area" });

export type ChartAreaProps = import("@starwind-ui/vue/chart").ChartAreaProps;
type ChartAreaDeclaredProps = {} & /* @vue-ignore */ ChartAreaProps;
defineProps<ChartAreaDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartArea
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartAreaProps"
  />
</template>

<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "label" });

export type ChartLabelProps = import("@starwind-ui/vue/chart").ChartLabelProps;
type ChartLabelDeclaredProps = {} & /* @vue-ignore */ ChartLabelProps;
defineProps<ChartLabelDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartLabel
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartLabelProps"
  />
</template>

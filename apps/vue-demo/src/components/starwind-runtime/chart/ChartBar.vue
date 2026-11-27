<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false, chartSpecPart: "bar" });

export type ChartBarProps = import("@starwind-ui/vue/chart").ChartBarProps;
type ChartBarDeclaredProps = {} & /* @vue-ignore */ ChartBarProps;
defineProps<ChartBarDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ChartPrimitive.ChartBar
    v-bind="attrs as unknown as import('@starwind-ui/vue/chart').ChartBarProps"
  />
</template>

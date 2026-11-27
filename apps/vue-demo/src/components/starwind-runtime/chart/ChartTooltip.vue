<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import ChartTooltipContent from "./ChartTooltipContent.vue";

defineOptions({ inheritAttrs: false });

export type ChartTooltipProps = import("@starwind-ui/vue/chart").ChartTooltipProps;
type ChartTooltipDeclaredProps = {} & /* @vue-ignore */ ChartTooltipProps;
defineProps<ChartTooltipDeclaredProps>();
defineSlots<{
  content?: () => unknown;
}>();
</script>

<template>
  <ChartPrimitive.ChartTooltip v-bind="$attrs">
    <slot name="content">
      <ChartTooltipContent />
    </slot>
  </ChartPrimitive.ChartTooltip>
</template>

<script setup lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import ChartTooltipContent from "./ChartTooltipContent.vue";

export type ChartTooltipProps = {};
type ChartTooltipDeclaredProps = {} & /* @vue-ignore */ ChartTooltipProps;
defineProps<ChartTooltipDeclaredProps>();
defineSlots<{
  content?: () => unknown;
}>();
</script>

<template>
  <ChartPrimitive.ChartTooltip>
    <slot name="content">
      <ChartTooltipContent />
    </slot>
  </ChartPrimitive.ChartTooltip>
</template>

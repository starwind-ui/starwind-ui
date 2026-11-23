<script setup lang="ts">
import ChartLegendContent from "./ChartLegendContent.vue";

defineOptions({ inheritAttrs: false });

export type ChartLegendProps = InstanceType<typeof ChartLegendContent>["$props"];
type ChartLegendDeclaredProps = {} & /* @vue-ignore */ ChartLegendProps;
defineProps<ChartLegendDeclaredProps>();
defineSlots<{
  content?: () => unknown;
}>();
</script>

<template>
  <slot name="content">
    <ChartLegendContent v-bind="$attrs" />
  </slot>
</template>

<script lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import type { ClassValue } from "tailwind-variants";
import { computed } from "vue";
import {
  chartTooltipContent,
  chartTooltipCustom,
  chartTooltipIcon,
  chartTooltipIndicator,
  chartTooltipItem,
  chartTooltipLabel,
  chartTooltipName,
  chartTooltipValue,
} from "./variants";

export type ChartTooltipContentProps<T = unknown> =
  import("@starwind-ui/vue/chart").ChartTooltipContentProps<T> & {
    labelClass?: import("tailwind-variants").ClassValue;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    class?: ClassValue;
  };
type ChartTooltipContentDeclaredProps<T = unknown> = {
  labelClass?: import("tailwind-variants").ClassValue;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ChartTooltipContentProps<T>;
</script>

<script setup lang="ts" generic="T = unknown">
defineOptions({ inheritAttrs: false });

const {
  class: className,
  labelClass: labelClassName,
  hideLabel = undefined,
  hideIndicator = undefined,
} = defineProps<ChartTooltipContentDeclaredProps<T>>();
defineSlots<{}>();
const labelClass = computed(() => chartTooltipLabel({ class: labelClassName }));
</script>

<template>
  <ChartPrimitive.ChartTooltipContent
    v-bind="$attrs"
    :class="chartTooltipContent({ class: className })"
    data-slot="chart-tooltip-content"
    :hide-label="hideLabel"
    :hide-indicator="hideIndicator"
  >
    <ChartPrimitive.ChartTooltipLabel :class="labelClass" />
    <ChartPrimitive.ChartTooltipItems>
      <ChartPrimitive.ChartTooltipItem
        :class="chartTooltipItem()"
        :custom-class="chartTooltipCustom()"
      >
        <ChartPrimitive.ChartTooltipIcon :class="chartTooltipIcon()" />
        <ChartPrimitive.ChartTooltipIndicator :class="chartTooltipIndicator()" />
        <ChartPrimitive.ChartTooltipName :class="chartTooltipName()" :label-class="labelClass" />
        <ChartPrimitive.ChartTooltipValue :class="chartTooltipValue()" />
      </ChartPrimitive.ChartTooltipItem>
    </ChartPrimitive.ChartTooltipItems>
  </ChartPrimitive.ChartTooltipContent>
</template>

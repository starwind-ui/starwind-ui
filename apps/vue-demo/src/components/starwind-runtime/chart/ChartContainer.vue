<script lang="ts">
import * as ChartPrimitive from "@starwind-ui/vue/chart";
import type { ChartValue } from "@tanstack/charts";
import type { ClassValue } from "tailwind-variants";
import { computed, useAttrs } from "vue";
import ChartTooltipContent from "./ChartTooltipContent.vue";
import { chartContainer } from "./variants";

export type ChartContainerProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = import("@starwind-ui/vue/chart").ChartRootProps<T, D, X, Y> & {
  tooltip?: boolean | "native";
  class?: ClassValue;
};
type ChartContainerDeclaredProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = {
  tooltip?: boolean | "native";
  class?: ClassValue;
  theme?: unknown;
} & /* @vue-ignore */ (
  | import("@starwind-ui/vue/chart").ChartRootSourceProps<T, D, X, Y>
  | (Omit<
      import("@starwind-ui/vue/chart").ChartRootDefinitionProps<T, D, X, Y>,
      "onVisibleChange" | "onUpdate:visible"
    > &
      Pick<
        import("@starwind-ui/vue/chart").ChartRootSourceProps<T, D, X, Y>,
        "onVisibleChange" | "onUpdate:visible"
      >)
);
</script>

<script
  setup
  lang="ts"
  generic="
    T = unknown,
    D = unknown,
    X extends ChartValue = ChartValue,
    Y extends ChartValue = ChartValue
  "
>
defineOptions({ inheritAttrs: false });

const {
  tooltip = undefined,
  theme,
  class: className,
} = defineProps<ChartContainerDeclaredProps<T, D, X, Y>>();
defineSlots<{
  default?: () => unknown;
  tooltip?: () => unknown;
}>();
const attrs = useAttrs();
const sceneTheme = computed(() => ({
  foreground: "var(--muted-foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
  background: "transparent",
  ...theme,
}));
</script>

<template>
  <ChartPrimitive.ChartRoot
    v-bind="attrs as ChartPrimitive.ChartRootProps<T, D, X, Y>"
    :theme="sceneTheme"
    :disable-tooltip="tooltip === false"
    :class="chartContainer({ class: className })"
    data-slot="chart"
  >
    <ChartPrimitive.ChartStyle />
    <ChartPrimitive.ChartSurface
      :tooltip="tooltip === false || tooltip === 'native' ? undefined : $slots.tooltip"
      :fallback-tooltip="ChartTooltipContent"
      :native-tooltip="tooltip === 'native'"
    />
    <slot />
  </ChartPrimitive.ChartRoot>
</template>

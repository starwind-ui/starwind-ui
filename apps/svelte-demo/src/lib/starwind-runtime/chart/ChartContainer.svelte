<script module lang="ts">
  import type { ChartValue } from "@tanstack/charts";
  import { default as ChartTooltipContent } from "./ChartTooltipContent.svelte";
  import { cx } from "tailwind-variants";
  import { chartContainer, chartTooltipContent, chartTooltipLabel, chartTooltipItem, chartTooltipIndicator, chartTooltipIcon, chartTooltipName, chartTooltipValue, chartTooltipCustom, chartLegend, chartLegendItem, chartLegendSwatch, chartLegendIcon } from "./variants.js";
  import { ChartRoot } from "@starwind-ui/svelte/chart";
  import { ChartStyle } from "@starwind-ui/svelte/chart";
  import { ChartSurface } from "@starwind-ui/svelte/chart";

  export type ChartContainerProps<T = unknown, D = unknown, X extends ChartValue = ChartValue, Y extends ChartValue = ChartValue> = import("@starwind-ui/svelte/chart").ChartRootProps<T, D, X, Y> & {
    tooltip?: import("svelte").Snippet | boolean | "native";
  };
</script>

<script lang="ts" generics="T = unknown, D = unknown, X extends ChartValue = ChartValue, Y extends ChartValue = ChartValue">
  let {
    tooltip,
    visible = $bindable(),
    theme,
    "class": className,
    children,
    "visible": commandVisible,
    ...rest
  }: ChartContainerProps<T, D, X, Y> = $props();

  let sceneTheme = $derived({
    foreground: "var(--muted-foreground)",
    muted: "var(--muted-foreground)",
    grid: "var(--border)",
    background: "transparent",
    ...theme,
  });
</script>

{#snippet defaultTooltip()}<ChartTooltipContent />{/snippet}
<ChartRoot
  {...rest as any}
  theme={sceneTheme}
  disableTooltip={tooltip === false}
  class={chartContainer({ "class": cx(className) })}
  data-slot={"chart"}
  bind:visible={() => commandVisible, (next) => { visible = next; }}
>
  <ChartStyle/>
  <ChartSurface
    tooltip={typeof tooltip === "function" ? tooltip : undefined}
    fallbackTooltip={defaultTooltip}
    nativeTooltip={tooltip === "native"}
  />
  {@render children?.()}
</ChartRoot>

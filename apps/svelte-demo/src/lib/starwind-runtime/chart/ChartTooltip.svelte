<script module lang="ts">
  import { cx } from "tailwind-variants";
  import { chartContainer, chartTooltipContent, chartTooltipLabel, chartTooltipItem, chartTooltipIndicator, chartTooltipIcon, chartTooltipName, chartTooltipValue, chartTooltipCustom, chartLegend, chartLegendItem, chartLegendSwatch, chartLegendIcon } from "./variants.js";
  import { ChartTooltip } from "@starwind-ui/svelte/chart";
  import { default as ChartTooltipContent } from "./ChartTooltipContent.svelte";

  export type ChartTooltipProps = Omit<import("@starwind-ui/svelte/chart").ChartTooltipProps, "children"> & {
    content?: import("svelte").Snippet;
  };
</script>

<script lang="ts">
  let {
    content,
    ...rest
  }: ChartTooltipProps = $props();
</script>

<ChartTooltip
  {...rest}
>
  {#if content}{@render content()}{:else}<ChartTooltipContent/>{/if}
</ChartTooltip>

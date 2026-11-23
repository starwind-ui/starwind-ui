<script module lang="ts">
  import { cx } from "tailwind-variants";
  import { chartContainer, chartTooltipContent, chartTooltipLabel, chartTooltipItem, chartTooltipIndicator, chartTooltipIcon, chartTooltipName, chartTooltipValue, chartTooltipCustom, chartLegend, chartLegendItem, chartLegendSwatch, chartLegendIcon } from "./variants.js";
  import { default as ChartLegendContent } from "./ChartLegendContent.svelte";

  export type ChartLegendProps = import("./ChartLegendContent.svelte").ChartLegendContentProps & {
    content?: import("svelte").Snippet;
  };
</script>

<script lang="ts">
  let {
    content,
    ...rest
  }: ChartLegendProps = $props();
</script>

{#if content}{@render content()}{:else}<ChartLegendContent
  {...rest}
/>{/if}

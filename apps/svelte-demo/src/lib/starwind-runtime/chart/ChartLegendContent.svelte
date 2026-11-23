<script module lang="ts">
  import { cx } from "tailwind-variants";
  import { chartContainer, chartTooltipContent, chartTooltipLabel, chartTooltipItem, chartTooltipIndicator, chartTooltipIcon, chartTooltipName, chartTooltipValue, chartTooltipCustom, chartLegend, chartLegendItem, chartLegendSwatch, chartLegendIcon } from "./variants.js";
  import { ChartLegend } from "@starwind-ui/svelte/chart";
  import { ChartLegendItems } from "@starwind-ui/svelte/chart";
  import { ChartLegendItem } from "@starwind-ui/svelte/chart";
  import { ChartLegendIcon } from "@starwind-ui/svelte/chart";
  import { ChartLegendSwatch } from "@starwind-ui/svelte/chart";
  import { ChartLegendLabel } from "@starwind-ui/svelte/chart";

  export type ChartLegendContentProps = Omit<import("@starwind-ui/svelte/chart").ChartLegendProps, "children">;
</script>

<script lang="ts">
  let {
    "class": className,
    ...rest
  }: ChartLegendContentProps = $props();
</script>

<ChartLegend
  {...rest}
  class={chartLegend({ "class": cx(className) })}
  data-slot={"chart-legend"}
>
  <ChartLegendItems>
    <ChartLegendItem
      class={chartLegendItem({  })}
    >
      <ChartLegendIcon
        class={chartLegendIcon({  })}
      />
      <ChartLegendSwatch
        class={chartLegendSwatch({  })}
      />
      <ChartLegendLabel/>
    </ChartLegendItem>
  </ChartLegendItems>
</ChartLegend>

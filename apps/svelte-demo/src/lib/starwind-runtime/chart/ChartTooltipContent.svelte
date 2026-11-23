<script module lang="ts">
  import { cx } from "tailwind-variants";
  import { chartContainer, chartTooltipContent, chartTooltipLabel, chartTooltipItem, chartTooltipIndicator, chartTooltipIcon, chartTooltipName, chartTooltipValue, chartTooltipCustom, chartLegend, chartLegendItem, chartLegendSwatch, chartLegendIcon } from "./variants.js";
  import { ChartTooltipContent } from "@starwind-ui/svelte/chart";
  import { ChartTooltipLabel } from "@starwind-ui/svelte/chart";
  import { ChartTooltipItems } from "@starwind-ui/svelte/chart";
  import { ChartTooltipItem } from "@starwind-ui/svelte/chart";
  import { ChartTooltipIcon } from "@starwind-ui/svelte/chart";
  import { ChartTooltipIndicator } from "@starwind-ui/svelte/chart";
  import { ChartTooltipName } from "@starwind-ui/svelte/chart";
  import { ChartTooltipValue } from "@starwind-ui/svelte/chart";

  export type ChartTooltipContentProps<T = unknown> = import("@starwind-ui/svelte/chart").ChartTooltipContentProps<T> & {
    labelClass?: import("tailwind-variants").ClassValue;
  };
</script>

<script lang="ts" generics="T = unknown">
  let {
    "class": className,
    "labelClass": labelClassName,
    ...rest
  }: ChartTooltipContentProps<T> = $props();

  let labelClass = $derived(chartTooltipLabel({ "class": cx(labelClassName) }));
</script>

<ChartTooltipContent
  {...rest}
  class={chartTooltipContent({ "class": cx(className) })}
  data-slot={"chart-tooltip-content"}
>
  <ChartTooltipLabel
    class={labelClass}
  />
  <ChartTooltipItems>
    <ChartTooltipItem
      class={chartTooltipItem({  })}
      customClass={chartTooltipCustom({  })}
    >
      <ChartTooltipIcon
        class={chartTooltipIcon({  })}
      />
      <ChartTooltipIndicator
        class={chartTooltipIndicator({  })}
      />
      <ChartTooltipName
        class={chartTooltipName({  })}
        labelClass={labelClass}
      />
      <ChartTooltipValue
        class={chartTooltipValue({  })}
      />
    </ChartTooltipItem>
  </ChartTooltipItems>
</ChartTooltipContent>

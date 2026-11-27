<script module lang="ts">
  import { ChartYAxis } from "@starwind-ui/svelte/chart";

  export type ChartYAxisProps = import("@starwind-ui/svelte/chart").ChartYAxisProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartYAxisProps = $props();
</script>

<ChartYAxis
  {...rest}
/>

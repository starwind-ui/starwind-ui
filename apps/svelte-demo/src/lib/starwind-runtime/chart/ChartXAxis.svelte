<script module lang="ts">
  import { ChartXAxis } from "@starwind-ui/svelte/chart";

  export type ChartXAxisProps = import("@starwind-ui/svelte/chart").ChartXAxisProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartXAxisProps = $props();
</script>

<ChartXAxis
  {...rest}
/>

<script module lang="ts">
  import { ChartGrid } from "@starwind-ui/svelte/chart";

  export type ChartGridProps = import("@starwind-ui/svelte/chart").ChartGridProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartGridProps = $props();
</script>

<ChartGrid
  {...rest}
/>

<script module lang="ts">
  import { ChartPolarGrid } from "@starwind-ui/svelte/chart";

  export type ChartPolarGridProps = import("@starwind-ui/svelte/chart").ChartPolarGridProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartPolarGridProps = $props();
</script>

<ChartPolarGrid
  {...rest}
/>

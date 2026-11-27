<script module lang="ts">
  import { ChartPie } from "@starwind-ui/svelte/chart";

  export type ChartPieProps = import("@starwind-ui/svelte/chart").ChartPieProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartPieProps = $props();
</script>

<ChartPie
  {...rest}
/>

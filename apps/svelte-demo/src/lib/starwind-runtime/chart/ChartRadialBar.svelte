<script module lang="ts">
  import { ChartRadialBar } from "@starwind-ui/svelte/chart";

  export type ChartRadialBarProps = import("@starwind-ui/svelte/chart").ChartRadialBarProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartRadialBarProps = $props();
</script>

<ChartRadialBar
  {...rest}
/>

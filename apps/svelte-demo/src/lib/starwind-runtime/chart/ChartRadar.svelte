<script module lang="ts">
  import { ChartRadar } from "@starwind-ui/svelte/chart";

  export type ChartRadarProps = import("@starwind-ui/svelte/chart").ChartRadarProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartRadarProps = $props();
</script>

<ChartRadar
  {...rest}
/>

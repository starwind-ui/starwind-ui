<script module lang="ts">
  import { ChartPolarAngleAxis } from "@starwind-ui/svelte/chart";

  export type ChartPolarAngleAxisProps = import("@starwind-ui/svelte/chart").ChartPolarAngleAxisProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartPolarAngleAxisProps = $props();
</script>

<ChartPolarAngleAxis
  {...rest}
/>

<script module lang="ts">
  import { ChartLinearGradient } from "@starwind-ui/svelte/chart";

  export type ChartLinearGradientProps = import("@starwind-ui/svelte/chart").ChartLinearGradientProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartLinearGradientProps = $props();
</script>

<ChartLinearGradient
  {...rest}
/>

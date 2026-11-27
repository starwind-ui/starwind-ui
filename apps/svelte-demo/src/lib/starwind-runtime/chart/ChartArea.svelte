<script module lang="ts">
  import { ChartArea } from "@starwind-ui/svelte/chart";

  export type ChartAreaProps = import("@starwind-ui/svelte/chart").ChartAreaProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartAreaProps = $props();
</script>

<ChartArea
  {...rest}
/>

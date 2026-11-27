<script module lang="ts">
  import { ChartLine } from "@starwind-ui/svelte/chart";

  export type ChartLineProps = import("@starwind-ui/svelte/chart").ChartLineProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartLineProps = $props();
</script>

<ChartLine
  {...rest}
/>

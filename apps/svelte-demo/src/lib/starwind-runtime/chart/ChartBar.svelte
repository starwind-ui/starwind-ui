<script module lang="ts">
  import { ChartBar } from "@starwind-ui/svelte/chart";

  export type ChartBarProps = import("@starwind-ui/svelte/chart").ChartBarProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartBarProps = $props();
</script>

<ChartBar
  {...rest}
/>

<script module lang="ts">
  import { ChartLabel } from "@starwind-ui/svelte/chart";

  export type ChartLabelProps = import("@starwind-ui/svelte/chart").ChartLabelProps;
</script>

<script lang="ts">
  let {
    ...rest
  }: ChartLabelProps = $props();
</script>

<ChartLabel
  {...rest}
/>

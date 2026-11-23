<!-- Reports the useChartTooltipBody shape (`{ body }` inside an open body, null elsewhere) and the
field names of the public useChartRoot state. -->
<script lang="ts">
  import { useChartRoot, useChartTooltipBody } from "@starwind-ui/svelte/chart";

  let { place }: { place: string } = $props();
  const state = useChartTooltipBody();
  const fields = Object.keys(useChartRoot()).sort().join(",");
  const shape = $derived(
    state === null ? "null" : Array.isArray(state.body?.points) ? "object" : "other",
  );
</script>

<span data-hook={place} data-shape={shape} data-root-fields={fields}></span>

<!-- A chart bar inside another component. -->
<script lang="ts">
  import { ChartBar } from "../../../../../apps/svelte-demo/src/lib/starwind-runtime/chart";

  let { dataKey }: { dataKey: string } = $props();
</script>

<ChartBar {dataKey} />

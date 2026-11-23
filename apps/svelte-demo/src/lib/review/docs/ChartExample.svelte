<script lang="ts">
  import { ChartContainer, ChartLegend } from "$lib/starwind-runtime/chart";
  import { barChart, visitorConfig, visitorData } from "../chart/chart-recipes";
</script>

<ChartContainer chart={barChart} config={visitorConfig} data={visitorData} class="w-full max-w-xl">
  <ChartLegend />
</ChartContainer>

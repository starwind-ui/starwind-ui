import BarChart from "./BarChart.astro";
import Chart from "./Chart.astro";
import ChartLegend from "./ChartLegend.astro";
import ChartTooltip from "./ChartTooltip.astro";
import type { ChartConfig } from "./variants";
import { chart, chartLegend, chartTooltip } from "./variants";

const ChartVariants = {
  chart,
  chartTooltip,
  chartLegend,
};

export type { ChartConfig };
export { BarChart, Chart, ChartLegend, ChartTooltip, ChartVariants };

export default {
  Root: Chart,
  Bar: BarChart,
  Tooltip: ChartTooltip,
  Legend: ChartLegend,
};

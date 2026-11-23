import ChartContainer from "./ChartContainer.svelte";
import ChartLegend from "./ChartLegend.svelte";
import ChartLegendContent from "./ChartLegendContent.svelte";
import ChartTooltip from "./ChartTooltip.svelte";
import ChartTooltipContent from "./ChartTooltipContent.svelte";
import {
  chartContainer,
  chartLegend,
  chartLegendIcon,
  chartLegendItem,
  chartLegendSwatch,
  chartTooltipContent,
  chartTooltipCustom,
  chartTooltipIcon,
  chartTooltipIndicator,
  chartTooltipItem,
  chartTooltipLabel,
  chartTooltipName,
  chartTooltipValue,
} from "./variants.js";

export type {
  ChartConfig,
  ChartContext,
  ChartFactory,
  ChartIcon,
  ChartModule,
  ChartSource,
  NativeHostOptions,
  TooltipContentOptions,
  TooltipItem,
} from "@starwind-ui/svelte/chart";
export { defineChartModule, isChartIcon } from "@starwind-ui/svelte/chart";
export type { ChartContainerProps } from "./ChartContainer.svelte";
export type { ChartLegendProps } from "./ChartLegend.svelte";
export type { ChartLegendContentProps } from "./ChartLegendContent.svelte";
export type { ChartTooltipProps } from "./ChartTooltip.svelte";
export type { ChartTooltipContentProps } from "./ChartTooltipContent.svelte";

const ChartVariants = {
  chartContainer,
  chartLegend,
  chartLegendIcon,
  chartLegendItem,
  chartLegendSwatch,
  chartTooltipContent,
  chartTooltipCustom,
  chartTooltipIcon,
  chartTooltipIndicator,
  chartTooltipItem,
  chartTooltipLabel,
  chartTooltipName,
  chartTooltipValue,
};
const ChartParts = {
  Container: ChartContainer,
  Tooltip: ChartTooltip,
  TooltipContent: ChartTooltipContent,
  Legend: ChartLegend,
  LegendContent: ChartLegendContent,
};

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartVariants,
};
export default ChartParts;

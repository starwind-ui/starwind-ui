import ChartContainer from "./ChartContainer.vue";
import ChartLegend from "./ChartLegend.vue";
import ChartLegendContent from "./ChartLegendContent.vue";
import ChartTooltip from "./ChartTooltip.vue";
import ChartTooltipContent from "./ChartTooltipContent.vue";
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
} from "./variants";

export type { ChartContainerProps } from "./ChartContainer.vue";
export type { ChartLegendProps } from "./ChartLegend.vue";
export type { ChartLegendContentProps } from "./ChartLegendContent.vue";
export type { ChartTooltipProps } from "./ChartTooltip.vue";
export type { ChartTooltipContentProps } from "./ChartTooltipContent.vue";

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
} from "@starwind-ui/vue/chart";
export { defineChartModule, isChartIcon } from "@starwind-ui/vue/chart";

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartVariants,
};

export default ChartParts;

import ChartContainer from "./ChartContainer.astro";
import ChartLegend from "./ChartLegend.astro";
import ChartLegendContent from "./ChartLegendContent.astro";
import ChartTooltip from "./ChartTooltip.astro";
import ChartTooltipContent from "./ChartTooltipContent.astro";
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
} from "@starwind-ui/astro/chart";
export {
  chartStyle,
  createChart,
  defineChartModule,
  getChartController,
  isChartIcon,
  registerChartModules,
  serializeInput,
} from "@starwind-ui/astro/chart";

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartVariants,
};

export default ChartParts;

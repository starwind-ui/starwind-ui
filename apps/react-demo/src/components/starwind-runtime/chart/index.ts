"use client";

import ChartContainer from "./ChartContainer";
import ChartLegend from "./ChartLegend";
import ChartLegendContent from "./ChartLegendContent";
import ChartTooltip from "./ChartTooltip";
import ChartTooltipContent from "./ChartTooltipContent";
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
} from "@starwind-ui/react/chart";
export { defineChartModule, isChartIcon } from "@starwind-ui/react/chart";

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartVariants,
};

export default ChartParts;

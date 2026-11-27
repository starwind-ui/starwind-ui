"use client";

import ChartArea from "./ChartArea";
import ChartBar from "./ChartBar";
import ChartContainer from "./ChartContainer";
import ChartGrid from "./ChartGrid";
import ChartLabel from "./ChartLabel";
import ChartLegend from "./ChartLegend";
import ChartLegendContent from "./ChartLegendContent";
import ChartLine from "./ChartLine";
import ChartLinearGradient from "./ChartLinearGradient";
import ChartPie from "./ChartPie";
import ChartPolarAngleAxis from "./ChartPolarAngleAxis";
import ChartPolarGrid from "./ChartPolarGrid";
import ChartRadar from "./ChartRadar";
import ChartRadialBar from "./ChartRadialBar";
import ChartTooltip from "./ChartTooltip";
import ChartTooltipContent from "./ChartTooltipContent";
import ChartXAxis from "./ChartXAxis";
import ChartYAxis from "./ChartYAxis";
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
  Bar: ChartBar,
  Line: ChartLine,
  Area: ChartArea,
  Pie: ChartPie,
  Radar: ChartRadar,
  RadialBar: ChartRadialBar,
  XAxis: ChartXAxis,
  YAxis: ChartYAxis,
  Grid: ChartGrid,
  PolarGrid: ChartPolarGrid,
  PolarAngleAxis: ChartPolarAngleAxis,
  Label: ChartLabel,
  LinearGradient: ChartLinearGradient,
};

export type {
  ChartConfig,
  ChartContext,
  ChartFactory,
  ChartFormat,
  ChartIcon,
  ChartModule,
  ChartSource,
  NativeHostOptions,
  TooltipContentOptions,
  TooltipItem,
} from "@starwind-ui/react/chart";
export { defineChartModule, isChartIcon } from "@starwind-ui/react/chart";

export {
  ChartArea,
  ChartBar,
  ChartContainer,
  ChartGrid,
  ChartLabel,
  ChartLegend,
  ChartLegendContent,
  ChartLine,
  ChartLinearGradient,
  ChartPie,
  ChartPolarAngleAxis,
  ChartPolarGrid,
  ChartRadar,
  ChartRadialBar,
  ChartTooltip,
  ChartTooltipContent,
  ChartVariants,
  ChartXAxis,
  ChartYAxis,
};

export default ChartParts;

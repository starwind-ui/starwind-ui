import ChartArea from "./ChartArea.svelte";
import ChartBar from "./ChartBar.svelte";
import ChartContainer from "./ChartContainer.svelte";
import ChartGrid from "./ChartGrid.svelte";
import ChartLabel from "./ChartLabel.svelte";
import ChartLegend from "./ChartLegend.svelte";
import ChartLegendContent from "./ChartLegendContent.svelte";
import ChartLine from "./ChartLine.svelte";
import ChartLinearGradient from "./ChartLinearGradient.svelte";
import ChartPie from "./ChartPie.svelte";
import ChartPolarAngleAxis from "./ChartPolarAngleAxis.svelte";
import ChartPolarGrid from "./ChartPolarGrid.svelte";
import ChartRadar from "./ChartRadar.svelte";
import ChartRadialBar from "./ChartRadialBar.svelte";
import ChartTooltip from "./ChartTooltip.svelte";
import ChartTooltipContent from "./ChartTooltipContent.svelte";
import ChartXAxis from "./ChartXAxis.svelte";
import ChartYAxis from "./ChartYAxis.svelte";
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
  ChartFormat,
  ChartIcon,
  ChartModule,
  ChartSource,
  NativeHostOptions,
  TooltipContentOptions,
  TooltipItem,
} from "@starwind-ui/svelte/chart";
export { defineChartModule, isChartIcon } from "@starwind-ui/svelte/chart";
export type { ChartAreaProps } from "./ChartArea.svelte";
export type { ChartBarProps } from "./ChartBar.svelte";
export type { ChartContainerProps } from "./ChartContainer.svelte";
export type { ChartGridProps } from "./ChartGrid.svelte";
export type { ChartLabelProps } from "./ChartLabel.svelte";
export type { ChartLegendProps } from "./ChartLegend.svelte";
export type { ChartLegendContentProps } from "./ChartLegendContent.svelte";
export type { ChartLineProps } from "./ChartLine.svelte";
export type { ChartLinearGradientProps } from "./ChartLinearGradient.svelte";
export type { ChartPieProps } from "./ChartPie.svelte";
export type { ChartPolarAngleAxisProps } from "./ChartPolarAngleAxis.svelte";
export type { ChartPolarGridProps } from "./ChartPolarGrid.svelte";
export type { ChartRadarProps } from "./ChartRadar.svelte";
export type { ChartRadialBarProps } from "./ChartRadialBar.svelte";
export type { ChartTooltipProps } from "./ChartTooltip.svelte";
export type { ChartTooltipContentProps } from "./ChartTooltipContent.svelte";
export type { ChartXAxisProps } from "./ChartXAxis.svelte";
export type { ChartYAxisProps } from "./ChartYAxis.svelte";

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

import ChartArea from "./ChartArea.vue";
import ChartBar from "./ChartBar.vue";
import ChartContainer from "./ChartContainer.vue";
import ChartGrid from "./ChartGrid.vue";
import ChartLabel from "./ChartLabel.vue";
import ChartLegend from "./ChartLegend.vue";
import ChartLegendContent from "./ChartLegendContent.vue";
import ChartLine from "./ChartLine.vue";
import ChartLinearGradient from "./ChartLinearGradient.vue";
import ChartPie from "./ChartPie.vue";
import ChartPolarAngleAxis from "./ChartPolarAngleAxis.vue";
import ChartPolarGrid from "./ChartPolarGrid.vue";
import ChartRadar from "./ChartRadar.vue";
import ChartRadialBar from "./ChartRadialBar.vue";
import ChartTooltip from "./ChartTooltip.vue";
import ChartTooltipContent from "./ChartTooltipContent.vue";
import ChartXAxis from "./ChartXAxis.vue";
import ChartYAxis from "./ChartYAxis.vue";
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

export type { ChartAreaProps } from "./ChartArea.vue";
export type { ChartBarProps } from "./ChartBar.vue";
export type { ChartContainerProps } from "./ChartContainer.vue";
export type { ChartGridProps } from "./ChartGrid.vue";
export type { ChartLabelProps } from "./ChartLabel.vue";
export type { ChartLegendProps } from "./ChartLegend.vue";
export type { ChartLegendContentProps } from "./ChartLegendContent.vue";
export type { ChartLineProps } from "./ChartLine.vue";
export type { ChartLinearGradientProps } from "./ChartLinearGradient.vue";
export type { ChartPieProps } from "./ChartPie.vue";
export type { ChartPolarAngleAxisProps } from "./ChartPolarAngleAxis.vue";
export type { ChartPolarGridProps } from "./ChartPolarGrid.vue";
export type { ChartRadarProps } from "./ChartRadar.vue";
export type { ChartRadialBarProps } from "./ChartRadialBar.vue";
export type { ChartTooltipProps } from "./ChartTooltip.vue";
export type { ChartTooltipContentProps } from "./ChartTooltipContent.vue";
export type { ChartXAxisProps } from "./ChartXAxis.vue";
export type { ChartYAxisProps } from "./ChartYAxis.vue";

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
} from "@starwind-ui/vue/chart";
export { defineChartModule, isChartIcon } from "@starwind-ui/vue/chart";

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

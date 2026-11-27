import ChartArea from "./ChartArea.astro";
import ChartBar from "./ChartBar.astro";
import ChartContainer from "./ChartContainer.astro";
import ChartGrid from "./ChartGrid.astro";
import ChartLabel from "./ChartLabel.astro";
import ChartLegend from "./ChartLegend.astro";
import ChartLegendContent from "./ChartLegendContent.astro";
import ChartLine from "./ChartLine.astro";
import ChartLinearGradient from "./ChartLinearGradient.astro";
import ChartPie from "./ChartPie.astro";
import ChartPolarAngleAxis from "./ChartPolarAngleAxis.astro";
import ChartPolarGrid from "./ChartPolarGrid.astro";
import ChartRadar from "./ChartRadar.astro";
import ChartRadialBar from "./ChartRadialBar.astro";
import ChartTooltip from "./ChartTooltip.astro";
import ChartTooltipContent from "./ChartTooltipContent.astro";
import ChartXAxis from "./ChartXAxis.astro";
import ChartYAxis from "./ChartYAxis.astro";
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

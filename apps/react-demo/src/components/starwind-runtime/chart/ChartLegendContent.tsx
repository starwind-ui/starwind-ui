"use client";

import ChartPrimitive from "@starwind-ui/react/chart";
import { chartLegend, chartLegendIcon, chartLegendItem, chartLegendSwatch } from "./variants";

export type ChartLegendContentProps = Omit<
  import("@starwind-ui/react/chart").ChartLegendProps,
  "children" | "content"
>;

function ChartLegendContent(props: ChartLegendContentProps) {
  const { className, ...rest } = props;

  return (
    <ChartPrimitive.Legend
      {...rest}
      className={chartLegend({ class: className })}
      data-slot="chart-legend"
    >
      <ChartPrimitive.LegendItems>
        <ChartPrimitive.LegendItem className={chartLegendItem()}>
          <ChartPrimitive.LegendIcon className={chartLegendIcon()} />

          <ChartPrimitive.LegendSwatch className={chartLegendSwatch()} />

          <ChartPrimitive.LegendLabel />
        </ChartPrimitive.LegendItem>
      </ChartPrimitive.LegendItems>
    </ChartPrimitive.Legend>
  );
}

export default ChartLegendContent;

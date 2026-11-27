"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartPolarGridProps = import("@starwind-ui/react/chart").ChartPolarGridProps;

function ChartPolarGrid(props: ChartPolarGridProps) {
  const { ...rest } = props;

  return <ChartPrimitive.PolarGrid {...rest} />;
}

ChartPolarGrid.chartSpecPart = ChartPrimitive.PolarGrid.chartSpecPart;

export default ChartPolarGrid;

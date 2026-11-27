"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartGridProps = import("@starwind-ui/react/chart").ChartGridProps;

function ChartGrid(props: ChartGridProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Grid {...rest} />;
}

ChartGrid.chartSpecPart = ChartPrimitive.Grid.chartSpecPart;

export default ChartGrid;

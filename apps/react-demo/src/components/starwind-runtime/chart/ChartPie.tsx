"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartPieProps = import("@starwind-ui/react/chart").ChartPieProps;

function ChartPie(props: ChartPieProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Pie {...rest} />;
}

ChartPie.chartSpecPart = ChartPrimitive.Pie.chartSpecPart;

export default ChartPie;

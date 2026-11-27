"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartLineProps = import("@starwind-ui/react/chart").ChartLineProps;

function ChartLine(props: ChartLineProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Line {...rest} />;
}

ChartLine.chartSpecPart = ChartPrimitive.Line.chartSpecPart;

export default ChartLine;

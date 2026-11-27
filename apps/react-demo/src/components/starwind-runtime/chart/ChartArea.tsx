"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartAreaProps = import("@starwind-ui/react/chart").ChartAreaProps;

function ChartArea(props: ChartAreaProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Area {...rest} />;
}

ChartArea.chartSpecPart = ChartPrimitive.Area.chartSpecPart;

export default ChartArea;

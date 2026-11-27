"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartXAxisProps = import("@starwind-ui/react/chart").ChartXAxisProps;

function ChartXAxis(props: ChartXAxisProps) {
  const { ...rest } = props;

  return <ChartPrimitive.XAxis {...rest} />;
}

ChartXAxis.chartSpecPart = ChartPrimitive.XAxis.chartSpecPart;

export default ChartXAxis;

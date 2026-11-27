"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartYAxisProps = import("@starwind-ui/react/chart").ChartYAxisProps;

function ChartYAxis(props: ChartYAxisProps) {
  const { ...rest } = props;

  return <ChartPrimitive.YAxis {...rest} />;
}

ChartYAxis.chartSpecPart = ChartPrimitive.YAxis.chartSpecPart;

export default ChartYAxis;

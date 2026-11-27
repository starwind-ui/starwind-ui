"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartPolarAngleAxisProps = import("@starwind-ui/react/chart").ChartPolarAngleAxisProps;

function ChartPolarAngleAxis(props: ChartPolarAngleAxisProps) {
  const { ...rest } = props;

  return <ChartPrimitive.PolarAngleAxis {...rest} />;
}

ChartPolarAngleAxis.chartSpecPart = ChartPrimitive.PolarAngleAxis.chartSpecPart;

export default ChartPolarAngleAxis;

"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartLinearGradientProps = import("@starwind-ui/react/chart").ChartLinearGradientProps;

function ChartLinearGradient(props: ChartLinearGradientProps) {
  const { ...rest } = props;

  return <ChartPrimitive.LinearGradient {...rest} />;
}

ChartLinearGradient.chartSpecPart = ChartPrimitive.LinearGradient.chartSpecPart;

export default ChartLinearGradient;

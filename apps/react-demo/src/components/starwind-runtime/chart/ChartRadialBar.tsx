"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartRadialBarProps = import("@starwind-ui/react/chart").ChartRadialBarProps;

function ChartRadialBar(props: ChartRadialBarProps) {
  const { ...rest } = props;

  return <ChartPrimitive.RadialBar {...rest} />;
}

ChartRadialBar.chartSpecPart = ChartPrimitive.RadialBar.chartSpecPart;

export default ChartRadialBar;

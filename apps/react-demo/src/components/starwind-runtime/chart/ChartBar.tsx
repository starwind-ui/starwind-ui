"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartBarProps = import("@starwind-ui/react/chart").ChartBarProps;

function ChartBar(props: ChartBarProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Bar {...rest} />;
}

ChartBar.chartSpecPart = ChartPrimitive.Bar.chartSpecPart;

export default ChartBar;

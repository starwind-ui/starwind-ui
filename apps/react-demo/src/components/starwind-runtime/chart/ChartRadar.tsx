"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartRadarProps = import("@starwind-ui/react/chart").ChartRadarProps;

function ChartRadar(props: ChartRadarProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Radar {...rest} />;
}

ChartRadar.chartSpecPart = ChartPrimitive.Radar.chartSpecPart;

export default ChartRadar;

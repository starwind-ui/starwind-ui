"use client";

import ChartPrimitive from "@starwind-ui/react/chart";

export type ChartLabelProps = import("@starwind-ui/react/chart").ChartLabelProps;

function ChartLabel(props: ChartLabelProps) {
  const { ...rest } = props;

  return <ChartPrimitive.Label {...rest} />;
}

ChartLabel.chartSpecPart = ChartPrimitive.Label.chartSpecPart;

export default ChartLabel;

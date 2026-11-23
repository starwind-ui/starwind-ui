"use client";

import ChartPrimitive from "@starwind-ui/react/chart";
import type * as React from "react";
import ChartTooltipContent from "./ChartTooltipContent";

export type ChartTooltipProps = {
  content?: React.ReactNode;
};

function ChartTooltip(props: ChartTooltipProps) {
  const { content } = props;

  return <ChartPrimitive.Tooltip>{content ?? <ChartTooltipContent />}</ChartPrimitive.Tooltip>;
}

export default ChartTooltip;

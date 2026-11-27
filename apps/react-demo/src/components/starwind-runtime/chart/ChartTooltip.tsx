"use client";

import ChartPrimitive from "@starwind-ui/react/chart";
import type * as React from "react";
import ChartTooltipContent from "./ChartTooltipContent";

export type ChartTooltipProps = Omit<
  import("@starwind-ui/react/chart").ChartTooltipProps,
  "children"
> & {
  content?: React.ReactNode;
};

function ChartTooltip(props: ChartTooltipProps) {
  const { content, ...rest } = props;

  return (
    <ChartPrimitive.Tooltip {...rest}>{content ?? <ChartTooltipContent />}</ChartPrimitive.Tooltip>
  );
}

export default ChartTooltip;

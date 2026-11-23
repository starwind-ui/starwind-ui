"use client";

import ChartPrimitive from "@starwind-ui/react/chart";
import {
  chartTooltipContent,
  chartTooltipCustom,
  chartTooltipIcon,
  chartTooltipIndicator,
  chartTooltipItem,
  chartTooltipLabel,
  chartTooltipName,
  chartTooltipValue,
} from "./variants";

export type ChartTooltipContentProps<T = unknown> = Omit<
  import("@starwind-ui/react/chart").ChartTooltipContentProps<T>,
  "children"
> & {
  labelClassName?: string;
};

function ChartTooltipContent<T = unknown>(props: ChartTooltipContentProps<T>) {
  const { className, labelClassName, ...rest } = props;

  const labelClass = chartTooltipLabel({ class: labelClassName });

  return (
    <ChartPrimitive.TooltipContent
      {...rest}
      className={chartTooltipContent({ class: className })}
      data-slot="chart-tooltip-content"
    >
      <ChartPrimitive.TooltipLabel className={labelClass} />

      <ChartPrimitive.TooltipItems>
        <ChartPrimitive.TooltipItem
          className={chartTooltipItem()}
          customClassName={chartTooltipCustom()}
        >
          <ChartPrimitive.TooltipIcon className={chartTooltipIcon()} />

          <ChartPrimitive.TooltipIndicator className={chartTooltipIndicator()} />

          <ChartPrimitive.TooltipName className={chartTooltipName()} labelClassName={labelClass} />

          <ChartPrimitive.TooltipValue className={chartTooltipValue()} />
        </ChartPrimitive.TooltipItem>
      </ChartPrimitive.TooltipItems>
    </ChartPrimitive.TooltipContent>
  );
}

export default ChartTooltipContent;

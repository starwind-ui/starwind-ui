"use client";

import ChartPrimitive from "@starwind-ui/react/chart";
import type { ChartValue } from "@tanstack/charts";
import * as React from "react";
import ChartTooltipContent from "./ChartTooltipContent";
import { chartContainer } from "./variants";

export type ChartContainerProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = import("@starwind-ui/react/chart").ChartRootProps<T, D, X, Y> & {
  // oxlint-disable-next-line typescript/no-redundant-type-constituents -- "native" names the built-in tooltip.
  tooltip?: React.ReactNode | false | "native";
};

function ChartContainer<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(props: ChartContainerProps<T, D, X, Y>) {
  const { tooltip, theme, className, children, ...rest } = props;

  const sceneTheme = React.useMemo(
    () => ({
      foreground: "var(--muted-foreground)",
      muted: "var(--muted-foreground)",
      grid: "var(--border)",
      background: "transparent",
      ...theme,
    }),
    [theme],
  );
  const tooltipContent = tooltip === false || tooltip === "native" ? undefined : tooltip;

  return (
    <ChartPrimitive.Root
      {...rest}
      theme={sceneTheme}
      disableTooltip={tooltip === false}
      className={chartContainer({ class: className })}
      data-slot="chart"
    >
      <ChartPrimitive.Style />

      <ChartPrimitive.Surface
        tooltip={tooltipContent}
        fallbackTooltip={<ChartTooltipContent />}
        nativeTooltip={tooltip === "native"}
      />

      {children}
    </ChartPrimitive.Root>
  );
}

export default ChartContainer;

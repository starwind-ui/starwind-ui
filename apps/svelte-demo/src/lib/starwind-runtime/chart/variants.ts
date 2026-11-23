import { tv } from "tailwind-variants";

export const chartContainer = tv({
  base: [
    "flex w-full min-w-0 flex-col text-xs",
    "[&_[data-slot=chart-surface]]:min-w-0",
    "[&_svg.ts-chart]:focus-visible:outline-outline [&_svg.ts-chart]:focus-visible:outline-2 [&_svg.ts-chart]:focus-visible:outline-offset-4",
    "[--ts-chart-tooltip-background:var(--popover)] [--ts-chart-tooltip-color:var(--popover-foreground)]",
    "[--ts-chart-tooltip-border-radius:var(--radius)] [--ts-chart-tooltip-border:1px_solid_var(--border)]",
    "[--ts-chart-tooltip-shadow:var(--shadow-xl)]",
    "[&_.ts-chart-tooltip]:[font:inherit]!",
    "[&_.ts-chart-tooltip]:animate-in [&_.ts-chart-tooltip]:fade-in-0 [&_.ts-chart-tooltip]:transition-none [&_.ts-chart-tooltip]:duration-100",
    "motion-reduce:[&_.ts-chart-tooltip]:animate-none",
  ],
});

export const chartTooltipContent = tv({
  base: [
    "group/chart-tooltip grid min-w-32 items-start gap-1.5",
    "bg-popover text-popover-foreground border-border/50 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
  ],
});

export const chartTooltipLabel = tv({
  base: "font-medium",
});

export const chartTooltipItem = tv({
  base: [
    "flex w-full items-center gap-2",
    "group-data-[indicator=dashed]/chart-tooltip:items-stretch group-data-[indicator=line]/chart-tooltip:items-stretch",
    "[&>svg]:text-muted-foreground [&>svg]:size-2.5",
  ],
});

export const chartTooltipIndicator = tv({
  base: [
    "shrink-0 rounded-[2px] border-(--sw-chart-indicator-color) bg-(--sw-chart-indicator-color)",
    "group-data-[indicator=dot]/chart-tooltip:size-2.5",
    "group-data-[indicator=line]/chart-tooltip:w-1",
    "group-data-[indicator=dashed]/chart-tooltip:w-0 group-data-[indicator=dashed]/chart-tooltip:border-[1.5px] group-data-[indicator=dashed]/chart-tooltip:border-dashed group-data-[indicator=dashed]/chart-tooltip:bg-transparent",
    "group-data-[nested=true]/chart-tooltip:group-data-[indicator=dashed]/chart-tooltip:my-0.5",
  ],
});

export const chartTooltipIcon = tv({
  base: "inline-flex size-2.5 shrink-0 items-center justify-center self-center [&>svg]:size-full",
});

export const chartTooltipName = tv({
  base: [
    "text-muted-foreground leading-none",
    "group-data-[nested=true]/chart-tooltip:grid group-data-[nested=true]/chart-tooltip:gap-1.5",
    "group-data-[nested=true]/chart-tooltip:[&>[data-slot=chart-tooltip-label]]:text-popover-foreground",
  ],
});

export const chartTooltipValue = tv({
  base: [
    "text-foreground ms-auto self-center font-mono leading-none font-medium tabular-nums",
    "group-data-[nested=true]/chart-tooltip:self-end",
  ],
});

export const chartTooltipCustom = tv({
  base: "flex w-full items-center gap-2",
});

export const chartLegend = tv({
  base: "flex flex-wrap items-center justify-center gap-4 pt-3",
});

export const chartLegendItem = tv({
  base: [
    "text-foreground inline-flex items-center gap-1.5 rounded-sm p-1",
    "data-[state=off]:opacity-40",
    "focus-visible:outline-outline focus-visible:outline-2 focus-visible:outline-offset-2",
  ],
});

export const chartLegendSwatch = tv({
  base: "size-2 shrink-0 rounded-[2px]",
});

export const chartLegendIcon = tv({
  base: "inline-flex size-3 shrink-0 items-center justify-center [&>svg]:size-full",
});

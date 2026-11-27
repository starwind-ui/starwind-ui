import type {
  ChartHostOptions,
  ChartTheme,
  ChartTooltipOptions,
  ChartValue,
  DomChartDefinition,
} from "@tanstack/charts";
import type { tooltip } from "@tanstack/charts/tooltip";

import type { TooltipContentOptions } from "./presentation";
import type { ChartSpec } from "./spec";

/**
 * Chart series config. `V` is a framework view type for rich labels, and `I` is a framework icon
 * type. A rich label needs a plain `text` fallback.
 */
export type ChartConfig<V = unknown, I = unknown> = Record<
  string,
  (({ label?: string | number; text?: string } | { label: V; text: string }) & {
    icon?: I | ChartIcon;
  }) &
    ({ color?: string; theme?: never } | { color?: never; theme: Record<"light" | "dark", string> })
>;

export interface ChartInput<T = unknown> {
  data: readonly T[];
  config: ChartConfig;
  /** Visible config keys. Omit it to show every key. */
  visible?: readonly string[];
  params?: Record<string, unknown>;
  theme?: Partial<ChartTheme>;
  /**
   * The chart as plain data parts. The Runtime builds the chart from it, so the chart needs no
   * chart module. It cannot be combined with `chart` or `definition`.
   */
  spec?: ChartSpec;
}

/** Native TanStack host options. The chart root owns `definition` and `idPrefix`. */
export type NativeHostOptions<
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = Partial<Omit<ChartHostOptions<D, X, Y>, "definition" | "idPrefix">>;

// The native tooltip option type is generic over the datum. Chart contexts erase it.
export type NativeTooltip = ChartTooltipOptions<any, any, any> & { use: typeof tooltip };

export interface TooltipFields {
  labelKey?: string;
  nameKey?: string;
  valueKey?: string;
}

export interface ChartContext<T> {
  data: readonly T[];
  config: ChartConfig;
  /** Every config key, in config order. */
  keys: string[];
  /** Visible config keys, in config order. */
  visible: string[];
  params: Record<string, unknown>;
  isVisible(key: string): boolean;
  label(key: string): string;
  color: { domain: string[]; range: string[] };
  theme: Partial<ChartTheme> & {
    foreground: string;
    muted: string;
    grid: string;
    background: string;
  };
  tooltip(fields?: TooltipFields, native?: Partial<NativeTooltip>): NativeTooltip;
}

/** A portable icon: SVG path data that every framework and the server can render. */
export interface ChartIcon {
  viewBox?: string;
  paths: readonly string[];
}

export interface ChartModule<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> {
  id: string;
  create(context: ChartContext<T>): DomChartDefinition<D, X, Y>;
  ariaLabel: string;
  ariaDescription?: string;
  formatValue?: (value: unknown, key: string) => string;
  /** Portable tooltip presentation. It holds data only, so every framework can use it. */
  presentation?: Omit<TooltipContentOptions<string | number>, "formatter" | "labelFormatter">;
  /** DOM views for Astro and Raw HTML. Framework views belong on TooltipContent. */
  domPresentation?: TooltipContentOptions<unknown>;
  host?: NativeHostOptions<D, X, Y>;
}

export type ChartFactory<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = (context: ChartContext<T>) => DomChartDefinition<D, X, Y>;

export type ChartSource<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ChartModule<T, D, X, Y> | ChartFactory<T, D, X, Y>;

/** Host options that can travel from the server to the browser in the wire payload. */
export interface ChartWireHostOptions {
  width?: number;
  height?: number;
  initialWidth?: number;
  aspectRatio?: number;
  ariaLabel?: string;
  ariaDescription?: string;
  className?: string;
  tabIndex?: number;
}

/** The JSON payload in `<script type="application/json" data-sw-chart-input>`. */
export interface ChartWirePayload {
  input: ChartInput;
  host?: ChartWireHostOptions;
  tooltipDisabled?: boolean;
}

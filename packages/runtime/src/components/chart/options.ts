import type {
  ChartHostOptions,
  ChartPoint,
  ChartTooltipContent,
  ChartValue,
  DomChartDefinition,
} from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { sourceRow, valueText } from "./datum";
import { configText, rememberTooltip } from "./presentation";
import { snapAnchor, snapPortal } from "./snap";
import { chartSpecAriaLabel, chartSpecHost, createChartSpecFactory } from "./spec";
import type {
  ChartConfig,
  ChartContext,
  ChartIcon,
  ChartInput,
  ChartSource,
  NativeHostOptions,
} from "./types";

const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export function isChartIcon(value: unknown): value is ChartIcon {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as ChartIcon).paths) &&
    (value as ChartIcon).paths.every((path) => typeof path === "string")
  );
}

/** Visible config keys in config order. `undefined` shows every key. */
export function visibleKeys(config: ChartConfig, visible?: readonly string[]): string[] {
  return Object.keys(config).filter((key) => visible === undefined || visible.includes(key));
}

/** The CSS custom property that holds a config key's color. The key must be a CSS identifier. */
export function colorVariable(key: string): string {
  if (!IDENTIFIER.test(key)) throw new Error(`Chart config key must be a CSS identifier: ${key}`);
  return `--sw-chart-color-${key}`;
}

/** Asserts that a chart id is safe as a CSS attribute value and a native id prefix. */
export function assertChartId(id: string): void {
  if (!IDENTIFIER.test(id))
    throw new Error("Supply a unique chart id containing letters, digits, hyphens or underscores.");
}

/** Turns a framework-generated id into a chart id: `chart-` plus `[a-zA-Z0-9_-]` only. */
export function toChartId(value: string): string {
  return `chart-${value.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** A chart id for a server render that has no `id`. */
export function createChartId(): string {
  return `chart-${Math.random().toString(36).slice(2, 10)}`;
}

export interface ChartOptionsInstance<D, X extends ChartValue, Y extends ChartValue> {
  id: string;
  host?: NativeHostOptions<D, X, Y>;
  definition?: DomChartDefinition<D, X, Y>;
  /** Sets the native `definition.tooltip` to false. */
  tooltipDisabled?: boolean;
}

/**
 * Builds complete native host options from a chart source and chart input. The factory receives a
 * chart context with the visible keys, so geometry follows visibility.
 */
export function createChartOptions<
  T,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(
  chart: ChartSource<T, D, X, Y> | undefined,
  input: ChartInput<T>,
  instance: ChartOptionsInstance<D, X, Y>,
): ChartHostOptions<D, X, Y> {
  if (chart && instance.definition) throw new TypeError("Supply one chart source.");
  if (input.spec && (chart || instance.definition))
    throw new TypeError(
      "A chart spec cannot be combined with chart or definition. Use chart parts, a chart module or a native definition, not more than one.",
    );
  if (instance.definition && input.visible !== undefined)
    throw new TypeError(
      "Static native definitions own their visibility. Use a chart factory to filter data.",
    );
  assertChartId(instance.id);
  const module = typeof chart === "object" ? chart : undefined;
  const specChart = input.spec ? createChartSpecFactory(input.spec) : undefined;
  const keys = Object.keys(input.config);
  const visible = visibleKeys(input.config, input.visible);
  const format =
    module?.formatValue ??
    ((value: unknown) =>
      value == null
        ? "Missing"
        : typeof value === "number"
          ? value.toLocaleString("en-US")
          : String(value));
  const context: ChartContext<T> = {
    ...input,
    keys,
    visible,
    params: input.params ?? {},
    isVisible: (key) => visible.includes(key),
    label: (key) => configText(input.config[key], key),
    color: { domain: keys, range: keys.map((key) => `var(${colorVariable(key)})`) },
    theme: {
      ...input.theme,
      foreground: input.theme?.foreground ?? "currentColor",
      muted: input.theme?.muted ?? "currentColor",
      grid: input.theme?.grid ?? "currentColor",
      background: input.theme?.background ?? "transparent",
    },
    tooltip(fields = {}, native = {}) {
      const { labelKey = "month", nameKey = "series", valueKey = "value" } = fields;
      const ownsContent =
        "content" in native || !!native.format || !!native.formatGroup || !!native.items;
      return {
        use: tooltip,
        portal: snapPortal,
        // Snaps to the hovered item by chart type. A native `portal` turns snapping off, and a
        // native `placement` sets the side order in place of the least-overflow choice.
        anchor: "portal" in native ? "pointer" : snapAnchor(native.placement === undefined),
        placement: ["right", "left", "top", "bottom"],
        offset: 14,
        showDelay: 35,
        hideDelay: 80,
        sort: "color-domain",
        ...(ownsContent
          ? {}
          : {
              content: (points: readonly ChartPoint<any, any, any>[]): ChartTooltipContent => {
                const items = points.map((point) => {
                  const datum = point.datum as Record<string, unknown>;
                  const name = valueText(datum[nameKey] ?? datum[labelKey] ?? "");
                  return {
                    dataKey: name,
                    name,
                    value: datum[valueKey],
                    formattedValue: format(datum[valueKey], String(datum[nameKey] ?? "")),
                    payload: sourceRow(point.datum),
                    point,
                    color: point.color,
                  };
                });
                const first = points[0]?.datum as Record<string, unknown> | undefined;
                return rememberTooltip(
                  {
                    title: valueText(first?.[labelKey] ?? ""),
                    rows: items.map((item) => ({
                      label: context.label(item.dataKey),
                      value: item.formattedValue,
                      color: item.color,
                    })),
                  },
                  items,
                );
              },
            }),
        ...native,
      };
    },
  };
  const resolveDefinition = (): DomChartDefinition<D, X, Y> => {
    let definition: DomChartDefinition<D, X, Y>;
    if (instance.definition) {
      definition =
        instance.definition.tooltip === undefined
          ? ({
              ...instance.definition,
              tooltip: context.tooltip({}, { content: undefined }),
            } as DomChartDefinition<D, X, Y>)
          : instance.definition;
    } else {
      const source = specChart ?? chart;
      if (!source) throw new TypeError("Supply chart parts, chart or a native definition.");
      definition = typeof source === "function" ? source(context) : source.create(context);
    }
    return instance.tooltipDisabled ? { ...definition, tooltip: false } : definition;
  };
  return mergeChartHostOptions(
    {
      initialWidth: 720,
      height: 340,
      ariaLabel:
        module?.ariaLabel ??
        (input.spec ? chartSpecAriaLabel(input.spec, input.config) : undefined) ??
        "Chart",
      ariaDescription:
        module?.ariaDescription ??
        "Use arrow keys to inspect values. Enter pins details. Escape dismisses. Exact values follow in a table.",
      definition: resolveDefinition(),
      idPrefix: instance.id,
    },
    { ...specHost(input, instance.host), ...module?.host, ...instance.host },
  );
}

/** Spec chart host defaults. Host options that set a size replace them. */
function specHost<D, X extends ChartValue, Y extends ChartValue>(
  input: ChartInput<unknown>,
  host: NativeHostOptions<D, X, Y> | undefined,
): NativeHostOptions<D, X, Y> {
  if (!input.spec || host?.height !== undefined || host?.aspectRatio !== undefined) return {};
  return chartSpecHost(input.spec);
}

/** Merges native host options without rebuilding the engine definition. */
export function mergeChartHostOptions<D, X extends ChartValue, Y extends ChartValue>(
  base: ChartHostOptions<D, X, Y>,
  host?: NativeHostOptions<D, X, Y>,
): ChartHostOptions<D, X, Y> {
  const { height: _height, ...withoutHeight } = base;
  const defaults =
    host?.aspectRatio !== undefined && host.height === undefined ? withoutHeight : base;
  return { ...defaults, ...host, definition: base.definition, idPrefix: base.idPrefix };
}

import type {
  ChartPoint,
  ChartTooltipBodyContext,
  ChartTooltipContent,
  ChartValue,
} from "@tanstack/charts";

import { isMarkRow, SERIES, sourceRow, VALUE } from "./datum";
import { type ChartFormat, formatChartValue } from "./format";
import type { ChartConfig } from "./types";

export interface TooltipItem<
  T = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> {
  dataKey: string;
  name: string;
  value: unknown;
  formattedValue: string;
  color?: string;
  payload: T;
  point?: ChartPoint<T, X, Y>;
}

export interface TooltipContentOptions<V = unknown, T = unknown> {
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  hideIcon?: boolean;
  label?: V;
  nameKey?: string;
  labelKey?: string;
  valueKey?: string;
  color?: string;
  /**
   * A function returns the complete row view. A `ChartFormat` object formats only the row value,
   * so the row keeps its indicator and name.
   */
  formatter?:
    | ((value: unknown, name: string, item: TooltipItem<T>, index: number, payload: T) => V)
    | ChartFormat;
  /** A function returns the complete heading view. A `ChartFormat` object formats the heading. */
  labelFormatter?: ((label: unknown, payload: readonly TooltipItem<T>[]) => V) | ChartFormat;
}

export interface TooltipViewRow<V = unknown> {
  key: string;
  /**
   * The config key that names the row and gives its icon: the series key, or the `nameKey` when
   * the row has no field of that name, as shadcn reads `config[nameKey]`.
   */
  configKey: string;
  name: V | string;
  value: V | string;
  icon?: unknown;
  color?: string;
  custom?: V;
  hasCustom: boolean;
  item: TooltipItem;
}

export interface TooltipView<V = unknown> {
  label: V | string | undefined;
  rows: TooltipViewRow<V>[];
}

const metadata = new WeakMap<object, readonly TooltipItem[]>();

/** Keeps the raw tooltip items for a native content model, so `tooltipView` can read them later. */
export function rememberTooltip(
  content: ChartTooltipContent,
  items: readonly TooltipItem[],
): ChartTooltipContent {
  metadata.set(content, items);
  return content;
}

/** Plain text for a config entry. A rich label needs `text`. */
export function configText(entry: ChartConfig[string] | undefined, key: string): string {
  if (entry?.text !== undefined) return entry.text;
  if (entry?.label == null) return key;
  if (typeof entry.label === "string" || typeof entry.label === "number")
    return String(entry.label);
  throw new TypeError(`Rich chart label "${key}" needs a plain text fallback in config.text.`);
}

function field(datum: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      datum,
    );
}

/**
 * The series name of a point. A `nameKey` reads the user's row. Without one, a spec chart mark
 * row gives its series and another datum gives its `series` field.
 */
function pointName(datum: unknown, nameKey: string | undefined): unknown {
  if (nameKey) return field(sourceRow(datum), nameKey);
  return isMarkRow(datum) ? datum[SERIES] : field(datum, "series");
}

/** The value of a point without a `valueKey`, as `pointName` reads the name. */
function pointValue(datum: unknown): unknown {
  return isMarkRow(datum) ? datum[VALUE] : field(datum, "value");
}

/** The native tooltip content model. A string body becomes one row. */
export function tooltipContent(body: ChartTooltipBodyContext): ChartTooltipContent {
  return typeof body.content === "string"
    ? { rows: [{ label: "", value: body.content }] }
    : body.content;
}

/** True when a config entry exists for a key. */
const hasEntry = (config: ChartConfig, key: string | undefined): key is string =>
  key !== undefined && Object.hasOwn(config, key);

/**
 * The config key that a `labelKey` or `nameKey` names for one row, in shadcn's order: a text field
 * value that is a config key, then the key itself when config has it. `undefined` means neither.
 */
function keyConfigKey(config: ChartConfig, key: string, value: unknown): string | undefined {
  if (typeof value === "string" && hasEntry(config, value)) return value;
  return hasEntry(config, key) ? key : undefined;
}

/**
 * The tooltip heading before `labelFormatter`. A `labelKey` reads the first row. A text value
 * that is a config key names the heading. Another value gives way to the config entry of the
 * `labelKey` when config has one, as shadcn reads `config[labelKey].label`. Without a formatter,
 * the heading is that config key, and the layout shows its label, so a rich label renders. A
 * `labelFormatter` function receives the config label itself, as shadcn passes
 * `itemConfig.label`, and a `ChartFormat` formats its plain text. Without a config entry, the
 * heading is the value. Without a `labelKey`, a string title that is a config key gives a formatter
 * its config label in the same way.
 */
function tooltipHeading(
  body: ChartTooltipBodyContext,
  config: ChartConfig,
  options: TooltipContentOptions<any>,
  title: unknown,
): unknown {
  const { labelKey, labelFormatter } = options;
  if (!labelKey) {
    // A string title that names a config key gives a formatter its config label, as shadcn reads
    // `config[label]?.label || label`. Without a formatter, the layout shows that label.
    if (!labelFormatter || typeof title !== "string" || !hasEntry(config, title)) return title;
    if (typeof labelFormatter === "function") return config[title]?.label || title;
    return config[title]?.text || plainLabel(config[title]?.label) || title;
  }
  const value = field(sourceRow(body.points[0]?.datum), labelKey);
  const key = keyConfigKey(config, labelKey, value);
  if (key === undefined) return value;
  if (typeof labelFormatter === "function") return config[key]?.label;
  // A ChartFormat formats text, so it gets the plain config label. A rich label without `text`
  // gives the key.
  if (labelFormatter) return config[key]?.text ?? plainLabel(config[key]?.label) ?? key;
  return key;
}

/** A string or number label as text, or `undefined` for a rich label. */
function plainLabel(label: unknown): string | undefined {
  return typeof label === "string" || typeof label === "number" ? String(label) : undefined;
}

/**
 * The config key of a tooltip row. With a `nameKey`, it follows shadcn: a text field value that is
 * a config key, then the `nameKey` itself when config has it. Otherwise it is the series key.
 */
function rowConfigKey(item: TooltipItem, config: ChartConfig, nameKey: string | undefined): string {
  if (!nameKey) return item.dataKey;
  return keyConfigKey(config, nameKey, pointName(item.point?.datum, nameKey)) ?? item.dataKey;
}

/** The presentation model that every tooltip body renders: a heading and one entry per row. */
export function tooltipView<V = unknown>(
  body: ChartTooltipBodyContext,
  config: ChartConfig,
  options: TooltipContentOptions<V> = {},
): TooltipView<V> {
  const content = tooltipContent(body);
  const { formatter, labelFormatter } = options;
  const rowFormatter = typeof formatter === "function" ? formatter : undefined;
  const valueFormat = formatter && typeof formatter === "object" ? formatter : undefined;
  const saved = typeof body.content === "object" ? metadata.get(body.content) : undefined;
  const items: TooltipItem[] = content.rows.map((row, index) => {
    const known = saved?.[index];
    const point =
      known?.point ??
      body.points.find(
        (p) =>
          String(pointName(p.datum, options.nameKey) ?? p.group) === row.label ||
          configText(config[String(pointName(p.datum, options.nameKey) ?? p.group)], "") ===
            row.label,
      ) ??
      body.points[index];
    const rawName = options.nameKey
      ? pointName(point?.datum, options.nameKey)
      : (known?.name ?? pointName(point?.datum, undefined) ?? point?.group);
    const key =
      rawName == null
        ? (Object.keys(config).find((k) => configText(config[k], k) === row.label) ?? row.label)
        : String(rawName);
    const value = options.valueKey
      ? field(sourceRow(point?.datum), options.valueKey)
      : known
        ? known.value
        : pointValue(point?.datum) !== undefined
          ? pointValue(point?.datum)
          : typeof point?.y1Value === "number" && typeof point?.y2Value === "number"
            ? point.y2Value - point.y1Value
            : (point?.yValue ?? row.value);
    return {
      dataKey: key,
      name: key,
      value,
      formattedValue: valueFormat ? formatChartValue(value, valueFormat, config) : row.value,
      color:
        options.color ??
        (row.color?.startsWith("url(") &&
        Object.hasOwn(config, key) &&
        /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)
          ? `var(--sw-chart-color-${key})`
          : row.color),
      payload: sourceRow(point?.datum),
      point,
    };
  });
  const heading = options.label ?? tooltipHeading(body, config, options, content.title);
  return {
    label:
      typeof labelFormatter === "function"
        ? labelFormatter(heading, items)
        : labelFormatter
          ? formatChartValue(heading, labelFormatter, config)
          : (heading as V | string | undefined),
    rows: items.map((item, index) => {
      const configKey = rowConfigKey(item, config, options.nameKey);
      const entry = config[configKey];
      const result = rowFormatter?.(item.value, item.name, item, index, item.payload);
      return {
        key: `${item.dataKey}:${index}`,
        configKey,
        name: (entry?.label ?? content.rows[index]!.label) as V | string,
        value: item.formattedValue,
        icon: options.hideIcon ? undefined : entry?.icon,
        color: item.color,
        item,
        custom: result as V,
        hasCustom: rowFormatter !== undefined,
      };
    }),
  };
}

export interface TooltipLayoutRow {
  /** The row point is the primary point. A row without a point is never active. */
  active: boolean;
  /** The row shows its color marker: the indicator is not hidden and the row has no icon. */
  showIndicator: boolean;
  /** The heading renders inside the row name. */
  nestHeading: boolean;
}

export interface TooltipLayout<V = unknown> {
  view: TooltipView<V>;
  indicator: "dot" | "line" | "dashed";
  hideIndicator: boolean;
  /** A string heading that names a config key. That key's label is the heading. */
  headingKey: string | undefined;
  heading: unknown;
  /** One row with a line or dashed indicator nests the heading in the row name. */
  nested: boolean;
  /** The heading renders: it is not hidden and not empty. */
  showLabel: boolean;
  rows: TooltipLayoutRow[];
}

/**
 * The tooltip content rules that every framework and the Runtime DOM path share. Defined `props`
 * win over the module `preset`.
 */
export function tooltipLayout<V = unknown, T = unknown>(
  body: ChartTooltipBodyContext,
  config: ChartConfig,
  preset?: TooltipContentOptions<V, T>,
  props: TooltipContentOptions<V, T> = {},
): TooltipLayout<V> {
  const options = { ...preset } as TooltipContentOptions<V>;
  for (const [key, value] of Object.entries(props))
    if (value !== undefined) (options as Record<string, unknown>)[key] = value;
  const { indicator = "dot", hideIndicator = false, hideLabel, labelFormatter } = options;
  const view = tooltipView(body, config, options);
  const label = view.label;
  const headingKey =
    typeof label === "string" && !labelFormatter && Object.hasOwn(config, label)
      ? label
      : undefined;
  const heading = headingKey === undefined ? label : (config[headingKey]?.label ?? label);
  const nested = view.rows.length === 1 && indicator !== "dot";
  const showLabel = !hideLabel && heading != null && heading !== "";
  const primary = body.primaryPoint?.key;
  return {
    view,
    indicator,
    hideIndicator,
    headingKey,
    heading,
    nested,
    showLabel,
    rows: view.rows.map((row) => ({
      active: row.item.point !== undefined && row.item.point.key === primary,
      showIndicator: !hideIndicator && !row.icon,
      nestHeading: nested && showLabel,
    })),
  };
}

type AccessibilityState = {
  node: HTMLElement;
  body: ChartTooltipBodyContext;
  label: string;
  attributes: MutationObserver;
  removal: MutationObserver;
  content: MutationObserver;
};

// Rich visual content and raw exact values share one native live region.
const accessibility = new WeakMap<HTMLElement, AccessibilityState>();

const collapsedText = (node: Node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "";

/** Reads the label and item parts of one scope, part by part. */
function partTexts(copy: Element): string[] {
  const parts = [
    ...copy.querySelectorAll("[data-slot=chart-tooltip-label], [data-slot=chart-tooltip-item]"),
  ];
  const texts: string[] = [];
  // A label nested in an item is read with that item, so skip it at the top level.
  const topLevel = parts.filter(
    (part) => !part.parentElement?.closest("[data-slot=chart-tooltip-item]"),
  );
  for (const part of topLevel) {
    const fields =
      part.getAttribute("data-slot") === "chart-tooltip-item"
        ? part.querySelectorAll("[data-slot=chart-tooltip-name], [data-slot=chart-tooltip-value]")
        : [];
    for (const field of fields.length > 0 ? fields : [part]) {
      // A nested label reads as its own part before the rest of the name.
      for (const label of field.querySelectorAll("[data-slot=chart-tooltip-label]")) {
        texts.push(collapsedText(label));
        label.remove();
      }
      texts.push(collapsedText(field));
    }
  }
  return texts;
}

/**
 * The rendered tooltip text, read part by part: the label, then each item's name and value (or the
 * whole item for custom rows). A label nested in an item name reads as its own part first. Parts
 * join with single spaces, so the label does not depend on whitespace text nodes between parts.
 * Text inside one part keeps its natural spacing. Text around a tooltip content part, such as a
 * plain heading in the same body, reads in document order.
 */
function tooltipVisibleText(node: HTMLElement): string {
  const copy = node.cloneNode(true) as HTMLElement;
  for (const icon of copy.querySelectorAll("[data-slot=chart-tooltip-icon]")) icon.remove();
  const hasParts =
    copy.querySelector("[data-slot=chart-tooltip-label], [data-slot=chart-tooltip-item]") !== null;
  if (!hasParts) return collapsedText(copy);
  if (!copy.querySelector("[data-slot=chart-tooltip-content]"))
    return partTexts(copy).filter(Boolean).join(" ");
  const texts: string[] = [];
  let pending = "";
  const flush = () => {
    texts.push(pending.replace(/\s+/g, " ").trim());
    pending = "";
  };
  const walk = (parent: Node) => {
    for (const child of parent.childNodes) {
      if (child.nodeType === 3) pending += child.textContent ?? "";
      else if (child.nodeType !== 1) continue;
      else if ((child as Element).getAttribute("data-slot") === "chart-tooltip-content") {
        flush();
        texts.push(...partTexts(child as Element));
      } else walk(child);
    }
  };
  walk(copy);
  flush();
  return texts.filter(Boolean).join(" ");
}

/**
 * Sets the accessible label of the native tooltip status region to the rendered body text and the
 * exact values. Call it after a custom tooltip body renders.
 */
export function syncTooltipAccessibility(
  node: HTMLElement | null,
  body: ChartTooltipBodyContext,
): void {
  if (!node) return;
  queueMicrotask(() => {
    if (!node.isConnected) return;
    const status = node.closest<HTMLElement>("[role=status]");
    if (!status) return;
    let state = accessibility.get(status);
    if (!state) {
      const Observer = node.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
      const apply = () => {
        const current = accessibility.get(status);
        if (current?.node.isConnected && status.getAttribute("aria-label") !== current.label)
          status.setAttribute("aria-label", current.label);
      };
      const attributes = new Observer(apply);
      // Body content with its own state can change its text with no new sync call. The label
      // follows it after any sync queued in the same task, which carries the newer body.
      const content = new Observer(() =>
        queueMicrotask(() => {
          const current = accessibility.get(status);
          if (!current?.node.isConnected) return;
          current.label = tooltipLabel(current.node, current.body);
          apply();
        }),
      );
      const removal = new Observer(() => {
        if (status.isConnected) return;
        attributes.disconnect();
        content.disconnect();
        removal.disconnect();
        accessibility.delete(status);
      });
      state = { node, body, label: "", attributes, removal, content };
      accessibility.set(status, state);
      attributes.observe(status, { attributes: true, attributeFilter: ["aria-label"] });
      removal.observe(node.ownerDocument, { childList: true, subtree: true });
      content.observe(node, { childList: true, subtree: true, characterData: true });
    } else if (state.node !== node) {
      state.content.disconnect();
      state.content.observe(node, { childList: true, subtree: true, characterData: true });
    }
    state.node = node;
    state.body = body;
    state.label = tooltipLabel(node, body);
    if (status.getAttribute("aria-label") !== state.label)
      status.setAttribute("aria-label", state.label);
  });
}

/** The status label: the rendered body text, then the exact values when they differ. */
function tooltipLabel(node: HTMLElement, body: ChartTooltipBodyContext): string {
  const visible = tooltipVisibleText(node);
  const content =
    typeof body.content === "string"
      ? body.content
      : [body.content.title, ...body.content.rows.map((row) => `${row.label}: ${row.value}`)]
          .filter(Boolean)
          .join("\n");
  return visible && visible !== content ? `${visible}\n${content}` : content;
}

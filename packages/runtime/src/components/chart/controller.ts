import type {
  ChartHostOptions,
  ChartPoint,
  ChartRenderer,
  ChartScene,
  ChartTooltipBodyTarget,
  ChartValue,
  DomChartDefinition,
} from "@tanstack/charts";
import { createChartRendererAdapter } from "@tanstack/charts/adapter/renderer";
import { createSvgChartRenderer } from "@tanstack/charts/svg/renderer";

import {
  type CancelableDetails,
  createCancelableDetails,
  runCancelableDetailsTransaction,
} from "../../internal/cancelable-details";
import { assertHTMLElement } from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { createChartOptions, isChartIcon, visibleKeys } from "./options";
import { toRendererOptions } from "./prerender";
import {
  configText,
  syncTooltipAccessibility,
  type TooltipContentOptions,
  tooltipLayout,
} from "./presentation";
import { getChartModule, sharedChartState } from "./registry";
import { parseChartPayload, serializeChartPayload } from "./serialize";
import { chartStyle } from "./style";
import type {
  ChartConfig,
  ChartInput,
  ChartSource,
  ChartWirePayload,
  NativeHostOptions,
} from "./types";

export type ChartTooltipBodyChange = (target: ChartTooltipBodyTarget<any, any, any> | null) => void;

/** `legend-toggle` comes from `toggle` and legend clicks. `imperative-action` comes from `setVisible`. */
export type ChartVisibleChangeReason = "legend-toggle" | "imperative-action";

/**
 * The details of a visibility change. The cancelable `starwind-chart:visible-change` event carries
 * this object as its `detail`, and `onVisibleChange` and `visibleChange` subscribers receive it.
 */
export type ChartVisibleChangeDetails = CancelableDetails & {
  /** The proposed visible config keys, in config order. */
  readonly visible: string[];
  /** The accepted visible config keys before the change. */
  readonly previousVisible: string[];
  readonly reason: ChartVisibleChangeReason;
  /** The config key that a toggle shows or hides. */
  readonly key?: string;
  readonly event?: Event;
  readonly trigger?: Element;
};

export type ChartVisibleChangeCallback = (
  visible: string[],
  details: ChartVisibleChangeDetails,
) => void;

export interface ChartSetVisibleOptions {
  /** Set to `false` to set the keys without the event, the callback or subscribers. */
  emit?: boolean;
}

export interface ChartToggleOptions {
  event?: Event;
  trigger?: Element;
}

export interface CreateChartOptions<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> {
  /** A chart module or factory. Omit it to use the registered module named by `data-chart-module`. */
  chart?: ChartSource<T, D, X, Y>;
  /** A static native definition. It owns its visibility, so the legend is passive. */
  definition?: DomChartDefinition<D, X, Y>;
  /** Chart input. Omit it to read the root's `data-sw-chart-input` payload. */
  input?: ChartInput<T>;
  host?: NativeHostOptions<D, X, Y>;
  /** Tooltip presentation for the server-rendered tooltip template. */
  presentation?: TooltipContentOptions;
  /** Sets the native `definition.tooltip` to false. */
  tooltipDisabled?: boolean;
  /**
   * Receives the tooltip body element, points, content and primary point, and `null` when the
   * body clears. Framework adapters portal their tooltip content into the element. Without it, a
   * server-rendered tooltip template fills the body, or TanStack renders its native body.
   */
  onTooltipBodyChange?: ChartTooltipBodyChange;
  /**
   * Controlled visible config keys. When this key is present, even with an `undefined` value
   * (every key), a request does not commit. The controller proposes the keys, and the owner sets
   * them with `setVisible(next, { emit: false })` or `update({ visible })`.
   */
  visible?: readonly string[];
  /** Initial visible config keys when uncontrolled. It wins over `input.visible`. */
  defaultVisible?: readonly string[];
  /**
   * Receives a visibility proposal before the cancelable `starwind-chart:visible-change` event
   * and before the change commits. Call `details.cancel()` to keep the current keys.
   */
  onVisibleChange?: ChartVisibleChangeCallback;
}

/** Options that `setOptions` can replace. The visibility model is fixed when the controller starts. */
export type ChartControllerOptions<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = Omit<CreateChartOptions<T, D, X, Y>, "input" | "visible" | "defaultVisible">;

export interface ChartController<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> {
  readonly root: HTMLElement;
  readonly surface: HTMLElement;
  /** The chart input. `input.visible` holds the accepted visible keys. */
  getInput(): ChartInput<T>;
  /** The accepted visible config keys, in config order. */
  getVisible(): string[];
  /** The complete native host options of the last render. */
  getOptions(): ChartHostOptions<D, X, Y>;
  /** The compiled scene of the mounted chart. */
  getScene(): ChartScene<D, X, Y> | undefined;
  /**
   * Merges chart input and renders again. The definition rebuilds from the visible keys. A
   * `visible` key sets the accepted keys without events, the same as
   * `setVisible(next, { emit: false })`.
   */
  update(input: Partial<ChartInput<T>>): void;
  /** Replaces chart options such as the source, host options or the tooltip body handler. */
  setOptions(options: Partial<ChartControllerOptions<T, D, X, Y>>): void;
  /**
   * Requests new visible keys. `undefined` means every config key. The order is `onVisibleChange`,
   * then the cancelable `starwind-chart:visible-change` event, then the commit, then
   * `visibleChange` subscribers, as in the other Runtime families. It returns `false` when the
   * callback or the event cancels the request. A controlled controller returns `true` and keeps
   * its keys until the owner sets them. With `{ emit: false }` it sets the keys at once, and
   * `undefined` then keeps later config keys visible.
   */
  setVisible(next: readonly string[] | undefined, options?: ChartSetVisibleOptions): boolean;
  /** Requests a toggle of one config key, in the same order as `setVisible`. */
  toggle(key: string, options?: ChartToggleOptions): boolean;
  /**
   * Receives each visibility change that no one canceled. A controlled controller sends the
   * proposal, and its accepted keys stay the same until the owner sets them.
   */
  subscribe(
    event: "visibleChange",
    callback: (details: ChartVisibleChangeDetails) => void,
  ): () => void;
  destroy(): void;
}

type AnyChartController = ChartController<any, any, any, any>;

/** The latest input of each root, so a restart shows data that the wire payload cannot carry. */
const latestInputs = () =>
  sharedChartState("inputs", () => new WeakMap<HTMLElement, ChartInput<unknown>>());

export const chartHosts = () =>
  sharedChartState("hosts", () => new Map<HTMLElement, AnyChartController>());

const SURFACE_SELECTOR = "[data-sw-chart-surface]";
const PAYLOAD_SELECTOR = "script[data-sw-chart-input]";
const TOOLTIP_TEMPLATE_SELECTOR = "template[data-sw-chart-tooltip]";
const TOOLTIP_STATIC_ATTRIBUTE = "data-sw-chart-tooltip-static";
const LEGEND_TEMPLATE_SELECTOR = "template[data-sw-chart-legend-template]";
const LEGEND_ITEM_ATTRIBUTE = "data-sw-chart-legend-item";
const STYLE_SELECTOR = "[data-slot=chart-style]";

export function getChartController<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(root: HTMLElement): ChartController<T, D, X, Y> | undefined {
  return chartHosts().get(root) as ChartController<T, D, X, Y> | undefined;
}

function appendView(parent: Element, value: unknown): void {
  if (value == null || typeof value === "boolean") return;
  const NodeClass = parent.ownerDocument.defaultView?.Node ?? Node;
  if (value instanceof NodeClass) parent.append(value);
  else if (typeof value === "string" || typeof value === "number")
    parent.append(parent.ownerDocument.createTextNode(String(value)));
  else throw new TypeError("DOM tooltip formatters must return text or a DOM Node.");
}

/**
 * The icon of a config key. A framework icon (an Astro `icon-<key>` slot template) wins over the
 * portable config icon, as the server legend and the other frameworks choose.
 */
function iconNode(root: HTMLElement, key: string, icon: unknown): Node | undefined {
  const template = findTemplate(root, "data-sw-chart-icon", key);
  if (template?.content.textContent?.trim() || template?.content.firstElementChild)
    return template.content.cloneNode(true);
  if (isChartIcon(icon)) {
    const document = root.ownerDocument;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", icon.viewBox ?? "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("width", "1em");
    svg.setAttribute("height", "1em");
    for (const d of icon.paths) {
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }
  return undefined;
}

function findTemplate(
  root: HTMLElement,
  attribute: string,
  key: string,
): HTMLTemplateElement | undefined {
  for (const template of root.querySelectorAll<HTMLTemplateElement>(`template[${attribute}]`))
    if (template.getAttribute(attribute) === key) return template;
  return undefined;
}

function labelNode(root: HTMLElement, key: string, text: string): Node {
  const template = findTemplate(root, "data-sw-chart-label", key);
  return template && template.dataset.text === text
    ? template.content.cloneNode(true)
    : root.ownerDocument.createTextNode(text);
}

function readTemplateOptions(template: HTMLTemplateElement) {
  const text = template.dataset.swChartTooltipOptions;
  if (!text) return {};
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function fillTooltip(
  root: HTMLElement,
  template: HTMLTemplateElement,
  target: ChartTooltipBodyTarget | null,
  config: ChartConfig,
  presentation: TooltipContentOptions,
): void {
  if (!target) return;
  if (template.hasAttribute(TOOLTIP_STATIC_ATTRIBUTE)) {
    // A static body, such as a framework tooltip slot, renders as written. A TooltipContent
    // template inside it fills its rows in place.
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const inner = fragment.querySelector<HTMLTemplateElement>(TOOLTIP_TEMPLATE_SELECTOR);
    if (inner) {
      const content = renderTooltipContent(root, inner, target, config, presentation);
      if (content) inner.replaceWith(content.fragment);
      else inner.remove();
    }
    target.element.replaceChildren(fragment);
    syncTooltipAccessibility(target.element, target);
    return;
  }
  const content = renderTooltipContent(root, template, target, config, presentation);
  if (!content) return;
  target.element.replaceChildren(content.fragment);
  syncTooltipAccessibility(content.body, target);
}

/** Clones a TooltipContent template and fills its heading and rows for one body target. */
function renderTooltipContent(
  root: HTMLElement,
  template: HTMLTemplateElement,
  target: ChartTooltipBodyTarget,
  config: ChartConfig,
  presentation: TooltipContentOptions,
): { fragment: DocumentFragment; body: HTMLElement } | null {
  const options = {
    ...presentation,
    ...readTemplateOptions(template),
  } as TooltipContentOptions & { iconClass?: string };
  // The content rules shared with every framework.
  const layout = tooltipLayout(target, config, options);
  const { view, headingKey } = layout;
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const body = fragment.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]");
  if (!body) return null;
  if (root.dataset.chart) body.dataset.chart = root.dataset.chart;
  body.dataset.indicator = layout.indicator;
  const label = body.querySelector<HTMLElement>("[data-slot=chart-tooltip-label]");
  const labelClass = label?.className ?? "";
  body.dataset.nested = String(layout.nested);
  // A heading that names a config key renders its \`label-<key>\` slot or its plain text, so the
  // DOM path shows it when either one has content.
  const headingText = headingKey === undefined ? "" : configText(config[headingKey], headingKey);
  const headingTemplate =
    headingKey === undefined ? undefined : findTemplate(root, "data-sw-chart-label", headingKey);
  const richHeading = headingTemplate?.dataset.text === headingText ? headingTemplate : undefined;
  const showLabel =
    headingKey === undefined
      ? layout.showLabel
      : !options.hideLabel && (headingText !== "" || richHeading !== undefined);
  const appendHeading = (parent: HTMLElement) => {
    if (headingKey === undefined) appendView(parent, view.label);
    else
      parent.append(
        richHeading
          ? richHeading.content.cloneNode(true)
          : root.ownerDocument.createTextNode(headingText),
      );
  };
  if (label) {
    if (!showLabel || layout.nested) label.remove();
    else appendHeading(label);
  }
  const rowTemplate = body.querySelector<HTMLTemplateElement>(
    "template[data-sw-chart-tooltip-row]",
  );
  if (rowTemplate) {
    view.rows.forEach((row, index) => {
      const flags = layout.rows[index]!;
      const clone = rowTemplate.content.cloneNode(true) as DocumentFragment;
      const element = clone.firstElementChild;
      if (!element) return;
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("data-active", String(flags.active));
      element.setAttribute("data-key", row.item.dataKey);
      const customClass = element.getAttribute("data-sw-chart-custom-class");
      element.removeAttribute("data-sw-chart-custom-class");
      const marker = clone.querySelector<HTMLElement>("[data-slot=chart-tooltip-indicator]");
      const name = clone.querySelector<HTMLElement>("[data-slot=chart-tooltip-name]");
      // An Astro TooltipName \`labelClass\` wins over the TooltipLabel class.
      const nameLabelClass = name?.getAttribute("data-sw-chart-label-class");
      name?.removeAttribute("data-sw-chart-label-class");
      const value = clone.querySelector<HTMLElement>("[data-slot=chart-tooltip-value]");
      if (row.hasCustom) {
        if (customClass !== null) element.setAttribute("class", customClass);
        element.replaceChildren();
        appendView(element, row.custom);
      } else {
        const icon = iconNode(root, row.item.dataKey, row.icon);
        if (marker) {
          if (icon) {
            marker.dataset.slot = "chart-tooltip-icon";
            marker.className = options.iconClass ?? "";
            marker.setAttribute("aria-hidden", "true");
            marker.style.color = row.color ?? "currentColor";
            marker.replaceChildren(icon);
          } else if (layout.hideIndicator) marker.remove();
          else marker.style.setProperty("--sw-chart-indicator-color", row.color ?? "currentColor");
        }
        if (name) {
          if (layout.nested && showLabel) {
            const title = root.ownerDocument.createElement("span");
            title.className = nameLabelClass ?? labelClass;
            title.dataset.slot = "chart-tooltip-label";
            appendHeading(title);
            name.append(title);
          }
          const display = config[row.item.dataKey];
          if (options.formatter === undefined && display)
            name.append(labelNode(root, row.item.dataKey, configText(display, row.item.dataKey)));
          else appendView(name, row.name);
        }
        if (value) appendView(value, row.value);
      }
      rowTemplate.before(clone);
    });
    rowTemplate.remove();
  }
  return { fragment, body };
}

/** Keeps server-rendered and template legends in step with config and visibility. */
function syncLegends(root: HTMLElement, config: ChartConfig, visible: readonly string[]): void {
  for (const template of root.querySelectorAll<HTMLTemplateElement>(LEGEND_TEMPLATE_SELECTOR)) {
    const group = template.parentElement;
    const prototype = template.content.firstElementChild;
    if (!group || !prototype) continue;
    const existing = new Map<string, HTMLElement>();
    for (const node of group.querySelectorAll<HTMLElement>(`[${LEGEND_ITEM_ATTRIBUTE}]`))
      if (node.parentElement === group)
        existing.set(node.getAttribute(LEGEND_ITEM_ATTRIBUTE) ?? "", node);
    for (const [key, node] of existing) if (!Object.hasOwn(config, key)) node.remove();
    let previous: Element | null = null;
    for (const [key, entry] of Object.entries(config)) {
      let node = existing.get(key);
      if (!node) {
        node = prototype.cloneNode(true) as HTMLElement;
        node.setAttribute(LEGEND_ITEM_ATTRIBUTE, key);
        node.dataset.key = key;
        template.before(node);
      }
      const expected: Element | null = previous
        ? previous.nextElementSibling
        : group.firstElementChild;
      if (expected !== node) group.insertBefore(node, expected);
      previous = node;
      const text = configText(entry, key);
      node.setAttribute("aria-label", text);
      node
        .querySelector("[data-slot=chart-legend-label]")
        ?.replaceChildren(labelNode(root, key, text));
      const swatch = node.querySelector<HTMLElement>(
        "[data-slot=chart-legend-icon],[data-slot=chart-legend-swatch]",
      );
      if (!swatch) continue;
      const icon =
        template.dataset.hideIcon === undefined ? iconNode(root, key, entry.icon) : undefined;
      swatch.replaceChildren();
      swatch.dataset.slot = icon ? "chart-legend-icon" : "chart-legend-swatch";
      swatch.className = (icon ? template.dataset.iconClass : template.dataset.swatchClass) ?? "";
      swatch.style.background = icon ? "" : `var(--sw-chart-color-${key})`;
      swatch.style.color = icon ? `var(--sw-chart-color-${key})` : "";
      if (icon) swatch.append(icon);
    }
  }
  for (const button of root.querySelectorAll<HTMLElement>(`[${LEGEND_ITEM_ATTRIBUTE}]`)) {
    if (owningRoot(button) !== root) continue;
    const on = visible.includes(button.getAttribute(LEGEND_ITEM_ATTRIBUTE) ?? "");
    button.setAttribute("aria-pressed", String(on));
    button.dataset.state = on ? "on" : "off";
  }
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/** Sets `input.visible`. An `undefined` value removes the key, so every config key shows. */
function withVisible<T>(
  input: ChartInput<T>,
  visible: readonly string[] | undefined,
): ChartInput<T> {
  const { visible: _previous, ...rest } = input;
  return visible === undefined ? rest : { ...rest, visible: [...visible] };
}

function owningRoot(element: Element): HTMLElement | undefined {
  const hosts = chartHosts();
  for (let node: Element | null = element; node; node = node.parentElement)
    if (hosts.has(node as HTMLElement)) return node as HTMLElement;
  return undefined;
}

/**
 * Creates the chart controller for a chart root. The root needs `data-chart` with the chart id
 * and one `[data-sw-chart-surface]` element. A surface that already holds server-rendered SVG is
 * adopted without a second render. Calling it again for the same root returns the same controller.
 */
export function createChart<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(root: HTMLElement, options: CreateChartOptions<T, D, X, Y> = {}): ChartController<T, D, X, Y> {
  assertHTMLElement(root, "createChart root");
  const hosts = chartHosts();
  const existing = hosts.get(root);
  if (existing) return existing as ChartController<T, D, X, Y>;

  const id = root.dataset.chart;
  if (!id) throw new TypeError("Chart root needs a data-chart id.");
  const surface = root.querySelector<HTMLElement>(SURFACE_SELECTOR);
  if (!surface) throw new TypeError("Chart root needs one [data-sw-chart-surface] element.");

  const payloadElement = root.querySelector(PAYLOAD_SELECTOR);
  const wire = parseChartPayload(payloadElement?.textContent);
  const {
    input: initialInput,
    visible: controlledVisible,
    defaultVisible,
    ...initialOptions
  } = options;
  // The visibility model is fixed at construction, as in the other Runtime families.
  const controlled = Object.hasOwn(options, "visible");
  let settings: ChartControllerOptions<T, D, X, Y> = { ...initialOptions };
  if (!settings.chart && !settings.definition) {
    const moduleId = root.dataset.chartModule;
    const module = getChartModule(moduleId);
    if (!module)
      throw new TypeError(
        `Chart "${id}" has no chart source. Pass chart or definition, or register chart module "${moduleId ?? ""}".`,
      );
    settings.chart = module as ChartSource<T, D, X, Y>;
  }
  let input = (initialInput ??
    latestInputs().get(root) ??
    wire.input ?? {
      data: [],
      config: {},
    }) as ChartInput<T>;
  // `input.visible` stores the accepted visible keys, so `getInput()`, the wire payload and a
  // restart carry them. A controlled `visible` option, then `defaultVisible`, win over the
  // `input.visible` seed. An absent key means every config key, including keys added later.
  if (controlled) input = withVisible(input, controlledVisible);
  else if (defaultVisible !== undefined) input = withVisible(input, defaultVisible);
  const wireHost = (wire.host ?? {}) as NativeHostOptions<D, X, Y>;
  const subscribers = new Set<(details: ChartVisibleChangeDetails) => void>();
  const pending = new Set<ChartVisibleChangeDetails>();
  // Counts writes of the visible keys, so a request can tell when a listener wrote keys.
  let visibleWrites = 0;

  let renderSvg: unknown;
  let renderer: ChartRenderer<D, X, Y> | undefined;
  let currentOptions: ChartHostOptions<D, X, Y>;
  let lastTarget: ChartTooltipBodyTarget | null = null;
  let destroyed = false;

  const module = () => (typeof settings.chart === "object" ? settings.chart : undefined);
  const hostOptions = () => ({ ...wireHost, ...settings.host }) as NativeHostOptions<D, X, Y>;
  const tooltipTemplate = () => root.querySelector<HTMLTemplateElement>(TOOLTIP_TEMPLATE_SELECTOR);
  const bodyHandler = (): ChartTooltipBodyChange | undefined => {
    if (settings.onTooltipBodyChange) return settings.onTooltipBodyChange;
    const template = tooltipTemplate();
    if (!template) return undefined;
    const presentation = {
      ...module()?.presentation,
      ...module()?.domPresentation,
      ...settings.presentation,
    } as TooltipContentOptions;
    return (target) => fillTooltip(root, template, target, input.config, presentation);
  };
  const dispatchBody: ChartTooltipBodyChange = (target) => {
    lastTarget = target;
    bodyHandler()?.(target);
  };
  const callback = <K extends "onFocusChange" | "onSelect">(name: K) =>
    hostOptions()[name] ?? module()?.host?.[name];

  const resolveOptions = () => {
    const options = createChartOptions(settings.chart, input, {
      id,
      host: hostOptions(),
      definition: settings.definition,
      tooltipDisabled: settings.tooltipDisabled ?? wire.tooltipDisabled,
    });
    currentOptions = options;
    if (!renderer || options.renderSvg !== renderSvg) {
      renderSvg = options.renderSvg;
      renderer = createSvgChartRenderer<D, X, Y>(options.renderSvg);
    }
    return {
      ...toRendererOptions(options, renderer),
      onTooltipBodyChange: bodyHandler() ? dispatchBody : undefined,
      onFocusChange: (point: ChartPoint<D, X, Y> | null) => {
        callback("onFocusChange")?.(point);
        dispatchCustomEvent(root, "starwind-chart:focus-change", { point });
      },
      onSelect: (point: ChartPoint<D, X, Y> | null) => {
        callback("onSelect")?.(point);
        dispatchCustomEvent(root, "starwind-chart:select", { point });
      },
    };
  };

  const sync = () => {
    const style = root.querySelector(STYLE_SELECTOR);
    if (style) style.textContent = chartStyle(id, input.config);
    syncLegends(root, input.config, visibleKeys(input.config, input.visible));
  };

  const writePayload = () => {
    if (!payloadElement) return;
    try {
      payloadElement.textContent = serializeChartPayload({
        input,
        host: wire.host,
        tooltipDisabled: settings.tooltipDisabled ?? wire.tooltipDisabled,
      } as ChartWirePayload);
    } catch {
      // The payload only seeds a later restart. Input that cannot travel keeps the old payload.
    }
  };

  const adapter = createChartRendererAdapter<D, X, Y>(resolveOptions());

  const render = () => {
    if (destroyed) return;
    adapter.update(resolveOptions());
  };

  const assertDynamic = () => {
    if (settings.definition)
      throw new TypeError(
        "Static native definitions own their visibility. Use a chart factory to filter data.",
      );
  };

  /** Runs one visibility request through the shared cancelable transaction. */
  const requestVisible = (
    next: readonly string[] | undefined,
    fields: Pick<ChartVisibleChangeDetails, "reason" | "key" | "event" | "trigger">,
  ): boolean => {
    const visible = visibleKeys(input.config, next);
    const previousModel = input.visible;
    const previousVisible = visibleKeys(input.config, previousModel);
    // The details get copies, so a listener that changes them cannot change the commit or the
    // rollback, which read the original proposal.
    const details = createCancelableDetails({
      ...fields,
      visible: [...visible],
      previousVisible: [...previousVisible],
    }) as ChartVisibleChangeDetails;
    const acceptedNow = () => visibleKeys(input.config, input.visible);
    // `destroy()` cancels the requests in flight, so a callback or a DOM listener that tears the
    // controller down stops the commit and the subscribers, and the request returns false.
    pending.add(details);
    try {
      // The callback runs first, as in the shared transaction. A callback that destroys the
      // controller also stops the event.
      const writesBeforeCallback = visibleWrites;
      settings.onVisibleChange?.([...visible], details);
      if (destroyed) return false;
      const writesAfterCallback = visibleWrites;
      return runCancelableDetailsTransaction({
        details,
        eventType: "starwind-chart:visible-change",
        target: root,
        // A controlled controller proposes only. The owner sets the keys. A silent write during
        // the request supersedes the default commit and stays applied (ADR 0015). A write of the
        // proposed keys already rendered them, so the chart renders once.
        apply: () => {
          if (controlled || visibleWrites !== writesBeforeCallback) return;
          controller.update({ visible: [...visible] } as Partial<ChartInput<T>>);
        },
        // A callback that synchronized the proposed keys before a listener canceled gets the
        // previous keys back. A silent write of other keys stays applied (ADR 0015).
        // A DOM listener that cancels and writes keys itself owns the result, so its write stays.
        rollbackCanceled: () => {
          if (destroyed || sameKeys(visible, previousVisible)) return;
          if (visibleWrites !== writesAfterCallback) return;
          if (sameKeys(acceptedNow(), visible))
            controller.update({ visible: previousModel } as Partial<ChartInput<T>>);
        },
        notifyAccepted: (accepted) => {
          for (const subscriber of subscribers) subscriber(accepted);
        },
      });
    } finally {
      pending.delete(details);
    }
  };

  const controller: ChartController<T, D, X, Y> = {
    root,
    surface,
    getInput: () => input,
    getVisible: () => visibleKeys(input.config, input.visible),
    getOptions: () => currentOptions,
    getScene: () => adapter.getScene(),
    update(next) {
      if (destroyed) return;
      const previous = input;
      const nextInput = { ...input, ...next };
      // Rejects invalid config keys and colors before anything changes.
      chartStyle(id, nextInput.config);
      input = nextInput;
      try {
        sync();
        render();
      } catch (error) {
        input = previous;
        sync();
        render();
        throw error;
      }
      // Only a write that applied counts, so a failed write cannot stop a rollback.
      if (Object.hasOwn(next, "visible")) visibleWrites += 1;
      latestInputs().set(root, input);
      writePayload();
    },
    setOptions(next) {
      if (destroyed) return;
      const previousHandler = settings.onTooltipBodyChange;
      settings = { ...settings, ...next };
      if (settings.chart && settings.definition) {
        if ("definition" in next && next.definition) settings.chart = undefined;
        else settings.definition = undefined;
      }
      // A static native definition owns its visibility, so a swap to one drops the accepted keys.
      if (settings.definition && input.visible !== undefined) {
        input = withVisible(input, undefined);
        latestInputs().set(root, input);
        writePayload();
      }
      sync();
      render();
      // A new body handler takes over an open tooltip body at once.
      const handler = settings.onTooltipBodyChange;
      if (handler && handler !== previousHandler && lastTarget) handler(lastTarget);
    },
    setVisible(next, options = {}) {
      if (destroyed) return false;
      assertDynamic();
      if (options.emit === false) {
        const visible = next === undefined ? undefined : visibleKeys(input.config, next);
        controller.update({ visible } as Partial<ChartInput<T>>);
        return true;
      }
      return requestVisible(next, { reason: "imperative-action" });
    },
    toggle(key, options = {}) {
      if (destroyed) return false;
      assertDynamic();
      const current = visibleKeys(input.config, input.visible);
      return requestVisible(
        current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
        { reason: "legend-toggle", key, event: options.event, trigger: options.trigger },
      );
    },
    subscribe(event, callback) {
      if (event !== "visibleChange") throw new Error(`Unsupported Chart event: ${event}`);
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const details of pending) details.cancel();
      subscribers.clear();
      adapter.destroy();
      root.removeEventListener("click", click);
      if (hosts.get(root) === controller) hosts.delete(root);
      root.dataset.state = root.hasAttribute("data-sw-chart") ? "pending" : "static";
    },
  };

  const click = (event: MouseEvent) => {
    if (event.defaultPrevented || settings.definition) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>(`[${LEGEND_ITEM_ATTRIBUTE}]`);
    if (!button || owningRoot(button) !== root) return;
    const key = button.getAttribute(LEGEND_ITEM_ATTRIBUTE);
    if (key !== null && Object.hasOwn(input.config, key))
      controller.toggle(key, { event, trigger: button });
  };

  hosts.set(root, controller);
  try {
    sync();
    adapter.mount(surface);
  } catch (error) {
    destroyed = true;
    hosts.delete(root);
    adapter.destroy();
    throw error;
  }
  root.addEventListener("click", click);
  root.dataset.state = "active";
  latestInputs().set(root, input);
  return controller;
}

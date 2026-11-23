import { type ChartVisibleChangeDetails, getChartController } from "@starwind-ui/runtime/chart";
import ChartPrimitive, { type ChartConfig } from "@starwind-ui/vue/chart";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  type App,
  type Component,
  createApp,
  createSSRApp,
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  ref,
  type VNodeChild,
} from "vue";
import { renderToString } from "vue/server-renderer";
import {
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../../runtime/tests/components/chart/fixtures";

const config = visitorConfig as ChartConfig;
const apps: App[] = [];

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function container(): HTMLDivElement {
  const element = document.createElement("div");
  element.style.width = "600px";
  document.body.append(element);
  return element;
}

async function mount(render: () => VNodeChild): Promise<HTMLDivElement> {
  const element = container();
  const app = createApp({ render });
  const warnings: string[] = [];
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount(element);
  apps.push(app);
  await settle();
  expect(warnings).toEqual([]);
  return element;
}

async function settle(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  await nextTick();
}

function chartRoot(element: ParentNode): HTMLElement {
  return element.querySelector<HTMLElement>('[data-slot="chart"]')!;
}

function barCount(element: ParentNode): number {
  return element.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

function status(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]");
}

async function focusFirstPoint(element: ParentNode): Promise<void> {
  element.querySelector<SVGElement>("svg[tabindex]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await vi.waitFor(() => expect(status()).not.toBeNull());
}

type ChartOptions = {
  props?: Record<string, unknown>;
  surface?: Record<string, unknown>;
  surfaceSlots?: Record<string, () => VNodeChild>;
  children?: () => VNodeChild;
};

function chart({ props = {}, surface = {}, surfaceSlots, children }: ChartOptions = {}) {
  return h(
    ChartPrimitive.Root,
    { chart: visitorBars, data: visitorData(), config, ...props },
    () => [h(ChartPrimitive.Style), h(ChartPrimitive.Surface, surface, surfaceSlots), children?.()],
  );
}

function legend(onClick?: (event: MouseEvent) => void) {
  return h(ChartPrimitive.Legend, null, () =>
    h(ChartPrimitive.LegendItems, null, () =>
      h(ChartPrimitive.LegendItem, onClick ? { onClick } : null, () => [
        h(ChartPrimitive.LegendSwatch),
        h(ChartPrimitive.LegendIcon),
        h(ChartPrimitive.LegendLabel),
      ]),
    ),
  );
}

const TooltipBody: Component = defineComponent({
  name: "TooltipBody",
  setup() {
    return () =>
      h(ChartPrimitive.TooltipContent, { indicator: "line", class: "content" }, () => [
        h(ChartPrimitive.TooltipLabel, { class: "label" }),
        h(ChartPrimitive.TooltipItems, null, () =>
          h(ChartPrimitive.TooltipItem, { class: "row" }, () => [
            h(ChartPrimitive.TooltipIcon),
            h(ChartPrimitive.TooltipIndicator),
            h(ChartPrimitive.TooltipName, { labelClass: "label" }),
            h(ChartPrimitive.TooltipValue),
          ]),
        ),
      ]);
  },
});

function legendButton(element: ParentNode, key: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(
    `[data-slot="chart-legend-item"][data-key="${key}"]`,
  )!;
}

function nativeDefinition() {
  return visitorBars({
    data: visitorData(),
    config: visitorConfig,
    keys: ["desktop", "mobile"],
    visible: ["desktop", "mobile"],
    params: {},
    isVisible: () => true,
    label: (key) => key,
    color: { domain: ["desktop", "mobile"], range: ["red", "blue"] },
    theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
    tooltip: () => false as never,
  });
}

describe("Vue chart Primitive", () => {
  it("hydrates the server SVG and adopts it without a second SVG", async () => {
    const tree = () => chart({ props: { id: "hydrate" }, children: () => legend() });
    const element = container();
    element.innerHTML = await renderToString(createSSRApp({ render: tree }));
    const serverSvg = element.querySelector("svg");
    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(element);
    apps.push(app);
    await settle();

    expect(warnings).toEqual([]);
    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(element.querySelector("svg")).toBe(serverSvg);
    expect(chartRoot(element).dataset.state).toBe("active");
    expect(getChartController(chartRoot(element))?.getScene()?.points).toHaveLength(6);

    legendButton(element, "desktop").click();
    await settle();
    expect(element.querySelector("svg")).toBe(serverSvg);
    expect(barCount(element)).toBe(3);
  });

  it("keeps matching generated ids through hydration", async () => {
    const tree = () => [chart(), chart()];
    const element = container();
    element.innerHTML = await renderToString(createSSRApp({ render: tree }));
    const serverIds = [...element.querySelectorAll<HTMLElement>('[data-slot="chart"]')].map(
      (root) => root.dataset.chart,
    );
    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(element);
    apps.push(app);
    await settle();

    const ids = [...element.querySelectorAll<HTMLElement>('[data-slot="chart"]')].map(
      (root) => root.dataset.chart,
    );
    expect(warnings).toEqual([]);
    expect(ids).toEqual(serverIds);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^chart-[a-zA-Z0-9_-]+$/);
  });

  it("updates through the controller without Vue rewriting the surface", async () => {
    const data = ref(visitorData());
    const className = ref("first");
    const element = await mount(() =>
      chart({ props: { id: "update", data: data.value, class: className.value } }),
    );
    const surface = element.querySelector('[data-slot="chart-surface"]')!;
    const svg = surface.querySelector("svg");

    data.value = visitorData().slice(0, 1);
    className.value = "next";
    await settle();

    expect(surface.querySelectorAll("svg")).toHaveLength(1);
    expect(surface.querySelector("svg")).toBe(svg);
    expect(chartRoot(element).classList.contains("next")).toBe(true);
    expect(barCount(element)).toBe(2);
  });

  it("toggles series from legend items in the uncontrolled model", async () => {
    const onUpdate = vi.fn();
    const events: string[][] = [];
    const element = await mount(() =>
      chart({
        props: { id: "uncontrolled", "onUpdate:visible": onUpdate },
        children: () => legend(),
      }),
    );
    chartRoot(element).addEventListener("starwind-chart:visible-change", (event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
    );

    legendButton(element, "desktop").click();
    await settle();

    expect(onUpdate).toHaveBeenCalledWith(["mobile"]);
    expect(events).toEqual([["mobile"]]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(legendButton(element, "desktop").dataset.state).toBe("off");
    expect(barCount(element)).toBe(3);
  });

  it("keeps a one-way visible prop until it changes and follows v-model", async () => {
    const onUpdate = vi.fn();
    const visible = ref(["desktop", "mobile"]);
    const element = await mount(() =>
      chart({
        props: { id: "controlled", visible: visible.value, "onUpdate:visible": onUpdate },
        children: () => legend(),
      }),
    );

    legendButton(element, "mobile").click();
    await settle();
    expect(onUpdate).toHaveBeenCalledWith(["desktop"]);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);

    visible.value = ["desktop"];
    await settle();
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);

    const model = ref<string[]>(["desktop", "mobile"]);
    const second = await mount(() =>
      chart({
        props: {
          id: "model",
          visible: model.value,
          "onUpdate:visible": (next: string[]) => (model.value = next),
        },
        children: () => legend(),
      }),
    );
    legendButton(second, "desktop").click();
    await settle();
    expect(model.value).toEqual(["mobile"]);
    expect(barCount(second)).toBe(3);
  });

  it("starts with defaultVisible", async () => {
    const element = await mount(() =>
      chart({
        props: { id: "default-visible", defaultVisible: ["desktop"] },
        children: () => legend(),
      }),
    );
    expect(barCount(element)).toBe(3);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
  });

  it("cancels the toggle from a click listener or the cancelable event", async () => {
    const onUpdate = vi.fn();
    const element = await mount(() =>
      chart({
        props: { id: "cancel", "onUpdate:visible": onUpdate },
        children: () => legend((event) => event.preventDefault()),
      }),
    );
    legendButton(element, "desktop").click();
    await settle();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(barCount(element)).toBe(6);

    const second = await mount(() =>
      chart({
        props: { id: "cancel-event", "onUpdate:visible": onUpdate },
        children: () => legend(),
      }),
    );
    chartRoot(second).addEventListener("starwind-chart:visible-change", (event) =>
      event.preventDefault(),
    );
    legendButton(second, "desktop").click();
    await settle();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(legendButton(second, "desktop").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(second)).toBe(6);
  });

  it("emits visibleChange before the event and update:visible after it", async () => {
    const log: string[] = [];
    const element = await mount(() =>
      chart({
        props: {
          id: "emit-order",
          onVisibleChange: (next: string[], details: ChartVisibleChangeDetails) =>
            log.push(
              `visibleChange ${next.join(",")} ${details.isCanceled ? "canceled" : "open"} key=${details.key} reason=${details.reason} trigger=${(details.trigger as HTMLElement | undefined)?.dataset.key}`,
            ),
          "onUpdate:visible": (next: string[]) => log.push(`update ${next.join(",")}`),
        },
        children: () => legend(),
      }),
    );
    chartRoot(element).addEventListener("starwind-chart:visible-change", (event) =>
      log.push(`event ${(event as CustomEvent<{ visible: string[] }>).detail.visible.join(",")}`),
    );

    legendButton(element, "desktop").click();
    await settle();

    expect(log).toEqual([
      "visibleChange mobile open key=desktop reason=legend-toggle trigger=desktop",
      "event mobile",
      "update mobile",
    ]);
    expect(barCount(element)).toBe(3);
  });

  it("cancels the toggle from details.cancel() or preventDefault()", async () => {
    const onUpdate = vi.fn();
    const element = await mount(() =>
      chart({
        props: {
          id: "cancel-details",
          onVisibleChange: (_next: string[], details: ChartVisibleChangeDetails) =>
            details.cancel(),
          "onUpdate:visible": onUpdate,
        },
        children: () => legend(),
      }),
    );
    legendButton(element, "desktop").click();
    await settle();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(getChartController(chartRoot(element))!.getVisible()).toEqual(["desktop", "mobile"]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);

    const onVisibleChange = vi.fn();
    const second = await mount(() =>
      chart({
        props: { id: "cancel-prevent", onVisibleChange, "onUpdate:visible": onUpdate },
        children: () => legend(),
      }),
    );
    chartRoot(second).addEventListener("starwind-chart:visible-change", (event) =>
      event.preventDefault(),
    );
    legendButton(second, "desktop").click();
    await settle();
    // The emit runs before the cancelable event, as in the other Runtime families.
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![1].isCanceled).toBe(true);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(barCount(second)).toBe(6);
  });

  it("holds controlled keys in the Runtime controller after a click", async () => {
    const element = await mount(() =>
      chart({ props: { id: "held", visible: ["desktop", "mobile"] }, children: () => legend() }),
    );
    legendButton(element, "mobile").click();
    await settle();
    expect(getChartController(chartRoot(element))!.getVisible()).toEqual(["desktop", "mobile"]);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);
  });

  it("treats a later defined visible as a silent command on a Runtime-owned model (ADR 0011)", async () => {
    const onVisibleChange = vi.fn();
    const rows = visitorData();
    const visible = ref<string[] | undefined>(undefined);
    const element = await mount(() =>
      chart({
        props: { id: "flip", data: rows, visible: visible.value, onVisibleChange },
        children: () => legend(),
      }),
    );
    const controller = getChartController(chartRoot(element))!;
    visible.value = ["desktop", "mobile"];
    await settle();

    // The model started Runtime-owned, so the click commits once.
    legendButton(element, "mobile").click();
    await settle();
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![0]).toEqual(["desktop"]);
    expect(controller.getVisible()).toEqual(["desktop"]);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);

    // A parent echo of the accepted keys changes nothing and keeps the controller and tooltip.
    await focusFirstPoint(element);
    const update = vi.spyOn(controller, "update");
    visible.value = ["desktop"];
    await settle();
    expect(update).not.toHaveBeenCalled();
    expect(getChartController(chartRoot(element))).toBe(controller);
    expect(status()).not.toBeNull();
  });

  it("publishes the accepted keys when a silent write supersedes the proposal", async () => {
    const onUpdate = vi.fn();
    let element!: HTMLDivElement;
    element = await mount(() =>
      chart({
        props: {
          id: "superseded",
          onVisibleChange: () =>
            getChartController(chartRoot(element))!.setVisible(["mobile"], { emit: false }),
          "onUpdate:visible": onUpdate,
        },
        children: () => legend(),
      }),
    );

    legendButton(element, "mobile").click();
    await settle();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(["mobile"]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);
  });

  it("keeps a toggle when the controller restarts", async () => {
    const id = ref("restart-a");
    const element = await mount(() => chart({ props: { id: id.value }, children: () => legend() }));
    const first = getChartController(chartRoot(element))!;
    legendButton(element, "desktop").click();
    await settle();

    id.value = "restart-b";
    await settle();
    const second = getChartController(chartRoot(element))!;
    expect(second).not.toBe(first);
    expect(second.getVisible()).toEqual(["mobile"]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);
  });

  it("renders the chart once per accepted toggle", async () => {
    const factory = vi.fn(visitorBars);
    const element = await mount(() =>
      chart({ props: { id: "echo", chart: factory }, children: () => legend() }),
    );
    const controller = getChartController(chartRoot(element))!;
    const update = vi.spyOn(controller, "update");
    const calls = factory.mock.calls.length;

    legendButton(element, "desktop").click();
    await settle();

    expect(factory.mock.calls.length - calls).toBe(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(barCount(element)).toBe(3);
  });

  it("keeps the chart when a v-model parent starts at undefined and the first click sets it", async () => {
    const factory = vi.fn(visitorBars);
    const rows = visitorData();
    const model = ref<string[]>();
    const element = await mount(() =>
      chart({
        props: {
          id: "late-control",
          chart: factory,
          data: rows,
          visible: model.value,
          "onUpdate:visible": (next: string[]) => (model.value = next),
        },
        children: () => legend(),
      }),
    );
    const controller = getChartController(chartRoot(element))!;
    await focusFirstPoint(element);
    const calls = factory.mock.calls.length;

    legendButton(element, "desktop").click();
    await settle();

    expect(model.value).toEqual(["mobile"]);
    expect(factory.mock.calls.length - calls).toBe(1);
    expect(getChartController(chartRoot(element))).toBe(controller);
    expect(status()).not.toBeNull();
    expect(barCount(element)).toBe(3);
  });

  it("renders once when a controlled parent changes data and visible together", async () => {
    const factory = vi.fn(visitorBars);
    const rows = ref(visitorData());
    const visible = ref(["desktop", "mobile"]);
    const element = await mount(() =>
      chart({
        props: { id: "together", chart: factory, data: rows.value, visible: visible.value },
        children: () => legend(),
      }),
    );
    const calls = factory.mock.calls.length;

    rows.value = visitorData().slice(0, 2);
    visible.value = ["desktop"];
    await settle();

    expect(factory.mock.calls.length - calls).toBe(1);
    expect(barCount(element)).toBe(2);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
  });

  it("shows the fallback tooltip from the keyboard and syncs the accessible label", async () => {
    const element = await mount(() =>
      chart({
        props: { id: "keyboard", defaultVisible: ["mobile"] },
        surface: { fallbackTooltip: TooltipBody },
      }),
    );
    await focusFirstPoint(element);

    const tooltip = status()!;
    await vi.waitFor(() =>
      expect(tooltip.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const content = tooltip.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
    expect(content.dataset.chart).toBe("keyboard");
    expect(content.dataset.indicator).toBe("line");
    expect(content.dataset.nested).toBe("true");
    expect(content.classList.contains("content")).toBe(true);
    const rows = content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.dataset.key).toBe("mobile");
    expect(rows[0]!.getAttribute("aria-hidden")).toBe("true");
    const heading = content.querySelector("[data-slot=chart-tooltip-label]")!.textContent;
    expect(["January", "February", "March"]).toContain(heading);
    expect(content.querySelector("[data-slot=chart-tooltip-name]")!.textContent).toBe(
      `${heading} Mobile`,
    );
    const value = content.querySelector("[data-slot=chart-tooltip-value]")!.textContent;
    await vi.waitFor(() =>
      expect(tooltip.getAttribute("aria-label")).toBe(
        `${heading} Mobile ${value}\n${heading}\nMobile: ${value}`,
      ),
    );
  });

  it("uses a Tooltip that registers after the surface mounted", async () => {
    const element = await mount(() =>
      chart({
        props: { id: "late" },
        children: () => h(ChartPrimitive.Tooltip, null, () => h(TooltipBody)),
      }),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
  });

  it("uses the first Tooltip, hands over on removal and keeps order on re-render", async () => {
    const showFirst = ref(true);
    const tick = ref(0);
    const element = await mount(() =>
      chart({
        props: { id: "order", "data-tick": tick.value },
        children: () => [
          showFirst.value ? h(ChartPrimitive.Tooltip, null, () => "first") : null,
          h("div", null, [h(ChartPrimitive.Tooltip, null, () => "second")]),
        ],
      }),
    );
    tick.value = 1;
    await settle();
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(status()!.textContent).toContain("first"));
    expect(status()!.textContent).not.toContain("second");

    showFirst.value = false;
    await vi.waitFor(() => expect(status()!.textContent).toContain("second"));
  });

  it("renders a Tooltip inside a tooltip body in place", async () => {
    const element = await mount(() =>
      chart({
        props: { id: "in-body" },
        surfaceSlots: {
          tooltip: () =>
            h(ChartPrimitive.Tooltip, null, () =>
              h("span", { "data-testid": "in-place" }, "in place"),
            ),
        },
        children: () => h(ChartPrimitive.Tooltip, null, () => "registered"),
      }),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector('[data-testid="in-place"]')).not.toBeNull(),
    );
    expect(status()!.textContent).not.toContain("registered");
  });

  it("renders rich labels and portable icons in the tooltip and legend", async () => {
    const richConfig: ChartConfig = {
      desktop: {
        label: () => h("strong", { "data-testid": "rich" }, "Desktop"),
        text: "Desktop",
        color: "red",
        icon: { paths: ["M0 0L10 10"] },
      },
      mobile: { label: "Mobile", color: "blue" },
    };
    const element = await mount(() =>
      chart({
        props: { id: "rich", config: richConfig },
        surface: { fallbackTooltip: TooltipBody },
        children: () => legend(),
      }),
    );

    const desktop = legendButton(element, "desktop");
    expect(desktop.getAttribute("aria-label")).toBe("Desktop");
    expect(desktop.querySelector('[data-testid="rich"]')).not.toBeNull();
    expect(
      desktop.querySelector('[data-slot="chart-legend-icon"] svg path')?.getAttribute("d"),
    ).toBe("M0 0L10 10");
    expect(desktop.querySelector('[data-slot="chart-legend-swatch"]')).toBeNull();
    expect(
      legendButton(element, "mobile").querySelector('[data-slot="chart-legend-swatch"]'),
    ).not.toBeNull();

    await focusFirstPoint(element);
    const tooltip = status()!;
    await vi.waitFor(() =>
      expect(tooltip.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2),
    );
    expect(tooltip.querySelector('[data-testid="rich"]')).not.toBeNull();
    expect(
      tooltip.querySelector('[data-key="desktop"] [data-slot="chart-tooltip-icon"] svg'),
    ).not.toBeNull();
    expect(
      tooltip.querySelector('[data-key="desktop"] [data-slot="chart-tooltip-indicator"]'),
    ).toBeNull();
    const values = [...tooltip.querySelectorAll("[data-slot=chart-tooltip-value]")].map(
      (node) => node.textContent,
    );
    const heading = tooltip.querySelector("[data-slot=chart-tooltip-label]")!.textContent;
    await vi.waitFor(() =>
      expect(tooltip.getAttribute("aria-label")).toBe(
        `${heading} Desktop ${values[0]} Mobile ${values[1]}\n${heading}\nDesktop: ${values[0]}\nMobile: ${values[1]}`,
      ),
    );
  });

  it("renders a native definition with a Surface and a passive legend", async () => {
    const definition = nativeDefinition();
    const element = await mount(() =>
      h(ChartPrimitive.Root, { id: "definition", definition, config }, () => [
        h(ChartPrimitive.Surface),
        legend(),
      ]),
    );

    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(chartRoot(element).dataset.state).toBe("active");
    expect(barCount(element)).toBe(6);
    const items = element.querySelectorAll('[data-slot="chart-legend-item"]');
    expect([...items].map((item) => item.tagName)).toEqual(["SPAN", "SPAN"]);
    (items[0] as HTMLElement).click();
    await settle();
    expect(barCount(element)).toBe(6);
  });

  it("uses the native body with nativeTooltip and clears the custom body on blur", async () => {
    const element = await mount(() =>
      chart({
        props: { id: "native-body" },
        surface: { fallbackTooltip: TooltipBody, nativeTooltip: true },
      }),
    );
    await focusFirstPoint(element);
    expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();

    const custom = await mount(() =>
      chart({ props: { id: "blur" }, surface: { fallbackTooltip: TooltipBody } }),
    );
    await focusFirstPoint(custom);
    const tooltip = () =>
      document.querySelector('[data-slot=chart-tooltip-content][data-chart="blur"]');
    await vi.waitFor(() => expect(tooltip()).not.toBeNull());
    custom.querySelector<SVGElement>("svg[tabindex]")!.blur();
    await vi.waitFor(() => expect(tooltip()).toBeNull());
  });

  it("exposes the rendered element on part refs", async () => {
    const rootRef = ref<{ element: HTMLElement | null } | null>(null);
    const legendRef = ref<{ element: HTMLElement | null } | null>(null);
    const itemRef = ref<{ element: HTMLElement | null } | null>(null);
    const element = await mount(() =>
      h(
        ChartPrimitive.Root,
        { id: "refs", chart: visitorBars, data: visitorData(), config, ref: rootRef },
        () => [
          h(ChartPrimitive.Surface),
          h(ChartPrimitive.Legend, { ref: legendRef }, () =>
            h(ChartPrimitive.LegendItem, { value: "desktop", ref: itemRef }, () => "Desktop"),
          ),
        ],
      ),
    );

    expect(rootRef.value?.element).toBe(chartRoot(element));
    expect(legendRef.value?.element).toBe(element.querySelector('[data-slot="chart-legend"]'));
    expect(itemRef.value?.element).toBe(legendButton(element, "desktop"));
  });

  it("shows a tooltip slot that is added after mount", async () => {
    const rich = ref(false);
    const element = await mount(() =>
      chart({
        props: { id: "late-slot" },
        surfaceSlots: rich.value
          ? { tooltip: () => h("span", { "data-testid": "late-slot" }, "Late body") }
          : {},
      }),
    );
    rich.value = true;
    await settle();
    await focusFirstPoint(element);

    await vi.waitFor(() =>
      expect(status()!.querySelector('[data-testid="late-slot"]')).not.toBeNull(),
    );
    await vi.waitFor(() => expect(status()!.getAttribute("aria-label")).toMatch(/^Late body\n/));
  });

  it("hands over to the registered Tooltip when the tooltip slot is removed", async () => {
    const rich = ref(true);
    const element = await mount(() =>
      chart({
        props: { id: "slot-handover" },
        surfaceSlots: rich.value
          ? { tooltip: () => h("span", { "data-testid": "slot" }, "Slot body") }
          : {},
        children: () =>
          h(ChartPrimitive.Tooltip, null, () =>
            h("span", { "data-testid": "registered" }, "Registered body"),
          ),
      }),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(status()!.querySelector('[data-testid="slot"]')).not.toBeNull());
    expect(status()!.querySelector('[data-testid="registered"]')).toBeNull();

    rich.value = false;
    await vi.waitFor(() =>
      expect(status()!.querySelector('[data-testid="registered"]')).not.toBeNull(),
    );
    expect(status()!.querySelector('[data-testid="slot"]')).toBeNull();
    await vi.waitFor(() =>
      expect(status()!.getAttribute("aria-label")).toMatch(/^Registered body\n/),
    );
  });

  it("hands over to fallbackTooltip, or to the native body, when the tooltip slot is removed", async () => {
    const rich = ref(true);
    const element = await mount(() =>
      chart({
        props: { id: "slot-fallback", defaultVisible: ["mobile"] },
        surface: { fallbackTooltip: TooltipBody },
        surfaceSlots: rich.value
          ? { tooltip: () => h("span", { "data-testid": "slot" }, "Slot body") }
          : {},
      }),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(status()!.querySelector('[data-testid="slot"]')).not.toBeNull());
    rich.value = false;
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    expect(status()!.querySelector('[data-testid="slot"]')).toBeNull();
    const value = status()!.querySelector("[data-slot=chart-tooltip-value]")!.textContent;
    await vi.waitFor(() =>
      expect(status()!.getAttribute("aria-label")).toContain(`Mobile ${value}`),
    );

    document.body.innerHTML = "";
    const native = ref(true);
    const second = await mount(() =>
      chart({
        props: { id: "slot-native" },
        surfaceSlots: native.value
          ? { tooltip: () => h("span", { "data-testid": "slot" }, "Slot body") }
          : {},
      }),
    );
    await focusFirstPoint(second);
    await vi.waitFor(() => expect(status()!.querySelector('[data-testid="slot"]')).not.toBeNull());
    native.value = false;
    await settle();
    second.querySelector<SVGElement>("svg[tabindex]")!.blur();
    await settle();
    await focusFirstPoint(second);
    await vi.waitFor(() => expect(status()!.textContent).not.toBe(""));
    expect(status()!.querySelector('[data-testid="slot"]')).toBeNull();
  });

  it("reads a plain heading next to TooltipContent into the tooltip and its label", async () => {
    const element = await mount(() =>
      chart({
        props: { id: "plain-heading", defaultVisible: ["mobile"] },
        surfaceSlots: {
          tooltip: () => [h("p", { "data-testid": "plain" }, "Visitors"), h(TooltipBody)],
        },
      }),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    expect(status()!.querySelector('[data-testid="plain"]')).not.toBeNull();
    const heading = status()!.querySelector("[data-slot=chart-tooltip-label]")!.textContent;
    const value = status()!.querySelector("[data-slot=chart-tooltip-value]")!.textContent;
    await vi.waitFor(() =>
      expect(status()!.getAttribute("aria-label")).toBe(
        `Visitors ${heading} Mobile ${value}\n${heading}\nMobile: ${value}`,
      ),
    );
  });

  it("starts a new controller when KeepAlive activates a chart that the Runtime destroyed", async () => {
    const shown = ref(true);
    const Chart = defineComponent({
      name: "KeptChart",
      setup: () => () => chart({ props: { id: "kept" }, children: () => legend() }),
    });
    const Other = defineComponent({ name: "Other", setup: () => () => h("p", "other") });
    const element = await mount(() => h(KeepAlive, null, [shown.value ? h(Chart) : h(Other)]));
    const root = chartRoot(element);
    const first = getChartController(root);
    expect(first).toBeDefined();

    shown.value = false;
    await settle();
    // The Runtime root-removal observer destroys a controller whose root left the document.
    first!.destroy();
    expect(getChartController(root)).toBeUndefined();

    shown.value = true;
    await settle();
    const second = getChartController(chartRoot(element));
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
    expect(element.querySelectorAll("svg")).toHaveLength(1);
    legendButton(element, "desktop").click();
    await settle();
    expect(barCount(element)).toBe(3);
  });
});

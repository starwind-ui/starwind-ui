import { getChartController } from "@starwind-ui/runtime/chart";
import * as React from "react";
import { act } from "react";
import { createPortal } from "react-dom";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type VisitorRow,
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../runtime/tests/components/chart/fixtures";
import ChartPrimitive, { type ChartConfig, type ChartRootProps } from "../src/chart/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const config = visitorConfig as ChartConfig;
const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function container(): HTMLDivElement {
  const element = document.createElement("div");
  element.style.width = "600px";
  document.body.append(element);
  return element;
}

async function render(node: React.ReactNode): Promise<HTMLDivElement> {
  const element = container();
  const root = createRoot(element);
  roots.push(root);
  await act(async () => root.render(node));
  await nextFrame();
  return element;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
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
  await act(async () => {
    element.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
  });
  await vi.waitFor(() => expect(status()).not.toBeNull());
}

type ChartProps = Partial<ChartRootProps<VisitorRow>> & {
  surface?: React.ComponentProps<typeof ChartPrimitive.Surface>;
};

function Chart({ children, surface, ...props }: ChartProps) {
  return (
    <ChartPrimitive.Root<VisitorRow>
      chart={visitorBars}
      data={visitorData()}
      config={config}
      {...(props as Partial<ChartRootProps<VisitorRow>>)}
    >
      <ChartPrimitive.Style />
      <ChartPrimitive.Surface {...surface} />
      {children}
    </ChartPrimitive.Root>
  );
}

function Legend(props: { onClick?: React.MouseEventHandler<HTMLButtonElement> }) {
  return (
    <ChartPrimitive.Legend>
      <ChartPrimitive.LegendItems>
        <ChartPrimitive.LegendItem onClick={props.onClick}>
          <ChartPrimitive.LegendSwatch />
          <ChartPrimitive.LegendIcon />
          <ChartPrimitive.LegendLabel />
        </ChartPrimitive.LegendItem>
      </ChartPrimitive.LegendItems>
    </ChartPrimitive.Legend>
  );
}

function TooltipBody() {
  return (
    <ChartPrimitive.TooltipContent indicator="line" className="content">
      <ChartPrimitive.TooltipLabel className="label" />
      <ChartPrimitive.TooltipItems>
        <ChartPrimitive.TooltipItem className="row">
          <ChartPrimitive.TooltipIcon />
          <ChartPrimitive.TooltipIndicator />
          <ChartPrimitive.TooltipName labelClassName="label" />
          <ChartPrimitive.TooltipValue />
        </ChartPrimitive.TooltipItem>
      </ChartPrimitive.TooltipItems>
    </ChartPrimitive.TooltipContent>
  );
}

function legendButton(element: ParentNode, key: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(
    `[data-slot="chart-legend-item"][data-key="${key}"]`,
  )!;
}

describe("React chart Primitive", () => {
  it("hydrates the server SVG and adopts it without a second SVG", async () => {
    const node = (
      <Chart id="hydrate">
        <Legend />
      </Chart>
    );
    const element = container();
    element.innerHTML = renderToString(node);
    const serverSvg = element.querySelector("svg");
    const errors = vi.fn();

    await act(async () => {
      roots.push(hydrateRoot(element, node, { onRecoverableError: errors }));
    });
    await nextFrame();

    expect(errors).not.toHaveBeenCalled();
    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(element.querySelector("svg")).toBe(serverSvg);
    expect(chartRoot(element).dataset.state).toBe("active");
    expect(getChartController(chartRoot(element))?.getScene()?.points).toHaveLength(6);
  });

  it("keeps matching generated ids through hydration", async () => {
    const node = (
      <>
        <Chart />
        <Chart />
      </>
    );
    const element = container();
    element.innerHTML = renderToString(node);
    const serverIds = [...element.querySelectorAll<HTMLElement>('[data-slot="chart"]')].map(
      (root) => root.dataset.chart,
    );
    const errors = vi.fn();

    await act(async () => {
      roots.push(hydrateRoot(element, node, { onRecoverableError: errors }));
    });
    await nextFrame();

    const ids = [...element.querySelectorAll<HTMLElement>('[data-slot="chart"]')].map(
      (root) => root.dataset.chart,
    );
    expect(errors).not.toHaveBeenCalled();
    expect(ids).toEqual(serverIds);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^chart-[a-zA-Z0-9_-]+$/);
  });

  it("leaves one SVG and a live controller in StrictMode", async () => {
    const element = await render(
      <React.StrictMode>
        <Chart id="strict" />
      </React.StrictMode>,
    );

    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(chartRoot(element).dataset.state).toBe("active");
    expect(barCount(element)).toBe(6);
  });

  it("updates through the controller without React rewriting the surface", async () => {
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    await act(async () => root.render(<Chart id="update" data={visitorData()} />));
    await nextFrame();
    const surface = element.querySelector('[data-slot="chart-surface"]')!;
    const svg = surface.querySelector("svg");

    await act(async () =>
      root.render(<Chart id="update" data={visitorData().slice(0, 1)} className="next" />),
    );
    await nextFrame();

    expect(surface.querySelectorAll("svg")).toHaveLength(1);
    expect(surface.querySelector("svg")).toBe(svg);
    expect(barCount(element)).toBe(2);
  });

  it("toggles series from legend items in the uncontrolled model", async () => {
    const onVisibleChange = vi.fn();
    const events: string[][] = [];
    const element = await render(
      <Chart id="uncontrolled" onVisibleChange={onVisibleChange}>
        <Legend />
      </Chart>,
    );
    chartRoot(element).addEventListener("starwind-chart:visible-change", (event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
    );

    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();

    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![0]).toEqual(["mobile"]);
    const details = onVisibleChange.mock.calls[0]![1];
    expect(details.visible).toEqual(["mobile"]);
    expect(details.previousVisible).toEqual(["desktop", "mobile"]);
    expect(details.reason).toBe("legend-toggle");
    expect(details.key).toBe("desktop");
    expect(details.trigger === legendButton(element, "desktop")).toBe(true);
    expect(events).toEqual([["mobile"]]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(legendButton(element, "desktop").dataset.state).toBe("off");
    expect(barCount(element)).toBe(3);
  });

  it("keeps the working Surface connected after a portaled Surface unmounts", async () => {
    const outside = container();
    const onVisibleChange = vi.fn();
    let setPortal: (next: boolean) => void = () => {};
    function Harness() {
      const [portal, set] = React.useState(true);
      setPortal = set;
      return (
        <Chart id="portaled" onVisibleChange={onVisibleChange}>
          {portal ? createPortal(<ChartPrimitive.Surface />, outside) : null}
          <Legend />
        </Chart>
      );
    }
    const element = await render(<Harness />);

    await act(async () => setPortal(false));
    await nextFrame();
    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();

    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);
  });

  it("keeps controlled visibility until the prop changes", async () => {
    const onVisibleChange = vi.fn();
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const node = (visible: string[]) => (
      <Chart id="controlled" visible={visible} onVisibleChange={onVisibleChange}>
        <Legend />
      </Chart>
    );
    await act(async () => root.render(node(["desktop", "mobile"])));
    await nextFrame();

    await act(async () => legendButton(element, "mobile").click());
    await nextFrame();
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![0]).toEqual(["desktop"]);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);
    expect(getChartController(chartRoot(element))!.getVisible()).toEqual(["desktop", "mobile"]);

    await act(async () => root.render(node(["desktop"])));
    await nextFrame();
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);
  });

  it("renders the chart once per accepted toggle", async () => {
    const factory = vi.fn(visitorBars);
    const element = await render(
      <Chart id="echo" chart={factory}>
        <Legend />
      </Chart>,
    );
    const controller = getChartController(chartRoot(element))!;
    const update = vi.spyOn(controller, "update");
    const calls = factory.mock.calls.length;

    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();

    expect(factory.mock.calls.length - calls).toBe(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(barCount(element)).toBe(3);
  });

  it("keeps the chart when a parent starts controlling the keys on the first click", async () => {
    const factory = vi.fn(visitorBars);
    const rows = visitorData();
    function Parent() {
      const [visible, setVisible] = React.useState<string[]>();
      return (
        <Chart
          id="late-control"
          chart={factory}
          data={rows}
          visible={visible}
          onVisibleChange={(next) => setVisible(next)}
        >
          <Legend />
        </Chart>
      );
    }
    const element = await render(<Parent />);
    const controller = getChartController(chartRoot(element))!;
    await focusFirstPoint(element);
    const calls = factory.mock.calls.length;

    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();

    expect(factory.mock.calls.length - calls).toBe(1);
    expect(getChartController(chartRoot(element))).toBe(controller);
    expect(status()).not.toBeNull();
    expect(barCount(element)).toBe(3);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
  });

  it("renders once when a controlled parent changes data and visible together", async () => {
    const factory = vi.fn(visitorBars);
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const node = (rows: VisitorRow[], visible: string[]) => (
      <Chart id="together" chart={factory} data={rows} visible={visible}>
        <Legend />
      </Chart>
    );
    await act(async () => root.render(node(visitorData(), ["desktop", "mobile"])));
    await nextFrame();
    const calls = factory.mock.calls.length;

    await act(async () => root.render(node(visitorData().slice(0, 2), ["desktop"])));
    await nextFrame();

    expect(factory.mock.calls.length - calls).toBe(1);
    expect(barCount(element)).toBe(2);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
  });

  it("treats a later defined visible as a silent command on a Runtime-owned model (ADR 0011)", async () => {
    const onVisibleChange = vi.fn();
    const rows = visitorData();
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const node = (visible?: string[]) => (
      <Chart id="flip" data={rows} visible={visible} onVisibleChange={onVisibleChange}>
        <Legend />
      </Chart>
    );
    await act(async () => root.render(node()));
    await nextFrame();
    const controller = getChartController(chartRoot(element))!;
    await act(async () => root.render(node(["desktop", "mobile"])));
    await nextFrame();

    // The model started Runtime-owned, so the click commits once.
    await act(async () => legendButton(element, "mobile").click());
    await nextFrame();
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![0]).toEqual(["desktop"]);
    expect(controller.getVisible()).toEqual(["desktop"]);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);

    // A parent echo of the accepted keys changes nothing and keeps the controller and tooltip.
    await focusFirstPoint(element);
    const update = vi.spyOn(controller, "update");
    await act(async () => root.render(node(["desktop"])));
    await nextFrame();
    expect(update).not.toHaveBeenCalled();
    expect(getChartController(chartRoot(element))).toBe(controller);
    expect(status()).not.toBeNull();
  });

  it("applies visible as a silent command after a swap from a native definition to a source", async () => {
    const definition = visitorBars({
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
    const onVisibleChange = vi.fn();
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    await act(async () =>
      root.render(
        <ChartPrimitive.Root id="definition-flip" definition={definition} config={config}>
          <ChartPrimitive.Surface />
          <Legend />
        </ChartPrimitive.Root>,
      ),
    );
    await nextFrame();
    await act(async () =>
      root.render(
        <ChartPrimitive.Root<VisitorRow>
          id="definition-flip"
          chart={visitorBars}
          data={visitorData()}
          config={config}
          visible={["desktop"]}
          onVisibleChange={onVisibleChange}
        >
          <ChartPrimitive.Surface />
          <Legend />
        </ChartPrimitive.Root>,
      ),
    );
    await nextFrame();
    expect(barCount(element)).toBe(3);

    await act(async () => legendButton(element, "mobile").click());
    await nextFrame();

    // The Root mounted without visible keys, so the Runtime owns them and the click commits.
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![0]).toEqual(["desktop", "mobile"]);
    expect(getChartController(chartRoot(element))!.getVisible()).toEqual(["desktop", "mobile"]);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);
  });

  it("starts a chart module that arrives after an empty parts render", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    // While data loads, the chart has no parts, no chart module and no definition.
    await act(async () =>
      root.render(
        <ChartPrimitive.Root<VisitorRow> id="late-module" data={[]} config={config}>
          <ChartPrimitive.Surface />
        </ChartPrimitive.Root>,
      ),
    );
    await nextFrame();
    expect(getChartController(chartRoot(element))).toBeFalsy();
    await act(async () =>
      root.render(
        <ChartPrimitive.Root<VisitorRow>
          id="late-module"
          chart={visitorBars}
          data={visitorData()}
          config={config}
        >
          <ChartPrimitive.Surface />
        </ChartPrimitive.Root>,
      ),
    );
    await nextFrame();
    expect(getChartController(chartRoot(element))).toBeTruthy();
    expect(barCount(element)).toBe(6);
    warn.mockRestore();
  });

  it("keeps a toggle when the controller restarts", async () => {
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const node = (id: string) => (
      <Chart id={id}>
        <Legend />
      </Chart>
    );
    await act(async () => root.render(node("restart-a")));
    await nextFrame();
    const first = getChartController(chartRoot(element))!;
    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();

    await act(async () => root.render(node("restart-b")));
    await nextFrame();
    const second = getChartController(chartRoot(element))!;
    expect(second).not.toBe(first);
    expect(second.getVisible()).toEqual(["mobile"]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);
  });

  it("keeps a toggle through a swap to a native definition and back", async () => {
    const definition = visitorBars({
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
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const node = (native: boolean) =>
      native ? (
        <ChartPrimitive.Root id="swap" definition={definition} config={config}>
          <ChartPrimitive.Surface />
          <Legend />
        </ChartPrimitive.Root>
      ) : (
        <ChartPrimitive.Root<VisitorRow>
          id="swap"
          chart={visitorBars}
          data={visitorData()}
          config={config}
        >
          <ChartPrimitive.Surface />
          <Legend />
        </ChartPrimitive.Root>
      );
    await act(async () => root.render(node(false)));
    await nextFrame();
    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();
    expect(barCount(element)).toBe(3);

    await act(async () => root.render(node(true)));
    await nextFrame();
    expect(barCount(element)).toBe(6);

    await act(async () => root.render(node(false)));
    await nextFrame();
    expect(getChartController(chartRoot(element))!.getVisible()).toEqual(["mobile"]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(barCount(element)).toBe(3);
  });

  it("starts with defaultVisible", async () => {
    const element = await render(
      <Chart id="default-visible" defaultVisible={["desktop"]}>
        <Legend />
      </Chart>,
    );
    expect(barCount(element)).toBe(3);
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("false");
  });

  it("cancels the toggle from a click handler or the cancelable event", async () => {
    const onVisibleChange = vi.fn();
    const element = await render(
      <Chart id="cancel" onVisibleChange={onVisibleChange}>
        <Legend onClick={(event) => event.preventDefault()} />
      </Chart>,
    );
    await act(async () => legendButton(element, "desktop").click());
    await nextFrame();
    expect(onVisibleChange).not.toHaveBeenCalled();
    expect(barCount(element)).toBe(6);

    const second = await render(
      <Chart id="cancel-event" onVisibleChange={onVisibleChange}>
        <Legend />
      </Chart>,
    );
    chartRoot(second).addEventListener("starwind-chart:visible-change", (event) =>
      event.preventDefault(),
    );
    await act(async () => legendButton(second, "desktop").click());
    await nextFrame();
    // The callback runs before the cancelable event, as in the other Runtime families.
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]![1].isCanceled).toBe(true);
    expect(legendButton(second, "desktop").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(second)).toBe(6);
  });

  it("shows the fallback tooltip from the keyboard and syncs the accessible label", async () => {
    const element = await render(
      <Chart
        id="keyboard"
        defaultVisible={["mobile"]}
        surface={{ fallbackTooltip: <TooltipBody /> }}
      />,
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

  it("uses the first Tooltip, hands over on removal and keeps order on re-render", async () => {
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const node = (showFirst: boolean, tick: number) => (
      <Chart id="order" data-tick={tick}>
        {showFirst ? <ChartPrimitive.Tooltip>first</ChartPrimitive.Tooltip> : null}
        <div>
          <ChartPrimitive.Tooltip>second</ChartPrimitive.Tooltip>
        </div>
      </Chart>
    );
    await act(async () => root.render(node(true, 0)));
    await nextFrame();
    await act(async () => root.render(node(true, 1)));
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(status()!.textContent).toContain("first"));
    expect(status()!.textContent).not.toContain("second");

    await act(async () => root.render(node(false, 2)));
    await vi.waitFor(() => expect(status()!.textContent).toContain("second"));
  });

  it("renders a Tooltip inside a tooltip body in place", async () => {
    const element = await render(
      <Chart
        id="in-body"
        surface={{
          tooltip: (
            <ChartPrimitive.Tooltip>
              <span data-testid="in-place">in place</span>
            </ChartPrimitive.Tooltip>
          ),
        }}
      >
        <ChartPrimitive.Tooltip>registered</ChartPrimitive.Tooltip>
      </Chart>,
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
        label: <strong data-testid="rich">Desktop</strong>,
        text: "Desktop",
        color: "red",
        icon: { paths: ["M0 0L10 10"] },
      },
      mobile: { label: "Mobile", color: "blue" },
    };
    const element = await render(
      <Chart id="rich" config={richConfig} surface={{ fallbackTooltip: <TooltipBody /> }}>
        <Legend />
      </Chart>,
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
    const definition = visitorBars({
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
    const element = await render(
      <ChartPrimitive.Root id="definition" definition={definition} config={config}>
        <ChartPrimitive.Surface />
        <Legend />
      </ChartPrimitive.Root>,
    );

    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(chartRoot(element).dataset.state).toBe("active");
    expect(barCount(element)).toBe(6);
    const items = element.querySelectorAll('[data-slot="chart-legend-item"]');
    expect([...items].map((item) => item.tagName)).toEqual(["SPAN", "SPAN"]);
    await act(async () => (items[0] as HTMLElement).click());
    expect(barCount(element)).toBe(6);
  });

  it("uses the native body with nativeTooltip and clears the custom body on blur", async () => {
    const element = await render(
      <Chart
        id="native-body"
        surface={{ fallbackTooltip: <TooltipBody />, nativeTooltip: true }}
      />,
    );
    await focusFirstPoint(element);
    expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();

    const custom = await render(<Chart id="blur" surface={{ fallbackTooltip: <TooltipBody /> }} />);
    await focusFirstPoint(custom);
    const tooltip = () =>
      document.querySelector('[data-slot=chart-tooltip-content][data-chart="blur"]');
    await vi.waitFor(() => expect(tooltip()).not.toBeNull());
    await act(async () => custom.querySelector<SVGElement>("svg[tabindex]")!.blur());
    await vi.waitFor(() => expect(tooltip()).toBeNull());
  });
});

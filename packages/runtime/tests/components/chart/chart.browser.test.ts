import type { ChartTooltipBodyTarget, DomChartDefinition } from "@tanstack/charts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type ChartController,
  type ChartInput,
  createChart,
  defineChartModule,
  getChartController,
  prerenderChart,
  registerChartModules,
  serializeChartPayload,
  startCharts,
  syncTooltipAccessibility,
} from "../../../src/components/chart";
import { type VisitorRow, visitorBars, visitorConfig, visitorInput } from "./fixtures";

let moduleCount = 0;
const controllers: ChartController[] = [];

function uniqueModuleId(): string {
  moduleCount += 1;
  return `test-chart-${moduleCount}`;
}

type RootOptions = { id?: string; surface?: string; extra?: string; attributes?: string };

function renderRoot(options: RootOptions = {}): HTMLElement {
  const { id = "chart-test", surface = "", extra = "", attributes = "" } = options;
  const host = document.createElement("div");
  host.innerHTML = `
    <div data-slot="chart" data-chart="${id}" style="width:600px" ${attributes}>
      <style data-slot="chart-style"></style>
      <div data-slot="chart-surface" data-sw-chart-surface>${surface}</div>
      ${extra}
    </div>`;
  const root = host.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

/** A server-rendered interactive root, as an Astro Primitive Root renders it. */
function renderServerRoot(
  moduleId: string,
  id: string,
  input: ChartInput<VisitorRow> = visitorInput(),
  extra = "",
): HTMLElement {
  const { markup } = prerenderChart(visitorBars, input, { id });
  return renderRoot({
    id,
    surface: markup,
    attributes: `data-sw-chart data-state="pending" data-chart-module="${moduleId}"`,
    extra: `${extra}<script type="application/json" data-sw-chart-input>${serializeChartPayload({ input })}</script>`,
  });
}

function legendButtons(root: HTMLElement, keys = ["desktop", "mobile"]): string {
  return `<div data-slot="chart-legend">${keys
    .map(
      (key) =>
        `<button type="button" data-slot="chart-legend-item" data-sw-chart-legend-item="${key}"><span data-slot="chart-legend-swatch"></span><span data-slot="chart-legend-label">${key}</span></button>`,
    )
    .join("")}</div>`;
}

function barCount(root: HTMLElement): number {
  return root.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

function track<T extends ChartController<any, any, any, any>>(controller: T): T {
  controllers.push(controller);
  return controller;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

async function focusFirstPoint(root: HTMLElement): Promise<void> {
  root.querySelector<SVGElement>("svg[tabindex]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await vi.waitFor(() => {
    expect(root.ownerDocument.querySelector(".ts-chart-tooltip[role=status]")).not.toBeNull();
  });
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  for (const root of document.querySelectorAll<HTMLElement>("[data-chart]"))
    getChartController(root)?.destroy();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("createChart", () => {
  it("adopts server-rendered SVG without rendering a second chart", async () => {
    const id = "chart-adopt";
    const { markup } = prerenderChart(visitorBars, visitorInput(), { id });
    const root = renderRoot({ id, surface: markup });
    const serverSvg = root.querySelector("svg");

    const controller = track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    await nextFrame();

    expect(root.querySelectorAll("svg")).toHaveLength(1);
    expect(root.querySelector("svg")).toBe(serverSvg);
    expect(root.dataset.state).toBe("active");
    expect(controller.getScene()?.points).toHaveLength(6);
    expect(createChart(root)).toBe(controller);
    expect(getChartController(root)).toBe(controller);
  });

  it("mounts a fresh chart into an empty surface", async () => {
    const root = renderRoot();
    track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    await nextFrame();

    expect(root.querySelectorAll("svg")).toHaveLength(1);
    expect(barCount(root)).toBe(6);
  });

  it("reads the wire payload and the registered module when no options are given", async () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Visitors chart", create: visitorBars });
    const root = renderServerRoot(moduleId, "chart-wire", visitorInput({ visible: ["mobile"] }));

    const controller = track(createChart(root));
    await nextFrame();

    expect(controller.getVisible()).toEqual(["mobile"]);
    expect(barCount(root)).toBe(3);
    expect(root.querySelector("svg")?.getAttribute("aria-label")).toBe("Visitors chart");
  });

  it("throws a clear error for a root without a source", () => {
    const root = renderRoot({ attributes: 'data-chart-module="missing-module"' });
    expect(() => createChart(root)).toThrow(/missing-module/);
  });

  it("writes config color styles", async () => {
    const root = renderRoot({ id: "chart-style" });
    track(createChart(root, { chart: visitorBars, input: visitorInput() }));

    const style = root.querySelector("[data-slot=chart-style]")!.textContent;
    expect(style).toContain('[data-chart="chart-style"]{--sw-chart-color-desktop:rgb(37, 99, 235)');
    expect(getComputedStyle(root).getPropertyValue("--color-mobile").trim()).toBe(
      "rgb(96, 165, 250)",
    );
  });

  it("rebuilds the definition from the visible keys on update and visibility changes", async () => {
    const factory = vi.fn(visitorBars);
    const root = renderRoot();
    const controller = track(createChart(root, { chart: factory, input: visitorInput() }));
    await nextFrame();
    expect(barCount(root)).toBe(6);

    controller.update({ data: visitorInput().data.slice(0, 2) });
    await nextFrame();
    expect(barCount(root)).toBe(4);

    expect(controller.setVisible(["desktop"])).toBe(true);
    await nextFrame();
    expect(factory.mock.lastCall![0].visible).toEqual(["desktop"]);
    expect(barCount(root)).toBe(2);
    expect(controller.getVisible()).toEqual(["desktop"]);
  });

  it("toggles series from legend buttons and dispatches a cancelable event", async () => {
    const root = renderRoot({ extra: legendButtons(document.body) });
    const controller = track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    const desktop = root.querySelector<HTMLButtonElement>('[data-sw-chart-legend-item="desktop"]')!;
    const events: string[][] = [];
    root.addEventListener("starwind-chart:visible-change", (event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
    );

    expect(desktop.getAttribute("aria-pressed")).toBe("true");
    desktop.click();
    await nextFrame();

    expect(events).toEqual([["mobile"]]);
    expect(controller.getVisible()).toEqual(["mobile"]);
    expect(desktop.getAttribute("aria-pressed")).toBe("false");
    expect(desktop.dataset.state).toBe("off");
    expect(barCount(root)).toBe(3);

    root.addEventListener("starwind-chart:visible-change", (event) => event.preventDefault(), {
      once: true,
    });
    desktop.click();
    expect(controller.getVisible()).toEqual(["mobile"]);

    desktop.addEventListener("click", (event) => event.preventDefault(), { once: true });
    desktop.click();
    expect(controller.getVisible()).toEqual(["mobile"]);

    desktop.click();
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
  });

  it("runs the callback, then the event, then the commit, then subscribers", () => {
    const order: string[] = [];
    const root = renderRoot({ extra: legendButtons(document.body) });
    const controller = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onVisibleChange: (visible, details) => {
          order.push(`callback ${visible} ${controller.getVisible()}`);
          expect(details.previousVisible).toEqual(["desktop", "mobile"]);
          expect(details.reason).toBe("legend-toggle");
          expect(details.key).toBe("desktop");
          expect(details.trigger).toBe(desktop);
          expect(details.event?.type).toBe("click");
        },
      }),
    );
    const desktop = root.querySelector<HTMLButtonElement>('[data-sw-chart-legend-item="desktop"]')!;
    root.addEventListener("starwind-chart:visible-change", (event) =>
      order.push(`event ${(event as CustomEvent<{ visible: string[] }>).detail.visible}`),
    );
    controller.subscribe("visibleChange", (details) =>
      order.push(`subscriber ${details.visible} ${controller.getVisible()}`),
    );

    desktop.click();

    expect(order).toEqual([
      "callback mobile desktop,mobile",
      "event mobile",
      "subscriber mobile mobile",
    ]);
  });

  it("cancels a request from the callback details", () => {
    const changes: string[][] = [];
    const root = renderRoot();
    const controller = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onVisibleChange: (_visible, details) => details.cancel(),
      }),
    );
    controller.subscribe("visibleChange", (details) => changes.push(details.visible));

    expect(controller.toggle("mobile")).toBe(false);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
    expect(changes).toEqual([]);
  });

  it("restores the previous keys when a listener cancels keys that the callback synchronized", () => {
    const changes: string[][] = [];
    const root = renderRoot({ id: "sync-restore" });
    const controller: ChartController<VisitorRow, any, any, any> = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onVisibleChange: (next) => controller.setVisible(next, { emit: false }),
      }),
    );
    root.addEventListener("starwind-chart:visible-change", (event) => event.preventDefault());
    controller.subscribe("visibleChange", (details) => changes.push(details.visible));

    expect(controller.toggle("mobile")).toBe(false);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
    expect(changes).toEqual([]);
  });

  it("keeps a silent write of other keys from the callback, canceled or accepted", () => {
    const root = renderRoot({ id: "sync-supersede" });
    const controller: ChartController<VisitorRow, any, any, any> = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onVisibleChange: () => controller.setVisible(["mobile"], { emit: false }),
      }),
    );

    // Accepted: the proposal is "desktop" alone, and the silent write of "mobile" wins.
    expect(controller.toggle("mobile")).toBe(true);
    expect(controller.getVisible()).toEqual(["mobile"]);

    controller.setVisible(undefined, { emit: false });
    const cancel = (event: Event) => event.preventDefault();
    root.addEventListener("starwind-chart:visible-change", cancel);
    expect(controller.toggle("mobile")).toBe(false);
    expect(controller.getVisible()).toEqual(["mobile"]);
    root.removeEventListener("starwind-chart:visible-change", cancel);
  });

  it("keeps keys that a canceling DOM listener writes itself", () => {
    const root = renderRoot({ id: "listener-owned" });
    const controller = track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    // An Astro page holds the model this way: it cancels the event and sets the keys.
    root.addEventListener("starwind-chart:visible-change", (event) => {
      event.preventDefault();
      controller.setVisible((event as CustomEvent<{ visible: string[] }>).detail.visible, {
        emit: false,
      });
    });

    expect(controller.toggle("mobile")).toBe(false);
    expect(controller.getVisible()).toEqual(["desktop"]);
  });

  it("renders once when the callback silently applies the proposed keys", () => {
    const factory = vi.fn(visitorBars);
    const root = renderRoot({ id: "sync-once" });
    const controller: ChartController<VisitorRow, any, any, any> = track(
      createChart(root, {
        chart: factory,
        input: visitorInput(),
        onVisibleChange: (next) => controller.setVisible(next, { emit: false }),
      }),
    );
    const calls = factory.mock.calls.length;

    expect(controller.toggle("mobile")).toBe(true);
    expect(controller.getVisible()).toEqual(["desktop"]);
    expect(factory.mock.calls.length - calls).toBe(1);
  });

  it("keeps the previous keys when the callback silently writes them without a cancel", () => {
    const root = renderRoot({ id: "sync-previous" });
    const controller: ChartController<VisitorRow, any, any, any> = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onVisibleChange: (_next, details) =>
          controller.setVisible(details.previousVisible, { emit: false }),
      }),
    );

    expect(controller.toggle("mobile")).toBe(true);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
  });

  it("still restores the callback's keys when a listener write throws before it cancels", () => {
    const root = renderRoot({ id: "sync-throw" });
    // The factory fails for "mobile" alone, so the listener's write throws after it starts to apply.
    const failing: typeof visitorBars = (context) => {
      if (context.visible.length === 1 && context.visible[0] === "mobile") throw new Error("boom");
      return visitorBars(context);
    };
    const controller: ChartController<VisitorRow, any, any, any> = track(
      createChart(root, {
        chart: failing,
        input: visitorInput(),
        onVisibleChange: (next) => controller.setVisible(next, { emit: false }),
      }),
    );
    let thrown = false;
    root.addEventListener("starwind-chart:visible-change", (event) => {
      try {
        controller.setVisible(["mobile"], { emit: false });
      } catch {
        thrown = true;
      }
      event.preventDefault();
    });

    expect(controller.toggle("mobile")).toBe(false);
    expect(thrown).toBe(true);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
  });

  it("restores the callback's keys when a listener changes details.visible and cancels", () => {
    const root = renderRoot({ id: "sync-mutate" });
    const controller: ChartController<VisitorRow, any, any, any> = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onVisibleChange: (next) => controller.setVisible(next, { emit: false }),
      }),
    );
    root.addEventListener("starwind-chart:visible-change", (event) => {
      (event as CustomEvent<{ visible: string[] }>).detail.visible.length = 0;
      event.preventDefault();
    });

    expect(controller.toggle("mobile")).toBe(false);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
  });

  it("stops a request when the callback destroys the controller", () => {
    const events: string[][] = [];
    const changes: string[][] = [];
    const root = renderRoot();
    const controller: ChartController<VisitorRow, any, any, any> = createChart(root, {
      chart: visitorBars,
      input: visitorInput(),
      onVisibleChange: () => controller.destroy(),
    });
    root.addEventListener("starwind-chart:visible-change", (event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
    );
    controller.subscribe("visibleChange", (details) => changes.push(details.visible));

    expect(controller.toggle("mobile")).toBe(false);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
    expect(events).toEqual([]);
    expect(changes).toEqual([]);
  });

  it("stops a request when a DOM listener destroys the controller", () => {
    const changes: string[][] = [];
    const root = renderRoot();
    const controller = createChart(root, { chart: visitorBars, input: visitorInput() });
    root.addEventListener("starwind-chart:visible-change", () => controller.destroy());
    controller.subscribe("visibleChange", (details) => changes.push(details.visible));

    expect(controller.setVisible(["desktop"])).toBe(false);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
    expect(changes).toEqual([]);
  });

  it("proposes without a commit when controlled, and the owner sets the keys", async () => {
    const requests: string[][] = [];
    const changes: string[][] = [];
    const root = renderRoot({ extra: legendButtons(document.body) });
    const controller = track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        visible: ["desktop", "mobile"],
        onVisibleChange: (visible) => requests.push(visible),
      }),
    );
    controller.subscribe("visibleChange", (details) => changes.push(details.visible));
    const mobile = root.querySelector<HTMLButtonElement>('[data-sw-chart-legend-item="mobile"]')!;

    mobile.click();
    expect(requests).toEqual([["desktop"]]);
    expect(changes).toEqual([["desktop"]]);
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
    expect(mobile.getAttribute("aria-pressed")).toBe("true");

    expect(controller.setVisible(["desktop"], { emit: false })).toBe(true);
    await nextFrame();
    expect(requests).toHaveLength(1);
    expect(controller.getVisible()).toEqual(["desktop"]);
    expect(mobile.getAttribute("aria-pressed")).toBe("false");
    expect(barCount(root)).toBe(3);

    controller.update({ visible: ["mobile"] });
    expect(controller.getVisible()).toEqual(["mobile"]);
  });

  it("seeds from the controlled keys, then defaultVisible, then input.visible", () => {
    const seeded = (options: Parameters<typeof createChart<VisitorRow>>[1], id: string) => {
      const controller = track(createChart<VisitorRow>(renderRoot({ id }), options));
      return controller.getVisible();
    };
    const input = visitorInput({ visible: ["desktop"] });
    expect(seeded({ chart: visitorBars, input }, "seed-input")).toEqual(["desktop"]);
    expect(
      seeded({ chart: visitorBars, input, defaultVisible: ["mobile"] }, "seed-default"),
    ).toEqual(["mobile"]);
    expect(
      seeded(
        { chart: visitorBars, input, defaultVisible: ["mobile"], visible: undefined },
        "seed-controlled",
      ),
    ).toEqual(["desktop", "mobile"]);
  });

  it("sets keys without events and stops subscribers on destroy", () => {
    const events: string[][] = [];
    const changes: string[][] = [];
    const root = renderRoot();
    const controller = createChart(root, { chart: visitorBars, input: visitorInput() });
    root.addEventListener("starwind-chart:visible-change", (event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
    );
    const unsubscribe = controller.subscribe("visibleChange", (details) =>
      changes.push(details.visible),
    );

    controller.setVisible(["mobile", "unknown"], { emit: false });
    expect(controller.getVisible()).toEqual(["mobile"]);
    expect(controller.getInput().visible).toEqual(["mobile"]);
    expect(events).toEqual([]);
    expect(changes).toEqual([]);

    // `undefined` means every key, and a key added later to the config shows.
    controller.setVisible(undefined, { emit: false });
    controller.update({
      config: { ...visitorInput().config, tablet: { label: "Tablet", color: "green" } },
    });
    expect(controller.getVisible()).toEqual(["desktop", "mobile", "tablet"]);
    controller.update({ config: visitorInput().config });

    controller.setVisible(["desktop"]);
    unsubscribe();
    controller.setVisible(["mobile"]);
    expect(changes).toEqual([["desktop"]]);

    controller.destroy();
    expect(controller.setVisible(["desktop"])).toBe(false);
    expect(controller.toggle("desktop")).toBe(false);
  });

  it("builds legend items from a template and follows config changes", async () => {
    const template = `<div data-slot="chart-legend"><template data-sw-chart-legend-template data-swatch-class="swatch" data-icon-class="icon"><button type="button" data-slot="chart-legend-item"><span data-slot="chart-legend-swatch"></span><span data-slot="chart-legend-label"></span></button></template></div>`;
    const root = renderRoot({ extra: template });
    const controller = track(createChart(root, { chart: visitorBars, input: visitorInput() }));

    const labels = () =>
      [...root.querySelectorAll("[data-sw-chart-legend-item]")].map((item) => item.textContent);
    expect(labels()).toEqual(["Desktop", "Mobile"]);
    const swatch = root.querySelector<HTMLElement>("[data-slot=chart-legend-swatch]")!;
    expect(swatch.className).toBe("swatch");
    expect(swatch.style.background).toBe("var(--sw-chart-color-desktop)");

    controller.update({
      config: {
        mobile: { label: "Phones", color: "red" },
        tablet: { label: "Tablets", icon: { paths: ["M0 0h4"] }, color: "blue" },
      },
      visible: ["tablet"],
    });

    expect(labels()).toEqual(["Phones", "Tablets"]);
    const tablet = root.querySelector<HTMLElement>('[data-sw-chart-legend-item="tablet"]')!;
    expect(tablet.getAttribute("aria-pressed")).toBe("true");
    expect(tablet.querySelector("[data-slot=chart-legend-icon] svg path")?.getAttribute("d")).toBe(
      "M0 0h4",
    );
    expect(
      root.querySelector('[data-sw-chart-legend-item="mobile"]')?.getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("keeps a direct native definition legend passive", async () => {
    const definition = prerenderChart(visitorBars, visitorInput(), { id: "chart-native" }).options
      .definition as DomChartDefinition<unknown>;
    const root = renderRoot({ extra: legendButtons(document.body) });
    const controller = track(createChart(root, { definition, input: visitorInput() }));

    root.querySelector<HTMLButtonElement>('[data-sw-chart-legend-item="desktop"]')!.click();
    expect(controller.getVisible()).toEqual(["desktop", "mobile"]);
    expect(() => controller.setVisible(["desktop"])).toThrow(/own their visibility/);
  });

  it("sends tooltip body targets to the handler and clears them", async () => {
    const targets: (ChartTooltipBodyTarget | null)[] = [];
    const root = renderRoot();
    track(
      createChart(root, {
        chart: visitorBars,
        input: visitorInput(),
        onTooltipBodyChange: (target) => {
          targets.push(target);
          if (target) target.element.textContent = "custom body";
        },
      }),
    );
    await nextFrame();

    await focusFirstPoint(root);
    await vi.waitFor(() => expect(targets.at(-1)).toBeTruthy());
    const target = targets.at(-1)!;
    expect(target.element).toBeInstanceOf(HTMLElement);
    expect(target.points).toHaveLength(2);
    expect(target.primaryPoint).toBeDefined();
    expect(target.content).toMatchObject({ title: expect.any(String) });
    expect(target.element.textContent).toBe("custom body");

    root.querySelector<SVGElement>("svg[tabindex]")!.blur();
    await vi.waitFor(() => expect(targets.at(-1)).toBeNull());
  });

  it("hands an open tooltip body to a new handler", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const root = renderRoot();
    const controller = track(
      createChart(root, { chart: visitorBars, input: visitorInput(), onTooltipBodyChange: first }),
    );
    await nextFrame();
    await focusFirstPoint(root);
    await vi.waitFor(() => expect(first).toHaveBeenCalledWith(expect.objectContaining({})));

    controller.setOptions({ onTooltipBodyChange: second });
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ points: expect.any(Array) }));
  });

  it("fills a server tooltip template and syncs the accessible label to the visible rows", async () => {
    const template = `
      <template data-sw-chart-tooltip data-sw-chart-tooltip-options='{"indicator":"line"}'>
        <div data-slot="chart-tooltip-content">
          <div data-slot="chart-tooltip-label" class="label"></div>
          <template data-sw-chart-tooltip-row>
            <div data-slot="chart-tooltip-item">
              <span data-slot="chart-tooltip-indicator"></span>
              <span data-slot="chart-tooltip-name"></span>
              <span data-slot="chart-tooltip-value"></span>
            </div>
          </template>
        </div>
      </template>`;
    const root = renderRoot({ id: "chart-tip", extra: template });
    const controller = track(
      createChart(root, { chart: visitorBars, input: visitorInput({ visible: ["mobile"] }) }),
    );
    await nextFrame();
    await focusFirstPoint(root);

    const status = document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]")!;
    await vi.waitFor(() =>
      expect(status.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const body = status.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
    expect(body.dataset.chart).toBe("chart-tip");
    expect(body.dataset.indicator).toBe("line");
    expect(body.dataset.nested).toBe("true");
    const rows = body.querySelectorAll("[data-slot=chart-tooltip-item]");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.getAttribute("data-key")).toBe("mobile");
    const month = (target: ParentNode) =>
      target.querySelector("[data-slot=chart-tooltip-label]")?.textContent ?? "";
    const heading = month(body);
    expect(["January", "February", "March"]).toContain(heading);
    expect(body.querySelector("[data-slot=chart-tooltip-name]")?.textContent).toBe(
      `${heading}Mobile`,
    );
    const mobile = body.querySelector("[data-slot=chart-tooltip-value]")!.textContent;
    await vi.waitFor(() =>
      expect(status.getAttribute("aria-label")).toBe(
        `${heading} Mobile ${mobile}\n${heading}\nMobile: ${mobile}`,
      ),
    );

    controller.update({ visible: ["desktop", "mobile"] });
    await focusFirstPoint(root);
    await vi.waitFor(() =>
      expect(status.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2),
    );
    const values = () =>
      [...status.querySelectorAll("[data-slot=chart-tooltip-value]")].map((n) => n.textContent);
    await vi.waitFor(() => {
      const [desktop, mobile] = values();
      const title = month(status);
      expect(status.getAttribute("aria-label")).toBe(
        `${title} Desktop ${desktop} Mobile ${mobile}\n${title}\nDesktop: ${desktop}\nMobile: ${mobile}`,
      );
    });
  });

  it("shows a config-key heading from config text when the config label is empty", async () => {
    const template = `<template data-sw-chart-tooltip data-sw-chart-tooltip-options='{"label":"desktop"}'><div data-slot="chart-tooltip-content"><div data-slot="chart-tooltip-label"></div><template data-sw-chart-tooltip-row><div data-slot="chart-tooltip-item"><span data-slot="chart-tooltip-name"></span><span data-slot="chart-tooltip-value"></span></div></template></div></template>`;
    const root = renderRoot({ id: "chart-empty-label", extra: template });
    const config = {
      ...visitorConfig,
      desktop: { ...visitorConfig.desktop, label: "", text: "Revenue" },
    };
    track(createChart(root, { chart: visitorBars, input: visitorInput({ config }) }));
    await nextFrame();
    await focusFirstPoint(root);

    const status = document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]")!;
    await vi.waitFor(() =>
      expect(status.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const content = status.querySelector("[data-slot=chart-tooltip-content]")!;
    expect(content.querySelector(":scope > [data-slot=chart-tooltip-label]")?.textContent).toBe(
      "Revenue",
    );
  });

  it("renders a static tooltip template as written", async () => {
    const template = `<template data-sw-chart-tooltip data-sw-chart-tooltip-static><p class="note">Static note</p></template>`;
    const root = renderRoot({ id: "chart-static-tip", extra: template });
    track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    await nextFrame();
    await focusFirstPoint(root);

    const status = document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]")!;
    await vi.waitFor(() => expect(status.querySelector(".note")?.textContent).toBe("Static note"));
    expect(status.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toMatch(/^Static note\n/));
  });

  it("fills a TooltipContent template inside a static tooltip body", async () => {
    const template = `<template data-sw-chart-tooltip data-sw-chart-tooltip-static><p class="heading">Heading</p><template data-sw-chart-tooltip data-sw-chart-tooltip-options='{"indicator":"line"}'><div data-slot="chart-tooltip-content"><template data-sw-chart-tooltip-row><div data-slot="chart-tooltip-item"><span data-slot="chart-tooltip-name"></span><span data-slot="chart-tooltip-value"></span></div></template></div></template></template>`;
    const root = renderRoot({ id: "chart-mixed-tip", extra: template });
    track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    await nextFrame();
    await focusFirstPoint(root);

    const status = document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]")!;
    await vi.waitFor(() =>
      expect(status.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2),
    );
    expect(status.querySelector(".heading")?.textContent).toBe("Heading");
    const body = status.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
    expect(body.dataset.indicator).toBe("line");
    expect(body.dataset.chart).toBe("chart-mixed-tip");
    expect(status.querySelector("template")).toBeNull();
    // The plain heading reads first, then the content parts.
    const [desktop, mobile] = [...status.querySelectorAll("[data-slot=chart-tooltip-value]")].map(
      (node) => node.textContent,
    );
    await vi.waitFor(() =>
      expect(status.getAttribute("aria-label")?.split("\n")[0]).toBe(
        `Heading Desktop ${desktop} Mobile ${mobile}`,
      ),
    );
  });

  it("restores the synced accessible label when the engine overwrites it", async () => {
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    const node = document.createElement("div");
    node.textContent = "Rich";
    status.append(node);
    document.body.append(status);
    const body = {
      points: [],
      content: { title: "T", rows: [{ label: "A", value: "1" }] },
      pinned: false,
      dismiss: () => {},
    };

    syncTooltipAccessibility(node, body);
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("Rich\nT\nA: 1"));
    status.setAttribute("aria-label", "engine");
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("Rich\nT\nA: 1"));
    status.remove();
  });

  it("follows text that changes inside an open tooltip body", async () => {
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    const node = document.createElement("div");
    node.innerHTML = "<span>count 0</span>";
    status.append(node);
    document.body.append(status);
    const body = {
      points: [],
      content: { title: "T", rows: [{ label: "A", value: "1" }] },
      pinned: false,
      dismiss: () => {},
    };

    syncTooltipAccessibility(node, body);
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("count 0\nT\nA: 1"));
    // Content with its own state changes its text with no new sync call.
    node.querySelector("span")!.firstChild!.textContent = "count 1";
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("count 1\nT\nA: 1"));
    node.innerHTML = "<b>count 2</b>";
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("count 2\nT\nA: 1"));
    status.remove();
  });

  it("follows the text of the latest synced body node only", async () => {
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    const first = document.createElement("div");
    first.textContent = "first";
    status.append(first);
    document.body.append(status);
    const body = {
      points: [],
      content: { title: "T", rows: [{ label: "A", value: "1" }] },
      pinned: false,
      dismiss: () => {},
    };

    syncTooltipAccessibility(first, body);
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("first\nT\nA: 1"));
    // A new fill replaces the body element, as the Astro tooltip does.
    const second = document.createElement("div");
    second.textContent = "second";
    first.replaceWith(second);
    syncTooltipAccessibility(second, body);
    await vi.waitFor(() => expect(status.getAttribute("aria-label")).toBe("second\nT\nA: 1"));
    second.textContent = "second changed";
    await vi.waitFor(() =>
      expect(status.getAttribute("aria-label")).toBe("second changed\nT\nA: 1"),
    );
    first.textContent = "detached";
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(status.getAttribute("aria-label")).toBe("second changed\nT\nA: 1");
    status.remove();
  });

  it("separates tooltip parts in the accessible label without whitespace text nodes", async () => {
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    const node = document.createElement("div");
    // Vue condenses and Svelte trims whitespace, so the parts can touch with no text between them.
    node.innerHTML = [
      '<div data-slot="chart-tooltip-label">February</div>',
      '<div data-slot="chart-tooltip-items">',
      '<div data-slot="chart-tooltip-item">',
      '<span data-slot="chart-tooltip-icon">icon</span>',
      '<span data-slot="chart-tooltip-indicator"></span>',
      '<span data-slot="chart-tooltip-name"><b>Mob</b>ile</span>',
      '<span data-slot="chart-tooltip-value">200</span>',
      "</div>",
      "</div>",
    ].join("");
    status.append(node);
    document.body.append(status);
    const body = {
      points: [],
      content: { title: "February", rows: [{ label: "Mobile", value: "200" }] },
      pinned: false,
      dismiss: () => {},
    };

    syncTooltipAccessibility(node, body);
    await vi.waitFor(() =>
      expect(status.getAttribute("aria-label")).toBe("February Mobile 200\nFebruary\nMobile: 200"),
    );
    status.remove();
  });

  it("reads a nested tooltip label as its own part without whitespace text nodes", async () => {
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    const node = document.createElement("div");
    // One row with a line or dashed indicator nests the label inside the item name.
    node.innerHTML = [
      '<div data-slot="chart-tooltip-items">',
      '<div data-slot="chart-tooltip-item">',
      '<span data-slot="chart-tooltip-indicator"></span>',
      '<span data-slot="chart-tooltip-name">',
      '<span data-slot="chart-tooltip-label">Feb<i>ruary</i></span>',
      "<span>Mobile</span>",
      "</span>",
      '<span data-slot="chart-tooltip-value">200</span>',
      "</div>",
      "</div>",
    ].join("");
    status.append(node);
    document.body.append(status);
    const body = {
      points: [],
      content: { title: "February", rows: [{ label: "Mobile", value: "200" }] },
      pinned: false,
      dismiss: () => {},
    };

    syncTooltipAccessibility(node, body);
    await vi.waitFor(() =>
      expect(status.getAttribute("aria-label")).toBe("February Mobile 200\nFebruary\nMobile: 200"),
    );
    status.remove();
  });

  it("dispatches focus events and calls native host callbacks", async () => {
    const onFocusChange = vi.fn();
    const root = renderRoot();
    const events: unknown[] = [];
    root.addEventListener("starwind-chart:focus-change", (event) =>
      events.push((event as CustomEvent).detail.point),
    );
    track(
      createChart(root, { chart: visitorBars, input: visitorInput(), host: { onFocusChange } }),
    );
    await nextFrame();
    await focusFirstPoint(root);

    expect(onFocusChange).toHaveBeenCalled();
    expect(events.at(-1)).toBeTruthy();
  });

  it("does not register a controller when the first sync throws", () => {
    const root = renderRoot();
    expect(() =>
      createChart(root, {
        chart: visitorBars,
        input: visitorInput({ config: { a: { color: "red}" } } }),
      }),
    ).toThrow(/Invalid chart CSS color/);
    expect(getChartController(root)).toBeUndefined();
    expect(root.querySelectorAll("svg")).toHaveLength(0);
  });

  it("leaves input and render unchanged when an update has an invalid config", async () => {
    const root = renderRoot({ extra: legendButtons(document.body) });
    const controller = track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    await nextFrame();
    const before = controller.getInput();
    const style = root.querySelector("[data-slot=chart-style]")!.textContent;

    expect(() => controller.update({ config: { a: { color: "red}" } } })).toThrow(
      /Invalid chart CSS color/,
    );
    expect(() => controller.update({ config: { "1a": { color: "red" } } })).toThrow(
      /CSS identifier/,
    );

    expect(controller.getInput()).toBe(before);
    expect(root.querySelector("[data-slot=chart-style]")!.textContent).toBe(style);
    await nextFrame();
    expect(barCount(root)).toBe(6);
  });

  it("leaves one SVG after destroy and a second start", async () => {
    const id = "chart-restart";
    const { markup } = prerenderChart(visitorBars, visitorInput(), { id });
    const root = renderRoot({ id, surface: markup, attributes: "data-sw-chart" });

    createChart(root, { chart: visitorBars, input: visitorInput() }).destroy();
    expect(root.dataset.state).toBe("pending");
    expect(getChartController(root)).toBeUndefined();

    track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    await nextFrame();
    expect(root.querySelectorAll("svg")).toHaveLength(1);
  });
});

describe("chart lifecycle", () => {
  it("starts a chart whose module registers after the lifecycle script", async () => {
    const moduleId = uniqueModuleId();
    const root = renderServerRoot(moduleId, "chart-late");
    const serverSvg = root.querySelector("svg");
    startCharts();
    expect(getChartController(root)).toBeUndefined();

    defineChartModule({ id: moduleId, ariaLabel: "Late", create: visitorBars });

    expect(getChartController(root)).toBeDefined();
    expect(root.dataset.state).toBe("active");
    await nextFrame();
    expect(root.querySelector("svg")).toBe(serverSvg);
  });

  it("starts a chart whose module registered before the lifecycle script", () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Early", create: visitorBars });
    const root = renderServerRoot(moduleId, "chart-early");

    startCharts();

    expect(getChartController(root)).toBeDefined();
  });

  it("registers modules explicitly", () => {
    const moduleId = uniqueModuleId();
    const root = renderServerRoot(moduleId, "chart-explicit");

    registerChartModules({ id: moduleId, ariaLabel: "Explicit", create: visitorBars });

    expect(getChartController(root)).toBeDefined();
  });

  it("uses the latest module definition for an id", () => {
    const moduleId = uniqueModuleId();
    const first = vi.fn(visitorBars);
    const second = vi.fn(visitorBars);
    defineChartModule({ id: moduleId, ariaLabel: "First", create: first });
    defineChartModule({ id: moduleId, ariaLabel: "Second", create: second });
    const root = renderServerRoot(moduleId, "chart-latest");

    startCharts();

    expect(getChartController(root)).toBeDefined();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
  });

  it("keeps static roots static", () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Static", create: visitorBars });
    const { markup } = prerenderChart(visitorBars, visitorInput(), { id: "chart-static" });
    const root = renderRoot({
      id: "chart-static",
      surface: markup,
      attributes: `data-state="static" data-chart-module="${moduleId}"`,
    });

    startCharts();
    document.dispatchEvent(new Event("astro:after-swap"));

    expect(getChartController(root)).toBeUndefined();
    expect(root.dataset.state).toBe("static");
  });

  it("destroys hosts before an Astro swap and starts new roots after it", async () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Swap", create: visitorBars });
    const oldRoot = renderServerRoot(moduleId, "chart-swap-old");
    startCharts();
    const oldController = getChartController(oldRoot)!;
    const destroy = vi.spyOn(oldController, "destroy");

    document.dispatchEvent(new Event("astro:before-swap"));
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(getChartController(oldRoot)).toBeUndefined();

    document.body.innerHTML = "";
    const newRoot = renderServerRoot(moduleId, "chart-swap-new");
    document.dispatchEvent(new Event("astro:after-swap"));
    document.dispatchEvent(new Event("astro:after-swap"));

    expect(getChartController(newRoot)).toBeDefined();
    await nextFrame();
    expect(newRoot.querySelectorAll("svg")).toHaveLength(1);
  });

  it("leaves controllers that the lifecycle did not start running", () => {
    const root = renderRoot({ id: "chart-owned" });
    const controller = track(createChart(root, { chart: visitorBars, input: visitorInput() }));
    startCharts();

    window.dispatchEvent(new Event("pagehide"));
    document.dispatchEvent(new Event("astro:before-swap"));

    expect(getChartController(root)).toBe(controller);
    expect(root.dataset.state).toBe("active");
  });

  it("destroys a facade controller whose root leaves the document", async () => {
    const root = renderRoot({ id: "chart-facade-removed" });
    const controller = createChart(root, { chart: visitorBars, input: visitorInput() });
    const destroy = vi.spyOn(controller, "destroy");
    startCharts();

    root.remove();

    await vi.waitFor(() => expect(destroy).toHaveBeenCalled());
    expect(getChartController(root)).toBeUndefined();
  });

  it("restarts with the latest input when the payload cannot carry it", async () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Dated", create: visitorBars });
    const root = renderServerRoot(moduleId, "chart-dated");
    startCharts();
    const data = visitorInput()
      .data.slice(0, 1)
      .map((row) => ({ ...row, at: new Date(0) }));

    getChartController(root)!.update({ data });
    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("pageshow"));

    const restarted = getChartController(root)!;
    expect(restarted.getInput().data).toBe(data);
    await nextFrame();
    expect(barCount(root)).toBe(2);
  });

  it("starts roots parsed after the lifecycle script on DOMContentLoaded", () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Loading", create: visitorBars });
    const readyState = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    startCharts();
    readyState.mockRestore();
    const root = renderServerRoot(moduleId, "chart-loading");
    expect(getChartController(root)).toBeUndefined();

    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(getChartController(root)).toBeDefined();
  });

  it("restarts charts after pagehide and pageshow", () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Page", create: visitorBars });
    const root = renderServerRoot(moduleId, "chart-page");
    startCharts();
    const first = getChartController(root);

    window.dispatchEvent(new Event("pagehide"));
    expect(getChartController(root)).toBeUndefined();
    window.dispatchEvent(new Event("pageshow"));

    expect(getChartController(root)).toBeDefined();
    expect(getChartController(root)).not.toBe(first);
    expect(root.querySelectorAll("svg")).toHaveLength(1);
  });

  it("starts charts in a starwind:init scope", () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Init", create: visitorBars });
    startCharts();
    const root = renderServerRoot(moduleId, "chart-init");
    expect(getChartController(root)).toBeUndefined();

    document.dispatchEvent(new CustomEvent("starwind:init", { detail: { root } }));

    expect(getChartController(root)).toBeDefined();
  });

  it("destroys hosts whose root leaves the document", async () => {
    const moduleId = uniqueModuleId();
    defineChartModule({ id: moduleId, ariaLabel: "Remove", create: visitorBars });
    const root = renderServerRoot(moduleId, "chart-remove");
    startCharts();
    const destroy = vi.spyOn(getChartController(root)!, "destroy");

    root.remove();

    await vi.waitFor(() => expect(destroy).toHaveBeenCalled());
    expect(getChartController(root)).toBeUndefined();
  });

  it("warns once in development for a chart whose module never registers", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const root = renderServerRoot("never-registered", "chart-missing");
      startCharts();
      startCharts();
      vi.advanceTimersByTime(1000);

      const messages = warn.mock.calls.filter(([message]) =>
        String(message).includes('"chart-missing"'),
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]![0]).toContain('import "./my-chart"');
      expect(messages[0]![1]).toBe(root);

      startCharts();
      vi.advanceTimersByTime(1000);
      expect(warn.mock.calls.filter(([m]) => String(m).includes('"chart-missing"'))).toHaveLength(
        1,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

// Default tooltip placement and motion (SPEC-AC-30, SPEC-AC-32, SPEC-AC-36, SPEC-AC-40, SPEC-AC-42):
// the tooltip appears in place, snaps to the hovered item by chart type, eases every later move on
// both axes with one `translate` motion started at most once per frame, so a diagonal move takes a
// straight line and a slow slide keeps it moving, and places the same way for the keyboard. A radial bar tooltip follows the pointer angle
// on the hovered ring.
import type { ChartFocusStrategy, ChartPoint } from "@tanstack/charts";
import { type ChartTooltipPortalExtension, portal } from "@tanstack/charts/tooltip/portal";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import {
  type ChartContext,
  type ChartController,
  type ChartFactory,
  createChart,
} from "../../../src/components/chart";
import {
  type VisitorRow,
  visitorArea,
  visitorBars,
  visitorBarsX,
  visitorData,
  visitorDonut,
  visitorInput,
  visitorNestedPie,
  visitorRadar,
  visitorRadialBars,
} from "./fixtures";

const GAP = 14;
/** The motion of every move after the first show: shadcn's (Recharts) 400 ms `ease`. */
const MOTION = { duration: 400, easing: "ease" };
const controllers: ChartController<any, any, any, any>[] = [];

function mount(
  chart: ChartFactory<VisitorRow, any, any, any>,
  width = "400px",
  margin = "",
  input = visitorInput(),
) {
  const root = document.createElement("div");
  root.innerHTML = `<div data-slot="chart-surface" data-sw-chart-surface></div>`;
  root.dataset.slot = "chart";
  root.dataset.chart = `chart-tooltip-${controllers.length}`;
  // The browser test viewport is narrow, and TanStack hides a tooltip whose anchor leaves it.
  root.style.width = width;
  root.style.margin = margin;
  document.body.append(root);
  const controller = createChart(root, { chart, input });
  controllers.push(controller);
  return { root, controller };
}

type Mounted = ReturnType<typeof mount>;

function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function svg({ root }: Mounted): SVGSVGElement {
  return root.querySelector<SVGSVGElement>("svg.ts-chart")!;
}

/** Scene coordinates to client coordinates. */
function client(chart: Mounted, x: number, y: number) {
  const rect = svg(chart).getBoundingClientRect();
  const scene = chart.controller.getScene()!;
  return {
    x: rect.left + (x * rect.width) / scene.width,
    y: rect.top + (y * rect.height) / scene.height,
  };
}

async function pointAt(chart: Mounted, x: number, y: number): Promise<void> {
  const point = client(chart, x, y);
  svg(chart).dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      pointerType: "mouse",
    }),
  );
  await frame();
}

/** Moves the pointer to a scene point in this task, so the next frame is the first one painted. */
function moveTo(chart: Mounted, x: number, y: number): void {
  const point = client(chart, x, y);
  svg(chart).dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      pointerType: "mouse",
    }),
  );
}

/** The tooltip rect in the first animation frame, before anything places it again. */
function firstFrame(): Promise<DOMRect> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => resolve(tip().getBoundingClientRect())),
  );
}

function style(rule: string): void {
  const element = document.createElement("style");
  element.dataset.testTooltip = "";
  element.textContent = rule;
  document.head.append(element);
}

function tip(): HTMLElement {
  return document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]")!;
}

async function shown(): Promise<DOMRect> {
  await vi.waitFor(() => expect(tip()?.hidden).toBe(false));
  // A size change after the first paint repositions the tooltip on the next frame.
  await frame();
  return tip().getBoundingClientRect();
}

/** Waits until a move ends. The motion takes 400 ms. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500));
}

function running(): CSSTransition[] {
  return tip()
    .getAnimations()
    .filter((animation): animation is CSSTransition => animation instanceof CSSTransition);
}

/** The properties of the CSS transitions that run on the tooltip now. */
function transitions(): string[] {
  return running()
    .map((animation) => animation.transitionProperty)
    .sort();
}

/** Expects the running transitions to be these properties, each with the tooltip motion. */
function expectEased(...properties: string[]): void {
  expect(transitions()).toEqual(properties);
  for (const animation of running()) {
    const timing = animation.effect!.getTiming();
    expect({ duration: timing.duration, easing: timing.easing }).toEqual(MOTION);
  }
}

/** The pointer leaves the chart surface. */
function leave(chart: Mounted): void {
  svg(chart).parentElement!.dispatchEvent(new MouseEvent("mouseleave"));
}

/** Expects the tooltip to show at the place TanStack set, with no motion offset left. */
function expectAtTarget(): void {
  const box = tip().getBoundingClientRect();
  expect(getComputedStyle(tip()).translate).toMatch(/^(none|0px)$/);
  expect(box.left).toBeCloseTo(Number.parseFloat(tip().style.left), 1);
  expect(box.top).toBeCloseTo(Number.parseFloat(tip().style.top), 1);
}

function band(chart: Mounted, month: string) {
  const scale = chart.controller.getScene()!.scales.x!;
  const center = scale.map(month);
  return { left: center - scale.bandwidth / 2, center, right: center + scale.bandwidth / 2 };
}

/** A band on y, for horizontal bars. */
function bandY(chart: Mounted, month: string) {
  const scale = chart.controller.getScene()!.scales.y!;
  const center = scale.map(month);
  return { top: center - scale.bandwidth / 2, center, bottom: center + scale.bandwidth / 2 };
}

function plot(chart: Mounted) {
  return chart.controller.getScene()!.chart;
}

/** Focuses the chart, moves one item with the keyboard and waits for the ease to end. */
async function focusItem(chart: Mounted): Promise<ChartPoint> {
  let point: ChartPoint | undefined;
  chart.root.addEventListener("starwind-chart:focus-change", (event) => {
    point = (event as CustomEvent<{ point: ChartPoint }>).detail.point ?? point;
  });
  svg(chart).focus();
  await userEvent.keyboard("{ArrowRight}");
  await shown();
  await settle();
  return point!;
}

function reduceMotion(): void {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    query.includes("prefers-reduced-motion")
      ? ({ ...original(query), matches: true, media: query } as MediaQueryList)
      : original(query),
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  document.body.innerHTML = "";
  for (const element of document.head.querySelectorAll("style[data-test-tooltip]"))
    element.remove();
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
});

describe("chart tooltip placement", () => {
  it("shows the tooltip in place with no slide from the top left", async () => {
    // The rule the old Styled class compiled to: a 100 ms duration for every property.
    const style = document.createElement("style");
    style.dataset.testTooltip = "";
    style.textContent = ".ts-chart-tooltip { transition-duration: 100ms; }";
    document.head.append(style);
    const chart = mount(visitorBars);
    await frame();
    const feb = band(chart, "February");
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, feb.center, middle);
    const box = await shown();

    expect(transitions()).toEqual([]);
    expectAtTarget();
    expect(box.left).toBeCloseTo(client(chart, feb.right, 0).x + GAP, 0);
  });

  it("puts a bar tooltip a gap beside the category and follows the pointer vertically", async () => {
    const chart = mount(visitorBars);
    await frame();
    const feb = band(chart, "February");
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, feb.center - 20, middle);
    let box = await shown();
    expect(box.left).toBeCloseTo(client(chart, feb.right, 0).x + GAP, 0);
    expect(box.top + box.height / 2).toBeCloseTo(client(chart, 0, middle).y, 0);

    await pointAt(chart, feb.center + 20, middle + 30);
    expectEased("translate");
    await settle();
    box = tip().getBoundingClientRect();
    expectAtTarget();
    expect(box.left).toBeCloseTo(client(chart, feb.right, 0).x + GAP, 0);
    expect(box.top + box.height / 2).toBeCloseTo(client(chart, 0, middle + 30).y, 0);
  });

  it("keeps a bar tooltip inside the plot vertically", async () => {
    const chart = mount(visitorBars);
    await frame();
    const feb = band(chart, "February");

    await pointAt(chart, feb.center, plot(chart).y + 1);
    const box = await shown();

    expect(box.top).toBeGreaterThanOrEqual(client(chart, 0, plot(chart).y).y - 0.5);
  });

  it("flips a bar tooltip to the other side near the plot edge", async () => {
    const chart = mount(visitorBars);
    await frame();
    const march = band(chart, "March");
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, march.center, middle);
    const box = await shown();

    expect(box.right).toBeCloseTo(client(chart, march.left, 0).x - GAP, 0);
  });

  it("places a keyboard bar tooltip by the same rule as the pointer", async () => {
    const chart = mount(visitorBars);
    await frame();

    const point = await focusItem(chart);
    const item = band(chart, String(point.xValue));
    const keyboard = tip().getBoundingClientRect();
    expect(keyboard.left).toBeCloseTo(client(chart, item.right, 0).x + GAP, 0);
    expect(keyboard.top).toBeGreaterThanOrEqual(client(chart, 0, plot(chart).y).y - 0.5);

    await pointAt(chart, item.center, plot(chart).y + plot(chart).height / 2);
    expect(tip().getBoundingClientRect().left).toBeCloseTo(keyboard.left, 0);
  });

  it("eases both axes with one motion on every move after the first show", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    expect(transitions()).toEqual([]);

    // A move to another item.
    await pointAt(chart, band(chart, "February").center, middle + 20);
    expectEased("translate");

    // A pointer move on the follow axis, also during the move.
    await pointAt(chart, band(chart, "February").center, middle - 20);
    expectEased("translate");
    await settle();
    await pointAt(chart, band(chart, "February").center + 5, middle + 10);
    expectEased("translate");
    await settle();
    expectAtTarget();
  });

  it("moves in a straight line when a follow-axis move comes during an item move", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    await pointAt(chart, band(chart, "January").center, middle - 40);
    await shown();

    // An item move on x, then a pointer move on y while the first move runs.
    await pointAt(chart, band(chart, "February").center, middle - 40);
    await new Promise((resolve) => setTimeout(resolve, 120));
    moveTo(chart, band(chart, "February").center, middle + 40);
    const path: DOMRect[] = [];
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      path.push(tip().getBoundingClientRect());
    }
    await settle();
    const end = tip().getBoundingClientRect();
    const start = path[0]!;
    const [dx, dy] = [end.left - start.left, end.top - start.top];
    const length = Math.hypot(dx, dy);
    expect(Math.abs(dx)).toBeGreaterThan(5);
    expect(Math.abs(dy)).toBeGreaterThan(5);

    // The distance of each frame from the line between the first frame and the end.
    const off = path.map(
      (box) => Math.abs((box.left - start.left) * dy - (box.top - start.top) * dx) / length,
    );
    expect(Math.max(...off)).toBeLessThan(1);
  });

  it("starts at most one ease per frame and keeps moving during a slow slide", async () => {
    const chart = mount(visitorBars);
    await frame();
    const x = band(chart, "February").center;
    const start = plot(chart).y + plot(chart).height * 0.7;
    await pointAt(chart, x, start);
    const first = await shown();
    let runs = 0;
    tip().addEventListener("transitionrun", () => runs++);

    // 30 frames. Each frame moves the pointer up 1 scene pixel in 6 events spread over the frame.
    let y = start;
    for (let index = 0; index < 30; index++) {
      for (let step = 0; step < 6; step++) {
        y -= 1 / 6;
        moveTo(chart, x, y);
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    const moved = first.top - tip().getBoundingClientRect().top;
    const pointer = client(chart, 0, start).y - client(chart, 0, y).y;

    expect(runs).toBeLessThanOrEqual(31);
    expect(moved).toBeGreaterThan(pointer * 0.2);
  });

  it("starts no ease for a follow-axis move of less than half a scene pixel", async () => {
    const chart = mount(visitorBars);
    await frame();
    const x = band(chart, "February").center;
    // Whole scene pixels, so the moves below round back to the same pixel.
    const y = Math.round(plot(chart).y + plot(chart).height / 2);
    await pointAt(chart, band(chart, "January").center, y);
    await shown();
    await pointAt(chart, x, y);
    await settle();

    await pointAt(chart, x, y + 0.3);
    expect(transitions()).toEqual([]);
    await pointAt(chart, x, y - 0.3);
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("starts no ease for a sub-pixel follow move on horizontal bars", async () => {
    const chart = mount(visitorBarsX);
    await frame();
    const y = bandY(chart, "February").center;
    const x = Math.round(plot(chart).x + plot(chart).width / 2);
    await pointAt(chart, x, bandY(chart, "January").center);
    await shown();
    await pointAt(chart, x, y);
    await settle();

    await pointAt(chart, x + 0.3, y);
    expect(transitions()).toEqual([]);
    await pointAt(chart, x - 0.3, y);
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("keeps the running ease when a move does not change the placed position", async () => {
    const chart = mount(visitorBars);
    await frame();
    // Near the plot bottom the tooltip is clamped, so these pointer heights give one place.
    const low = plot(chart).y + plot(chart).height - 2;
    await pointAt(chart, band(chart, "January").center, low);
    await shown();
    await pointAt(chart, band(chart, "February").center, low);
    const [ease] = running();
    expect(ease?.transitionProperty).toBe("translate");

    await pointAt(chart, band(chart, "February").center + 3, low - 6);
    expect(running()).toHaveLength(1);
    expect(running()[0]).toBe(ease);
  });

  it("does not jump when the body grows in the frame before a move", async () => {
    const chart = mount(visitorBars);
    await frame();
    const x = band(chart, "February").center;
    const middle = plot(chart).y + plot(chart).height / 2;
    await pointAt(chart, band(chart, "January").center, middle - 40);
    await shown();
    await pointAt(chart, x, middle - 40);

    // TanStack places a resized tooltip again in its own frame callback, which here runs before the
    // callback that places the move.
    const extra = document.createElement("div");
    extra.style.height = "30px";
    tip().append(extra);
    await frame();
    moveTo(chart, x, middle + 40);
    const before = tip().getBoundingClientRect();
    const first = await firstFrame();
    await settle();
    const end = tip().getBoundingClientRect();

    expect(Math.abs(end.top - before.top)).toBeGreaterThan(40);
    expect(Math.abs(first.top - before.top)).toBeLessThan(15);
  });

  it("eases on from where it shows when the body grows during a move", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    await pointAt(chart, band(chart, "February").center, middle);
    await shown();
    // March puts the tooltip on the left of the band, so a wider body moves its left edge.
    await pointAt(chart, band(chart, "March").center, middle);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const before = tip().getBoundingClientRect();

    const extra = document.createElement("div");
    extra.style.width = "160px";
    extra.style.height = "1px";
    tip().append(extra);
    const first = await firstFrame();
    expectEased("translate");
    await settle();
    const box = tip().getBoundingClientRect();

    expect(box.right).toBeCloseTo(client(chart, band(chart, "March").left, 0).x - GAP, 0);
    expect(box.width).toBeGreaterThan(before.width + 40);
    expect(Math.abs(first.left - before.left)).toBeLessThan(20);
    expectAtTarget();
  });

  it("places the tooltip again with no ease after a move ends and the body grows", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    await pointAt(chart, band(chart, "February").center, middle);
    await settle();
    const before = tip().getBoundingClientRect();

    const extra = document.createElement("div");
    extra.style.height = "60px";
    tip().append(extra);
    const first = await firstFrame();
    expect(transitions()).toEqual([]);
    await settle();
    const box = tip().getBoundingClientRect();

    expect(box.height).toBeGreaterThan(before.height);
    expect(box.top).not.toBeCloseTo(before.top, 0);
    expect(first.toJSON()).toEqual(box.toJSON());
  });

  it("does not ease after a move ends and the chart container width changes", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    await pointAt(chart, band(chart, "February").center, middle);
    await settle();

    chart.root.style.width = "360px";
    await frame();
    await frame();

    expect(tip().hidden).toBe(false);
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("stops the ease when the chart data changes during a move", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    await pointAt(chart, band(chart, "February").center, middle + 20);
    expectEased("translate");

    chart.controller.update({ data: visitorData(20) });
    await frame();

    expect(tip().hidden).toBe(false);
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("shows again in place after a full hide", async () => {
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    await pointAt(chart, band(chart, "February").center, middle + 20);
    leave(chart);
    await vi.waitFor(() => expect(tip().hidden).toBe(true));

    await pointAt(chart, band(chart, "January").center, middle - 20);
    await shown();
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("keeps one shown session through a hide and a show inside the hide delay", async () => {
    const chart = mount((ctx: ChartContext<VisitorRow>) => ({
      ...visitorBars(ctx),
      tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 300 }),
    }));
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    leave(chart);
    await frame();
    expect(tip().hidden).toBe(false);

    await pointAt(chart, band(chart, "February").center, middle);
    expectEased("translate");
  });

  it("does not ease a page scroll after an item change", async () => {
    const chart = mount(visitorBars);
    const spacer = document.createElement("div");
    spacer.style.height = "3000px";
    document.body.append(spacer);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    await pointAt(chart, band(chart, "February").center, middle);
    await new Promise((resolve) => setTimeout(resolve, 300));

    window.scrollTo(0, 40);
    await frame();
    await frame();
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("does not ease with reduced motion", async () => {
    reduceMotion();
    const chart = mount(visitorBars);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, band(chart, "January").center, middle);
    await shown();
    await pointAt(chart, band(chart, "February").center, middle);
    expect(transitions()).toEqual([]);
    expectAtTarget();

    await pointAt(chart, band(chart, "February").center, middle + 30);
    expect(transitions()).toEqual([]);
    expectAtTarget();
  });

  it("puts an area tooltip at the point x and follows the pointer vertically", async () => {
    const chart = mount(visitorArea);
    await frame();
    const x = chart.controller.getScene()!.scales.x!.map("February");
    const middle = plot(chart).y + plot(chart).height / 2;

    await pointAt(chart, x - 10, middle);
    let box = await shown();
    expect(box.left).toBeCloseTo(client(chart, x, 0).x + GAP, 0);
    expect(box.top + box.height / 2).toBeCloseTo(client(chart, 0, middle).y, 0);

    await pointAt(chart, x + 10, middle - 25);
    expectEased("translate");
    await settle();
    box = tip().getBoundingClientRect();
    expect(box.left).toBeCloseTo(client(chart, x, 0).x + GAP, 0);
    expect(box.top + box.height / 2).toBeCloseTo(client(chart, 0, middle - 25).y, 0);
  });

  it("places a keyboard area tooltip at the same x as the pointer", async () => {
    const chart = mount(visitorArea);
    await frame();

    const point = await focusItem(chart);
    const x = chart.controller.getScene()!.scales.x!.map(point.xValue);
    expect(tip().getBoundingClientRect().left).toBeCloseTo(client(chart, x, 0).x + GAP, 0);
  });

  it("keeps a donut tooltip at one place per slice for the pointer and the keyboard", async () => {
    const chart = mount(visitorDonut);
    await frame();

    const point = await focusItem(chart);
    const keyboard = tip().getBoundingClientRect();
    svg(chart).blur();
    await vi.waitFor(() => expect(tip().hidden).toBe(true));

    await pointAt(chart, point.x + 6, point.y + 4);
    expect((await shown()).toJSON()).toEqual(keyboard.toJSON());
    await settle();
    await pointAt(chart, point.x - 6, point.y - 3);
    expect(tip().getBoundingClientRect().toJSON()).toEqual(keyboard.toJSON());
    expect(transitions()).toEqual([]);
  });

  it("puts a radar tooltip at the axis point for the pointer and the keyboard", async () => {
    const chart = mount(visitorRadar);
    await frame();

    const point = await focusItem(chart);
    const keyboard = tip().getBoundingClientRect();
    svg(chart).blur();
    await vi.waitFor(() => expect(tip().hidden).toBe(true));

    await pointAt(chart, point.x + 3, point.y + 3);
    expect((await shown()).toJSON()).toEqual(keyboard.toJSON());
    await pointAt(chart, point.x - 2, point.y + 4);
    expect(tip().getBoundingClientRect().toJSON()).toEqual(keyboard.toJSON());
  });

  it("keeps a native anchor and eases it after the first show", async () => {
    const chart = mount((ctx: ChartContext<VisitorRow>) => ({
      ...visitorBars(ctx),
      tooltip: ctx.tooltip(
        { labelKey: "month" },
        { showDelay: 0, hideDelay: 0, anchor: "pointer", placement: "right" },
      ),
    }));
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    const jan = band(chart, "January");

    await pointAt(chart, jan.center - 10, middle);
    const box = await shown();
    expect(box.left).toBeCloseTo(client(chart, jan.center - 10, 0).x + GAP, 0);

    await pointAt(chart, band(chart, "February").center, middle);
    expectEased("translate");
    await settle();
    expectAtTarget();
    expect(tip().getBoundingClientRect().left).toBeCloseTo(
      client(chart, band(chart, "February").center, 0).x + GAP,
      0,
    );
  });
});

describe("chart tooltip placement for horizontal bars, radial bars and nested pies", () => {
  it("puts a horizontal bar tooltip a gap below the band and follows the pointer horizontally", async () => {
    const chart = mount(visitorBarsX);
    await frame();
    const jan = bandY(chart, "January");
    const center = plot(chart).x + plot(chart).width / 2;

    await pointAt(chart, center, jan.center - 10);
    let box = await shown();
    expect(box.top).toBeCloseTo(client(chart, 0, jan.bottom).y + GAP, 0);
    expect(box.left + box.width / 2).toBeCloseTo(client(chart, center, 0).x, 0);

    await pointAt(chart, center + 30, jan.center + 10);
    expectEased("translate");
    await settle();
    box = tip().getBoundingClientRect();
    expect(box.top).toBeCloseTo(client(chart, 0, jan.bottom).y + GAP, 0);
    expect(box.left + box.width / 2).toBeCloseTo(client(chart, center + 30, 0).x, 0);
  });

  it("flips a horizontal bar tooltip above the band near the plot bottom", async () => {
    const chart = mount(visitorBarsX);
    await frame();
    const march = bandY(chart, "March");

    await pointAt(chart, plot(chart).x + plot(chart).width / 2, march.center);
    const box = await shown();

    expect(box.bottom).toBeCloseTo(client(chart, 0, march.top).y - GAP, 0);
  });

  it("keeps a horizontal bar tooltip inside the plot horizontally", async () => {
    const chart = mount(visitorBarsX);
    await frame();
    const right = plot(chart).x + plot(chart).width;

    await pointAt(chart, right - 1, bandY(chart, "February").center);
    const box = await shown();

    expect(box.right).toBeLessThanOrEqual(client(chart, right, 0).x + 0.5);
  });

  it("places a keyboard horizontal bar tooltip by the same rule as the pointer", async () => {
    const chart = mount(visitorBarsX);
    await frame();

    const point = await focusItem(chart);
    const item = bandY(chart, String(point.yValue));
    const keyboard = tip().getBoundingClientRect();
    expect(
      Math.min(
        Math.abs(keyboard.top - (client(chart, 0, item.bottom).y + GAP)),
        Math.abs(keyboard.bottom - (client(chart, 0, item.top).y - GAP)),
      ),
    ).toBeLessThan(1);
    expect(keyboard.right).toBeLessThanOrEqual(
      client(chart, plot(chart).x + plot(chart).width, 0).x + 0.5,
    );

    await pointAt(chart, plot(chart).x + 10, item.center);
    await settle();
    expect(tip().getBoundingClientRect().top).toBeCloseTo(keyboard.top, 0);
  });

  it("keeps the band offset and the plot clamp with a native top placement on horizontal bars", async () => {
    const chart = mount((ctx: ChartContext<VisitorRow>) => ({
      ...visitorBarsX(ctx),
      tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 0, placement: "top" }),
    }));
    await frame();
    const feb = bandY(chart, "February");
    const right = plot(chart).x + plot(chart).width;

    await pointAt(chart, right - 1, feb.center + 10);
    const box = await shown();

    expect(box.bottom).toBeCloseTo(client(chart, 0, feb.top).y - GAP, 0);
    expect(box.right).toBeLessThanOrEqual(client(chart, right, 0).x + 0.5);
  });

  /**
   * Walks every item with the keyboard and checks that each item has its own place, and that the
   * pointer anywhere near the item gets the same place.
   */
  async function expectOnePlacePerItem(
    chart: Mounted,
    count: number,
    near: (point: ChartPoint) => [number, number][] = (point) => [
      [point.x + 3, point.y + 2],
      [point.x - 2, point.y - 3],
    ],
  ): Promise<void> {
    const items: { point: ChartPoint; box: DOMRect }[] = [];
    let point: ChartPoint | undefined;
    chart.root.addEventListener("starwind-chart:focus-change", (event) => {
      point = (event as CustomEvent<{ point: ChartPoint }>).detail.point ?? point;
    });
    svg(chart).focus();
    await userEvent.keyboard("{Home}");
    for (let index = 0; index < count; index++) {
      if (index) await userEvent.keyboard("{ArrowRight}");
      await shown();
      await settle();
      items.push({ point: point!, box: tip().getBoundingClientRect() });
    }
    expect(new Set(items.map(({ point }) => point.key)).size).toBe(count);
    // No two items share a place.
    for (const [index, { box }] of items.entries())
      for (const other of items.slice(index + 1))
        expect(Math.hypot(box.left - other.box.left, box.top - other.box.top)).toBeGreaterThan(4);
    svg(chart).blur();
    await vi.waitFor(() => expect(tip().hidden).toBe(true));

    for (const { point, box } of items)
      for (const [x, y] of near(point)) {
        await pointAt(chart, x, y);
        await shown();
        await settle();
        expect(tip().getBoundingClientRect().toJSON()).toEqual(box.toJSON());
      }
  }

  it("gives each slice of each nested pie ring its own place for the pointer and the keyboard", async () => {
    const chart = mount(visitorNestedPie);
    await frame();
    await expectOnePlacePerItem(chart, 6);
  });
});

// A wide viewport with the chart away from its edges, so only the plot limits the tooltip.
describe("chart tooltip first frame and repositions", () => {
  const MARGIN = "120px 0 0 240px";

  beforeAll(() => page.viewport(1200, 800));
  afterEach(() => page.viewport(1200, 800));
  afterAll(() => page.viewport(414, 896));

  it("paints a flipped last-band tooltip in place on the first frame", async () => {
    style(".ts-chart-tooltip { min-width: 160px; }");
    const chart = mount(visitorBars, "250px", MARGIN);
    await frame();
    const march = band(chart, "March");

    moveTo(chart, march.center, plot(chart).y + plot(chart).height / 2);
    const first = await firstFrame();
    await settle();
    const settled = tip().getBoundingClientRect();

    expect(settled.right).toBeCloseTo(client(chart, march.left, 0).x - GAP, 0);
    expect(first.toJSON()).toEqual(settled.toJSON());
  });

  it("paints a tooltip for the pointer at the plot top inside the plot on the first frame", async () => {
    const chart = mount(visitorBars, "400px", MARGIN);
    await frame();

    moveTo(chart, band(chart, "February").center, plot(chart).y + 1);
    const first = await firstFrame();
    await settle();
    const settled = tip().getBoundingClientRect();

    expect(settled.top).toBeGreaterThanOrEqual(client(chart, 0, plot(chart).y).y - 0.5);
    expect(first.toJSON()).toEqual(settled.toJSON());
  });

  it("paints a keyboard tooltip clamped to the plot on the first frame", async () => {
    // January is the tallest bar, so the keyboard tooltip needs the measured size to stay inside
    // the plot.
    const data = [
      { month: "January", desktop: 340, mobile: 80 },
      { month: "February", desktop: 200, mobile: 120 },
      { month: "March", desktop: 150, mobile: 90 },
    ];
    const chart = mount(visitorBars, "400px", MARGIN, visitorInput({ data }));
    await frame();

    // Focus shows the first item. A key press shows it when focus does not.
    svg(chart).focus();
    if (tip()?.hidden !== false)
      svg(chart).dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const first = await firstFrame();
    await settle();
    const settled = tip().getBoundingClientRect();

    expect(settled.left).toBeCloseTo(client(chart, band(chart, "January").right, 0).x + GAP, 0);
    expect(settled.top).toBeGreaterThanOrEqual(client(chart, 0, plot(chart).y).y - 0.5);
    expect(first.toJSON()).toEqual(settled.toJSON());
  });

  it("takes the side with less plot overflow when neither side fits", async () => {
    style(".ts-chart-tooltip { min-width: 200px; }");
    const chart = mount(visitorBars, "250px", MARGIN);
    await frame();
    const jan = band(chart, "January");

    moveTo(chart, jan.center, plot(chart).y + plot(chart).height / 2);
    await settle();

    // Right of January passes the plot by less than left of it does.
    expect(tip().getBoundingClientRect().left).toBeCloseTo(client(chart, jan.right, 0).x + GAP, 0);
  });

  it("follows the chart at once when the page scrolls during an ease", async () => {
    const chart = mount(visitorBars, "400px", MARGIN);
    const spacer = document.createElement("div");
    spacer.style.height = "3000px";
    document.body.append(spacer);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    moveTo(chart, band(chart, "January").center, middle);
    await settle();

    moveTo(chart, band(chart, "February").center, middle);
    // A move places the tooltip and starts the ease in the next frame.
    await frame();
    expect(transitions()).toEqual(["translate"]);
    // TanStack places the tooltip in a frame callback that its scroll listener queues. This
    // listener runs after it, so its frame callback reads the rect that frame paints.
    const first = new Promise<DOMRect>((resolve) =>
      window.addEventListener(
        "scroll",
        () => requestAnimationFrame(() => resolve(tip().getBoundingClientRect())),
        { once: true },
      ),
    );
    window.scrollTo(0, 60);
    const painted = await first;
    await settle();
    const box = tip().getBoundingClientRect();

    expect(box.left).toBeCloseTo(client(chart, band(chart, "February").right, 0).x + GAP, 0);
    expect(painted.toJSON()).toEqual(box.toJSON());
  });

  it("follows the chart at once when the window resizes during an ease", async () => {
    const chart = mount(visitorBars, "400px", MARGIN);
    await frame();
    const middle = plot(chart).y + plot(chart).height / 2;
    moveTo(chart, band(chart, "January").center, middle);
    await settle();

    moveTo(chart, band(chart, "February").center, middle);
    // A move places the tooltip and starts the ease in the next frame.
    await frame();
    expect(transitions()).toEqual(["translate"]);
    chart.root.style.marginLeft = "300px";
    window.dispatchEvent(new Event("resize"));
    // Queued after TanStack's resize listener queued its frame callback.
    const painted = await firstFrame();
    await settle();
    const box = tip().getBoundingClientRect();

    expect(box.left).toBeCloseTo(client(chart, band(chart, "February").right, 0).x + GAP, 0);
    expect(painted.toJSON()).toEqual(box.toJSON());
  });

  it("places the tooltip from the latest geometry when TanStack places it again", async () => {
    // A CSS scale changes the client size with no resize, so TanStack does not repaint. A window
    // resize event then makes its portal place the tooltip again from the context it kept.
    const chart = mount(visitorBars, "400px", MARGIN);
    await frame();
    const feb = band(chart, "February");
    moveTo(chart, feb.center, plot(chart).y + plot(chart).height / 2);
    await settle();

    chart.root.style.transformOrigin = "0 0";
    chart.root.style.transform = "scale(0.75)";
    window.dispatchEvent(new Event("resize"));
    await settle();

    expect(tip().hidden).toBe(false);
    expect(tip().getBoundingClientRect().left).toBeCloseTo(client(chart, feb.right, 0).x + GAP, 0);
  });

  for (const placement of ["left", "right"] as const) {
    it(`keeps the band offset and the plot clamp with a native ${placement} placement`, async () => {
      const chart = mount(
        (ctx: ChartContext<VisitorRow>) => ({
          ...visitorBars(ctx),
          tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 0, placement }),
        }),
        "400px",
        MARGIN,
      );
      await frame();
      const feb = band(chart, "February");

      moveTo(chart, feb.center + 15, plot(chart).y + plot(chart).height / 2);
      await settle();
      const box = tip().getBoundingClientRect();
      if (placement === "left")
        expect(box.right).toBeCloseTo(client(chart, feb.left, 0).x - GAP, 0);
      else expect(box.left).toBeCloseTo(client(chart, feb.right, 0).x + GAP, 0);

      moveTo(chart, feb.center, plot(chart).y + 1);
      await settle();
      expect(tip().getBoundingClientRect().top).toBeGreaterThanOrEqual(
        client(chart, 0, plot(chart).y).y - 0.5,
      );

      moveTo(chart, band(chart, "January").center, plot(chart).y + plot(chart).height / 2);
      await frame();
      expectEased("translate");
    });
  }

  // A native vertical or corner placement keeps the band center x, the pointer y and the gap.
  for (const placement of ["top", "bottom", "top-right"] as const) {
    it(`keeps the pointer gap with a native ${placement} placement`, async () => {
      const chart = mount(
        (ctx: ChartContext<VisitorRow>) => ({
          ...visitorBars(ctx),
          tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 0, placement }),
        }),
        "400px",
        MARGIN,
      );
      await frame();
      const feb = band(chart, "February");
      // A whole scene pixel, since the tooltip follows the pointer in whole scene pixels.
      const y = Math.round(plot(chart).y + plot(chart).height * 0.6);

      moveTo(chart, feb.center + 15, y);
      await settle();
      const box = tip().getBoundingClientRect();
      const pointer = client(chart, feb.center, y);

      if (placement === "bottom") expect(box.top).toBeCloseTo(pointer.y + GAP, 0);
      else expect(box.bottom).toBeCloseTo(pointer.y - GAP, 0);
      if (placement === "top-right") expect(box.left).toBeCloseTo(pointer.x + GAP, 0);
      else expect(box.left + box.width / 2).toBeCloseTo(pointer.x, 0);
    });
  }

  // A guard: TanStack repaints after this resize, so it also passes without the live context.
  it("keeps the tooltip beside the hovered band after the chart resizes", async () => {
    // The chart follows the viewport width, as a page chart does.
    const chart = mount(visitorBars, "60vw", MARGIN);
    await frame();
    moveTo(chart, band(chart, "January").center, plot(chart).y + plot(chart).height / 2);
    await settle();

    await page.viewport(700, 800);
    await settle();
    await frame();

    expect(tip().hidden).toBe(false);
    const month = ["January", "February", "March"].find((name) =>
      tip().textContent?.includes(name),
    )!;
    const item = band(chart, month);
    const box = tip().getBoundingClientRect();
    expect(
      Math.min(
        Math.abs(box.left - (client(chart, item.right, 0).x + GAP)),
        Math.abs(box.right - (client(chart, item.left, 0).x - GAP)),
      ),
    ).toBeLessThan(1);
  });

  it("gives a native portal the pointer anchor without snapping", async () => {
    const anchors: { x: number; y: number }[] = [];
    const recording: ChartTooltipPortalExtension = {
      id: "recording",
      create(context, options) {
        const inner = portal.create(context, options);
        return {
          ...inner,
          position(next) {
            anchors.push({ ...next.anchor });
            return inner.position(next);
          },
        };
      },
    };
    const chart = mount(
      (ctx: ChartContext<VisitorRow>) => ({
        ...visitorBars(ctx),
        tooltip: ctx.tooltip(
          { labelKey: "month" },
          { showDelay: 0, hideDelay: 0, portal: recording },
        ),
      }),
      "400px",
      MARGIN,
    );
    await frame();
    const x = band(chart, "February").center - 17;
    const y = plot(chart).y + plot(chart).height / 2 + 9;

    moveTo(chart, x, y);
    await shown();

    expect(anchors.at(-1)!.x).toBeCloseTo(x, 0);
    expect(anchors.at(-1)!.y).toBeCloseTo(y, 0);
  });
});

// SPEC-AC-36: a radial bar tooltip sits on the hovered ring at the pointer angle, as the shadcn
// (Recharts) radial chart does. The keyboard has no pointer, so it keeps the bar end. A wide
// viewport keeps the tooltip away from the viewport edges.
describe("chart tooltip placement for radial bars", () => {
  const MARGIN = "120px 0 0 240px";

  beforeAll(() => page.viewport(1200, 800));
  afterAll(() => page.viewport(414, 896));

  /** The client distance from a scene point to the tooltip box. */
  function gap(chart: Mounted, box: DOMRect, [x, y]: [number, number]): number {
    const point = client(chart, x, y);
    return Math.hypot(
      Math.max(box.left - point.x, 0, point.x - box.right),
      Math.max(box.top - point.y, 0, point.y - box.bottom),
    );
  }

  /** The polar geometry of the plot. Angles are clockwise from the top, as TanStack draws them. */
  function rings(chart: Mounted) {
    const { x, y, width, height } = plot(chart);
    const [cx, cy] = [x + width / 2, y + height / 2];
    return {
      radius: (point: ChartPoint) => Math.hypot(point.x - cx, point.y - cy),
      at: (radius: number, angle: number): [number, number] => [
        cx + radius * Math.sin(angle),
        cy - radius * Math.cos(angle),
      ],
    };
  }

  it("puts a radial bar tooltip on the hovered ring at the pointer angle and follows the pointer", async () => {
    const chart = mount(visitorRadialBars, "400px", MARGIN);
    await frame();
    const { radius, at } = rings(chart);
    const bars = chart.controller.getScene()!.points;
    expect(bars).toHaveLength(3);

    // Near the top of each ring, a little off the ring center line.
    for (const bar of bars) {
      const r = radius(bar);
      await pointAt(chart, ...at(r + 3, 0.3));
      await shown();
      await settle();
      expect(gap(chart, tip().getBoundingClientRect(), at(r, 0.3))).toBeCloseTo(GAP, 0);
      expect(gap(chart, tip().getBoundingClientRect(), [bar.x, bar.y])).toBeGreaterThan(GAP + 20);
    }

    // A move along the ring moves the tooltip with the pointer and eases both axes.
    const r = radius(bars[1]!);
    await pointAt(chart, ...at(r, 0.3));
    await settle();
    await pointAt(chart, ...at(r - 2, 1.2));
    expectEased("translate");
    await settle();
    expectAtTarget();
    expect(gap(chart, tip().getBoundingClientRect(), at(r, 1.2))).toBeCloseTo(GAP, 0);
  });

  it("keeps a keyboard radial bar tooltip at the bar end, also after a hover", async () => {
    const chart = mount(visitorRadialBars, "400px", MARGIN);
    await frame();
    const { radius, at } = rings(chart);
    let point: ChartPoint | undefined;
    chart.root.addEventListener("starwind-chart:focus-change", (event) => {
      point = (event as CustomEvent<{ point: ChartPoint }>).detail.point ?? point;
    });

    const keyboard = await focusItem(chart);
    expect(gap(chart, tip().getBoundingClientRect(), [keyboard.x, keyboard.y])).toBeCloseTo(GAP, 0);
    svg(chart).blur();
    await vi.waitFor(() => expect(tip().hidden).toBe(true));

    await pointAt(chart, ...at(radius(keyboard), 0.3));
    await shown();
    await settle();
    svg(chart).focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle();
    expect(point!.key).not.toBe(keyboard.key);
    expect(gap(chart, tip().getBoundingClientRect(), [point!.x, point!.y])).toBeCloseTo(GAP, 0);
  });

  it("uses the outermost ring when the focus holds several radial bars", async () => {
    let size = (_point: ChartPoint) => 0;
    // Every bar in one focus, the innermost first.
    const all = (points: readonly ChartPoint[]) => [...points].sort((a, b) => size(a) - size(b));
    const focus: ChartFocusStrategy = { resolve: all, group: all, navigation: all };
    const chart = mount(
      (ctx: ChartContext<VisitorRow>) => ({ ...visitorRadialBars(ctx), focus }),
      "400px",
      MARGIN,
    );
    await frame();
    const { radius, at } = rings(chart);
    size = radius;
    const [inner, , outer] = all(chart.controller.getScene()!.points);

    await pointAt(chart, ...at(radius(inner!), 0.4));
    const box = await shown();
    expect(gap(chart, box, at(radius(outer!), 0.4))).toBeCloseTo(GAP, 0);
  });
});

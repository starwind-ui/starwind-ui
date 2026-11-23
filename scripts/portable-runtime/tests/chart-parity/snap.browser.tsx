// Tooltip placement and motion parity (SPEC-AC-30, SPEC-AC-32, SPEC-AC-36, SPEC-AC-40, SPEC-AC-42,
// tickets 17, 19, 23, 27 and 29): in every framework the Starwind tooltip shows in place with no
// slide, snaps to the hovered item by chart type, eases every later move on both axes with one
// `translate` motion started at most once per frame, so a diagonal move takes a straight line and a
// slow slide keeps it moving, and places the same way for the pointer and the keyboard. A radial
// bar tooltip follows the pointer angle on the hovered ring, and the keyboard keeps the bar end.
// Framework bodies may fill after the first paint, so the first show is sampled over several frames.
import { getChartController } from "@starwind-ui/runtime/chart";
import type { ChartPoint } from "@tanstack/charts";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import type { ParityCase } from "./fixtures/cases";
import { chartRoot, cleanup, FRAMEWORKS, type Framework, settle, start, status } from "./harness";

const GAP = 14;
/** The motion of every move after the first show: shadcn's (Recharts) 400 ms `ease`. */
const MOTION = { duration: 400, easing: "ease" };
/** Longer than the motion, so a move has ended. */
const MOVE = 500;

afterEach(cleanup);

// The suite loads no compiled Tailwind, so it adds the rule the old Styled class compiled to: a
// 100 ms duration for every property. The tooltip must still show in place.
const oldRule = document.createElement("style");
beforeAll(() => {
  oldRule.textContent = ".ts-chart-tooltip { transition-duration: 100ms; }";
  document.head.append(oldRule);
});
afterAll(() => oldRule.remove());

interface Chart {
  element: HTMLElement;
  svg: SVGSVGElement;
  scene(): NonNullable<ReturnType<NonNullable<ReturnType<typeof getChartController>>["getScene"]>>;
}

/** Starts a case at a width that fits the test viewport, so the plot edge is on screen. */
async function open(
  framework: Framework,
  mode: ParityCase,
  width = "380px",
  margin = "",
): Promise<Chart> {
  const { element } = await start(framework, mode);
  element.style.width = width;
  element.style.margin = margin;
  await settle();
  await settle();
  const root = chartRoot(element);
  return {
    element,
    svg: element.querySelector<SVGSVGElement>("svg.ts-chart")!,
    scene: () => getChartController(root)!.getScene()!,
  };
}

function client(chart: Chart, x: number, y: number) {
  const rect = chart.svg.getBoundingClientRect();
  const scene = chart.scene();
  return {
    x: rect.left + (x * rect.width) / scene.width,
    y: rect.top + (y * rect.height) / scene.height,
  };
}

function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function running(): CSSTransition[] {
  return status()!
    .getAnimations()
    .filter((animation): animation is CSSTransition => animation instanceof CSSTransition);
}

function transitions(): string[] {
  return running()
    .map((animation) => animation.transitionProperty)
    .sort();
}

/** The running transitions as property, duration and easing. */
function motion() {
  return running()
    .map((animation) => {
      const { duration, easing } = animation.effect!.getTiming();
      return { property: animation.transitionProperty, duration, easing };
    })
    .sort((a, b) => a.property.localeCompare(b.property));
}

/**
 * Moves the pointer to a scene point. On a first show it samples the next frames and checks that
 * the tooltip never transitions its position and never sits at the top left.
 */
async function pointAt(chart: Chart, x: number, y: number): Promise<DOMRect> {
  const first = !status() || status()!.hidden;
  const point = client(chart, x, y);
  chart.svg.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      pointerType: "mouse",
    }),
  );
  await vi.waitFor(() => expect(status()?.hidden).toBe(false));
  if (first) {
    const surface = chart.svg.getBoundingClientRect();
    for (let index = 0; index < 4; index++) {
      expect(transitions()).toEqual([]);
      const box = status()!.getBoundingClientRect();
      expect(box.left).toBeGreaterThan(surface.left + 8);
      await frame();
    }
  }
  // Every move after the first show eases.
  await new Promise((resolve) => setTimeout(resolve, first ? 0 : MOVE));
  await settle();
  return status()!.getBoundingClientRect();
}

/** Focuses the chart and moves to the first item with the keyboard. */
async function keyboardItem(chart: Chart): Promise<{ point: ChartPoint; box: DOMRect }> {
  let point: ChartPoint | undefined;
  chart.element.addEventListener("starwind-chart:focus-change", (event) => {
    point = (event as CustomEvent<{ point: ChartPoint | null }>).detail.point ?? point;
  });
  chart.svg.focus();
  await userEvent.keyboard("{Home}");
  await vi.waitFor(() => expect(status()?.hidden).toBe(false));
  await new Promise((resolve) => setTimeout(resolve, MOVE));
  return { point: point!, box: status()!.getBoundingClientRect() };
}

async function blur(chart: Chart): Promise<void> {
  chart.svg.blur();
  await vi.waitFor(() => expect(status()!.hidden).toBe(true));
}

function band(chart: Chart, value: unknown) {
  const scale = chart.scene().scales.x!;
  const center = scale.map(value);
  return { left: center - scale.bandwidth / 2, center, right: center + scale.bandwidth / 2 };
}

/** A band on y, for horizontal bars. */
function bandY(chart: Chart, value: unknown) {
  const scale = chart.scene().scales.y!;
  const center = scale.map(value);
  return { top: center - scale.bandwidth / 2, center, bottom: center + scale.bandwidth / 2 };
}

/** The client distance from a scene point to the tooltip box. */
function gap(chart: Chart, box: DOMRect, [x, y]: [number, number]): number {
  const point = client(chart, x, y);
  return Math.hypot(
    Math.max(box.left - point.x, 0, point.x - box.right),
    Math.max(box.top - point.y, 0, point.y - box.bottom),
  );
}

function middle(chart: Chart): number {
  const plot = chart.scene().chart;
  return plot.y + plot.height / 2;
}

type Record = { left: number; top: number };
const placed = new Map<string, Map<Framework, Record>>();

function remember(name: string, framework: Framework, box: DOMRect): void {
  const entry = placed.get(name) ?? new Map<Framework, Record>();
  entry.set(framework, { left: Math.round(box.left), top: Math.round(box.top) });
  placed.set(name, entry);
}

for (const framework of FRAMEWORKS) {
  describe(`${framework} tooltip placement`, () => {
    it("puts a bar tooltip beside the category, flips it at the plot edge and matches the keyboard", async () => {
      const chart = await open(framework, "default");
      const { point, box: keyboard } = await keyboardItem(chart);
      const item = band(chart, point.xValue);
      expect(keyboard.left).toBeCloseTo(client(chart, item.right, 0).x + GAP, 0);
      await blur(chart);

      const box = await pointAt(chart, item.center, middle(chart));
      expect(box.left).toBeCloseTo(keyboard.left, 0);
      expect(box.top + box.height / 2).toBeCloseTo(client(chart, 0, middle(chart)).y, 0);
      remember("bar", framework, box);

      const last = band(chart, "March");
      const flipped = await pointAt(chart, last.center, middle(chart));
      expect(flipped.right).toBeCloseTo(client(chart, last.left, 0).x - GAP, 0);
    });

    it("puts an area tooltip at the point x and matches the keyboard", async () => {
      const chart = await open(framework, "area");
      const { point, box: keyboard } = await keyboardItem(chart);
      const x = chart.scene().scales.x!.map(point.xValue);
      expect(keyboard.left).toBeCloseTo(client(chart, x, 0).x + GAP, 0);
      await blur(chart);

      const box = await pointAt(chart, x - 8, middle(chart));
      expect(box.left).toBeCloseTo(keyboard.left, 0);
      expect(box.top + box.height / 2).toBeCloseTo(client(chart, 0, middle(chart)).y, 0);
      remember("area", framework, box);
    });

    it("eases every move after the first show on both axes with one motion", async () => {
      const chart = await open(framework, "default");
      const feb = band(chart, "February");
      await pointAt(chart, band(chart, "January").center, middle(chart));

      moveTo(chart, feb.center, middle(chart) + 20);
      await vi.waitFor(() => expect(transitions()).toEqual(["translate"]));
      expect(motion()).toEqual([{ property: "translate", ...MOTION }]);
      await settled();

      // A pointer move on the follow axis eases the same one property, so both axes share a timeline.
      moveTo(chart, feb.center + 4, middle(chart) - 25);
      await vi.waitFor(() => expect(transitions()).toEqual(["translate"]));
      expect(motion()).toEqual([{ property: "translate", ...MOTION }]);
    });

    it("moves in a straight line when a follow-axis move comes during an item move", async () => {
      const chart = await open(framework, "default");
      await pointAt(chart, band(chart, "January").center, middle(chart) - 30);

      // An item move on x, then a pointer move on y while the first move runs.
      moveTo(chart, band(chart, "February").center, middle(chart) - 30);
      await new Promise((resolve) => setTimeout(resolve, 120));
      moveTo(chart, band(chart, "February").center, middle(chart) + 30);
      const path: DOMRect[] = [];
      for (let index = 0; index < 20; index++) {
        await frame();
        path.push(status()!.getBoundingClientRect());
      }
      const end = await settled();
      const start = path[0]!;
      const [dx, dy] = [end.left - start.left, end.top - start.top];
      expect(Math.abs(dx)).toBeGreaterThan(5);
      expect(Math.abs(dy)).toBeGreaterThan(5);

      // The distance of each frame from the line between the first frame and the end.
      const length = Math.hypot(dx, dy);
      const off = path.map(
        (box) => Math.abs((box.left - start.left) * dy - (box.top - start.top) * dx) / length,
      );
      expect(Math.max(...off)).toBeLessThan(1);
    });

    it("starts at most one ease per frame and keeps moving during a slow slide", async () => {
      const chart = await open(framework, "default");
      const x = band(chart, "February").center;
      const start = middle(chart) + 30;
      const first = await pointAt(chart, x, start);
      let runs = 0;
      status()!.addEventListener("transitionrun", () => runs++);

      // 30 frames. Each frame moves the pointer up 1 scene pixel in 6 events spread over the frame.
      let y = start;
      for (let index = 0; index < 30; index++) {
        for (let step = 0; step < 6; step++) {
          y -= 1 / 6;
          moveTo(chart, x, y);
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
        await frame();
      }
      const moved = first.top - status()!.getBoundingClientRect().top;
      const pointer = client(chart, 0, start).y - client(chart, 0, y).y;

      expect(runs).toBeLessThanOrEqual(31);
      expect(moved).toBeGreaterThan(pointer * 0.2);
    });

    it("puts a horizontal bar tooltip below the band, flips it at the plot edge and matches the keyboard", async () => {
      const chart = await open(framework, "bars-x");
      const { point, box: keyboard } = await keyboardItem(chart);
      const item = bandY(chart, point.yValue);
      expect(keyboard.top).toBeCloseTo(client(chart, 0, item.bottom).y + GAP, 0);
      await blur(chart);

      const plot = chart.scene().chart;
      const x = plot.x + plot.width / 2;
      const box = await pointAt(chart, x, item.center);
      expect(box.top).toBeCloseTo(keyboard.top, 0);
      expect(box.left + box.width / 2).toBeCloseTo(client(chart, x, 0).x, 0);
      remember("bars-x", framework, box);

      const last = bandY(chart, "March");
      const flipped = await pointAt(chart, x, last.center);
      expect(flipped.bottom).toBeCloseTo(client(chart, 0, last.top).y - GAP, 0);
    });

    for (const mode of ["donut", "radar", "nested"] as const) {
      it(`keeps a ${mode} tooltip at one place per item for the pointer and the keyboard`, async () => {
        const chart = await open(framework, mode);
        const { point, box: keyboard } = await keyboardItem(chart);
        await blur(chart);

        const box = await pointAt(chart, point.x + 3, point.y + 3);
        expect(box.toJSON()).toEqual(keyboard.toJSON());
        expect((await pointAt(chart, point.x - 2, point.y + 4)).toJSON()).toEqual(
          keyboard.toJSON(),
        );
        remember(mode, framework, box);
      });
    }

    it("puts a radial bar tooltip on the hovered ring at the pointer angle and keeps the bar end for the keyboard", async () => {
      const chart = await open(framework, "radial");
      const { point, box: keyboard } = await keyboardItem(chart);
      expect(gap(chart, keyboard, [point.x, point.y])).toBeCloseTo(GAP, 0);
      await blur(chart);

      // A scene point at a radius and an angle clockwise from the top, as TanStack draws it.
      const plot = chart.scene().chart;
      const [cx, cy] = [plot.x + plot.width / 2, plot.y + plot.height / 2];
      const radius = Math.hypot(point.x - cx, point.y - cy);
      const at = (r: number, angle: number): [number, number] => [
        cx + r * Math.sin(angle),
        cy - r * Math.cos(angle),
      ];
      const box = await pointAt(chart, ...at(radius + 3, 0.3));
      expect(gap(chart, box, at(radius, 0.3))).toBeCloseTo(GAP, 0);
      remember("radial", framework, box);

      moveTo(chart, ...at(radius - 2, 1.2));
      await vi.waitFor(() => expect(transitions()).toEqual(["translate"]));
      expect(gap(chart, await settled(), at(radius, 1.2))).toBeCloseTo(GAP, 0);
    });
  });
}

describe("tooltip placement across frameworks", () => {
  it("places the tooltip at the same spot in every framework", () => {
    for (const [name, entry] of placed) {
      const react = entry.get("react");
      expect(react, name).toBeDefined();
      for (const framework of FRAMEWORKS)
        expect(entry.get(framework), `${name} ${framework}`).toEqual(react);
    }
    expect([...placed.keys()].sort()).toEqual([
      "area",
      "bar",
      "bars-x",
      "donut",
      "nested",
      "radar",
      "radial",
    ]);
  });
});

/** The tooltip rect in the first animation frame, before anything places it again. */
function firstFrame(): Promise<DOMRect> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => resolve(status()!.getBoundingClientRect())),
  );
}

/** Moves the pointer in this task, so the next frame is the first one painted. */
function moveTo(chart: Chart, x: number, y: number): void {
  const point = client(chart, x, y);
  chart.svg.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      pointerType: "mouse",
    }),
  );
}

async function settled(): Promise<DOMRect> {
  await new Promise((resolve) => setTimeout(resolve, MOVE));
  await settle();
  return status()!.getBoundingClientRect();
}

// The first frame after the tooltip shows must be its settled place, in a wide viewport with the
// chart away from its edges. Framework bodies fill after the paint, so this covers the fill too.
describe("tooltip first frame", () => {
  const MARGIN = "120px 0 0 240px";
  const minWidth = document.createElement("style");

  beforeAll(() => page.viewport(1200, 800));
  afterAll(() => page.viewport(414, 896));
  afterEach(() => minWidth.remove());

  for (const framework of FRAMEWORKS) {
    it(`${framework} paints a flipped last-band tooltip in place`, async () => {
      minWidth.textContent = ".ts-chart-tooltip { min-width: 160px; }";
      document.head.append(minWidth);
      const chart = await open(framework, "default", "250px", MARGIN);
      const march = band(chart, "March");

      moveTo(chart, march.center, middle(chart));
      const first = await firstFrame();
      const box = await settled();

      expect(box.right).toBeCloseTo(client(chart, march.left, 0).x - GAP, 0);
      expect(first.toJSON()).toEqual(box.toJSON());
    });

    it(`${framework} paints a tooltip for the pointer at the plot top inside the plot`, async () => {
      const chart = await open(framework, "default", "400px", MARGIN);

      moveTo(chart, band(chart, "February").center, chart.scene().chart.y + 1);
      const first = await firstFrame();
      const box = await settled();

      expect(box.top).toBeGreaterThanOrEqual(client(chart, 0, chart.scene().chart.y).y - 0.5);
      expect(first.toJSON()).toEqual(box.toJSON());
    });

    it(`${framework} paints a keyboard tooltip in place`, async () => {
      const chart = await open(framework, "default", "400px", MARGIN);

      // Focus shows the first item. A key press shows it when focus does not.
      chart.svg.focus();
      if (status()?.hidden !== false)
        chart.svg.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      const first = await firstFrame();
      const box = await settled();

      expect(box.left).toBeCloseTo(client(chart, band(chart, "January").right, 0).x + GAP, 0);
      expect(first.toJSON()).toEqual(box.toJSON());
    });
  }
});

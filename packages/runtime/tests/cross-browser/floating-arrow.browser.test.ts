import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { createNavigationMenu } from "../../src/components/navigation-menu/navigation-menu";
import { createTooltip } from "../../src/components/tooltip/tooltip";

// The arrow reads the offsets that the floating positioner writes, as the Styled Tooltip arrow does.
const ARROW_STYLE =
  "position:absolute;width:16px;height:16px;left:var(--sw-floating-arrow-x,0px);top:var(--sw-floating-arrow-y,0px)";
const ARROW_PADDING = 6;
const VIEWPORT_PADDING = 8;

type Dir = "ltr" | "rtl";
type EdgeCase = {
  name: string;
  align: "center" | "end" | "start";
  edge: "end" | "start";
  inset: number;
  size: number;
};

// A trigger of 80px (48px on the vertical axis) leaves room for the arrow to reach its center.
const CASES: EdgeCase[] = [
  { name: "align start at the start edge", align: "start", edge: "start", inset: 0, size: 0 },
  { name: "align start at the end edge", align: "start", edge: "end", inset: 0, size: 0 },
  { name: "align end at the start edge", align: "end", edge: "start", inset: 0, size: 0 },
  { name: "align end at the end edge", align: "end", edge: "end", inset: 0, size: 0 },
  {
    name: "a trigger half past the start edge",
    align: "center",
    edge: "start",
    inset: -1,
    size: 0,
  },
  { name: "a trigger half past the end edge", align: "center", edge: "end", inset: -1, size: 0 },
  {
    name: "a narrow trigger at the start edge",
    align: "center",
    edge: "start",
    inset: 0,
    size: 24,
  },
  { name: "a narrow trigger at the end edge", align: "center", edge: "end", inset: 0, size: 24 },
];
const DIRS: Dir[] = ["ltr", "rtl"];

describe("floating arrows at phone screen edges", () => {
  const original = { height: 0, width: 0 };
  beforeAll(() => {
    original.height = window.innerHeight;
    original.width = window.innerWidth;
  });
  afterEach(async () => {
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("dir");
    await page.viewport(original.width, original.height);
  });

  for (const side of ["top", "right"] as const) {
    for (const dir of DIRS) {
      it.each(CASES)(
        `keeps a ${side} ${dir} Tooltip arrow on the trigger with $name`,
        async (c) => {
          await page.viewport(390, 844);
          document.documentElement.dir = dir;
          const { root, trigger } = renderTooltip(side, c.align);
          placeTrigger(trigger, side === "top" ? "x" : "y", dir, c);

          const tooltip = createTooltip(root, { defaultOpen: true });
          await waitForFloatingPosition();

          expectArrowOnTrigger(
            root,
            side,
            trigger,
            "[data-sw-tooltip-popup]",
            "[data-sw-tooltip-arrow]",
          );
          tooltip.destroy();
        },
      );
    }
  }

  for (const dir of DIRS) {
    it.each(CASES)(
      `keeps a bottom ${dir} Navigation Menu arrow on the trigger with $name`,
      async (c) => {
        await page.viewport(390, 844);
        document.documentElement.dir = dir;
        const root = renderNavigationMenu(c.align);
        const trigger = root.querySelector<HTMLElement>("[data-sw-nav-menu-trigger]")!;
        placeTrigger(trigger, "x", dir, c);

        const menu = createNavigationMenu(root);
        trigger.click();
        await waitForFloatingPosition();
        await waitForFloatingPosition();

        expectArrowOnTrigger(
          root,
          "bottom",
          trigger,
          "[data-sw-nav-menu-popup]",
          "[data-sw-nav-menu-arrow]",
        );
        menu.destroy();
      },
    );
  }
});

function renderTooltip(side: "right" | "top", align: EdgeCase["align"]) {
  const root = document.createElement("div");
  root.setAttribute("data-sw-tooltip", "");
  root.setAttribute("data-open-delay", "0");
  root.innerHTML = `
    <button data-sw-tooltip-trigger>Trigger</button>
    <div data-sw-tooltip-popup data-side="${side}" data-align="${align}"
      style="box-sizing:border-box;width:${side === "top" ? 240 : 160}px;height:${side === "top" ? 40 : 120}px">
      <div data-sw-tooltip-arrow style="${ARROW_STYLE}"></div>
    </div>
  `;
  document.body.append(root);
  return { root, trigger: root.querySelector<HTMLElement>("[data-sw-tooltip-trigger]")! };
}

function renderNavigationMenu(align: EdgeCase["align"]): HTMLElement {
  const root = document.createElement("nav");
  root.setAttribute("data-sw-nav-menu", "");
  root.setAttribute("aria-label", "Main");
  root.innerHTML = `
    <ul data-sw-nav-menu-list>
      <li data-sw-nav-menu-item data-value="products">
        <button type="button" data-sw-nav-menu-trigger>Products</button>
        <div data-sw-nav-menu-content style="box-sizing:border-box;height:120px;width:240px">Products</div>
      </li>
    </ul>
    <div data-sw-nav-menu-positioner data-side="bottom" data-align="${align}">
      <div data-sw-nav-menu-popup>
        <div data-sw-nav-menu-viewport></div>
        <div data-sw-nav-menu-arrow style="${ARROW_STYLE}"></div>
      </div>
    </div>
  `;
  document.body.append(root);
  return root;
}

function placeTrigger(trigger: HTMLElement, axis: "x" | "y", dir: Dir, c: EdgeCase): void {
  const length = c.size || (axis === "x" ? 80 : 48);
  const inset = c.inset < 0 ? -length / 2 : c.inset;
  if (axis === "x") {
    const physical = (c.edge === "start") === (dir === "ltr") ? "left" : "right";
    trigger.style.cssText = `position:fixed;margin:0;${physical}:${inset}px;top:300px;width:${length}px;height:32px`;
  } else {
    const physical = c.edge === "start" ? "top" : "bottom";
    trigger.style.cssText = `position:fixed;margin:0;left:100px;${physical}:${inset}px;width:80px;height:${length}px`;
  }
}

function expectArrowOnTrigger(
  root: ParentNode,
  side: "bottom" | "right" | "top",
  trigger: HTMLElement,
  popupSelector: string,
  arrowSelector: string,
): void {
  const horizontal = side !== "right";
  const [start, end] = horizontal ? (["left", "right"] as const) : (["top", "bottom"] as const);
  const viewportLength = horizontal ? window.innerWidth : window.innerHeight;
  const popup = document.querySelector<HTMLElement>(popupSelector)!.getBoundingClientRect();
  const arrow = document.querySelector<HTMLElement>(arrowSelector)!.getBoundingClientRect();
  const anchor = trigger.getBoundingClientRect();
  const arrowCenter = (arrow[start] + arrow[end]) / 2;

  expect(popup[start]).toBeGreaterThanOrEqual(VIEWPORT_PADDING - 0.5);
  expect(popup[end]).toBeLessThanOrEqual(viewportLength - VIEWPORT_PADDING + 0.5);
  if (side === "top") expect(popup.bottom).toBeLessThanOrEqual(anchor.top);
  if (side === "bottom") expect(popup.top).toBeGreaterThanOrEqual(anchor.bottom);
  if (side === "right") expect(popup.left).toBeGreaterThanOrEqual(anchor.right);
  // The arrow stays inside the popup and away from its rounded corners.
  expect(arrow[start]).toBeGreaterThanOrEqual(popup[start] + ARROW_PADDING - 0.5);
  expect(arrow[end]).toBeLessThanOrEqual(popup[end] - ARROW_PADDING + 0.5);

  const visibleStart = Math.max(anchor[start], 0);
  const visibleEnd = Math.min(anchor[end], viewportLength);
  const anchorCenter = (anchor[start] + anchor[end]) / 2;
  const reachable =
    visibleStart === anchor[start] &&
    visibleEnd === anchor[end] &&
    anchorCenter - VIEWPORT_PADDING >= ARROW_PADDING + arrow.width / 2 &&
    viewportLength - VIEWPORT_PADDING - anchorCenter >= ARROW_PADDING + arrow.width / 2;
  if (reachable) {
    expect(Math.abs(arrowCenter - anchorCenter)).toBeLessThanOrEqual(1);
  } else {
    expect(arrowCenter).toBeGreaterThanOrEqual(visibleStart - 0.5);
    expect(arrowCenter).toBeLessThanOrEqual(visibleEnd + 0.5);
  }
}

async function waitForFloatingPosition(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.resolve();
}

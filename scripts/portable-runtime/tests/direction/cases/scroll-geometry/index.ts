import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";

const source = `---
---
<html lang="en"><head><meta charset="utf-8"/></head><body dir="ltr">
${["factory", "initStarwind"]
  .map(
    (mode) => `
  <div data-mode="${mode}" data-sw-scroll-area dir="rtl" style="position:relative;width:200px;height:100px;margin:24px">
    <div data-sw-scroll-area-viewport style="width:200px;height:100px;overflow:auto;scrollbar-width:none">
      <div data-sw-scroll-area-content style="width:500px;height:300px">Scrollable content</div>
    </div>
    <div data-sw-scroll-area-scrollbar data-orientation="horizontal" style="box-sizing:border-box;position:absolute;left:0;bottom:0;width:200px;height:16px;display:flex;padding-left:7px;padding-right:13px">
      <div data-sw-scroll-area-thumb style="height:100%;margin-left:3px;margin-right:9px"></div>
    </div>
    <div data-sw-scroll-area-scrollbar data-orientation="vertical" style="box-sizing:border-box;position:absolute;right:0;top:0;width:16px;height:100px;display:flex;flex-direction:column;padding-top:5px;padding-bottom:11px">
      <div data-sw-scroll-area-thumb style="width:100%;margin-top:4px;margin-bottom:8px"></div>
    </div>
  </div>`,
  )
  .join("\n")}
<script>
import { createScrollArea } from "@starwind-ui/runtime/scroll-area";
import { initStarwind } from "@starwind-ui/runtime/init-starwind";
const factory = document.querySelector('[data-mode="factory"]');
createScrollArea(factory);
initStarwind(document.body);
document.body.dataset.ready = "true";
</script></body></html>`;

export const cases: DirectionCase[] = [
  {
    id: "scroll-geometry-raw-scroll-area",
    row: "runtime:scroll-area",
    acceptance: ["SPEC-AC-04", "SPEC-AC-09", "SPEC-AC-14"],
    rawEntrypoints: ["factory", "initStarwind"],
    fixtures: {
      astro: {
        source,
        exports: [],
        assertions: ["physical-thumb-edges", "wheel-track-drag-and-live-direction"],
      },
    },
    physicalExceptions: [
      "Native scrollLeft and pointer coordinates remain physical; overflow facts are logical.",
    ],
  },
];

type Capture = {
  direction: string;
  native: number;
  max: number;
  start: number;
  end: number;
  thumbLeft: number;
  thumbRight: number;
  thumbWidth: number;
  trackTop: number;
  trackHeight: number;
  verticalThumbTop: number;
  scrollTop: number;
  overflowStart: boolean;
  overflowEnd: boolean;
};

async function capture(page: Page, mode: string): Promise<Capture> {
  return page.evaluate((mode) => {
    const root = document.querySelector<HTMLElement>(`[data-mode="${mode}"]`)!;
    const viewport = root.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
    const track = root.querySelector<HTMLElement>(
      '[data-sw-scroll-area-scrollbar][data-orientation="horizontal"]',
    )!;
    const thumb = track.querySelector<HTMLElement>("[data-sw-scroll-area-thumb]")!;
    const verticalThumb = root.querySelector<HTMLElement>(
      '[data-sw-scroll-area-scrollbar][data-orientation="vertical"] [data-sw-scroll-area-thumb]',
    )!;
    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const scale = trackRect.width / track.offsetWidth;
    return {
      direction: getComputedStyle(viewport).direction,
      native: viewport.scrollLeft,
      max: viewport.scrollWidth - viewport.clientWidth,
      start: trackRect.left + (7 + 3) * scale,
      end: trackRect.right - (13 + 9) * scale,
      thumbLeft: thumbRect.left,
      thumbRight: thumbRect.right,
      thumbWidth: thumbRect.width,
      trackTop: trackRect.top,
      trackHeight: trackRect.height,
      verticalThumbTop: verticalThumb.getBoundingClientRect().top,
      scrollTop: viewport.scrollTop,
      overflowStart: root.hasAttribute("data-overflow-x-start"),
      overflowEnd: root.hasAttribute("data-overflow-x-end"),
    };
  }, mode);
}

async function frame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
}

async function exercise(page: Page, mode: string) {
  const selector = `[data-mode="${mode}"]`;
  await frame(page);
  const start = await capture(page, mode);
  await page
    .locator(`${selector} [data-sw-scroll-area-viewport]`)
    .hover({ position: { x: 45, y: 30 } });
  await page.mouse.wheel(-60, 0);
  await page.waitForFunction(
    (mode) =>
      document.querySelector<HTMLElement>(`[data-mode="${mode}"] [data-sw-scroll-area-viewport]`)!
        .scrollLeft < -20,
    mode,
  );
  const nativeWheel = await capture(page, mode);

  await page.evaluate((mode) => {
    const viewport = document.querySelector<HTMLElement>(
      `[data-mode="${mode}"] [data-sw-scroll-area-viewport]`,
    )!;
    viewport.scrollLeft = -(viewport.scrollWidth - viewport.clientWidth);
    viewport.dispatchEvent(new Event("scroll"));
  }, mode);
  await frame(page);
  const end = await capture(page, mode);

  const clickX = end.start + end.thumbWidth / 2 + (end.end - end.start - end.thumbWidth) * 0.5;
  await page.mouse.click(clickX, end.trackTop + end.trackHeight / 2);
  const trackClick = await capture(page, mode);
  const thumbCenter = trackClick.thumbLeft + trackClick.thumbWidth / 2;
  const dragY = trackClick.trackTop + trackClick.trackHeight / 2;
  await page.mouse.move(thumbCenter, dragY);
  await page.mouse.down();
  await page.mouse.move(thumbCenter - 20, dragY);
  const dragLeft = await capture(page, mode);
  await page.mouse.move(thumbCenter + 20, dragY);
  const dragRight = await capture(page, mode);
  await page.mouse.up();

  await page.evaluate((mode) => {
    const viewport = document.querySelector<HTMLElement>(
      `[data-mode="${mode}"] [data-sw-scroll-area-viewport]`,
    )!;
    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
  }, mode);
  await frame(page);
  const beforeFlip = await capture(page, mode);
  await page.evaluate(async (mode) => {
    document.querySelector<HTMLElement>(`[data-mode="${mode}"]`)!.dir = "ltr";
    document.dispatchEvent(new Event("starwind:direction-change"));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, mode);
  const flipped = await capture(page, mode);
  return {
    mode,
    start,
    nativeWheel,
    end,
    trackClick,
    clickX,
    dragLeft,
    dragRight,
    beforeFlip,
    flipped,
  };
}

export const expectations: DirectionExpectation[] = [
  {
    id: "scroll-geometry-raw-scroll-area",
    layer: "raw-html",
    async run(page, target, context: DirectionAssertionContext) {
      assert.equal(target, "astro");
      await page.waitForSelector('body[data-ready="true"]', { state: "attached" });
      await page.evaluate("window.__name = (target) => target");
      const results: Array<Awaited<ReturnType<typeof exercise>>> = [];
      for (const mode of ["factory", "initStarwind"]) results.push(await exercise(page, mode));
      await context.check("physical-thumb-edges", () => {
        context.observe("physical-thumb-edges", results);
        for (const result of results) {
          assert.equal(result.start.direction, "rtl");
          assert.equal(result.start.native, 0);
          assert(Math.abs(result.start.thumbRight - result.start.end) < 2);
          assert.equal(result.start.overflowStart, false);
          assert.equal(result.start.overflowEnd, true);
          assert(Math.abs(result.end.native + result.end.max) < 1);
          assert(Math.abs(result.end.thumbLeft - result.end.start) < 2);
          assert.equal(result.end.overflowStart, true);
          assert.equal(result.end.overflowEnd, false);
        }
      });
      await context.check("wheel-track-drag-and-live-direction", () => {
        context.observe("wheel-track-drag-and-live-direction", results);
        for (const result of results) {
          assert(result.nativeWheel.native < -20);
          assert(
            Math.abs(
              result.trackClick.thumbLeft + result.trackClick.thumbWidth / 2 - result.clickX,
            ) < 2,
          );
          assert(result.dragLeft.native < result.trackClick.native);
          assert(result.dragRight.native > result.trackClick.native);
          assert.equal(result.flipped.direction, "ltr");
          const max = result.flipped.max;
          const logical = Math.max(0, Math.min(result.flipped.native, max));
          const expectedLeft =
            result.flipped.start +
            (result.flipped.end - result.flipped.start - result.flipped.thumbWidth) *
              (logical / max);
          assert(Math.abs(result.flipped.thumbLeft - expectedLeft) < 2);
          assert(Math.abs(result.flipped.scrollTop - result.beforeFlip.scrollTop) < 1);
          assert(
            Math.abs(result.flipped.verticalThumbTop - result.beforeFlip.verticalThumbTop) < 2,
          );
        }
      });
    },
  },
];

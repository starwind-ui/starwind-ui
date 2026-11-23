import { afterEach, describe, expect, it } from "vitest";

import { createScrollArea } from "../../src/components/scroll-area/scroll-area";

type Fixture = {
  root: HTMLElement;
  viewport: HTMLElement;
  horizontal: HTMLElement;
  vertical: HTMLElement;
  horizontalThumb: HTMLElement;
  verticalThumb: HTMLElement;
};

const instances: Array<{ destroy(): void }> = [];

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy();
  document.body.innerHTML = "";
});

function fixture(direction: "ltr" | "rtl" = "rtl"): Fixture {
  const root = document.createElement("div");
  root.setAttribute("data-sw-scroll-area", "");
  root.dir = direction;
  root.style.cssText = "position:relative;width:200px;height:100px;";
  root.innerHTML = `
    <div data-sw-scroll-area-viewport style="width:200px;height:100px;overflow:auto;scrollbar-width:none">
      <div data-sw-scroll-area-content style="width:500px;height:300px">Content</div>
    </div>
    <div data-sw-scroll-area-scrollbar data-orientation="horizontal" style="box-sizing:border-box;position:absolute;left:0;bottom:0;width:200px;height:16px;display:flex;padding-left:7px;padding-right:13px">
      <div data-sw-scroll-area-thumb style="height:100%;margin-left:3px;margin-right:9px"></div>
    </div>
    <div data-sw-scroll-area-scrollbar data-orientation="vertical" style="box-sizing:border-box;position:absolute;right:0;top:0;width:16px;height:100px;display:flex;flex-direction:column;padding-top:5px;padding-bottom:11px">
      <div data-sw-scroll-area-thumb style="width:100%;margin-top:4px;margin-bottom:8px"></div>
    </div>`;
  document.body.append(root);
  const viewport = root.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
  const horizontal = root.querySelector<HTMLElement>('[data-orientation="horizontal"]')!;
  const vertical = root.querySelector<HTMLElement>('[data-orientation="vertical"]')!;
  const horizontalThumb = horizontal.querySelector<HTMLElement>("[data-sw-scroll-area-thumb]")!;
  const verticalThumb = vertical.querySelector<HTMLElement>("[data-sw-scroll-area-thumb]")!;
  instances.push(createScrollArea(root));
  return { root, viewport, horizontal, vertical, horizontalThumb, verticalThumb };
}

async function frame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function physicalEdges(f: Fixture) {
  const track = f.horizontal.getBoundingClientRect();
  const thumb = f.horizontalThumb.getBoundingClientRect();
  const scale = track.width / f.horizontal.offsetWidth;
  return {
    track,
    thumb,
    start: track.left + (7 + 3) * scale,
    end: track.right - (13 + 9) * scale,
  };
}

describe("Scroll Area direction geometry", () => {
  it("keeps RTL native offsets and thumb bounds at both logical edges", async () => {
    const f = fixture();
    await frame();
    const max = f.viewport.scrollWidth - f.viewport.clientWidth;
    const initial = physicalEdges(f);
    expect(f.viewport.scrollLeft).toBe(0);
    expect(Math.abs(initial.thumb.right - initial.end)).toBeLessThan(2);
    expect(f.root.hasAttribute("data-overflow-x-start")).toBe(false);
    expect(f.root.hasAttribute("data-overflow-x-end")).toBe(true);

    f.viewport.scrollLeft = -max;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const end = physicalEdges(f);
    expect(f.viewport.scrollLeft).toBe(-max);
    expect(Math.abs(end.thumb.left - end.start)).toBeLessThan(2);
    expect(f.root.hasAttribute("data-overflow-x-start")).toBe(true);
    expect(f.root.hasAttribute("data-overflow-x-end")).toBe(false);
    expect(f.root.style.getPropertyValue("--scroll-area-overflow-x-start")).toBe(`${max}px`);

    f.viewport.scrollLeft = -max - 80;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const beyondEnd = physicalEdges(f);
    expect(Math.abs(beyondEnd.thumb.left - beyondEnd.start)).toBeLessThan(2);
    expect(f.root.hasAttribute("data-overflow-x-end")).toBe(false);
    f.viewport.scrollLeft = 80;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const beyondStart = physicalEdges(f);
    expect(Math.abs(beyondStart.thumb.right - beyondStart.end)).toBeLessThan(2);
    expect(f.root.hasAttribute("data-overflow-x-start")).toBe(false);
  });

  it("maps physical track and drag input under scale with unequal spacing", async () => {
    const f = fixture();
    f.root.style.transform = "scale(1.5)";
    f.root.style.transformOrigin = "top left";
    f.root.style.zoom = "1.1";
    await frame();
    const track = physicalEdges(f);
    const y = track.track.top + track.track.height / 2;
    const leftCenter = track.start + track.thumb.width / 2;
    const rightCenter = track.end - track.thumb.width / 2;
    const xLeft = leftCenter + (rightCenter - leftCenter) * 0.2;
    const xRight = leftCenter + (rightCenter - leftCenter) * 0.8;
    f.horizontal.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: xLeft,
        clientY: y,
        isPrimary: true,
        pointerId: 1,
      }),
    );
    const leftClickThumb = f.horizontalThumb.getBoundingClientRect();
    expect(Math.abs(leftClickThumb.left + leftClickThumb.width / 2 - xLeft)).toBeLessThan(2);
    f.horizontal.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: xRight,
        clientY: y,
        isPrimary: true,
        pointerId: 2,
      }),
    );
    const rightClickThumb = f.horizontalThumb.getBoundingClientRect();
    expect(Math.abs(rightClickThumb.left + rightClickThumb.width / 2 - xRight)).toBeLessThan(2);

    f.viewport.scrollLeft = -150;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const thumb = f.horizontalThumb.getBoundingClientRect();
    const startX = thumb.left + thumb.width / 2;
    f.horizontalThumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: startX,
        clientY: y,
        isPrimary: true,
        pointerId: 3,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: startX - 30, pointerId: 3 }),
    );
    const afterLeft = f.viewport.scrollLeft;
    expect(afterLeft).toBeLessThan(-150);
    const leftDragThumb = f.horizontalThumb.getBoundingClientRect();
    expect(Math.abs(leftDragThumb.left + leftDragThumb.width / 2 - (startX - 30))).toBeLessThan(2);
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: startX + 30, pointerId: 3 }),
    );
    expect(f.viewport.scrollLeft).toBeGreaterThan(-150);
    const rightDragThumb = f.horizontalThumb.getBoundingClientRect();
    expect(Math.abs(rightDragThumb.left + rightDragThumb.width / 2 - (startX + 30))).toBeLessThan(
      2,
    );
    document.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 3 }));
    const canceled = f.viewport.scrollLeft;
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: startX - 60, pointerId: 3 }),
    );
    expect(f.viewport.scrollLeft).toBe(canceled);
  });

  it("refreshes a mounted rail on a direction-change event and keeps vertical scroll", async () => {
    const f = fixture();
    await frame();
    f.viewport.scrollLeft = -120;
    f.viewport.scrollTop = 80;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const sameViewport = f.viewport;
    const beforeFlipTop = f.viewport.scrollTop;
    const beforeFlipVerticalThumbTop = f.verticalThumb.getBoundingClientRect().top;
    f.root.dir = "ltr";
    document.dispatchEvent(new Event("starwind:direction-change"));
    await frame();
    expect(f.root.querySelector("[data-sw-scroll-area-viewport]")).toBe(sameViewport);
    expect(Math.abs(f.viewport.scrollTop - beforeFlipTop)).toBeLessThan(1);
    const ltr = physicalEdges(f);
    const max = f.viewport.scrollWidth - f.viewport.clientWidth;
    const logical = Math.max(0, Math.min(f.viewport.scrollLeft, max));
    const ratio = logical / max;
    expect(
      Math.abs(ltr.thumb.left - (ltr.start + (ltr.end - ltr.start - ltr.thumb.width) * ratio)),
    ).toBeLessThan(2);
    expect(f.verticalThumb.getBoundingClientRect().top).toBeGreaterThan(
      f.vertical.getBoundingClientRect().top,
    );
    expect(
      Math.abs(f.verticalThumb.getBoundingClientRect().top - beforeFlipVerticalThumbTop),
    ).toBeLessThan(2);
  });

  it("honors a local RTL viewport under an LTR track and leaves nested owners alone", async () => {
    const outer = fixture("ltr");
    const inner = fixture("ltr");
    outer.root.querySelector("[data-sw-scroll-area-content]")!.append(inner.root);
    inner.viewport.dir = "rtl";
    await frame();
    const initial = physicalEdges(inner);
    expect(Math.abs(initial.thumb.right - initial.end)).toBeLessThan(2);
    const outerNative = outer.viewport.scrollLeft;

    inner.horizontal.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: -40 }),
    );
    expect(Math.abs(inner.viewport.scrollLeft + 40)).toBeLessThan(1);
    expect(outer.viewport.scrollLeft).toBe(outerNative);
    inner.horizontal.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, shiftKey: true, deltaY: 35 }),
    );
    expect(Math.abs(inner.viewport.scrollLeft + 75)).toBeLessThan(1);
    expect(outer.viewport.scrollLeft).toBe(outerNative);

    inner.viewport.scrollLeft = -1000;
    inner.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const end = physicalEdges(inner);
    expect(Math.abs(end.thumb.left - end.start)).toBeLessThan(2);
    expect(inner.root.hasAttribute("data-overflow-x-end")).toBe(false);
    expect(outer.root.hasAttribute("data-overflow-x-end")).toBe(true);
  });

  it("cancels an active thumb drag on a direction change", async () => {
    const f = fixture();
    await frame();
    f.viewport.scrollLeft = -150;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const thumb = f.horizontalThumb.getBoundingClientRect();
    const x = thumb.left + thumb.width / 2;
    f.horizontalThumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: x,
        isPrimary: true,
        pointerId: 5,
      }),
    );
    const beforeOtherPointer = f.viewport.scrollLeft;
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: x + 80, pointerId: 6 }),
    );
    expect(f.viewport.scrollLeft).toBe(beforeOtherPointer);
    f.root.dir = "ltr";
    const afterFlip = f.viewport.scrollLeft;
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: x + 80, pointerId: 5 }),
    );
    expect(f.viewport.scrollLeft).toBe(afterFlip);
    await frame();
    expect(f.viewport.scrollLeft).toBe(afterFlip);
  });

  it("tracks drag events in the scrollbar owner document", async () => {
    const f = fixture();
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const ownerDocument = iframe.contentDocument!;
    ownerDocument.body.append(f.root);
    await frame();
    f.viewport.scrollLeft = -150;
    f.viewport.dispatchEvent(new Event("scroll"));
    await frame();
    const thumb = f.horizontalThumb.getBoundingClientRect();
    const x = thumb.left + thumb.width / 2;
    f.horizontalThumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: x,
        isPrimary: true,
        pointerId: 7,
      }),
    );
    ownerDocument.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: x - 25, pointerId: 7 }),
    );
    expect(f.viewport.scrollLeft).toBeLessThan(-150);
    const afterOwnerMove = f.viewport.scrollLeft;
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: x + 25, pointerId: 7 }),
    );
    expect(f.viewport.scrollLeft).toBe(afterOwnerMove);
    ownerDocument.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 7 }));
    ownerDocument.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: x - 50, pointerId: 7 }),
    );
    expect(f.viewport.scrollLeft).toBe(afterOwnerMove);
  });
});

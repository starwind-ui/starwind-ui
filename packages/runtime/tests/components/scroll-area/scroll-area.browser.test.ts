import { beforeEach, describe, expect, it, vi } from "vitest";

import { createScrollArea } from "../../../src/components/scroll-area/scroll-area";

describe("createScrollArea", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("measures vertical overflow and keeps the custom scrollbar in sync", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);

    const scrollArea = createScrollArea(root);
    await waitForLayout();

    expect(scrollArea.root).toBe(root);
    expect(viewport.tabIndex).toBe(0);
    expect(scrollbar.style.display).toBe("flex");
    expect(Number.parseFloat(thumb.style.height)).toBeGreaterThanOrEqual(20);
    expect(root.hasAttribute("data-overflow-y-end")).toBe(true);
    expect(root.hasAttribute("data-overflow-y-start")).toBe(false);

    viewport.scrollTop = 100;
    viewport.dispatchEvent(new Event("scroll"));
    await waitForLayout();

    expect(root.hasAttribute("data-overflow-y-start")).toBe(true);
    expect(root.style.getPropertyValue("--scroll-area-overflow-y-start")).not.toBe("");
    expect(thumb.style.transform).toContain("translateY");

    scrollbar.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 40 }),
    );

    expect(viewport.scrollTop).toBeGreaterThan(100);

    const beforeTrackClick = viewport.scrollTop;
    scrollbar.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientY: 90,
        isPrimary: true,
        pointerId: 1,
      }),
    );

    expect(viewport.scrollTop).toBeGreaterThan(beforeTrackClick);

    scrollArea.destroy();
    const afterDestroy = viewport.scrollTop;
    scrollbar.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 40 }),
    );

    expect(viewport.scrollTop).toBe(afterDestroy);
  });

  it("registers viewport scroll passively while keeping consumed wheel events cancelable", () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const viewportAddEventListener = vi.spyOn(viewport, "addEventListener");
    const scrollbarAddEventListener = vi.spyOn(scrollbar, "addEventListener");

    const scrollArea = createScrollArea(root);

    try {
      expect(viewportAddEventListener).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        expect.objectContaining({ passive: true, signal: expect.any(AbortSignal) }),
      );
      expect(scrollbarAddEventListener).toHaveBeenCalledWith(
        "wheel",
        expect.any(Function),
        expect.objectContaining({ passive: false, signal: expect.any(AbortSignal) }),
      );
    } finally {
      scrollArea.destroy();
      viewportAddEventListener.mockRestore();
      scrollbarAddEventListener.mockRestore();
    }
  });

  it("uses zero as the default overflow edge threshold", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);

    createScrollArea(root);
    await waitForLayout();

    viewport.scrollTop = 1;
    viewport.dispatchEvent(new Event("scroll"));
    await waitForLayout();

    expect(root.hasAttribute("data-overflow-y-start")).toBe(true);
  });

  it("supports sparse per-edge overflow edge thresholds", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);

    root.setAttribute("data-overflow-edge-threshold-y-start", "100");

    createScrollArea(root);
    await waitForLayout();

    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await waitForLayout();

    expect(root.hasAttribute("data-overflow-y-start")).toBe(false);
    expect(root.hasAttribute("data-overflow-y-end")).toBe(true);
  });

  it("preserves programmatic overflow edge threshold options across refreshes", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollArea = createScrollArea(root, { overflowEdgeThreshold: { yStart: 100 } });
    await waitForLayout();

    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await waitForLayout();

    expect(root.hasAttribute("data-overflow-y-start")).toBe(false);

    scrollArea.refresh();
    await waitForLayout();

    expect(root.hasAttribute("data-overflow-y-start")).toBe(false);

    const marker = document.createElement("span");
    marker.textContent = "mutation";
    root.append(marker);
    await waitForLayout();
    await waitForLayout();

    expect(root.hasAttribute("data-overflow-y-start")).toBe(false);
  });

  it("hides the scrollbar until content overflows", async () => {
    const root = renderScrollArea({ contentHeight: 50 });
    const viewport = getViewport(root);
    const content = getContent(root);
    const scrollbar = getScrollbar(root, "vertical");

    createScrollArea(root);
    await waitForLayout();

    expect(viewport.tabIndex).toBe(-1);
    expect(scrollbar.style.display).toBe("none");
    expect(root.hasAttribute("data-overflow-y-end")).toBe(false);

    content.style.height = "320px";
    await waitForLayout();
    await waitForLayout();

    expect(viewport.tabIndex).toBe(0);
    expect(scrollbar.style.display).toBe("flex");
    expect(root.hasAttribute("data-overflow-y-end")).toBe(true);
  });

  it("keeps keep-mounted scrollbars and thumbs visible without overflow", async () => {
    const root = renderScrollArea({ contentHeight: 50 });
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);
    scrollbar.setAttribute("data-keep-mounted", "");

    createScrollArea(root);
    await waitForLayout();

    expect(viewport.tabIndex).toBe(-1);
    expect(scrollbar.style.display).toBe("flex");
    expect(scrollbar.hidden).toBe(false);
    expect(thumb.hidden).toBe(false);
    expect(root.hasAttribute("data-has-overflow-y")).toBe(false);
    expect(root.hasAttribute("data-overflow-y-end")).toBe(false);
  });

  it("shows horizontal and vertical scrollbars with a measured corner", async () => {
    const root = renderScrollArea({
      contentHeight: 360,
      contentWidth: 420,
      horizontal: true,
      includeCorner: true,
    });
    const horizontalScrollbar = getScrollbar(root, "horizontal");
    const verticalScrollbar = getScrollbar(root, "vertical");
    const horizontalThumb = getThumb(horizontalScrollbar);
    const corner = root.querySelector<HTMLElement>("[data-sw-scroll-area-corner]")!;

    createScrollArea(root);
    await waitForLayout();

    expect(horizontalScrollbar.style.display).toBe("flex");
    expect(verticalScrollbar.style.display).toBe("flex");
    expect(corner.style.display).toBe("block");
    expect(corner.style.width).toBe(`${verticalScrollbar.offsetWidth}px`);
    expect(corner.style.height).toBe(`${horizontalScrollbar.offsetHeight}px`);
    expect(Number.parseFloat(horizontalThumb.style.width)).toBeGreaterThanOrEqual(20);
    expect(root.hasAttribute("data-overflow-x-end")).toBe(true);
    expect(root.hasAttribute("data-overflow-y-end")).toBe(true);
  });

  it("mirrors overflow state attributes and CSS variables across public parts", async () => {
    const root = renderScrollArea({
      contentHeight: 360,
      contentWidth: 420,
      horizontal: true,
      includeCorner: true,
    });
    const viewport = getViewport(root);
    const content = getContent(root);
    const horizontalScrollbar = getScrollbar(root, "horizontal");
    const verticalScrollbar = getScrollbar(root, "vertical");

    createScrollArea(root);
    await waitForLayout();

    for (const element of [root, viewport, content, horizontalScrollbar, verticalScrollbar]) {
      expect(element.hasAttribute("data-has-overflow-x")).toBe(true);
      expect(element.hasAttribute("data-has-overflow-y")).toBe(true);
    }

    expect(viewport.style.getPropertyValue("--scroll-area-overflow-x-end")).not.toBe("");
    expect(viewport.style.getPropertyValue("--scroll-area-overflow-y-end")).not.toBe("");
    expect(root.style.getPropertyValue("--scroll-area-overflow-x-end")).not.toBe("");
    expect(verticalScrollbar.style.getPropertyValue("--scroll-area-thumb-height")).not.toBe("");
    expect(horizontalScrollbar.style.getPropertyValue("--scroll-area-thumb-width")).not.toBe("");
    expect(root.style.getPropertyValue("--scroll-area-corner-width")).not.toBe("");
    expect(root.style.getPropertyValue("--scroll-area-corner-height")).not.toBe("");
  });

  it("mirrors scrolling state to the viewport, content, and matching axis parts", async () => {
    const root = renderScrollArea({
      contentHeight: 360,
      contentWidth: 420,
      horizontal: true,
    });
    const viewport = getViewport(root);
    const content = getContent(root);
    const horizontalScrollbar = getScrollbar(root, "horizontal");
    const verticalScrollbar = getScrollbar(root, "vertical");
    const horizontalThumb = getThumb(horizontalScrollbar);
    const verticalThumb = getThumb(verticalScrollbar);

    createScrollArea(root);
    await waitForLayout();

    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));

    for (const element of [root, viewport, content, verticalScrollbar, verticalThumb]) {
      expect(element.hasAttribute("data-scrolling")).toBe(true);
    }

    expect(horizontalScrollbar.hasAttribute("data-scrolling")).toBe(false);
    expect(horizontalThumb.hasAttribute("data-scrolling")).toBe(false);

    await waitForTimeout(150);

    for (const element of [
      root,
      viewport,
      content,
      verticalScrollbar,
      verticalThumb,
      horizontalScrollbar,
      horizontalThumb,
    ]) {
      expect(element.hasAttribute("data-scrolling")).toBe(false);
    }
  });

  it("mirrors hover state to scrollbars and thumbs", async () => {
    const root = renderScrollArea({ horizontal: true });
    const horizontalScrollbar = getScrollbar(root, "horizontal");
    const verticalScrollbar = getScrollbar(root, "vertical");
    const horizontalThumb = getThumb(horizontalScrollbar);
    const verticalThumb = getThumb(verticalScrollbar);

    createScrollArea(root);
    await waitForLayout();

    root.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));

    for (const element of [
      horizontalScrollbar,
      verticalScrollbar,
      horizontalThumb,
      verticalThumb,
    ]) {
      expect(element.hasAttribute("data-hovering")).toBe(true);
    }

    root.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));

    for (const element of [
      horizontalScrollbar,
      verticalScrollbar,
      horizontalThumb,
      verticalThumb,
    ]) {
      expect(element.hasAttribute("data-hovering")).toBe(false);
    }
  });

  it("discovers scrollbars, thumbs, and corners added after initialization", async () => {
    const root = renderScrollArea({
      contentHeight: 360,
      contentWidth: 420,
    });

    createScrollArea(root);
    await waitForLayout();

    const horizontalScrollbar = document.createElement("div");
    horizontalScrollbar.setAttribute("data-sw-scroll-area-scrollbar", "");
    horizontalScrollbar.setAttribute("data-orientation", "horizontal");
    horizontalScrollbar.style.cssText =
      "bottom: 0; display: flex; height: 10px; left: 0; padding: 1px; position: absolute; right: 0; width: 160px;";
    horizontalScrollbar.innerHTML = `<div data-sw-scroll-area-thumb style="height: 100%;"></div>`;

    const corner = document.createElement("div");
    corner.setAttribute("data-sw-scroll-area-corner", "");

    root.append(horizontalScrollbar, corner);
    await waitForLayout();
    await waitForLayout();

    expect(horizontalScrollbar.style.display).toBe("flex");
    expect(getThumb(horizontalScrollbar).style.width).not.toBe("");
    expect(corner.style.display).toBe("block");
  });

  it("coalesces repeated refresh and scroll updates into one animation frame", async () => {
    const root = renderScrollArea({ contentHeight: 50 });
    const viewport = getViewport(root);
    const content = getContent(root);
    const scrollbar = getScrollbar(root, "vertical");

    const scrollArea = createScrollArea(root);
    await waitForLayout();

    expect(scrollbar.style.display).toBe("none");

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const frames = new Map<number, FrameRequestCallback>();
    let frameId = 0;

    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      frameId += 1;
      frames.set(frameId, callback);
      return frameId;
    }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((id: number) => {
      frames.delete(id);
    }) as typeof window.cancelAnimationFrame;

    try {
      content.style.height = "420px";
      scrollArea.refresh();
      scrollArea.refresh();
      viewport.scrollTop = 80;
      viewport.dispatchEvent(new Event("scroll"));
      viewport.scrollTop = 120;
      viewport.dispatchEvent(new Event("scroll"));

      expect(frames.size).toBe(1);
      expect(scrollbar.style.display).toBe("none");

      const [[id, callback]] = frames.entries();
      frames.delete(id);
      callback(performance.now());
      await Promise.resolve();

      expect(scrollbar.style.display).toBe("flex");
      expect(root.hasAttribute("data-overflow-y-start")).toBe(true);
      expect(root.style.getPropertyValue("--scroll-area-overflow-y-start")).toBe("120px");
    } finally {
      restoreAnimationFrames(originalRequestAnimationFrame, originalCancelAnimationFrame);
      scrollArea.destroy();
    }
  });

  it("batches wheel updates and cancels pending work on destroy", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);

    const scrollArea = createScrollArea(root);
    await waitForLayout();

    const initialTransform = thumb.style.transform;
    const { frames, originalCancelAnimationFrame, originalRequestAnimationFrame } =
      mockAnimationFrames();

    try {
      scrollbar.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 40 }),
      );

      expect(viewport.scrollTop).toBeGreaterThan(0);
      expect(frames.size).toBe(1);
      expect(thumb.style.transform).toBe(initialTransform);

      scrollArea.destroy();

      expect(frames.size).toBe(0);
    } finally {
      restoreAnimationFrames(originalRequestAnimationFrame, originalCancelAnimationFrame);
      scrollArea.destroy();
    }
  });

  it("only prevents scrollbar wheel events when they are consumed", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");

    createScrollArea(root);
    await waitForLayout();

    viewport.scrollTop = 100;
    const consumedWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 40,
    });

    expect(scrollbar.dispatchEvent(consumedWheel)).toBe(false);
    expect(consumedWheel.defaultPrevented).toBe(true);
    expect(viewport.scrollTop).toBe(140);

    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
    const edgeWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 40,
    });

    expect(scrollbar.dispatchEvent(edgeWheel)).toBe(true);
    expect(edgeWheel.defaultPrevented).toBe(false);
    expect(viewport.scrollTop).toBe(viewport.scrollHeight - viewport.clientHeight);

    viewport.scrollTop = 100;
    const ctrlWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: 40,
    });

    expect(scrollbar.dispatchEvent(ctrlWheel)).toBe(true);
    expect(ctrlWheel.defaultPrevented).toBe(false);
    expect(viewport.scrollTop).toBe(100);
  });

  it("handles horizontal RTL wheel scrolling and clamps at both edges", async () => {
    const root = renderScrollArea({ contentHeight: 100, contentWidth: 420, horizontal: true });
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "horizontal");
    viewport.style.direction = "rtl";

    createScrollArea(root);
    await waitForLayout();

    expect(
      scrollbar.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: -50 }),
      ),
    ).toBe(false);
    expect(viewport.scrollLeft).toBe(-50);

    expect(
      scrollbar.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 100 }),
      ),
    ).toBe(false);
    expect(viewport.scrollLeft).toBe(0);

    expect(
      scrollbar.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: -500 }),
      ),
    ).toBe(false);
    expect(viewport.scrollLeft).toBe(-(viewport.scrollWidth - viewport.clientWidth));

    expect(
      scrollbar.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: -50 }),
      ),
    ).toBe(true);
    expect(viewport.scrollLeft).toBe(-(viewport.scrollWidth - viewport.clientWidth));
  });

  it("updates track pointer scrolling immediately without scheduling a frame", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);

    const scrollArea = createScrollArea(root);
    await waitForLayout();

    const initialTransform = thumb.style.transform;
    const { frames, originalCancelAnimationFrame, originalRequestAnimationFrame } =
      mockAnimationFrames();

    try {
      scrollbar.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientY: 90,
          isPrimary: true,
          pointerId: 1,
        }),
      );

      expect(viewport.scrollTop).toBeGreaterThan(0);
      expect(thumb.style.transform).not.toBe(initialTransform);
      expect(frames.size).toBe(0);
    } finally {
      restoreAnimationFrames(originalRequestAnimationFrame, originalCancelAnimationFrame);
      scrollArea.destroy();
    }
  });

  it("drags thumbs with document pointer movement and stops on pointer cancel", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);

    const scrollArea = createScrollArea(root);
    await waitForLayout();

    try {
      thumb.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientY: 0,
          isPrimary: true,
          pointerId: 1,
        }),
      );
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientY: 20,
          isPrimary: true,
          pointerId: 1,
        }),
      );

      expect(viewport.scrollTop).toBeGreaterThan(0);

      const scrollTopAfterMove = viewport.scrollTop;
      document.dispatchEvent(
        new PointerEvent("pointercancel", {
          bubbles: true,
          isPrimary: true,
          pointerId: 1,
        }),
      );
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientY: 80,
          isPrimary: true,
          pointerId: 1,
        }),
      );

      expect(viewport.scrollTop).toBe(scrollTopAfterMove);
    } finally {
      scrollArea.destroy();
    }
  });

  it("removes thumb drag document listeners when destroyed", async () => {
    const root = renderScrollArea();
    const viewport = getViewport(root);
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);

    const scrollArea = createScrollArea(root);
    await waitForLayout();

    thumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientY: 0,
        isPrimary: true,
        pointerId: 1,
      }),
    );
    scrollArea.destroy();
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 80,
        isPrimary: true,
        pointerId: 1,
      }),
    );

    expect(viewport.scrollTop).toBe(0);
  });

  it("requires a viewport element", () => {
    const root = document.createElement("div");
    root.setAttribute("data-sw-scroll-area", "");
    document.body.append(root);

    expect(() => createScrollArea(root)).toThrow("ScrollArea requires a viewport element.");
  });
});

function renderScrollArea({
  contentHeight = 400,
  contentWidth = 120,
  horizontal = false,
  includeCorner = false,
}: {
  contentHeight?: number;
  contentWidth?: number;
  horizontal?: boolean;
  includeCorner?: boolean;
} = {}): HTMLElement {
  const root = document.createElement("div");
  root.setAttribute("data-sw-scroll-area", "");
  root.style.position = "relative";
  root.style.width = "160px";
  root.style.height = "100px";
  root.innerHTML = `
    <div data-sw-scroll-area-viewport style="height: 100px; overflow: scroll; width: 160px;">
      <div data-sw-scroll-area-content style="height: ${contentHeight}px; width: ${contentWidth}px;">Scrollable content</div>
    </div>
    <div
      data-sw-scroll-area-scrollbar
      data-orientation="vertical"
      style="bottom: 0; display: flex; height: 100px; padding: 1px; position: absolute; right: 0; top: 0; width: 10px;"
    >
      <div data-sw-scroll-area-thumb style="width: 100%;"></div>
    </div>
    ${
      horizontal
        ? `
          <div
            data-sw-scroll-area-scrollbar
            data-orientation="horizontal"
            style="bottom: 0; display: flex; height: 10px; left: 0; padding: 1px; position: absolute; right: 0; width: 160px;"
          >
            <div data-sw-scroll-area-thumb style="height: 100%;"></div>
          </div>
        `
        : ""
    }
    ${includeCorner ? `<div data-sw-scroll-area-corner></div>` : ""}
  `;
  document.body.append(root);
  return root;
}

function getContent(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-scroll-area-content]")!;
}

function getViewport(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
}

function getScrollbar(root: HTMLElement, orientation: "horizontal" | "vertical"): HTMLElement {
  return root.querySelector<HTMLElement>(
    `[data-sw-scroll-area-scrollbar][data-orientation="${orientation}"]`,
  )!;
}

function getThumb(scrollbar: HTMLElement): HTMLElement {
  return scrollbar.querySelector<HTMLElement>("[data-sw-scroll-area-thumb]")!;
}

function mockAnimationFrames(): {
  frames: Map<number, FrameRequestCallback>;
  originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
  originalRequestAnimationFrame: typeof window.requestAnimationFrame;
} {
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;

  window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    frameId += 1;
    frames.set(frameId, callback);
    return frameId;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((id: number) => {
    frames.delete(id);
  }) as typeof window.cancelAnimationFrame;

  return {
    frames,
    originalCancelAnimationFrame,
    originalRequestAnimationFrame,
  };
}

function restoreAnimationFrames(
  originalRequestAnimationFrame: typeof window.requestAnimationFrame,
  originalCancelAnimationFrame: typeof window.cancelAnimationFrame,
): void {
  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
}

async function waitForLayout(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.resolve();
}

async function waitForTimeout(ms: number): Promise<void> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

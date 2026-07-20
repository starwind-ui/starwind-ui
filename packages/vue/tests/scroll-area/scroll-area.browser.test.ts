import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@starwind-ui/vue/scroll-area";

type ExposedElement<T extends HTMLElement> = ComponentPublicInstance & { element: T | null };

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Scroll Area public behavior", () => {
  it("forwards all six parts and delegates vertical, horizontal, pointer, wheel, and keyboard scrolling", async () => {
    const refs = createPartRefs();
    const host = mount(
      defineComponent({
        setup() {
          return () => scrollAreaTree({ refs });
        },
      }),
    );
    await waitForLayout();

    const root = host.querySelector<HTMLElement>("[data-sw-scroll-area]")!;
    const viewport = host.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
    const content = host.querySelector<HTMLElement>("[data-sw-scroll-area-content]")!;
    const vertical = getScrollbar(root, "vertical");
    const horizontal = getScrollbar(root, "horizontal");
    const verticalThumb = getThumb(vertical);
    const horizontalThumb = getThumb(horizontal);
    const corner = host.querySelector<HTMLElement>("[data-sw-scroll-area-corner]")!;

    expect(refs.root.value?.element).toBe(root);
    expect(refs.viewport.value?.element).toBe(viewport);
    expect(refs.content.value?.element).toBe(content);
    expect(refs.vertical.value?.element).toBe(vertical);
    expect(refs.horizontal.value?.element).toBe(horizontal);
    expect(refs.verticalThumb.value?.element).toBe(verticalThumb);
    expect(refs.horizontalThumb.value?.element).toBe(horizontalThumb);
    expect(refs.corner.value?.element).toBe(corner);
    expect(refs.root.value).not.toHaveProperty("instance");
    expect(root.className).toBe("scroll-root");
    expect(viewport.style.overflow).toBe("scroll");
    expect(viewport.tabIndex).toBe(0);
    expect(content.textContent).toContain("Scrollable content");
    expect(vertical.getAttribute("aria-hidden")).toBe("true");
    expect(horizontal.getAttribute("aria-hidden")).toBe("true");
    expect(vertical.style.display).toBe("flex");
    expect(horizontal.style.display).toBe("flex");
    expect(corner.style.display).toBe("block");
    expectThumbGeometry(viewport, vertical, verticalThumb, "vertical");
    expectThumbGeometry(viewport, horizontal, horizontalThumb, "horizontal");
    expect(root).toHaveAttribute("data-overflow-x-end");
    expect(root).toHaveAttribute("data-overflow-y-end");

    viewport.scrollTop = 80;
    viewport.scrollLeft = 90;
    viewport.dispatchEvent(new Event("scroll"));
    await waitForLayout();
    expect(root).toHaveAttribute("data-overflow-x-start");
    expect(root).toHaveAttribute("data-overflow-y-start");
    expect(verticalThumb.style.transform).toContain("translateY");
    expect(horizontalThumb.style.transform).toContain("translateX");

    const beforeWheel = viewport.scrollTop;
    vertical.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 30 }),
    );
    expect(viewport.scrollTop).toBeGreaterThan(beforeWheel);

    const beforeTrack = viewport.scrollTop;
    vertical.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientY: 95,
        isPrimary: true,
        pointerId: 1,
      }),
    );
    expect(viewport.scrollTop).toBeGreaterThan(beforeTrack);

    viewport.scrollTop = 0;
    viewport.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitForLayout();
    expect(document.activeElement).toBe(viewport);
    expect(viewport.scrollTop).toBeGreaterThan(0);
  });

  it("releases an active thumb drag and every owned resource when unmounted", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const mutationDisconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const resizeDisconnect = vi.spyOn(ResizeObserver.prototype, "disconnect");
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({ render: () => scrollAreaTree({ horizontal: false }) });
    app.mount(host);
    await waitForLayout();

    const root = host.querySelector<HTMLElement>("[data-sw-scroll-area]")!;
    const viewport = root.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
    const scrollbar = getScrollbar(root, "vertical");
    const thumb = getThumb(scrollbar);
    const trackSize = getTrackSize(scrollbar, "vertical");
    const thumbSize = Number.parseFloat(thumb.style.height);
    const maxThumbOffset = trackSize - thumbSize;
    const maxScrollOffset = viewport.scrollHeight - viewport.clientHeight;
    const startPointerY = 10;
    const movedPointerY = 50;

    thumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientY: startPointerY,
        isPrimary: true,
        pointerId: 41,
        pointerType: "mouse",
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        buttons: 1,
        clientY: movedPointerY,
        isPrimary: true,
        pointerId: 41,
        pointerType: "mouse",
      }),
    );
    await waitForLayout();

    const expectedScrollTop = ((movedPointerY - startPointerY) / maxThumbOffset) * maxScrollOffset;
    expect(viewport.scrollTop).toBeCloseTo(expectedScrollTop, 4);
    expect(viewport.scrollTop).toBeGreaterThan(0);

    app.unmount();
    const scrollTopAfterUnmount = viewport.scrollTop;
    expect(root.isConnected).toBe(false);
    expect(abort).toHaveBeenCalledTimes(2);
    expect(mutationDisconnect).toHaveBeenCalledTimes(1);
    expect(resizeDisconnect).toHaveBeenCalledTimes(1);

    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        buttons: 1,
        clientY: 90,
        isPrimary: true,
        pointerId: 41,
        pointerType: "mouse",
      }),
    );
    expect(viewport.scrollTop).toBe(scrollTopAfterUnmount);
    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("refreshes after threshold, resize, and Vue-owned structural changes while isolating instances", async () => {
    const threshold = ref(100);
    const contentHeight = ref(50);
    const horizontal = ref(false);
    const host = mount(
      defineComponent({
        setup() {
          return () =>
            h("main", null, [
              scrollAreaTree({
                contentHeight: contentHeight.value,
                horizontal: horizontal.value,
                id: "dynamic",
                overflowEdgeThreshold: { yStart: threshold.value },
              }),
              scrollAreaTree({ horizontal: false, id: "isolated", keepMounted: true }),
            ]);
        },
      }),
    );
    await waitForLayout();

    const dynamic = host.querySelector<HTMLElement>("#dynamic")!;
    const isolated = host.querySelector<HTMLElement>("#isolated")!;
    const viewport = dynamic.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
    const vertical = getScrollbar(dynamic, "vertical");
    expect(viewport.tabIndex).toBe(-1);
    expect(vertical.style.display).toBe("none");
    expect(getScrollbar(isolated, "vertical").style.display).toBe("flex");

    contentHeight.value = 360;
    await nextTick();
    await waitForLayout();
    expect(viewport.tabIndex).toBe(0);
    expect(vertical.style.display).toBe("flex");

    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await waitForLayout();
    expect(dynamic).not.toHaveAttribute("data-overflow-y-start");

    threshold.value = 20;
    await nextTick();
    await waitForLayout();
    expect(dynamic).toHaveAttribute("data-overflow-y-start");
    expect(dynamic).toHaveAttribute("data-overflow-edge-threshold-y-start", "20");

    horizontal.value = true;
    await nextTick();
    await waitForLayout();
    expect(getScrollbar(dynamic, "horizontal").style.display).toBe("flex");
    expect(dynamic.querySelector<HTMLElement>("[data-sw-scroll-area-corner]")?.style.display).toBe(
      "block",
    );
    expect(isolated).not.toHaveAttribute("data-overflow-x-end");
  });

  it("hydrates without warnings or duplicate anatomy and releases observers, listeners, and refs", async () => {
    const tree = () => scrollAreaTree({ id: "hydrated-scroll-area" });
    const html = await renderToString(createSSRApp({ render: tree }));
    expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain("data-has-overflow");

    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const warnings: string[] = [];
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const mutationDisconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const resizeDisconnect = vi.spyOn(ResizeObserver.prototype, "disconnect");
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    await waitForLayout();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-scroll-area")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-scroll-area-viewport]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-scroll-area-content]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-scroll-area-scrollbar]")).toHaveLength(2);
    expect(host.querySelectorAll("[data-sw-scroll-area-thumb]")).toHaveLength(2);
    expect(host.querySelectorAll("[data-sw-scroll-area-corner]")).toHaveLength(1);

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(mutationDisconnect).toHaveBeenCalledTimes(1);
    expect(resizeDisconnect).toHaveBeenCalledTimes(1);
    expect(host.children).toHaveLength(0);

    const remountRefs = createPartRefs();
    const remount = createApp({ render: () => scrollAreaTree({ refs: remountRefs }) });
    remount.mount(host);
    await waitForLayout();
    expect(remountRefs.root.value?.element).toBeInstanceOf(HTMLDivElement);
    remount.unmount();
    expect(Object.values(remountRefs).every((partRef) => partRef.value === null)).toBe(true);
    expect(abort).toHaveBeenCalledTimes(2);
    expect(mutationDisconnect).toHaveBeenCalledTimes(2);
    expect(resizeDisconnect).toHaveBeenCalledTimes(2);
  });
});

function createPartRefs() {
  return {
    content: ref<ExposedElement<HTMLDivElement> | null>(null),
    corner: ref<ExposedElement<HTMLDivElement> | null>(null),
    horizontal: ref<ExposedElement<HTMLDivElement> | null>(null),
    horizontalThumb: ref<ExposedElement<HTMLDivElement> | null>(null),
    root: ref<ExposedElement<HTMLDivElement> | null>(null),
    vertical: ref<ExposedElement<HTMLDivElement> | null>(null),
    verticalThumb: ref<ExposedElement<HTMLDivElement> | null>(null),
    viewport: ref<ExposedElement<HTMLDivElement> | null>(null),
  };
}

function scrollAreaTree(
  options: {
    contentHeight?: number;
    horizontal?: boolean;
    id?: string;
    keepMounted?: boolean;
    overflowEdgeThreshold?: number | Partial<Record<"xEnd" | "xStart" | "yEnd" | "yStart", number>>;
    refs?: ReturnType<typeof createPartRefs>;
  } = {},
) {
  const refs = options.refs;
  const horizontal = options.horizontal ?? true;
  return h(
    ScrollAreaRoot,
    {
      class: "scroll-root",
      id: options.id,
      overflowEdgeThreshold: options.overflowEdgeThreshold,
      ref: refs?.root,
      style: { height: "100px", position: "relative", width: "160px" },
    },
    {
      default: () => [
        h(
          ScrollAreaViewport,
          {
            ref: refs?.viewport,
            style: { height: "100px", overflow: "hidden", width: "160px" },
          },
          {
            default: () =>
              h(
                ScrollAreaContent,
                {
                  ref: refs?.content,
                  style: {
                    height: `${options.contentHeight ?? 360}px`,
                    width: horizontal ? "420px" : "120px",
                  },
                },
                { default: () => "Scrollable content" },
              ),
          },
        ),
        h(
          ScrollAreaScrollbar,
          {
            keepMounted: options.keepMounted,
            ref: refs?.vertical,
            style: {
              height: "100px",
              padding: "1px",
              position: "absolute",
              right: "0",
              top: "0",
              width: "10px",
            },
          },
          {
            default: () =>
              h(ScrollAreaThumb, {
                ref: refs?.verticalThumb,
                style: { width: "100%" },
              }),
          },
        ),
        ...(horizontal
          ? [
              h(
                ScrollAreaScrollbar,
                {
                  orientation: "horizontal",
                  ref: refs?.horizontal,
                  style: {
                    bottom: "0",
                    height: "10px",
                    left: "0",
                    padding: "1px",
                    position: "absolute",
                    width: "160px",
                  },
                },
                {
                  default: () =>
                    h(ScrollAreaThumb, {
                      ref: refs?.horizontalThumb,
                      style: { height: "100%" },
                    }),
                },
              ),
              h(ScrollAreaCorner, { ref: refs?.corner }),
            ]
          : []),
      ],
    },
  );
}

function getScrollbar(root: HTMLElement, orientation: "horizontal" | "vertical"): HTMLElement {
  return root.querySelector<HTMLElement>(
    `[data-sw-scroll-area-scrollbar][data-orientation="${orientation}"]`,
  )!;
}

function getThumb(scrollbar: HTMLElement): HTMLElement {
  return scrollbar.querySelector<HTMLElement>("[data-sw-scroll-area-thumb]")!;
}

function expectThumbGeometry(
  viewport: HTMLElement,
  scrollbar: HTMLElement,
  thumb: HTMLElement,
  orientation: "horizontal" | "vertical",
): void {
  const viewportSize = orientation === "horizontal" ? viewport.clientWidth : viewport.clientHeight;
  const scrollSize = orientation === "horizontal" ? viewport.scrollWidth : viewport.scrollHeight;
  const trackSize = getTrackSize(scrollbar, orientation);
  const thumbSize = Number.parseFloat(
    orientation === "horizontal" ? thumb.style.width : thumb.style.height,
  );
  const expectedThumbSize = Math.min(
    Math.max((viewportSize / scrollSize) * trackSize, 20),
    trackSize,
  );

  expect(thumbSize).toBeCloseTo(expectedThumbSize, 4);
  expect(thumbSize / trackSize).toBeCloseTo(viewportSize / scrollSize, 6);
}

function getTrackSize(scrollbar: HTMLElement, orientation: "horizontal" | "vertical"): number {
  const styles = getComputedStyle(scrollbar);
  if (orientation === "horizontal") {
    return (
      scrollbar.clientWidth -
      Number.parseFloat(styles.paddingInlineStart) -
      Number.parseFloat(styles.paddingInlineEnd)
    );
  }

  return (
    scrollbar.clientHeight -
    Number.parseFloat(styles.paddingBlockStart) -
    Number.parseFloat(styles.paddingBlockEnd)
  );
}

function mount(component: ReturnType<typeof defineComponent>): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp(component);
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

async function waitForLayout(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

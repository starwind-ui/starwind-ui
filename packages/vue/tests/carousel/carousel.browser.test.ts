import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CarouselInstance, CarouselOptions } from "@starwind-ui/runtime/carousel";
import {
  CarouselContainer,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  CarouselViewport,
} from "@starwind-ui/vue/carousel";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Carousel public behavior", () => {
  it("hydrates once without warnings and releases the hydrated engine", async () => {
    const plugin = createPlugin("hydration");
    const setApi = vi.fn<(api: CarouselInstance["api"]) => void>();
    const slides = ref(["one", "two", "three"]);
    const tree = () => carouselTree({ plugins: [plugin], setApi }, slides);
    const html = await renderToString(createSSRApp({ render: tree }));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-carousel]")).toHaveLength(1);
    expect(setApi).toHaveBeenCalledTimes(1);
    expect(plugin.init).toHaveBeenCalledTimes(1);

    host.querySelector<HTMLButtonElement>("[data-sw-carousel-next]")!.click();
    await settle();
    expect(setApi.mock.calls[0]![0].selectedScrollSnap()).toBe(1);

    app.unmount();
    cleanups.pop();
    expect(plugin.destroy).toHaveBeenCalledTimes(1);
    expect(host.children).toHaveLength(0);
  });

  it("delivers the API and refreshes options, plugins, orientation, and dynamic slides", async () => {
    const orientation = ref<"horizontal" | "vertical">("horizontal");
    const slides = ref(["one", "two"]);
    const firstPlugin = createPlugin("first");
    const secondPlugin = createPlugin("second");
    const plugins = ref<CarouselPlugin[]>([firstPlugin]);
    const opts = ref({ align: "start" as const, duration: 1, loop: false });
    const setApi = vi.fn<(api: CarouselInstance["api"]) => void>();
    const host = mountCarousel(
      () => ({
        opts: opts.value,
        orientation: orientation.value,
        plugins: plugins.value,
        setApi,
      }),
      slides,
    );
    await settle();

    const root = host.querySelector<HTMLElement>("[data-sw-carousel]")!;
    expect(setApi).toHaveBeenCalledTimes(1);
    const api = setApi.mock.calls[0]![0];
    const reInit = vi.spyOn(api, "reInit");
    expect(firstPlugin.init).toHaveBeenCalledTimes(1);
    expect(root.getAttribute("data-axis")).toBe("x");
    expect(host.querySelectorAll("[data-sw-carousel-item]")).toHaveLength(2);

    slides.value.push("three");
    orientation.value = "vertical";
    opts.value = { align: "start", duration: 1, loop: true };
    plugins.value = [secondPlugin];
    await settle();

    expect(host.querySelectorAll("[data-sw-carousel-item]")).toHaveLength(3);
    expect(root.getAttribute("data-axis")).toBe("y");
    expect(reInit).toHaveBeenCalled();
    expect(setApi).toHaveBeenCalledTimes(1);
    expect(setApi.mock.calls[0]![0]).toBe(api);
    expect(secondPlugin.init).toHaveBeenCalled();
    expect(firstPlugin.destroy).toHaveBeenCalled();
  });

  it("keeps controls, keyboard input, selection, and instances isolated", async () => {
    const firstApi = vi.fn<(api: CarouselInstance["api"]) => void>();
    const secondApi = vi.fn<(api: CarouselInstance["api"]) => void>();
    const first = mountCarousel(() => ({
      opts: { align: "start", duration: 1 },
      setApi: firstApi,
    }));
    const second = mountCarousel(() => ({
      opts: { align: "start", duration: 1 },
      setApi: secondApi,
    }));
    await settle();

    first.querySelector<HTMLButtonElement>("[data-sw-carousel-next]")!.click();
    await settle();
    expect(firstApi.mock.calls[0]![0].selectedScrollSnap()).toBe(1);
    expect(secondApi.mock.calls[0]![0].selectedScrollSnap()).toBe(0);

    const root = first.querySelector<HTMLElement>("[data-sw-carousel]")!;
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowLeft",
    });
    root.dispatchEvent(event);
    await settle();
    expect(event.defaultPrevented).toBe(true);
    expect(firstApi.mock.calls[0]![0].selectedScrollSnap()).toBe(0);
  });

  it("supports pointer dragging through the generated viewport and items", async () => {
    const setApi = vi.fn<(api: CarouselInstance["api"]) => void>();
    const host = mountCarousel(() => ({ opts: { align: "start", duration: 1 }, setApi }));
    await settle();
    const viewport = host.querySelector<HTMLElement>("[data-sw-carousel-viewport]")!;

    viewport.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientX: 260,
        clientY: 40,
      }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        buttons: 1,
        clientX: 20,
        clientY: 40,
      }),
    );
    document.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        button: 0,
        buttons: 0,
        clientX: 20,
        clientY: 40,
      }),
    );
    await settle();

    expect(setApi.mock.calls[0]![0].selectedScrollSnap()).toBeGreaterThan(0);
  });

  it("remeasures changed geometry and keeps API navigation current", async () => {
    const itemWidth = ref(300);
    const setApi = vi.fn<(api: CarouselInstance["api"]) => void>();
    mountCarouselApp(
      () => ({ opts: { align: "start", containScroll: false, duration: 1 }, setApi }),
      ref(["one", "two", "three"]),
      itemWidth,
    );
    await settle();
    const api = setApi.mock.calls[0]![0];
    const initialWidth = api.internalEngine().slideRects[0]!.width;

    itemWidth.value = 120;
    await settle();
    const measuredWidth = api.internalEngine().slideRects[0]!.width;
    const measuredSnaps = api.scrollSnapList();

    expect(measuredWidth).toBeLessThan(initialWidth);
    api.scrollTo(measuredSnaps.length - 1, true);
    await settle();
    expect(api.selectedScrollSnap()).toBe(measuredSnaps.length - 1);
  });

  it("destroys each owned engine across unmount and remount", async () => {
    const plugin = createPlugin("cleanup");
    const mounted = mountCarouselApp(() => ({ plugins: [plugin] }));
    await settle();
    mounted.app.unmount();
    cleanups.pop();
    expect(plugin.destroy).toHaveBeenCalledTimes(1);

    const remounted = mountCarouselApp(() => ({ plugins: [plugin] }));
    await settle();
    expect(plugin.init).toHaveBeenCalledTimes(2);
    remounted.app.unmount();
    cleanups.pop();
    expect(plugin.destroy).toHaveBeenCalledTimes(2);
  });
});

function mountCarousel(
  props: () => Record<string, unknown>,
  slides = ref(["one", "two", "three"]),
): HTMLDivElement {
  return mountCarouselApp(props, slides).host;
}

function mountCarouselApp(
  props: () => Record<string, unknown>,
  slides = ref(["one", "two", "three"]),
  itemWidth = ref(300),
) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    render: () => carouselTree(props(), slides, itemWidth),
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return { app, host };
}

function carouselTree(
  props: Record<string, unknown>,
  slides: { value: string[] },
  itemWidth: { value: number } = ref(300),
) {
  return h(CarouselRoot, { ...props, style: "width: 300px" }, () => [
    h(CarouselViewport, { style: "overflow: hidden; width: 300px" }, () =>
      h(CarouselContainer, { style: "display: flex" }, () =>
        slides.value.map((slide) =>
          h(
            CarouselItem,
            { key: slide, style: `flex: 0 0 ${itemWidth.value}px; min-width: 0` },
            () => slide,
          ),
        ),
      ),
    ),
    h(CarouselPrevious, null, () => "Previous"),
    h(CarouselNext, null, () => "Next"),
  ]);
}

type CarouselPlugin = NonNullable<CarouselOptions["plugins"]>[number];

function createPlugin(name: string): CarouselPlugin {
  return { destroy: vi.fn(), init: vi.fn(), name, options: {} };
}

async function settle(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}

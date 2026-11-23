import type { EmblaPluginType } from "embla-carousel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCarousel } from "../../../src/components/carousel/carousel";
import { initStarwind } from "../../../src/init-starwind";

describe("createCarousel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes Embla on the viewport and wires carousel semantics", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    const setApi = vi.fn();

    const carousel = createCarousel(root, { setApi });
    await waitForCarousel();

    expect(carousel.root).toBe(root);
    expect(carousel.viewport).toBe(getViewport());
    expect(root.getAttribute("role")).toBe("region");
    expect(root.getAttribute("aria-roledescription")).toBe("carousel");
    expect(root.getAttribute("data-axis")).toBe("x");
    expect(getPrevious().disabled).toBe(true);
    expect(getPrevious().getAttribute("aria-disabled")).toBe("true");
    expect(getNext().disabled).toBe(false);
    expect(getNext().getAttribute("aria-disabled")).toBe("false");
    expect(setApi).toHaveBeenCalledWith(carousel.api);
    expect(carousel.selectedSnap()).toBe(0);
  });

  it("returns existing instances without reinitializing callbacks", async () => {
    const root = renderCarousel({ opts: { duration: 1 } });
    const firstSetApi = vi.fn();
    const secondSetApi = vi.fn();

    const carousel = createCarousel(root, { setApi: firstSetApi });
    const second = createCarousel(root, { setApi: secondSetApi });
    await waitForCarousel();

    expect(second).toBe(carousel);
    expect(firstSetApi).toHaveBeenCalledWith(carousel.api);
    expect(secondSetApi).not.toHaveBeenCalled();
  });

  it("preserves caller-provided root semantics", () => {
    const root = renderCarousel();
    root.setAttribute("role", "group");
    root.setAttribute("aria-roledescription", "featured slides");

    createCarousel(root);

    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("aria-roledescription")).toBe("featured slides");
  });

  it("ignores invalid data options and falls back to defaults", async () => {
    const root = renderCarousel();
    root.setAttribute("data-opts", "{not-json");

    const carousel = createCarousel(root);
    await waitForCarousel();

    expect(root.getAttribute("data-axis")).toBe("x");
    expect(carousel.selectedSnap()).toBe(0);
    expect(getPrevious().disabled).toBe(true);
    expect(getNext().disabled).toBe(false);
  });

  it("requires a viewport element", () => {
    const root = document.createElement("div");
    root.setAttribute("data-sw-carousel", "");
    document.body.append(root);

    expect(() => createCarousel(root)).toThrow(
      "Carousel requires a [data-sw-carousel-viewport] element.",
    );
  });

  it("does not bind controls owned by nested carousels", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    const firstItem = root.querySelector<HTMLElement>("[data-sw-carousel-item]");
    firstItem!.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-carousel>
          <div data-sw-carousel-viewport>
            <div data-sw-carousel-container>
              <div data-sw-carousel-item>Nested 1</div>
              <div data-sw-carousel-item>Nested 2</div>
            </div>
          </div>
          <button data-sw-carousel-previous type="button">Nested previous</button>
          <button data-sw-carousel-next type="button">Nested next</button>
        </div>
      `,
    );

    const carousel = createCarousel(root);
    const outerNext = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-sw-carousel-next]"),
    ).find((button) => button.closest("[data-sw-carousel]") === root)!;
    await waitForCarousel();

    root.querySelector<HTMLButtonElement>("[data-sw-carousel] [data-sw-carousel-next]")!.click();
    await waitForCarousel();

    expect(carousel.selectedSnap()).toBe(0);
    expect(outerNext.disabled).toBe(false);
  });

  it("supports carousels without previous and next controls", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    getPrevious().remove();
    getNext().remove();

    const carousel = createCarousel(root);
    const scrollNext = vi.spyOn(carousel.api, "scrollNext");
    await waitForCarousel();

    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowRight",
    });
    root.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(scrollNext).toHaveBeenCalledTimes(1);
  });

  it("scrolls with previous and next controls while updating disabled state", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    const carousel = createCarousel(root);
    await waitForCarousel();

    getNext().click();
    await waitForCarousel();

    expect(carousel.selectedSnap()).toBe(1);
    expect(getPrevious().disabled).toBe(false);

    getPrevious().click();
    await waitForCarousel();

    expect(carousel.selectedSnap()).toBe(0);
    expect(getPrevious().disabled).toBe(true);
  });

  it("marks the next control disabled at the last snap", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    const carousel = createCarousel(root);
    await waitForCarousel();

    carousel.scrollTo(2, true);
    await waitForCarousel();

    expect(carousel.selectedSnap()).toBe(2);
    expect(getNext().disabled).toBe(true);
    expect(getNext().getAttribute("aria-disabled")).toBe("true");
    expect(getNext().hasAttribute("data-disabled")).toBe(true);
  });

  it("uses orientation-specific keyboard navigation", async () => {
    const horizontalRoot = renderCarousel({ id: "horizontal-carousel", opts: { duration: 1 } });
    const horizontal = createCarousel(horizontalRoot);
    const verticalRoot = renderCarousel({
      axis: "y",
      id: "vertical-carousel",
      opts: { containScroll: false, duration: 1 },
    });
    const vertical = createCarousel(verticalRoot);
    await waitForCarousel();

    horizontalRoot.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    verticalRoot.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    await waitForCarousel();

    expect(horizontal.selectedSnap()).toBe(1);
    expect(vertical.selectedSnap()).toBe(1);

    horizontalRoot.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    verticalRoot.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));
    await waitForCarousel();

    expect(horizontal.selectedSnap()).toBe(0);
    expect(vertical.selectedSnap()).toBe(0);
  });

  it("reinitializes public options and keeps keyboard navigation in sync with the axis", async () => {
    const root = renderCarousel({ opts: { duration: 1 } });
    const carousel = createCarousel(root);
    await waitForCarousel();

    const ignoredVerticalEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowDown",
    });
    root.dispatchEvent(ignoredVerticalEvent);

    expect(ignoredVerticalEvent.defaultPrevented).toBe(false);

    carousel.reInit({ axis: "y", duration: 1 });

    expect(root.getAttribute("data-axis")).toBe("y");

    const scrollNext = vi.spyOn(carousel.api, "scrollNext");
    const verticalEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowDown",
    });
    root.dispatchEvent(verticalEvent);

    expect(verticalEvent.defaultPrevented).toBe(true);
    expect(scrollNext).toHaveBeenCalledTimes(1);
  });

  it("reads data options and supports looped carousels", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1, loop: true } });
    const carousel = createCarousel(root);
    await waitForCarousel();

    expect(carousel.canScrollPrev()).toBe(true);
    expect(carousel.canScrollNext()).toBe(true);
    expect(getPrevious().disabled).toBe(false);

    getPrevious().click();
    await waitForCarousel();

    expect(carousel.selectedSnap()).toBe(2);
  });

  it("passes plugin escape hatches to Embla and cleans them up", async () => {
    const root = renderCarousel();
    const plugin = createTestPlugin();

    const carousel = createCarousel(root, { plugins: [plugin] });
    await waitForCarousel();

    expect(plugin.init).toHaveBeenCalledWith(carousel.api, expect.any(Object));

    carousel.destroy();

    expect(plugin.destroy).toHaveBeenCalledTimes(1);
  });

  it("removes control and keyboard listeners when destroyed", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    const carousel = createCarousel(root);
    await waitForCarousel();

    const activeClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(getNext().dispatchEvent(activeClick)).toBe(false);
    expect(activeClick.defaultPrevented).toBe(true);

    carousel.destroy();

    const afterDestroyClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(getNext().dispatchEvent(afterDestroyClick)).toBe(true);
    expect(afterDestroyClick.defaultPrevented).toBe(false);

    const afterDestroyKey = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowRight",
    });
    root.dispatchEvent(afterDestroyKey);

    expect(afterDestroyKey.defaultPrevented).toBe(false);
  });

  it("initializes raw HTML carousels through initStarwind", async () => {
    renderCarousel({ opts: { duration: 1 } });

    const cleanup = initStarwind(document);
    await waitForCarousel();

    expect(getPrevious().disabled).toBe(true);
    expect(getNext().disabled).toBe(false);

    cleanup.destroy();
  });

  it("lets raw HTML carousels opt out of initStarwind for imperative plugin setup", async () => {
    const root = renderCarousel({ opts: { duration: 1 } });
    root.setAttribute("data-auto-init", "false");

    const cleanup = initStarwind(document);
    await waitForCarousel();

    expect(getPrevious().hasAttribute("aria-disabled")).toBe(false);

    cleanup.destroy();
  });

  it("does not let global init steal React-owned carousel constructor options", async () => {
    const root = renderCarousel({ opts: { duration: 1 } });
    root.setAttribute("data-auto-init", "false");
    const plugin = createTestPlugin();
    const setApi = vi.fn();

    const cleanup = initStarwind(document);
    const carousel = createCarousel(root, { plugins: [plugin], setApi });
    await waitForCarousel();

    expect(setApi).toHaveBeenCalledWith(carousel.api);
    expect(plugin.init).toHaveBeenCalledWith(carousel.api, expect.any(Object));
    expect(getPrevious().disabled).toBe(true);
    expect(getNext().disabled).toBe(false);

    carousel.destroy();
    cleanup.destroy();
  });

  it("infers RTL engine direction and aligns keys with physical slide flow", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    root.dir = "rtl";
    const carousel = createCarousel(root);
    await waitForCarousel();

    expect(carousel.api.internalEngine().options.direction).toBe("rtl");
    const slides = root.querySelectorAll<HTMLElement>("[data-sw-carousel-item]");
    expect(slides[0]!.getBoundingClientRect().left).toBeGreaterThan(
      slides[1]!.getBoundingClientRect().left,
    );
    carousel.scrollTo(1, true);
    await waitForCarousel();
    const firstX = slides[0]!.getBoundingClientRect().left;

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await waitForCarousel();
    expect(carousel.selectedSnap()).toBe(0);
    expect(slides[0]!.getBoundingClientRect().left).toBeLessThan(firstX);

    carousel.scrollTo(1, true);
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    await waitForCarousel();
    expect(carousel.selectedSnap()).toBe(2);
  });

  it("keeps the snap, plugins and one select notification after repeated inferred flips", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    const plugin = createTestPlugin();
    const carousel = createCarousel(root, { plugins: [plugin] });
    const reInit = vi.spyOn(carousel.api, "reInit");
    const select = vi.fn();
    carousel.api.on("select", select);
    await waitForCarousel();
    carousel.scrollTo(1, true);
    await waitForCarousel();
    select.mockClear();

    for (const direction of ["rtl", "ltr", "rtl"] as const) {
      root.dir = direction;
      document.dispatchEvent(new Event("starwind:direction-change"));
      await waitForCarousel();
      expect(carousel.api.internalEngine().options.direction).toBe(direction);
      expect(carousel.selectedSnap()).toBe(1);
    }
    expect(reInit).toHaveBeenCalledTimes(3);
    expect(plugin.init).toHaveBeenCalledTimes(4);
    expect(select).not.toHaveBeenCalled();

    getNext().click();
    await waitForCarousel();
    expect(carousel.selectedSnap()).toBe(2);
    expect(select).toHaveBeenCalledTimes(1);
    carousel.destroy();
    root.dir = "ltr";
    document.dispatchEvent(new Event("starwind:direction-change"));
    await waitForCarousel();
    expect(reInit).toHaveBeenCalledTimes(3);
  });

  it("rebinds inferred direction after reparenting", async () => {
    const ltr = document.createElement("div");
    const rtl = document.createElement("div");
    ltr.dir = "ltr";
    rtl.dir = "rtl";
    document.body.append(ltr, rtl);
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    ltr.append(root);
    const carousel = createCarousel(root);
    await waitForCarousel();
    carousel.scrollTo(1, true);

    rtl.append(root);
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");
    document.dispatchEvent(new Event("starwind:direction-change"));
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("rtl");
    expect(carousel.selectedSnap()).toBe(1);
    ltr.append(root);
    // Embla owns the drag, so a pointerdown reads direction before the engine sees it.
    root.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");
    expect(carousel.selectedSnap()).toBe(1);
  });

  it("reads direction before control clicks and public scrolls after a dir change with no event", async () => {
    const host = document.createElement("div");
    host.dir = "ltr";
    document.body.append(host);
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    host.append(root);
    const carousel = createCarousel(root);
    await waitForCarousel();
    const slides = root.querySelectorAll<HTMLElement>("[data-sw-carousel-item]");
    // The root keeps a fixed width, so it moves to the inline start of the host when `dir` flips.
    const viewport = () => getViewport().getBoundingClientRect();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");

    host.dir = "rtl";
    carousel.scrollNext(true);
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("rtl");
    expect(carousel.selectedSnap()).toBe(1);
    expect(slides[1]!.getBoundingClientRect().right).toBeCloseTo(viewport().right, 0);

    host.dir = "ltr";
    getNext().click();
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");
    expect(carousel.selectedSnap()).toBe(2);
    await vi.waitFor(() =>
      expect(slides[2]!.getBoundingClientRect().left).toBeCloseTo(viewport().left, 0),
    );

    host.dir = "rtl";
    getPrevious().click();
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("rtl");
    expect(carousel.selectedSnap()).toBe(1);
    await vi.waitFor(() =>
      expect(slides[1]!.getBoundingClientRect().right).toBeCloseTo(viewport().right, 0),
    );
    carousel.destroy();
  });

  it("scrolls once per LTR control click with no reInit and no dir change", async () => {
    const host = document.createElement("div");
    host.dir = "ltr";
    document.body.append(host);
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    host.append(root);
    const carousel = createCarousel(root);
    await waitForCarousel();
    const reInitCall = vi.spyOn(carousel.api, "reInit");
    const reInit = vi.fn();
    const select = vi.fn();
    carousel.api.on("reInit", reInit);
    carousel.api.on("select", select);
    const controls = () => ({
      canNext: carousel.api.canScrollNext(),
      canPrevious: carousel.api.canScrollPrev(),
      next: getNext().disabled,
      previous: getPrevious().disabled,
      snap: carousel.selectedSnap(),
    });
    expect(controls()).toEqual({
      canNext: true,
      canPrevious: false,
      next: false,
      previous: true,
      snap: 0,
    });

    const steps = [
      { control: getNext, snap: 1, next: false, previous: false },
      { control: getNext, snap: 2, next: true, previous: false },
      { control: getPrevious, snap: 1, next: false, previous: false },
      { control: getPrevious, snap: 0, next: false, previous: true },
    ];
    for (const step of steps) {
      select.mockClear();
      step.control().click();
      expect(select).toHaveBeenCalledTimes(1);
      await waitForCarousel();
      expect(select).toHaveBeenCalledTimes(1);
      expect(controls()).toEqual({
        canNext: !step.next,
        canPrevious: !step.previous,
        next: step.next,
        previous: step.previous,
        snap: step.snap,
      });
    }

    // At the first snap, Previous is disabled and a click does nothing.
    select.mockClear();
    getPrevious().click();
    await waitForCarousel();
    expect(select).not.toHaveBeenCalled();
    expect(carousel.selectedSnap()).toBe(0);

    carousel.scrollTo(2, true);
    await waitForCarousel();
    expect(getNext().disabled).toBe(true);
    select.mockClear();
    getNext().click();
    await waitForCarousel();
    expect(select).not.toHaveBeenCalled();
    expect(carousel.selectedSnap()).toBe(2);

    expect(reInitCall).not.toHaveBeenCalled();
    expect(reInit).not.toHaveBeenCalled();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");
    carousel.destroy();
  });

  it("keeps explicit options ahead of serialized options and supports later reInit", async () => {
    const root = renderCarousel({
      opts: { align: "start", direction: "ltr", duration: 1 },
    });
    root.dir = "rtl";
    const carousel = createCarousel(root, { opts: { direction: "rtl" } });
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("rtl");

    root.dir = "ltr";
    carousel.reInit({ direction: "ltr", duration: 1 });
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");
    root.dir = "rtl";
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("ltr");
  });

  it("reads the effective engine direction after direct Embla reInit", async () => {
    const root = renderCarousel({ opts: { align: "start", duration: 1 } });
    root.dir = "ltr";
    const carousel = createCarousel(root, { opts: { direction: "ltr" } });
    await waitForCarousel();
    carousel.scrollTo(1, true);

    root.dir = "rtl";
    carousel.api.reInit({ direction: "rtl" });
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await waitForCarousel();

    expect(carousel.api.internalEngine().options.direction).toBe("rtl");
    expect(carousel.selectedSnap()).toBe(0);
  });

  it("uses serialized direction when it matches the DOM and retains looped slides", async () => {
    const root = renderCarousel({
      opts: { align: "start", direction: "rtl", duration: 1, loop: true },
    });
    root.dir = "rtl";
    const carousel = createCarousel(root);
    await waitForCarousel();
    expect(carousel.api.internalEngine().options.direction).toBe("rtl");
    expect(carousel.canScrollPrev()).toBe(true);
    carousel.scrollPrev(true);
    await waitForCarousel();
    expect(carousel.selectedSnap()).toBe(2);
    expect(carousel.api.internalEngine().options.loop).toBe(true);
  });
});

function renderCarousel(
  options: { axis?: "x" | "y"; id?: string; opts?: Record<string, unknown> } = {},
): HTMLElement {
  const axis = options.axis ?? "x";
  const isVertical = axis === "y";
  const viewportSize = isVertical ? 200 : 100;
  const verticalSlideSize = 150;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      id="${options.id ?? "runtime-carousel"}"
      data-sw-carousel
      data-axis="${axis}"
      data-opts='${JSON.stringify(options.opts ?? {})}'
      style="width: 100px; height: ${viewportSize}px;"
    >
      <div
        data-sw-carousel-viewport
        style="overflow: hidden; width: 100px; height: ${viewportSize}px;"
      >
        <div
          data-sw-carousel-container
          style="display: flex; width: 100px; ${isVertical ? `height: ${verticalSlideSize * 3}px; flex-direction: column;` : ""}"
        >
          ${[1, 2, 3]
            .map(
              (index) => `
                <div
                  data-sw-carousel-item
                  style="flex: 0 0 ${isVertical ? verticalSlideSize : 100}px; width: 100px; height: ${isVertical ? verticalSlideSize : 100}px; min-${isVertical ? "height" : "width"}: 0;"
                >
                  Slide ${index}
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <button data-sw-carousel-previous type="button">Previous</button>
      <button data-sw-carousel-next type="button">Next</button>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function createTestPlugin(): EmblaPluginType {
  return {
    destroy: vi.fn(),
    init: vi.fn(),
    name: "runtimeTestPlugin",
    options: {},
  };
}

function getViewport(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-carousel-viewport]")!;
}

function getPrevious(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-carousel-previous]")!;
}

function getNext(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-carousel-next]")!;
}

async function waitForCarousel(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.resolve();
}

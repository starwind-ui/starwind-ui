import type { EmblaPluginType } from "embla-carousel";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createCarousel } from "../../../src/components/carousel/carousel";

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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSlider } from "../../../src/components/slider/slider";
import { getFormValueRevision } from "../../../src/internal/form-value-revision";

describe("createSlider", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes a single-value slider and updates it with keyboard input", () => {
    const root = renderSlider({ defaultValue: 25, name: "volume" });
    const thumb = getThumb(root, 0);
    const input = getInput(root, 0);
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const slider = createSlider(root);

    expect(slider.getValue()).toBe(25);
    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("data-orientation")).toBe("horizontal");
    expect(root.getAttribute("data-value")).toBe("25");
    expect(getControl(root).getAttribute("data-orientation")).toBe("horizontal");
    expect(getTrack(root).getAttribute("data-orientation")).toBe("horizontal");
    expect(getIndicator(root).getAttribute("data-orientation")).toBe("horizontal");
    expect(thumb.getAttribute("role")).toBe("slider");
    expect(thumb.getAttribute("data-orientation")).toBe("horizontal");
    expect(thumb.getAttribute("aria-valuemin")).toBe("0");
    expect(thumb.getAttribute("aria-valuemax")).toBe("100");
    expect(thumb.getAttribute("aria-valuenow")).toBe("25");
    expect(input.type).toBe("range");
    expect(input.name).toBe("volume");
    expect(input.value).toBe("25");
    expect(getIndicator(root).style.width).toBe("25%");

    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(slider.getValue()).toBe(26);
    expect(root.getAttribute("data-value")).toBe("26");
    expect(thumb.getAttribute("aria-valuenow")).toBe("26");
    expect(input.value).toBe("26");
    expect(getIndicator(root).style.width).toBe("26%");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          activeThumbIndex: 0,
          previousValue: 25,
          reason: "keyboard",
          value: 26,
        }),
      }),
    );
  });

  it("initializes a range slider and prevents thumbs from crossing", () => {
    const root = renderSlider({ defaultValue: [20, 80], name: "price" });
    const firstThumb = getThumb(root, 0);
    const firstInput = getInput(root, 0);
    const secondInput = getInput(root, 1);

    const slider = createSlider(root);

    expect(slider.getValue()).toEqual([20, 80]);
    expect(firstInput.name).toBe("price[0]");
    expect(secondInput.name).toBe("price[1]");
    expect(getIndicator(root).style.left).toBe("20%");
    expect(getIndicator(root).style.width).toBe("60%");

    firstThumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(slider.getValue()).toEqual([80, 80]);
    expect(firstInput.value).toBe("80");
    expect(secondInput.value).toBe("80");
    expect(getIndicator(root).style.left).toBe("80%");
    expect(getIndicator(root).style.width).toBe("0%");
  });

  it("reuses one revision for an accepted value change and its commit", () => {
    const root = renderSlider({ defaultValue: 25 });
    const revisions: unknown[] = [];
    root.addEventListener("starwind:value-change", (event) => {
      revisions.push(getFormValueRevision(event));
    });
    root.addEventListener("starwind:value-committed", (event) => {
      revisions.push(getFormValueRevision(event));
    });
    createSlider(root);

    getThumb(root, 0).dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );

    expect(revisions).toHaveLength(2);
    expect(revisions[0]).toBeDefined();
    expect(revisions[1]).toBe(revisions[0]);
  });

  it("enforces minStepsBetweenValues within the no-crossing range clamp", () => {
    const root = renderSlider({ defaultValue: [20, 80], name: "price" });
    const firstThumb = getThumb(root, 0);
    const secondThumb = getThumb(root, 1);
    const slider = createSlider(root, { minStepsBetweenValues: 2, step: 5 });

    firstThumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(slider.getValue()).toEqual([70, 80]);
    expect(getInput(root, 0).value).toBe("70");
    expect(getInput(root, 1).value).toBe("80");
    expect(getIndicator(root).style.left).toBe("70%");
    expect(getIndicator(root).style.width).toBe("10%");

    slider.setValue([20, 80], { emit: false });
    secondThumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));

    expect(slider.getValue()).toEqual([20, 30]);
    expect(getInput(root, 0).value).toBe("20");
    expect(getInput(root, 1).value).toBe("30");
    expect(getIndicator(root).style.left).toBe("20%");
    expect(getIndicator(root).style.width).toBe("10%");
  });

  it("updates hidden input names from runtime API and root data attributes", () => {
    const root = renderSlider({ defaultValue: [20, 80] });

    const slider = createSlider(root);

    expect(getInput(root, 0).name).toBe("");
    expect(getInput(root, 1).name).toBe("");

    root.setAttribute("data-name", "price");
    slider.setName();

    expect(getInput(root, 0).name).toBe("price[0]");
    expect(getInput(root, 1).name).toBe("price[1]");

    slider.setName("volume");

    expect(getInput(root, 0).name).toBe("volume[0]");
    expect(getInput(root, 1).name).toBe("volume[1]");

    root.removeAttribute("data-name");
    slider.setName(undefined);

    expect(getInput(root, 0).name).toBe("");
    expect(getInput(root, 1).name).toBe("");
  });

  it("submits root-owned slider names through form data", () => {
    document.body.innerHTML = `<form id="settings-form"></form>`;
    const form = document.querySelector<HTMLFormElement>("#settings-form")!;
    const volume = renderSlider({ defaultValue: 25, name: "volume" });
    form.append(volume);
    const range = renderSlider({ defaultValue: [20, 80], name: "price" });
    document.body.append(range);

    const volumeSlider = createSlider(volume);
    const rangeSlider = createSlider(range, { form: "settings-form" });

    expect(new FormData(form).get("volume")).toBe("25");
    expect(new FormData(form).get("price[0]")).toBe("20");
    expect(new FormData(form).get("price[1]")).toBe("80");

    volumeSlider.setName("loudness");
    rangeSlider.setValue([30, 70], { emit: false });
    rangeSlider.setName("budget");

    expect(new FormData(form).get("volume")).toBeNull();
    expect(new FormData(form).get("loudness")).toBe("25");
    expect(new FormData(form).get("price[0]")).toBeNull();
    expect(new FormData(form).get("budget[0]")).toBe("30");
    expect(new FormData(form).get("budget[1]")).toBe("70");

    rangeSlider.setOptions({ form: undefined });

    expect(new FormData(form).get("budget[0]")).toBeNull();

    volumeSlider.setDisabled(true);

    expect(new FormData(form).get("loudness")).toBeNull();
  });

  it("restores root-owned hidden input form attributes after external input mutation", async () => {
    document.body.innerHTML = `<form id="settings-form"></form>`;
    const root = renderSlider({ defaultValue: [20, 80], name: "price" });

    createSlider(root, { form: "settings-form" });

    expect(getInput(root, 0).name).toBe("price[0]");
    expect(getInput(root, 0).getAttribute("form")).toBe("settings-form");
    expect(getInput(root, 1).name).toBe("price[1]");
    expect(getInput(root, 1).getAttribute("form")).toBe("settings-form");

    getInput(root, 0).removeAttribute("name");
    getInput(root, 1).removeAttribute("form");
    await waitForMutationObserver();

    expect(getInput(root, 0).name).toBe("price[0]");
    expect(getInput(root, 0).getAttribute("form")).toBe("settings-form");
    expect(getInput(root, 1).name).toBe("price[1]");
    expect(getInput(root, 1).getAttribute("form")).toBe("settings-form");

    root.setAttribute("data-name", "budget");
    root.removeAttribute("data-form");
    await waitForMutationObserver();

    expect(getInput(root, 0).name).toBe("budget[0]");
    expect(getInput(root, 0)).not.toHaveAttribute("form");
    expect(getInput(root, 1).name).toBe("budget[1]");
    expect(getInput(root, 1)).not.toHaveAttribute("form");
  });

  it("links labels to thumbs and focuses single-thumb sliders from the label", () => {
    const root = renderSlider({ defaultValue: 25 });
    root.insertAdjacentHTML("afterbegin", `<span data-sw-slider-label>Volume</span>`);

    createSlider(root);

    const label = getLabel(root);
    const thumb = getThumb(root, 0);

    expect(label.id).toMatch(/^sw-slider-label-/);
    expect(label.getAttribute("data-sw-slider-label")).toBe("");
    expect(thumb.getAttribute("aria-labelledby")).toBe(label.id);

    label.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.activeElement).toBe(thumb);
  });

  it("keeps explicit thumb labels when Slider.Label provides a range label", () => {
    const root = renderSlider({ defaultValue: [20, 80] });
    root.insertAdjacentHTML("afterbegin", `<span data-sw-slider-label>Price range</span>`);
    getThumb(root, 0).setAttribute("aria-label", "Minimum price");
    getThumb(root, 1).setAttribute("aria-label", "Maximum price");

    createSlider(root);

    const label = getLabel(root);

    expect(getThumb(root, 0).getAttribute("aria-label")).toBe("Minimum price");
    expect(getThumb(root, 0).hasAttribute("aria-labelledby")).toBe(false);
    expect(getThumb(root, 1).getAttribute("aria-label")).toBe("Maximum price");
    expect(getThumb(root, 1).hasAttribute("aria-labelledby")).toBe(false);

    label.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.activeElement).not.toBe(getThumb(root, 0));
    expect(document.activeElement).not.toBe(getThumb(root, 1));
  });

  it("updates mutable range options after mount", () => {
    const root = renderSlider({ defaultValue: 25, name: "volume" });
    const slider = createSlider(root);

    slider.setOptions({
      form: "settings-form",
      largeStep: 20,
      max: 60,
      min: 10,
      orientation: "vertical",
      step: 5,
    });

    const thumb = getThumb(root, 0);
    const input = getInput(root, 0);

    expect(root.getAttribute("data-min")).toBe("10");
    expect(root.getAttribute("data-max")).toBe("60");
    expect(root.getAttribute("data-step")).toBe("5");
    expect(root.getAttribute("data-large-step")).toBe("20");
    expect(root.getAttribute("data-orientation")).toBe("vertical");
    expect(getControl(root).getAttribute("data-orientation")).toBe("vertical");
    expect(getTrack(root).getAttribute("data-orientation")).toBe("vertical");
    expect(getIndicator(root).getAttribute("data-orientation")).toBe("vertical");
    expect(thumb.getAttribute("data-orientation")).toBe("vertical");
    expect(thumb.getAttribute("aria-valuemin")).toBe("10");
    expect(thumb.getAttribute("aria-valuemax")).toBe("60");
    expect(input.min).toBe("10");
    expect(input.max).toBe("60");
    expect(input.step).toBe("5");
    expect(input.getAttribute("form")).toBe("settings-form");
    expect(getIndicator(root).style.bottom).toBe("0%");
    expect(getIndicator(root).style.height).toBe("30%");

    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "PageUp" }));

    expect(slider.getValue()).toBe(45);
    expect(input.value).toBe("45");
    expect(getIndicator(root).style.height).toBe("70%");
  });

  it("normalizes current values when mutable range options change", () => {
    const root = renderSlider({ defaultValue: 80, name: "volume" });
    const slider = createSlider(root);

    slider.setOptions({ max: 60, step: 5 });

    expect(slider.getValue()).toBe(60);
    expect(root.getAttribute("data-value")).toBe("60");
    expect(getThumb(root, 0).getAttribute("aria-valuenow")).toBe("60");
    expect(getInput(root, 0).value).toBe("60");
    expect(getIndicator(root).style.width).toBe("100%");

    slider.setOptions({ min: 20, max: 100, step: 30 });

    expect(slider.getValue()).toBe(50);
    expect(root.getAttribute("data-value")).toBe("50");
    expect(getThumb(root, 0).getAttribute("aria-valuenow")).toBe("50");
    expect(getInput(root, 0).value).toBe("50");
    expect(getIndicator(root).style.width).toBe("37.5%");
  });

  it("lets controlled callers observe changes and update value imperatively", () => {
    const root = renderSlider({ defaultValue: 25 });
    const thumb = getThumb(root, 0);
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();
    const committedListener = vi.fn();
    root.addEventListener("starwind:value-committed", committedListener);

    const slider = createSlider(root, { onValueChange, onValueCommitted, value: 25 });

    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(slider.getValue()).toBe(25);
    expect(getInput(root, 0).value).toBe("25");
    expect(onValueChange).toHaveBeenCalledWith(
      26,
      expect.objectContaining({
        previousValue: 25,
        reason: "keyboard",
        value: 26,
      }),
    );
    expect(onValueCommitted).toHaveBeenCalledWith(
      26,
      expect.objectContaining({
        previousValue: 25,
        reason: "keyboard",
        value: 26,
      }),
    );
    expect(committedListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          previousValue: 25,
          reason: "keyboard",
          value: 26,
        }),
      }),
    );

    slider.setValue(40, { emit: false });

    expect(slider.getValue()).toBe(40);
    expect(getInput(root, 0).value).toBe("40");
    expect(root.getAttribute("data-value")).toBe("40");
  });

  it("refreshes runtime parts when the rendered thumb count changes", () => {
    const root = renderSlider({ defaultValue: 25, name: "price" });
    const slider = createSlider(root);
    getControl(root).insertAdjacentHTML(
      "beforeend",
      `<div data-sw-slider-thumb data-index="1"><input data-sw-slider-input /></div>`,
    );

    slider.refresh();
    slider.setValue([20, 80], { emit: false });

    expect(slider.getValue()).toEqual([20, 80]);
    expect(getInput(root, 0).name).toBe("price[0]");
    expect(getInput(root, 1).name).toBe("price[1]");
    expect(getInput(root, 1).value).toBe("80");

    getThumb(root, 1).dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
    );

    expect(slider.getValue()).toEqual([20, 79]);
    expect(getInput(root, 1).value).toBe("79");
  });

  it("commits a track interaction when pointer buttons are lost", () => {
    const root = renderSlider({ defaultValue: 25 });
    const committedListener = vi.fn();
    root.addEventListener("starwind:value-committed", committedListener);
    setControlRect(root);

    createSlider(root);

    getControl(root).dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientX: 40,
        pointerId: 1,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        buttons: 0,
        clientX: 50,
        pointerId: 1,
      }),
    );

    expect(root.hasAttribute("data-dragging")).toBe(false);
    expect(committedListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          previousValue: 25,
          reason: "track-press",
          value: 40,
        }),
      }),
    );
  });

  it("clears dragging state without committing when pointer interaction is canceled", () => {
    const root = renderSlider({ defaultValue: 25 });
    const committedListener = vi.fn();
    root.addEventListener("starwind:value-committed", committedListener);
    setControlRect(root);

    createSlider(root);

    getThumb(root, 0).dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientX: 25,
        pointerId: 1,
      }),
    );

    expect(root.hasAttribute("data-dragging")).toBe(true);

    document.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        pointerId: 1,
      }),
    );

    expect(root.hasAttribute("data-dragging")).toBe(false);
    expect(committedListener).not.toHaveBeenCalled();
  });

  it("keeps the previous value when value change details are canceled", () => {
    const root = renderSlider({ defaultValue: 25 });
    const thumb = getThumb(root, 0);
    root.addEventListener("starwind:value-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });

    const slider = createSlider(root);

    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(slider.getValue()).toBe(25);
    expect(getInput(root, 0).value).toBe("25");
    expect(root.getAttribute("data-value")).toBe("25");
  });

  it("lets DOM value-change listeners cancel with preventDefault before value commits", () => {
    const root = renderSlider({ defaultValue: 25 });
    const thumb = getThumb(root, 0);
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();
    const committedListener = vi.fn();
    root.addEventListener("starwind:value-committed", committedListener);
    root.addEventListener("starwind:value-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    const slider = createSlider(root, { onValueChange, onValueCommitted });

    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(slider.getValue()).toBe(25);
    expect(getInput(root, 0).value).toBe("25");
    expect(root.getAttribute("data-value")).toBe("25");
    expect(onValueChange).toHaveBeenCalledWith(26, expect.objectContaining({ isCanceled: true }));
    expect(onValueCommitted).not.toHaveBeenCalled();
    expect(committedListener).not.toHaveBeenCalled();
  });
});

function renderSlider({
  defaultValue,
  name,
}: {
  defaultValue: number | number[];
  name?: string;
}): HTMLElement {
  const values = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  const defaultValueAttribute = Array.isArray(defaultValue)
    ? JSON.stringify(defaultValue)
    : String(defaultValue);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-slider
      data-default-value="${defaultValueAttribute}"
      data-min="0"
      data-max="100"
      data-step="1"
      data-large-step="10"
      data-orientation="horizontal"
      ${name === undefined ? "" : `data-name="${name}"`}
    >
      <div data-sw-slider-control>
        <div data-sw-slider-track>
          <div data-sw-slider-indicator></div>
        </div>
        ${values
          .map(
            (_, index) => `
              <div data-sw-slider-thumb data-index="${index}">
                <input data-sw-slider-input />
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getIndicator(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-slider-indicator]")!;
}

function getControl(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-slider-control]")!;
}

function getTrack(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-slider-track]")!;
}

function getLabel(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-slider-label]")!;
}

function getInput(root: HTMLElement, index: number): HTMLInputElement {
  return getThumb(root, index).querySelector<HTMLInputElement>("[data-sw-slider-input]")!;
}

function getThumb(root: HTMLElement, index: number): HTMLElement {
  return root.querySelectorAll<HTMLElement>("[data-sw-slider-thumb]")[index]!;
}

function setControlRect(root: HTMLElement): void {
  Object.defineProperty(getControl(root), "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: 10,
      height: 10,
      left: 0,
      right: 100,
      toJSON: () => ({}),
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    }),
  });
}

async function waitForMutationObserver(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

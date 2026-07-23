import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createPreviewCard } from "../../../src/components/preview-card/preview-card";

describe("createPreviewCard", () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("initializes closed with tooltip semantics and opens from hover after the configured delay", async () => {
    vi.useFakeTimers();
    const root = renderPreviewCard({ openDelay: 25 });
    const previewCard = createPreviewCard(root);

    expect(previewCard.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().getAttribute("role")).toBe("tooltip");
    expect(getTrigger().getAttribute("aria-describedby")).toBe(getPopup().id);
    expect(getTrigger().getAttribute("data-state")).toBe("closed");

    dispatchPointer(getTrigger(), "pointerenter");
    await vi.advanceTimersByTimeAsync(24);
    expect(getPopup().hidden).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await waitForMicrotasks();

    expect(previewCard.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getRoot().getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("data-state")).toBe("open");
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(getPopup().parentElement).toBe(document.body);
    expect(getPopup().style.position).toBe("fixed");
  });

  it("opens initially from defaultOpen options and raw data-default-open without emitting", () => {
    const optionRoot = renderPreviewCard();
    const optionTrigger = getTrigger(optionRoot);
    const optionPopup = getPopup(optionRoot);
    const onOpenChange = vi.fn();

    const optionPreviewCard = createPreviewCard(optionRoot, { defaultOpen: true, onOpenChange });

    expect(optionPreviewCard.getOpen()).toBe(true);
    expect(optionPopup.hidden).toBe(false);
    expect(optionRoot.getAttribute("data-state")).toBe("open");
    expect(optionTrigger.getAttribute("data-state")).toBe("open");
    expect(optionTrigger.getAttribute("aria-describedby")).toBe(optionPopup.id);
    expect(onOpenChange).not.toHaveBeenCalled();

    const rawRoot = renderPreviewCard();
    const rawTrigger = getTrigger(rawRoot);
    const rawPopup = getPopup(rawRoot);
    const rawOpenChange = vi.fn();
    rawRoot.setAttribute("data-default-open", "true");
    rawRoot.addEventListener("starwind:open-change", rawOpenChange);

    const rawPreviewCard = createPreviewCard(rawRoot);

    expect(rawPreviewCard.getOpen()).toBe(true);
    expect(rawPopup.hidden).toBe(false);
    expect(rawRoot.getAttribute("data-state")).toBe("open");
    expect(rawTrigger.getAttribute("data-state")).toBe("open");
    expect(rawOpenChange).not.toHaveBeenCalled();
  });

  it("opens immediately on focus and closes from Escape with cancelable intents", () => {
    const root = renderPreviewCard();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    createPreviewCard(root);
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(getPopup().hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-focus" }),
      }),
    );

    root.addEventListener("starwind:escape-key-down", (event) => event.preventDefault(), {
      once: true,
    });
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(getPopup().hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(getPopup().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "escape-key" }),
      }),
    );
  });

  it("allows onOpenChange details cancellation before Preview Card state changes", () => {
    const root = renderPreviewCard();
    const canceledSnapshots: boolean[] = [];
    let callbackDetails: unknown;
    let eventDetails: unknown;
    const onOpenChange = vi.fn((_open, details) => {
      callbackDetails = details;
      canceledSnapshots.push(details.isCanceled);
      details.cancel();
      canceledSnapshots.push(details.isCanceled);
    });
    const openChangeListener = vi.fn((event: Event) => {
      eventDetails = (event as CustomEvent).detail;
    });
    root.addEventListener("starwind:open-change", openChangeListener);

    const previewCard = createPreviewCard(root, { onOpenChange });
    const subscriber = vi.fn();
    previewCard.subscribe("openChange", subscriber);
    dispatchPointer(getTrigger(), "pointerenter");

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        reason: "trigger-hover",
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(openChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(previewCard.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("data-state")).toBe("closed");
  });

  it("allows starwind:open-change preventDefault before Preview Card state changes", () => {
    const root = renderPreviewCard();
    root.addEventListener("starwind:open-change", (event) => event.preventDefault());

    const previewCard = createPreviewCard(root);
    const subscriber = vi.fn();
    previewCard.subscribe("openChange", subscriber);
    dispatchPointer(getTrigger(), "pointerenter");

    expect(subscriber).not.toHaveBeenCalled();
    expect(previewCard.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("data-state")).toBe("closed");
  });

  it("preserves the onOpenChange callback receiver", () => {
    const root = renderPreviewCard();
    const receivers: unknown[] = [];

    const previewCard = createPreviewCard(root, {
      onOpenChange: function onOpenChange(this: unknown) {
        receivers.push(this);
      },
    });
    dispatchPointer(getTrigger(), "pointerenter");

    expect(receivers).toEqual([previewCard]);
  });

  it("opens and closes imperatively without locking body scroll", () => {
    const root = renderPreviewCard();
    const previewCard = createPreviewCard(root);

    previewCard.open();

    expect(previewCard.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    previewCard.close();

    expect(previewCard.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("opens from focus after the configured open delay", async () => {
    vi.useFakeTimers();
    const root = renderPreviewCard({ openDelay: 25 });

    createPreviewCard(root);
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    await vi.advanceTimersByTimeAsync(24);
    expect(getPopup().hidden).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(false);
  });

  it("uses the runtime open delay default when no delay attribute is present", async () => {
    vi.useFakeTimers();
    const root = renderPreviewCardWithRuntimeDefaults();

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");

    await vi.advanceTimersByTimeAsync(599);
    expect(getPopup().hidden).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(false);
  });

  it("closes from outside press with cancelable intents", () => {
    const root = renderPreviewCard();
    const outside = document.createElement("button");
    document.body.append(outside);

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");
    expect(getPopup().hidden).toBe(false);

    root.addEventListener("starwind:outside-interact", (event) => event.preventDefault(), {
      once: true,
    });
    dispatchPointer(outside, "pointerdown");
    expect(getPopup().hidden).toBe(false);

    dispatchPointer(outside, "pointerdown");
    expect(getPopup().hidden).toBe(true);
  });

  it("treats non-trigger siblings inside the Preview Card root as outside interactions", () => {
    const root = renderPreviewCard();
    const rootRemainder = document.createElement("button");
    rootRemainder.type = "button";
    rootRemainder.textContent = "Root remainder";
    root.append(rootRemainder);

    const previewCard = createPreviewCard(root);
    previewCard.setOpen(true, { emit: false });

    dispatchPointer(rootRemainder, "pointerdown");

    expect(previewCard.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("registers global dismissal listeners only while preview card instances are open", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const first = createPreviewCard(renderPreviewCard());
      const second = createPreviewCard(renderPreviewCard());

      expect(getDismissalListenerCalls(addListener)).toHaveLength(0);

      first.setOpen(true, { emit: false });

      expect(getDismissalListenerCalls(addListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);

      second.setOpen(true, { emit: false });

      expect(getDismissalListenerCalls(addListener)).toHaveLength(2);

      first.setOpen(false, { emit: false });

      expect(getDismissalListenerCalls(removeListener)).toHaveLength(0);

      second.setOpen(false, { emit: false });

      expect(getDismissalListenerCalls(removeListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);
    } finally {
      addListener.mockRestore();
      removeListener.mockRestore();
    }
  });

  it("does not open from disabled triggers", () => {
    const root = renderPreviewCard({ disabled: true });

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("data-disabled")).toBe("");
    expect(getTrigger().getAttribute("data-trigger-disabled")).toBe("");
  });

  it("prevents disabled anchor trigger activation and default click actions", () => {
    const root = renderPreviewCardWithDisabledAnchorTrigger();

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    const clickAllowed = getTrigger().dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(getPopup().hidden).toBe(true);
    expect(clickAllowed).toBe(false);
    expect(getTrigger().getAttribute("aria-disabled")).toBe("true");
    expect(getTrigger().getAttribute("data-disabled")).toBe("");
    expect(getTrigger().getAttribute("data-trigger-disabled")).toBe("");
  });

  it("keeps hoverable content open until the popup itself is left", async () => {
    vi.useFakeTimers();
    const root = renderPreviewCard({ closeDelay: 50 });

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");
    await waitForMicrotasks();
    expect(getPopup().hidden).toBe(false);

    dispatchPointer(getTrigger(), "pointerleave");
    await vi.advanceTimersByTimeAsync(25);
    dispatchPointer(getPopup(), "pointerenter");
    await vi.advanceTimersByTimeAsync(50);
    expect(getPopup().hidden).toBe(false);

    dispatchPointer(getPopup(), "pointerleave");
    await vi.advanceTimersByTimeAsync(50);
    expect(getPopup().hidden).toBe(true);
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderPreviewCard();
    const onOpenChange = vi.fn();
    const previewCard = createPreviewCard(root, {
      onOpenChange,
      open: false,
    });

    dispatchPointer(getTrigger(), "pointerenter");

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-hover" }),
    );
    expect(previewCard.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    previewCard.setOpen(true, { emit: false });

    expect(previewCard.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("switches active trigger state and anchor while already open", async () => {
    const root = renderPreviewCardWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();
    const previewCard = createPreviewCard(root);

    dispatchPointer(firstTrigger, "pointerenter");
    await waitForFloatingPosition();
    dispatchPointer(secondTrigger, "pointerenter");
    await waitForFloatingPosition();

    expect(previewCard.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(firstTrigger.getAttribute("data-state")).toBe("closed");
    expect(firstTrigger.hasAttribute("data-popup-open")).toBe(false);
    expect(secondTrigger.getAttribute("data-state")).toBe("open");
    expect(secondTrigger.getAttribute("data-popup-open")).toBe("");
    expect(getPopup().style.left).toBe("220px");
    expect(getPopup().style.top).toBe("134px");
  });

  it("switches active trigger state and anchor while controlled open", async () => {
    const root = renderPreviewCardWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();
    const previewCard = createPreviewCard(root, { open: true });

    await waitForFloatingPosition();
    expect(previewCard.getOpen()).toBe(true);
    expect(firstTrigger.getAttribute("data-state")).toBe("open");
    expect(secondTrigger.getAttribute("data-state")).toBe("closed");
    expect(getPopup().style.left).toBe("80px");

    dispatchPointer(secondTrigger, "pointerenter");
    await waitForFloatingPosition();

    expect(previewCard.getOpen()).toBe(true);
    expect(firstTrigger.getAttribute("data-state")).toBe("closed");
    expect(secondTrigger.getAttribute("data-state")).toBe("open");
    expect(getPopup().style.left).toBe("220px");
  });

  it("keeps the active trigger and anchor when an open trigger switch is canceled", async () => {
    const root = renderPreviewCardWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();
    const previewCard = createPreviewCard(root);

    dispatchPointer(firstTrigger, "pointerenter");
    await waitForFloatingPosition();
    const initialLeft = getPopup().style.left;

    root.addEventListener("starwind:open-change", (event) => event.preventDefault(), {
      once: true,
    });
    dispatchPointer(secondTrigger, "pointerenter");
    await waitForFloatingPosition();

    expect(previewCard.getOpen()).toBe(true);
    expect(firstTrigger.getAttribute("data-state")).toBe("open");
    expect(secondTrigger.getAttribute("data-state")).toBe("closed");
    expect(getPopup().style.left).toBe(initialLeft);
  });

  it("keeps the active trigger and anchor when a controlled open trigger switch is canceled", async () => {
    const root = renderPreviewCardWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();
    const previewCard = createPreviewCard(root, { open: true });

    await waitForFloatingPosition();
    const initialLeft = getPopup().style.left;

    root.addEventListener("starwind:open-change", (event) => event.preventDefault(), {
      once: true,
    });
    dispatchPointer(secondTrigger, "pointerenter");
    await waitForFloatingPosition();

    expect(previewCard.getOpen()).toBe(true);
    expect(firstTrigger.getAttribute("data-state")).toBe("open");
    expect(secondTrigger.getAttribute("data-state")).toBe("closed");
    expect(getPopup().style.left).toBe(initialLeft);
  });

  it("uses popup placement as the no-positioner fallback with a zero side offset default", async () => {
    const root = renderPreviewCardWithRuntimeDefaultPlacement();

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    expect(getPopup().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().getAttribute("data-align")).toBe("center");
    expect(getPopup().style.top).toBe("130px");
  });

  it("prefers primitive positioner placement attributes over conflicting popup attributes", async () => {
    const root = renderPreviewCardWithPositioner();

    createPreviewCard(root);
    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    expect(getPopup().getAttribute("data-side")).toBe("right");
    expect(getPopup().getAttribute("data-align")).toBe("end");
    expect(getArrow().getAttribute("data-side")).toBe("right");
    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPopup().parentElement).toBe(getPositioner());
    expect(getPositioner().style.position).toBe("fixed");
  });

  it("restores portaled positioner content and clears floating styles after close animations", async () => {
    const root = renderPreviewCardWithPositioner();
    const previewCard = createPreviewCard(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    const animationFinished = createDeferred<void>();
    vi.spyOn(getPopup(), "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPositioner().style.position).toBe("fixed");

    previewCard.close();
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(false);
    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPositioner().parentElement).toBe(document.body);

    animationFinished.resolve();
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(getPositioner().parentElement).toBe(root);
    expect(getPositioner().style.position).toBe("");
    expect(getPositioner().style.left).toBe("");
    expect(getPositioner().style.top).toBe("");
  });

  it("syncs optional backdrop, viewport, and arrow state with Preview Card state", () => {
    const root = renderPreviewCardWithOptionalParts();
    const backdrop = root.querySelector<HTMLElement>("[data-sw-preview-card-backdrop]")!;
    const viewport = root.querySelector<HTMLElement>("[data-sw-preview-card-viewport]")!;
    const arrow = root.querySelector<HTMLElement>("[data-sw-preview-card-arrow]")!;
    const previewCard = createPreviewCard(root);

    expect(backdrop.hidden).toBe(true);
    expect(backdrop.getAttribute("data-state")).toBe("closed");
    expect(viewport.getAttribute("data-state")).toBe("closed");
    expect(arrow.getAttribute("data-state")).toBe("closed");

    previewCard.open();

    expect(backdrop.hidden).toBe(false);
    expect(backdrop.getAttribute("data-state")).toBe("open");
    expect(viewport.getAttribute("data-state")).toBe("open");
    expect(arrow.getAttribute("data-state")).toBe("open");

    previewCard.close();

    expect(backdrop.getAttribute("data-state")).toBe("closed");
    expect(viewport.getAttribute("data-state")).toBe("closed");
    expect(arrow.getAttribute("data-state")).toBe("closed");
  });

  it("allows interactive content and leaves popup tabindex alone", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const root = renderPreviewCardWithInteractiveContent();

      createPreviewCard(root);

      expect(getPopup().getAttribute("tabindex")).toBe("0");
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("closes when focus leaves interactive popup content", () => {
    const root = renderPreviewCardWithInteractiveContent();
    const outside = document.createElement("button");
    document.body.append(outside);

    createPreviewCard(root);
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(getPopup().hidden).toBe(false);

    getTrigger().dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: getInteractiveAction() }),
    );
    getInteractiveAction().dispatchEvent(
      new FocusEvent("focusin", { bubbles: true, relatedTarget: getTrigger() }),
    );
    expect(getPopup().hidden).toBe(false);

    getInteractiveAction().dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: outside }),
    );
    expect(getPopup().hidden).toBe(true);
  });

  it("transfers raw asChild trigger attributes to the child control", () => {
    const root = renderPreviewCardAsChild();
    const wrapper = document.querySelector<HTMLElement>("#preview-card-as-child-wrapper")!;
    const child = document.querySelector<HTMLButtonElement>("#preview-card-as-child-button")!;

    createPreviewCard(root);

    expect(wrapper.hasAttribute("data-sw-preview-card-trigger")).toBe(false);
    expect(wrapper.hasAttribute("data-as-child")).toBe(false);
    expect(wrapper.style.display).toBe("contents");
    expect(child.hasAttribute("data-sw-preview-card-trigger")).toBe(true);
    expect(child.getAttribute("aria-describedby")).toBe(getPopup().id);

    dispatchPointer(child, "pointerenter");
    expect(getPopup().hidden).toBe(false);
  });

  it("requires a preview card popup element", () => {
    const root = document.createElement("div");
    root.setAttribute("data-sw-preview-card", "");
    root.innerHTML = `<button data-sw-preview-card-trigger>Show preview</button>`;
    document.body.append(root);

    expect(() => createPreviewCard(root)).toThrow(
      "PreviewCard requires a [data-sw-preview-card-popup] element.",
    );
  });

  it("initializes raw HTML preview cards through initStarwind", () => {
    const root = renderPreviewCard();
    const cleanup = initStarwind(document);

    dispatchPointer(getTrigger(), "pointerenter");

    expect(getPopup().hidden).toBe(false);

    cleanup.destroy();

    expect(getPopup().hidden).toBe(true);

    dispatchPointer(getTrigger(), "pointerenter");

    expect(getPopup().hidden).toBe(true);
    expect(root.getAttribute("data-state")).toBe("closed");
  });
});

function renderPreviewCard(
  options: {
    closeDelay?: number;
    contentHoverable?: boolean;
    disabled?: boolean;
    openDelay?: number;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-preview-card
      ${
        options.contentHoverable === false
          ? 'data-content-hoverable="false"'
          : 'data-content-hoverable="true"'
      }
      data-open-delay="${options.openDelay ?? 0}"
      data-close-delay="${options.closeDelay ?? 0}"
    >
      <button
        data-sw-preview-card-trigger
        ${options.disabled ? "disabled" : ""}
      >
        Show preview
      </button>
      <div data-sw-preview-card-popup data-side="bottom" data-align="center">
        Preview card content
        <div data-sw-preview-card-arrow></div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithRuntimeDefaults(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card>
      <button data-sw-preview-card-trigger>Show preview</button>
      <div data-sw-preview-card-popup>
        Preview card content
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithDisabledAnchorTrigger(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <a data-sw-preview-card-trigger data-disabled aria-disabled="true" href="#disabled-preview">
        Show preview
      </a>
      <div data-sw-preview-card-popup>
        Preview card content
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithMultipleTriggers(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <button
        data-sw-preview-card-trigger
        style="position: fixed; left: 80px; top: 100px; width: 60px; height: 30px"
      >
        First trigger
      </button>
      <button
        data-sw-preview-card-trigger
        style="position: fixed; left: 220px; top: 100px; width: 60px; height: 30px"
      >
        Second trigger
      </button>
      <div
        data-sw-preview-card-popup
        data-side="bottom"
        data-align="start"
        data-side-offset="4"
        data-avoid-collisions="false"
        style="width: 120px; height: 80px"
      >
        Preview card content
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithRuntimeDefaultPlacement(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <button
        data-sw-preview-card-trigger
        style="position: fixed; left: 80px; top: 100px; width: 60px; height: 30px"
      >
        Show preview
      </button>
      <div
        data-sw-preview-card-popup
        data-avoid-collisions="false"
        style="width: 120px; height: 80px"
      >
        Preview card content
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardAsChild(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <div
        id="preview-card-as-child-wrapper"
        data-sw-preview-card-trigger
        data-as-child
        class="wrapper-class"
      >
        <button id="preview-card-as-child-button" class="child-class">
          Show preview
        </button>
      </div>
      <div data-sw-preview-card-popup>
        Preview card content
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithPositioner(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <button data-sw-preview-card-trigger>Show preview</button>
      <div
        data-sw-preview-card-positioner
        data-side="right"
        data-align="end"
        data-side-offset="12"
        data-avoid-collisions="false"
      >
        <div data-sw-preview-card-popup data-side="top" data-align="start" data-side-offset="0">
          Preview card content
          <div data-sw-preview-card-arrow></div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithOptionalParts(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <button data-sw-preview-card-trigger>Show preview</button>
      <div data-sw-preview-card-backdrop hidden></div>
      <div
        data-sw-preview-card-positioner
        data-side="right"
        data-align="center"
        data-avoid-collisions="false"
      >
        <div data-sw-preview-card-viewport>
          <div data-sw-preview-card-popup>
            Preview card content
            <div data-sw-preview-card-arrow></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPreviewCardWithInteractiveContent(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-preview-card data-open-delay="0">
      <button data-sw-preview-card-trigger>Show preview</button>
      <div data-sw-preview-card-popup tabindex="0">
        Preview card content
        <button id="preview-card-action">Take action</button>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function dispatchPointer(element: HTMLElement, type: string): void {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
}

function getRoot(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-preview-card]")!;
}

function getTrigger(root: ParentNode = document): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>("[data-sw-preview-card-trigger]")!;
}

function getTriggers(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sw-preview-card-trigger]"));
}

function getPopup(root: ParentNode = document): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-preview-card-popup]")!;
}

function getInteractiveAction(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("#preview-card-action")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-preview-card-positioner]")!;
}

function getArrow(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-preview-card-arrow]")!;
}

function getDismissalListenerCalls(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(
    (call): call is [string, ...unknown[]] => call[0] === "keydown" || call[0] === "pointerdown",
  );
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForFloatingPosition(): Promise<void> {
  await waitForMicrotasks();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

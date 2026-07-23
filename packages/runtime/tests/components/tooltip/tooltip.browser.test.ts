import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createTooltip } from "../../../src/components/tooltip/tooltip";

describe("createTooltip", () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("initializes closed with ARIA wiring and opens from hover after the configured delay", async () => {
    vi.useFakeTimers();
    const root = renderTooltip({ openDelay: 25 });
    const tooltip = createTooltip(root);

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().getAttribute("role")).toBe("tooltip");
    expect(getTrigger().getAttribute("aria-describedby")).toBe(getPopup().id);
    expect(getTrigger().getAttribute("data-state")).toBe("closed");

    dispatchPointer(getTrigger(), "pointerenter");
    await vi.advanceTimersByTimeAsync(24);
    expect(getPopup().hidden).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await waitForMicrotasks();

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getRoot().getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("data-state")).toBe("open");
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(getPopup().parentElement).toBe(document.body);
    expect(getPopup().style.position).toBe("fixed");
    expect(getPopup().style.left).not.toBe("");
    expect(getPopup().style.top).not.toBe("");
  });

  it("opens initially from defaultOpen options and raw data-default-open without emitting", () => {
    const optionRoot = renderTooltip();
    const optionTrigger = getTrigger(optionRoot);
    const optionPopup = getPopup(optionRoot);
    const onOpenChange = vi.fn();

    const optionTooltip = createTooltip(optionRoot, { defaultOpen: true, onOpenChange });

    expect(optionTooltip.getOpen()).toBe(true);
    expect(optionPopup.hidden).toBe(false);
    expect(optionRoot.getAttribute("data-state")).toBe("open");
    expect(optionTrigger.getAttribute("data-state")).toBe("open");
    expect(optionTrigger.getAttribute("aria-describedby")).toBe(optionPopup.id);
    expect(onOpenChange).not.toHaveBeenCalled();

    const rawRoot = renderTooltip();
    const rawTrigger = getTrigger(rawRoot);
    const rawPopup = getPopup(rawRoot);
    const rawOpenChange = vi.fn();
    rawRoot.setAttribute("data-default-open", "true");
    rawRoot.addEventListener("starwind:open-change", rawOpenChange);

    const rawTooltip = createTooltip(rawRoot);

    expect(rawTooltip.getOpen()).toBe(true);
    expect(rawPopup.hidden).toBe(false);
    expect(rawRoot.getAttribute("data-state")).toBe("open");
    expect(rawTrigger.getAttribute("data-state")).toBe("open");
    expect(rawOpenChange).not.toHaveBeenCalled();
  });

  it("opens on focus and closes from Escape with cancelable intents", () => {
    const root = renderTooltip();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    createTooltip(root);
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

  it("allows onOpenChange details cancellation before Tooltip state changes", () => {
    const root = renderTooltip();
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

    const tooltip = createTooltip(root, { onOpenChange });
    const subscriber = vi.fn();
    tooltip.subscribe("openChange", subscriber);
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
    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("data-state")).toBe("closed");
  });

  it("allows starwind:open-change preventDefault before Tooltip state changes", () => {
    const root = renderTooltip();
    root.addEventListener("starwind:open-change", (event) => event.preventDefault());

    const tooltip = createTooltip(root);
    const subscriber = vi.fn();
    tooltip.subscribe("openChange", subscriber);
    dispatchPointer(getTrigger(), "pointerenter");

    expect(subscriber).not.toHaveBeenCalled();
    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("data-state")).toBe("closed");
  });

  it("preserves the onOpenChange callback receiver", () => {
    const root = renderTooltip();
    const receivers: unknown[] = [];

    const tooltip = createTooltip(root, {
      onOpenChange: function onOpenChange(this: unknown) {
        receivers.push(this);
      },
    });
    dispatchPointer(getTrigger(), "pointerenter");

    expect(receivers).toEqual([tooltip]);
  });

  it("opens and closes imperatively without locking body scroll", () => {
    const root = renderTooltip();
    const tooltip = createTooltip(root);

    tooltip.open();

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    tooltip.close();

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("does not open from pointer-induced focus", () => {
    const root = renderTooltip();
    const tooltip = createTooltip(root);

    getTrigger().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("opens from keyboard-origin focus", () => {
    const root = renderTooltip();
    const tooltip = createTooltip(root);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("keeps disabled tooltips closed across initial, imperative, and controlled open paths", () => {
    const defaultOpenRoot = renderTooltip();
    const defaultOpenTooltip = createTooltip(defaultOpenRoot, {
      defaultOpen: true,
      disabled: true,
    });

    expect(defaultOpenTooltip.getOpen()).toBe(false);
    expect(getPopup(defaultOpenRoot).hidden).toBe(true);

    defaultOpenTooltip.open();
    defaultOpenTooltip.setOpen(true);

    expect(defaultOpenTooltip.getOpen()).toBe(false);
    expect(getPopup(defaultOpenRoot).hidden).toBe(true);

    const controlledRoot = renderTooltip();
    const controlledTooltip = createTooltip(controlledRoot, { disabled: true, open: true });

    expect(controlledTooltip.getOpen()).toBe(false);
    expect(getPopup(controlledRoot).hidden).toBe(true);
  });

  it("keeps a default-open tooltip attached to the trigger while scroll changes its rect", async () => {
    const root = renderTooltip();
    const trigger = getTrigger();
    const popup = getPopup();
    let triggerLeft = window.innerWidth - 24;

    popup.setAttribute("data-side", "bottom");
    popup.setAttribute("data-align", "start");
    popup.style.width = "160px";
    popup.style.height = "80px";
    mockRect(trigger, () => ({
      height: 30,
      width: 20,
      x: triggerLeft,
      y: 100,
    }));

    const tooltip = createTooltip(root, { defaultOpen: true });
    await waitForFloatingPosition();

    expect(tooltip.getOpen()).toBe(true);
    expect(popup.style.left).toBe(`${triggerLeft + 20 - 160}px`);
    expect(popup.getAttribute("data-side")).toBe("bottom");
    expect(popup.getAttribute("data-align")).toBe("end");

    triggerLeft = 80;
    dispatchScrollUpdate();
    await waitForFloatingPosition();

    expect(popup.style.left).toBe("80px");
    expect(popup.getAttribute("data-side")).toBe("bottom");
    expect(popup.getAttribute("data-align")).toBe("start");
  });

  it("ignores hover and keyboard-origin focus while disabled", async () => {
    vi.useFakeTimers();
    const root = renderTooltip({ openDelay: 25 });
    const tooltip = createTooltip(root, { disabled: true });

    dispatchPointer(getTrigger(), "pointerenter");
    await vi.advanceTimersByTimeAsync(25);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    getTrigger().dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("closes an open tooltip when disabled and allows opening after re-enabled", () => {
    const root = renderTooltip();
    const tooltip = createTooltip(root);

    tooltip.setOpen(true, { emit: false });
    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    tooltip.setDisabled(true);

    expect(tooltip.getOpen()).toBe(false);
    expect(getRoot().hasAttribute("data-disabled")).toBe(true);
    expect(getPopup().hidden).toBe(true);

    tooltip.setOpen(true);

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    tooltip.setDisabled(false);
    tooltip.setOpen(true);

    expect(tooltip.getOpen()).toBe(true);
    expect(getRoot().hasAttribute("data-disabled")).toBe(false);
    expect(getPopup().hidden).toBe(false);
  });

  it("closes from outside pointer interactions while preserving inside interactions and cancellation", () => {
    const root = renderTooltip();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const tooltip = createTooltip(root);
    tooltip.setOpen(true, { emit: false });

    getTrigger().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    getPopup().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    root.addEventListener("starwind:outside-interact", (event) => event.preventDefault(), {
      once: true,
    });
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "outside-press" }),
      }),
    );
  });

  it("treats non-trigger siblings inside the Tooltip root as outside interactions", () => {
    const root = renderTooltip();
    const rootRemainder = document.createElement("button");
    rootRemainder.type = "button";
    rootRemainder.textContent = "Root remainder";
    root.append(rootRemainder);

    const tooltip = createTooltip(root);
    tooltip.setOpen(true, { emit: false });

    rootRemainder.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("preserves multi-instance dismissal containment, topmost Escape, and reopen behavior", () => {
    const firstRoot = renderTooltip();
    const first = createTooltip(firstRoot);
    const firstPopup = firstRoot.querySelector<HTMLElement>("[data-sw-tooltip-popup]")!;
    const secondRoot = renderTooltip();
    const second = createTooltip(secondRoot);
    const secondPopup = secondRoot.querySelector<HTMLElement>("[data-sw-tooltip-popup]")!;

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(first.getOpen()).toBe(false);
    expect(second.getOpen()).toBe(false);
    expect(firstPopup.hidden).toBe(true);
    expect(secondPopup.hidden).toBe(true);

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(first.getOpen()).toBe(true);
    expect(second.getOpen()).toBe(false);
    expect(firstPopup.hidden).toBe(false);
    expect(secondPopup.hidden).toBe(true);

    second.setOpen(true, { emit: false });

    secondPopup.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(first.getOpen()).toBe(false);
    expect(second.getOpen()).toBe(true);
    expect(firstPopup.hidden).toBe(true);
    expect(secondPopup.hidden).toBe(false);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(first.getOpen()).toBe(false);
    expect(second.getOpen()).toBe(false);
    expect(firstPopup.hidden).toBe(true);
    expect(secondPopup.hidden).toBe(true);

    first.setOpen(true, { emit: false });

    expect(first.getOpen()).toBe(true);
    expect(firstPopup.hidden).toBe(false);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(first.getOpen()).toBe(false);
    expect(firstPopup.hidden).toBe(true);
  });

  it("keeps hoverable content open until the popup itself is left", async () => {
    vi.useFakeTimers();
    const root = renderTooltip({ closeDelay: 50 });

    createTooltip(root);
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

  it("keeps zero-delay hoverable content open when leaving the trigger into the popup", async () => {
    const root = renderTooltip({ closeDelay: 0 });
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();
    expect(tooltip.getOpen()).toBe(true);

    dispatchPointer(getTrigger(), "pointerleave", { relatedTarget: getPopup() });

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("keeps zero-delay hoverable content open when the pointer leaves over the popup without relatedTarget", async () => {
    const root = renderTooltip({ closeDelay: 0 });
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    const popupRect = getPopup().getBoundingClientRect();
    dispatchPointer(getTrigger(), "pointerleave", {
      clientX: popupRect.left + popupRect.width / 2,
      clientY: popupRect.top + popupRect.height / 2,
      relatedTarget: null,
    });

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("keeps zero-delay hoverable content open when leaving the popup back into the trigger", async () => {
    const root = renderTooltip({ closeDelay: 0 });
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    dispatchPointer(getPopup(), "pointerleave", { relatedTarget: getTrigger() });

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("closes zero-delay hoverable content after leaving a sibling arrow to outside", async () => {
    const root = renderTooltipWithPositionerAndSiblingArrow();
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    dispatchPointer(getTrigger(), "pointerleave", { relatedTarget: getArrow() });

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    dispatchPointer(getArrow(), "pointerleave", { relatedTarget: document.body });

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("keeps zero-delay hoverable content open when leaving popup into a sibling arrow", async () => {
    const root = renderTooltipWithPositionerAndSiblingArrow();
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    dispatchPointer(getPopup(), "pointerleave", { relatedTarget: getArrow() });

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("closes zero-delay hoverable content when relatedTarget is outside even if coordinates overlap the popup", async () => {
    const root = renderTooltip({ closeDelay: 0 });
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    const popupRect = getPopup().getBoundingClientRect();
    dispatchPointer(getTrigger(), "pointerleave", {
      clientX: popupRect.left + popupRect.width / 2,
      clientY: popupRect.top + popupRect.height / 2,
      relatedTarget: document.body,
    });

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("does not keep zero-delay non-hoverable content open when leaving the trigger into the popup", async () => {
    const root = renderTooltip({ closeDelay: 0, contentHoverable: false });
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    dispatchPointer(getTrigger(), "pointerleave", { relatedTarget: getPopup() });

    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("does not keep non-hoverable content open when the popup is entered", async () => {
    vi.useFakeTimers();
    const root = renderTooltip({ closeDelay: 50, contentHoverable: false });

    createTooltip(root);
    dispatchPointer(getTrigger(), "pointerenter");
    await waitForMicrotasks();
    expect(getPopup().hidden).toBe(false);

    dispatchPointer(getTrigger(), "pointerleave");
    await vi.advanceTimersByTimeAsync(25);
    dispatchPointer(getPopup(), "pointerenter");
    await vi.advanceTimersByTimeAsync(25);
    expect(getPopup().hidden).toBe(true);
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderTooltip();
    const onOpenChange = vi.fn();
    const tooltip = createTooltip(root, {
      onOpenChange,
      open: false,
    });

    dispatchPointer(getTrigger(), "pointerenter");

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-hover" }),
    );
    expect(tooltip.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    tooltip.setOpen(true, { emit: false });

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("reads placement attributes from a primitive positioner", async () => {
    const root = renderTooltipWithPositioner();

    createTooltip(root);
    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    expect(getPopup().getAttribute("data-side")).toBe("right");
    expect(getPopup().getAttribute("data-align")).toBe("end");
    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPopup().parentElement).toBe(getPositioner());
    expect(getPositioner().style.position).toBe("fixed");
  });

  it("restores portaled positioner content and clears floating styles after close animations", async () => {
    const root = renderTooltipWithPositioner();
    const tooltip = createTooltip(root);

    dispatchPointer(getTrigger(), "pointerenter");
    await waitForFloatingPosition();

    const animationFinished = createDeferred<void>();
    vi.spyOn(getPopup(), "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPositioner().style.position).toBe("fixed");

    tooltip.close();
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

  it("skips Astro-injected scripts when resolving asChild trigger targets", async () => {
    const root = renderTooltipWithAsChildTriggerAndAstroScript();
    const script = document.querySelector<HTMLScriptElement>("#astro-module-script")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    const tooltip = createTooltip(root);

    expect(script.getAttribute("aria-describedby")).toBeNull();
    expect(trigger.getAttribute("aria-describedby")).toBe(getPopup().id);

    dispatchPointer(trigger, "pointerenter");
    await waitForFloatingPosition();

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(trigger.getAttribute("data-state")).toBe("open");
  });

  it("opens asChild tooltips from the direct trigger target without relying on wrapper bubbling", async () => {
    const root = renderTooltipWithAsChildTriggerAndAstroScript();
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    const tooltip = createTooltip(root);

    trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await waitForFloatingPosition();

    expect(tooltip.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(trigger.getAttribute("data-state")).toBe("open");
  });

  it("positions nested Astro asChild tooltip triggers from the real control box", async () => {
    const root = renderTooltipWithNestedAstroAsChildTrigger();
    const trigger = document.querySelector<HTMLButtonElement>("#nested-as-child-trigger")!;

    const tooltip = createTooltip(root);

    expect(trigger.getAttribute("aria-describedby")).toBe(getPopup().id);

    dispatchPointer(trigger, "pointerenter");
    await waitForFloatingPosition();

    const triggerRect = trigger.getBoundingClientRect();
    const popupRect = getPopup().getBoundingClientRect();
    const horizontalGap = popupRect.left - triggerRect.right;
    const verticalCenterDelta = Math.abs(
      popupRect.top + popupRect.height / 2 - (triggerRect.top + triggerRect.height / 2),
    );

    expect(tooltip.getOpen()).toBe(true);
    expect(horizontalGap).toBeGreaterThanOrEqual(7);
    expect(horizontalGap).toBeLessThan(32);
    expect(verticalCenterDelta).toBeLessThanOrEqual(4);
  });

  it("keeps tooltip popup content unfocusable and warns about interactive descendants", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const root = renderTooltipWithInteractiveContent();

      createTooltip(root);

      expect(getPopup().hasAttribute("tabindex")).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("Tooltip content must stay non-interactive"),
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Popover or Dialog"));
    } finally {
      warn.mockRestore();
    }
  });

  it("requires a tooltip popup element", () => {
    const root = document.createElement("div");
    root.setAttribute("data-sw-tooltip", "");
    root.innerHTML = `<button data-sw-tooltip-trigger>Show tooltip</button>`;
    document.body.append(root);

    expect(() => createTooltip(root)).toThrow(
      "Tooltip requires a [data-sw-tooltip-popup] element.",
    );
  });

  it("initializes raw HTML tooltips through initStarwind", () => {
    const root = renderTooltip();
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

function renderTooltip(
  options: { closeDelay?: number; contentHoverable?: boolean; openDelay?: number } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-tooltip
      ${
        options.contentHoverable === false
          ? 'data-content-hoverable="false"'
          : "data-content-hoverable"
      }
      data-open-delay="${options.openDelay ?? 0}"
      data-close-delay="${options.closeDelay ?? 0}"
    >
      <button data-sw-tooltip-trigger>Show tooltip</button>
      <div data-sw-tooltip-popup data-side="top" data-align="center">
        Tooltip content
        <div data-sw-tooltip-arrow></div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderTooltipWithPositioner(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-tooltip data-open-delay="0">
      <button data-sw-tooltip-trigger>Show tooltip</button>
      <div
        data-sw-tooltip-positioner
        data-side="right"
        data-align="end"
        data-side-offset="12"
        data-avoid-collisions="false"
      >
        <div data-sw-tooltip-popup>Tooltip content</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderTooltipWithPositionerAndSiblingArrow(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-tooltip data-open-delay="0" data-close-delay="0">
      <button data-sw-tooltip-trigger>Show tooltip</button>
      <div
        data-sw-tooltip-positioner
        data-side="right"
        data-align="center"
        data-side-offset="8"
        data-avoid-collisions="false"
      >
        <div data-sw-tooltip-popup>Tooltip content</div>
        <div data-sw-tooltip-arrow></div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderTooltipWithAsChildTriggerAndAstroScript(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-tooltip data-open-delay="0">
      <span data-sw-tooltip-trigger data-as-child>
        <script id="astro-module-script" type="module"></script>
        <button id="as-child-trigger" type="button">Show tooltip</button>
      </span>
      <div data-sw-tooltip-popup data-side="top" data-align="center">Tooltip content</div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderTooltipWithNestedAstroAsChildTrigger(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-tooltip data-open-delay="0">
      <span data-sw-tooltip-trigger data-as-child>
        <div style="display: contents">
          <button
            id="nested-as-child-trigger"
            type="button"
            style="position: absolute; left: 120px; top: 140px; width: 40px; height: 40px;"
          >
            Home
          </button>
        </div>
      </span>
      <div
        data-sw-tooltip-popup
        data-side="right"
        data-align="center"
        data-side-offset="8"
        data-avoid-collisions="false"
      >
        Home
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderTooltipWithInteractiveContent(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-tooltip data-open-delay="0">
      <button data-sw-tooltip-trigger>Show tooltip</button>
      <div data-sw-tooltip-popup tabindex="0">
        Tooltip content
        <button id="tooltip-action">Take action</button>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function dispatchPointer(element: HTMLElement, type: string, init: PointerEventInit = {}): void {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse", ...init }));
}

function getRoot(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-tooltip]")!;
}

function getTrigger(root: ParentNode = document): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>("[data-sw-tooltip-trigger]")!;
}

function getPopup(root: ParentNode = document): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-tooltip-popup]")!;
}

function getArrow(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-tooltip-arrow]")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-tooltip-positioner]")!;
}

function dispatchScrollUpdate(): void {
  window.dispatchEvent(new Event("scroll"));
  window.visualViewport?.dispatchEvent(new Event("scroll"));
}

function mockRect(
  element: HTMLElement,
  getRect: () => Pick<DOMRectInit, "height" | "width" | "x" | "y">,
) {
  return vi.spyOn(element, "getBoundingClientRect").mockImplementation(() => {
    const rect = getRect();
    return DOMRect.fromRect({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    });
  });
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

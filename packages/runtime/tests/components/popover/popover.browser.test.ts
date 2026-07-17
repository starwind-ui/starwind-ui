import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createPopover } from "../../../src/components/popover/popover";

describe("createPopover", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("style");
    vi.useRealTimers();
  });

  it("does not lock body scroll by default while open", () => {
    const popover = createPopover(renderPopover());

    getTrigger().click();

    expect(popover.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getCloseButton().click();

    expect(popover.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("locks body scroll when modal and releases it on close or destroy", () => {
    const popover = createPopover(renderPopover({ modal: true }));

    getTrigger().click();

    expect(popover.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    popover.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    popover.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    popover.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("locks body scroll when modal and default-open, then releases it on destroy", () => {
    const popover = createPopover(renderPopover({ defaultOpen: true, modal: true }));

    expect(popover.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    popover.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("opens initially from defaultOpen options without emitting open-change", () => {
    const root = renderPopover();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const popover = createPopover(root, { defaultOpen: true });

    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(root.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(listener).not.toHaveBeenCalled();

    popover.destroy();
  });

  it("does not lock body scroll when a modal popover opens from hover", async () => {
    const popover = createPopover(renderPopover({ modal: true, openOnHover: true }));

    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );
    await waitForFloatingPosition();

    expect(popover.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("uses closeDelay for hover exits and cancels pending close on re-hover", () => {
    vi.useFakeTimers();
    const root = renderPopover({ closeDelay: 500, openOnHover: true });
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const popover = createPopover(root);

    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );
    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    getTrigger().dispatchEvent(
      new PointerEvent("pointerleave", { bubbles: false, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(499);
    expect(popover.getOpen()).toBe(true);

    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(1);
    expect(popover.getOpen()).toBe(true);

    getPopup().dispatchEvent(
      new PointerEvent("pointerleave", { bubbles: false, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(500);

    expect(popover.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "trigger-hover" }),
      }),
    );
  });

  it("keeps controlled modal hover opens non-locking when open is applied later", async () => {
    const onOpenChange = vi.fn();
    const popover = createPopover(renderPopover({ modal: true, openOnHover: true }), {
      onOpenChange,
      open: false,
    });

    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-hover" }),
    );
    expect(popover.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    popover.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    expect(popover.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("releases modal body scroll lock through close button, outside interaction, and Escape", () => {
    const popover = createPopover(renderPopover({ modal: true }));

    getTrigger().click();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getCloseButton().click();

    expect(popover.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getTrigger().click();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(popover.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getTrigger().click();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(popover.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps another modal lock active after an opt-in modal popover closes", () => {
    const first = createPopover(renderPopover({ modal: true }));
    const second = createPopover(renderPopover({ modal: true }));

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    second.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    first.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("initializes closed by default with ARIA wiring and opens from the trigger", async () => {
    const root = renderPopover();

    const popover = createPopover(root);

    expect(popover.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().getAttribute("role")).toBe("dialog");
    expect(getPopup().getAttribute("aria-labelledby")).toBe(getTitle().id);
    expect(getPopup().getAttribute("aria-describedby")).toBe(getDescription().id);
    expect(getTrigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(getTrigger().getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPopup().getAttribute("data-state")).toBe("closed");

    getTrigger().click();
    await waitForFloatingPosition();

    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(getTrigger().getAttribute("data-state")).toBe("open");
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(getPopup().style.position).toBe("fixed");
    expect(getPopup().style.left).not.toBe("");
    expect(getPopup().style.top).not.toBe("");
  });

  it("keeps collision-aware content from shifting across its trigger", async () => {
    const root = renderPopover();
    const trigger = getTrigger();
    const popup = getPopup();
    trigger.style.position = "fixed";
    trigger.style.left = "100px";
    trigger.style.top = "50vh";
    trigger.style.width = "120px";
    trigger.style.height = "32px";
    popup.style.width = "240px";
    popup.style.height = "calc(50vh + 24px)";
    popup.style.maxHeight = "var(--sw-floating-available-height)";

    createPopover(root);
    trigger.click();
    await waitForFloatingPosition();

    const triggerRect = trigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    expect(popupRect.bottom <= triggerRect.top || popupRect.top >= triggerRect.bottom).toBe(true);
    expect(popupRect.top).toBeGreaterThanOrEqual(8);
    expect(popupRect.bottom).toBeLessThanOrEqual(window.innerHeight - 8);
  });

  it("preserves document scroll while moving focus into the opened popup", async () => {
    const root = renderPopover();
    const firstControl = document.createElement("input");
    firstControl.setAttribute("aria-label", "Saturation");
    getPopup().prepend(firstControl);
    const focus = vi.spyOn(firstControl, "focus");

    const pageSpacer = document.createElement("div");
    pageSpacer.style.height = "2000px";
    document.body.append(pageSpacer);
    createPopover(root);
    window.scrollTo(0, 300);
    await waitForAnimationFrame();
    const scrollY = window.scrollY;
    expect(scrollY).toBeGreaterThan(0);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(firstControl);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(window.scrollY).toBe(scrollY);

    window.scrollTo(0, 0);
  });

  it("syncs optional backdrop visibility and state with the popover", () => {
    const popover = createPopover(renderPopover({ withBackdrop: true }));

    expect(getBackdrop().hidden).toBe(true);
    expect(getBackdrop().getAttribute("data-state")).toBe("closed");

    getTrigger().click();

    expect(popover.getOpen()).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(getBackdrop().getAttribute("data-state")).toBe("open");

    getCloseButton().click();

    expect(popover.getOpen()).toBe(false);
    expect(getBackdrop().hidden).toBe(true);
    expect(getBackdrop().getAttribute("data-state")).toBe("closed");
  });

  it.each([
    ["disabled", () => getTrigger().setAttribute("disabled", "")],
    ["aria-disabled", () => getTrigger().setAttribute("aria-disabled", "true")],
    ["data-disabled", () => getTrigger().setAttribute("data-disabled", "")],
  ])("ignores %s triggers across click, keyboard, and hover activation", (_label, disable) => {
    const popover = createPopover(renderPopover({ openOnHover: true }));
    disable();

    getTrigger().dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );

    expect(popover.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("opens from the active trigger without marking sibling triggers open", async () => {
    const root = renderPopoverWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();

    createPopover(root);
    firstTrigger.click();
    await waitForFloatingPosition();

    expect(firstTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(firstTrigger.getAttribute("data-state")).toBe("open");
    expect(secondTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(secondTrigger.getAttribute("data-state")).toBe("closed");
    expect(getPopup().getAttribute("aria-labelledby")).toBe(firstTrigger.id);
    expect(getPopup().style.left).toBe("80px");
    expect(getPopup().style.top).toBe("134px");
  });

  it("switches the active trigger and anchor instead of closing from a sibling trigger", async () => {
    const root = renderPopoverWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();
    const popover = createPopover(root);

    firstTrigger.click();
    await waitForFloatingPosition();
    secondTrigger.click();
    await waitForFloatingPosition();

    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(firstTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(firstTrigger.getAttribute("data-state")).toBe("closed");
    expect(secondTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(secondTrigger.getAttribute("data-state")).toBe("open");
    expect(getPopup().getAttribute("aria-labelledby")).toBe(secondTrigger.id);
    expect(getPopup().style.left).toBe("220px");
    expect(getPopup().style.top).toBe("134px");
  });

  it("preserves the original focus fallback when switching triggers while open", async () => {
    const root = renderPopoverWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();

    createPopover(root);
    firstTrigger.focus();
    firstTrigger.click();
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getCloseButton());

    secondTrigger.click();
    await waitForFloatingPosition();
    secondTrigger.remove();
    getCloseButton().click();

    expect(document.activeElement).toBe(firstTrigger);
  });

  it("restores focus to the active trigger after popup focus moved inside", async () => {
    const root = renderPopoverWithMultipleTriggers();
    const [firstTrigger] = getTriggers();

    createPopover(root);
    firstTrigger.focus();
    firstTrigger.click();
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getCloseButton());

    getCloseButton().click();

    expect(document.activeElement).toBe(firstTrigger);
  });

  it("resolves asChild trigger wrappers to the child control", async () => {
    const root = renderPopoverWithAsChildTrigger();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    const script = document.querySelector<HTMLScriptElement>("#astro-module-script")!;
    const wrapper = document.querySelector<HTMLElement>("#as-child-wrapper")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    const popover = createPopover(root);

    expect(script.hasAttribute("data-sw-popover-trigger")).toBe(false);
    expect(trigger.hasAttribute("data-sw-popover-trigger")).toBe(true);
    expect(trigger.classList.contains("starwind-popover-trigger")).toBe(true);
    expect(trigger.classList.contains("extra-trigger-class")).toBe(true);
    expect(trigger.style.getPropertyValue("--trigger-offset")).toBe("2px");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getPopup().getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(wrapper.hasAttribute("data-sw-popover-trigger")).toBe(false);
    expect(wrapper.style.display).toBe("contents");

    trigger.click();
    await waitForFloatingPosition();

    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press", trigger }),
      }),
    );
  });

  it("closes from close buttons, outside interactions, and Escape", () => {
    const root = renderPopover();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    createPopover(root);
    getTrigger().click();
    getCloseButton().click();

    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "close-press" }),
      }),
    );

    getTrigger().click();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
      }),
    );

    expect(getPopup().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "outside-press" }),
      }),
    );

    getTrigger().click();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(getPopup().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "escape-key" }),
      }),
    );
  });

  it("allows open changes and close intents to be canceled before DOM state changes", () => {
    const root = renderPopover();
    const openChangeListener = vi.fn((event: Event) => event.preventDefault());
    root.addEventListener("starwind:open-change", openChangeListener);

    createPopover(root);
    getTrigger().click();

    expect(openChangeListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press" }),
      }),
    );
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");

    root.removeEventListener("starwind:open-change", openChangeListener);
    getTrigger().click();
    root.addEventListener("starwind:outside-interact", (event) => event.preventDefault());
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(getPopup().hidden).toBe(false);
  });

  it("allows onOpenChange details cancellation before Popover state changes", () => {
    const root = renderPopover();
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

    const popover = createPopover(root, { onOpenChange });
    const subscriber = vi.fn();
    popover.subscribe("openChange", subscriber);
    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        reason: "trigger-press",
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(openChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(popover.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("registers global dismissal listeners only while popover instances are open", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const first = createPopover(renderPopover());
      const second = createPopover(renderPopover());

      expect(getDismissalListenerCalls(addListener)).toHaveLength(0);

      first.setOpen(true, { emit: false });

      expect(getDismissalListenerCalls(addListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);

      second.setOpen(true, { emit: false });

      expect(getDismissalListenerCalls(addListener)).toHaveLength(2);

      removeListener.mockClear();

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

  it("removes global dismissal listeners when an open popover is destroyed", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const popover = createPopover(renderPopover());

      popover.setOpen(true, { emit: false });
      removeListener.mockClear();

      popover.destroy();

      expect(getDismissalListenerCalls(removeListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);
    } finally {
      removeListener.mockRestore();
    }
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderPopover();
    const onOpenChange = vi.fn();
    const popover = createPopover(root, {
      onOpenChange,
      open: false,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(popover.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    popover.setOpen(true, { emit: false });

    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("does not retain canceled controlled close requests", async () => {
    const root = renderPopover({ modal: true });
    const closeAnimation = createDeferred();
    const closeCompleteListener = vi.fn();
    const onOpenChange = vi.fn((_open, details) => {
      details.cancel();
    });
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const popover = createPopover(root, {
      onOpenChange,
      open: true,
    });
    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    getCloseButton().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ isCanceled: true, reason: "close-press" }),
    );
    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    popover.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          open: false,
          reason: "imperative-action",
        }),
      }),
    );
  });

  it("updates active trigger identity in controlled mode when already open", async () => {
    const root = renderPopoverWithMultipleTriggers();
    const [firstTrigger, secondTrigger] = getTriggers();
    const onOpenChange = vi.fn();

    const popover = createPopover(root, {
      onOpenChange,
      open: true,
    });
    await waitForFloatingPosition();

    secondTrigger.click();
    await waitForFloatingPosition();

    expect(popover.getOpen()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, previousOpen: true, trigger: secondTrigger }),
    );
    expect(firstTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(secondTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(getPopup().style.left).toBe("220px");
  });

  it("moves a portaled popover when the active trigger changes floating roots", async () => {
    const root = renderPopoverWithMultipleTriggersInFloatingRoots();
    const [firstTrigger, secondTrigger] = getTriggers();
    const [firstFloatingRoot, secondFloatingRoot] = getFloatingRoots();

    createPopover(root);
    firstTrigger.click();
    await waitForFloatingPosition();

    expect(getPopup().parentElement).toBe(firstFloatingRoot);

    secondTrigger.click();
    await waitForFloatingPosition();

    expect(getPopup().parentElement).toBe(secondFloatingRoot);
  });

  it("keeps the popup mounted and portaled until its exit animation finishes", async () => {
    const root = renderPopover();
    const closeAnimation = createDeferred();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const popover = createPopover(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    popover.subscribe("closeComplete", closeCompleteSubscriber);
    getTrigger().click();

    expect(getPopup().parentElement).toBe(document.body);

    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    getCloseButton().click();

    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "close-press",
      trigger: getCloseButton(),
    });
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().parentElement).toBe(root);
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
    expect(closeCompleteSubscriber).toHaveBeenCalledWith(expectedDetails);
  });

  it("preserves the requested close reason for controlled close completion", async () => {
    const root = renderPopover();
    const closeAnimation = createDeferred();
    const onOpenChange = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const popover = createPopover(root, {
      onOpenChange,
      open: true,
    });

    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    const closeButton = getCloseButton();
    closeButton.click();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ open: false, reason: "close-press", trigger: closeButton }),
    );
    expect(popover.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    popover.setOpen(false, { emit: false });

    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(false);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          open: false,
          reason: "close-press",
          trigger: closeButton,
        }),
      }),
    );
  });

  it("uses popup placement attributes when no primitive positioner exists", async () => {
    const root = renderPopover();

    createPopover(root);
    getTrigger().click();
    await waitForFloatingPosition();

    expect(getPopup().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().getAttribute("data-align")).toBe("start");
  });

  it("prefers primitive positioner placement attributes over conflicting popup attributes", async () => {
    const root = renderPopoverWithPositioner();

    createPopover(root);
    getTrigger().click();
    await waitForFloatingPosition();

    expect(getPopup().getAttribute("data-side")).toBe("right");
    expect(getPopup().getAttribute("data-align")).toBe("end");
    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPopup().parentElement).toBe(getPositioner());
    expect(getPositioner().style.position).toBe("fixed");
  });

  it("treats nested popover content as inside the parent popover tree", async () => {
    const { childPopup, childRoot, childTrigger, parentPopup, parentRoot, parentTrigger } =
      renderNestedPopover();

    const parent = createPopover(parentRoot);
    const child = createPopover(childRoot);

    parentTrigger.click();
    await waitForFloatingPosition();
    childTrigger.click();
    await waitForFloatingPosition();

    childPopup.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(parent.getOpen()).toBe(true);
    expect(parentPopup.hidden).toBe(false);
    expect(child.getOpen()).toBe(true);
    expect(childPopup.hidden).toBe(false);
  });

  it("closes open nested popovers when the parent popover closes", async () => {
    const { childPopup, childRoot, childTrigger, parentPopup, parentRoot, parentTrigger } =
      renderNestedPopover();

    const parent = createPopover(parentRoot);
    const child = createPopover(childRoot);

    parentTrigger.click();
    await waitForFloatingPosition();
    childTrigger.click();
    await waitForFloatingPosition();

    parentTrigger.click();

    expect(parent.getOpen()).toBe(false);
    expect(parentPopup.hidden).toBe(true);
    expect(child.getOpen()).toBe(false);
    expect(childPopup.hidden).toBe(true);
  });

  it("initializes raw HTML popovers through initStarwind", () => {
    const root = renderPopover();
    const cleanup = initStarwind(document);

    getTrigger().click();

    expect(getPopup().hidden).toBe(false);

    cleanup.destroy();

    expect(getPopup().hidden).toBe(true);

    getTrigger().click();

    expect(getPopup().hidden).toBe(true);
    expect(root.getAttribute("data-state")).toBe("closed");
  });

  it("requires a popover popup element", () => {
    const root = renderPopover();
    getPopup().remove();

    expect(() => createPopover(root)).toThrow(
      "Popover requires a [data-sw-popover-popup] element.",
    );
  });
});

function renderPopover({
  closeDelay,
  defaultOpen,
  modal,
  openOnHover,
  withBackdrop,
}: {
  closeDelay?: number;
  defaultOpen?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  withBackdrop?: boolean;
} = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-popover
      ${defaultOpen ? "data-default-open" : ""}
      ${modal === undefined ? "" : `data-modal="${String(modal)}"`}
      ${openOnHover ? "data-open-on-hover" : ""}
      ${closeDelay === undefined ? "" : `data-close-delay="${closeDelay}"`}
    >
      <button data-sw-popover-trigger>Open popover</button>
      ${withBackdrop ? "<div data-sw-popover-backdrop hidden></div>" : ""}
      <div data-sw-popover-popup data-side="bottom" data-align="start">
        <h2 data-sw-popover-title>Popover title</h2>
        <p data-sw-popover-description>Popover description</p>
        <button data-sw-popover-close>Close</button>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPopoverWithMultipleTriggers(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-popover>
      <button
        data-sw-popover-trigger
        style="position: fixed; left: 80px; top: 100px; width: 60px; height: 30px"
      >
        First trigger
      </button>
      <button
        data-sw-popover-trigger
        style="position: fixed; left: 220px; top: 100px; width: 60px; height: 30px"
      >
        Second trigger
      </button>
      <div
        data-sw-popover-popup
        data-side="bottom"
        data-align="start"
        data-side-offset="4"
        data-avoid-collisions="false"
        style="width: 120px; height: 80px"
      >
        <button data-sw-popover-close>Close</button>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPopoverWithMultipleTriggersInFloatingRoots(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-popover>
      <div data-floating-root>
        <button
          data-sw-popover-trigger
          style="position: fixed; left: 80px; top: 100px; width: 60px; height: 30px"
        >
          First trigger
        </button>
      </div>
      <div data-floating-root>
        <button
          data-sw-popover-trigger
          style="position: fixed; left: 220px; top: 100px; width: 60px; height: 30px"
        >
          Second trigger
        </button>
      </div>
      <div
        data-sw-popover-popup
        data-side="bottom"
        data-align="start"
        data-side-offset="4"
        data-avoid-collisions="false"
        style="width: 120px; height: 80px"
      >
        <button data-sw-popover-close>Close</button>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderPopoverWithAsChildTrigger(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-popover>
      <div
        id="as-child-wrapper"
        class="starwind-popover-trigger extra-trigger-class"
        style="--trigger-offset: 2px"
        data-as-child
        data-slot="popover-trigger"
        data-sw-popover-trigger
      >
        <script id="astro-module-script" type="module"></script>
        <button id="as-child-trigger" type="button">Open popover</button>
      </div>
      <div data-sw-popover-popup data-side="bottom" data-align="start">
        <p>Popover body</p>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNestedPopover(): {
  childPopup: HTMLElement;
  childRoot: HTMLElement;
  childTrigger: HTMLButtonElement;
  parentPopup: HTMLElement;
  parentRoot: HTMLElement;
  parentTrigger: HTMLButtonElement;
} {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-popover id="parent-popover">
      <button data-sw-popover-trigger id="parent-trigger">Open parent</button>
      <div data-sw-popover-popup id="parent-popup" data-side="bottom" data-align="start">
        <div data-sw-popover id="child-popover">
          <button data-sw-popover-trigger id="child-trigger">Open child</button>
          <div data-sw-popover-popup id="child-popup" data-side="right" data-align="start">
            Child content
          </div>
        </div>
      </div>
    </div>
  `;

  const parentRoot = wrapper.firstElementChild as HTMLElement;
  document.body.append(parentRoot);

  return {
    childPopup: document.querySelector<HTMLElement>("#child-popup")!,
    childRoot: document.querySelector<HTMLElement>("#child-popover")!,
    childTrigger: document.querySelector<HTMLButtonElement>("#child-trigger")!,
    parentPopup: document.querySelector<HTMLElement>("#parent-popup")!,
    parentRoot,
    parentTrigger: document.querySelector<HTMLButtonElement>("#parent-trigger")!,
  };
}

function renderPopoverWithPositioner(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-popover>
      <button data-sw-popover-trigger>Open popover</button>
      <div
        data-sw-popover-positioner
        data-side="right"
        data-align="end"
        data-side-offset="12"
        data-avoid-collisions="false"
      >
        <div data-sw-popover-popup data-side="top" data-align="start" data-side-offset="0">
          <h2 data-sw-popover-title>Popover title</h2>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
}

function getTriggers(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sw-popover-trigger]"));
}

function getFloatingRoots(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-floating-root]"));
}

function getPopup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
}

function getTitle(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-popover-title]")!;
}

function getDescription(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-popover-description]")!;
}

function getBackdrop(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-popover-backdrop]")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-popover-positioner]")!;
}

function getCloseButton(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-popover-close]")!;
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
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
  await waitForAnimationFrame();
  await waitForMicrotasks();
}

async function waitForAnimationFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

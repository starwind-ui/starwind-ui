import { beforeEach, describe, expect, it, vi } from "vitest";

import { createContextMenu } from "../../../src/components/context-menu/context-menu";

describe("createContextMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("style");
    window.scrollTo(0, 0);
    vi.useRealTimers();
  });

  it("locks body scroll by default while open", async () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    expect(contextMenu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getItem().click();

    expect(contextMenu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("opens initially from defaultOpen options and raw data-default-open without emitting", async () => {
    const optionRoot = renderContextMenu();
    const optionPopup = getPopup();
    const optionTrigger = getTrigger(optionRoot);
    const onOpenChange = vi.fn();
    const optionDomListener = vi.fn();
    optionRoot.addEventListener("starwind:open-change", optionDomListener);

    const optionMenu = createContextMenu(optionRoot, { defaultOpen: true, onOpenChange });

    await waitForFloatingPosition();

    expect(optionMenu.getOpen()).toBe(true);
    expect(optionPopup.hidden).toBe(false);
    expect(optionRoot.getAttribute("data-state")).toBe("open");
    expect(optionPopup.getAttribute("data-state")).toBe("open");
    expect(optionTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(optionDomListener).not.toHaveBeenCalled();

    optionMenu.destroy();
    document.body.innerHTML = "";
    document.body.removeAttribute("data-sw-scroll-locked");

    const rawRoot = renderContextMenu();
    rawRoot.setAttribute("data-default-open", "true");
    const rawPopup = getPopup();
    const rawTrigger = getTrigger(rawRoot);
    const rawDomListener = vi.fn();
    rawRoot.addEventListener("starwind:open-change", rawDomListener);

    const rawMenu = createContextMenu(rawRoot);

    await waitForFloatingPosition();

    expect(rawMenu.getOpen()).toBe(true);
    expect(rawPopup.hidden).toBe(false);
    expect(rawRoot.getAttribute("data-state")).toBe("open");
    expect(rawPopup.getAttribute("data-state")).toBe("open");
    expect(rawTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(rawDomListener).not.toHaveBeenCalled();

    rawMenu.destroy();
  });

  it("leaves body scroll unlocked when modal is disabled", async () => {
    const root = renderContextMenu({ modal: false });
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    expect(contextMenu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("releases a default modal lock when destroyed while open", async () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    contextMenu.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("creates one hidden anchor and removes it on destroy", () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    expect(document.querySelectorAll("[data-sw-context-menu-anchor]")).toHaveLength(1);
    expect(getContextMenuAnchor().style.position).toBe("absolute");
    expect(getContextMenuAnchor().style.pointerEvents).toBe("none");
    expect(createContextMenu(root)).toBe(contextMenu);
    expect(document.querySelectorAll("[data-sw-context-menu-anchor]")).toHaveLength(1);

    contextMenu.destroy();

    expect(document.querySelector("[data-sw-context-menu-anchor]")).toBeNull();
  });

  it("keeps an existing document lock active after a default modal context menu closes", async () => {
    const externalRoot = renderContextMenu();
    const contextRoot = renderContextMenu();
    const externalContextMenu = createContextMenu(externalRoot);
    const contextMenu = createContextMenu(contextRoot);

    openFromPointer(externalRoot, 120, 140);
    await waitForFloatingPosition();
    openFromPointer(contextRoot, 220, 240);
    await waitForFloatingPosition();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    contextMenu.close();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    externalContextMenu.close();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps a non-modal pointer-opened menu attached to its invocation point while scrolling", async () => {
    document.body.style.minHeight = "2000px";
    const root = renderContextMenu({ modal: false });
    createContextMenu(root);

    openFromPointer(root, 120, 300);
    await waitForFloatingPosition();

    const initialTop = readPopupTop();

    await scrollAndWait(80);

    expect(readPopupTop()).toBe(initialTop - 80);
  });

  it("keeps a non-modal pointer-opened menu attached when opened after scrolling", async () => {
    document.body.style.minHeight = "2000px";
    const root = renderContextMenu({ modal: false });
    createContextMenu(root);

    await scrollAndWait(120);
    openFromPointer(root, 120, 300);
    await waitForFloatingPosition();

    const initialTop = readPopupTop();

    await scrollAndWait(190);

    expect(readPopupTop()).toBe(initialTop - 70);
  });

  it("keeps a non-modal keyboard-opened menu attached to its trigger point while scrolling", async () => {
    document.body.style.minHeight = "2000px";
    const root = renderContextMenu({ modal: false });
    const trigger = getTrigger(root);
    createContextMenu(root);
    mockRect(trigger, { height: 30, width: 180, x: 80, y: 160 });

    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ContextMenu" }));
    await waitForFloatingPosition();

    const initialTop = readPopupTop();

    await scrollAndWait(60);

    expect(readPopupTop()).toBe(initialTop - 60);
  });

  it("keeps a non-modal touch-opened menu attached to its invocation point while scrolling", async () => {
    vi.useFakeTimers();
    document.body.style.minHeight = "2000px";
    const root = renderContextMenu({ modal: false });
    createContextMenu(root);

    dispatchTouchEvent(getTrigger(root), "touchstart", [{ clientX: 120, clientY: 300 }]);
    await vi.advanceTimersByTimeAsync(500);
    vi.useRealTimers();
    await waitForFloatingPosition();

    const initialTop = readPopupTop();

    await scrollAndWait(70);

    expect(readPopupTop()).toBe(initialTop - 70);
  });

  it("opens from a contextmenu event at the pointer position", async () => {
    const root = renderContextMenu();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root);
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 140,
    });

    getTrigger().dispatchEvent(event);
    await waitForFloatingPosition();

    const firstPosition = readPopupPosition();

    expect(event.defaultPrevented).toBe(true);
    expect(contextMenu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(getPopup().style.position).toBe("fixed");
    expect(firstPosition.left).not.toBe("");
    expect(firstPosition.top).not.toBe("");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press" }),
      }),
    );

    getTrigger().dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 220,
        clientY: 240,
      }),
    );
    await waitForFloatingPosition();

    const secondPosition = readPopupPosition();

    expect(secondPosition.left).not.toBe(firstPosition.left);
    expect(secondPosition.top).not.toBe(firstPosition.top);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getTrigger().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));

    expect(contextMenu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getTrigger().dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 320,
        clientY: 340,
      }),
    );
    await waitForFloatingPosition();

    const thirdPosition = readPopupPosition();

    expect(thirdPosition.left).not.toBe(secondPosition.left);
    expect(thirdPosition.top).not.toBe(secondPosition.top);
    expect(listener).toHaveBeenCalledTimes(1);

    contextMenu.close();

    expect(contextMenu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("repositions on secondary invocation without notifying open-change subscribers", async () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);
    const subscriber = vi.fn();
    contextMenu.subscribe("openChange", subscriber);

    openFromPointer(root, 120, 140);
    await waitForFloatingPosition();
    const firstPosition = readPopupPosition();

    expect(subscriber).toHaveBeenCalledTimes(1);

    openFromPointer(root, 260, 280);
    await waitForFloatingPosition();
    const secondPosition = readPopupPosition();

    expect(contextMenu.getOpen()).toBe(true);
    expect(secondPosition.left).not.toBe(firstPosition.left);
    expect(secondPosition.top).not.toBe(firstPosition.top);
    expect(subscriber).toHaveBeenCalledTimes(1);

    contextMenu.close();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps the popup mounted while close animations finish and forwards closeComplete details", () => {
    vi.useFakeTimers();
    const root = renderContextMenu();
    const popup = getPopup();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);
    popup.style.animationDuration = "200ms";
    Object.defineProperty(popup, "getAnimations", {
      configurable: true,
      value: () => [],
    });
    const contextMenu = createContextMenu(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    contextMenu.subscribe("closeComplete", closeCompleteSubscriber);

    openFromPointer(root, 120, 140);

    expect(contextMenu.getOpen()).toBe(true);
    expect(popup.hidden).toBe(false);
    expect(popup.parentElement).toBe(document.body);

    getItem().click();

    expect(contextMenu.getOpen()).toBe(false);
    expect(popup.getAttribute("data-state")).toBe("closed");
    expect(popup.hidden).toBe(false);
    expect(popup.parentElement).toBe(document.body);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);

    expect(popup.hidden).toBe(false);

    vi.advanceTimersByTime(1);

    expect(popup.hidden).toBe(true);
    expect(popup.parentElement).toBe(root);
    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "item-press",
    });
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
    expect(closeCompleteSubscriber).toHaveBeenCalledWith(expectedDetails);
  });

  it("allows onOpenChange details cancellation before Context Menu state changes", () => {
    const root = renderContextMenu();
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

    const contextMenu = createContextMenu(root, { onOpenChange });
    const subscriber = vi.fn();
    contextMenu.subscribe("openChange", subscriber);
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 140,
    });

    getTrigger().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        reason: "trigger-press",
        trigger: getTrigger(),
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(openChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("allows starwind:open-change preventDefault before Context Menu state changes", () => {
    const root = renderContextMenu();
    root.addEventListener("starwind:open-change", (event) => event.preventDefault());

    const contextMenu = createContextMenu(root);
    const subscriber = vi.fn();
    contextMenu.subscribe("openChange", subscriber);
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 140,
    });

    getTrigger().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(subscriber).not.toHaveBeenCalled();
    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("closes from a primary pointer press in the trigger region outside the popup", async () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    getTrigger().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));

    expect(contextMenu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("closes from a primary pointer press in the root region outside the popup", async () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    getRootSurface().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));

    expect(contextMenu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps the menu open on primary pointer press inside the popup", async () => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    getPopup().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));

    expect(contextMenu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
  });

  it("keeps the menu open on primary pointer press inside a positioned popup surface", async () => {
    const root = renderContextMenu({ withPositioner: true });
    const contextMenu = createContextMenu(root);

    openFromPointer();
    await waitForFloatingPosition();

    getPositioner().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));

    expect(contextMenu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
  });

  it("does not open or prevent the native context menu when the root is disabled", () => {
    const root = renderContextMenu({ disabled: true });
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root);
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 140,
    });

    getTrigger().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not open from contextmenu when initialized disabled", () => {
    const root = renderContextMenu();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root, { disabled: true });
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 140,
    });

    getTrigger().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    ["ContextMenu", { key: "ContextMenu" }],
    ["Shift+F10", { key: "F10", shiftKey: true }],
  ])("does not open from %s when the root is disabled", (_, init) => {
    const root = renderContextMenu({ disabled: true });
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root);
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });

    getTrigger().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    ["ContextMenu", { key: "ContextMenu" }],
    ["Shift+F10", { key: "F10", shiftKey: true }],
  ])("does not open from %s when initialized disabled", (_, init) => {
    const root = renderContextMenu();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root, { disabled: true });
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });

    getTrigger().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    ["ContextMenu", { key: "ContextMenu" }],
    ["Shift+F10", { key: "F10", shiftKey: true }],
  ])("opens from %s, moves focus to the first item, and delegates dismissal", async (_, init) => {
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
    await waitForFloatingPosition();

    expect(contextMenu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(getItem());
    expect(getItem().getAttribute("tabindex")).toBe("0");

    getItem().click();

    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("opens from a touch long press", () => {
    vi.useFakeTimers();
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    dispatchTouchEvent(getTrigger(), "touchstart", [{ clientX: 120, clientY: 140 }]);
    vi.advanceTimersByTime(500);

    expect(contextMenu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("does not open from a touch long press when initialized disabled", () => {
    vi.useFakeTimers();
    const root = renderContextMenu();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root, { disabled: true });

    dispatchTouchEvent(getTrigger(), "touchstart", [{ clientX: 120, clientY: 140 }]);
    vi.advanceTimersByTime(500);

    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not open from a touch long press when the root is disabled", () => {
    vi.useFakeTimers();
    const root = renderContextMenu({ disabled: true });
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root);

    dispatchTouchEvent(getTrigger(), "touchstart", [{ clientX: 120, clientY: 140 }]);
    vi.advanceTimersByTime(500);

    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not open from a pending touch long press after the root becomes disabled", () => {
    vi.useFakeTimers();
    const root = renderContextMenu();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const contextMenu = createContextMenu(root);

    dispatchTouchEvent(getTrigger(), "touchstart", [{ clientX: 120, clientY: 140 }]);
    root.setAttribute("data-disabled", "");
    vi.advanceTimersByTime(500);

    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not open from a touch long press after moving beyond the threshold", () => {
    vi.useFakeTimers();
    const root = renderContextMenu();
    const contextMenu = createContextMenu(root);

    dispatchTouchEvent(getTrigger(), "touchstart", [{ clientX: 120, clientY: 140 }]);
    dispatchTouchEvent(getTrigger(), "touchmove", [{ clientX: 131, clientY: 140 }]);
    vi.advanceTimersByTime(500);

    expect(contextMenu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });
});

function renderContextMenu(
  options: { disabled?: boolean; modal?: boolean; withPositioner?: boolean } = {},
): HTMLElement {
  const popup = `
    <div data-sw-menu-popup data-side="bottom" data-align="start">
      <div data-sw-menu-item>Account</div>
    </div>
  `;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-context-menu data-sw-menu${options.disabled ? " data-disabled" : ""}${options.modal === undefined ? "" : ` data-modal="${options.modal ? "true" : "false"}"`}>
      <div data-sw-context-menu-trigger data-sw-menu-trigger>Right click area</div>
      <div data-context-menu-root-surface>Root surface</div>
      ${
        options.withPositioner
          ? `<div data-sw-menu-portal><div data-sw-menu-positioner data-side="bottom" data-align="start">${popup}</div></div>`
          : popup
      }
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getTrigger(root: HTMLElement | Document = document): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-context-menu-trigger]")!;
}

function getPopup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-positioner]")!;
}

function getContextMenuAnchor(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-context-menu-anchor]")!;
}

function getRootSurface(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-context-menu-root-surface]")!;
}

function getItem(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-item]")!;
}

function dispatchTouchEvent(
  target: HTMLElement,
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, "touches", {
    value: touches,
  });

  target.dispatchEvent(event);
  return event;
}

function readPopupPosition(): { left: string; top: string } {
  return {
    left: getPopup().style.left,
    top: getPopup().style.top,
  };
}

function readPopupTop(): number {
  return Number.parseFloat(getPopup().style.top);
}

function openFromPointer(root: HTMLElement = document.body, clientX = 120, clientY = 140): void {
  getTrigger(root).dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    }),
  );
}

async function scrollAndWait(scrollY: number): Promise<void> {
  window.scrollTo(0, scrollY);
  window.dispatchEvent(new Event("scroll"));
  window.visualViewport?.dispatchEvent(new Event("scroll"));
  await waitForFloatingPosition();
}

function mockRect(element: HTMLElement, rect: Pick<DOMRectInit, "height" | "width" | "x" | "y">) {
  const domRect = DOMRect.fromRect({
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  });

  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(domRect);
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

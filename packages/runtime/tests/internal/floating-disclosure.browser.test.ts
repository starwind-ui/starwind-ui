import { beforeEach, describe, expect, it, vi } from "vitest";

import { type FloatingPositioner } from "../../src/internal/floating";
import { createFloatingDisclosureLifecycle } from "../../src/internal/floating-disclosure";
import { requestDialogOwnedFloatingPortalClose } from "../../src/internal/floating-portal";

type TestRequest = {
  event?: Event;
  reason: "imperative-action" | "outside-press" | "trigger-press";
  trigger?: Element;
};

describe("floating disclosure lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("data-sw-scroll-locked");
    document.body.removeAttribute("style");
    vi.useRealTimers();
  });

  it("opens through the shared portal, dismissal, positioning, and scroll-lock lifecycle", () => {
    const root = document.createElement("div");
    const trigger = document.createElement("button");
    const popup = document.createElement("div");
    const portalTarget = document.createElement("div");
    const originalParent = document.createElement("section");
    const positioner = createPositioner();
    let open = false;
    const closeRequests: TestRequest[] = [];

    root.append(trigger, originalParent);
    originalParent.append(popup);
    document.body.append(root, portalTarget);

    const lifecycle = createFloatingDisclosureLifecycle<TestRequest>({
      containsTarget: (target) => root.contains(target) || popup.contains(target),
      createFloatingPositioner: () => positioner,
      closeOnOutsideInteract: () => true,
      getFloatingReference: () => trigger,
      getOpen: () => open,
      getPortalTarget: () => portalTarget,
      isDestroyed: () => false,
      onOutsidePointerDown: (event) => {
        closeRequests.push({ event, reason: "outside-press" });
      },
      popup,
      renderState: (nextOpen) => {
        if (nextOpen) popup.hidden = false;
      },
      root,
      lockDocumentScroll: lockTestDocumentScroll,
      shouldLockDocumentScroll: () => true,
    });

    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger });

    expect(popup.parentElement).toBe(portalTarget);
    expect(popup.hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(positioner.update).toHaveBeenCalledTimes(1);
    expect(positioner.startAutoUpdate).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(closeRequests).toHaveLength(1);

    open = false;
    lifecycle.applyOpenState(false, closeRequests[0]);

    expect(popup.parentElement).toBe(originalParent);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(positioner.stopAutoUpdate).toHaveBeenCalledTimes(1);
  });

  it("aborts pending close completion when reopened before animations finish", () => {
    vi.useFakeTimers();
    const root = document.createElement("div");
    const trigger = document.createElement("button");
    const popup = document.createElement("div");
    const portalTarget = document.createElement("div");
    const originalParent = document.createElement("section");
    const onCloseComplete = vi.fn();
    let open = false;

    popup.style.transitionDuration = "1s";
    root.append(trigger, originalParent);
    originalParent.append(popup);
    document.body.append(root, portalTarget);

    const lifecycle = createFloatingDisclosureLifecycle<TestRequest>({
      containsTarget: (target) => root.contains(target) || popup.contains(target),
      createFloatingPositioner: () => createPositioner(),
      getFloatingReference: () => trigger,
      getOpen: () => open,
      getPortalTarget: () => portalTarget,
      isDestroyed: () => false,
      onCloseComplete,
      popup,
      renderState: (nextOpen) => {
        if (nextOpen) popup.hidden = false;
      },
      root,
    });

    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger });
    open = false;
    lifecycle.applyOpenState(false, { reason: "trigger-press", trigger });
    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger });
    vi.advanceTimersByTime(1000);

    expect(onCloseComplete).not.toHaveBeenCalled();
    expect(popup.parentElement).toBe(portalTarget);
    expect(popup.hidden).toBe(false);
  });

  it("cleans up pending close, dismissal, scroll lock, positioner, and portal state on destroy", () => {
    vi.useFakeTimers();
    const root = document.createElement("div");
    const trigger = document.createElement("button");
    const popup = document.createElement("div");
    const portalTarget = document.createElement("div");
    const originalParent = document.createElement("section");
    const positioner = createPositioner();
    const closeRequests: TestRequest[] = [];
    const onCloseComplete = vi.fn();
    let open = false;

    popup.style.transitionDuration = "1s";
    root.append(trigger, originalParent);
    originalParent.append(popup);
    document.body.append(root, portalTarget);

    const lifecycle = createFloatingDisclosureLifecycle<TestRequest>({
      closeOnOutsideInteract: () => true,
      containsTarget: (target) => root.contains(target) || popup.contains(target),
      createFloatingPositioner: () => positioner,
      getFloatingReference: () => trigger,
      getOpen: () => open,
      getPortalTarget: () => portalTarget,
      isDestroyed: () => false,
      onCloseComplete,
      onOutsidePointerDown: (event) => {
        closeRequests.push({ event, reason: "outside-press" });
      },
      popup,
      renderState: (nextOpen) => {
        if (nextOpen) popup.hidden = false;
      },
      root,
      lockDocumentScroll: lockTestDocumentScroll,
      shouldLockDocumentScroll: () => true,
    });

    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger });
    open = false;
    lifecycle.applyOpenState(false, { reason: "trigger-press", trigger });
    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger });
    lifecycle.destroy();
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    vi.advanceTimersByTime(1000);

    expect(closeRequests).toHaveLength(0);
    expect(onCloseComplete).not.toHaveBeenCalled();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(positioner.destroy).toHaveBeenCalledTimes(1);
    expect(popup.parentElement).toBe(originalParent);
  });

  it("replaces the floating positioner when the reference element changes", () => {
    const root = document.createElement("div");
    const firstTrigger = document.createElement("button");
    const secondTrigger = document.createElement("button");
    const popup = document.createElement("div");
    const portalTarget = document.createElement("div");
    const firstPositioner = createPositioner();
    const secondPositioner = createPositioner();
    const createdPositioners = [firstPositioner, secondPositioner];
    let reference = firstTrigger;
    let open = false;

    root.append(firstTrigger, secondTrigger, popup);
    document.body.append(root, portalTarget);

    const lifecycle = createFloatingDisclosureLifecycle<TestRequest>({
      containsTarget: (target) => root.contains(target) || popup.contains(target),
      createFloatingPositioner: () => createdPositioners.shift() ?? createPositioner(),
      getFloatingReference: () => reference,
      getOpen: () => open,
      getPortalTarget: () => portalTarget,
      isDestroyed: () => false,
      popup,
      renderState: (nextOpen) => {
        if (nextOpen) popup.hidden = false;
      },
      root,
    });

    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: firstTrigger });
    reference = secondTrigger;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: secondTrigger });

    expect(firstPositioner.destroy).toHaveBeenCalledTimes(1);
    expect(secondPositioner.update).toHaveBeenCalledTimes(1);
  });

  it("promotes inside a dialog and applies owner close through the disclosure lifecycle", () => {
    const dialog = document.createElement("dialog");
    const root = document.createElement("div");
    const trigger = document.createElement("button");
    const popup = document.createElement("div");
    const portalTarget = document.createElement("div");
    const originalParent = document.createElement("section");
    const closeIntents: TestRequest[] = [];
    let open = false;
    let lifecycle!: ReturnType<typeof createFloatingDisclosureLifecycle<TestRequest>>;
    dialog.setAttribute("data-slot", "dialog-content");
    portalTarget.setAttribute("data-floating-root", "");
    root.append(trigger, originalParent);
    originalParent.append(popup);
    dialog.append(root, portalTarget);
    document.body.append(dialog);
    dialog.showModal();

    lifecycle = createFloatingDisclosureLifecycle<TestRequest>({
      containsTarget: (target) => root.contains(target) || popup.contains(target),
      createFloatingPositioner: () => createPositioner(),
      getFloatingReference: () => trigger,
      getOpen: () => open,
      getPortalTarget: () => portalTarget,
      isDestroyed: () => false,
      onOwnerCloseRequest: () => {
        const request = { reason: "imperative-action" as const };
        closeIntents.push(request);
        open = false;
        lifecycle.applyOpenState(false, request);
      },
      popup,
      renderState: (nextOpen) => {
        popup.setAttribute("data-state", nextOpen ? "open" : "closed");
        if (nextOpen) popup.hidden = false;
      },
      root,
    });

    open = true;
    lifecycle.applyOpenState(true, { reason: "trigger-press", trigger });
    expect(popup.closest<HTMLElement>("[data-sw-floating-portal]")?.matches(":popover-open")).toBe(
      true,
    );

    requestDialogOwnedFloatingPortalClose(dialog);

    expect(closeIntents).toEqual([{ reason: "imperative-action" }]);
    expect(popup.getAttribute("data-state")).toBe("closed");
    expect(popup.parentElement).toBe(originalParent);
    expect(dialog.querySelector("[data-sw-floating-portal]")).toBeNull();

    lifecycle.destroy();
    dialog.close();
    dialog.remove();
  });
});

function createPositioner(): FloatingPositioner {
  return {
    destroy: vi.fn(),
    startAutoUpdate: vi.fn(),
    stopAutoUpdate: vi.fn(),
    update: vi.fn(async () => ({
      align: "center" as const,
      left: 0,
      side: "bottom" as const,
      top: 0,
    })),
  };
}

function lockTestDocumentScroll(ownerDocument: Document) {
  ownerDocument.body.setAttribute("data-sw-scroll-locked", "");

  return {
    release() {
      ownerDocument.body.removeAttribute("data-sw-scroll-locked");
    },
  };
}

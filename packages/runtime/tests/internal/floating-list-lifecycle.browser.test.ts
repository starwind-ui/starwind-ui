import { beforeEach, describe, expect, it, vi } from "vitest";

import { type FloatingPositioner } from "../../src/internal/floating";
import {
  createFloatingListLifecycle,
  runFloatingListOpenChangeShell,
} from "../../src/internal/floating-list-lifecycle";

type TestRequest = {
  event?: Event;
  reason: "escape-key" | "outside-press" | "trigger-press";
  trigger?: Element;
};

describe("floating list lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("data-sw-scroll-locked");
    document.body.removeAttribute("style");
  });

  it("opens through portal, dismissal, positioning, auto-update, and scroll-lock lifecycle", () => {
    const harness = createHarness();

    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });

    expect(harness.popup.parentElement).toBe(harness.portalTarget);
    expect(harness.popup.hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(harness.positioner.update).toHaveBeenCalledTimes(1);
    expect(harness.positioner.startAutoUpdate).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(harness.closeRequests).toEqual([expect.objectContaining({ reason: "outside-press" })]);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(harness.closeRequests).toEqual([
      expect.objectContaining({ reason: "outside-press" }),
      expect.objectContaining({ reason: "escape-key" }),
    ]);
  });

  it("keeps portal and dismissal lifecycle active when floating setup is opted out", () => {
    const createFloatingPositioner = vi.fn(() => createPositioner());
    const harness = createHarness({
      createFloatingPositioner,
      shouldUseFloating: () => false,
    });

    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });

    expect(harness.popup.parentElement).toBe(harness.portalTarget);
    expect(harness.popup.hidden).toBe(false);
    expect(createFloatingPositioner).not.toHaveBeenCalled();

    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(harness.closeRequests).toEqual([expect.objectContaining({ reason: "outside-press" })]);
  });

  it("keeps portaled content mounted until close animations finish", async () => {
    const harness = createHarness();
    const animationFinished = createDeferred<void>();
    vi.spyOn(harness.popup, "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });
    harness.open = false;
    harness.lifecycle.applyOpenState(false, { reason: "outside-press" });

    expect(harness.popup.parentElement).toBe(harness.portalTarget);
    expect(harness.popup.hidden).toBe(false);
    expect(harness.renderedStates).toEqual([true, false]);
    expect(harness.positioner.stopAutoUpdate).toHaveBeenCalledTimes(1);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(harness.closeCompleteRequests).toEqual([]);

    animationFinished.resolve();
    await animationFinished.promise;
    await waitForMicrotasks();

    expect(harness.popup.hidden).toBe(true);
    expect(harness.popup.parentElement).toBe(harness.originalParent);
    expect(harness.closeCompleteRequests).toEqual([
      expect.objectContaining({ reason: "outside-press" }),
    ]);
  });

  it("aborts pending close completion when reopened before animations finish", async () => {
    const harness = createHarness();
    const animationFinished = createDeferred<void>();
    vi.spyOn(harness.popup, "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });
    harness.open = false;
    harness.lifecycle.applyOpenState(false, { reason: "outside-press" });
    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });

    animationFinished.resolve();
    await animationFinished.promise;
    await waitForMicrotasks();

    expect(harness.popup.hidden).toBe(false);
    expect(harness.popup.parentElement).toBe(harness.portalTarget);
    expect(harness.closeCompleteRequests).toEqual([]);
  });

  it("cleans up portal, dismissal, scroll lock, close completion, and floating work on destroy", async () => {
    const harness = createHarness();
    const animationFinished = createDeferred<void>();
    vi.spyOn(harness.popup, "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });
    harness.open = false;
    harness.lifecycle.applyOpenState(false, { reason: "outside-press" });
    harness.lifecycle.destroy();

    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    animationFinished.resolve();
    await animationFinished.promise;
    await waitForMicrotasks();

    expect(harness.popup.parentElement).toBe(harness.originalParent);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(harness.positioner.destroy).toHaveBeenCalledTimes(1);
    expect(harness.closeRequests).toEqual([]);
    expect(harness.closeCompleteRequests).toEqual([]);
  });

  it("does not run the pending open frame after destroy", async () => {
    const createdPositioners = [createPositioner(), createPositioner()];
    const onOpenFrame = vi.fn();
    const harness = createHarness({
      createFloatingPositioner: () => createdPositioners.shift() ?? createPositioner(),
      onOpenFrame,
    });

    harness.open = true;
    harness.lifecycle.applyOpenState(true, { reason: "trigger-press", trigger: harness.trigger });

    const firstPositioner = harness.positioner;
    expect(firstPositioner.update).toHaveBeenCalledTimes(1);

    harness.lifecycle.destroy();
    await waitForAnimationFrame();

    expect(createdPositioners).toHaveLength(1);
    expect(firstPositioner.destroy).toHaveBeenCalledTimes(1);
    expect(firstPositioner.update).toHaveBeenCalledTimes(1);
    expect(onOpenFrame).not.toHaveBeenCalled();
  });

  it("uses the cancelable open-change shell before applying lifecycle state", () => {
    const harness = createHarness();
    const request = { reason: "trigger-press" as const, trigger: harness.trigger };
    const onOpenChange = vi.fn((_open, details) => details.cancel());

    const canceledResult = runFloatingListOpenChangeShell({
      controlled: false,
      lifecycle: harness.lifecycle,
      onCommitUncontrolledOpenState: ({ open }) => {
        harness.open = open;
      },
      onOpenChange,
      open: true,
      previousOpen: false,
      request,
      root: harness.root,
    });

    expect(canceledResult.status).toBe("canceled");
    expect(harness.open).toBe(false);
    expect(harness.renderedStates).toEqual([]);
    expect(harness.popup.parentElement).toBe(harness.originalParent);

    const appliedResult = runFloatingListOpenChangeShell({
      controlled: false,
      lifecycle: harness.lifecycle,
      onCommitUncontrolledOpenState: ({ open }) => {
        harness.open = open;
      },
      open: true,
      previousOpen: false,
      request,
      root: harness.root,
    });

    expect(appliedResult.status).toBe("applied");
    expect(harness.open).toBe(true);
    expect(harness.renderedStates).toEqual([true]);
    expect(harness.popup.parentElement).toBe(harness.portalTarget);
  });

  it("applies controlled open-change shell state without committing local open state", () => {
    const harness = createHarness();
    const request = { reason: "trigger-press" as const, trigger: harness.trigger };
    const onBeforeApplyOpenState = vi.fn();

    const result = runFloatingListOpenChangeShell({
      controlled: true,
      lifecycle: harness.lifecycle,
      onBeforeApplyOpenState,
      open: true,
      previousOpen: false,
      request,
      root: harness.root,
    });

    expect(result.status).toBe("applied");
    expect(harness.open).toBe(false);
    expect(onBeforeApplyOpenState).toHaveBeenCalledWith(
      expect.objectContaining({ open: true, request }),
    );
    expect(harness.renderedStates).toEqual([true]);
    expect(harness.popup.parentElement).toBe(harness.portalTarget);
  });
});

function createHarness({
  createFloatingPositioner,
  onOpenFrame,
  shouldUseFloating,
}: {
  createFloatingPositioner?: () => FloatingPositioner;
  onOpenFrame?: () => void;
  shouldUseFloating?: () => boolean;
} = {}) {
  const root = document.createElement("div");
  const trigger = document.createElement("button");
  const popup = document.createElement("div");
  const portalTarget = document.createElement("div");
  const originalParent = document.createElement("section");
  const closeCompleteRequests: TestRequest[] = [];
  const closeRequests: TestRequest[] = [];
  const renderedStates: boolean[] = [];
  const positionerFactory = createFloatingPositioner ?? (() => createPositioner());
  let currentPositioner: FloatingPositioner | null = null;
  let open = false;

  root.append(trigger, originalParent);
  originalParent.append(popup);
  document.body.append(root, portalTarget);

  const lifecycle = createFloatingListLifecycle<TestRequest>({
    dismissal: {
      closeOnEscape: () => true,
      closeOnOutsideInteract: () => true,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        closeRequests.push({ event, reason: "escape-key" });
      },
      onOutsidePointerDown: (event) => {
        closeRequests.push({ event, reason: "outside-press" });
      },
    },
    floating: {
      createPositioner: () => {
        currentPositioner = positionerFactory();
        return currentPositioner;
      },
      getReference: () => trigger,
      shouldUse: shouldUseFloating,
    },
    hooks: {
      onCloseComplete: ({ request }) => {
        if (request) closeCompleteRequests.push(request);
      },
      onOpenFrame,
    },
    popup,
    portal: {
      containsTarget: (target) => root.contains(target) || popup.contains(target),
      getTarget: () => portalTarget,
    },
    root,
    scrollLock: {
      lockDocumentScroll: lockTestDocumentScroll,
      shouldLock: () => true,
    },
    state: {
      getOpen: () => open,
      isDestroyed: () => false,
      render: (nextOpen) => {
        renderedStates.push(nextOpen);
        if (nextOpen) popup.hidden = false;
      },
    },
  });

  return {
    closeCompleteRequests,
    closeRequests,
    get open() {
      return open;
    },
    set open(value: boolean) {
      open = value;
    },
    lifecycle,
    originalParent,
    popup,
    portalTarget,
    get positioner() {
      if (!currentPositioner) {
        throw new Error("Harness floating positioner has not been created.");
      }

      return currentPositioner;
    },
    renderedStates,
    root,
    trigger,
  };
}

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

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForAnimationFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}

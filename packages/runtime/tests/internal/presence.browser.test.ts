import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hideElementAfterAnimations, showElement } from "../../src/internal/presence";

describe("presence", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("falls back to CSS animation duration values in seconds", async () => {
    vi.useFakeTimers();
    const element = renderElementWithAnimationDuration("0.2s");

    hideElementAfterAnimations(element);

    expect(element.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(199);
    expect(element.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(element.hidden).toBe(true);
  });

  it("falls back to CSS transition duration and delay values", async () => {
    vi.useFakeTimers();
    const element = renderElementWithTiming({
      transitionDelay: "50ms",
      transitionDuration: "150ms",
    });

    hideElementAfterAnimations(element);

    expect(element.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(199);
    expect(element.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(element.hidden).toBe(true);
  });

  it("uses the longest CSS animation or transition timing pair", async () => {
    vi.useFakeTimers();
    const element = renderElementWithTiming({
      animationDelay: "25ms, 100ms",
      animationDuration: "50ms, 100ms",
      transitionDelay: "0ms",
      transitionDuration: "75ms",
    });

    hideElementAfterAnimations(element);

    await vi.advanceTimersByTimeAsync(199);
    expect(element.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(element.hidden).toBe(true);
  });

  it("cancels a pending hide when the element is shown again", async () => {
    vi.useFakeTimers();
    const element = renderElementWithAnimationDuration("200ms");

    hideElementAfterAnimations(element);
    showElement(element);

    await vi.advanceTimersByTimeAsync(200);

    expect(element.hidden).toBe(false);
  });

  it("discovers animations immediately by default", () => {
    const element = document.createElement("div");
    const getAnimations = vi.fn(() => []);
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    document.body.append(element);

    hideElementAfterAnimations(element);

    expect(getAnimations).toHaveBeenCalledTimes(1);
    expect(element.hidden).toBe(true);
  });

  it("discovers only animations committed for the ending style on the next frame", async () => {
    const element = document.createElement("div");
    const closeAnimation = createDeferred();
    const onHidden = vi.fn();
    const getAnimations = vi.fn(() => {
      expect(element.hasAttribute("data-ending-style")).toBe(true);
      return [{ finished: closeAnimation.promise }] as unknown as Animation[];
    });
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    document.body.append(element);

    hideElementAfterAnimations(element, {
      animationDiscovery: "next-frame",
      onHidden,
    });

    expect(element.hasAttribute("data-ending-style")).toBe(true);
    expect(getAnimations).not.toHaveBeenCalled();

    await nextAnimationFrame();
    expect(getAnimations).toHaveBeenCalledTimes(1);
    expect(element.hidden).toBe(false);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(element.hidden).toBe(true);
    expect(onHidden).toHaveBeenCalledTimes(1);

    await nextAnimationFrame();
    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it("cancels staged animation discovery when the element is shown again", async () => {
    const element = document.createElement("div");
    const getAnimations = vi.fn(() => []);
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    document.body.append(element);

    hideElementAfterAnimations(element, { animationDiscovery: "next-frame" });
    showElement(element);

    await nextAnimationFrame();

    expect(getAnimations).not.toHaveBeenCalled();
    expect(element.hidden).toBe(false);
    expect(element.hasAttribute("data-ending-style")).toBe(false);
  });

  it("does not let a quick close wait for stale entry motion", async () => {
    const element = document.createElement("div");
    const entryAnimation = createDeferred();
    const closeAnimation = createDeferred();
    const getAnimations = vi.fn(() =>
      element.hasAttribute("data-ending-style")
        ? ([{ finished: closeAnimation.promise }] as unknown as Animation[])
        : ([{ finished: entryAnimation.promise }] as unknown as Animation[]),
    );
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    element.hidden = true;
    document.body.append(element);

    showElement(element, { startingStyleRelease: "after-paint" });
    hideElementAfterAnimations(element, { animationDiscovery: "next-frame" });

    await nextAnimationFrame();
    expect(getAnimations).toHaveBeenCalledTimes(1);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(element.hidden).toBe(true);
  });

  it("skips staged animation discovery after its signal is aborted", async () => {
    const element = document.createElement("div");
    const getAnimations = vi.fn(() => []);
    const onHidden = vi.fn();
    const abortController = new AbortController();
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    document.body.append(element);

    hideElementAfterAnimations(element, {
      animationDiscovery: "next-frame",
      signal: abortController.signal,
      onHidden,
    });
    abortController.abort();

    await nextAnimationFrame();

    expect(getAnimations).not.toHaveBeenCalled();
    expect(element.hidden).toBe(false);
    expect(onHidden).not.toHaveBeenCalled();
  });

  it("lets only the latest animation wait complete a replacement hide", async () => {
    const element = document.createElement("div");
    const firstAnimation = createDeferred();
    const secondAnimation = createDeferred();
    const firstHidden = vi.fn();
    const secondHidden = vi.fn();
    const getAnimations = vi
      .fn<() => Animation[]>()
      .mockReturnValueOnce([{ finished: firstAnimation.promise }] as unknown as Animation[])
      .mockReturnValueOnce([{ finished: secondAnimation.promise }] as unknown as Animation[]);
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    document.body.append(element);

    hideElementAfterAnimations(element, {
      animationDiscovery: "next-frame",
      onHidden: firstHidden,
    });
    await nextAnimationFrame();
    hideElementAfterAnimations(element, {
      animationDiscovery: "next-frame",
      onHidden: secondHidden,
    });
    await nextAnimationFrame();

    firstAnimation.resolve();
    await firstAnimation.promise;
    await waitForMicrotasks();

    expect(element.hidden).toBe(false);
    expect(firstHidden).not.toHaveBeenCalled();
    expect(secondHidden).not.toHaveBeenCalled();

    secondAnimation.resolve();
    await secondAnimation.promise;
    await waitForMicrotasks();

    expect(element.hidden).toBe(true);
    expect(firstHidden).not.toHaveBeenCalled();
    expect(secondHidden).toHaveBeenCalledTimes(1);
  });

  it("defers computed-style fallback discovery and completes zero motion once", async () => {
    const element = document.createElement("div");
    const onHidden = vi.fn();
    const getComputedStyle = vi.spyOn(window, "getComputedStyle");
    Object.defineProperty(element, "getAnimations", {
      configurable: true,
      value: undefined,
    });
    document.body.append(element);

    hideElementAfterAnimations(element, {
      animationDiscovery: "next-frame",
      onHidden,
    });

    expect(getComputedStyle).not.toHaveBeenCalled();
    expect(element.hidden).toBe(false);

    await nextAnimationFrame();

    expect(getComputedStyle).toHaveBeenCalledTimes(1);
    expect(element.hidden).toBe(true);
    expect(onHidden).toHaveBeenCalledTimes(1);
    getComputedStyle.mockRestore();
  });

  it("keeps the starting style through one committed frame when requested", async () => {
    const element = renderElementWithAnimationDuration("200ms");
    element.hidden = true;

    showElement(element, { startingStyleRelease: "after-paint" });

    expect(element.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(false);
  });

  it("keeps the default starting style release on the next frame", async () => {
    const element = renderElementWithAnimationDuration("200ms");
    element.hidden = true;

    showElement(element);

    expect(element.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(false);
  });

  it("keeps the pending release when an open element is shown again", async () => {
    const element = renderElementWithAnimationDuration("200ms");
    element.hidden = true;

    showElement(element);
    showElement(element);

    expect(element.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(false);
  });

  it("does not let a stale release clear a newer starting style", async () => {
    const element = renderElementWithAnimationDuration("0ms");
    element.hidden = true;

    showElement(element, { startingStyleRelease: "after-paint" });
    await nextAnimationFrame();

    hideElementAfterAnimations(element);
    showElement(element, { startingStyleRelease: "after-paint" });

    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(false);
  });

  it("does not restore a starting style after the element closes", async () => {
    const element = renderElementWithAnimationDuration("0ms");
    element.hidden = true;

    showElement(element, { startingStyleRelease: "after-paint" });
    hideElementAfterAnimations(element);

    expect(element.hasAttribute("data-starting-style")).toBe(false);
    await nextAnimationFrame();
    await nextAnimationFrame();
    expect(element.hasAttribute("data-starting-style")).toBe(false);
  });

  it("toggles the Tailwind hidden utility with the hidden property", async () => {
    vi.useFakeTimers();
    renderHiddenUtilityStyle();
    const element = renderElementWithAnimationDuration("200ms");
    element.classList.add("hidden");
    element.hidden = true;

    showElement(element);

    expect(element.hidden).toBe(false);
    expect(element.classList.contains("hidden")).toBe(false);
    expect(getComputedStyle(element).display).not.toBe("none");

    hideElementAfterAnimations(element);

    await vi.advanceTimersByTimeAsync(200);

    expect(element.hidden).toBe(true);
    expect(element.classList.contains("hidden")).toBe(true);
  });
});

function renderElementWithAnimationDuration(animationDuration: string): HTMLElement {
  const element = document.createElement("div");
  element.style.animationDuration = animationDuration;
  Object.defineProperty(element, "getAnimations", {
    configurable: true,
    value: () => [],
  });
  document.body.append(element);
  return element;
}

function renderElementWithTiming(styles: Partial<CSSStyleDeclaration>): HTMLElement {
  const element = document.createElement("div");
  Object.assign(element.style, styles);
  Object.defineProperty(element, "getAnimations", {
    configurable: true,
    value: () => [],
  });
  document.body.append(element);
  return element;
}

function renderHiddenUtilityStyle(): void {
  const style = document.createElement("style");
  style.textContent = ".hidden { display: none !important; }";
  document.head.append(style);
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function createDeferred(): { promise: Promise<void>; resolve(): void } {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

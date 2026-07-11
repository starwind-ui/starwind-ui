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

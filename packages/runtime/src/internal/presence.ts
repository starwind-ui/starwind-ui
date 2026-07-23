export const PRESENCE_STARTING_ATTRIBUTE = "data-starting-style";
export const PRESENCE_ENDING_ATTRIBUTE = "data-ending-style";

type HideElementOptions = {
  signal?: AbortSignal;
  onHidden?: () => void;
};

type ShowElementOptions = {
  startingStyleRelease?: "next-frame" | "after-paint";
};

const presenceTokens = new WeakMap<HTMLElement, object>();

export function showElement(element: HTMLElement, options: ShowElementOptions = {}): void {
  const wasHidden = element.hidden;
  const token = {};

  presenceTokens.set(element, token);
  element.hidden = false;
  element.classList.remove("hidden");
  element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);

  if (wasHidden) {
    element.setAttribute(PRESENCE_STARTING_ATTRIBUTE, "");
    const releaseStartingStyle = () => {
      if (presenceTokens.get(element) !== token) return;

      element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
    };
    requestAnimationFrame(() => {
      if (options.startingStyleRelease === "after-paint") {
        requestAnimationFrame(releaseStartingStyle);
        return;
      }

      releaseStartingStyle();
    });
  }
}

export function hideElementAfterAnimations(
  element: HTMLElement,
  options: HideElementOptions = {},
): void {
  if (element.hidden) {
    element.classList.add("hidden");
    element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
    element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
    options.onHidden?.();
    return;
  }

  const token = {};
  presenceTokens.set(element, token);
  element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
  element.setAttribute(PRESENCE_ENDING_ATTRIBUTE, "");

  waitForElementAnimations(element, () => {
    if (options.signal?.aborted || presenceTokens.get(element) !== token) return;

    element.hidden = true;
    element.classList.add("hidden");
    element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
    options.onHidden?.();
  });
}

function waitForElementAnimations(element: HTMLElement, onComplete: () => void): void {
  const animations = getElementAnimations(element);
  if (animations.length > 0) {
    Promise.allSettled(animations.map((animation) => animation.finished)).then(onComplete);
    return;
  }

  const timeoutMs = getStyleAnimationTimeoutMs(element);
  if (timeoutMs > 0) {
    globalThis.setTimeout(onComplete, timeoutMs);
    return;
  }

  onComplete();
}

function getElementAnimations(element: HTMLElement): Animation[] {
  if (typeof element.getAnimations !== "function") return [];

  return element.getAnimations();
}

function getStyleAnimationTimeoutMs(element: HTMLElement): number {
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") return 0;

  const styles = window.getComputedStyle(element);
  return Math.max(
    getMaxTimePairMs(styles.animationDuration, styles.animationDelay),
    getMaxTimePairMs(styles.transitionDuration, styles.transitionDelay),
  );
}

function getMaxTimePairMs(durationsValue: string, delaysValue: string): number {
  const durations = parseTimeListMs(durationsValue);
  const delays = parseTimeListMs(delaysValue);
  const itemCount = Math.max(durations.length, delays.length);
  let max = 0;

  for (let index = 0; index < itemCount; index += 1) {
    const duration = durations[index % durations.length] ?? 0;
    const delay = delays[index % delays.length] ?? 0;
    max = Math.max(max, duration + delay);
  }

  return max;
}

function parseTimeListMs(value: string): number[] {
  const times = value
    .split(",")
    .map((part) => parseTimeMs(part.trim()))
    .filter((time) => Number.isFinite(time));

  return times.length > 0 ? times : [0];
}

function parseTimeMs(value: string): number {
  if (value.endsWith("ms")) return Number.parseFloat(value);
  if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
  return Number.parseFloat(value) || 0;
}

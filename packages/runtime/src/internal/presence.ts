export const PRESENCE_STARTING_ATTRIBUTE = "data-starting-style";
export const PRESENCE_ENDING_ATTRIBUTE = "data-ending-style";

type HideElementOptions = {
  animationDiscovery?: "immediate" | "next-frame";
  /**
   * Makes a closing element and all its descendants inert while its exit animation runs, so a
   * click reaches the content below it. The runtime removes only the `inert` it added, when the
   * element hides, opens again, or the close aborts. An `inert` the app sets or removes during
   * the exit stays as the app left it.
   */
  passThroughPointerWhileEnding?: boolean;
  /**
   * A placement wrapper, such as a positioner, that also becomes inert while the element closes.
   * Its box covers the popup, so it would catch the click otherwise.
   */
  pointerPassThroughWrapper?: HTMLElement | null;
  signal?: AbortSignal;
  onHidden?: () => void;
};

type ShowElementOptions = {
  startingStyleRelease?: "next-frame" | "after-paint";
};

const presenceTokens = new WeakMap<HTMLElement, object>();

/** An `inert` attribute the runtime added. The app takes it over when it writes `inert` itself. */
type InertClaim = { target: HTMLElement; observer: MutationObserver | null; released: boolean };

const endingInertClaims = new WeakMap<HTMLElement, InertClaim[]>();

function getPassThroughTargets(element: HTMLElement, wrapper?: HTMLElement | null): HTMLElement[] {
  if (!wrapper || wrapper === element) return [element];
  // Inert covers the whole subtree, so a wrapper around the popup is enough.
  if (wrapper.contains(element)) return [wrapper];
  return [element, wrapper];
}

function claimInert(target: HTMLElement): InertClaim | null {
  // The app made this element inert. It keeps that value, and the runtime owns nothing.
  if (target.hasAttribute("inert")) return null;

  target.setAttribute("inert", "");
  const claim: InertClaim = { target, observer: null, released: false };
  if (typeof MutationObserver === "function") {
    claim.observer = new MutationObserver(() => releaseInertClaim(claim));
    claim.observer.observe(target, { attributes: true, attributeFilter: ["inert"] });
  }
  return claim;
}

function releaseInertClaim(claim: InertClaim): void {
  claim.released = true;
  claim.observer?.disconnect();
  claim.observer = null;
}

function passThroughPointerWhileEnding(element: HTMLElement, wrapper?: HTMLElement | null): void {
  restoreEndingPointerPassThrough(element);
  const claims = getPassThroughTargets(element, wrapper)
    .map(claimInert)
    .filter((claim): claim is InertClaim => claim !== null);
  if (claims.length > 0) endingInertClaims.set(element, claims);
}

function restoreEndingPointerPassThrough(element: HTMLElement): void {
  const claims = endingInertClaims.get(element);
  if (!claims) return;

  endingInertClaims.delete(element);
  for (const claim of claims) {
    // Records not yet delivered still show an app write of `inert` during the exit.
    if (claim.observer && claim.observer.takeRecords().length > 0) releaseInertClaim(claim);
    if (claim.released) continue;

    releaseInertClaim(claim);
    claim.target.removeAttribute("inert");
  }
}

export function showElement(element: HTMLElement, options: ShowElementOptions = {}): void {
  const wasHidden = element.hidden;
  const isStarting = element.hasAttribute(PRESENCE_STARTING_ATTRIBUTE);

  element.hidden = false;
  element.classList.remove("hidden");
  element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
  restoreEndingPointerPassThrough(element);

  if (!wasHidden && isStarting) return;

  const token = {};
  presenceTokens.set(element, token);

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
    restoreEndingPointerPassThrough(element);
    options.onHidden?.();
    return;
  }

  const token = {};
  presenceTokens.set(element, token);
  element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
  element.setAttribute(PRESENCE_ENDING_ATTRIBUTE, "");
  if (options.passThroughPointerWhileEnding) {
    passThroughPointerWhileEnding(element, options.pointerPassThroughWrapper);
    options.signal?.addEventListener(
      "abort",
      () => {
        if (presenceTokens.get(element) === token) restoreEndingPointerPassThrough(element);
      },
      { once: true },
    );
  }

  const discoverAnimations = () => {
    if (options.signal?.aborted || presenceTokens.get(element) !== token) return;

    waitForElementAnimations(element, () => {
      if (options.signal?.aborted || presenceTokens.get(element) !== token) return;

      element.hidden = true;
      element.classList.add("hidden");
      element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
      restoreEndingPointerPassThrough(element);
      options.onHidden?.();
    });
  };

  if (options.animationDiscovery === "next-frame") {
    requestAnimationFrame(discoverAnimations);
  } else {
    discoverAnimations();
  }
}

function waitForElementAnimations(element: HTMLElement, onComplete: () => void): void {
  const animations = getElementAnimations(element);
  if (animations.length > 0) {
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(onComplete);
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

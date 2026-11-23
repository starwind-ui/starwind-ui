import type { Locator } from "playwright";

// Playwright retries a hidden wait, and an action on a moving element, on a backoff of up to one
// second. These helpers wait on animation frames and animation promises instead, so a check
// continues as soon as the page reaches the state. They prove the same states as the Playwright
// calls they replace.

/**
 * Same result as `locator.waitFor({ state: "hidden", timeout })`. Visible has the Playwright
 * meaning: connected, a nonempty box and no `visibility: hidden`.
 */
export async function waitHidden(locator: Locator, timeout = 5000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (await locator.isVisible()) {
    const remaining = deadline - Date.now();
    if (remaining <= 0)
      throw new Error(`Timeout ${timeout}ms exceeded waiting for ${locator} to be hidden`);
    const handle = await locator.elementHandle({ timeout: remaining }).catch(() => null);
    if (!handle) continue;
    // In-page code avoids named inner functions, because the TypeScript loader wraps them in a
    // helper that the page does not define.
    await handle
      .evaluate(async (element, limit) => {
        const end = performance.now() + limit;
        while (performance.now() < end && element.isConnected) {
          const box = element.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) return;
          if (getComputedStyle(element).visibility === "hidden") return;
          await new Promise(requestAnimationFrame);
        }
      }, remaining)
      .catch(() => {});
    await handle.dispose();
  }
}

/**
 * Waits until the element's finite animations end, so an action finds it stable at once. A stuck
 * `data-starting-style` or a paused finite animation fails after `timeout` with a clear message.
 */
export async function settleAnimations(locator: Locator, timeout = 3000): Promise<void> {
  const stuck = await locator.evaluate(async (element, limit) => {
    const end = performance.now() + limit;
    // An entering part holds `data-starting-style` for a frame, and its animation starts after
    // the attribute is removed.
    while (
      element.hasAttribute("data-starting-style") ||
      element.querySelector("[data-starting-style]")
    ) {
      if (performance.now() >= end) return "data-starting-style stayed on the element";
      await new Promise(requestAnimationFrame);
    }
    await new Promise(requestAnimationFrame);
    const finished = Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    ).then(() => "");
    const late = new Promise<string>((resolve) =>
      setTimeout(
        () => resolve("a finite animation did not finish"),
        Math.max(0, end - performance.now()),
      ),
    );
    return Promise.race([finished, late]);
  }, timeout);
  if (stuck) throw new Error(`settleAnimations: ${stuck} after ${timeout}ms on ${locator}`);
}

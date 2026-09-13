// Each step includes a completed highlight update. Synthetic pointer events do not
// emit the compatibility mouse events that React navigation handlers also use.
export async function runHighlightSweep({ items, flushUpdates, forceLayout, timeoutMs = 1000 }) {
  if (items.length === 0) throw new Error("Missing benchmark items");

  const points = items.map((item) => {
    const rect = item.getBoundingClientRect();
    return { clientX: rect.left + 8, clientY: rect.top + 8 };
  });
  const initiallyHighlighted = items.filter((item) => item.hasAttribute("data-highlighted"));
  if (initiallyHighlighted.length > 1) throw new Error("Multiple benchmark items are highlighted");
  let previousItem = initiallyHighlighted[0] ?? null;
  let previousPointerItem = null;
  let dispatchDurationMs = 0;
  let updateDurationMs = 0;
  let forcedLayoutDurationMs = 0;
  const start = performance.now();

  for (const [index, item] of items.entries()) {
    let stepDispatchDurationMs = 0;
    const updateStart = performance.now();
    let checkHighlight;
    let timeout;
    const observer = new MutationObserver(() => checkHighlight());
    const completed = new Promise((resolve, reject) => {
      checkHighlight = () => {
        if (!item.hasAttribute("data-highlighted")) return;
        if (previousItem && previousItem !== item && previousItem.hasAttribute("data-highlighted"))
          return;
        resolve();
      };
      timeout = setTimeout(() => {
        reject(
          new Error(
            !item.hasAttribute("data-highlighted")
              ? "Benchmark item did not become highlighted: " + item.textContent
              : "Previous benchmark item remained highlighted: " + previousItem?.textContent,
          ),
        );
      }, timeoutMs);
    });
    observer.observe(item, { attributes: true, attributeFilter: ["data-highlighted"] });
    if (previousItem && previousItem !== item) {
      observer.observe(previousItem, { attributes: true, attributeFilter: ["data-highlighted"] });
    }
    try {
      flushUpdates(() => {
        const dispatchStart = performance.now();
        const options = { bubbles: true, ...points[index], pointerType: "mouse" };
        if (previousPointerItem) {
          previousPointerItem.dispatchEvent(
            new PointerEvent("pointerout", { ...options, relatedTarget: item }),
          );
          previousPointerItem.dispatchEvent(
            new MouseEvent("mouseout", { ...options, relatedTarget: item }),
          );
        }
        item.dispatchEvent(
          new PointerEvent("pointerover", { ...options, relatedTarget: previousPointerItem }),
        );
        item.dispatchEvent(
          new MouseEvent("mouseover", { ...options, relatedTarget: previousPointerItem }),
        );
        item.dispatchEvent(new PointerEvent("pointermove", options));
        item.dispatchEvent(new MouseEvent("mousemove", options));
        stepDispatchDurationMs = performance.now() - dispatchStart;
      });
      checkHighlight();
      // State-machine actions and React commits can complete in a later task.
      // Wait for the same DOM endpoint without adding a fixed frame/timer delay.
      await completed;
    } finally {
      observer.disconnect();
      clearTimeout(timeout);
    }
    dispatchDurationMs += stepDispatchDurationMs;
    updateDurationMs += performance.now() - updateStart - stepDispatchDurationMs;

    const layoutStart = performance.now();
    forceLayout(item);
    forcedLayoutDurationMs += performance.now() - layoutStart;

    if (!item.hasAttribute("data-highlighted")) {
      throw new Error("Benchmark item did not become highlighted: " + item.textContent);
    }
    if (previousItem && previousItem !== item && previousItem.hasAttribute("data-highlighted")) {
      throw new Error("Previous benchmark item remained highlighted: " + previousItem.textContent);
    }
    previousItem = item;
    previousPointerItem = item;
  }

  return {
    dispatchDurationMs,
    durationMs: performance.now() - start,
    forcedLayoutDurationMs,
    updateDurationMs,
    verifiedItemCount: items.length,
  };
}
